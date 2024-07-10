// add global envrc variables
type Environment = {
  network: string;
  base_man_url: string;
  flag: string;
};

export const environment: Environment = {
  network: 'testnet',
  base_man_url: 'https://man-test.metaid.io',
  flag: 'testid',
};
