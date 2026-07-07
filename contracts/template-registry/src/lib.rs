#![no_std]

use soroban_sdk::{
    contract, contracterror, contractimpl, contracttype,
    Address, Bytes, BytesN, Env, String, Vec,
};

const MAX_LABEL_LENGTH: u32 = 20;
const MAX_ALLOCATIONS: u32 = 5;
const TOTAL_BASIS_POINTS: u32 = 10000;

#[contracttype]
#[derive(Clone, Debug)]
pub struct Allocation {
    pub label: String,
    pub recipient: Address,
    pub basis_points: u32,
}

#[contracttype]
#[derive(Clone)]
pub struct SplitTemplate {
    pub id: BytesN<32>,
    pub sender: Address,
    pub allocations: Vec<Allocation>,
    pub is_active: bool,
    pub created_at: u64,
    pub updated_at: u64,
}

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    Template(BytesN<32>),
    SenderTemplates(Address),
}

#[contracterror]
#[derive(Clone, Debug, Copy, PartialEq)]
#[repr(u32)]
pub enum ContractError {
    TemplateNotFound = 1,
    Unauthorized = 2,
    InvalidBasisPoints = 3,
    TooManyAllocations = 4,
    EmptyAllocations = 5,
    LabelTooLong = 6,
    TemplateInactive = 7,
    DuplicateRecipient = 8,
}

#[contract]
pub struct TemplateRegistryContract;

#[contractimpl]
impl TemplateRegistryContract {
    pub fn create_template(
        env: Env,
        sender: Address,
        allocations: Vec<Allocation>,
    ) -> Result<BytesN<32>, ContractError> {
        sender.require_auth();

        Self::validate_allocations(&env, &allocations)?;

        let mut data = Bytes::new(&env);
        data.append(&Bytes::from_array(&env, &env.ledger().sequence().to_le_bytes()));
        data.append(&Bytes::from_array(&env, &env.ledger().timestamp().to_le_bytes()));
        let template_id: BytesN<32> = env.crypto().sha256(&data).into();

        let now = env.ledger().timestamp();

        let template = SplitTemplate {
            id: template_id.clone(),
            sender: sender.clone(),
            allocations: allocations.clone(),
            is_active: true,
            created_at: now,
            updated_at: now,
        };

        env.storage().instance().set(&DataKey::Template(template_id.clone()), &template);

        let mut sender_templates = Self::get_sender_templates(env.clone(), sender.clone());
        sender_templates.push_back(template_id.clone());
        env.storage()
            .instance()
            .set(&DataKey::SenderTemplates(sender), &sender_templates);

        env.storage().instance().extend_ttl(100, 518400);

        Ok(template_id)
    }

    pub fn update_template(
        env: Env,
        sender: Address,
        template_id: BytesN<32>,
        allocations: Vec<Allocation>,
    ) -> Result<(), ContractError> {
        sender.require_auth();

        let template: SplitTemplate = env
            .storage()
            .instance()
            .get(&DataKey::Template(template_id.clone()))
            .ok_or(ContractError::TemplateNotFound)?;

        if template.sender != sender {
            return Err(ContractError::Unauthorized);
        }

        if !template.is_active {
            return Err(ContractError::TemplateInactive);
        }

        Self::validate_allocations(&env, &allocations)?;

        let updated_template = SplitTemplate {
            id: template_id.clone(),
            sender: template.sender,
            allocations,
            is_active: true,
            created_at: template.created_at,
            updated_at: env.ledger().timestamp(),
        };

        env.storage()
            .instance()
            .set(&DataKey::Template(template_id), &updated_template);

        env.storage().instance().extend_ttl(100, 518400);

        Ok(())
    }

    pub fn deactivate_template(
        env: Env,
        sender: Address,
        template_id: BytesN<32>,
    ) -> Result<(), ContractError> {
        sender.require_auth();

        let mut template: SplitTemplate = env
            .storage()
            .instance()
            .get(&DataKey::Template(template_id.clone()))
            .ok_or(ContractError::TemplateNotFound)?;

        if template.sender != sender {
            return Err(ContractError::Unauthorized);
        }

        template.is_active = false;
        template.updated_at = env.ledger().timestamp();

        env.storage()
            .instance()
            .set(&DataKey::Template(template_id), &template);

        env.storage().instance().extend_ttl(100, 518400);

        Ok(())
    }

