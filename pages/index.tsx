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
import { Image, Grid, Box, Link } from 'theme-ui';

const DAO_PROPOSAL_DURATION = 172800000;

if (
  !process.env.REACT_APP_PRIVATE_KEY ||
  process.env.REACT_APP_PRIVATE_KEY == ''
) {
  console.log('🛑 Private key not found.');
  process.env.REACT_APP_PRIVATE_KEY = '';
}

if (
  !process.env.REACT_APP_PRIVATE_KEY ||
  process.env.REACT_APP_PRIVATE_KEY == ''
) {
  console.log('🛑 Alchemy API URL not found.');
}

if (
  !process.env.REACT_APP_DEFAUT_DAO_MEMBERS ||
  process.env.REACT_APP_DEFAUT_DAO_MEMBERS == ''
) {
  console.log('🛑 Wallet Address not found.');
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
const TLL = '/assets/0.pscu-lldao.png';
const UFC = '/assets/0.ufc.png';

//////get vote treasury balanace of selected tokens
var erc20treasturystate = false;
var erc721treasturystate = false;
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
          '</a></img></div></td><td>' +
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

const Home: NextPage = () => {
  const { connectWallet, address, avatar, domainName, error, provider } =
    useWeb3WithEns();

  const [hasClaimedNFT, setHasClaimedNFT] = useState(false);

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
            Get shares from the mining fee from the community Genesis Lands tax
            in $PLSR and help us to grow. Drop UFCPLSR tokens and we will use
            the income from the sale to mint more Genesis lands NFT from the
            Pulsar game shop.
          </p>
          <div sx={{ textAlign: 'center' }}>
            <Button
              sx={{ height: '50px', marginTop: '100px' }}
              onClick={() => {
                embedDropUFCPLSR();
              }}
            >
              {`UFC Pulsar Drop ERC-20 tokens`}
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
          <img src="assets/logo.png" sx={{ width: '100%' }}></img>
        </Box>
        <Box>
          <p>
            To become a premium member of the community you need to mint this
            NFT token. Then you will have access to our ecosystem and you will
            be able to invest in our lands. In addition of your corporation
            claim token NFT, you will receive 60 MATIC as airdrop of game NFT of
            your choice and you will be able to buy Corporations Claim
            Concession NFT in our network on Polygon and Avalanche , the UFC Hat
            software license NFT and moderation right over the discord server.
            In addition with this NFT you will get 83 unique items of game
            avatars.
          </p>
          <div sx={{ textAlign: 'center' }}>
            <Button
              sx={{ height: '50px', marginTop: '100px' }}
              onClick={() => {
                window.open(
                  'https://opensea.io/collection/pulsar-star-corporation-united-matic/overview',
                  '_blank',
                );
              }}
            >
              {'Pulsar Star Corporations United ERC-721 NFT'}
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
          console.log('🌟 this user has a membership NFT!');
        } else {
          console.log("😭 this user doesn't have a membership NFT.");
        }
      })
      .catch((error) => {
        console.error('failed to nft balance', error);
        toast.error('Failed to get NFT balance');
      });

    if (!hasClaimedNFT) {
      setTimeout(() => {
        verifyNFT();
      }, 10000);
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
          console.log('🌟 this user has a membership NFT!');
        } else {
          setHasClaimedNFT(false);
          console.log("😭 this user doesn't have a membership NFT.");
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
        console.error('failed to get proposals', err);
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

  const embedEditionDropTL = async () => {
    setIsClaiming(true);
    return $('#embedDiv').html(
      '<iframe src="https://embed.ipfscdn.io/ipfs/bafybeigdie2yyiazou7grjowoevmuip6akk33nqb55vrpezqdwfssrxyfy/erc1155.html?contract=0x104F6A41d1BEe512D958FA2E7709Df6d45A36aC9&chain=%7B%22name%22%3A%22Avalanche+C-Chain%22%2C%22chain%22%3A%22AVAX%22%2C%22rpc%22%3A%5B%22https%3A%2F%2F43114.rpc.thirdweb.com%2F%24%7BTHIRDWEB_API_KEY%7D%22%5D%2C%22nativeCurrency%22%3A%7B%22name%22%3A%22Avalanche%22%2C%22symbol%22%3A%22AVAX%22%2C%22decimals%22%3A18%7D%2C%22shortName%22%3A%22avax%22%2C%22chainId%22%3A43114%2C%22testnet%22%3Afalse%2C%22slug%22%3A%22avalanche%22%2C%22icon%22%3A%7B%22url%22%3A%22ipfs%3A%2F%2FQmcxZHpyJa8T4i63xqjPYrZ6tKrt55tZJpbXcjSDKuKaf9%2Favalanche%2F512.png%22%2C%22width%22%3A512%2C%22height%22%3A512%2C%22format%22%3A%22png%22%7D%7D&clientId=20a005c403f089b6b726937429862c33&tokenId=0&theme=dark&primaryColor=orange" width="100%" height="600px" style="max-width:100%;" frameborder="0"></iframe>',
    );
  };
  const embedDropUFCPLSR = async () => {
    setIsClaiming(true);
    return $('#embedDiv').html(
      '<iframe src="https://embed.ipfscdn.io/ipfs/bafybeigdie2yyiazou7grjowoevmuip6akk33nqb55vrpezqdwfssrxyfy/erc20.html?contract=0x7A6bF020161dEab23913ccFa5bE43aD37AEB6CA8&chain=%7B%22name%22%3A%22Avalanche+C-Chain%22%2C%22chain%22%3A%22AVAX%22%2C%22rpc%22%3A%5B%22https%3A%2F%2F43114.rpc.thirdweb.com%2F%24%7BTHIRDWEB_API_KEY%7D%22%5D%2C%22nativeCurrency%22%3A%7B%22name%22%3A%22Avalanche%22%2C%22symbol%22%3A%22AVAX%22%2C%22decimals%22%3A18%7D%2C%22shortName%22%3A%22avax%22%2C%22chainId%22%3A43114%2C%22testnet%22%3Afalse%2C%22slug%22%3A%22avalanche%22%2C%22icon%22%3A%7B%22url%22%3A%22ipfs%3A%2F%2FQmcxZHpyJa8T4i63xqjPYrZ6tKrt55tZJpbXcjSDKuKaf9%2Favalanche%2F512.png%22%2C%22width%22%3A512%2C%22height%22%3A512%2C%22format%22%3A%22png%22%7D%7D&clientId=20a005c403f089b6b726937429862c33&theme=dark&primaryColor=red"  width="100%"    height="600px"    style="max-width:100%;"    frameborder="0"></iframe>',
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
                return voteModule.execute(vote.proposalId);
              }
            }),
          );
          // if we get here that means we successfully voted, so let's set the "hasVoted" state to true
          setHasVoted(true);
          // and log out a success message
          console.log('successfully voted');
          toast.success('🎉 Successfully voted!');
        } catch (err) {
          console.error('failed to execute votes', err);
          toast.error('Failed to execute votes');
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

  //make PROPOSAL Button function
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
          amount,
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
                [wallet, ethers.utils.parseUnits(amount.toString(), 18)],
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
              .getDropModule(contractInput)
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
                    {'ERC-721 NFTs collections treasury'}
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

              {UFCPLSRcard}
            </div>
          ) : (
            <div>
              {PSCUcard}

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
                      treasury is managerd by the holders of {UFCCICON} UFC Coin
                      tokens. The DAO have a quorum of 60% and each proposal is
                      active for 48 hours.
                    </p>
                    <div sx={{ textAlign: 'center' }}>
                      <Button
                        sx={{ height: '50px', marginTop: '100px' }}
                        onClick={() => {
                          embedEditionDropTL();
                          verifyNFT();
                        }}
                      >
                        {`Trusted Landlords Concession ERC-1155 NFT`}
                      </Button>
                    </div>
                  </Box>
                </Grid>
              </div>

              {UFCPLSRcard}
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
                  >
                    Pulsar
                  </a>{' '}
                  community reach us on{' '}
                  <a
                    href="https://discord.gg/dq2PaMmDbm"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Discord
                  </a>
                  .
                </p>
              </Box>
              <div>{dungeonVideo}</div>
              <p>
                Unlocking dungeon lvl 200 during the Pulsar betatest, in may
                2024, with the best players of Pulsar. EagleRising, CryptoCoop,
                Rrose and StarCorps !
              </p>
            </div>

            {PSCUcard}

            {UFCPLSRcard}
          </div>
        )}
        <div sx={{ marginTop: '32px' }} id="embedDiv"></div>
      </main>
      <Footer />
    </>
  );
};

const dungeonVideo = (
  <video
    controls
    sx={{
      width: '100%',
      height: '100%',
      marginTop: '32px',
    }}
  >
    {' '}
    <source src="dungeonrun.mp4" type="video/mp4"></source>
    {'Pulsar Star Corporations United community ERC-721 NFT'}
  </video>
);

export default Home;
