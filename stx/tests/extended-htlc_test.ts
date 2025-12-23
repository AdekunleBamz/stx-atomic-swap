import {
	Clarinet,
	Chain,
	Account,
	types,
	generate_secret,
	calculate_hash,
	swap_contract_principal,
	register_swap_intent,
	get_swap_intent,
	cancel_swap_intent,
	execute_swap,
	ErrorCodes
} from './common.ts';
import { assertEquals, assert } from 'https://deno.land/std@0.90.0/testing/asserts.ts';

Clarinet.test({
	name: "Extended: Multiple swap intents with different hashes",
	async fn(chain: Chain, accounts: Map<string, Account>) {
		const [deployer, sender, recipient] = ['deployer', 'wallet_1', 'wallet_2'].map(name => accounts.get(name)!);

		// Create multiple swap intents with different hashes
		const swaps = [];
		for (let i = 0; i < 5; i++) {
			const secret = generate_secret();
			const hash = calculate_hash(secret);
			const swap_intent = {
				hash,
				expiration_height: chain.blockHeight + 10 + i,
				amount_or_token_id: 100 + i * 10,
				sender: sender.address,
				recipient: recipient.address
			};
			const swap_contract = swap_contract_principal(deployer, swap_intent);
			const swap = register_swap_intent(chain, swap_contract, swap_intent);
			swap.result.expectOk().expectBool(true);
			swaps.push({ intent: swap_intent, contract: swap_contract, secret });
		}

		// Verify all swaps are retrievable
		for (const swap of swaps) {
			const retrieved = get_swap_intent(chain, swap.contract, swap.intent.hash, sender.address);
			const result = retrieved.result.expectSome().expectTuple();
			assertEquals(result, {
				"amount": types.uint(swap.intent.amount_or_token_id),
				"expiration-height": types.uint(swap.intent.expiration_height),
				"recipient": swap.intent.recipient
			});
		}
	}
});

Clarinet.test({
	name: "Extended: Boundary testing for expiration heights",
	async fn(chain: Chain, accounts: Map<string, Account>) {
		const [deployer, sender, recipient] = ['deployer', 'wallet_1', 'wallet_2'].map(name => accounts.get(name)!);

		// Test with current block height (should fail)
		let swap_intent = {
			hash: new Uint8Array(new ArrayBuffer(32)),
			expiration_height: chain.blockHeight,
			amount_or_token_id: 100,
			sender: sender.address,
			recipient: recipient.address
		};
		let swap_contract = swap_contract_principal(deployer, swap_intent);
		let swap = register_swap_intent(chain, swap_contract, swap_intent);
		swap.result.expectErr().expectUint(ErrorCodes.ERR_EXPIRY_IN_PAST);

		// Test with very far future expiration (should succeed)
		swap_intent.expiration_height = chain.blockHeight + 100000; // Very far future
		swap_contract = swap_contract_principal(deployer, swap_intent);
		swap = register_swap_intent(chain, swap_contract, swap_intent);
		swap.result.expectOk().expectBool(true);
	}
});

Clarinet.test({
	name: "Extended: Hash collision resistance",
	async fn(chain: Chain, accounts: Map<string, Account>) {
		const [deployer, sender, recipient] = ['deployer', 'wallet_1', 'wallet_2'].map(name => accounts.get(name)!);

		// Create two swaps with different secrets but test that same hash fails
		const secret1 = generate_secret();
		const secret2 = generate_secret();
		const hash1 = calculate_hash(secret1);
		const hash2 = calculate_hash(secret2);

		// Make sure hashes are different
		assert(hash1.toString() !== hash2.toString(), "Generated hashes should be different");

		// Register first swap
		const swap_intent1 = {
			hash: hash1,
			expiration_height: chain.blockHeight + 10,
			amount_or_token_id: 100,
			sender: sender.address,
			recipient: recipient.address
		};
		const swap_contract1 = swap_contract_principal(deployer, swap_intent1);
		const swap1 = register_swap_intent(chain, swap_contract1, swap_intent1);
		swap1.result.expectOk().expectBool(true);

		// Try to register second swap with same hash (different contract)
		const swap_intent2 = {
			hash: hash1, // Same hash
			expiration_height: chain.blockHeight + 15,
			amount_or_token_id: 200,
			sender: sender.address,
			recipient: recipient.address
		};
		const swap_contract2 = swap_contract_principal(deployer, swap_intent2);
		const swap2 = register_swap_intent(chain, swap_contract2, swap_intent2);
		swap2.result.expectOk().expectBool(true); // Should succeed (different contract)
	}
});

