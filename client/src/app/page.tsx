'use client';
import Header from '@/components/custom/header';
import { Button } from '@/components/ui/button';
import { useTwitterInfoQuery } from '@/hooks/useTwitterInfoQuery';
import { walletRestoreParamsAtom } from '@/store/account';
import axios from 'axios';
import Image from 'next/image';
import { isNil } from 'ramda';
import { useRecoilValue } from 'recoil';
import { MetaletWalletForBtc, btcConnect, loadBtc } from '@metaid/metaid'; // loadBtc form btc chain
import { Web2MetaidSchema } from '@/config/web2metaid.entity';

export default function Home() {
  const { data: twitterUser } = useTwitterInfoQuery();
  const walletParams = useRecoilValue(walletRestoreParamsAtom);

  const confirmConnect = () => {
    if (isNil(walletParams?.address)) {
      alert('Please connect your wallet first');
      return;
    }
  };

  // twitter oauth Url constructor
  function getTwitterOauthUrl() {
    const rootUrl = 'https://twitter.com/i/oauth2/authorize';
    const options = {
      redirect_uri: `${process.env.SERVER_URI}/oauth/twitter`,
      client_id: process.env.TWITTER_CLIENT_ID!,
      state: 'state',
      response_type: 'code',
      code_challenge: 'y_SfRG4BmOES02uqWeIkIgLQAlTBggyf_G7uKT51ku8',
      code_challenge_method: 'S256',
      scope: ['users.read', 'tweet.read', 'follows.read', 'follows.write'].join(
        ' '
      ), // add/remove scopes as needed
    };
    const qs = new URLSearchParams(options).toString();
    return `${rootUrl}?${qs}`;
  }

  const hanldeBindX = async () => {
    // TODO: bind twitter, weibo, qq, wechat
    try {
      window.location.href = getTwitterOauthUrl();

      // const response = await axios.get('http://localhost:5000/auth/twitter');
      // window.location.href = response.data.url;
    } catch (error) {
      console.error(error);
    }
  };

  const handleBindMetaid = async () => {
    confirmConnect();
    const _wallet = MetaletWalletForBtc.restore({
      ...walletParams!,
      internal: window.metaidwallet,
    });
    const btcConnector = await btcConnect({
      wallet: _wallet,
      network: 'testnet',
    });

    const web2metaidEntity = await loadBtc(Web2MetaidSchema, {
      connector: btcConnector,
    });

    const signature = await window.metaidwallet.btc.signMessage(
      `${btcConnector.metaid}_${twitterUser?.id}`
    );

    // todo: verify signature
    if (!isNil(twitterUser)) {
      const body = {
        appName: 'twitter',
        handler: twitterUser,
        signature,
      };
      try {
        const createRes = await web2metaidEntity!.create({
          dataArray: [
            {
              body: JSON.stringify(body),
              contentType: 'text/plain;utf-8',
              flag: 'testid',
            },
          ],
          options: {
            noBroadcast: 'no',
            feeRate: 8,
          },
        });
        if (!isNil(createRes?.revealTxIds[0])) {
          alert('bind success');
        }
      } catch (error) {
        console.log('error', error);
        const errorMessage = (error as any)?.message ?? error;
        const toastMessage = errorMessage?.includes(
          'Cannot read properties of undefined'
        )
          ? 'User Canceled'
          : errorMessage;
        alert('bind success');
      }
    }
  };

  return (
    <div className='container' suppressHydrationWarning>
      <Header />
      <div
        suppressHydrationWarning
        className='relative flex flex-col gap-2 mt-16'
      >
        <Button
          className='bg-gray-500  rounded-sm text-center'
          onClick={hanldeBindX}
        >
          First, Connect With Twitter
        </Button>
        {twitterUser && <div>{`Log in with ${twitterUser.name}`}</div>}

        <Button
          className='bg-gray-500 rounded-sm text-center'
          onClick={handleBindMetaid}
        >
          Second, Bind With MetaID
        </Button>
      </div>
    </div>
  );
}
