import { EntitySchema } from '@metaid/metaid';

export const Web2MetaidSchema: EntitySchema = {
  name: 'web2metaid',
  nodeName: 'web2metaid',
  path: '/protcols/web2metaid',
  versions: [
    {
      version: 1,
      body: [
        {
          name: 'appName',
          type: 'string',
        },
        {
          name: 'handler',
          type: 'string',
        },
        {
          name: 'signature',
          type: 'string',
        },
      ],
    },
  ],
};
