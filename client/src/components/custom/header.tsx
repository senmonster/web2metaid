'use client';
import React from 'react';
import { Button } from '../ui/button';
import { MetaletWalletForBtc } from '@metaid/metaid';
import { conirmCurrentNetwork } from '@/utils/wallet';
import { useRecoilState } from 'recoil';
import { walletRestoreParamsAtom } from '@/store/account';
import { isEmpty } from 'ramda';

const Header = () => {
  // const [wallet, setWallet] = useRecoilState(walletAtom);
  const [walletParams, setWalletParams] = useRecoilState(
    walletRestoreParamsAtom
  );
  const onWalletConnect = async () => {
    const _wallet = await MetaletWalletForBtc.create();
    await conirmCurrentNetwork();

    // setWallet(_wallet);
    setWalletParams({ address: _wallet.address, pub: _wallet.pub });
  };

  return (
    <header
      suppressHydrationWarning
      className='sticky top-0 z-50 w-full border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60'
    >
      <div
        suppressHydrationWarning
        className='flex h-14 max-w-screen-2xl items-center justify-between'
      >
        <div>Web2MetaID</div>
        {isEmpty(walletParams?.address ?? '') ? (
          <Button onClick={onWalletConnect}>Connect Wallet</Button>
        ) : (
          <div>{walletParams?.address}</div>
        )}
      </div>
    </header>
  );
};

export default Header;
