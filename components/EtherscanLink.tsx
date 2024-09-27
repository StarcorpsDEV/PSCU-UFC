import Image from 'next/image';

export const EtherscanLink: React.FC<{
  address: string;
  domainName: string | null;
  avatar: string;
}> = ({ address, domainName, avatar }) => {
  return (
    <a
      style={{
        backgroundColor: '#fff',

        color: 'accent',
        borderRadius: '32px',
        textOverflow: 'ellipsis',
        overflow: 'hidden',
        whiteSpace: 'nowrap',
        display: 'flex',
        padding: '0.25rem',
        border: '1px solid #000000 !important',
      }}
      href={`https://snowtrace.io/address/${address}`}
      title={`User with wallet address ${address} on etherscan.io`}
      target="_blank"
      rel="noreferrer"
    >
      <Image src={avatar} alt="" width="24" height="24" />
      <span
        style={{
          marginLeft: '0.5rem',
          marginRight: '0.25rem',
          display: 'none',
        }}
      >
        {domainName ?? address}
      </span>
    </a>
  );
};
