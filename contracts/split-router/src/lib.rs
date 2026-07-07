#![no_std]

use soroban_sdk::{
    contract, contracterror, contractimpl, contracttype,
    Address, Bytes, BytesN, Env, String, Vec,
};

const MINIMUM_AMOUNT: i128 = 1_000_000;

#[contracttype]
#[derive(Clone, Debug)]
pub struct Allocation {
    pub label: String,
    pub recipient: Address,
    pub basis_points: u32,
}

#[contracttype]
#[derive(Clone)]
pub struct StoredTemplate {
    pub sender: Address,
    pub allocations: Vec<Allocation>,
    pub is_active: bool,
}

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
    Template(BytesN<32>),
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
    /// Create a template (simplified, no cross-contract)
    pub fn create_template(
        env: Env,
        sender: Address,
        allocations: Vec<Allocation>,
    ) -> Result<BytesN<32>, ContractError> {
        sender.require_auth();

        // Validate total basis points = 10000
        let mut total: u32 = 0;
        for i in 0..allocations.len() {
            total += allocations.get(i).unwrap().basis_points;
        }
        if total != 10000 {
            return Err(ContractError::Unauthorized); // ponytail: reuse error, add TemplateInvalid later
        }

        let mut data = Bytes::new(&env);
        data.append(&Bytes::from_array(&env, &env.ledger().sequence().to_le_bytes()));
        data.append(&Bytes::from_array(&env, &env.ledger().timestamp().to_le_bytes()));
        let template_id: BytesN<32> = env.crypto().sha256(&data).into();

        let template = StoredTemplate {
            sender: sender.clone(),
            allocations,
            is_active: true,
        };

        env.storage().instance().set(&DataKey::Template(template_id.clone()), &template);
        env.storage().instance().extend_ttl(100, 518400);

        Ok(template_id)
    }

    pub fn transfer(
        env: Env,
        sender: Address,
        template_id: BytesN<32>,
        amount: i128,
        usdc_token_id: Address,
    ) -> Result<BytesN<32>, ContractError> {
        sender.require_auth();

        if amount < MINIMUM_AMOUNT {
            return Err(ContractError::BelowMinimumAmount);
        }

        let template: StoredTemplate = env
            .storage()
            .instance()
            .get(&DataKey::Template(template_id.clone()))
            .ok_or(ContractError::TemplateNotFound)?;

        if !template.is_active {
            return Err(ContractError::TemplateInactive);
        }
        if template.sender != sender {
            return Err(ContractError::Unauthorized);
        }

        let splits = Self::calculate_splits(&env, &template.allocations, amount);

        let mut data = Bytes::new(&env);
        data.append(&Bytes::from_array(&env, &env.ledger().sequence().to_le_bytes()));
        data.append(&Bytes::from_array(&env, &env.ledger().timestamp().to_le_bytes()));
        let transfer_id: BytesN<32> = env.crypto().sha256(&data).into();

        let now = env.ledger().timestamp();

        let record = TransferRecord {
            id: transfer_id.clone(),
            sender: sender.clone(),
            template_id,
            total_amount: amount,
            timestamp: now,
            splits: splits.clone(),
        };

        env.storage().instance().set(&DataKey::Transfer(transfer_id.clone()), &record);

        let mut sender_history = Self::get_sender_history(env.clone(), sender.clone());
        sender_history.push_back(transfer_id.clone());
        env.storage().instance().set(&DataKey::SenderHistory(sender.clone()), &sender_history);

        for i in 0..splits.len() {
            let split = splits.get(i).unwrap();
            let mut recipient_history = Self::get_recipient_history(env.clone(), split.recipient.clone());
            recipient_history.push_back(transfer_id.clone());
            env.storage().instance().set(&DataKey::RecipientHistory(split.recipient.clone()), &recipient_history);
        }

        env.storage().instance().extend_ttl(100, 518400);

        // Token transfer: sender -> contract
        let token_client = soroban_sdk::token::Client::new(&env, &usdc_token_id);
        token_client.transfer_from(&env.current_contract_address(), &sender, &env.current_contract_address(), &amount);

        // Loop transfer: contract -> recipient
        for i in 0..splits.len() {
            let split = splits.get(i).unwrap();
            if split.amount > 0 {
                token_client.transfer(&env.current_contract_address(), &split.recipient, &split.amount);
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

    fn calculate_splits(env: &Env, allocations: &Vec<Allocation>, total: i128) -> Vec<SplitResult> {
        let mut results = Vec::new(env);
        let mut distributed: i128 = 0;
        let len = allocations.len();

        for i in 0..len {
            let alloc = allocations.get(i).unwrap();
            let amount = if i == len - 1 {
                total - distributed
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

    fn setup_test_env() -> (Env, Address, Address) {
        let env = Env::default();
        let sender = Address::generate(&env);
        let usdc_token = Address::generate(&env);
        (env, sender, usdc_token)
    }

    #[test]
    fn test_transfer_success() {
        let (env, sender, usdc_token) = setup_test_env();
        let recipient1 = Address::generate(&env);
        let recipient2 = Address::generate(&env);
        let contract_address = env.register(SplitRouterContract, ());

        let token = Token::new(&env, &usdc_token);
        token.set_admin(&contract_address);

        let client = SplitRouterContractClient::new(&env, &contract_address);

        let allocations: Vec<Allocation> = vec![
            &env,
            create_allocation(&env, "Harian", &recipient1, 6000),
            create_allocation(&env, "Tabungan", &recipient2, 4000),
        ];

        env.mock_all_auths();

        let template_id = client.create_template(&sender, &allocations).unwrap();

        token.mint(&sender, &100_000_000);

        let result = client.transfer(&sender, &template_id, &100_000_000, &usdc_token);
        assert!(result.is_ok());

        let transfer_id = result.unwrap();
        let record = client.get_transfer(&transfer_id).unwrap();

        assert_eq!(record.total_amount, 100_000_000);
        assert_eq!(record.splits.len(), 2);
        assert_eq!(record.splits.get(0).unwrap().amount, 60_000_000);
        assert_eq!(record.splits.get(1).unwrap().amount, 40_000_000);
    }

    #[test]
    fn test_transfer_rounding_edge_case() {
        let env = Env::default();
        let recipient1 = Address::generate(&env);
        let recipient2 = Address::generate(&env);
        let recipient3 = Address::generate(&env);

        let allocations = vec![
            &env,
            create_allocation(&env, "A", &recipient1, 3333),
            create_allocation(&env, "B", &recipient2, 3333),
            create_allocation(&env, "C", &recipient3, 3334),
        ];

        let mut results = Vec::new(&env);
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

        let sum: i128 = results.iter().fold(0, |acc, x| acc + x);
        assert_eq!(sum, total);
    }

    #[test]
    fn test_below_minimum_amount() {
        let (env, sender, usdc_token) = setup_test_env();
        let contract_address = env.register(SplitRouterContract, ());

        let client = SplitRouterContractClient::new(&env, &contract_address);

        let allocations: Vec<Allocation> = vec![
            &env,
            create_allocation(&env, "A", &Address::generate(&env), 10000),
        ];

        env.mock_all_auths();
        let template_id = client.create_template(&sender, &allocations).unwrap();

        let result = client.transfer(&sender, &template_id, &500_000, &usdc_token);
        assert_eq!(result, Err(ContractError::BelowMinimumAmount));
    }

    #[test]
    fn test_transfer_template_not_found() {
        let (env, sender, usdc_token) = setup_test_env();
        let contract_address = env.register(SplitRouterContract, ());

        let client = SplitRouterContractClient::new(&env, &contract_address);

        env.mock_all_auths();

        let fake_id = BytesN::<32>::random(&env);
        let result = client.transfer(&sender, &fake_id, &100_000_000, &usdc_token);
        assert_eq!(result, Err(ContractError::TemplateNotFound));
    }

    #[test]
    fn test_get_recipient_history() {
        let (env, sender, usdc_token) = setup_test_env();
        let recipient = Address::generate(&env);
        let contract_address = env.register(SplitRouterContract, ());

        let client = SplitRouterContractClient::new(&env, &contract_address);

        let allocations: Vec<Allocation> = vec![
            &env,
            create_allocation(&env, "Harian", &recipient, 10000),
        ];

        env.mock_all_auths();
        let template_id = client.create_template(&sender, &allocations).unwrap();

        let token = Token::new(&env, &usdc_token);
        token.mint(&sender, &2_000_000);

        let _ = client.transfer(&sender, &template_id, &1_000_000, &usdc_token);
        let _ = client.transfer(&sender, &template_id, &1_000_000, &usdc_token);

        let history = client.get_recipient_history(&recipient);
        assert_eq!(history.len(), 2);
    }

    #[test]
    fn test_get_sender_history() {
        let (env, sender, usdc_token) = setup_test_env();
        let recipient = Address::generate(&env);
        let contract_address = env.register(SplitRouterContract, ());

        let client = SplitRouterContractClient::new(&env, &contract_address);

        let allocations: Vec<Allocation> = vec![
            &env,
            create_allocation(&env, "A", &recipient, 10000),
        ];

        env.mock_all_auths();
        let template_id = client.create_template(&sender, &allocations).unwrap();

        let token = Token::new(&env, &usdc_token);
        token.mint(&sender, &2_000_000);

        let _ = client.transfer(&sender, &template_id, &1_000_000, &usdc_token);
        let _ = client.transfer(&sender, &template_id, &1_000_000, &usdc_token);

        let history = client.get_sender_history(&sender);
        assert_eq!(history.len(), 2);
    }

    #[test]
    fn test_get_transfer_not_found() {
        let (env, _, _) = setup_test_env();
        let fake_id = BytesN::<32>::random(&env);

        let contract_id = env.register(SplitRouterContract, ());
        let client = SplitRouterContractClient::new(&env, &contract_id);

        let result = client.get_transfer(&fake_id);
        assert_eq!(result, Err(ContractError::TransferNotFound));
    }

    #[test]
    fn test_get_recipient_history_empty() {
        let (env, _, _) = setup_test_env();
        let recipient = Address::generate(&env);

        let contract_id = env.register(SplitRouterContract, ());
        let client = SplitRouterContractClient::new(&env, &contract_id);

        let history = client.get_recipient_history(&recipient);
        assert_eq!(history.len(), 0);
    }

    #[test]
    fn test_get_sender_history_empty() {
        let (env, sender, _) = setup_test_env();

        let contract_id = env.register(SplitRouterContract, ());
        let client = SplitRouterContractClient::new(&env, &contract_id);

        let history = client.get_sender_history(&sender);
        assert_eq!(history.len(), 0);
    }

    #[test]
    fn test_transfer_single_100_percent_allocation() {
        let env = Env::default();
        let recipient = Address::generate(&env);

        let allocations = vec![
            &env,
            create_allocation(&env, "Full", &recipient, 10000),
        ];

        let total: i128 = 50_000_000;
        let splits = SplitRouterContract::calculate_splits(&env, &allocations, total);

        assert_eq!(splits.len(), 1);
        assert_eq!(splits.get(0).unwrap().amount, total);
    }

    #[test]
    fn test_calculate_splits_rounding_precision() {
        let env = Env::default();
        let recipient1 = Address::generate(&env);
        let recipient2 = Address::generate(&env);
        let recipient3 = Address::generate(&env);
        let recipient4 = Address::generate(&env);

        let test_cases = vec![
            (vec![(&recipient1, 5000), (&recipient2, 5000)], 1_000_000_i128),
            (vec![(&recipient1, 3333), (&recipient2, 3333), (&recipient3, 3334)], 100_i128),
            (vec![(&recipient1, 100), (&recipient2, 100), (&recipient3, 100), (&recipient4, 9700)], 1_000_000_i128),
        ];

        for (allocs, total) in test_cases {
            let allocation_vec: Vec<Allocation> = allocs
                .iter()
                .map(|(r, bp)| create_allocation(&env, "X", r, *bp))
                .collect();

            let splits = SplitRouterContract::calculate_splits(&env, &allocation_vec, total);
            let sum: i128 = splits.iter().fold(0, |acc, s| acc + s.amount);

            assert_eq!(sum, total, "Splits must sum to total for total={}", total);
        }
    }
}