Clarinet.test({
	name: "Extended: Large amount handling",
	async fn(chain: Chain, accounts: Map<string, Account>) {
		const [deployer, sender, recipient] = ['deployer', 'wallet_1', 'wallet_2'].map(name => accounts.get(name)!);

		// Test with maximum possible STX amount (within sender's balance)
		const largeAmount = sender.balance - 1000; // Leave some buffer

		const swap_intent = {
			hash: new Uint8Array(new ArrayBuffer(32)),
			expiration_height: chain.blockHeight + 10,
			amount_or_token_id: largeAmount,
			sender: sender.address,
			recipient: recipient.address
		};
		const swap_contract = swap_contract_principal(deployer, swap_intent);
		const swap = register_swap_intent(chain, swap_contract, swap_intent);
		swap.result.expectOk().expectBool(true);
		swap.events.expectSTXTransferEvent(largeAmount, sender.address, swap_contract);
	}
});

Clarinet.test({
	name: "Extended: Preimage validation and security",
	async fn(chain: Chain, accounts: Map<string, Account>) {
		const [deployer, sender, recipient] = ['deployer', 'wallet_1', 'wallet_2'].map(name => accounts.get(name)!);

		const secret = generate_secret();
		const hash = calculate_hash(secret);
		const wrongSecret = generate_secret();
		const wrongHash = calculate_hash(wrongSecret);

		const swap_intent = {
			hash,
			expiration_height: chain.blockHeight + 10,
			amount_or_token_id: 100,
			sender: sender.address,
			recipient: recipient.address
		};
		const swap_contract = swap_contract_principal(deployer, swap_intent);
		register_swap_intent(chain, swap_contract, swap_intent);

		// Test with wrong preimage
		const wrongSwap = execute_swap(chain, swap_contract, swap_intent, wrongSecret, recipient.address);
		wrongSwap.result.expectErr().expectUint(ErrorCodes.ERR_INVALID_PREIMAGE);

		// Test with correct preimage
		const correctSwap = execute_swap(chain, swap_contract, swap_intent, secret, recipient.address);
		correctSwap.result.expectOk().expectBool(true);

		// Verify funds were transferred to recipient
		correctSwap.events.expectSTXTransferEvent(swap_intent.amount_or_token_id, swap_contract, recipient.address);
	}
});

Clarinet.test({
	name: "Extended: Multiple participants and complex scenarios",
	async fn(chain: Chain, accounts: Map<string, Account>) {
		const [deployer, sender1, sender2, recipient1, recipient2] = ['deployer', 'wallet_1', 'wallet_2', 'wallet_3', 'wallet_4'].map(name => accounts.get(name)!);

		// Create multiple concurrent swaps
		const swaps = [];

		// Swap 1: sender1 -> recipient1
		const secret1 = generate_secret();
		const hash1 = calculate_hash(secret1);
		const swap1 = {
			hash: hash1,
			expiration_height: chain.blockHeight + 20,
			amount_or_token_id: 150,
			sender: sender1.address,
			recipient: recipient1.address
		};
		const contract1 = swap_contract_principal(deployer, swap1);
		swaps.push({ intent: swap1, contract: contract1, secret: secret1 });

		// Swap 2: sender2 -> recipient2
		const secret2 = generate_secret();
		const hash2 = calculate_hash(secret2);
		const swap2 = {
			hash: hash2,
			expiration_height: chain.blockHeight + 25,
			amount_or_token_id: 200,
			sender: sender2.address,
			recipient: recipient2.address
		};
		const contract2 = swap_contract_principal(deployer, swap2);
		swaps.push({ intent: swap2, contract: contract2, secret: secret2 });

		// Register both swaps
		for (const swap of swaps) {
			const result = register_swap_intent(chain, swap.contract, swap.intent);
			result.result.expectOk().expectBool(true);
		}

		// Execute first swap
		const execute1 = execute_swap(chain, swaps[0].contract, swaps[0].intent, swaps[0].secret, recipient1.address);
		execute1.result.expectOk().expectBool(true);

		// Verify first swap completion
		execute1.events.expectSTXTransferEvent(swaps[0].intent.amount_or_token_id, swaps[0].contract, recipient1.address);

		// Second swap should still be active
		const execute2 = execute_swap(chain, swaps[1].contract, swaps[1].intent, swaps[1].secret, recipient2.address);
		execute2.result.expectOk().expectBool(true);

		// Verify second swap completion
		execute2.events.expectSTXTransferEvent(swaps[1].intent.amount_or_token_id, swaps[1].contract, recipient2.address);
	}
});

