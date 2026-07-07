#![no_std]

use soroban_sdk::{
    contract, contracterror, contractimpl, contracttype,
    Address, Bytes, BytesN, Env, String, Vec,
};

const MAX_LABEL_LENGTH: u32 = 20;
const MAX_ALLOCATIONS: usize = 5;
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

        // Validate allocations
        Self::validate_allocations(&allocations)?;

        // Generate template ID: hash of (sender, ledger_seq, timestamp)
        let mut data = Bytes::new(&env);
        data.append(&sender.to_bytes());
        data.append(&Bytes::from_u32(&env, env.ledger().sequence()));
        data.append(&Bytes::from_u64(&env, env.ledger().timestamp()));
        let template_id = env.crypto().sha256(&data).into();

        let now = env.ledger().timestamp();

        let template = SplitTemplate {
            id: template_id.clone(),
            sender: sender.clone(),
            allocations: allocations.clone(),
            is_active: true,
            created_at: now,
            updated_at: now,
        };

        // Store template
        env.storage().instance().set(&DataKey::Template(template_id.clone()), &template);

        // Update sender's template list
        let mut sender_templates = Self::get_sender_templates(env.clone(), sender.clone());
        sender_templates.push_back(template_id.clone());
        env.storage()
            .instance()
            .set(&DataKey::SenderTemplates(sender), &sender_templates);

        // Extend TTL
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

        // Validate new allocations
        Self::validate_allocations(&allocations)?;

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

    fn validate_allocations(allocations: &Vec<Allocation>) -> Result<(), ContractError> {
        let len = allocations.len();

        if len == 0 {
            return Err(ContractError::EmptyAllocations);
        }

        if len > MAX_ALLOCATIONS {
            return Err(ContractError::TooManyAllocations);
        }

        // Check total basis points = 10000
        let mut total: u32 = 0;
        let mut seen_recipients: Vec<Address> = Vec::new(&env);

        for i in 0..len {
            let alloc = allocations.get(i).unwrap();

            // Check label length
            if alloc.label.len() > MAX_LABEL_LENGTH {
                return Err(ContractError::LabelTooLong);
            }

            total += alloc.basis_points;

            // Check duplicate recipients
            let mut recipient_clone = alloc.recipient.clone();
            let recipient_bytes = recipient_clone.to_bytes();
            for seen in seen_recipients.iter() {
                let mut seen_clone = seen.clone();
                if seen_clone.to_bytes() == recipient_bytes {
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

#[cfg(test)]
mod test {
    use super::*;
    use soroban_sdk::testutils::Address as _;

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

    fn setup_test_env() -> (Env, Address) {
        let env = Env::default();
        let sender = Address::generate(&env);
        (env, sender)
    }

    #[test]
    fn test_create_template_success() {
        let (env, sender) = setup_test_env();
        let recipient1 = Address::generate(&env);
        let recipient2 = Address::generate(&env);

        let allocations: Vec<Allocation> = vec![
            &env,
            create_allocation(&env, "Harian", &recipient1, 6000),
            create_allocation(&env, "Tabungan", &recipient2, 4000),
        ];

        let contract_id = env.register(TemplateRegistryContract, ());
        let client = TemplateRegistryContractClient::new(&env, &contract_id);

        env.mock_all_auths();

        let template_id = client.create_template(&sender, &allocations);
        assert!(template_id.is_ok());

        let template = client.get_template(&template_id.unwrap()).unwrap();
        assert_eq!(template.allocations.len(), 2);
        assert!(template.is_active);
    }

    #[test]
    fn test_create_template_invalid_basis_points_9999() {
        let (env, sender) = setup_test_env();
        let recipient1 = Address::generate(&env);
        let recipient2 = Address::generate(&env);

        let allocations: Vec<Allocation> = vec![
            &env,
            create_allocation(&env, "Harian", &recipient1, 6000),
            create_allocation(&env, "Tabungan", &recipient2, 3999), // Total = 9999
        ];

        let contract_id = env.register(TemplateRegistryContract, ());
        let client = TemplateRegistryContractClient::new(&env, &contract_id);

        env.mock_all_auths();

        let result = client.create_template(&sender, &allocations);
        assert_eq!(result, Err(ContractError::InvalidBasisPoints));
    }

    #[test]
    fn test_create_template_invalid_basis_points_10001() {
        let (env, sender) = setup_test_env();
        let recipient1 = Address::generate(&env);
        let recipient2 = Address::generate(&env);

        let allocations: Vec<Allocation> = vec![
            &env,
            create_allocation(&env, "Harian", &recipient1, 6000),
            create_allocation(&env, "Tabungan", &recipient2, 4001), // Total = 10001
        ];

        let contract_id = env.register(TemplateRegistryContract, ());
        let client = TemplateRegistryContractClient::new(&env, &contract_id);

        env.mock_all_auths();

        let result = client.create_template(&sender, &allocations);
        assert_eq!(result, Err(ContractError::InvalidBasisPoints));
    }

    #[test]
    fn test_create_template_too_many_allocations() {
        let (env, sender) = setup_test_env();

        // Create 6 allocations (more than MAX of 5)
        let mut allocations_vec: Vec<Allocation> = Vec::new(&env);
        for i in 0..6 {
            let recipient = Address::generate(&env);
            allocations_vec.push_back(create_allocation(&env, &format!("Pos{}", i), &recipient, 1666));
        }

        let contract_id = env.register(TemplateRegistryContract, ());
        let client = TemplateRegistryContractClient::new(&env, &contract_id);

        env.mock_all_auths();

        let result = client.create_template(&sender, &allocations_vec);
        assert_eq!(result, Err(ContractError::TooManyAllocations));
    }

    #[test]
    fn test_create_template_duplicate_recipient() {
        let (env, sender) = setup_test_env();
        let recipient = Address::generate(&env);

        let allocations: Vec<Allocation> = vec![
            &env,
            create_allocation(&env, "Harian", &recipient, 5000),
            create_allocation(&env, "Tabungan", &recipient, 5000), // Same recipient
        ];

        let contract_id = env.register(TemplateRegistryContract, ());
        let client = TemplateRegistryContractClient::new(&env, &contract_id);

        env.mock_all_auths();

        let result = client.create_template(&sender, &allocations);
        assert_eq!(result, Err(ContractError::DuplicateRecipient));
    }

    #[test]
    fn test_create_template_label_too_long() {
        let (env, sender) = setup_test_env();
        let recipient1 = Address::generate(&env);
        let recipient2 = Address::generate(&env);

        let allocations: Vec<Allocation> = vec![
            &env,
            create_allocation(&env, "IniLabelYangSangatPanjangSekali", &recipient1, 6000), // > 20 chars
            create_allocation(&env, "Tabungan", &recipient2, 4000),
        ];

        let contract_id = env.register(TemplateRegistryContract, ());
        let client = TemplateRegistryContractClient::new(&env, &contract_id);

        env.mock_all_auths();

        let result = client.create_template(&sender, &allocations);
        assert_eq!(result, Err(ContractError::LabelTooLong));
    }

    #[test]
    fn test_update_template_success() {
        let (env, sender) = setup_test_env();
        let recipient1 = Address::generate(&env);
        let recipient2 = Address::generate(&env);
        let recipient3 = Address::generate(&env);

        let initial_allocations: Vec<Allocation> = vec![
            &env,
            create_allocation(&env, "Harian", &recipient1, 6000),
            create_allocation(&env, "Tabungan", &recipient2, 4000),
        ];

        let new_allocations: Vec<Allocation> = vec![
            &env,
            create_allocation(&env, "Makan", &recipient1, 3000),
            create_allocation(&env, "Transport", &recipient2, 3000),
            create_allocation(&env, "Savings", &recipient3, 4000),
        ];

        let contract_id = env.register(TemplateRegistryContract, ());
        let client = TemplateRegistryContractClient::new(&env, &contract_id);

        env.mock_all_auths();

        let template_id = client.create_template(&sender, &initial_allocations).unwrap();
        let result = client.update_template(&sender, &template_id, &new_allocations);
        assert!(result.is_ok());

        let template = client.get_template(&template_id).unwrap();
        assert_eq!(template.allocations.len(), 3);
    }

    #[test]
    fn test_update_template_unauthorized() {
        let (env, sender) = setup_test_env();
        let other = Address::generate(&env);
        let recipient1 = Address::generate(&env);
        let recipient2 = Address::generate(&env);

        let allocations: Vec<Allocation> = vec![
            &env,
            create_allocation(&env, "Harian", &recipient1, 6000),
            create_allocation(&env, "Tabungan", &recipient2, 4000),
        ];

        let contract_id = env.register(TemplateRegistryContract, ());
        let client = TemplateRegistryContractClient::new(&env, &contract_id);

        env.mock_auths(&[]);

        let template_id = client.create_template(&sender, &allocations).unwrap();

        // Try to update with different sender
        let new_allocations: Vec<Allocation> = vec![
            &env,
            create_allocation(&env, "Harian", &recipient1, 5000),
            create_allocation(&env, "Tabungan", &recipient2, 5000),
        ];

        let result = client.update_template(&other, &template_id, &new_allocations);
        assert_eq!(result, Err(ContractError::Unauthorized));
    }

    #[test]
    fn test_update_template_not_found() {
        let (env, sender) = setup_test_env();
        let recipient1 = Address::generate(&env);
        let recipient2 = Address::generate(&env);

        let allocations: Vec<Allocation> = vec![
            &env,
            create_allocation(&env, "Harian", &recipient1, 6000),
            create_allocation(&env, "Tabungan", &recipient2, 4000),
        ];

        let contract_id = env.register(TemplateRegistryContract, ());
        let client = TemplateRegistryContractClient::new(&env, &contract_id);

        let fake_id = BytesN::<32>::random(&env);

        env.mock_all_auths();

        let result = client.update_template(&sender, &fake_id, &allocations);
        assert_eq!(result, Err(ContractError::TemplateNotFound));
    }

    #[test]
    fn test_deactivate_template_success() {
        let (env, sender) = setup_test_env();
        let recipient1 = Address::generate(&env);
        let recipient2 = Address::generate(&env);

        let allocations: Vec<Allocation> = vec![
            &env,
            create_allocation(&env, "Harian", &recipient1, 6000),
            create_allocation(&env, "Tabungan", &recipient2, 4000),
        ];

        let contract_id = env.register(TemplateRegistryContract, ());
        let client = TemplateRegistryContractClient::new(&env, &contract_id);

        env.mock_all_auths();

        let template_id = client.create_template(&sender, &allocations).unwrap();

        assert!(client.is_active(&template_id));

        let result = client.deactivate_template(&sender, &template_id);
        assert!(result.is_ok());

        assert!(!client.is_active(&template_id));
    }

    #[test]
    fn test_deactivate_template_unauthorized() {
        let (env, sender) = setup_test_env();
        let other = Address::generate(&env);
        let recipient1 = Address::generate(&env);
        let recipient2 = Address::generate(&env);

        let allocations: Vec<Allocation> = vec![
            &env,
            create_allocation(&env, "Harian", &recipient1, 6000),
            create_allocation(&env, "Tabungan", &recipient2, 4000),
        ];

        let contract_id = env.register(TemplateRegistryContract, ());
        let client = TemplateRegistryContractClient::new(&env, &contract_id);

        env.mock_auths(&[]);

        let template_id = client.create_template(&sender, &allocations).unwrap();

        // Try to deactivate with different sender
        let result = client.deactivate_template(&other, &template_id);
        assert_eq!(result, Err(ContractError::Unauthorized));
    }

    #[test]
    fn test_get_sender_templates() {
        let (env, sender) = setup_test_env();
        let recipient1 = Address::generate(&env);
        let recipient2 = Address::generate(&env);

        let allocations: Vec<Allocation> = vec![
            &env,
            create_allocation(&env, "Harian", &recipient1, 6000),
            create_allocation(&env, "Tabungan", &recipient2, 4000),
        ];

        let contract_id = env.register(TemplateRegistryContract, ());
        let client = TemplateRegistryContractClient::new(&env, &contract_id);

        env.mock_all_auths();

        let templates = client.get_sender_templates(&sender);
        assert_eq!(templates.len(), 0);

        client.create_template(&sender, &allocations).unwrap();
        client.create_template(&sender, &allocations).unwrap();

        let templates = client.get_sender_templates(&sender);
        assert_eq!(templates.len(), 2);
    }
}
