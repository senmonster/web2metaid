import { environment } from './envrionments';

export const errors = {
  NO_METALET_DETECTED:
    'It appears that you do not have Metalet Wallet Extentsion installed or have not created a wallet account.',
  NO_WALLET_CONNECTED: 'Please connect your wallet first.',
  NO_METALET_LOGIN: 'Please log in your Metalet Account first.',
  INIT_STILL_MEMPOOL:
    'The transaction of your MetaID init inscription is still in the mempool...Please wait for the btc network confirmation.',
  SWITCH_NETWORK_ALERT: `Please switch to the ${
    environment.network.charAt(0).toUpperCase() + environment.network.slice(1)
  } to go on.`,
};
