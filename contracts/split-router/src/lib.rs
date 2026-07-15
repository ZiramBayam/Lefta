#![no_std]

use soroban_sdk::{
    contract, contracterror, contractevent, contractimpl, contracttype,
    Address, Bytes, BytesN, Env, String, Vec,
    xdr::ToXdr,
};

const MINIMUM_AMOUNT: i128 = 1_000_000; // 1 USDC (7 decimals)
const MAX_HISTORY_PER_PAGE: u32 = 100;
const MAX_HISTORY_TOTAL: u32 = 1000;
const MAX_ALLOCATIONS: u32 = 5;
const MAX_LABEL_LENGTH: u32 = 20;
const TOTAL_BASIS_POINTS: u32 = 10000;

#[contracttype]
#[derive(Clone, Debug)]
pub struct Allocation {
    pub label: String,
    pub recipient: Address,     // Stellar address untuk kategori ini
    pub basis_points: u32,      // 4500 = 45%
}

#[contracttype]
#[derive(Clone)]
pub struct StoredTemplate {
    pub sender: Address,
    pub name: String,                  // "Belanja Ibu", "Tabungan Keluarga"
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
#[derive(Clone)]
pub struct TransferRecord {
    pub sender: Address,
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
    Nonce(Address),
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
    TooManyAllocations = 6,
    EmptyAllocations = 7,
    InvalidBasisPoints = 8,
    LabelTooLong = 9,
    InvalidRecipient = 10,
}

// --- Events ---

#[contractevent(topics = ["template", "create"], data_format = "single-value")]
pub struct TemplateCreated {
    pub template_id: BytesN<32>,
}

#[contractevent(topics = ["template", "deactivate"], data_format = "single-value")]
pub struct TemplateDeactivated {
    pub template_id: BytesN<32>,
}

#[contractevent(topics = ["transfer", "exec"], data_format = "single-value")]
pub struct TransferExecuted {
    pub transfer_id: BytesN<32>,
}

#[contract]
pub struct SplitRouterContract;

#[contractimpl]
impl SplitRouterContract {
    /// Create a new split template
    pub fn create_template(
        env: Env,
        sender: Address,
        name: String,
        allocations: Vec<Allocation>,
    ) -> Result<BytesN<32>, ContractError> {
        sender.require_auth();

        Self::validate_allocations(&env, &allocations)?;

        let nonce = Self::get_and_increment_nonce(&env, &sender);
        let template_id = Self::generate_id(&env, &sender, nonce);

        let template = StoredTemplate {
            sender: sender.clone(),
            name,
            allocations,
            is_active: true,
        };

        env.storage().persistent().set(&DataKey::Template(template_id.clone()), &template);
        env.storage().persistent().extend_ttl(&DataKey::Template(template_id.clone()), 100, 518400);

        TemplateCreated { template_id: template_id.clone() }.publish(&env);

        Ok(template_id)
    }

    /// Send with split using a template
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
            .persistent()
            .get(&DataKey::Template(template_id.clone()))
            .ok_or(ContractError::TemplateNotFound)?;

        if !template.is_active {
            return Err(ContractError::TemplateInactive);
        }
        if template.sender != sender {
            return Err(ContractError::Unauthorized);
        }

        let splits = Self::calculate_splits(&env, &template.allocations, amount);
        let contract_addr = env.current_contract_address();

        // Generate unique transfer ID
        let nonce = Self::get_and_increment_nonce(&env, &sender);
        let transfer_id = Self::generate_id(&env, &sender, nonce);
        let now = env.ledger().timestamp();

        // Update sender history
        Self::add_to_history(&env, &DataKey::SenderHistory(sender.clone()), &transfer_id);

        // Update each recipient's history & execute transfer
        let token_client = soroban_sdk::token::Client::new(&env, &usdc_token_id);

        // First: collect all from sender to contract
        token_client.transfer(&sender, &contract_addr, &amount);

