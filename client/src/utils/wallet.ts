import { environment } from './envrionments';
import { errors } from './errors';

export const conirmCurrentNetwork = async () => {
  const metalet = window?.metaidwallet;
  const network = await metalet?.getNetwork();
  if (network?.network !== environment.network) {
    alert(errors.SWITCH_NETWORK_ALERT);
    await window.metaidwallet.switchNetwork(environment.network);

    throw new Error(errors.SWITCH_NETWORK_ALERT);
  }
};
