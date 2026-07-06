// This file is part of riseMoon (Midnight New Moon submission).
// SPDX-License-Identifier: Apache-2.0

import {
  type CircuitContext,
  sampleContractAddress,
  createConstructorContext,
  createCircuitContext,
} from '@midnight-ntwrk/compact-runtime';
import { Contract, type Ledger, ledger } from '../managed/private_vault/contract/index.js';
import { type PrivateVaultPrivateState, witnesses, createPrivateVaultPrivateState } from '../witnesses.js';

// Local, no-network simulation of the private vault contract, useful for fast unit
// tests of the circuit logic without needing a proof server, node or indexer.
export class PrivateVaultSimulator {
  readonly contract: Contract<PrivateVaultPrivateState>;
  circuitContext: CircuitContext<PrivateVaultPrivateState>;

  constructor(secretKey: Uint8Array = new Uint8Array(32).fill(1)) {
    this.contract = new Contract<PrivateVaultPrivateState>(witnesses);
    const { currentPrivateState, currentContractState, currentZswapLocalState } = this.contract.initialState(
      createConstructorContext(createPrivateVaultPrivateState(secretKey), '0'.repeat(64)),
    );
    this.circuitContext = createCircuitContext(
      sampleContractAddress(),
      currentZswapLocalState,
      currentContractState,
      currentPrivateState,
    );
  }

  public getLedger(): Ledger {
    return ledger(this.circuitContext.currentQueryContext.state);
  }

  public getPrivateState(): PrivateVaultPrivateState {
    return this.circuitContext.currentPrivateState;
  }

  // The `localBalance` witness only reads private state; it does not persist the
  // circuit's computed newBalance. In a real client, this is done by the API layer
  // after a successful transaction (see cli/src/api.ts). We mirror that here.
  public deposit(amount: bigint): Ledger {
    this.circuitContext = this.contract.impureCircuits.deposit(this.circuitContext, amount).context;
    this.circuitContext = {
      ...this.circuitContext,
      currentPrivateState: {
        ...this.circuitContext.currentPrivateState,
        balance: this.circuitContext.currentPrivateState.balance + amount,
      },
    };
    return ledger(this.circuitContext.currentQueryContext.state);
  }

  public withdraw(amount: bigint): Ledger {
    this.circuitContext = this.contract.impureCircuits.withdraw(this.circuitContext, amount).context;
    this.circuitContext = {
      ...this.circuitContext,
      currentPrivateState: {
        ...this.circuitContext.currentPrivateState,
        balance: this.circuitContext.currentPrivateState.balance - amount,
      },
    };
    return ledger(this.circuitContext.currentQueryContext.state);
  }
}