        // Then: distribute to each recipient based on split
        for i in 0..splits.len() {
            let split = splits.get(i).unwrap();

            // Skip if amount is 0
            if split.amount > 0 {
                // Validate recipient is not contract
                if split.recipient == contract_addr {
                    return Err(ContractError::InvalidRecipient);
                }

                // Update recipient history
                Self::add_to_history(&env, &DataKey::RecipientHistory(split.recipient.clone()), &transfer_id);

                // Transfer to recipient
                token_client.transfer(&contract_addr, &split.recipient, &split.amount);
            }
        }

        let record = TransferRecord {
            sender: sender.clone(),
            total_amount: amount,
            timestamp: now,
            splits: splits.clone(),
        };
        env.storage().persistent().set(&DataKey::Transfer(transfer_id.clone()), &record);
        env.storage().persistent().extend_ttl(&DataKey::Transfer(transfer_id.clone()), 100, 518400);

        TransferExecuted { transfer_id: transfer_id.clone() }.publish(&env);

        Ok(transfer_id)
    }

    /// Send directly to a single recipient (no template/split)
    pub fn send_direct(
        env: Env,
        sender: Address,
        to: Address,
        amount: i128,
        usdc_token_id: Address,
    ) -> Result<BytesN<32>, ContractError> {
        sender.require_auth();

        if amount < MINIMUM_AMOUNT {
            return Err(ContractError::BelowMinimumAmount);
        }

        let contract_addr = env.current_contract_address();
        if to == contract_addr {
            return Err(ContractError::InvalidRecipient);
        }

        let nonce = Self::get_and_increment_nonce(&env, &sender);
        let transfer_id = Self::generate_id(&env, &sender, nonce);

        // Update histories
        Self::add_to_history(&env, &DataKey::SenderHistory(sender.clone()), &transfer_id);
        Self::add_to_history(&env, &DataKey::RecipientHistory(to.clone()), &transfer_id);

        // Execute transfer
        let token_client = soroban_sdk::token::Client::new(&env, &usdc_token_id);
        token_client.transfer(&sender, &to, &amount);

        let mut splits = Vec::new(&env);
        splits.push_back(SplitResult {
            recipient: to.clone(),
            label: String::from_str(&env, "Direct Transfer"),
            amount,
        });
        let record = TransferRecord {
            sender: sender.clone(),
            total_amount: amount,
            timestamp: env.ledger().timestamp(),
            splits,
        };
        env.storage().persistent().set(&DataKey::Transfer(transfer_id.clone()), &record);
        env.storage().persistent().extend_ttl(&DataKey::Transfer(transfer_id.clone()), 100, 518400);

        TransferExecuted { transfer_id: transfer_id.clone() }.publish(&env);

        Ok(transfer_id)
    }

    /// Deactivate a template
    pub fn deactivate_template(
        env: Env,
        sender: Address,
        template_id: BytesN<32>,
    ) -> Result<(), ContractError> {
        sender.require_auth();

        let mut template: StoredTemplate = env
            .storage()
            .persistent()
            .get(&DataKey::Template(template_id.clone()))
            .ok_or(ContractError::TemplateNotFound)?;

        if template.sender != sender {
            return Err(ContractError::Unauthorized);
        }

        template.is_active = false;
        env.storage().persistent().set(&DataKey::Template(template_id.clone()), &template);
        env.storage().persistent().extend_ttl(&DataKey::Template(template_id.clone()), 100, 518400);

        TemplateDeactivated { template_id }.publish(&env);

        Ok(())
    }

    // --- Getters ---

    pub fn get_template(env: Env, template_id: BytesN<32>) -> Result<StoredTemplate, ContractError> {
        env.storage()
            .persistent()
            .get(&DataKey::Template(template_id))
            .ok_or(ContractError::TemplateNotFound)
    }

