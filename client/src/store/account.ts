import { IMetaletWalletForBtc } from '@metaid/metaid';
import { atom } from 'recoil';
import { recoilPersist } from 'recoil-persist';

const { persistAtom } = recoilPersist();
export const walletAtom = atom<IMetaletWalletForBtc | null>({
  key: 'walletAtom',
  default: null,
  // effects_UNSTABLE: [persistAtom],
});

export const walletRestoreParamsAtom = atom<{
  address: string;
  pub: string;
} | null>({
  key: 'walletRestoreParamsAtom',
  default: null,
  effects_UNSTABLE: [persistAtom],
});
