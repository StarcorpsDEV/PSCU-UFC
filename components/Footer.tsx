export const Footer: React.FC = () => {
  return (
    <footer>
      <nav>
        <ul
          sx={{
            listStyle: 'none',
            display: 'grid',
            gridTemplateColumns: ['repeat(2, 1fr)', 'repeat(4, 1fr)'],
            placeItems: 'center',
            margin: 0,
            marginTop: '1rem',
            padding: 0,
            gridGap: '1rem',
            '& a': {
              color: '#00d9ff',
            },
          }}
        >
          <li>
            <a style = {{textDecoration: "none"}} target="_blank" href="https://github.com/starcorpsDEV/PSCU-UFC">
              DAO Source code
            </a>
          </li>
          <li>
            <a style = {{textDecoration: "none"}} target="_blank" href="https://discord.gg/dq2PaMmDbm">PSCU Discord</a>
          </li>
          <li>
            <a style = {{textDecoration: "none"}} target="_blank" href="https://badgerscollectif.com">Badgers Collectif</a>
          </li>
          <li>
            <a style = {{textDecoration: "none"}} target="_blank" href="https://thirdweb.com">ThirdWeb  <span aria-hidden="true">🦄</span></a>
          </li>
        </ul>
      </nav>
    </footer>
  );
};