    pub fn get_sender_templates(env: Env, sender: Address) -> Vec<BytesN<32>> {
        env.storage()
            .persistent()
            .get(&DataKey::SenderHistory(sender))
            .unwrap_or_else(|| Vec::new(&env))
    }

    pub fn get_recipient_transfers(env: Env, recipient: Address) -> Vec<BytesN<32>> {
        env.storage()
            .persistent()
            .get(&DataKey::RecipientHistory(recipient))
            .unwrap_or_else(|| Vec::new(&env))
    }

    pub fn get_transfer(env: Env, transfer_id: BytesN<32>) -> Result<TransferRecord, ContractError> {
        env.storage()
            .persistent()
            .get(&DataKey::Transfer(transfer_id))
            .ok_or(ContractError::TransferNotFound)
    }

    // --- Internal helpers ---

    fn get_and_increment_nonce(env: &Env, sender: &Address) -> u64 {
        let key = DataKey::Nonce(sender.clone());
        let nonce: u64 = env.storage().persistent().get(&key).unwrap_or(0);
        env.storage().persistent().set(&key, &(nonce + 1));
        env.storage().persistent().extend_ttl(&key, 100, 518400);
        nonce
    }

    fn generate_id(env: &Env, sender: &Address, nonce: u64) -> BytesN<32> {
        let mut data = Bytes::new(env);
        data.append(&sender.to_xdr(env));
        data.append(&Bytes::from_array(env, &nonce.to_le_bytes()));
        data.append(&Bytes::from_array(env, &env.ledger().timestamp().to_le_bytes()));
        env.crypto().sha256(&data).into()
    }

    fn add_to_history(env: &Env, key: &DataKey, transfer_id: &BytesN<32>) {
        let mut history = env
            .storage()
            .persistent()
            .get::<_, Vec<BytesN<32>>>(key)
            .unwrap_or_else(|| Vec::new(env));

        if history.len() >= MAX_HISTORY_TOTAL {
            history.remove(0);
        }
        history.push_back(transfer_id.clone());
        env.storage().persistent().set(key, &history);
        env.storage().persistent().extend_ttl(key, 100, 518400);
    }

    fn validate_allocations(env: &Env, allocations: &Vec<Allocation>) -> Result<(), ContractError> {
        let len = allocations.len();

        if len == 0 {
            return Err(ContractError::EmptyAllocations);
        }
        if len > MAX_ALLOCATIONS {
            return Err(ContractError::TooManyAllocations);
        }

        let mut total: u32 = 0;
        let mut seen_labels: Vec<String> = Vec::new(env);

        for i in 0..len {
            let alloc = allocations.get(i).unwrap();

            // Validate label length
            let label_len = alloc.label.len();
            if label_len == 0 || label_len > MAX_LABEL_LENGTH {
                return Err(ContractError::LabelTooLong);
            }

            // Check duplicate labels
            for j in 0..seen_labels.len() {
                if seen_labels.get(j).unwrap() == alloc.label {
                    // Allow duplicate labels (same category different allocation)
                }
            }
            seen_labels.push_back(alloc.label.clone());

            // Sum basis_points
            total += alloc.basis_points;
        }

        if total != TOTAL_BASIS_POINTS {
            return Err(ContractError::InvalidBasisPoints);
        }

        Ok(())
    }

