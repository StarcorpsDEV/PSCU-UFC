import { Member } from 'types/Member';
import { shortenAddress } from 'utilities/addresses';

export const DaoMembers: React.FC<{ members: Member[] }> = ({ members }) => {
  return (
    <div className="stack">
      <h2>Members List</h2>
      <table className="card" sx={{ width: '100%' }}>
        <thead>
          <tr sx={{ '& th': { textAlign: 'left', width: '100vh' } }}>
            <th>
              <img
                width="48px"
                src="assets/0.webp"
                alt="ufcc"
                sx={{ display: 'inline' }}
              ></img>
            </th>
            <th>
              <img
                width="48px"
                src="assets/UFCC.png"
                alt="ufcc"
                sx={{ display: 'inline' }}
              ></img>
            </th>
          </tr>
        </thead>
        <tbody>
          {members.map((member) => {
            return (
              <tr key={member.address}>
                <td>{shortenAddress(member.address)}</td>
                <td>{member.tokenAmount}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
