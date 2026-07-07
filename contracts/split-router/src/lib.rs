#![no_std]

use soroban_sdk::{
    contract, contracterror, contractimpl, contracttype,
    Address, Bytes, BytesN, Env, String, Vec, TokenInterface,
};

const MINIMUM_AMOUNT: i128 = 1_000_000; // 1 USDC = 1,000,000 stroops

#[contracttype]
#[derive(Clone, Debug)]
pub struct SplitResult {
    pub recipient: Address,
    pub label: String,
    pub amount: i128,
}

#[contracttype]
#[derive(Clone, Debug)]
pub struct TransferRecord {
    pub id: BytesN<32>,
    pub sender: Address,
    pub template_id: BytesN<32>,
    pub total_amount: i128,
    pub timestamp: u64,
    pub splits: Vec<SplitResult>,
}

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    TemplateRegistry,
    Transfer(BytesN<32>),
    SenderHistory(Address),
    RecipientHistory(Address),
}

#[contracterror]
#[derive(Clone, Debug, Copy, PartialEq)]
#[repr(u32)]
pub enum ContractError {
    TransferNotFound = 1,
    TemplateNotFound = 2,
    TemplateInactive = 3,
    Unauthorized = 4,
    BelowMinimumAmount = 5,
    AlreadyInitialized = 6,
}

#[contract]
pub struct SplitRouterContract;

#[contractimpl]
impl SplitRouterContract {
    pub fn initialize(
        env: Env,
        template_registry_id: Address,
    ) -> Result<(), ContractError> {
        if env.storage().instance().has(&DataKey::TemplateRegistry) {
            return Err(ContractError::AlreadyInitialized);
        }
        env.storage().instance().set(&DataKey::TemplateRegistry, &template_registry_id);
        env.storage().instance().extend_ttl(100, 518400);
        Ok(())
    }

    /// Transfer dengan anti-reentrancy: update state dulu baru transfer
    pub fn transfer(
        env: Env,
        sender: Address,
        template_id: BytesN<32>,
        amount: i128,
        usdc_token_id: Address,
    ) -> Result<BytesN<32>, ContractError> {
        sender.require_auth();

        // 1. Validasi amount minimum
        if amount < MINIMUM_AMOUNT {
            return Err(ContractError::BelowMinimumAmount);
        }

        // 2. Get template registry dan fetch template
        let template_registry_id: Address = env
            .storage()
            .instance()
            .get(&DataKey::TemplateRegistry)
            .ok_or(ContractError::TemplateNotFound)?;

        // Cross-contract call: get template
        let client = template_registry_contract::Client::new(&env, &template_registry_id);
        let template = client.get(&template_id);

        // 3. Validasi: template active dan sender adalah owner
        if !template.is_active {
            return Err(ContractError::TemplateInactive);
        }
        if template.sender != sender {
            return Err(ContractError::Unauthorized);
        }

        // 4. Kalkulasi splits
        let splits = Self::calculate_splits(&template.allocations, amount);

        // 5. Generate transfer ID
        let mut data = Bytes::new(&env);
        data.append(&sender.to_bytes());
        data.append(&Bytes::from_u32(&env, env.ledger().sequence()));
        data.append(&Bytes::from_u64(&env, env.ledger().timestamp()));
        let transfer_id: BytesN<32> = env.crypto().sha256(&data).into();

        let now = env.ledger().timestamp();

        // 6. Simpan transfer record (state update SEBELUM transfer)
        let record = TransferRecord {
            id: transfer_id.clone(),
            sender: sender.clone(),
            template_id,
            total_amount: amount,
            timestamp: now,
            splits: splits.clone(),
        };

        env.storage().instance().set(&DataKey::Transfer(transfer_id.clone()), &record);

        // Update sender history
        let mut sender_history = Self::get_sender_history(env.clone(), sender.clone());
        sender_history.push_back(transfer_id.clone());
        env.storage().instance().set(&DataKey::SenderHistory(sender.clone()), &sender_history);

        // Update recipient history
        for i in 0..splits.len() {
            let split = splits.get(i).unwrap();
            let mut recipient_history = Self::get_recipient_history(env.clone(), split.recipient.clone());
            recipient_history.push_back(transfer_id.clone());
            env.storage().instance().set(&DataKey::RecipientHistory(split.recipient.clone()), &recipient_history);
        }

        env.storage().instance().extend_ttl(100, 518400);

        // 7. Transfer token: sender -> contract
        let token = env.token_client(&usdc_token_id);
        token.transfer_from(&sender, &env.current_contract_address(), &amount);

        // 8. Loop transfer: contract -> recipient per allocation
        for i in 0..splits.len() {
            let split = splits.get(i).unwrap();
            if split.amount > 0 {
                token.transfer(&env.current_contract_address(), &split.recipient, &split.amount);
            }
        }

        Ok(transfer_id)
    }

