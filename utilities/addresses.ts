export function shortenAddress(address: string) {
  return (
    address.substring(0, 6) + '...' + address.substring(address.length - 4)
  );
}

export const BUNDLE_DROP_ADDRESS = '0x104F6A41d1BEe512D958FA2E7709Df6d45A36aC9';
export const TOKEN_MODULE_ADDRESS =
  '0x952564F369F6cB1BFb26088741cFCB29Fdfaa1CF';
export const VOTE_MODULE_ADDRESS = '0x7120445936bC6e496ec4E76924ce81C65fcB67E2';

export const TREASURY_ERC20 = [
  { name: 'UFCC', address: '0x952564F369F6cB1BFb26088741cFCB29Fdfaa1CF' },
  { name: 'UFCPLSR', address: '0x7A6bF020161dEab23913ccFa5bE43aD37AEB6CA8' },
  { name: 'USDC', address: '0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E' },
  { name: 'USDT', address: '0x9702230A8Ea53601f5cD2dc00fDBc13d4dF4A8c7' },
  { name: 'DAI.e', address: '0xd586E7F844cEa2F87f50152665BCbc2C279D8d70' },
  { name: 'wETH', address: '0x8b82A291F83ca07Af22120ABa21632088fC92931' },
  { name: 'wAVAX', address: '0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7' },
];

export const TREASURY_ERC721 = [
  { name: 'Pulsar', address: '0x77B7e9909502a1D5F0B35Ea4B59b62406A1364e4' },
  { name: 'PSCU', address: '0xe8b1EDAcdeF73d442598Af0573DF2f244F866fb2' },
];

const TREASURY_ERC1155 = [
  { name: 'TLC', address: '0x104F6A41d1BEe512D958FA2E7709Df6d45A36aC9' },
];
