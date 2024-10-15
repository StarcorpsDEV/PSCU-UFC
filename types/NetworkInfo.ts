import {
  GoerliNetworkId,
  KovanNetworkId,
  MainnetNetworkId,
  RinkebyNetworkId,
  RopstenNetworkId,
  AvalancheNetworkId,
  AmoyNetworkId,
} from '../utilities/NetworkIds';

export type NetworkInfo = Readonly<
  | {
      chainId: '0x1';
      networkVersion: typeof MainnetNetworkId;
    }
  | {
      chainId: '0x2a';
      networkVersion: typeof KovanNetworkId;
    }
  | {
      chainId: '0x3';
      networkVersion: typeof RopstenNetworkId;
    }
  | {
      chainId: '0x4';
      networkVersion: typeof RinkebyNetworkId;
    }
  | {
      chainId: '0x5';
      networkVersion: typeof GoerliNetworkId;
    }
  | {
      chainId: '0xa86a';
      networkVersion: typeof AvalancheNetworkId;
    }
  | {
      chainId: '0x13882';
      networkVersion: typeof AmoyNetworkId;
    }
>;