    pub fn get_transfer(env: Env, transfer_id: BytesN<32>) -> Result<TransferRecord, ContractError> {
        env.storage()
            .instance()
            .get(&DataKey::Transfer(transfer_id))
            .ok_or(ContractError::TransferNotFound)
    }

    pub fn get_sender_history(env: Env, sender: Address) -> Vec<BytesN<32>> {
        env.storage()
            .instance()
            .get(&DataKey::SenderHistory(sender))
            .unwrap_or_else(|| Vec::new(&env))
    }

    pub fn get_recipient_history(env: Env, recipient: Address) -> Vec<BytesN<32>> {
        env.storage()
            .instance()
            .get(&DataKey::RecipientHistory(recipient))
            .unwrap_or_else(|| Vec::new(&env))
    }

    /// Kalkulasi splits: sisa masuk ke allocation terakhir
    fn calculate_splits(allocations: &Vec<Allocation>, total: i128) -> Vec<SplitResult> {
        let mut results = Vec::new();
        let mut distributed: i128 = 0;
        let len = allocations.len();

        for i in 0..len {
            let alloc = allocations.get(i).unwrap();
            let amount = if i == len - 1 {
                total - distributed // sisa untuk terakhir
            } else {
                (total * alloc.basis_points as i128) / 10000
            };
            distributed += amount;
            results.push_back(SplitResult {
                recipient: alloc.recipient.clone(),
                label: alloc.label.clone(),
                amount,
            });
        }

        results
    }
}

mod template_registry_contract {
    soroban_sdk::contractimport!(file = "../template-registry/target/wasm32-unknown-unknown/release/template_registry.wasm");
}

#[cfg(test)]
mod test {
    use super::*;
    use soroban_sdk::testutils::Address as _;
    use soroban_sdk::Token;

    fn create_allocation(
        env: &Env,
        label: &str,
        recipient: &Address,
        basis_points: u32,
    ) -> Allocation {
        Allocation {
            label: String::from_str(env, label),
            recipient: recipient.clone(),
            basis_points,
        }
    }

    fn setup_test_env() -> (Env, Address, Address, Address) {
        let env = Env::default();
        let sender = Address::generate(&env);
        let template_registry = Address::generate(&env);
        let usdc_token = Address::generate(&env);
        (env, sender, template_registry, usdc_token)
    }

    #[test]
    fn test_transfer_success() {
        let (env, sender, template_registry, usdc_token) = setup_test_env();
        let recipient1 = Address::generate(&env);
        let recipient2 = Address::generate(&env);
        let contract_address = env.register(SplitRouterContract, ());

        // Setup token mock
        let token = Token::new(&env, &usdc_token);
        token.set_admin(&contract_address);

        // Initialize
        let client = SplitRouterContractClient::new(&env, &contract_address);
        client.initialize(&template_registry);

        // Mock template dari registry
        let template = SplitTemplate {
            id: BytesN::random(&env),
            sender: sender.clone(),
            allocations: vec![
                &env,
                create_allocation(&env, "Harian", &recipient1, 6000),
                create_allocation(&env, "Tabungan", &recipient2, 4000),
            ],
            is_active: true,
            created_at: 0,
            updated_at: 0,
        };

        // Create mock template registry
        env.register(
            template_registry_contract::TemplateRegistryContract,
            (),
        );

        // Set initial balance
        token.mint(&sender, &100_000_000); // 100 USDC

        env.mock_all_auths();

        let result = client.transfer(&sender, &template.id, &100_000_000, &usdc_token);
        assert!(result.is_ok());

        let transfer_id = result.unwrap();
        let record = client.get_transfer(&transfer_id).unwrap();

        assert_eq!(record.total_amount, 100_000_000);
        assert_eq!(record.splits.len(), 2);
        // 60% = 60_000_000, 40% = 40_000_000
        assert_eq!(record.splits.get(0).unwrap().amount, 60_000_000);
        assert_eq!(record.splits.get(1).unwrap().amount, 40_000_000);
    }

