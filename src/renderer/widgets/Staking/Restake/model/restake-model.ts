import { createEvent, createStore, sample, restore } from 'effector';
import { spread, delay } from 'patronum';

import { Transaction } from '@entities/transaction';
import { signModel } from '@features/operations/OperationSign/model/sign-model';
import { submitModel } from '@features/operations/OperationSubmit';
import { Step, RestakeStore, NetworkStore } from '../lib/types';
import { formModel } from './form-model';
import { confirmModel } from './confirm-model';
import { nonNullable, getRelaychainAsset } from '@shared/lib/utils';

const stepChanged = createEvent<Step>();

const flowStarted = createEvent<NetworkStore>();
const flowFinished = createEvent();

const $step = createStore<Step>(Step.NONE);

const $restakeStore = createStore<RestakeStore | null>(null);
const $networkStore = restore<NetworkStore | null>(flowStarted, null);

const $wrappedTxs = createStore<Transaction[] | null>(null);
const $multisigTxs = createStore<Transaction[] | null>(null);
const $coreTxs = createStore<Transaction[] | null>(null);

sample({ clock: stepChanged, target: $step });

sample({
  clock: flowStarted,
  target: formModel.events.formInitiated,
});

sample({
  clock: flowStarted,
  fn: () => Step.INIT,
  target: stepChanged,
});

sample({
  clock: formModel.output.formSubmitted,
  fn: ({ transactions, formData }) => {
    const wrappedTxs = transactions.map((tx) => tx.wrappedTx);
    const multisigTxs = transactions.map((tx) => tx.multisigTx).filter(nonNullable);
    const coreTxs = transactions.map((tx) => tx.coreTx);

    return {
      wrappedTxs,
      multisigTxs: multisigTxs.length === 0 ? null : multisigTxs,
      coreTxs,
      restakeStore: formData,
    };
  },
  target: spread({
    wrappedTxs: $wrappedTxs,
    multisigTxs: $multisigTxs,
    coreTxs: $coreTxs,
    restakeStore: $restakeStore,
  }),
});

sample({
  clock: formModel.output.formSubmitted,
  source: $networkStore,
  filter: (network: NetworkStore | null): network is NetworkStore => Boolean(network),
  fn: ({ chain }, { formData }) => ({
    event: { ...formData, chain, asset: getRelaychainAsset(chain.assets)! },
    step: Step.CONFIRM,
  }),
  target: spread({
    event: confirmModel.events.formInitiated,
    step: stepChanged,
  }),
});

sample({
  clock: confirmModel.output.formSubmitted,
  source: {
    restakeStore: $restakeStore,
    networkStore: $networkStore,
    wrappedTxs: $wrappedTxs,
  },
  filter: ({ restakeStore, networkStore, wrappedTxs }) => {
    return Boolean(restakeStore) && Boolean(networkStore) && Boolean(wrappedTxs);
  },
  fn: ({ restakeStore, networkStore, wrappedTxs }) => ({
    event: {
      chain: networkStore!.chain,
      accounts: restakeStore!.shards,
      signatory: restakeStore!.signatory,
      transactions: wrappedTxs!,
    },
    step: Step.SIGN,
  }),
  target: spread({
    event: signModel.events.formInitiated,
    step: stepChanged,
  }),
});

sample({
  clock: signModel.output.formSubmitted,
  source: {
    restakeStore: $restakeStore,
    networkStore: $networkStore,
    multisigTxs: $multisigTxs,
    coreTxs: $coreTxs,
  },
  filter: (transferData) => {
    return Boolean(transferData.restakeStore) && Boolean(transferData.coreTxs) && Boolean(transferData.networkStore);
  },
  fn: (transferData, signParams) => ({
    event: {
      ...signParams,
      chain: transferData.networkStore!.chain,
      account: transferData.restakeStore!.shards[0],
      signatory: transferData.restakeStore!.signatory,
      description: transferData.restakeStore!.description,
      transactions: transferData.coreTxs!,
      multisigTxs: transferData.multisigTxs || [],
    },
    step: Step.SUBMIT,
  }),
  target: spread({
    event: submitModel.events.formInitiated,
    step: stepChanged,
  }),
});

sample({
  clock: delay(submitModel.output.formSubmitted, 2000),
  target: flowFinished,
});

sample({
  clock: flowFinished,
  fn: () => Step.NONE,
  target: [stepChanged, formModel.events.formCleared],
});

export const restakeModel = {
  $step,
  $networkStore,
  events: {
    flowStarted,
    stepChanged,
  },
  output: {
    flowFinished,
  },
};