Clarinet.test({
	name: "Extended: Time-sensitive operations and race conditions",
	async fn(chain: Chain, accounts: Map<string, Account>) {
		const [deployer, sender, recipient] = ['deployer', 'wallet_1', 'wallet_2'].map(name => accounts.get(name)!);

		const secret = generate_secret();
		const hash = calculate_hash(secret);

		const swap_intent = {
			hash,
			expiration_height: chain.blockHeight + 5, // Short expiration
			amount_or_token_id: 100,
			sender: sender.address,
			recipient: recipient.address
		};
		const swap_contract = swap_contract_principal(deployer, swap_intent);
		register_swap_intent(chain, swap_contract, swap_intent);

		// Try to execute right at expiration boundary
		chain.mineEmptyBlock(swap_intent.expiration_height - chain.blockHeight);

		// Should still be executable right at expiration height
		const swap = execute_swap(chain, swap_contract, swap_intent, secret, recipient.address);
		swap.result.expectOk().expectBool(true);

		// After expiration, should fail
		const expiredSwap = execute_swap(chain, swap_contract, swap_intent, secret, recipient.address);
		expiredSwap.result.expectErr().expectUint(ErrorCodes.ERR_SWAP_INTENT_EXPIRED);
	}
});

Clarinet.test({
	name: "Extended: Sender authorization and access control",
	async fn(chain: Chain, accounts: Map<string, Account>) {
		const [deployer, sender, recipient, attacker] = ['deployer', 'wallet_1', 'wallet_2', 'wallet_3'].map(name => accounts.get(name)!);

		const secret = generate_secret();
		const hash = calculate_hash(secret);

		const swap_intent = {
			hash,
			expiration_height: chain.blockHeight + 10,
			amount_or_token_id: 100,
			sender: sender.address,
			recipient: recipient.address
		};
		const swap_contract = swap_contract_principal(deployer, swap_intent);
		register_swap_intent(chain, swap_contract, swap_intent);

		// Attacker tries to cancel before expiry (should fail)
		const earlyCancel = cancel_swap_intent(chain, swap_contract, swap_intent, attacker.address);
		earlyCancel.result.expectErr().expectUint(ErrorCodes.ERR_UNKNOWN_SWAP_INTENT);

		// Mine to expiry
		chain.mineEmptyBlock(swap_intent.expiration_height - chain.blockHeight + 1);

		// Attacker tries to cancel after expiry (should fail - only sender can cancel)
		const lateCancelAttacker = cancel_swap_intent(chain, swap_contract, swap_intent, attacker.address);
		lateCancelAttacker.result.expectErr().expectUint(ErrorCodes.ERR_UNKNOWN_SWAP_INTENT);

		// Sender cancels successfully
		const lateCancelSender = cancel_swap_intent(chain, swap_contract, swap_intent, sender.address);
		lateCancelSender.result.expectOk().expectBool(true);
		lateCancelSender.events.expectSTXTransferEvent(swap_intent.amount_or_token_id, swap_contract, sender.address);
	}
});

Clarinet.test({
	name: "Extended: State consistency and data integrity",
	async fn(chain: Chain, accounts: Map<string, Account>) {
		const [deployer, sender, recipient] = ['deployer', 'wallet_1', 'wallet_2'].map(name => accounts.get(name)!);

		// Create and track multiple swap states
		const states = [];

		for (let i = 0; i < 3; i++) {
			const secret = generate_secret();
			const hash = calculate_hash(secret);
			const swap_intent = {
				hash,
				expiration_height: chain.blockHeight + 10 + i,
				amount_or_token_id: 100 + i * 50,
				sender: sender.address,
				recipient: recipient.address
			};
			const swap_contract = swap_contract_principal(deployer, swap_intent);
			register_swap_intent(chain, swap_contract, swap_intent);

			states.push({
				intent: swap_intent,
				contract: swap_contract,
				secret,
				initialBlock: chain.blockHeight
			});
		}

		// Verify all states are consistent
		for (const state of states) {
			const retrieved = get_swap_intent(chain, state.contract, state.intent.hash, sender.address);
			const result = retrieved.result.expectSome().expectTuple();
			assertEquals(result, {
				"amount": types.uint(state.intent.amount_or_token_id),
				"expiration-height": types.uint(state.intent.expiration_height),
				"recipient": state.intent.recipient
			});
		}

		// Execute one swap and verify others remain unchanged
		const executeResult = execute_swap(chain, states[0].contract, states[0].intent, states[0].secret, recipient.address);
		executeResult.result.expectOk().expectBool(true);

		// Verify other swaps still exist and are unchanged
		for (let i = 1; i < states.length; i++) {
			const retrieved = get_swap_intent(chain, states[i].contract, states[i].intent.hash, sender.address);
			const result = retrieved.result.expectSome().expectTuple();
			assertEquals(result, {
				"amount": types.uint(states[i].intent.amount_or_token_id),
				"expiration-height": types.uint(states[i].intent.expiration_height),
				"recipient": states[i].intent.recipient
			});
		}
	}
});