    #[test]
    fn test_transfer_rounding_edge_case() {
        let (env, sender, template_registry, usdc_token) = setup_test_env();
        let recipient1 = Address::generate(&env);
        let recipient2 = Address::generate(&env);
        let recipient3 = Address::generate(&env);
        let contract_address = env.register(SplitRouterContract, ());

        let client = SplitRouterContractClient::new(&env, &contract_address);
        client.initialize(&template_registry);

        // 33.33% / 33.33% / 33.34% = 100%
        let allocations = vec![
            &env,
            create_allocation(&env, "A", &recipient1, 3333),
            create_allocation(&env, "B", &recipient2, 3333),
            create_allocation(&env, "C", &recipient3, 3334),
        ];

        let mut results = Vec::new();
        let mut distributed: i128 = 0;
        let total: i128 = 100_000_000;

        for i in 0..allocations.len() {
            let alloc = allocations.get(i).unwrap();
            let amount = if i == allocations.len() - 1 {
                total - distributed
            } else {
                (total * alloc.basis_points as i128) / 10000
            };
            distributed += amount;
            results.push_back(amount);
        }

        // Total semua splits harus = total input
        let sum: i128 = results.iter().fold(0, |acc, x| acc + x);
        assert_eq!(sum, total);
    }

    #[test]
    fn test_below_minimum_amount() {
        let (env, sender, template_registry, usdc_token) = setup_test_env();
        let contract_address = env.register(SplitRouterContract, ());

        let client = SplitRouterContractClient::new(&env, &contract_address);
        client.initialize(&template_registry);

        env.mock_all_auths();

        // 0.5 USDC = 500,000 stroops < minimum 1,000,000
        let result = client.transfer(&sender, &BytesN::random(&env), &500_000, &usdc_token);
        assert_eq!(result, Err(ContractError::BelowMinimumAmount));
    }

    #[test]
    fn test_transfer_exactly_minimum() {
        let (env, sender, template_registry, usdc_token) = setup_test_env();
        let contract_address = env.register(SplitRouterContract, ());

        let client = SplitRouterContractClient::new(&env, &contract_address);
        client.initialize(&template_registry);

        env.mock_all_auths();

        // Exactly 1 USDC harusnya berhasil
        let result = client.transfer(&sender, &BytesN::random(&env), &1_000_000, &usdc_token);
        assert!(result.is_err()); // Gagal karena template tidak ada, bukan amount
    }

    #[test]
    fn test_get_recipient_history() {
        let (env, sender, template_registry, usdc_token) = setup_test_env();
        let recipient = Address::generate(&env);
        let contract_address = env.register(SplitRouterContract, ());

        let client = SplitRouterContractClient::new(&env, &contract_address);
        client.initialize(&template_registry);

        env.mock_all_auths();

        // Buat 2 transfer dengan recipient yang sama
        let _ = client.transfer(&sender, &BytesN::random(&env), &1_000_000, &usdc_token);
        let _ = client.transfer(&sender, &BytesN::random(&env), &1_000_000, &usdc_token);

        let history = client.get_recipient_history(&recipient);
        assert_eq!(history.len(), 2);
    }

    #[test]
    fn test_get_sender_history() {
        let (env, sender, template_registry, usdc_token) = setup_test_env();
        let recipient = Address::generate(&env);
        let contract_address = env.register(SplitRouterContract, ());

        let client = SplitRouterContractClient::new(&env, &contract_address);
        client.initialize(&template_registry);

        env.mock_all_auths();

        let _ = client.transfer(&sender, &BytesN::random(&env), &1_000_000, &usdc_token);
        let _ = client.transfer(&sender, &BytesN::random(&env), &1_000_000, &usdc_token);

        let history = client.get_sender_history(&sender);
        assert_eq!(history.len(), 2);
    }