    pub fn get_template(env: Env, template_id: BytesN<32>) -> Result<SplitTemplate, ContractError> {
        env.storage()
            .instance()
            .get(&DataKey::Template(template_id))
            .ok_or(ContractError::TemplateNotFound)
    }

    pub fn get_sender_templates(env: Env, sender: Address) -> Vec<BytesN<32>> {
        env.storage()
            .instance()
            .get(&DataKey::SenderTemplates(sender))
            .unwrap_or_else(|| Vec::new(&env))
    }

    pub fn is_active(env: Env, template_id: BytesN<32>) -> bool {
        match env.storage().instance().get::<_, SplitTemplate>(&DataKey::Template(template_id)) {
            Some(template) => template.is_active,
            None => false,
        }
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
        let mut seen_recipients: Vec<Address> = Vec::new(env);

        for i in 0..len {
            let alloc = allocations.get(i).unwrap();

            if alloc.label.len() > MAX_LABEL_LENGTH {
                return Err(ContractError::LabelTooLong);
            }

            total += alloc.basis_points;

            for j in 0..seen_recipients.len() {
                if seen_recipients.get(j).unwrap() == alloc.recipient {
                    return Err(ContractError::DuplicateRecipient);
                }
            }
            seen_recipients.push_back(alloc.recipient.clone());
        }

        if total != TOTAL_BASIS_POINTS {
            return Err(ContractError::InvalidBasisPoints);
        }

        Ok(())
    }
}

// ponytail: Pure logic tests - no testutils needed
#[cfg(test)]
mod test {
    use super::*;

    fn create_allocation(label: &str, basis_points: u32) -> Allocation {
        let env = Env::default();
        Allocation {
            label: String::from_str(&env, label),
            recipient: Address::generate(&env),
            basis_points,
        }
    }

    #[test]
    fn test_validate_empty_allocations() {
        let env = Env::default();
        let empty: Vec<Allocation> = Vec::new(&env);
        let result = TemplateRegistryContract::validate_allocations(&env, &empty);
        assert_eq!(result, Err(ContractError::EmptyAllocations));
    }

    #[test]
    fn test_validate_too_many_allocations() {
        let env = Env::default();
        let mut allocs: Vec<Allocation> = Vec::new(&env);
        for i in 0..6 {
            allocs.push_back(Allocation {
                label: String::from_str(&env, &format!("Pos{}", i)),
                recipient: Address::generate(&env),
                basis_points: 1666,
            });
        }
        let result = TemplateRegistryContract::validate_allocations(&env, &allocs);
        assert_eq!(result, Err(ContractError::TooManyAllocations));
    }

    #[test]
    fn test_validate_invalid_basis_points_9999() {
        let env = Env::default();
        let allocs: Vec<Allocation> = vec![
            &env,
            create_allocation("A", 6000),
            create_allocation("B", 3999),
        ];
        let result = TemplateRegistryContract::validate_allocations(&env, &allocs);
        assert_eq!(result, Err(ContractError::InvalidBasisPoints));
    }

    #[test]
    fn test_validate_invalid_basis_points_10001() {
        let env = Env::default();
        let allocs: Vec<Allocation> = vec![
            &env,
            create_allocation("A", 6000),
            create_allocation("B", 4001),
        ];
        let result = TemplateRegistryContract::validate_allocations(&env, &allocs);
        assert_eq!(result, Err(ContractError::InvalidBasisPoints));
    }

    #[test]
    fn test_validate_invalid_basis_points_5000() {
        let env = Env::default();
        let allocs: Vec<Allocation> = vec![
            &env,
            create_allocation("A", 5000),
            create_allocation("B", 5000),
        ];
        let result = TemplateRegistryContract::validate_allocations(&env, &allocs);
        assert_eq!(result, Err(ContractError::InvalidBasisPoints));
    }

    #[test]
    fn test_validate_valid_10000() {
        let env = Env::default();
        let allocs: Vec<Allocation> = vec![
            &env,
            create_allocation("A", 6000),
            create_allocation("B", 4000),
        ];
        let result = TemplateRegistryContract::validate_allocations(&env, &allocs);
        assert!(result.is_ok());
    }

