import type { NextPage } from 'next';
import $ from 'jquery';
import { Header } from '@components/Header';
import { Wallet } from '@components/Wallet';
import { useWeb3WithEns } from 'utilities/hooks';
import { Proposal, ThirdwebSDK } from '@3rdweb/sdk';
import {
  BUNDLE_DROP_ADDRESS,
  TOKEN_MODULE_ADDRESS,
  VOTE_MODULE_ADDRESS,
  TREASURY_ERC20,
  TREASURY_ERC721,
  TREASURY_ERC1155,
} from 'utilities/addresses';
import { useEffect, useMemo, useState } from 'react';
import { Button } from '@components/Button';
import { BigNumberish, ethers } from 'ethers';
import { toast, ToastContainer } from 'react-toastify';
import { getMissingMetamaskMessage } from 'utilities/metamask';
import 'react-toastify/dist/ReactToastify.css';
import { DaoProposals } from '@components/DaoProposals';
import { DaoMembers } from '@components/DaoMembers';
import { Footer } from '@components/Footer';
import { Image, Grid, Box, Embed } from 'theme-ui';

const DAO_PROPOSAL_DURATION = 172800000;

if (
  !process.env.REACT_APP_PRIVATE_KEY ||
  process.env.REACT_APP_PRIVATE_KEY == ''
) {
  process.env.REACT_APP_PRIVATE_KEY = '';
}

const sdk = new ThirdwebSDK(
  new ethers.Wallet(
    process.env.REACT_APP_PRIVATE_KEY,
    ethers.getDefaultProvider(process.env.REACT_APP_ALCHEMY_API_URL),
  ),
);

// Grab a reference to our ERC-1155 contract.
const bundleDropModule = sdk.getBundleDropModule(BUNDLE_DROP_ADDRESS);
const tokenModule = sdk.getTokenModule(TOKEN_MODULE_ADDRESS);
const voteModule = sdk.getVoteModule(VOTE_MODULE_ADDRESS);
const DEFAULT_AVATAR = '/assets/0.webp';
const LOGO = '/assets/logo.png';
const TLL = '/assets/pscu-tlc-size.png';
const UFC = '/assets/pscu-ufc-size.png';
//////get vote treasury balanace of selected tokens
var erc20treasturystate = false;
var erc721treasturystate = false;
var erc1155treasturystate = false;
function loadTreasuryERC20() {
  if (erc20treasturystate == false) {
    erc20treasturystate = true;
    TREASURY_ERC20.map((token) => {
      treasuryBalance(token.address);
    });
  } else {
    $('#treasuryTable').html('');
    erc20treasturystate = false;
  }
}

function loadTreasuryERC721() {
  if (erc721treasturystate == false) {
    erc721treasturystate = true;
    TREASURY_ERC721.map((token) => {
      treasuryNFTBalance(token);
    });
  } else {
    $('#treasuryNFTTable').html('');
    erc721treasturystate = false;
  }
}
function loadTreasuryERC1155() {
  if (erc1155treasturystate == false) {
    erc1155treasturystate = true;
    TREASURY_ERC1155.map((token) => {
      treasuryEditionBalance(token);
    });
  } else {
    $('#treasuryEditionTable').html('');
    erc1155treasturystate = false;
  }
}
async function treasuryBalance(address: string) {
  voteModule
    .balanceOfToken(address)
    .then((tokens) => {
      console.log('🚀 Dao  treasury', tokens);
      $('#treasuryTable').append(
        '<tr><td><img src="assets/' +
          tokens.symbol +
          '.png" alt="' +
          tokens.name +
          '" width="24px"></img></td>' +
          '<td><a style="font-size:12px;text-decoration:none;" href="https://snowtrace.io/address/' +
          address +
          '" rel="noreferrer" target="_blank"> ' +
          address +
          '</a></td><td>' +
          tokens.name +
          '</td><td>' +
          tokens.symbol +
          '</td><td>' +
          tokens.displayValue +
          '</td></tr>',
      );
    })
    .catch((err) => {
      console.error('failed to get token', err);
      return err;
    });
}

async function treasuryNFTBalance(token: any) {
  sdk
    .getNFTModule(token.address)
    .balanceOf(voteModule.address)
    .then((tokens) => {
      console.log('🚀 Dao  NFT', tokens);
      $('#treasuryNFTTable').append(
        '<tr><td><img src="assets/' +
          token.name +
          '.png" alt="' +
          token.name +
          '" width="24px"></td><td>' +
          '<a style="font-size:12px;text-decoration:none;" href="https://snowtrace.io/address/' +
          token.address +
          '" rel="noreferrer" target="_blank"> ' +
          token.address +
          '</a></td><td>' +
          token.name +
          '</td><td>' +
          Number(tokens._hex) +
          '</td></tr>',
      );
    })
    .catch((err) => {
      console.error('failed to get token', err);
      return err;
    });
}

async function treasuryEditionBalance(token: any) {
  sdk
    .getBundleDropModule(token.address)
    .balanceOf(voteModule.address, 0)
    .then((tokens) => {
      console.log('🚀 Dao  Edition', tokens);
      $('#treasuryEditionTable').append(
        '<tr><td><img src="assets/' +
          token.name +
          '.png" alt="' +
          token.name +
          '" width="24px"></td><td>' +
          '<a style="font-size:12px;text-decoration:none;" href="https://snowtrace.io/address/' +
          token.address +
          '" rel="noreferrer" target="_blank"> ' +
          token.address +
          '</a></td><td>' +
          token.name +
          '</td><td><img src="assets/' +
          '0.webp" alt="' +
          token.name +
          '" width="24px">' +
          '</td><td>0</td><td>' +
          Number(tokens._hex) +
          '</td></tr>',
      );
    })
    .catch((err) => {
      console.error('failed to get token', err);
      return err;
    });
}

