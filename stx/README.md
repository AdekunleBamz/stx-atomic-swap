# Stacks HTLC Contracts

This directory contains Clarity smart contracts for Hashed Timelock Contracts (HTLC) on the Stacks blockchain. These contracts facilitate atomic swaps between Stacks and other blockchains like Bitcoin and Ethereum.

## Contracts

### `contracts/stx-htlc.clar`
The main contract for swapping STX (Stacks native currency).

**Functions:**
- `register-swap-intent`: Locks STX with a hash and expiration height.
- `cancel-swap-intent`: Refunds STX to the sender if the timelock expires.
- `swap`: Releases STX to the recipient if the correct preimage is provided.
- `get-swap-intent`: Read-only function to fetch swap details.

**Events:**
- `register-swap-intent`: Emitted when a new swap is created.
- `cancel-swap-intent`: Emitted when a swap is cancelled/refunded.
- `swap`: Emitted when a swap is successfully completed.

### `contracts/sip009-sip010-htlc.clar`
A contract for swapping SIP-009 (NFTs) and SIP-010 (Fungible Tokens).

**Functions:**
- `register-swap-intent-sip009`: Locks a SIP-009 NFT.
- `register-swap-intent-sip010`: Locks SIP-010 Fungible Tokens.
- `cancel-swap-intent-sip009`: Refunds a SIP-009 NFT.
- `cancel-swap-intent-sip010`: Refunds SIP-010 Fungible Tokens.
- `swap-sip009`: Releases a SIP-009 NFT to the recipient.
- `swap-sip010`: Releases SIP-010 Fungible Tokens to the recipient.
- `set-whitelisted`: Whitelists token contracts (Owner only).

**Events:**
- Standardized events similar to the main contract are emitted for tracking.

## Usage

To use these contracts in a Clarinet project:
1. Ensure `Clarinet.toml` includes these contracts.
2. Use `clarinet test` to run the test suite.
3. Deploy to testnet/mainnet using `clarinet integrate`.

## Traits

The `traits/` directory contains standard SIP-009 and SIP-010 trait definitions used for interoperability.