    #[test]
    fn test_validate_duplicate_recipient() {
        let env = Env::default();
        let recipient = Address::generate(&env);
        let allocs: Vec<Allocation> = vec![
            &env,
            Allocation {
                label: String::from_str(&env, "A"),
                recipient: recipient.clone(),
                basis_points: 5000,
            },
            Allocation {
                label: String::from_str(&env, "B"),
                recipient,
                basis_points: 5000,
            },
        ];
        let result = TemplateRegistryContract::validate_allocations(&env, &allocs);
        assert_eq!(result, Err(ContractError::DuplicateRecipient));
    }

    #[test]
    fn test_validate_label_too_long() {
        let env = Env::default();
        let allocs: Vec<Allocation> = vec![
            &env,
            Allocation {
                label: String::from_str(&env, "IniLabelYangSangatPanjangSekali"),
                recipient: Address::generate(&env),
                basis_points: 10000,
            },
        ];
        let result = TemplateRegistryContract::validate_allocations(&env, &allocs);
        assert_eq!(result, Err(ContractError::LabelTooLong));
    }

    #[test]
    fn test_validate_label_boundary_20_chars() {
        let env = Env::default();
        let allocs: Vec<Allocation> = vec![
            &env,
            Allocation {
                label: String::from_str(&env, "12345678901234567890"), // exactly 20
                recipient: Address::generate(&env),
                basis_points: 10000,
            },
        ];
        let result = TemplateRegistryContract::validate_allocations(&env, &allocs);
        assert!(result.is_ok());
    }

    #[test]
    fn test_validate_label_boundary_1_char() {
        let env = Env::default();
        let allocs: Vec<Allocation> = vec![
            &env,
            Allocation {
                label: String::from_str(&env, "A"),
                recipient: Address::generate(&env),
                basis_points: 10000,
            },
        ];
        let result = TemplateRegistryContract::validate_allocations(&env, &allocs);
        assert!(result.is_ok());
    }

    #[test]
    fn test_validate_max_allocations_5() {
        let env = Env::default();
        let mut allocs: Vec<Allocation> = Vec::new(&env);
        for i in 0..5 {
            allocs.push_back(Allocation {
                label: String::from_str(&env, &format!("Pos{}", i)),
                recipient: Address::generate(&env),
                basis_points: 2000,
            });
        }
        let result = TemplateRegistryContract::validate_allocations(&env, &allocs);
        assert!(result.is_ok());
    }

    #[test]
    fn test_validate_single_allocation_100_percent() {
        let env = Env::default();
        let allocs: Vec<Allocation> = vec![
            &env,
            create_allocation("Full", 10000),
        ];
        let result = TemplateRegistryContract::validate_allocations(&env, &allocs);
        assert!(result.is_ok());
    }

    #[test]
    fn test_validate_duplicate_recipient_not_next() {
        // Duplicate not adjacent - should still catch
        let env = Env::default();
        let recipient = Address::generate(&env);
        let other = Address::generate(&env);
        let allocs: Vec<Allocation> = vec![
            &env,
            Allocation {
                label: String::from_str(&env, "A"),
                recipient: other.clone(),
                basis_points: 3000,
            },
            Allocation {
                label: String::from_str(&env, "B"),
                recipient: recipient.clone(),
                basis_points: 4000,
            },
            Allocation {
                label: String::from_str(&env, "C"),
                recipient,
                basis_points: 3000,
            },
        ];
        let result = TemplateRegistryContract::validate_allocations(&env, &allocs);
        assert_eq!(result, Err(ContractError::DuplicateRecipient));
    }

    #[test]
    fn test_validate_all_unique_recipients() {
        // Different recipients should pass
        let env = Env::default();
        let r1 = Address::generate(&env);
        let r2 = Address::generate(&env);
        let r3 = Address::generate(&env);
        let allocs: Vec<Allocation> = vec![
            &env,
            Allocation { label: String::from_str(&env, "A"), recipient: r1, basis_points: 3333 },
            Allocation { label: String::from_str(&env, "B"), recipient: r2, basis_points: 3333 },
            Allocation { label: String::from_str(&env, "C"), recipient: r3, basis_points: 3334 },
        ];
        let result = TemplateRegistryContract::validate_allocations(&env, &allocs);
        assert!(result.is_ok());
    }
}
