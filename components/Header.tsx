import { keyframes } from '@emotion/react';

const fadeInfadeOut = keyframes`
  from {
  	opacity: 0;
  }
  to {
 	opacity: 1;
  }
`;

const web3Styles = {
  color: 'accent',
  opacity: 1,
  '@media screen and (prefers-reduced-motion: no-preference)': {
    animation: `${fadeInfadeOut} 2.5s ease-in-out infinite`,
  },
};

export const Header: React.FC = () => (
  <h1
    style={{
      fontFamily: 'heading',
      background: 'var(--brand-gradient)',
      backgroundClip: 'text',
    }}
    aria-label="UFC DAO"
  >
    Union of Federated Corporations
  </h1>
);
