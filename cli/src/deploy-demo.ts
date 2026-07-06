// This file is part of riseMoon (Midnight New Moon submission).
// SPDX-License-Identifier: Apache-2.0

/*
 * Non-interactive scripted demo used for the New Moon submission:
 * restores a wallet from a fixed seed, waits for it to be funded via the
 * Preprod faucet, deploys the private vault contract, performs a deposit
 * and a partial withdrawal, and prints the deployed contract address.
 */

import { createLogger } from './logger-utils.js';
import { PreviewConfig } from './config.js';
import * as api from './api.js';

const SEED = process.argv[2];
if (!SEED) {
  console.error('Usage: deploy-demo.ts <hex-seed>');
  process.exit(1);
}

const config = new PreviewConfig();
const logger = await createLogger(config.logDir);
api.setLogger(logger);

const walletCtx = await api.buildWalletAndWaitForFunds(config, SEED);
const providers = await api.configureProviders(walletCtx, config);

const secretKey = api.generateSecretKey();
const privateState = api.createPrivateVaultPrivateState(secretKey);

const vaultContract = await api.withStatus('Deploying private vault contract to Preview', () =>
  api.deploy(providers, privateState),
);
const contractAddress = vaultContract.deployTxData.public.contractAddress;
console.log(`\n=== DEPLOYED CONTRACT ADDRESS: ${contractAddress} ===\n`);

await api.withStatus('Depositing 100 (private amount)', () => api.deposit(providers, vaultContract, 100n));
await api.withStatus('Withdrawing 40 (private amount)', () => api.withdraw(providers, vaultContract, 40n));

const state = await api.displayVaultState(providers, vaultContract);
console.log(`\n=== FINAL STATE: contract=${state.contractAddress} publicDepositCount=${state.depositCount} ===\n`);

await walletCtx.wallet.stop();
process.exit(0);
