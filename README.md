# Escrow

An Escrow Dapp For Trustless Trading of ERC20, ERC721, and ERC1155 Assets

ETH to ERC and ERC to ETH Trades Are Not Included Since It Would Violate The Priciple Of Not Requiring Assets To Be Deposited To The Escrow Contract.

## Problem

Trust, Authenticity, Security, Fees, and Privacy

1. Trading Assets Today Has Been Hard, You Don't Know If The Other Party Is There To Scam You Or Not.
2. It Is Also Hard To Validate The Authenticity Of The Assets You Are Trying To Trade.
3. When Trading Assets, You'll Have To Go To Third Party Person Or Service To Become The Middleman Of The Trade, Which Some Are Scams Out To Get Your Assets
4. Inconsistent And Expensive Third Party Escorw Fees

### Usual Third-Party Escrow

1. Usually Requires KYC Which Is Not Attractive To Those Who Don't Like Sharing Personal Information Online
2. You Both Send Your Assets To The Middleman
3. Pay The Fee
4. The Middleman Sends The Assets To The New Respective Owners

### Usual Third-Party | Community Based Escrow Scams

   Phishing Discord Servers That Looks Like The Legit Counter Part (Almost 100% Likeness Including Announcements and Channels) Complete With Users With The Same Names And Profile Pictures, After Sending The Assets To THe Middleman, They Would Kick And Ban You, And Is Usually Done By A Group Of Scammers.

## Solution

### Trust

   By Creating This Dapp and Smart Contract, It Eliminates The Need For Third Party Middleman And Trust That Party B Would Scam Them

### Authenticity

   You Create The Trade By Using The Details You Provide

#### Your Asset

1. `Contract Address` - of The Token You Want To Trade, Which Party B Must Double Check Before Accepting The Trade
2. `Token Id` - of The ERC721 or ERC1155 of the NFT You Want To Trade
3. `Amount` - Of The ERC20 or ERC1155 You Want To Trade

#### Party B's Asset

1. `Contract Address` - of The Token You Want To Receive, Which You Must Double Check Before Creating The Trade
2. `Token Id` - of The ERC721 or ERC1155 of the NFT You Want To Receive
3. `Amount` - Of The ERC20 or ERC1155 You Want To Receive

This Would Give You Control To Make Sure You Are Receiving The Correct Asset Since The Trade Won't Proceed If The Both Parties Do Not Own Any Of The Required Assets. Checks Are Done When Creating ANd Accepting Trades To Prevent Trades From Becoming A Scam Where Users Would Create A Trade Then Transfer Assets, or Accepting The Trade Without The Required Assets

### Middleman

   Middleman Would Not Be Needed Since You Only Need To Come To An Aggrement With Party B Then Create A Trade Instance

### Security

#### Asset Security

1. Assets Won't Be Required To be Deposited To The Contract
2. Assets Must Be On The EOA (Externally Owned Account) or Wallet Of Both Parties
3. If The Required Assets Are Not In The Wallet

   1. Party A Won't Be Able To Create The Trade
   2. Party B Won't Be Able To Accept The Trade
   3. If Party A Transferred The Assets After Creating The Trade, Party B'a Acceptance Of The Trade Would Fail

#### Contract Security

Restrictions Are Placed In The Contract On Who Can Access Which Functions And Other Prevention Mechanisims To Prevent Reentracy Like The CEI (Check, Effect, Interact) Pattern And Several Checks Before Executions To Make Sure That The Trade Instance Has Not Been Interacted Yet (Completed, Rejected, or Cancelled) Before Executions.

#### Added Layer Of Security

Creation And Acceptance Of Trades Could Be Paused In The Contract In Case Of An Emergency Where An Exploit Is Found That Would Affect User's Assets. Pausing The Creation And Acceptance Of Trades Would Give All Users Time To Cancel Or Reject Their Pending Trade Instances To Avoid Being Exploited Due To A Bug Or Exploit In The Contract.

#### Other Contract Security Concern

Slither Analyzer Detects A High Level Error In The `AcceptTrade` Function Caused By The Parameters In The Function For Transfering ERC Assets' `from` Parameter Not Being `msg.sender`. To Prevent Exploits Because Of This, Include A Permission/Approval Revoke Method For Users To Revoke The Permissions For Their Assets For The Escrow Conrtact On The DApp. Reason For This Is To Allow The Contract To Swap Assets The Moment Party B Accepted The Trade And Any Other Method Won't Work.

### Fees

Fees Are In ETH Or The Native Token Of The Network The Contract Is Deployed On. Fees Are Set And Can Be Re-Set By The Contract's Owner If No Role Restrictions Is Included In The Contract. Initial Fee Is Set To `0.001 ETH` and Can Be Changed After Deployment.

### Privacy

No KYC Needed To Create And Interact With A Trade, Both Party Just Need To Have All Required Assets In Their EOA (Externally Owned Account) or Wallet

## Current Version Features

- One To One Asset Trade
- On-Chain Data Removing The Need For An External Database
- Access Restrictions

## Future Version Features

- Batch Trades Allowing Multi Asset Trades
- Role Based Restriction

## Current Network: Sepolia

**Escrow** - `0xc03bCb40F60Bd68927605AB268a873EF7a96Dd17`
**ERC Balance Library** - `0xb3B3DBf529065Fb50D877406935903076BB31f97`
**Id Generator Library** - `0xa4F7E5f6BdcFCAcc09701454FcE7E26C7eFF143b`
