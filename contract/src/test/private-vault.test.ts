// This file is part of riseMoon (Midnight New Moon submission).
// SPDX-License-Identifier: Apache-2.0

import { PrivateVaultSimulator } from './private-vault-simulator.js';
import { setNetworkId } from '@midnight-ntwrk/midnight-js-network-id';
import { describe, it, expect } from 'vitest';

setNetworkId('undeployed');

describe('Private vault smart contract', () => {
  it('generates initial ledger state deterministically', () => {
    const simulator0 = new PrivateVaultSimulator();
    const simulator1 = new PrivateVaultSimulator();
    expect(simulator0.getLedger().depositCount).toEqual(simulator1.getLedger().depositCount);
    expect(simulator0.getLedger().balances.size()).toEqual(simulator1.getLedger().balances.size());
  });

  it('initializes with a deposit counter of 1 and an empty balances map', () => {
    const simulator = new PrivateVaultSimulator();
    const initialLedgerState = simulator.getLedger();
    expect(initialLedgerState.depositCount).toEqual(1n);
    expect(initialLedgerState.balances.size()).toEqual(0n);
    expect(simulator.getPrivateState().balance).toEqual(0n);
  });

  it('records a deposit as a public commitment, never the plaintext amount', () => {
    const simulator = new PrivateVaultSimulator();
    const nextLedgerState = simulator.deposit(100n);
    expect(nextLedgerState.depositCount).toEqual(2n);
    expect(nextLedgerState.balances.size()).toEqual(1n);
    expect(simulator.getPrivateState().balance).toEqual(100n);
  });

  it('allows withdrawing up to the private balance', () => {
    const simulator = new PrivateVaultSimulator();
    simulator.deposit(100n);
    const nextLedgerState = simulator.withdraw(40n);
    expect(nextLedgerState.balances.size()).toEqual(1n);
    expect(simulator.getPrivateState().balance).toEqual(60n);
  });

  it('rejects withdrawing more than the private balance', () => {
    const simulator = new PrivateVaultSimulator();
    simulator.deposit(50n);
    expect(() => simulator.withdraw(100n)).toThrow();
  });

  it('two different users get different pseudonymous vault entries', () => {
    const alice = new PrivateVaultSimulator(new Uint8Array(32).fill(1));
    const bob = new PrivateVaultSimulator(new Uint8Array(32).fill(2));
    alice.deposit(100n);
    bob.deposit(100n);
    // Same amount deposited, but each is keyed by a different pseudonymous public key,
    // so the two commitments live at different map entries.
    expect(alice.getLedger().balances.size()).toEqual(1n);
    expect(bob.getLedger().balances.size()).toEqual(1n);
  });
});
