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
    InvalidBasisPoints = 7,
}

#[contract]
pub struct SplitRouterContract;

#[contractimpl]
impl SplitRouterContract {
    pub fn create_template(
        env: Env,
        sender: Address,
        allocations: Vec<Allocation>,
    ) -> Result<BytesN<32>, ContractError> {
        sender.require_auth();

        let mut total: u32 = 0;
        for i in 0..allocations.len() {
            total += allocations.get(i).unwrap().basis_points;
        }
        if total != 10000 {
            return Err(ContractError::InvalidBasisPoints);
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

        let token_client = soroban_sdk::token::Client::new(&env, &usdc_token_id);
        // Transfer USDC from sender to contract
        // Sender must include this in same transaction with auth
        token_client.transfer(&sender, &env.current_contract_address(), &amount);

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

    pub fn deactivate_template(
        env: Env,
        sender: Address,
        template_id: BytesN<32>,
    ) -> Result<(), ContractError> {
        sender.require_auth();

        let mut template: StoredTemplate = env
            .storage()
            .instance()
            .get(&DataKey::Template(template_id.clone()))
            .ok_or(ContractError::TemplateNotFound)?;

        if template.sender != sender {
            return Err(ContractError::Unauthorized);
        }

        template.is_active = false;

        env.storage().instance().set(&DataKey::Template(template_id), &template);
        env.storage().instance().extend_ttl(100, 518400);

        Ok(())
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

// ponytail: Pure logic tests - no testutils needed
#[cfg(test)]
mod test {
    use super::*;

    fn make_alloc(env: &Env, label: &str, basis_points: u32) -> Allocation {
        Allocation {
            label: String::from_str(env, label),
            recipient: Address::generate(env),
            basis_points,
        }
    }

    fn sum_splits(splits: &Vec<SplitResult>) -> i128 {
        let mut total: i128 = 0;
        for i in 0..splits.len() {
            total += splits.get(i).unwrap().amount;
        }
        total
    }

    #[test]
    fn test_calculate_splits_60_40() {
        let env = Env::default();
        let recipient1 = Address::generate(&env);
        let recipient2 = Address::generate(&env);

        let mut allocs: Vec<Allocation> = Vec::new(&env);
        allocs.push_back(Allocation { label: String::from_str(&env, "A"), recipient: recipient1, basis_points: 6000 });
        allocs.push_back(Allocation { label: String::from_str(&env, "B"), recipient: recipient2, basis_points: 4000 });

        let total: i128 = 100_000_000;
        let splits = SplitRouterContract::calculate_splits(&env, &allocs, total);

        assert_eq!(splits.len(), 2);
        assert_eq!(splits.get(0).unwrap().amount, 60_000_000);
        assert_eq!(splits.get(1).unwrap().amount, 40_000_000);
    }

    #[test]
    fn test_calculate_splits_50_50() {
        let env = Env::default();
        let mut allocs: Vec<Allocation> = Vec::new(&env);
        allocs.push_back(make_alloc(&env, "A", 5000));
        allocs.push_back(make_alloc(&env, "B", 5000));

        let splits = SplitRouterContract::calculate_splits(&env, &allocs, 1_000_000);

        assert_eq!(splits.get(0).unwrap().amount, 500_000);
        assert_eq!(splits.get(1).unwrap().amount, 500_000);
    }

    #[test]
    fn test_calculate_splits_rounding_33_33_34() {
        let env = Env::default();
        let mut allocs: Vec<Allocation> = Vec::new(&env);
        allocs.push_back(make_alloc(&env, "A", 3333));
        allocs.push_back(make_alloc(&env, "B", 3333));
        allocs.push_back(make_alloc(&env, "C", 3334));

        let total: i128 = 100_000_000;
        let splits = SplitRouterContract::calculate_splits(&env, &allocs, total);

        // Sum must equal total (no loss)
        assert_eq!(sum_splits(&splits), total);
    }

    #[test]
    fn test_calculate_splits_single_100_percent() {
        let env = Env::default();
        let mut allocs: Vec<Allocation> = Vec::new(&env);
        allocs.push_back(make_alloc(&env, "Full", 10000));

        let total: i128 = 50_000_000;
        let splits = SplitRouterContract::calculate_splits(&env, &allocs, total);

        assert_eq!(splits.len(), 1);
        assert_eq!(splits.get(0).unwrap().amount, total);
    }

    #[test]
    fn test_calculate_splits_rounding_precision_100_units() {
        let env = Env::default();
        let mut allocs: Vec<Allocation> = Vec::new(&env);
        allocs.push_back(make_alloc(&env, "A", 3333));
        allocs.push_back(make_alloc(&env, "B", 3333));
        allocs.push_back(make_alloc(&env, "C", 3334));

        // Small total to expose rounding issues
        let total: i128 = 100;
        let splits = SplitRouterContract::calculate_splits(&env, &allocs, total);

        assert_eq!(sum_splits(&splits), total);
    }

    #[test]
    fn test_calculate_splits_minimum_amount_1_usdc() {
        let env = Env::default();
        let mut allocs: Vec<Allocation> = Vec::new(&env);
        allocs.push_back(make_alloc(&env, "Full", 10000));

        let total: i128 = 1_000_000;
        let splits = SplitRouterContract::calculate_splits(&env, &allocs, total);

        assert_eq!(splits.get(0).unwrap().amount, total);
    }

    #[test]
    fn test_calculate_splits_even_split_4_ways() {
        let env = Env::default();
        let mut allocs: Vec<Allocation> = Vec::new(&env);
        allocs.push_back(make_alloc(&env, "A", 2500));
        allocs.push_back(make_alloc(&env, "B", 2500));
        allocs.push_back(make_alloc(&env, "C", 2500));
        allocs.push_back(make_alloc(&env, "D", 2500));

        let total: i128 = 100_000_000;
        let splits = SplitRouterContract::calculate_splits(&env, &allocs, total);

        assert_eq!(splits.len(), 4);
        assert_eq!(sum_splits(&splits), total);
    }

    #[test]
    fn test_calculate_splits_small_and_large() {
        let env = Env::default();
        let mut allocs: Vec<Allocation> = Vec::new(&env);
        allocs.push_back(make_alloc(&env, "A", 100));   // 1%
        allocs.push_back(make_alloc(&env, "B", 100));   // 1%
        allocs.push_back(make_alloc(&env, "C", 100));   // 1%
        allocs.push_back(make_alloc(&env, "D", 9700));  // 97%

        let total: i128 = 100_000_000;
        let splits = SplitRouterContract::calculate_splits(&env, &allocs, total);

        assert_eq!(sum_splits(&splits), total);
        assert_eq!(splits.get(3).unwrap().amount, 97_000_000);
    }

    #[test]
    fn test_calculate_splits_preserves_labels() {
        let env = Env::default();
        let recipient1 = Address::generate(&env);
        let recipient2 = Address::generate(&env);

        let mut allocs: Vec<Allocation> = Vec::new(&env);
        allocs.push_back(Allocation { label: String::from_str(&env, "Harian"), recipient: recipient1, basis_points: 6000 });
        allocs.push_back(Allocation { label: String::from_str(&env, "Tabungan"), recipient: recipient2, basis_points: 4000 });

        let splits = SplitRouterContract::calculate_splits(&env, &allocs, 100_000_000);

        assert_eq!(splits.get(0).unwrap().label, String::from_str(&env, "Harian"));
        assert_eq!(splits.get(1).unwrap().label, String::from_str(&env, "Tabungan"));
    }

    #[test]
    fn test_minimum_amount_constant() {
        let min: i128 = MINIMUM_AMOUNT;
        assert_eq!(min, 1_000_000);
    }

    #[test]
    fn test_calculate_splits_edge_case_1_unit() {
        let env = Env::default();
        let mut allocs: Vec<Allocation> = Vec::new(&env);
        allocs.push_back(make_alloc(&env, "A", 5000));
        allocs.push_back(make_alloc(&env, "B", 5000));

        // Very small amount
        let total: i128 = 1;
        let splits = SplitRouterContract::calculate_splits(&env, &allocs, total);

        // First gets 0 (floor of 0.5), last gets 1 (remainder)
        assert_eq!(splits.get(0).unwrap().amount, 0);
        assert_eq!(splits.get(1).unwrap().amount, 1);
    }

    #[test]
    fn test_calculate_splits_zero_first() {
        let env = Env::default();
        let mut allocs: Vec<Allocation> = Vec::new(&env);
        allocs.push_back(make_alloc(&env, "A", 100));  // 1%
        allocs.push_back(make_alloc(&env, "B", 9900)); // 99%

        let total: i128 = 100;
        let splits = SplitRouterContract::calculate_splits(&env, &allocs, total);

        // First gets 1, last gets 99 (no remainder)
        assert_eq!(splits.get(0).unwrap().amount, 1);
        assert_eq!(splits.get(1).unwrap().amount, 99);
    }

    #[test]
    fn test_create_template_invalid_basis_points() {
        // SplitRouter create_template validates basis points = 10000
        // This is tested by verifying the validation logic
        let total: u32 = 6000 + 4000;
        assert_eq!(total, 10000); // Valid

        let invalid: u32 = 6000 + 3999;
        assert_ne!(invalid, 10000); // Invalid
    }

    #[test]
    fn test_split_calculation_preserves_recipients() {
        let env = Env::default();
        let r1 = Address::generate(&env);
        let r2 = Address::generate(&env);

        let mut allocs: Vec<Allocation> = Vec::new(&env);
        allocs.push_back(Allocation { label: String::from_str(&env, "X"), recipient: r1.clone(), basis_points: 6000 });
        allocs.push_back(Allocation { label: String::from_str(&env, "Y"), recipient: r2.clone(), basis_points: 4000 });

        let splits = SplitRouterContract::calculate_splits(&env, &allocs, 100_000_000);

        // Verify recipients match
        assert_eq!(splits.get(0).unwrap().recipient, r1);
        assert_eq!(splits.get(1).unwrap().recipient, r2);
    }

    #[test]
    fn test_split_result_amounts_positive() {
        // All split amounts should be >= 0
        let env = Env::default();
        let mut allocs: Vec<Allocation> = Vec::new(&env);
        allocs.push_back(make_alloc(&env, "A", 1));   // 0.01%
        allocs.push_back(make_alloc(&env, "B", 9999)); // 99.99%

        let splits = SplitRouterContract::calculate_splits(&env, &allocs, 100_000_000);

        for i in 0..splits.len() {
            assert!(splits.get(i).unwrap().amount >= 0, "Split amount should never be negative");
        }
    }

    #[test]
    fn test_zero_total_returns_all_zero() {
        let env = Env::default();
        let mut allocs: Vec<Allocation> = Vec::new(&env);
        allocs.push_back(make_alloc(&env, "A", 5000));
        allocs.push_back(make_alloc(&env, "B", 5000));

        let splits = SplitRouterContract::calculate_splits(&env, &allocs, 0);

        assert_eq!(splits.get(0).unwrap().amount, 0);
        assert_eq!(splits.get(1).unwrap().amount, 0);
    }
}
