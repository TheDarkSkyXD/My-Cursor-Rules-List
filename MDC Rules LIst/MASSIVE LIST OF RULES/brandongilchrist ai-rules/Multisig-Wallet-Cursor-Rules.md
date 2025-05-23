You are assisting with the development of a k-of-n Multisig Wallet smart contract system. Follow these guidelines when providing suggestions and generating code:

# Project Overview
This is a security-critical Multisig Wallet implementation requiring k-of-n signatures for transaction execution. The project uses:
- Solidity v0.8.28
- OpenZeppelin Contracts 5.2.0
- Hardhat and Foundry for testing
- Test-Driven Development approach
- Heavy focus on security and gas optimization

# Development Approach
- Always write tests first (TDD)
- Aim for 100% test coverage
- Include both Hardhat and Foundry tests
- Implement comprehensive fuzzing tests
- Use formal verification where applicable

# Coding Standards

## Solidity Style
- Use latest Solidity features (0.8.28+)
- Explicit function visibility modifiers required
- External over public where possible
- Use custom errors instead of require strings
- Use named parameters for better readability
- Use named returns for clarity
- Maximum line length of 100 characters
- Four-space indentation

## Naming Conventions
```solidity
contract MultisigWallet {}        // Contract names: PascalCase
interface IMultisigWallet {}      // Interfaces: PascalCase with 'I' prefix
error InvalidSignature()          // Custom errors: PascalCase
event OwnerAdded(address owner);  // Events: PascalCase
modifier onlyOwner() {}          // Modifiers: camelCase
function executeTransaction() {}  // Functions: camelCase
uint256 private _nonce;          // Private vars: camelCase with underscore
```

## Security Requirements
- Implement Checks-Effects-Interactions pattern
- Use ReentrancyGuard for external calls
- Validate all inputs extensively
- Emit events for all state changes
- Use SafeERC20 for token operations
- Implement secure signature verification
- Include emergency pause functionality
- Add timelock for critical operations

## Gas Optimization
- Pack storage variables
- Use immutable for constants
- Avoid redundant storage reads
- Use unchecked blocks where safe
- Cache storage variables in memory
- Use custom errors over require strings

## Documentation Requirements
- Extensive NatSpec documentation
- Implementation overview in comments
- Security considerations documented
- Gas optimizations explained
- Test coverage documented

# File Structure
```
contracts/
├── interfaces/
│   └── IMultisigWallet.sol
├── libraries/
│   └── SignatureLib.sol
├── MultisigWallet.sol
├── MultisigFactory.sol
test/
├── hardhat/
│   └── MultisigWallet.test.ts
└── foundry/
    └── MultisigWallet.t.sol
```

# Test Requirements
- Write tests first (TDD)
- Cover all edge cases
- Include fuzzing tests
- Test for reentrancy
- Test signature validation extensively
- Verify event emissions
- Test gas optimization
- Include unit and integration tests
- Test all reverts

# Example Test Structure
```solidity
// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {MultisigWallet} from "../contracts/MultisigWallet.sol";

contract MultisigWalletTest is Test {
    MultisigWallet wallet;
    
    function setUp() public {
        // Setup code
    }
    
    function test_ValidExecution() public {
        // Test code
    }
    
    function testFuzz_SignatureValidation(bytes32 hash) public {
        // Fuzzing test
    }
}
```

# Common Functions to Generate
When asked to implement functions, follow these patterns:

## Execution Function
```solidity
function executeTransaction(
    address target,
    uint256 value,
    bytes calldata data,
    bytes[] calldata signatures
) external nonReentrant returns (bool success) {
    // Implementation
}
```

## Signature Verification
```solidity
function verifySignatures(
    bytes32 hash,
    bytes[] calldata signatures
) internal view returns (bool) {
    // Implementation
}
```

# OpenZeppelin Imports
Use these common imports:
```solidity
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import {MessageHashUtils} from "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
```

# Testing Tools
- Use both Hardhat and Foundry
- Prefer Foundry for gas optimization tests
- Use Hardhat for integration tests
- Use coverage reports from both tools

# Error Messages
Use custom errors:
```solidity
error InvalidSignature();
error InsufficientSignatures();
error InvalidThreshold();
error DuplicateSignature();
error SignerNotUnique();
```

# Event Definitions
```solidity
event TransactionExecuted(
    address indexed target,
    uint256 value,
    bytes data,
    uint256 indexed nonce
);

event SignersUpdated(
    address[] newSigners,
    uint256 newThreshold
);
```

Remember to:
1. Always write tests first
2. Focus on security
3. Optimize for gas
4. Document extensively
5. Follow the style guide
6. Use the latest OpenZeppelin contracts
7. Implement both Hardhat and Foundry tests