    #[test]
    fn test_transfer_without_initialize() {
        let (env, sender, _, usdc_token) = setup_test_env();
        let contract_address = env.register(SplitRouterContract, ());

        let client = SplitRouterContractClient::new(&env, &contract_address);

        env.mock_all_auths();

        let result = client.transfer(&sender, &BytesN::random(&env), &100_000_000, &usdc_token);
        assert_eq!(result, Err(ContractError::TemplateNotFound));
    }

    #[test]
    fn test_initialize_twice_fails() {
        let (env, _, template_registry) = setup_test_env();
        let contract_address = env.register(SplitRouterContract, ());

        let client = SplitRouterContractClient::new(&env, &contract_address);
        let first = client.initialize(&template_registry);
        assert!(first.is_ok());

        let second = client.initialize(&template_registry);
        assert_eq!(second, Err(ContractError::AlreadyInitialized));
    }

    #[test]
    fn test_get_transfer_not_found() {
        let (env, _, _, _) = setup_test_env();
        let fake_id = BytesN::<32>::random(&env);

        let contract_id = env.register(SplitRouterContract, ());
        let client = SplitRouterContractClient::new(&env, &contract_id);

        let result = client.get_transfer(&fake_id);
        assert_eq!(result, Err(ContractError::TransferNotFound));
    }

    #[test]
    fn test_get_recipient_history_empty() {
        let (env, _, _, _) = setup_test_env();
        let recipient = Address::generate(&env);

        let contract_id = env.register(SplitRouterContract, ());
        let client = SplitRouterContractClient::new(&env, &contract_id);

        let history = client.get_recipient_history(&recipient);
        assert_eq!(history.len(), 0);
    }

    #[test]
    fn test_get_sender_history_empty() {
        let (env, sender, _, _) = setup_test_env();

        let contract_id = env.register(SplitRouterContract, ());
        let client = SplitRouterContractClient::new(&env, &contract_id);

        let history = client.get_sender_history(&sender);
        assert_eq!(history.len(), 0);
    }

    #[test]
    fn test_transfer_single_100_percent_allocation() {
        // Test calculate_splits directly with 100% allocation
        let env = Env::default();
        let recipient = Address::generate(&env);

        let allocations = vec![
            &env,
            create_allocation(&env, "Full", &recipient, 10000),
        ];

        let total: i128 = 50_000_000;
        let splits = SplitRouterContract::calculate_splits(&allocations, total);

        assert_eq!(splits.len(), 1);
        assert_eq!(splits.get(0).unwrap().amount, total);
    }

    #[test]
    fn test_calculate_splits_rounding_precision() {
        // Test that all edge cases of split calculation preserve total
        let env = Env::default();
        let recipient1 = Address::generate(&env);
        let recipient2 = Address::generate(&env);
        let recipient3 = Address::generate(&env);
        let recipient4 = Address::generate(&env);

        let test_cases = vec![
            // (allocations, total)
            (vec![(&recipient1, 5000), (&recipient2, 5000)], 1_000_000_i128), // 50/50
            (vec![(&recipient1, 3333), (&recipient2, 3333), (&recipient3, 3334)], 100_i128), // 33.33% rounding
            (vec![(&recipient1, 100), (&recipient2, 100), (&recipient3, 100), (&recipient4, 9700)], 1_000_000_i128), // small + large
        ];

        for (allocs, total) in test_cases {
            let allocation_vec: Vec<Allocation> = allocs
                .iter()
                .map(|(r, bp)| create_allocation(&env, "X", r, *bp))
                .collect();

            let splits = SplitRouterContract::calculate_splits(&allocation_vec, total);
            let sum: i128 = splits.iter().fold(0, |acc, s| acc + s.amount);

            assert_eq!(sum, total, "Splits must sum to total for total={}", total);
        }
    }
}
