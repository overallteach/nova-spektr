import type { Account, Chain, ProxiedAccount } from '@shared/core';

export const enum Step {
  NONE,
  INIT,
  CONFIRM,
  SIGN,
  SUBMIT,
}

export type NetworkStore = {
  chain: Chain;
  shards: Account[];
};

export type WithdrawData = {
  shards: Account[];
  proxiedAccount?: ProxiedAccount;
  signatory?: Account;
  amount: string;
  description: string;

  fee: string;
  totalFee: string;
  multisigDeposit: string;
};
