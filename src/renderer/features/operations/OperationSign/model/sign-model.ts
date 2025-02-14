import { createEvent, restore, combine, sample } from 'effector';
import { UnsignedTransaction } from '@substrate/txwrapper-polkadot';
import { once } from 'patronum';

import type { Chain, Account, HexString } from '@shared/core';
import { Transaction } from '@entities/transaction';
import { networkModel } from '@entities/network';
import { walletModel, walletUtils } from '@entities/wallet';

type Input = {
  chain: Chain;
  accounts: Account[];
  signatory?: Account;
  transactions: Transaction[];
};

type SignatureData = {
  signatures: HexString[];
  unsignedTxs: UnsignedTransaction[];
};

const formInitiated = createEvent<Input>();
const dataReceived = createEvent<SignatureData>();
const formSubmitted = createEvent<SignatureData>();

const $signStore = restore<Input>(formInitiated, null);

const $api = combine(
  {
    apis: networkModel.$apis,
    store: $signStore,
  },
  ({ apis, store }) => {
    return store ? apis[store.chain.chainId] : null;
  },
);

const $signerWallet = combine(
  {
    store: $signStore,
    wallets: walletModel.$wallets,
  },
  ({ store, wallets }) => {
    if (!store) return undefined;

    return walletUtils.getWalletById(wallets, store.accounts[0].walletId);
  },
  { skipVoid: false },
);

sample({
  clock: once({ source: dataReceived, reset: formInitiated }),
  target: formSubmitted,
});

export const signModel = {
  $signStore,
  $api,
  $signerWallet,
  events: {
    formInitiated,
    dataReceived,
  },
  output: {
    formSubmitted,
  },
};