const Home: NextPage = () => {
  const { connectWallet, address, avatar, domainName, error, provider } =
    useWeb3WithEns();

  const [hasClaimedNFT, setHasClaimedNFT] = useState(false);
  const [embedDivObj, setEmbedDivObj] = useState(<></>);

  // Amount of token each member has in state.
  const [memberTokenAmounts, setMemberTokenAmounts] = useState<
    Record<string, BigNumberish>
  >({});

  // All of our members addresses.
  const [memberAddresses, setMemberAddresses] = useState<string[]>([]);
  const [isClaiming, setIsClaiming] = useState(false);
  const [isVoting, setIsVoting] = useState(false);
  const [hasVoted, setHasVoted] = useState(false);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [hasMetaMask, setHasMetaMask] = useState(false);

  // The signer is required to sign transactions on the blockchain.
  // Without it we can only read data, not write.
  const signer = provider?.getSigner();

  const UFCPLSRcard = (
    <div className="card" sx={{ marginTop: '24px' }}>
      <Grid gap={2} columns={[2, '1fr 5fr']}>
        <Box>
          <img src="assets/UFCPLSR.png" sx={{ width: '100%' }}></img>
        </Box>
        <Box>
          <p>
            The UFC Pulsar tokens are always minted from this token drop
            contract at a price of 0.04 USDC. The UFCPLSR can be staked in the
            Refined Pulsar Corp. staking contrats to get a reward in UFCC or
            USDC. Get shares from the mining fee from the community Genesis
            lands and help us to grow. Drop UFCPLSR tokens and we will use the
            income from the sale to mint more Genesis lands NFT from the Pulsar
            game shop.
          </p>
          <div sx={{ textAlign: 'center' }}>
            <Button
              sx={{ height: '50px', marginTop: '24px' }}
              onClick={() => {
                embedDiv(
                  'https://embed.ipfscdn.io/ipfs/bafybeigdie2yyiazou7grjowoevmuip6akk33nqb55vrpezqdwfssrxyfy/erc20.html?contract=0x7A6bF020161dEab23913ccFa5bE43aD37AEB6CA8&chain=%7B%22name%22%3A%22Avalanche+C-Chain%22%2C%22chain%22%3A%22AVAX%22%2C%22rpc%22%3A%5B%22https%3A%2F%2F43114.rpc.thirdweb.com%2F%24%7BTHIRDWEB_API_KEY%7D%22%5D%2C%22nativeCurrency%22%3A%7B%22name%22%3A%22Avalanche%22%2C%22symbol%22%3A%22AVAX%22%2C%22decimals%22%3A18%7D%2C%22shortName%22%3A%22avax%22%2C%22chainId%22%3A43114%2C%22testnet%22%3Afalse%2C%22slug%22%3A%22avalanche%22%2C%22icon%22%3A%7B%22url%22%3A%22ipfs%3A%2F%2FQmcxZHpyJa8T4i63xqjPYrZ6tKrt55tZJpbXcjSDKuKaf9%2Favalanche%2F512.png%22%2C%22width%22%3A512%2C%22height%22%3A512%2C%22format%22%3A%22png%22%7D%7D&clientId=20a005c403f089b6b726937429862c33&theme=dark&primaryColor=red',
                );
                $('html, body').animate(
                  { scrollTop: $(document).height() },
                  1000,
                );
              }}
            >
              {`UFC Pulsar ERC-20 Drop`}
            </Button>
          </div>
        </Box>
      </Grid>
    </div>
  );

  const DEXCard = (
    <div className="card" sx={{ marginTop: '24px' }}>
      <Grid gap={2} columns={[2, '1fr 5fr']}>
        <Box>
          <img src="assets/UFCC.webp" sx={{ width: '100%' }}></img>
        </Box>
        <Box>
          <p>
            The Pulsar Star Corporation United Decentralized Exchange (DEX)
            allow to interact with the community tokens liquidity pools on
            Uniswap. You can trade UFC ressources tokens like UFC Pulsar token
            (UFCPLSR) and UFC governancy tokens like UFC Coin (UFCC). The
            Uniswap liquidity pools are mantained by the Union of Federated
            Corporation which have the administration right over the contracts
            and hold the Uniswap liquidity pool ERC-721 NFT in his treasury.
          </p>
          <div sx={{ textAlign: 'center' }}>
            <Button
              sx={{ height: '50px', marginTop: '24px' }}
              onClick={() => {
                embedDiv('https://pscu-dex.badgerscollectif.com');
                $('html, body').animate(
                  { scrollTop: $(document).height() },
                  1000,
                );
              }}
            >
              {`PSCU DEX for tokens`}
            </Button>
          </div>
        </Box>
      </Grid>
    </div>
  );

  const RPCCard = (
    <div className="card" sx={{ marginTop: '24px' }}>
      <Grid gap={2} columns={[2, '1fr 5fr']}>
        <Box>
          <img src="assets/rpc-size.webp" sx={{ width: '100%' }}></img>
        </Box>
        <Box>
          <p>
            The Refined Pulsar Corp. give to the UFC Pulsar token (UFCPLSR)
            holders the possibility to stake their tokens. Stake your tokens
            right now to get a reward from the community ERC-20 staking pools.
            You can get UFC Coin (UFCC) or USD Coin (USDC). The staking pools
            are mantained by the Union of Federated Corporation which have the
            administration right over the contracts.
          </p>
          <div sx={{ textAlign: 'center' }}>
            <Button
              sx={{ height: '50px', marginTop: '24px' }}
              onClick={() => {
                embedDiv('https://pscu-rpc.badgerscollectif.com');
                $('html, body').animate(
                  { scrollTop: $(document).height() },
                  1000,
                );
              }}
            >
              {`RPC ERC-20 Staking`}
            </Button>
          </div>
        </Box>
      </Grid>
    </div>
  );

  const PSCUcard = (
    <div className="card" sx={{ marginTop: '32px' }}>
      <Grid gap={2} columns={[2, '1fr 5fr']}>
        <Box>
          <img src="assets/PSCU_NFT.png" sx={{ width: '100%' }}></img>
        </Box>
        <Box>
          <p>
            This collection is designed for the community Pulsar Star
            Corporation United in the MMORTS massively multiplayer real time
            strategy game called Pulsar. As member of the PSCU you will have the
            privilege to buy Corporations Concession Claim Points NFT in our
            networks and moderation right over the discord server. You will have
            the right to buy at a preferential price during the private sales of
            game NFTs when they happen. In addition, with the membership you
            will receive 2000 UFCPLSR on Avalanche/Polygon to buy game NFT of
            your choice from the PSCU NFTs Marketplace or you can stake them to
            get UFCC and USDC as reward. Finally, with this NFT you will get 1
            from 40 unique items of the PSCU gamer community as unique designed
            avatars for the visual identity.
          </p>
          <div sx={{ textAlign: 'center' }}>
            <Button
              sx={{ height: '50px', marginTop: '24px' }}
              onClick={() => {
                embedDiv(
                  'https://drop.badgerscollectif.com/?contract=0xEbc0d702f6dd3D4A8A6e3e38363bE357A84A6806&chain=avalanche&theme=dark&primaryColor=red',
                );
                $('html, body').animate(
                  { scrollTop: $(document).height() },
                  1000,
                );
              }}
            >
              {'Pulsar Star Corporations United ERC-721 Drop'}
            </Button>
          </div>
        </Box>
      </Grid>
    </div>
  );

  const NFTMarketplaceCard = (
    <div className="card" sx={{ marginTop: '24px' }}>
      <Grid gap={2} columns={[2, '1fr 5fr']}>
        <Box>
          <img
            src="https://pulsar.game/images/items/Genesis/Mothership.png"
            sx={{ width: '100%' }}
          ></img>
        </Box>
        <Box>
          <p>
            The Pulsar Star Corporations United NFTs Marketplace offer the
            possibility to make listing and to trade the NFTs from the Pulsar
            collections. This applications have marketplaces contracs on Polygon
            PoS and Avalanche C-Chain. We will build more contracts on Ethereum
            mainnet, Bnb chain and Pulsar mainnet.
          </p>
          <div sx={{ textAlign: 'center' }}>
            <Button
              sx={{ height: '50px', marginTop: '24px' }}
              onClick={() => {
                embedDiv('https://pscu-nft.badgerscollectif.com');
                $('html, body').animate(
                  { scrollTop: $(document).height() },
                  1000,
                );
              }}
            >
              {`PSCU ERC-721 Marketplace`}
            </Button>
          </div>
        </Box>
      </Grid>
    </div>
  );

  const UFCCICON = (
    <Image
      sx={{ width: '24px', display: 'inline' }}
      alt="UFCC"
      src="/assets/UFCC.webp"
    ></Image>
  );

  type DelegateState = 'delegating' | 'delegated' | 'delegate';

  function getSubmitButtonText(delegateState: DelegateState) {
    switch (delegateState) {
      case 'delegating':
        return 'Delegating...';
      case 'delegated':
        return 'Delegated';
      case 'delegate':
        return 'Delegate';
      default:
        throw new Error('Unknown delegate state');
    }
  }

  async function verifyNFT() {
    bundleDropModule
      .balanceOf(bundleDropModule.address, '0')
      .then((balance) => {
        // If balance is greater than 0, they have our NFT!
        if (balance.gt(0)) {
          setHasClaimedNFT(true);
        }
      })
      .catch((error) => {
        toast.error('Failed to get NFT balance');
      });

    if (!hasClaimedNFT) {
      setTimeout(() => {
        verifyNFT();
      }, 600000);
    }
  }

  useEffect(() => {
    if (!window.ethereum) {
      toast.error(getMissingMetamaskMessage());
      return;
    }

    setHasMetaMask(true);
  }, []);

  useEffect(() => {
    if (error?.name === 'UnsupportedChainIdError') {
      toast.error(
        `This dapp only works on the Avalanche network, please switch networks in your connected wallet.`,
        { autoClose: false },
      );
    }
  }, [error]);

  // This useEffect grabs all our the addresses of our members holding our NFT.
  useEffect(() => {
    if (!hasClaimedNFT) {
      return;
    }

    // Just like we did in the 7-airdrop-token.js file! Grab the users who hold our NFT
    // with tokenId 0.
    bundleDropModule
      .getAllClaimerAddresses('0')
      .then((addr) => {
        console.log('🚀 Members addresses', addr);
        if (addr.length === 0) {
          const members: string[] = JSON.parse(
            typeof process.env.REACT_APP_DEFAUT_DAO_MEMBERS === 'string'
              ? process.env.REACT_APP_DEFAUT_DAO_MEMBERS
              : '',
          );
          setMemberAddresses(members);
        } else {
          const members = addr;
          setMemberAddresses(members);
        }
      })
      .catch((err) => {
        console.error('failed to get member list', err);
        toast.error('Failed to get member list');
      });
  }, [hasClaimedNFT]);

  const memberList = useMemo(() => {
    return memberAddresses.map((address) => {
      return {
        address,
        tokenAmount: ethers.utils.formatUnits(
          // If the address isn't in memberTokenAmounts, it means they don't
          // hold any of our token.
          memberTokenAmounts[address] || 0,
          18,
        ),
      };
    });
  }, [memberAddresses, memberTokenAmounts]);

  // This useEffect grabs the # of token each member holds.
  useEffect(() => {
    if (!hasClaimedNFT) {
      return;
    }

    // Grab all the balances.
    tokenModule
      .getAllHolderBalances()
      .then((amounts) => {
        console.log('👜 Amounts', amounts);
        setMemberTokenAmounts(amounts);
      })
      .catch((err) => {
        console.error('failed to get token amounts', err);
        toast.error('Failed to get token amounts');
      });
  }, [hasClaimedNFT]);

  useEffect(() => {
    if (!address) {
      // No wallet connected.
      return;
    }

    bundleDropModule
      .balanceOf(address, '0')
      .then((balance) => {
        // If balance is greater than 0, they have our NFT!
        if (balance.gt(0)) {
          setHasClaimedNFT(true);
        } else {
          setHasClaimedNFT(false);
        }
      })
      .catch((error) => {
        setHasClaimedNFT(false);
        console.error('failed to nft balance', error);
        toast.error('Failed to get NFT balance');
      });
  }, [address]);

  useEffect(() => {
    signer && sdk.setProviderOrSigner(signer);
  }, [signer]);

  // Retreive all our existing proposals from the contract.
  useEffect(() => {
    if (!hasClaimedNFT) {
      return;
    }
    // A simple call to voteModule.getAll() to grab the proposals.
    voteModule
      .getAll()
      .then((proposals) => {
        // Set state!
        setProposals(proposals);
        console.log('🌈 Proposals:', proposals);
      })
      .catch((err) => {
        toast.error('Failed to get proposals');
      });
  }, [hasClaimedNFT]);

  // We also need to check if the user already voted.
  useEffect(() => {
    if (!hasClaimedNFT || !address) {
      return;
    }

    // If we haven't finished retreieving the proposals from the useEffect above
    // then we can't check if the user voted yet!
    if (!proposals.length) {
      return;
    }

    // Check if the user has already voted on the first proposal.
    voteModule
      .hasVoted(proposals[0].proposalId, address)
      .then((hasVoted) => {
        setHasVoted(hasVoted);
        console.log('🥵 User has already voted');
      })
      .catch((err) => {
        console.error('failed to check if member has voted', err);
        toast.error('Failed to check if member has voted');
      });
  }, [hasClaimedNFT, proposals, address]);

  const embedDiv = async (url: string) => {
    setIsClaiming(true);
    setEmbedDivObj(
      <Embed
        src={url}
        sandbox={
          'allow-scripts allow-same-origin allow-top-navigation allow-popups allow-forms'
        }
        width="100%"
        height="750px"
        style={{ maxWidth: '100%' }}
        frameBorder={'0'}
      ></Embed>,
    );
  };

  async function vote() {
    if (!address || isVoting || hasVoted) {
      return;
    }

    const toastId = address;

    //before we do async things, we want to disable the button to prevent double clicks
    setIsVoting(true);
    toast.info('🔨 Voting...', { toastId, autoClose: false });

    // lets get the votes from the form for the values
    const votes = proposals.map((proposal) => {
      let voteResult = {
        proposalId: proposal.proposalId,
        //abstain by default
        vote: 2,
      };

      proposal.votes.forEach((vote) => {
        const elem = document.getElementById(
          proposal.proposalId + '-' + vote.type,
        ) as HTMLInputElement;

        if (elem.checked) {
          voteResult.vote = vote.type;
          return;
        }
      });
      return voteResult;
    });

    // first we need to make sure the user delegates their token to vote
    try {
      //we'll check if the wallet still needs to delegate their tokens before they can vote
      const delegation = await tokenModule.getDelegationOf(address);
      // if the delegation is the 0x0 address that means they have not delegated their governance tokens yet
      if (delegation === ethers.constants.AddressZero) {
        //if they haven't delegated their tokens yet, we'll have them delegate them before voting
        await tokenModule.delegateTo(address);
      }
      // then we need to vote on the proposals
      try {
        await Promise.all(
          votes.map(async (vote) => {
            // before voting we first need to check whether the proposal is open for voting
            // we first need to get the latest state of the proposal
            const proposal = await voteModule.get(vote.proposalId);
            // then we check if the proposal is open for voting (state === 1 means it is open)
            if (proposal.state === 1) {
              toast.info('Vote on active proposals');
              // if it is open for voting, we'll vote on it
              return voteModule.vote(vote.proposalId, vote.vote);
            }
            // if the proposal is not open for voting we just return nothing, letting us continue
            return;
          }),
        );

        try {
          // if any of the propsals are ready to be executed we'll need to execute them
          // a proposal is ready to be executed if it is in state 4
          await Promise.all(
            votes.map(async (vote) => {
              // we'll first get the latest state of the proposal again, since we may have just voted before
              const proposal = await voteModule.get(vote.proposalId);

              //if the state is in state 4 (meaning that it is ready to be executed), we'll execute the proposal
              if (proposal.state === 4) {
                toast.info('Execute Sucessfull proposal first');
                return voteModule.execute(vote.proposalId);
              }
            }),
          );
          // if we get here that means we successfully voted, so let's set the "hasVoted" state to true
          setHasVoted(true);
          toast.success('🎉 Successfully execute!');
        } catch (err) {
          toast.error('Failed to execute proposal');
        }
      } catch (err) {
        console.error('failed to vote', err);
        toast.error('Failed to vote');
      }
    } catch (err) {
      console.error('failed to delegate tokens');
      toast.error('Failed to delegate tokens');
    } finally {
      // in *either* case we need to set the isVoting state to false to enable the button again
      setIsVoting(false);
      setTimeout(() => {
        toast.dismiss(toastId);
      }, 3000);
    }
  }

  async function delegate() {
    if (!address || isVoting || hasVoted) {
      return;
    }

    const toastId = address;

    //before we do async things, we want to disable the button to prevent double clicks
    setIsVoting(true);
    toast.info('🔨 Delegating...', { toastId, autoClose: false });

    try {
      //we'll check if the wallet still needs to delegate their tokens before they can vote
      const delegation = await tokenModule.getDelegationOf(address);
      // if the delegation is the 0x0 address that means they have not delegated their governance tokens yet
      if (delegation === ethers.constants.AddressZero) {
        await tokenModule.delegateTo(address);
      }
    } catch (err) {
      console.error('failed to delegate tokens');
      toast.error('Failed to delegate tokens');
    } finally {
      // in *either* case we need to set the isVoting state to false to enable the button again
      setIsVoting(false);
      setTimeout(() => {
        toast.dismiss(toastId);
      }, 3000);
    }
  }

  const delegateState = hasVoted
    ? 'delegated'
    : isVoting
    ? 'delegating'
    : 'delegate';
  const votingState = hasVoted ? 'voted' : isVoting ? 'voting' : 'vote';
  const displayContents =
    hasMetaMask && address && error?.name !== 'UnsupportedChainIdError';

  //make PROPOSAL add member
  const proposalAddNewMember = async () => {
    if (!address) {
      return;
    }
    const toastId = address;
    setIsClaiming(true);
    toast.info('🔨 Proposing...', { toastId, autoClose: false });

    try {
      var desc: any;
      var wallet: any;
      var amount: any;
      if (
        $('#newMemberAddress').val() &&
        $('#newMemberDescription').val() &&
        $('#newMemberAmount').val()
      ) {
        desc = $('#newMemberDescription').val();
        wallet = $('#newMemberAddress').val();
        amount = $('#newMemberAmount').val();
      } else {
        toast.error('Wrong input parameters');
        return;
      }

      const proposalEnd = new Date(
        Date.now() + DAO_PROPOSAL_DURATION,
      ).toString();

      await voteModule.propose(
        desc +
          ' proposal duration, ' +
          proposalEnd +
          ' proposal parameters, wallet: ' +
          wallet +
          ' amount: ' +
          amount.toString(),
        [
          {
            nativeTokenValue: 0,
            transactionData: tokenModule.contract.interface.encodeFunctionData(
              'mint',
              [wallet, ethers.utils.parseUnits(amount.toString(), 18)],
            ),
            toAddress: tokenModule.address,
          },
        ],
      );
      console.log('✅ Successfully created proposal to mint tokens');
    } catch (error) {
      console.error('failed to create first proposal', error);
    } finally {
      setIsClaiming(false);
      setTimeout(() => {
        toast.dismiss(toastId);
      }, 3000);
    }
  };

  //make PROPOSAL voting period
  const proposalNewVotingPeriod = async () => {
    if (!address) {
      return;
    }
    const toastId = address;
    setIsClaiming(true);
    toast.info('🔨 Proposing...', { toastId, autoClose: false });

    try {
      var desc: any;
      var period: any;
      if (
        $('#votingPeriodDuration').val() &&
        $('#votingPeriodDescription').val()
      ) {
        desc = $('#votingPeriodDescription').val();
        period = Number($('#votingPeriodDuration').val());
      } else {
        toast.error('Wrong input parameters');
        return;
      }
      if (period <= 1000 || period > 1000000) {
        toast.error(
          'Period duration ' +
            period +
            ' must be integer between 1000 and 1000000',
        );
        return;
      }
      const proposalEnd = new Date(
        Date.now() + DAO_PROPOSAL_DURATION,
      ).toString();
      console.log(
        desc +
          ' proposal duration, ' +
          proposalEnd +
          ' proposal parameters, voting period: ' +
          period,
      );
      await voteModule.propose(
        desc +
          ' proposal duration, ' +
          proposalEnd +
          ' proposal parameters, voting period: ' +
          period.toString(),
        [
          {
            nativeTokenValue: 0,
            transactionData: voteModule.contract.interface.encodeFunctionData(
              'setVotingPeriod',
              [period],
            ),
            toAddress: voteModule.address,
          },
        ],
      );

      console.log('✅ Successfully created proposal');
    } catch (error) {
      console.error('failed to create first proposal', error);
    } finally {
      setIsClaiming(false);
      setTimeout(() => {
        toast.dismiss(toastId);
      }, 3000);
    }
  };

  //make PROPOSAL voting period
  const proposalEditQuorum = async () => {
    if (!address) {
      return;
    }
    const toastId = address;
    setIsClaiming(true);
    toast.info('🔨 Proposing...', { toastId, autoClose: false });

    try {
      var desc: any;
      var value: any;
      if ($('#editQuorumValue').val() && $('#editQuorumDescription').val()) {
        value = $('#editQuorumValue').val();
        desc = $('#editQuorumDescription').val();
        if (value <= 0 || value > 100) {
          toast.error(
            'Value of quorum ' + value + ' must be integer between 0 and 100',
          );
          return;
        }
      } else {
        toast.error('Wrong input parameters ');
        return;
      }
      const proposalEnd = new Date(
        Date.now() + DAO_PROPOSAL_DURATION,
      ).toString();
      console.log(
        desc +
          ' proposal duration, ' +
          proposalEnd +
          ' proposal parameters, voting period: ' +
          value,
      );
      await voteModule.propose(
        desc +
          ' proposal duration, ' +
          proposalEnd +
          ' proposal parameters, voting period: ' +
          value.toString(),
        [
          {
            nativeTokenValue: 0,
            transactionData: voteModule.contract.interface.encodeFunctionData(
              'setProposalThreshold',
              [value],
            ),
            toAddress: voteModule.address,
          },
        ],
      );

      console.log('✅ Successfully created proposal');
    } catch (error) {
      console.error('failed to create first proposal', error);
    } finally {
      setIsClaiming(false);
      setTimeout(() => {
        toast.dismiss(toastId);
      }, 3000);
    }
  };

  //make PROPOSAL approve erc20
  const proposalapproveERC20 = async () => {
    if (!address) {
      return;
    }
    const toastId = address;
    setIsClaiming(true);
    toast.info('🔨 Proposing...', { toastId, autoClose: false });

    try {
      var desc: any;
      var token: any;
      var amount: any;
      var contractInput: any;

      if (
        $('#approveerc20Contract').val() &&
        $('#approveerc20Description').val() &&
        $('#approveerc20Amount').val()
      ) {
        desc = $('#approveerc20Description').val();
        amount = $('#approveerc20Amount').val();
        contractInput = $('#approveerc20Contract').val();
      } else {
        toast.error('Wrong input parameters');
        return;
      }

      const inputDecimal = await sdk
        .getTokenModule(contractInput)
        .contract.decimals();

      const proposalEnd = new Date(
        Date.now() + DAO_PROPOSAL_DURATION,
      ).toString();
      await voteModule.propose(
        desc +
          ' proposal duration, ' +
          proposalEnd +
          ' proposal parameters, contract: ' +
          contractInput +
          ' amount: ' +
          amount,
        [
          {
            nativeTokenValue: 0,
            transactionData: sdk
              .getTokenModule(contractInput)
              .contract.interface.encodeFunctionData('approve', [
                voteModule.address,
                ethers.utils.parseUnits(amount.toString(), inputDecimal),
              ]),

            toAddress: contractInput,
          },
        ],
      );
      console.log('✅ Successfully created proposal to send tokens');
    } catch (error) {
      console.error('failed to create proposal', error);
    } finally {
      setIsClaiming(false);
      setTimeout(() => {
        toast.dismiss(toastId);
      }, 3000);
    }
  };

  //make PROPOSAL send erc20
  const proposalsendERC20 = async () => {
    if (!address) {
      return;
    }
    const toastId = address;
    setIsClaiming(true);
    toast.info('🔨 Proposing...', { toastId, autoClose: false });

    try {
      var desc: any;
      var wallet: any;
      var amount: any;
      var contractInput: any;

      if (
        $('#senderc20Contract').val() &&
        $('#senderc20Address').val() &&
        $('#senderc20Description').val() &&
        $('#senderc20Amount').val()
      ) {
        desc = $('#senderc20Description').val();
        wallet = $('#senderc20Address').val();
        amount = $('#senderc20Amount').val();
        contractInput = $('#senderc20Contract').val();
      } else {
        toast.error('Wrong input parameters');
        return;
      }

      const inputDecimal = await sdk
        .getTokenModule(contractInput)
        .contract.decimals();

      const walletAmount = await sdk
        .getTokenModule(contractInput)
        .contract.balanceOf(voteModule.address);

      if (inputDecimal && Number(walletAmount) > amount) {
        const proposalEnd = new Date(
          Date.now() + DAO_PROPOSAL_DURATION,
        ).toString();
        await voteModule.propose(
          desc +
            ' proposal duration, ' +
            proposalEnd +
            ' proposal parameters, contract: ' +
            contractInput +
            ' wallet: ' +
            wallet +
            ' amount: ' +
            amount,
          [
            {
              nativeTokenValue: 0,
              transactionData: sdk
                .getTokenModule(contractInput)
                .contract.interface.encodeFunctionData(
                  // We're doing a transfer from the treasury to our wallet.
                  'transfer',
                  [
                    wallet,
                    ethers.utils.parseUnits(amount.toString(), inputDecimal),
                  ],
                ),

              toAddress: contractInput,
            },
          ],
        );
      } else {
        toast.error('Not enough token in the treasury');
        return;
      }
      console.log('✅ Successfully created proposal to send tokens');
    } catch (error) {
      console.error('failed to create proposal', error);
    } finally {
      setIsClaiming(false);
      setTimeout(() => {
        toast.dismiss(toastId);
      }, 3000);
    }
  };

  //make PROPOSAL send erc721
  const proposalsendERC721 = async () => {
    if (!address) {
      return;
    }
    const toastId = address;
    setIsClaiming(true);
    toast.info('🔨 Proposing...', { toastId, autoClose: false });

    try {
      var desc: any;
      var wallet: any;
      var tokenid: any;
      var contractInput: any;

      if (
        $('#senderc721Contract').val() &&
        $('#senderc721Address').val() &&
        $('#senderc721Description').val() &&
        $('#senderc721TokenId').val()
      ) {
        desc = $('#senderc721Description').val();
        wallet = $('#senderc721Address').val();
        tokenid = $('#senderc721TokenId').val();
        contractInput = $('#senderc721Contract').val();
      } else {
        toast.error('Wrong input parameters');
        return;
      }
      const proposalEnd = new Date(
        Date.now() + DAO_PROPOSAL_DURATION,
      ).toString();
      await voteModule.propose(
        desc +
          ' proposal duration, ' +
          proposalEnd +
          ' proposal parameters, contract: ' +
          contractInput +
          ' wallet: ' +
          wallet +
          ' tokenid: ' +
          tokenid,
        [
          {
            // Again, we're sending ourselves 0 ETH. Just sending our own token.
            nativeTokenValue: 0,
            transactionData: sdk
              .getNFTModule(contractInput)
              .contract.interface.encodeFunctionData(
                // We're doing a transfer from the treasury to our wallet.
                'transferFrom',
                [voteModule.address, wallet, tokenid],
              ),
            toAddress: contractInput,
          },
        ],
      );

      console.log('✅ Successfully created proposal to send tokens');
    } catch (error) {
      console.error('failed to create proposal', error);
    } finally {
      setIsClaiming(false);
      setTimeout(() => {
        toast.dismiss(toastId);
      }, 3000);
    }
  };
  const disabled = !address ? { 'aria-disabled': true } : {};

  return (
    <>
      <header
        style={{
          margin: '1rem',
          display: 'grid',
          gap: '0.25rem',
          gridTemplateAreas: '". . wallet" "header header header"',
          placeItems: 'center',
        }}
      >
        <div style={{ gridArea: 'wallet' }}>
          {hasMetaMask ? (
            <Wallet
              connectWallet={() => connectWallet('injected')}
              account={address}
              domainName={domainName}
              avatar={avatar ?? LOGO}
            />
          ) : null}
        </div>
        <div style={{ gridArea: 'header' }}>
          <Header />
        </div>
      </header>

      <main style={{ margin: '24px' }}>
        <ToastContainer />
        {displayContents ? (
          hasClaimedNFT ? (
            <div className="stack">
              <h3 style={{ textAlign: 'center' }}>
                Trusted Landlords Corp. DAO
              </h3>
              <h3
                style={{ padding: '24px', margin: '12px', textAlign: 'center' }}
              >
                <em>
                  <a
                    sx={{
                      borderRadius: '25px',
                      padding: '8px',
                      margin: '4px',
                      textDecoration: 'none',
                      fontWeight: '700',
                      backgroundColor: '#7293c1',
                      color: '#ffbd2e',
                    }}
                    href={'https://snowtrace.io/address/' + VOTE_MODULE_ADDRESS}
                    rel="noreferrer"
                    target="_blank"
                  >
                    {VOTE_MODULE_ADDRESS}
                  </a>
                </em>
              </h3>
              <Grid columns={[3, '1fr 2fr 1fr']}>
                <Box>
                  <Image alt="UFC" src={UFC} />
                </Box>
                <Box style={{ textAlign: 'center' }}>
                  <p>
                    This organisation manage the DAO treasury and the emission
                    of UFC Coin (UFCC) and the UFC Pulsar (UFCPLSR) ERC-20
                    tokens on Avalanche:
                    <em>
                      <a
                        sx={{
                          textDecoration: 'none',
                          fontWeight: '700',
                          color: '#ffbd2e',
                        }}
                        href={
                          'https://snowtrace.io/address/' + TOKEN_MODULE_ADDRESS
                        }
                        rel="noreferrer"
                        target="_blank"
                      >
                        {' '}
                        {TOKEN_MODULE_ADDRESS}
                      </a>
                    </em>
                  </p>
                  <div>
                    <Image
                      alt="DEFAULT_AVATAR"
                      style={{ width: '50%', marginLeft: '25%' }}
                      src={DEFAULT_AVATAR}
                    />
                  </div>
                </Box>
                <Box>
                  <Image alt="TLC" src={TLL} />
                </Box>
              </Grid>

              <div className="stack">
                <h2>Treasury</h2>
                <details className="card" style={{ width: '100%' }}>
                  <summary
                    style={{ fontWeight: 700, userSelect: 'none' }}
                    onClick={() => {
                      loadTreasuryERC20();
                    }}
                  >
                    {' '}
                    {'ERC-20 tokens treasury'}
                  </summary>
                  <table sx={{ width: '100%' }}>
                    <thead>
                      <tr
                        sx={{ '& th': { textAlign: 'left', width: '100vh' } }}
                      >
                        <th>Token</th>
                        <th>Contract</th>
                        <th>Name</th>
                        <th>Symbol</th>
                        <th>Amount</th>
                      </tr>
                    </thead>
                    <tbody id="treasuryTable"></tbody>
                  </table>
                </details>

                <details className="card" style={{ width: '100%' }}>
                  <summary
                    style={{ fontWeight: 700, userSelect: 'none' }}
                    onClick={() => {
                      loadTreasuryERC721();
                    }}
                  >
                    {'ERC-721 NFTs treasury'}
                  </summary>
                  <table sx={{ width: '100%' }}>
                    <thead>
                      <tr
                        sx={{ '& th': { textAlign: 'left', width: '100vh' } }}
                      >
                        <th>Collection</th>
                        <th>Contract</th>
                        <th>Name</th>
                        <th>Amount</th>
                      </tr>
                    </thead>
                    <tbody id="treasuryNFTTable"></tbody>
                  </table>
                </details>

                <details className="card" style={{ width: '100%' }}>
                  <summary
                    style={{ fontWeight: 700, userSelect: 'none' }}
                    onClick={() => {
                      loadTreasuryERC1155();
                    }}
                  >
                    {'ERC-1155 Editions treasury'}
                  </summary>
                  <table sx={{ width: '100%' }}>
                    <thead>
                      <tr
                        sx={{ '& th': { textAlign: 'left', width: '100vh' } }}
                      >
                        <th>Collection</th>
                        <th>Contract</th>
                        <th>Name</th>
                        <th>Image</th>
                        <th>TokenId</th>
                        <th>Amount</th>
                      </tr>
                    </thead>
                    <tbody id="treasuryEditionTable"></tbody>
                  </table>
                </details>
              </div>

              <DaoMembers members={memberList} />

              <div className="stack" aria-live="polite">
                <h2>New Proposals</h2>
                <form
                  className="stack"
                  onSubmit={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                  }}
                >
                  <details className="card" style={{ width: '100%' }}>
                    <summary style={{ fontWeight: 700, userSelect: 'none' }}>
                      {'Add New member in the DAO'}
                    </summary>
                    {
                      <fieldset
                        style={{
                          display: 'flex',
                          gap: '0.5rem',
                          border: 'none',
                        }}
                        {...disabled}
                      >
                        <legend>
                          {'Proposal to mint new token to a wallet address:'}
                        </legend>
                        <label
                          style={{ width: '100%' }}
                          htmlFor={'proposalTypes'}
                        >
                          <textarea
                            style={{
                              width: '100%',
                              margin: '6px',
                              padding: '6px',
                            }}
                            id={'newMemberDescription'}
                            placeholder={'Proposal Description'}
                          />
                          <input
                            style={{
                              width: '100%',
                              margin: '6px',
                              padding: '6px',
                            }}
                            type="text"
                            id={'newMemberAddress'}
                            placeholder={'New member address'}
                          />
                          <input
                            style={{
                              width: '100%',
                              margin: '6px',
                              padding: '6px',
                            }}
                            type="number"
                            id={'newMemberAmount'}
                            placeholder={'ERC-20 token amount'}
                          />
                          <Button
                            onClick={() =>
                              !isClaiming && proposalAddNewMember()
                            }
                            style={{
                              width: '100%',
                              margin: '6px',
                              padding: '6px',
                            }}
                          >
                            {isClaiming ? 'Proposing...' : `Make the Proposal`}
                          </Button>
                        </label>
                      </fieldset>
                    }
                  </details>

                  <details className="card" style={{ width: '100%' }}>
                    <summary style={{ fontWeight: 700, userSelect: 'none' }}>
                      {'Modify voting period duration of the DAO'}
                    </summary>
                    {
                      <fieldset
                        style={{
                          display: 'flex',
                          gap: '0.5rem',
                          border: 'none',
                        }}
                        {...disabled}
                      >
                        <legend>
                          {'Proposal to change the voting period of the DAO:'}
                        </legend>
                        <label
                          style={{ width: '100%' }}
                          htmlFor={'proposalTypes'}
                        >
                          <textarea
                            style={{
                              width: '100%',
                              margin: '6px',
                              padding: '6px',
                            }}
                            id={'votingPeriodDescription'}
                            placeholder={'Proposal Description'}
                          />
                          <input
                            style={{
                              width: '100%',
                              margin: '6px',
                              padding: '6px',
                            }}
                            type="number"
                            id={'votingPeriodDuration'}
                            placeholder={
                              'Voting period in block (~2 sec on Avalanche)'
                            }
                          />
                          <Button
                            onClick={() =>
                              !isClaiming && proposalNewVotingPeriod()
                            }
                            style={{
                              width: '100%',
                              margin: '6px',
                              padding: '6px',
                            }}
                          >
                            {isClaiming ? 'Proposing...' : `Make the Proposal`}
                          </Button>
                        </label>
                      </fieldset>
                    }
                  </details>

                  <details className="card" style={{ width: '100%' }}>
                    <summary style={{ fontWeight: 700, userSelect: 'none' }}>
                      {'Modify quorum pourcent of the DAO'}
                    </summary>
                    {
                      <fieldset
                        style={{
                          display: 'flex',
                          gap: '0.5rem',
                          border: 'none',
                        }}
                        {...disabled}
                      >
                        <legend>
                          {
                            'Proposal to change the approval treshold to accept proposal in the DAO:'
                          }
                        </legend>
                        <label
                          style={{ width: '100%' }}
                          htmlFor={'proposalTypes'}
                        >
                          <textarea
                            style={{
                              width: '100%',
                              margin: '6px',
                              padding: '6px',
                            }}
                            id={'editQuorumDescription'}
                            placeholder={'Proposal Description'}
                          />
                          <input
                            style={{
                              width: '100%',
                              margin: '6px',
                              padding: '6px',
                            }}
                            type="number"
                            id={'editQuorumValue'}
                            placeholder={
                              'Proposal approval threshold quorum (between 1 and 100)'
                            }
                          />
                          <Button
                            onClick={() => !isClaiming && proposalEditQuorum()}
                            style={{
                              width: '100%',
                              margin: '6px',
                              padding: '6px',
                            }}
                          >
                            {isClaiming ? 'Proposing...' : `Make the Proposal`}
                          </Button>
                        </label>
                      </fieldset>
                    }
                  </details>

                  <details className="card" style={{ width: '100%' }}>
                    <summary style={{ fontWeight: 700, userSelect: 'none' }}>
                      {'Approve ERC-20 with DAO treasury'}
                    </summary>
                    {
                      <fieldset
                        style={{
                          display: 'flex',
                          gap: '0.5rem',
                          border: 'none',
                        }}
                        {...disabled}
                      >
                        <legend>
                          {'Proposal to approve token with treasury wallet:'}
                        </legend>
                        <label
                          style={{ width: '100%' }}
                          htmlFor={'proposalTypes'}
                        >
                          <textarea
                            style={{
                              width: '100%',
                              margin: '6px',
                              padding: '6px',
                            }}
                            id={'approveerc20Description'}
                            placeholder={'Proposal Description'}
                          />
                          <input
                            style={{
                              width: '100%',
                              margin: '6px',
                              padding: '6px',
                            }}
                            type="text"
                            id={'approveerc20Contract'}
                            placeholder={'Token contract'}
                          />
                          <input
                            style={{
                              width: '100%',
                              margin: '6px',
                              padding: '6px',
                            }}
                            type="number"
                            id={'approveerc20Amount'}
                            placeholder={'ERC-20 token amount'}
                          />
                          <Button
                            onClick={() =>
                              !isClaiming && proposalapproveERC20()
                            }
                            style={{
                              width: '100%',
                              margin: '6px',
                              padding: '6px',
                            }}
                          >
                            {isClaiming ? 'Proposing...' : `Make the Proposal`}
                          </Button>
                        </label>
                      </fieldset>
                    }
                  </details>

                  <details className="card" style={{ width: '100%' }}>
                    <summary style={{ fontWeight: 700, userSelect: 'none' }}>
                      {'Send ERC-20 token from DAO treasury'}
                    </summary>
                    {
                      <fieldset
                        style={{
                          display: 'flex',
                          gap: '0.5rem',
                          border: 'none',
                        }}
                        {...disabled}
                      >
                        <legend>
                          {
                            'Proposal to send token from the treasury to a wallet:'
                          }
                        </legend>
                        <label
                          style={{ width: '100%' }}
                          htmlFor={'proposalTypes'}
                        >
                          <textarea
                            style={{
                              width: '100%',
                              margin: '6px',
                              padding: '6px',
                            }}
                            id={'senderc20Description'}
                            placeholder={'Proposal Description'}
                          />
                          <input
                            style={{
                              width: '100%',
                              margin: '6px',
                              padding: '6px',
                            }}
                            type="text"
                            id={'senderc20Contract'}
                            placeholder={'Token contract'}
                          />
                          <input
                            style={{
                              width: '100%',
                              margin: '6px',
                              padding: '6px',
                            }}
                            type="text"
                            id={'senderc20Address'}
                            placeholder={'Receiver address'}
                          />
                          <input
                            style={{
                              width: '100%',
                              margin: '6px',
                              padding: '6px',
                            }}
                            type="number"
                            id={'senderc20Amount'}
                            placeholder={'ERC-20 token amount'}
                          />
                          <Button
                            onClick={() => !isClaiming && proposalsendERC20()}
                            style={{
                              width: '100%',
                              margin: '6px',
                              padding: '6px',
                            }}
                          >
                            {isClaiming ? 'Proposing...' : `Make the Proposal`}
                          </Button>
                        </label>
                      </fieldset>
                    }
                  </details>

                  <details className="card" style={{ width: '100%' }}>
                    <summary style={{ fontWeight: 700, userSelect: 'none' }}>
                      {'Send ERC-721 NFTs from DAO treasury'}
                    </summary>
                    {
                      <fieldset
                        style={{
                          display: 'flex',
                          gap: '0.5rem',
                          border: 'none',
                        }}
                        {...disabled}
                      >
                        <legend>
                          {
                            'Proposal to send NFT from the treasury to a wallet:'
                          }
                        </legend>
                        <label
                          style={{ width: '100%' }}
                          htmlFor={'proposalTypes'}
                        >
                          <textarea
                            style={{
                              width: '100%',
                              margin: '6px',
                              padding: '6px',
                            }}
                            id={'senderc721Description'}
                            placeholder={'Proposal Description'}
                          />
                          <input
                            style={{
                              width: '100%',
                              margin: '6px',
                              padding: '6px',
                            }}
                            type="text"
                            id={'senderc721Contract'}
                            placeholder={'Token contract'}
                          />
                          <input
                            style={{
                              width: '100%',
                              margin: '6px',
                              padding: '6px',
                            }}
                            type="text"
                            id={'senderc721Address'}
                            placeholder={'Receiver address'}
                          />
                          <input
                            style={{
                              width: '100%',
                              margin: '6px',
                              padding: '6px',
                            }}
                            type="number"
                            id={'senderc721TokenId'}
                            placeholder={'ERC-721 token id'}
                          />
                          <Button
                            onClick={() => !isClaiming && proposalsendERC721()}
                            style={{
                              width: '100%',
                              margin: '6px',
                              padding: '6px',
                            }}
                          >
                            {isClaiming ? 'Proposing...' : `Make the Proposal`}
                          </Button>
                        </label>
                      </fieldset>
                    }
                  </details>
                </form>
                <div sx={{ marginTop: '16px' }}>
                  <span sx={{ width: '100%' }}>
                    <Button
                      {...disabled}
                      onClick={() => !isClaiming && delegate()}
                      sx={{ width: '100%' }}
                    >
                      {getSubmitButtonText(delegateState)}
                    </Button>
                    To make proposals you need to have at least 1000 UFCC. Click
                    "Delegate" button to delegate (to do once).
                  </span>
                </div>
              </div>

              <DaoProposals
                proposals={proposals}
                vote={vote}
                votingState={votingState}
              />

              {DEXCard}
              {UFCPLSRcard}
              {RPCCard}
              {NFTMarketplaceCard}
            </div>
          ) : (
            <div>
              {PSCUcard}
              {DEXCard}
              {UFCPLSRcard}
              <div className="card" sx={{ marginTop: '24px' }}>
                <Grid gap={2} columns={[2, '1fr 5fr']}>
                  <Box>
                    <img src="assets/avax385.png" sx={{ width: '100%' }}></img>
                  </Box>
                  <Box>
                    <p>
                      To join on AVAX-385, the Genesis Blood Bassin 4x4 LS land
                      mint this Edition NFT. This Truested Landlords Concession
                      have $PLSR 5000 as assets and give the right to mine
                      Pulsar, Mineral, Gaz and Organic on the land. The DAO
                      treasury is managerd by the holders of UFC Coin (UFCC)
                      tokens. The DAO have a quorum of 60% and each proposal is
                      active for 48 hours.
                    </p>
                    <div sx={{ textAlign: 'center' }}>
                      <Button
                        sx={{ height: '50px', marginTop: '24px' }}
                        onClick={() => {
                          embedDiv(
                            'https://embed.ipfscdn.io/ipfs/bafybeigdie2yyiazou7grjowoevmuip6akk33nqb55vrpezqdwfssrxyfy/erc1155.html?contract=0x104F6A41d1BEe512D958FA2E7709Df6d45A36aC9&chain=%7B%22name%22%3A%22Avalanche+C-Chain%22%2C%22chain%22%3A%22AVAX%22%2C%22rpc%22%3A%5B%22https%3A%2F%2F43114.rpc.thirdweb.com%2F%24%7BTHIRDWEB_API_KEY%7D%22%5D%2C%22nativeCurrency%22%3A%7B%22name%22%3A%22Avalanche%22%2C%22symbol%22%3A%22AVAX%22%2C%22decimals%22%3A18%7D%2C%22shortName%22%3A%22avax%22%2C%22chainId%22%3A43114%2C%22testnet%22%3Afalse%2C%22slug%22%3A%22avalanche%22%2C%22icon%22%3A%7B%22url%22%3A%22ipfs%3A%2F%2FQmcxZHpyJa8T4i63xqjPYrZ6tKrt55tZJpbXcjSDKuKaf9%2Favalanche%2F512.png%22%2C%22width%22%3A512%2C%22height%22%3A512%2C%22format%22%3A%22png%22%7D%7D&clientId=20a005c403f089b6b726937429862c33&tokenId=0&theme=dark&primaryColor=orange',
                          );
                          verifyNFT();
                          $('html, body').animate(
                            { scrollTop: $(document).height() },
                            1000,
                          );
                        }}
                      >
                        {`Trusted Landlords Concession ERC-1155 NFT`}
                      </Button>
                    </div>
                  </Box>
                </Grid>
              </div>
              {RPCCard}
              {NFTMarketplaceCard}
            </div>
          )
        ) : (
          ////Not connected User
          <div>
            <div className="card" sx={{ textAlign: 'center' }}>
              <Box>
                <p>
                  Welcome in the <em>Pulsar Star Corporation United</em>. To
                  join this{' '}
                  <a
                    href="https://pulsar.game"
                    target="_blank"
                    rel="noreferrer"
                    sx={{ textDecoration: 'none' }}
                  >
                    Pulsar
                  </a>{' '}
                  community reach us on{' '}
                  <a
                    href="https://discord.gg/dq2PaMmDbm"
                    target="_blank"
                    rel="noreferrer"
                    sx={{ textDecoration: 'none' }}
                  >
                    Discord
                  </a>
                  .
                </p>
              </Box>
              <Box
                sx={{
                  display: 'inline',
                }}
              >
                <iframe
                  title="Jibekn Pulsar introduction"
                  allow="clipboard-write; encrypted-media; picture-in-picture; web-share"
                  referrerPolicy="strict-origin-when-cross-origin"
                  allowFullScreen
                  sx={{
                    padding: '24px',
                    width: '100%',
                    minHeight: '450px',
                    height: '100%',
                  }}
                  frameBorder="0"
                  src="https://www.youtube.com/embed/RlyuiCjE1G8?si=TV-v72lLGjV5NjkH"
                />
              </Box>{' '}
              <p>
                <a
                  href="https://www.youtube.com/@jibekn2950"
                  target="_blank"
                  rel="noreferrer"
                  sx={{ textDecoration: 'none' }}
                >
                  Pulsar MMORTS betatest gameplay, October 2024, by Jibekn
                </a>
              </p>
            </div>

            {PSCUcard}
            {DEXCard}
            {UFCPLSRcard}
            {RPCCard}
            {NFTMarketplaceCard}
          </div>
        )}
        <div sx={{ marginTop: '32px' }} id="embedDiv"></div>
        {embedDivObj}
      </main>
      <Footer />
    </>
  );
};

export default Home;
