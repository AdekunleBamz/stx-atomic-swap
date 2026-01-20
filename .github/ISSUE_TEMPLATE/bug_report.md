---
name: Bug Report
description: Report a bug or issue with the atomic swap implementation
title: "[BUG] "
labels: ["bug", "needs-triage"]
assignees: []
---

## 🐛 Bug Description
A clear and concise description of what the bug is.

## 🔄 Steps to Reproduce
1. Go to '...'
2. Initiate swap between '....'
3. Execute transaction '....'
4. See error

## 📋 Expected Behavior
A clear and concise description of what you expected to happen.

## 📸 Screenshots/Logs
If applicable, add screenshots or error logs to help explain your problem.

## 🌐 Environment
- **Chains Involved**: [e.g., STX <> BTC, STX <> ETH]
- **Asset Type**: [e.g., STX, SIP009 NFT, SIP010 Token, BTC, ETH, ERC20, ERC721]
- **Test Environment**: [Integration Test/Local Testnet/Mainnet]
- **Clarinet Version**: [e.g., 0.15.2]
- **Truffle Version**: [e.g., 5.4.3]
- **Bitcoin Core Version**: [e.g., 22.0]

## 🔗 Swap Details (if applicable)
- **Swap ID/Hash**: [HTLC hash or swap identifier]
- **Amount**: [e.g., 100 STX, 0.001 BTC]
- **Timelock**: [e.g., 24 hours, 144 blocks]
- **Initiator Address**: [Stacks/Bitcoin/Ethereum address]
- **Participant Address**: [Stacks/Bitcoin/Ethereum address]

## 📄 Transaction Details (if applicable)
- **Transaction IDs**: [List all relevant transaction IDs]
- **Block Heights**: [Block numbers where transactions were mined]
- **Contract Addresses**: [HTLC contract addresses on each chain]
- **Error Messages**: [Any specific error messages from contracts or tests]

## 🔍 Test Results
- [ ] Unit tests passing
- [ ] Integration tests failing
- [ ] Manual swap execution failing
- [ ] Cross-chain verification failing

## 📝 Additional Context
Add any other context about the problem here, such as:
- When did this start happening?
- Is this related to a specific asset type?
- Any recent changes to HTLC contracts?

## ✅ Verification Steps
- [ ] I have tested this on multiple chains
- [ ] I have verified HTLC contract deployment
- [ ] I have checked timelock calculations
- [ ] I have tested both successful and failed swap scenarios
- [ ] I have verified hashlock secrets are properly generated