import '../styles/globals.css';
import type { AppProps } from 'next/app';
import { ThemeProvider } from 'theme-ui';
import { defaultTheme } from '../themes/defaultTheme';
import { ThirdwebWeb3Provider } from '@3rdweb/hooks';
import Head from 'next/head';
import { AvalancheNetworkId } from 'utilities/NetworkIds';
import 'regenerator-runtime/runtime'; // The ThirdWeb useWeb3 hook seems to require this.
import { Analytics } from '@vercel/analytics/react';

const supportedChainIds = [AvalancheNetworkId];

// In this case, we support Metamask which is an "injected wallet".
const connectors = {
  injected: {},
};

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <title>PSCU - Union of Federated Corporations</title>
        <meta
          name="description"
          content="PSCU - Union of Federated Corporations"
        />
        <meta
          name="keywords"
          content="Union Federated Corp., UFC, PSCU, Pulsar, UFCC, UFCPLSR, ERC20, avax, avalanche, rts, video game"
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Analytics />
      <ThemeProvider theme={defaultTheme}>
        <ThirdwebWeb3Provider
          connectors={connectors}
          supportedChainIds={supportedChainIds}
        >
          <div sx={{ display: 'grid', placeItems: 'center' }}>
            <Component {...pageProps} />{' '}
          </div>
        </ThirdwebWeb3Provider>
      </ThemeProvider>
    </>
  );
}
export default MyApp;
