// This file is part of riseMoon (Midnight New Moon submission).
// SPDX-License-Identifier: Apache-2.0

/*
 * Defines the shape of the private vault's private state, and the witness
 * functions that expose parts of it to the ZK circuits. Nothing here is
 * ever transmitted on-chain unless a circuit explicitly disclose()s it.
 */

import { Ledger } from './managed/private_vault/contract/index.js';
import { WitnessContext } from '@midnight-ntwrk/midnight-js-protocol/compact-runtime';

export type PrivateVaultPrivateState = {
  readonly secretKey: Uint8Array;
  readonly balance: bigint;
};

export const createPrivateVaultPrivateState = (secretKey: Uint8Array, balance: bigint = 0n): PrivateVaultPrivateState => ({
  secretKey,
  balance,
});

export const witnesses = {
  localSecretKey: ({
    privateState,
  }: WitnessContext<Ledger, PrivateVaultPrivateState>): [PrivateVaultPrivateState, Uint8Array] => [
    privateState,
    privateState.secretKey,
  ],

  localBalance: ({
    privateState,
  }: WitnessContext<Ledger, PrivateVaultPrivateState>): [PrivateVaultPrivateState, bigint] => [
    privateState,
    privateState.balance,
  ],
};