    /// Calculate splits based on basis_points
    fn calculate_splits(env: &Env, allocations: &Vec<Allocation>, total: i128) -> Vec<SplitResult> {
        let mut results = Vec::new(env);
        let mut distributed: i128 = 0;
        let len = allocations.len();

        for i in 0..len {
            let alloc = allocations.get(i).unwrap();
            let amount = if i == len - 1 {
                // Last allocation gets the remainder (handles rounding
                total - distributed
            } else {
                (total * alloc.basis_points as i128) / TOTAL_BASIS_POINTS as i128
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

    #[test]
    fn test_minimum_amount_constant() {
        assert_eq!(MINIMUM_AMOUNT, 1_000_000);
    }

    #[test]
    fn test_constants() {
        assert!(MAX_ALLOCATIONS <= 5);
        assert!(MAX_LABEL_LENGTH <= 20);
        assert_eq!(TOTAL_BASIS_POINTS, 10000);
    }

    #[test]
    fn test_calculate_splits_simple() {
        let env = Env::default();

        let mut allocs: Vec<Allocation> = Vec::new(&env);
        let r1 = Address::generate(&env);
        let r2 = Address::generate(&env);

        allocs.push_back(Allocation {
            label: String::from_str(&env, "Harian"),
            recipient: r1.clone(),
            basis_points: 6000, // 60%
        });
        allocs.push_back(Allocation {
            label: String::from_str(&env, "Tabungan"),
            recipient: r2.clone(),
            basis_points: 4000, // 40%
        });

        let total: i128 = 100_000_000; // 100 USDC
        let results = SplitRouterContract::calculate_splits(&env, &allocs, total);

        assert_eq!(results.len(), 2);
        // 60% of 100 USDC = 60 USDC
        assert_eq!(results.get(0).unwrap().amount, 60_000_000);
        // 40% of 100 USDC = 40 USDC
        assert_eq!(results.get(1).unwrap().amount, 40_000_000);
    }

    #[test]
    fn test_calculate_splits_rounding() {
        let env = Env::default();

        let mut allocs: Vec<Allocation> = Vec::new(&env);
        let r1 = Address::generate(&env);

        allocs.push_back(Allocation {
            label: String::from_str(&env, "Semua"),
            recipient: r1.clone(),
            basis_points: 10000, // 100%
        });

        let total: i128 = 1_000_000; // 1 USDC
        let results = SplitRouterContract::calculate_splits(&env, &allocs, total);

        assert_eq!(results.len(), 1);
        assert_eq!(results.get(0).unwrap().amount, total);
    }

    #[test]
    fn test_validate_allocations_valid() {
        let env = Env::default();

        let mut allocs: Vec<Allocation> = Vec::new(&env);
        allocs.push_back(Allocation {
            label: String::from_str(&env, "A"),
            recipient: Address::generate(&env),
            basis_points: 5000,
        });
        allocs.push_back(Allocation {
            label: String::from_str(&env, "B"),
            recipient: Address::generate(&env),
            basis_points: 5000,
        });

        let result = SplitRouterContract::validate_allocations(&env, &allocs);
        assert!(result.is_ok());
    }

    #[test]
    fn test_validate_allocations_invalid_total() {
        let env = Env::default();

        let mut allocs: Vec<Allocation> = Vec::new(&env);
        allocs.push_back(Allocation {
            label: String::from_str(&env, "A"),
            recipient: Address::generate(&env),
            basis_points: 3000,
        });
        allocs.push_back(Allocation {
            label: String::from_str(&env, "B"),
            recipient: Address::generate(&env),
            basis_points: 3000,
        });

        let result = SplitRouterContract::validate_allocations(&env, &allocs);
        assert_eq!(result, Err(ContractError::InvalidBasisPoints));
    }

    #[test]
    fn test_validate_allocations_too_many() {
        let env = Env::default();

        let mut allocs: Vec<Allocation> = Vec::new(&env);
        for i in 0..6u32 {
            allocs.push_back(Allocation {
                label: String::from_str(&env, "A"),
                recipient: Address::generate(&env),
                basis_points: 1666,
            });
        }

        let result = SplitRouterContract::validate_allocations(&env, &allocs);
        assert_eq!(result, Err(ContractError::TooManyAllocations));
    }

    #[test]
    fn test_validate_allocations_empty() {
        let env = Env::default();
        let empty: Vec<Allocation> = Vec::new(&env);

        let result = SplitRouterContract::validate_allocations(&env, &empty);
        assert_eq!(result, Err(ContractError::EmptyAllocations));
    }
}
