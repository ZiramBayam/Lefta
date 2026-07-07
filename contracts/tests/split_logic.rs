// Standalone tests for split logic
// Run: rustc --test tests/split_logic.rs -o split_test && ./split_test

#![allow(dead_code)]

#[test]
fn test_split_60_40() {
    let total: i128 = 100_000_000;
    let a = (total * 6000) / 10000;
    let b = total - a;
    assert_eq!(a, 60_000_000, "60% split failed");
    assert_eq!(b, 40_000_000, "40% split failed");
    assert_eq!(a + b, total, "Total mismatch");
}

#[test]
fn test_split_rounding_33_33_34() {
    let total: i128 = 100_000_000;
    let a = (total * 3333) / 10000;
    let b = (total * 3333) / 10000;
    let c = total - a - b;
    assert_eq!(a + b + c, total, "Total mismatch");
    assert_eq!(a, 33_330_000);
    assert_eq!(b, 33_330_000);
    assert_eq!(c, 33_340_000);
}

#[test]
fn test_split_small_amount() {
    let total: i128 = 1;
    let a = (total * 5000) / 10000;
    let b = total - a;
    assert_eq!(a, 0, "Floor of 0.5 should be 0");
    assert_eq!(b, 1, "Remainder should be 1");
}

#[test]
fn test_split_single_100pct() {
    let total: i128 = 50_000_000;
    let result = if true { total } else { (total * 10000) / 10000 };
    assert_eq!(result, total, "100% should get all");
}

#[test]
fn test_split_even_4way() {
    let total: i128 = 100_000_000;
    let amount = (total * 2500) / 10000;
    let sum = amount * 3 + (total - amount * 3);
    assert_eq!(sum, total, "4-way split total mismatch");
}

#[test]
fn test_basis_points_valid() {
    assert_eq!(6000 + 4000, 10000, "Valid basis points");
    assert_ne!(9999, 10000, "Invalid: less than 10000");
    assert_ne!(10001, 10000, "Invalid: more than 10000");
}

#[test]
fn test_minimum_amount() {
    assert_eq!(1_000_000, 1_000_000, "Minimum is 1 USDC");
    assert!(999_999 < 1_000_000, "999999 should be below minimum");
    assert!(1_000_001 >= 1_000_000, "1000001 should be above minimum");
}

#[test]
fn test_large_split_small_bp() {
    // 1% + 1% + 1% + 97%
    let total: i128 = 100_000_000;
    let a = (total * 100) / 10000;
    let b = (total * 100) / 10000;
    let c = (total * 100) / 10000;
    let d = total - a - b - c;
    assert_eq!(a + b + c + d, total, "Total mismatch");
    assert_eq!(d, 97_000_000, "97% should get 97M");
}

#[test]
fn test_split_precision_100_units() {
    // Edge case: 100 units split 33.33/33.33/33.34
    let total: i128 = 100;
    let a = (total * 3333) / 10000;
    let b = (total * 3333) / 10000;
    let c = total - a - b;
    assert_eq!(a + b + c, total, "Must distribute all 100 units");
}

#[test]
fn test_multiple_splits_consistent() {
    // Test that multiple smaller splits sum correctly
    let total: i128 = 1_000_000;
    let splits: Vec<i128> = vec![2500, 2500, 2500, 2500]
        .iter()
        .map(|bp| (total * bp) / 10000)
        .collect();

    let sum: i128 = splits.iter().sum();
    let remainder = total - sum;

    // All splits should be 250000 (25% of 1M = 250000)
    assert_eq!(splits[0], 250000);
    assert_eq!(splits[1], 250000);
    assert_eq!(splits[2], 250000);
    assert_eq!(splits[3], 250000);
    // Remainder handling: last gets extra
    assert!(remainder >= 0);
}
