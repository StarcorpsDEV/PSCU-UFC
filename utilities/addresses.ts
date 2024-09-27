export function shortenAddress(address: string) {
  return (
    address.substring(0, 6) + '...' + address.substring(address.length - 4)
  );
}

export const BUNDLE_DROP_ADDRESS = '0x104F6A41d1BEe512D958FA2E7709Df6d45A36aC9';
export const TOKEN_MODULE_ADDRESS = '0x952564F369F6cB1BFb26088741cFCB29Fdfaa1CF';
export const VOTE_MODULE_ADDRESS = '0x7120445936bC6e496ec4E76924ce81C65fcB67E2';
