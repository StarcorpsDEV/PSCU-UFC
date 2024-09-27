import type { NextPage } from 'next';
import $ from 'jquery'
import { Header } from '@components/Header';
import { Wallet } from '@components/Wallet';
import { useWeb3WithEns } from 'utilities/hooks';
import { Proposal, ThirdwebSDK } from '@3rdweb/sdk';
import {
  BUNDLE_DROP_ADDRESS,
  TOKEN_MODULE_ADDRESS,
  VOTE_MODULE_ADDRESS,
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
import { Radio, Image, Grid, Box } from 'theme-ui';

if (!process.env.REACT_APP_PRIVATE_KEY || process.env.REACT_APP_PRIVATE_KEY == '') {
  console.log('🛑 Private key not found.');
  process.env.REACT_APP_PRIVATE_KEY=""
}

if (!process.env.REACT_APP_PRIVATE_KEY || process.env.REACT_APP_PRIVATE_KEY == '') {
  console.log('🛑 Alchemy API URL not found.');
}

if (!process.env.REACT_APP_DEFAUT_DAO_MEMBERS || process.env.REACT_APP_DEFAUT_DAO_MEMBERS == '') {
  console.log('🛑 Wallet Address not found.');
}

const sdk = new ThirdwebSDK(
  new ethers.Wallet(
    process.env.REACT_APP_PRIVATE_KEY,
    ethers.getDefaultProvider(process.env.REACT_APP_ALCHEMY_API_URL),
  )
);

// Grab a reference to our ERC-1155 contract.
const bundleDropModule = sdk.getBundleDropModule(BUNDLE_DROP_ADDRESS);
const tokenModule = sdk.getTokenModule(TOKEN_MODULE_ADDRESS);
const voteModule = sdk.getVoteModule(VOTE_MODULE_ADDRESS);

const DEFAULT_AVATAR = '/assets/0.webp';
const LOGO = '/assets/logo.png';
const TLL = '/assets/0.pscu-lldao.png';
const UFC = '/assets/0.ufc.png';

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

  

  async function verifyNFT () {
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
    
    if(!hasClaimedNFT){
      setTimeout( () => {
        verifyNFT()
      }, 10000)
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
        if(addr.length === 0){
          const members : string[] = JSON.parse(typeof(process.env.REACT_APP_DEFAUT_DAO_MEMBERS) === "string" ? process.env.REACT_APP_DEFAUT_DAO_MEMBERS : "");
          setMemberAddresses(members);
        }else{
          const members = addr
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


const embedMintNFt = async () => {
  setIsClaiming(true);
  return $("#embedMintNFt").html('<iframe src="https://embed.ipfscdn.io/ipfs/bafybeigdie2yyiazou7grjowoevmuip6akk33nqb55vrpezqdwfssrxyfy/erc1155.html?contract=0x104F6A41d1BEe512D958FA2E7709Df6d45A36aC9&chain=%7B%22name%22%3A%22Avalanche+C-Chain%22%2C%22chain%22%3A%22AVAX%22%2C%22rpc%22%3A%5B%22https%3A%2F%2F43114.rpc.thirdweb.com%2F%24%7BTHIRDWEB_API_KEY%7D%22%5D%2C%22nativeCurrency%22%3A%7B%22name%22%3A%22Avalanche%22%2C%22symbol%22%3A%22AVAX%22%2C%22decimals%22%3A18%7D%2C%22shortName%22%3A%22avax%22%2C%22chainId%22%3A43114%2C%22testnet%22%3Afalse%2C%22slug%22%3A%22avalanche%22%2C%22icon%22%3A%7B%22url%22%3A%22ipfs%3A%2F%2FQmcxZHpyJa8T4i63xqjPYrZ6tKrt55tZJpbXcjSDKuKaf9%2Favalanche%2F512.png%22%2C%22width%22%3A512%2C%22height%22%3A512%2C%22format%22%3A%22png%22%7D%7D&clientId=20a005c403f089b6b726937429862c33&tokenId=0&theme=dark&primaryColor=purple" width="600px" height="600px" style="max-width:100%;" frameborder="0"></iframe>'
)
}


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
      toast.dismiss(toastId);
    }
  }

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
      var desc : any;
      var wallet : any;
      var amount : any;
      // Create proposal to mint 420,000 new token to the treasury.
      if($("#newMemberAddress").val() && $("#newMemberDescription").val() && $("#newMemberAmount").val()){
       desc = $("#newMemberDescription").val()
       wallet = $("#newMemberAddress").val()
       amount = $("#newMemberAmount").val()
      }else{
        console.log("error")
        return
      }
      await voteModule.propose(
        desc + "Proposal parameters, wallet: " +wallet + " amount: "+ amount,
      [
      {
      nativeTokenValue: 0,
      transactionData: tokenModule.contract.interface.encodeFunctionData(
        'mint',
        [
          wallet,
          ethers.utils.parseUnits(amount.toString(), 18),
        ],
      ),
      toAddress: tokenModule.address,
      },
      ],
      );

      console.log('✅ Successfully created proposal to mint tokens');
      } catch (error) {
      console.error('failed to create first proposal', error);
      }finally {
        setIsClaiming(false);
        toast.dismiss(toastId);
      }
}



  //make PROPOSAL Button function
  const proposalsendERC20 = async () => {
    if (!address) {
      return;
    }
    const toastId = address;
    setIsClaiming(true);
    toast.info('🔨 Proposing...', { toastId, autoClose: false });

    try {
      var desc : any;
      var wallet : any;
      var amount : any;
      var contractInput : any;

      if($("#senderc20Contract").val() && $("#senderc20Address").val() && $("#senderc20Description").val() && $("#senderc20Amount").val()){
       desc = $("#senderc20Description").val()
       wallet = $("#senderc20Address").val()
       amount = $("#senderc20Amount").val()
       contractInput = $("#senderc20Contract").val()
      }else{
        console.log("error")
        return
      }
      await voteModule.propose(
        desc + "Proposal parameters, contract: " + contractInput + " wallet: " +wallet + " amount: "+ amount,
        [
        {
          // Again, we're sending ourselves 0 ETH. Just sending our own token.
          nativeTokenValue: 0,
          transactionData: sdk.getTokenModule(contractInput).contract.interface.encodeFunctionData(
            // We're doing a transfer from the treasury to our wallet.
            'transfer',
            [
              wallet,
              ethers.utils.parseUnits(amount.toString(), 18),
            ],
          ),

          toAddress: contractInput,
        },
      ],
      );

      console.log('✅ Successfully created proposal to send tokens');
      } catch (error) {
      console.error('failed to create proposal', error);
      }finally {
        setIsClaiming(false);
        toast.dismiss(toastId);
      }
}

  //make PROPOSAL Button function
  const proposalsendERC721  = async () => {
    if (!address) {
      return;
    }
    const toastId = address;
    setIsClaiming(true);
    toast.info('🔨 Proposing...', { toastId, autoClose: false });

    try {
      var desc : any;
      var wallet : any;
      var tokenid : any;
      var contractInput : any;

      if($("#senderc721Contract").val() && $("#senderc721Address").val() && $("#senderc721Description").val() && $("#senderc721TokenId").val()){
       desc = $("#senderc721Description").val()
       wallet = $("#senderc721Address").val()
       tokenid = $("#senderc721TokenId").val()
       contractInput = $("#senderc721Contract").val()
      }else{
        console.log("error")
        return
      }
      await voteModule.propose(
      desc + "Proposal parameters, contract: " + contractInput + " wallet: " +wallet + " tokenid: "+ tokenid,
      [
        {
          // Again, we're sending ourselves 0 ETH. Just sending our own token.
          nativeTokenValue: 0,
          transactionData: sdk.getDropModule(contractInput).contract.interface.encodeFunctionData(
            // We're doing a transfer from the treasury to our wallet.
            'transferFrom',
            [
              voteModule.address,
              wallet,
              tokenid
            ],
          ),
          toAddress: contractInput,
        },
      ],
      );

      console.log('✅ Successfully created proposal to send tokens');
      } catch (error) {
      console.error('failed to create proposal', error);
      }finally {
        setIsClaiming(false);
        toast.dismiss(toastId);
      }
}
const disabled = !address ? { 'aria-disabled': true } : {};

  return (
    <>
      <header
        sx={{
          margin: '1rem',
          display: 'grid',
          gap: '0.25rem',
          gridTemplateAreas: '". . wallet" "header header header"',
          placeItems: 'center',
        }}
      >
        <div sx={{ gridArea: 'wallet' }}>
          {hasMetaMask ? (
            <Wallet
              connectWallet={() => connectWallet('injected')}
              account={address}
              domainName={domainName}
              avatar={avatar ?? LOGO}
            />
          ) : null}
        </div>
        <div sx={{ gridArea: 'header' }}>
          <Header />
        </div>
      </header>

      <main sx={{ margin: '24px' }}>
        <ToastContainer />
        {displayContents ? (
          hasClaimedNFT ? (
            <div className="stack">
              <h2 sx={{textAlign:"center"}}>Trusted Landlords - DAO</h2>
              <h3 sx={{padding:"24px", margin:"12px", textAlign:"center"}}>
                    <em>
                      <a sx={{borderRadius:"25px", padding:"8px", margin:"4px", textDecoration:"none", fontWeight:"900", backgroundColor:"#7293c1", color:"#ffbd2e"}} href={"https://snowtrace.io/address/"+VOTE_MODULE_ADDRESS} target="_blank">{VOTE_MODULE_ADDRESS}
                      </a>
                    </em>
                  </h3>
              <Grid columns={[3,"1fr 2fr 1fr"]}>
                <Box>
                  <Image alt="UFC" src={UFC} />
                </Box>
                <Box sx={{textAlign:"center"}}>
                  <p>
                  To join the PSCU contact us on the community Discord.
                  This organisation manage the emission of UFC Coin (UFCC):
                  <em>
                    <a sx={{textDecoration:"none", fontWeight:"700", color:"#ffbd2e"}} href={"https://snowtrace.io/address/"+TOKEN_MODULE_ADDRESS} target="_blank"> {TOKEN_MODULE_ADDRESS}</a>
                  </em>
                </p>
                <div>
                  <Image alt="DEFAULT_AVATAR" sx={{width:"50%", marginLeft:"25%"}} src={DEFAULT_AVATAR}/>
                </div>
                </Box>
                <Box>
                  <Image alt="TLC" src={TLL}/>
                </Box>
              </Grid>
              
              <DaoMembers members={memberList}/>

          <div className="stack" aria-live="polite">
          <h2>New Proposals</h2>
          <form
            className="stack"
            onSubmit={(event) => {
              event.preventDefault();
              event.stopPropagation();
            }}
          >
          <details className="card" sx={{width:"100%"}}>
                <summary sx={{ fontWeight: 700, userSelect: 'none' }}>
                  {"Add New member in the DAO"}
                </summary>
                {
                  <fieldset
                    sx={{
                      display: 'flex',
                      gap: '0.5rem',
                      border: 'none',
                    }}
                    {...disabled}
                  >

                    <legend>{ "Proposal to mint new token to a wallet address" }</legend>
                      <label
                        sx={{width:"100%"}}
                        htmlFor={"proposalTypes"}
                      >
                        <textarea
                        sx={{width:"100%", margin:"6px", padding:"6px"}}
                        id={"newMemberDescription"}
                            placeholder={"Proposal Description"}
                        />
                        <input
                        sx={{width:"100%", margin:"6px", padding:"6px"}}
                        type="text"
                        id={"newMemberAddress"}
                        placeholder={"New member address"}
                        />
                        <input
                        sx={{width:"100%", margin:"6px", padding:"6px"}}
                        type="number"
                        id={"newMemberAmount"}
                        placeholder={"ERC-20 token amount"}
                        />
                      <Button onClick={ () => !isClaiming && proposalAddNewMember() } 
                        sx={{width:"100%", margin:"6px", padding:"6px"}}
                        >
                      {isClaiming ? 'Proposing...' : `Make the Proposal`}
                      </Button>
                      </label>
                  </fieldset>
                }            
              </details>

              <details className="card" sx={{width:"100%"}}>
                <summary sx={{ fontWeight: 700, userSelect: 'none' }}>
                  {"Send ERC-20 token from DAO treasury"}
                </summary>
                {
                  <fieldset
                    sx={{
                      display: 'flex',
                      gap: '0.5rem',
                      border: 'none',
                    }}
                    {...disabled}
                  >

                    <legend>{ "Proposal to send token from the treasury to a wallet" }</legend>
                      <label
                        sx={{width:"100%"}}
                        htmlFor={"proposalTypes"}
                      >
                        <textarea
                        sx={{width:"100%", margin:"6px", padding:"6px"}}
                        id={"senderc20Description"}
                            placeholder={"Proposal Description"}
                        />
                        <input
                        sx={{width:"100%", margin:"6px", padding:"6px"}}
                        type="text"
                        id={"senderc20Contract"}
                        placeholder={"Token contract"}
                        />
                        <input
                        sx={{width:"100%", margin:"6px", padding:"6px"}}
                        type="text"
                        id={"senderc20Address"}
                        placeholder={"Receiver address"}
                        />
                        <input
                        sx={{width:"100%", margin:"6px", padding:"6px"}}
                        type="number"
                        id={"senderc20Amount"}
                        placeholder={"ERC-20 token amount"}
                        />
                      <Button onClick={ () => !isClaiming && proposalsendERC20() } 
                        sx={{width:"100%", margin:"6px", padding:"6px"}}
                        >
                      {isClaiming ? 'Proposing...' : `Make the Proposal`}
                      </Button>
                      </label>
                  </fieldset>
                }            
              </details>



              <details className="card" sx={{width:"100%"}}>
                <summary sx={{ fontWeight: 700, userSelect: 'none' }}>
                  {"Send ERC-721 NFTs from DAO treasury"}
                </summary>
                {
                  <fieldset
                    sx={{
                      display: 'flex',
                      gap: '0.5rem',
                      border: 'none',
                    }}
                    {...disabled}
                  >

                    <legend>{ "Proposal to send NFT from the treasury to a wallet" }</legend>
                      <label
                        sx={{width:"100%"}}
                        htmlFor={"proposalTypes"}
                      >
                        <textarea
                        sx={{width:"100%", margin:"6px", padding:"6px"}}
                        id={"senderc721Description"}
                            placeholder={"Proposal Description"}
                        />
                        <input
                        sx={{width:"100%", margin:"6px", padding:"6px"}}
                        type="text"
                        id={"senderc721Contract"}
                        placeholder={"Token contract"}
                        />
                        <input
                        sx={{width:"100%", margin:"6px", padding:"6px"}}
                        type="text"
                        id={"senderc721Address"}
                        placeholder={"Receiver address"}
                        />
                        <input
                        sx={{width:"100%", margin:"6px", padding:"6px"}}
                        type="number"
                        id={"senderc721TokenId"}
                        placeholder={"ERC-721 token id"}
                        />
                      <Button onClick={ () => !isClaiming && proposalsendERC721() } 
                        sx={{width:"100%", margin:"6px", padding:"6px"}}
                        >
                      {isClaiming ? 'Proposing...' : `Make the Proposal`}
                      </Button>
                      </label>
                  </fieldset>
                }            
              </details>
          </form>
        </div>

          <DaoProposals
            proposals={proposals}
            vote={vote}
            votingState={votingState}
          />

            </div>
          ) : (
            <Button onClick={() => {!isClaiming && 
              embedMintNFt()
              verifyNFT()
            }}>
              {isClaiming ? 'Minting...' : `Mint a Concession NFT`}
            </Button>
            )
        ) : null}
          <div id="embedMintNFt">
          </div>
      </main>
      <Footer />
    </>
  );
};



export default Home;
