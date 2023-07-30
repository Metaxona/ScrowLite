const { describe, it, beforeEach, before} = require('mocha')
const chai = require('chai')
const { expect, assert } = chai
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers')
const hre = require("hardhat");

describe('Escrow', () => {
    
    const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

    let erc20;
    let erc721;
    let erc1155;
    let escrow;

    let partyAAssets;

    let partyAAssetsNotOwned;

    let partyBAssets;

    let instance1;

    async function loadAccounts() {
        const [deployer, partyA, partyB] = await hre.ethers.getSigners();
    
        return {deployer, partyA, partyB}
    }

    async function deployTokens() {
        // ERC20
        erc20 = await hre.ethers.deployContract("SolidityToolsToken")
        await erc20.waitForDeployment()
        // ERC721
        erc721 = await hre.ethers.deployContract("SolitityTools721")
        await erc20.waitForDeployment()
        // ERC1155
        erc1155 = await hre.ethers.deployContract("SolitityTools1155")
        await erc20.waitForDeployment()

        partyAAssets = [
            [erc20.target, hre.ethers.parseEther("10")],
            [ZERO_ADDRESS, 0],
            [ZERO_ADDRESS, 0, 0]
        ]
        partyAAssetsNotOwned = [
            [ZERO_ADDRESS, 0],
            [erc721.target, 50],
            [ZERO_ADDRESS, 0, 0]
        ]
        partyBAssets = [
            [ZERO_ADDRESS, 0],
            [erc721.target, 0],
            [ZERO_ADDRESS, 0, 0]
        ]
        
        return {erc20, erc721, erc1155}
    }

    async function deployEscrow() {
        const ercBalance = await hre.ethers.deployContract("ERCBalance")
        await ercBalance.waitForDeployment();

        const idGenerator = await hre.ethers.deployContract("IdGenerator")
        await idGenerator.waitForDeployment();

        const Escrow = await hre.ethers.getContractFactory("Escrow", {libraries: {IdGenerator: idGenerator.target, ERCBalance: ercBalance.target}})
        escrow = await Escrow.deploy()

        return { escrow }
    }

    before(async ()=>{
        const {erc20, erc721, erc1155} = await loadFixture(deployTokens)
        const { escrow } = await loadFixture(deployEscrow)

        console.log("ERC20 Address: ", erc20.target)
        console.log("ERC721 Address: ", erc721.target)
        console.log("ERC1155 Address: ", erc1155.target)
        console.log("Escrow Address: ", escrow.target)
    })
    
    describe("Party A Escrow Interactions", () => {
        
        it('Should Mint ERC20, ERC721, ERC1155', async () => {
            const {deployer, partyA, partyB} = await loadFixture(loadAccounts);

            await erc20.connect(partyA).faucetMint(partyA)
            await erc721.connect(partyA).faucetMint(1)
            await erc1155.connect(partyA).faucetMint(0,1,"0x")

            expect(await erc20.balanceOf(partyA)).to.be.gt(0)
            expect(await erc721.balanceOf(partyA)).to.be.gt(0)
            expect(await erc1155.balanceOf(partyA, 0)).to.be.gt(0)
        });
        
        it('Should Not Create An Instance (No Requirements)', async () => {
            const {deployer, partyA, partyB} = await loadFixture(loadAccounts);
            await expect(escrow.connect(partyA).createTrade(
                1,
                1,
                "Please Accept",
                partyB,
                partyAAssetsNotOwned,
                partyBAssets
            )).to.be.reverted
        });
    
        it('Should Create An Instance (ERC20)', async () => {
            const {deployer, partyA, partyB} = await loadFixture(loadAccounts);
            const partyBAddress = (await partyB.getAddress()).toString()
            
            await erc20.connect(partyA).faucetMint(partyA)
            const balance = await erc20.balanceOf(partyA)
            expect(balance).to.be.gt(0)
            // console.log("Balance: ", balance)

            await erc20.connect(partyA).approve(escrow.target, hre.ethers.parseEther("10000"))
            const allowance = await erc20.connect(partyA).allowance(partyA, escrow.target)
            expect(allowance).to.be.gte(0)
            // console.log("Allowance: ", allowance)

            // console.log("Amount: ", partyAAssets[0][1])
            await expect(escrow.connect(partyA).createTrade(
                0,
                1,
                "Please Accept",
                partyBAddress,
                partyAAssets,
                partyBAssets,
            {value: BigInt(await escrow.connect(partyA).feeInETH())}
            )).to.not.be.reverted;

        });

        it('Should Not Create An Instance: Party B is Zero Address', async () => {
            const {deployer, partyA, partyB} = await loadFixture(loadAccounts);
            const partyBAddress = (await partyB.getAddress()).toString()
            const partyAAddress = (await partyA.getAddress()).toString()
            
            await erc20.connect(partyA).faucetMint(partyA)
            const balance = await erc20.balanceOf(partyA)
            expect(balance).to.be.gt(0)

            await erc20.connect(partyA).approve(escrow.target, hre.ethers.parseEther("10000"))
            const allowance = await erc20.connect(partyA).allowance(partyA, escrow.target)
            expect(allowance).to.be.gte(0)

            await expect(escrow.connect(partyA).createTrade(
                0,
                1,
                "Please Accept",
                ZERO_ADDRESS,
                partyAAssets,
                partyBAssets,
            {value: BigInt(await escrow.connect(partyA).feeInETH())}
            )).to.be.reverted;

        });
        
        it('Should Cancel An Instance', async () => {
            const {deployer, partyA, partyB} = await loadFixture(loadAccounts);
            const partyBAddress = (await partyB.getAddress()).toString()
            
            await erc20.connect(partyA).faucetMint(partyA)
            const balance = await erc20.balanceOf(partyA)
            expect(balance).to.be.gt(0)

            await erc20.connect(partyA).approve(escrow.target, hre.ethers.parseEther("10000"))
            const allowance = await erc20.connect(partyA).allowance(partyA, escrow.target)
            expect(allowance).to.be.gte(0)

            const createInstance = await escrow.connect(partyA).createTrade(
                0,
                1,
                "Please Accept",
                partyBAddress,
                partyAAssets,
                partyBAssets,
            {value: BigInt(await escrow.connect(partyA).feeInETH())}
            )
            
            const instanceId = (await escrow.connect(partyA).getHistory(partyB)).at(-1)

            await expect(escrow.connect(partyA).cancelTrade(instanceId)).to.not.be.reverted;
            
        });
    
        it('Should Not Reject An Instance', async () => {
            const {deployer, partyA, partyB} = await loadFixture(loadAccounts);
            const partyBAddress = (await partyB.getAddress()).toString()
            
            await erc20.connect(partyA).faucetMint(partyA)
            const balance = await erc20.balanceOf(partyA)
            expect(balance).to.be.gt(0)

            await erc20.connect(partyA).approve(escrow.target, hre.ethers.parseEther("10000"))
            const allowance = await erc20.connect(partyA).allowance(partyA, escrow.target)
            expect(allowance).to.be.gte(0)

            const createInstance = await escrow.connect(partyA).createTrade(
                0,
                1,
                "Please Accept",
                partyBAddress,
                partyAAssets,
                partyBAssets,
            {value: BigInt(await escrow.connect(partyA).feeInETH())}
            )
            
            const instanceId = (await escrow.connect(partyA).getHistory(partyB)).at(-1)

            await expect(escrow.connect(partyA).rejectTrade(instanceId)).to.be.reverted;
            
        });
    
        it('Should Not Accept An Instance', async () => {
             const {deployer, partyA, partyB} = await loadFixture(loadAccounts);
            const partyBAddress = (await partyB.getAddress()).toString()
            
            await erc20.connect(partyA).faucetMint(partyA)
            const balance = await erc20.balanceOf(partyA)
            expect(balance).to.be.gt(0)

            await erc20.connect(partyA).approve(escrow.target, hre.ethers.parseEther("10000"))
            const allowance = await erc20.connect(partyA).allowance(partyA, escrow.target)
            expect(allowance).to.be.gte(0)

            const createInstance = await escrow.connect(partyA).createTrade(
                0,
                1,
                "Please Accept",
                partyBAddress,
                partyAAssets,
                partyBAssets,
            {value: BigInt(await escrow.connect(partyA).feeInETH())}
            )
            
            const instanceId = (await escrow.connect(partyA).getHistory(partyB)).at(-1)

            await expect(escrow.connect(partyA).acceptTrade(instanceId)).to.be.reverted;
            
        });
        
    })
    
    
    describe('Party B Escrow Interactions', () => {
       
        it('Should have No Balance of ERC20, ERC721, ERC1155',async function() {
            const {deployer, partyA, partyB} = await loadFixture(loadAccounts);

            expect(await erc20.balanceOf(partyB)).to.be.eq(0)
            expect(await erc721.balanceOf(partyB)).to.be.eq(0)
            expect(await erc1155.balanceOf(partyB, 0)).to.be.eq(0)
        });
        
        it('Should Not Cancel An Instance',async function() {
            const {deployer, partyA, partyB} = await loadFixture(loadAccounts);
            const partyBAddress = (await partyB.getAddress()).toString()
            
            await erc20.connect(partyA).faucetMint(partyA)
            const balance = await erc20.balanceOf(partyA)
            expect(balance).to.be.gt(0)

            await erc20.connect(partyA).approve(escrow.target, hre.ethers.parseEther("10000"))
            const allowance = await erc20.connect(partyA).allowance(partyA, escrow.target)
            expect(allowance).to.be.gte(0)

            const createInstance = await escrow.connect(partyA).createTrade(
                0,
                1,
                "Please Accept",
                partyBAddress,
                partyAAssets,
                partyBAssets,
            {value: BigInt(await escrow.connect(partyA).feeInETH())}
            )
            
            const instanceId = (await escrow.connect(partyB).getHistory(partyA)).at(-1)

            await expect(escrow.connect(partyB).cancelTrade(instanceId)).to.be.reverted;
            
        });
    
        it('Should Reject An Instance',async function() {
            const {deployer, partyA, partyB} = await loadFixture(loadAccounts);
            const partyBAddress = (await partyB.getAddress()).toString()
            
            await erc20.connect(partyA).faucetMint(partyA)
            const balance = await erc20.balanceOf(partyA)
            expect(balance).to.be.gt(0)

            await erc20.connect(partyA).approve(escrow.target, hre.ethers.parseEther("10000"))
            const allowance = await erc20.connect(partyA).allowance(partyA, escrow.target)
            expect(allowance).to.be.gte(0)

            const createInstance = await escrow.connect(partyA).createTrade(
                0,
                1,
                "Please Accept",
                partyBAddress,
                partyAAssets,
                partyBAssets,
            {value: BigInt(await escrow.connect(partyA).feeInETH())}
            )
            
            const instanceId = (await escrow.connect(partyB).getHistory(partyA)).at(-1)

            await expect(escrow.connect(partyB).rejectTrade(instanceId)).to.not.be.reverted;
            
        });
    
        it('Should Accept An Instance',async function() {
            const {deployer, partyA, partyB} = await loadFixture(loadAccounts);
            const partyBAddress = (await partyB.getAddress()).toString()
            
            await erc20.connect(partyA).faucetMint(partyA)
            const balance = await erc20.balanceOf(partyA)
            expect(balance).to.be.gt(0)

            await erc20.connect(partyA).approve(escrow.target, hre.ethers.parseEther("10000"))
            const allowance = await erc20.connect(partyA).allowance(partyA, escrow.target)
            expect(allowance).to.be.gte(0)


            await erc721.connect(partyB).faucetMint(2)
            const bAllowance = await erc721.connect(partyB).setApprovalForAll(escrow.target, true)

            expect(await erc721.connect(partyB).ownerOf(0)).to.be.eq(partyBAddress)
            expect(await erc721.connect(partyB).isApprovedForAll(partyBAddress, escrow.target)).to.be.true

            const createInstance = await escrow.connect(partyA).createTrade(
                0,
                1,
                "Please Accept",
                partyBAddress,
                partyAAssets,
                partyBAssets,
            {value: BigInt(await escrow.connect(partyA).feeInETH())}
            )
            
            const instanceId = (await escrow.connect(partyB).getHistory(partyA)).at(-1)

            await expect(escrow.connect(partyB).acceptTrade(instanceId)).to.not.be.reverted;
            
        });
        
        it('Should Not Accept An Instance (No Requirements)',async function() {
            const {deployer, partyA, partyB} = await loadFixture(loadAccounts);
            const partyBAddress = (await partyB.getAddress()).toString()
            const partyAAddress = (await partyA.getAddress()).toString()
            
            await erc20.connect(partyA).faucetMint(partyA)
            const balance = await erc20.balanceOf(partyA)
            expect(balance).to.be.gt(0)

            await erc20.connect(partyA).approve(escrow.target, hre.ethers.parseEther("10000"))
            const allowance = await erc20.connect(partyA).allowance(partyA, escrow.target)
            expect(allowance).to.be.gte(0)

            const createInstance = await escrow.connect(partyA).createTrade(
                0,
                1,
                "Please Accept",
                partyBAddress,
                partyAAssets,
                partyBAssets,
            {value: BigInt(await escrow.connect(partyA).feeInETH())}
            )
            
            const instanceId = (await escrow.connect(partyB).getHistory(partyAAddress)).at(-1)

            await expect(escrow.connect(partyB).acceptTrade(instanceId)).to.be.reverted;
            
        });
        
    
    });
    
    describe('View Functions', () => {
        
        
        it('Should Increase tradeCount', async ( ) => {
            const {deployer, partyA, partyB} = await loadFixture(loadAccounts);
            const partyBAddress = (await partyB.getAddress()).toString()
            
            await erc20.connect(partyA).faucetMint(partyA)
            const balance = await erc20.balanceOf(partyA)
            expect(balance).to.be.gt(0)

            await erc20.connect(partyA).approve(escrow.target, hre.ethers.parseEther("10000"))
            const allowance = await erc20.connect(partyA).allowance(partyA, escrow.target)
            expect(allowance).to.be.gte(0)

            const createInstance = await escrow.connect(partyA).createTrade(
                0,
                1,
                "Please Accept",
                partyBAddress,
                partyAAssets,
                partyBAssets,
            {value: BigInt(await escrow.connect(partyA).feeInETH())}
            )
            
            expect(await escrow.connect(partyB).tradeCount()).to.be.eq(1);
            
        });
        
        it('Should Increase pendingCount', async () => {
            const {deployer, partyA, partyB} = await loadFixture(loadAccounts);
            const partyBAddress = (await partyB.getAddress()).toString()
            
            await erc20.connect(partyA).faucetMint(partyA)
            const balance = await erc20.balanceOf(partyA)
            expect(balance).to.be.gt(0)

            await erc20.connect(partyA).approve(escrow.target, hre.ethers.parseEther("10000"))
            const allowance = await erc20.connect(partyA).allowance(partyA, escrow.target)
            expect(allowance).to.be.gte(0)

            const createInstance = await escrow.connect(partyA).createTrade(
                0,
                1,
                "Please Accept",
                partyBAddress,
                partyAAssets,
                partyBAssets,
            {value: BigInt(await escrow.connect(partyA).feeInETH())}
            )
            
            expect(await escrow.connect(partyB).pendingCount()).to.be.eq(1);
            
        });
    
        it('Should Increase completedCount and decrease pendingCount', async () => {
            const {deployer, partyA, partyB} = await loadFixture(loadAccounts);
            const partyBAddress = (await partyB.getAddress()).toString()
            
            await erc20.connect(partyA).faucetMint(partyA)
            const balance = await erc20.balanceOf(partyA)
            expect(balance).to.be.gt(0)

            await erc20.connect(partyA).approve(escrow.target, hre.ethers.parseEther("10000"))
            const allowance = await erc20.connect(partyA).allowance(partyA, escrow.target)
            expect(allowance).to.be.gte(0)


            await erc721.connect(partyB).faucetMint(2)
            const bAllowance = await erc721.connect(partyB).setApprovalForAll(escrow.target, true)

            expect(await erc721.connect(partyB).ownerOf(0)).to.be.eq(partyBAddress)
            expect(await erc721.connect(partyB).isApprovedForAll(partyBAddress, escrow.target)).to.be.true

            const createInstance = await escrow.connect(partyA).createTrade(
                0,
                1,
                "Please Accept",
                partyBAddress,
                partyAAssets,
                partyBAssets,
            {value: BigInt(await escrow.connect(partyA).feeInETH())}
            )
            
            const instanceId = (await escrow.connect(partyB).getHistory(partyA)).at(-1)

            await expect(escrow.connect(partyB).acceptTrade(instanceId)).to.not.be.reverted;

            expect(await escrow.connect(partyB).completedCount()).to.be.eq(1)
            expect(await escrow.connect(partyB).pendingCount()).to.be.eq(0)
            
        });
    
        it('Should Increase rejectedCount and decrease pendingCount', async () => {
            const {deployer, partyA, partyB} = await loadFixture(loadAccounts);
            const partyBAddress = (await partyB.getAddress()).toString()
            
            await erc20.connect(partyA).faucetMint(partyA)
            const balance = await erc20.balanceOf(partyA)
            expect(balance).to.be.gt(0)

            await erc20.connect(partyA).approve(escrow.target, hre.ethers.parseEther("10000"))
            const allowance = await erc20.connect(partyA).allowance(partyA, escrow.target)
            expect(allowance).to.be.gte(0)

            const createInstance = await escrow.connect(partyA).createTrade(
                0,
                1,
                "Please Accept",
                partyBAddress,
                partyAAssets,
                partyBAssets,
            {value: BigInt(await escrow.connect(partyA).feeInETH())}
            )
            
            const instanceId = (await escrow.connect(partyB).getHistory(partyA)).at(-1)

            await expect(escrow.connect(partyB).rejectTrade(instanceId)).to.not.be.reverted;

            expect(await escrow.connect(partyB).rejectedCount()).to.be.eq(1)
            expect(await escrow.connect(partyB).pendingCount()).to.be.eq(0)
        });
    
        it('Should Increase cancelledCount and decrease pendingCount', async () => {
            const {deployer, partyA, partyB} = await loadFixture(loadAccounts);
            const partyBAddress = (await partyB.getAddress()).toString()
            
            await erc20.connect(partyA).faucetMint(partyA)
            const balance = await erc20.balanceOf(partyA)
            expect(balance).to.be.gt(0)

            await erc20.connect(partyA).approve(escrow.target, hre.ethers.parseEther("10000"))
            const allowance = await erc20.connect(partyA).allowance(partyA, escrow.target)
            expect(allowance).to.be.gte(0)


            await erc721.connect(partyB).faucetMint(2)
            const bAllowance = await erc721.connect(partyB).setApprovalForAll(escrow.target, true)

            expect(await erc721.connect(partyB).ownerOf(0)).to.be.eq(partyBAddress)
            expect(await erc721.connect(partyB).isApprovedForAll(partyBAddress, escrow.target)).to.be.true

            const createInstance = await escrow.connect(partyA).createTrade(
                0,
                1,
                "Please Accept",
                partyBAddress,
                partyAAssets,
                partyBAssets,
            {value: BigInt(await escrow.connect(partyA).feeInETH())}
            )
            
            const instanceId = (await escrow.connect(partyB).getHistory(partyA)).at(-1)

            await expect(escrow.connect(partyA).cancelTrade(instanceId)).to.not.be.reverted;

            expect(await escrow.connect(partyB).cancelledCount()).to.be.eq(1)
            expect(await escrow.connect(partyB).pendingCount()).to.be.eq(0)
            
        });
    
        it('Should getEscrowById', async () => {
            const {deployer, partyA, partyB} = await loadFixture(loadAccounts);
            const partyBAddress = (await partyB.getAddress()).toString()
            
            await erc20.connect(partyA).faucetMint(partyA)
            const balance = await erc20.balanceOf(partyA)
            expect(balance).to.be.gt(0)

            await erc20.connect(partyA).approve(escrow.target, hre.ethers.parseEther("10000"))
            const allowance = await erc20.connect(partyA).allowance(partyA, escrow.target)
            expect(allowance).to.be.gte(0)

            const createInstance = await escrow.connect(partyA).createTrade(
                0,
                1,
                "Please Accept",
                partyBAddress,
                partyAAssets,
                partyBAssets,
            {value: BigInt(await escrow.connect(partyA).feeInETH())}
            )
            
            const instanceId = (await escrow.connect(partyA).getHistory(partyB)).at(-1)

            await expect(escrow.connect(partyA).getEscrowById(instanceId)).to.not.be.reverted; 
        });
    
        it('Should getStatus', async () => {
            const {deployer, partyA, partyB} = await loadFixture(loadAccounts);
            const partyBAddress = (await partyB.getAddress()).toString()
            
            await erc20.connect(partyA).faucetMint(partyA)
            const balance = await erc20.balanceOf(partyA)
            expect(balance).to.be.gt(0)

            await erc20.connect(partyA).approve(escrow.target, hre.ethers.parseEther("10000"))
            const allowance = await erc20.connect(partyA).allowance(partyA, escrow.target)
            expect(allowance).to.be.gte(0)

            const createInstance = await escrow.connect(partyA).createTrade(
                0,
                1,
                "Please Accept",
                partyBAddress,
                partyAAssets,
                partyBAssets,
            {value: BigInt(await escrow.connect(partyA).feeInETH())}
            )
            
            const instanceId = (await escrow.connect(partyA).getHistory(partyB)).at(-1)

            expect(await escrow.connect(partyA).getStatus(instanceId)).to.be.eq(0);  
            
        });
    
        it('Should getHistory', async () => {
            const {deployer, partyA, partyB} = await loadFixture(loadAccounts);
            const partyBAddress = (await partyB.getAddress()).toString()
            
            await erc20.connect(partyA).faucetMint(partyA)
            const balance = await erc20.balanceOf(partyA)
            expect(balance).to.be.gt(0)

            await erc20.connect(partyA).approve(escrow.target, hre.ethers.parseEther("10000"))
            const allowance = await erc20.connect(partyA).allowance(partyA, escrow.target)
            expect(allowance).to.be.gte(0)

            const createInstance = await escrow.connect(partyA).createTrade(
                0,
                1,
                "Please Accept",
                partyBAddress,
                partyAAssets,
                partyBAssets,
            {value: BigInt(await escrow.connect(partyA).feeInETH())}
            )
            
            const instanceId = (await escrow.connect(partyA).getHistory(partyB)).at(-1)

            expect(instanceId).to.not.be.eq(null||undefined);  
        });
    });

    describe('Complete Trade Cycles', () => {

        it('Should Succeed ERC20 to ERC20', async () => {
            
            const partyAParams = [
                [erc20.target, hre.ethers.parseEther("10")],
                [ZERO_ADDRESS, 0],
                [ZERO_ADDRESS, 0, 0]
            ]

            const partyBParams = [
                [erc20.target, hre.ethers.parseEther("20")],
                [ZERO_ADDRESS, 0],
                [ZERO_ADDRESS, 0, 0]
            ]

            const {deployer, partyA, partyB} = await loadFixture(loadAccounts);
            const partyBAddress = (await partyB.getAddress()).toString()
            const partyAAddress = (await partyA.getAddress()).toString()
            
            await erc20.connect(partyA).faucetMint(partyA)
            const balance = await erc20.balanceOf(partyAAddress)
            expect(balance).to.be.gt(0)

            await erc20.connect(partyA).approve(escrow.target, hre.ethers.parseEther("10000"))
            const allowance = await erc20.connect(partyA).allowance(partyAAddress, escrow.target)
            expect(allowance).to.be.gte(0)

            await erc20.connect(partyB).faucetMint(partyBAddress)
            const Bbalance = await erc20.balanceOf(partyBAddress)
            expect(Bbalance).to.be.gt(0)

            await erc20.connect(partyB).approve(escrow.target, hre.ethers.parseEther("10000"))
            const Ballowance = await erc20.connect(partyB).allowance(partyBAddress, escrow.target)
            expect(Ballowance).to.be.gte(0)

            const createInstance = await escrow.connect(partyA).createTrade(
                0,
                0,
                "Please Accept",
                partyBAddress,
                partyAParams,
                partyBParams,
            {value: BigInt(await escrow.connect(partyA).feeInETH())}
            )
            
            const instanceId = (await escrow.connect(partyB).getHistory(partyAAddress)).at(-1)

            await expect(escrow.connect(partyB).acceptTrade(instanceId)).to.not.be.reverted;

            expect(await escrow.connect(partyA).pendingCount()).to.be.eq(0)
            expect(await escrow.connect(partyA).completedCount()).to.be.eq(1)
            
            expect(await erc20.connect(partyA).balanceOf(partyAAddress)).to.be.eq(hre.ethers.parseEther("1010"))
            expect(await erc20.connect(partyA).balanceOf(partyBAddress)).to.be.eq(hre.ethers.parseEther("990"))
        });

        it('Should Succeed ERC20 to ERC721', async () => {

            const partyAParams = [
                [erc20.target, hre.ethers.parseEther("10")],
                [ZERO_ADDRESS, 0],
                [ZERO_ADDRESS, 0, 0]
            ]

            const partyBParams = [
                [ZERO_ADDRESS, 0],
                [erc721.target, 0],
                [ZERO_ADDRESS, 0, 0]
            ]

            const {deployer, partyA, partyB} = await loadFixture(loadAccounts);
            const partyBAddress = (await partyB.getAddress()).toString()
            const partyAAddress = (await partyA.getAddress()).toString()
            
            await erc20.connect(partyA).faucetMint(partyAAddress)
            const balance = await erc20.balanceOf(partyAAddress)
            expect(balance).to.be.gt(0)

            await erc20.connect(partyA).approve(escrow.target, hre.ethers.parseEther("10000"))
            const allowance = await erc20.connect(partyA).allowance(partyAAddress, escrow.target)
            expect(allowance).to.be.gte(0)

            await erc721.connect(partyB).faucetMint(2)
            const bAllowance = await erc721.connect(partyB).setApprovalForAll(escrow.target, true)

            expect(await erc721.connect(partyB).ownerOf(0)).to.be.eq(partyBAddress)
            expect(await erc721.connect(partyB).isApprovedForAll(partyBAddress, escrow.target)).to.be.true

            const createInstance = await escrow.connect(partyA).createTrade(
                0,
                1,
                "Please Accept",
                partyBAddress,
                partyAParams,
                partyBParams,
            {value: BigInt(await escrow.connect(partyA).feeInETH())}
            )
            
            const instanceId = (await escrow.connect(partyB).getHistory(partyAAddress)).at(-1)

            await expect(escrow.connect(partyB).acceptTrade(instanceId)).to.not.be.reverted;

            expect(await escrow.connect(partyA).pendingCount()).to.be.eq(0)
            expect(await escrow.connect(partyA).completedCount()).to.be.eq(1)

            expect(await erc721.connect(partyA).ownerOf(0)).to.be.eq(partyAAddress)
            expect(await erc20.connect(partyA).balanceOf(partyBAddress)).to.be.eq(hre.ethers.parseEther("10"))
            
        });

        it('Should Succeed ERC20 to ERC1155', async () => {

            const partyAParams = [
                [erc20.target, hre.ethers.parseEther("10")],
                [ZERO_ADDRESS, 0],
                [ZERO_ADDRESS, 0, 0]
            ]

            const partyBParams = [
                [ZERO_ADDRESS, 0],
                [ZERO_ADDRESS, 0],
                [erc1155.target, 0, 1]
            ]

            const {deployer, partyA, partyB} = await loadFixture(loadAccounts);
            const partyBAddress = (await partyB.getAddress()).toString()
            const partyAAddress = (await partyA.getAddress()).toString()
            
            await erc20.connect(partyA).faucetMint(partyAAddress)
            const balance = await erc20.balanceOf(partyAAddress)
            expect(balance).to.be.gt(0)

            await erc20.connect(partyA).approve(escrow.target, hre.ethers.parseEther("10000"))
            const allowance = await erc20.connect(partyA).allowance(partyAAddress, escrow.target)
            expect(allowance).to.be.gte(0)

            await erc1155.connect(partyB).faucetMint(0, 2, "0x")
            const Bbalance = await erc1155.connect(partyB).balanceOf(partyBAddress, 0)
            expect(Bbalance).to.be.gte(2)

            await erc1155.connect(partyB).setApprovalForAll(escrow.target, true)
            const Ballowance = await erc1155.connect(partyB).isApprovedForAll(partyBAddress, escrow.target)
            expect(Ballowance).to.be.true

            const createInstance = await escrow.connect(partyA).createTrade(
                0,
                2,
                "Please Accept",
                partyBAddress,
                partyAParams,
                partyBParams,
            {value: BigInt(await escrow.connect(partyA).feeInETH())}
            )
            
            const instanceId = (await escrow.connect(partyB).getHistory(partyAAddress)).at(-1)

            await expect(escrow.connect(partyB).acceptTrade(instanceId)).to.not.be.reverted;

            expect(await escrow.connect(partyA).pendingCount()).to.be.eq(0)
            expect(await escrow.connect(partyA).completedCount()).to.be.eq(1)

            expect(await erc20.connect(partyA).balanceOf(partyBAddress)).to.be.eq(hre.ethers.parseEther("10"))
            expect(await erc1155.connect(partyA).balanceOf(partyAAddress, 0)).to.be.eq(1)
        });

        it('Should Succeed ERC721 to ERC20', async () => {

            const partyAParams = [
                [ZERO_ADDRESS, 0],
                [erc721.target, 0],
                [ZERO_ADDRESS, 0, 0]
            ]

            const partyBParams = [
                [erc20.target, hre.ethers.parseEther("10")],
                [ZERO_ADDRESS, 0],
                [ZERO_ADDRESS, 0, 0]
            ]

            const {deployer, partyA, partyB} = await loadFixture(loadAccounts);
            const partyBAddress = (await partyB.getAddress()).toString()
            const partyAAddress = (await partyA.getAddress()).toString()
            
            await erc20.connect(partyB).faucetMint(partyBAddress)
            const balance = await erc20.balanceOf(partyBAddress)
            expect(balance).to.be.gt(0)

            await erc20.connect(partyB).approve(escrow.target, hre.ethers.parseEther("10000"))
            const allowance = await erc20.connect(partyB).allowance(partyBAddress, escrow.target)
            expect(allowance).to.be.gte(0)

            await erc721.connect(partyA).faucetMint(2)
            const bAllowance = await erc721.connect(partyA).setApprovalForAll(escrow.target, true)

            expect(await erc721.connect(partyA).ownerOf(0)).to.be.eq(partyAAddress)
            expect(await erc721.connect(partyA).isApprovedForAll(partyAAddress, escrow.target)).to.be.true

            const createInstance = await escrow.connect(partyA).createTrade(
                1,
                0,
                "Please Accept",
                partyBAddress,
                partyAParams,
                partyBParams,
            {value: BigInt(await escrow.connect(partyA).feeInETH())}
            )
            
            const instanceId = (await escrow.connect(partyB).getHistory(partyAAddress)).at(-1)

            await expect(escrow.connect(partyB).acceptTrade(instanceId)).to.not.be.reverted;

            expect(await escrow.connect(partyA).pendingCount()).to.be.eq(0)
            expect(await escrow.connect(partyA).completedCount()).to.be.eq(1)
            
            expect(await erc20.connect(partyA).balanceOf(partyAAddress)).to.be.eq(hre.ethers.parseEther("10"))
            expect(await erc721.connect(partyA).ownerOf(0)).to.be.eq(partyBAddress)
        });
        
        it('Should Succeed ERC721 to ERC721', async () => {
            const partyAParams = [
                [ZERO_ADDRESS, 0],
                [erc721.target, 0],
                [ZERO_ADDRESS, 0, 0]
            ]

            const partyBParams = [
                [ZERO_ADDRESS, 0],
                [erc721.target, 3],
                [ZERO_ADDRESS, 0, 0]
            ]

            const {deployer, partyA, partyB} = await loadFixture(loadAccounts);
            const partyBAddress = (await partyB.getAddress()).toString()
            const partyAAddress = (await partyA.getAddress()).toString()

            await erc721.connect(partyA).faucetMint(2)
            const aAllowance = await erc721.connect(partyA).setApprovalForAll(escrow.target, true)

            expect(await erc721.connect(partyA).ownerOf(0)).to.be.eq(partyAAddress)
            expect(await erc721.connect(partyA).isApprovedForAll(partyAAddress, escrow.target)).to.be.true

            await erc721.connect(partyB).faucetMint(2)
            const bAllowance = await erc721.connect(partyB).setApprovalForAll(escrow.target, true)

            expect(await erc721.connect(partyB).ownerOf(3)).to.be.eq(partyBAddress)
            expect(await erc721.connect(partyB).isApprovedForAll(partyBAddress, escrow.target)).to.be.true

            const createInstance = await escrow.connect(partyA).createTrade(
                1,
                1,
                "Please Accept",
                partyBAddress,
                partyAParams,
                partyBParams,
            {value: BigInt(await escrow.connect(partyA).feeInETH())}
            )
            
            const instanceId = (await escrow.connect(partyB).getHistory(partyAAddress)).at(-1)

            await expect(escrow.connect(partyB).acceptTrade(instanceId)).to.not.be.reverted;

            expect(await escrow.connect(partyA).pendingCount()).to.be.eq(0)
            expect(await escrow.connect(partyA).completedCount()).to.be.eq(1)

            expect(await erc721.connect(partyA).ownerOf(0)).to.be.eq(partyBAddress)
            expect(await erc721.connect(partyA).ownerOf(3)).to.be.eq(partyAAddress)

        });

        it('Should Succeed ERC721 to ERC1155', async () => {
            const partyAParams = [
                [ZERO_ADDRESS, 0],
                [erc721.target, 0],
                [ZERO_ADDRESS, 0, 0]
            ]

            const partyBParams = [
                [ZERO_ADDRESS, 0],
                [ZERO_ADDRESS, 0],
                [erc1155.target, 0, 1]
            ]

            const {deployer, partyA, partyB} = await loadFixture(loadAccounts);
            const partyBAddress = (await partyB.getAddress()).toString()
            const partyAAddress = (await partyA.getAddress()).toString()

            await erc721.connect(partyA).faucetMint(2)
            const aAllowance = await erc721.connect(partyA).setApprovalForAll(escrow.target, true)

            expect(await erc721.connect(partyA).ownerOf(0)).to.be.eq(partyAAddress)
            expect(await erc721.connect(partyA).isApprovedForAll(partyAAddress, escrow.target)).to.be.true

            await erc1155.connect(partyB).faucetMint(0, 2, "0x")
            const Bbalance = await erc1155.connect(partyB).balanceOf(partyBAddress, 0)
            expect(Bbalance).to.be.gte(2)

            await erc1155.connect(partyB).setApprovalForAll(escrow.target, true)
            const Ballowance = await erc1155.connect(partyB).isApprovedForAll(partyBAddress, escrow.target)
            expect(Ballowance).to.be.true

            const createInstance = await escrow.connect(partyA).createTrade(
                1,
                2,
                "Please Accept",
                partyBAddress,
                partyAParams,
                partyBParams,
            {value: BigInt(await escrow.connect(partyA).feeInETH())}
            )
            
            const instanceId = (await escrow.connect(partyB).getHistory(partyAAddress)).at(-1)

            await expect(escrow.connect(partyB).acceptTrade(instanceId)).to.not.be.reverted;

            expect(await escrow.connect(partyA).pendingCount()).to.be.eq(0)
            expect(await escrow.connect(partyA).completedCount()).to.be.eq(1)

            expect(await erc721.connect(partyA).ownerOf(0)).to.be.eq(partyBAddress)
            expect(await erc1155.connect(partyA).balanceOf(partyAAddress, 0)).to.be.eq(1)
        });

        it('Should Succeed ERC1155 to ERC20', async () => {
            const partyAParams = [
                [ZERO_ADDRESS, 0],
                [ZERO_ADDRESS, 0],
                [erc1155.target, 0, 1]
            ]

            const partyBParams = [
                [erc20.target, hre.ethers.parseEther("10")],
                [ZERO_ADDRESS, 0],
                [ZERO_ADDRESS, 0, 0]
            ]

            const {deployer, partyA, partyB} = await loadFixture(loadAccounts);
            const partyBAddress = (await partyB.getAddress()).toString()
            const partyAAddress = (await partyA.getAddress()).toString()
            
            await erc20.connect(partyB).faucetMint(partyBAddress)
            const balance = await erc20.balanceOf(partyBAddress)
            expect(balance).to.be.gt(0)

            await erc20.connect(partyB).approve(escrow.target, hre.ethers.parseEther("10000"))
            const allowance = await erc20.connect(partyB).allowance(partyBAddress, escrow.target)
            expect(allowance).to.be.gte(0)

            await erc1155.connect(partyA).faucetMint(0, 2, "0x")
            const Abalance = await erc1155.connect(partyB).balanceOf(partyAAddress, 0)
            expect(Abalance).to.be.gte(2)

            await erc1155.connect(partyA).setApprovalForAll(escrow.target, true)
            const aAllowance = await erc1155.connect(partyA).isApprovedForAll(partyAAddress, escrow.target)
            expect(aAllowance).to.be.true

            const createInstance = await escrow.connect(partyA).createTrade(
                2,
                0,
                "Please Accept",
                partyBAddress,
                partyAParams,
                partyBParams,
            {value: BigInt(await escrow.connect(partyA).feeInETH())}
            )
            
            const instanceId = (await escrow.connect(partyB).getHistory(partyAAddress)).at(-1)

            await expect(escrow.connect(partyB).acceptTrade(instanceId)).to.not.be.reverted;

            expect(await escrow.connect(partyA).pendingCount()).to.be.eq(0)
            expect(await escrow.connect(partyA).completedCount()).to.be.eq(1)

            expect(await erc20.connect(partyA).balanceOf(partyAAddress)).to.be.eq(hre.ethers.parseEther("10"))
            expect(await erc1155.connect(partyA).balanceOf(partyBAddress, 0)).to.be.eq(1)
        });

        it('Should Succeed ERC1155 to ERC721', async () => {
            const partyAParams = [
                [ZERO_ADDRESS, 0],
                [ZERO_ADDRESS, 0],
                [erc1155.target, 0, 1]
            ]

            const partyBParams = [
                [ZERO_ADDRESS, 0],
                [erc721.target, 0],
                [ZERO_ADDRESS, 0, 0]
            ]

            const {deployer, partyA, partyB} = await loadFixture(loadAccounts);
            const partyBAddress = (await partyB.getAddress()).toString()
            const partyAAddress = (await partyA.getAddress()).toString()

            await erc1155.connect(partyA).faucetMint(0, 2, "0x")
            const Abalance = await erc1155.connect(partyA).balanceOf(partyAAddress, 0)
            expect(Abalance).to.be.gte(2)

            await erc1155.connect(partyA).setApprovalForAll(escrow.target, true)
            const aAllowance = await erc1155.connect(partyA).isApprovedForAll(partyAAddress, escrow.target)
            expect(aAllowance).to.be.true

            await erc721.connect(partyB).faucetMint(2)
            const bAllowance = await erc721.connect(partyB).setApprovalForAll(escrow.target, true)

            expect(await erc721.connect(partyB).ownerOf(0)).to.be.eq(partyBAddress)
            expect(await erc721.connect(partyB).isApprovedForAll(partyBAddress, escrow.target)).to.be.true

            const createInstance = await escrow.connect(partyA).createTrade(
                2,
                1,
                "Please Accept",
                partyBAddress,
                partyAParams,
                partyBParams,
            {value: BigInt(await escrow.connect(partyA).feeInETH())}
            )
            
            const instanceId = (await escrow.connect(partyB).getHistory(partyAAddress)).at(-1)

            await expect(escrow.connect(partyB).acceptTrade(instanceId)).to.not.be.reverted;

            expect(await escrow.connect(partyA).pendingCount()).to.be.eq(0)
            expect(await escrow.connect(partyA).completedCount()).to.be.eq(1)

            expect(await erc721.connect(partyA).ownerOf(0)).to.be.eq(partyAAddress)
            expect(await erc1155.connect(partyA).balanceOf(partyBAddress, 0)).to.be.eq(1)
        });

        it('Should Succeed ERC1155 to ERC1155', async () => {
            const partyAParams = [
                [ZERO_ADDRESS, 0],
                [ZERO_ADDRESS, 0],
                [erc1155.target, 0, 1]
            ]

            const partyBParams = [
                [ZERO_ADDRESS, 0],
                [ZERO_ADDRESS, 0],
                [erc1155.target, 1, 1]
            ]

            const {deployer, partyA, partyB} = await loadFixture(loadAccounts);
            const partyBAddress = (await partyB.getAddress()).toString()
            const partyAAddress = (await partyA.getAddress()).toString()

            await erc1155.connect(partyA).faucetMint(0, 2, "0x")
            const Abalance = await erc1155.connect(partyA).balanceOf(partyAAddress, 0)
            expect(Abalance).to.be.gte(2)

            await erc1155.connect(partyA).setApprovalForAll(escrow.target, true)
            const aAllowance = await erc1155.connect(partyA).isApprovedForAll(partyAAddress, escrow.target)
            expect(aAllowance).to.be.true

            await erc1155.connect(partyB).faucetMint(1, 2, "0x")
            const Bbalance = await erc1155.connect(partyB).balanceOf(partyBAddress, 1)
            expect(Bbalance).to.be.gte(2)

            await erc1155.connect(partyB).setApprovalForAll(escrow.target, true)
            const bAllowance = await erc1155.connect(partyB).isApprovedForAll(partyBAddress, escrow.target)
            expect(bAllowance).to.be.true

            const createInstance = await escrow.connect(partyA).createTrade(
                2,
                2,
                "Please Accept",
                partyBAddress,
                partyAParams,
                partyBParams,
            {value: BigInt(await escrow.connect(partyA).feeInETH())}
            )
            
            const instanceId = (await escrow.connect(partyB).getHistory(partyAAddress)).at(-1)

            await expect(escrow.connect(partyB).acceptTrade(instanceId)).to.not.be.reverted;

            expect(await escrow.connect(partyA).pendingCount()).to.be.eq(0)
            expect(await escrow.connect(partyA).completedCount()).to.be.eq(1)

            expect(await erc1155.connect(partyA).balanceOf(partyBAddress, 0)).to.be.eq(1)
            expect(await erc1155.connect(partyA).balanceOf(partyAAddress, 1)).to.be.eq(1)
        });

    });
    
    describe('Withdrawable Functions', () => {
        /**
        withdraw
        withdrawAmount
        withdrawERC20
        withdrawERC721
        withdrawERC1155
         */

        it('Should Withdraw ETH', async() => {
            const {deployer, partyA, partyB} = await loadFixture(loadAccounts);

            await partyB.sendTransaction({
                to: escrow.target,
                value: hre.ethers.parseEther("1"),
            });

            expect(await hre.ethers.provider.getBalance(escrow.target)).to.be.eq(hre.ethers.parseEther("1"))

            await expect(escrow.connect(deployer).withdraw()).to.be.not.reverted
            
            expect(await hre.ethers.provider.getBalance(escrow.target)).to.be.eq(0)
            
        });

        it('Should Withdraw Specific Amount of ETH', async() => {
            const {deployer, partyA, partyB} = await loadFixture(loadAccounts);
            
            await partyB.sendTransaction({
                to: escrow.target,
                value: hre.ethers.parseEther("1"),
            });

            expect(await hre.ethers.provider.getBalance(escrow.target)).to.be.eq(hre.ethers.parseEther("1"))

            await expect(escrow.connect(deployer).withdrawAmount(hre.ethers.parseEther("0.5"))).to.be.not.reverted
            
            expect(await hre.ethers.provider.getBalance(escrow.target)).to.be.eq(hre.ethers.parseEther("0.5"))
        });

        it('Should Withdraw ERC20', async() => {
            const {deployer, partyA, partyB} = await loadFixture(loadAccounts);

            await erc20.connect(deployer).faucetMint(deployer.address)

            expect(await erc20.connect(deployer).balanceOf(deployer.address)).to.be.gt(0)

            expect(await erc20.connect(deployer).transfer(escrow.target, hre.ethers.parseEther("10")))

            expect(await erc20.connect(deployer).balanceOf(escrow.target)).to.be.eq(hre.ethers.parseEther("10"))

            await expect(escrow.connect(deployer).withdrawERC20(deployer.address, erc20.target, hre.ethers.parseEther("10"))).to.not.be.reverted
           
            expect(await erc20.connect(deployer).balanceOf(escrow.target)).to.be.eq(hre.ethers.parseEther("0"))
        });

        it('Should Withdraw ERC721', async() => {
            const {deployer, partyA, partyB} = await loadFixture(loadAccounts);

            await erc721.connect(deployer).faucetMint(1)

            expect(await erc721.connect(deployer).balanceOf(deployer.address)).to.be.eq(1)

            expect(await erc721.connect(deployer).ownerOf(0)).to.be.eq(deployer.address)

            expect(await erc721.connect(deployer).transferFrom(deployer.address, escrow.target, 0))

            expect(await erc721.connect(deployer).balanceOf(escrow.target)).to.be.eq(1)

            expect(await erc721.connect(deployer).ownerOf(0)).to.be.eq(escrow.target)

            await expect(escrow.connect(deployer).withdrawERC721(deployer.address, erc721.target, 0)).to.not.be.reverted
           
            expect(await erc721.connect(deployer).balanceOf(escrow.target)).to.be.eq(0)

            expect(await erc721.connect(deployer).ownerOf(0)).to.be.eq(deployer.address)
            
        });

        it('Should Fail Depositing ERC1155 Due To ERC1155Receiver Not Implemented', async() => {
            const {deployer, partyA, partyB} = await loadFixture(loadAccounts);

            await erc1155.connect(deployer).faucetMint(0, 1, "0x")

            expect(await erc1155.connect(deployer).balanceOf(deployer.address, 0)).to.be.eq(1)

            await expect(erc1155.connect(deployer).safeTransferFrom(deployer.address, escrow.target, 0, 1, "0x")).to.be.reverted
           
        });

        it('Should Not Withdraw ETH', async() => {
            const {deployer, partyA, partyB} = await loadFixture(loadAccounts);

            await partyB.sendTransaction({
                to: escrow.target,
                value: hre.ethers.parseEther("1"),
            });

            expect(await hre.ethers.provider.getBalance(escrow.target)).to.be.eq(hre.ethers.parseEther("1"))

            await expect(escrow.connect(partyA).withdraw()).to.be.reverted
            
            expect(await hre.ethers.provider.getBalance(escrow.target)).to.be.eq(hre.ethers.parseEther("1"))
        });

        it('Should Not Withdraw Specific Amount of ETH', async() => {
            const {deployer, partyA, partyB} = await loadFixture(loadAccounts);

            await partyB.sendTransaction({
                to: escrow.target,
                value: hre.ethers.parseEther("1"),
            });

            expect(await hre.ethers.provider.getBalance(escrow.target)).to.be.eq(hre.ethers.parseEther("1"))

            await expect(escrow.connect(partyA).withdrawAmount(hre.ethers.parseEther("0.5"))).to.be.reverted
            
            expect(await hre.ethers.provider.getBalance(escrow.target)).to.be.eq(hre.ethers.parseEther("1"))
        });

        it('Should Not Withdraw ERC20', async() => {
            const {deployer, partyA, partyB} = await loadFixture(loadAccounts);

            await erc20.connect(deployer).faucetMint(deployer.address)

            expect(await erc20.connect(deployer).balanceOf(deployer.address)).to.be.gt(0)

            expect(await erc20.connect(deployer).transfer(escrow.target, hre.ethers.parseEther("10")))

            expect(await erc20.connect(deployer).balanceOf(escrow.target)).to.be.eq(hre.ethers.parseEther("10"))

            await expect(escrow.connect(partyA).withdrawERC20(partyA.address, erc20.target, hre.ethers.parseEther("10"))).to.be.reverted
           
            expect(await erc20.connect(deployer).balanceOf(escrow.target)).to.be.eq(hre.ethers.parseEther("10"))
        });

        it('Should Not Withdraw ERC721', async() => {
            const {deployer, partyA, partyB} = await loadFixture(loadAccounts);

            await erc721.connect(deployer).faucetMint(1)

            expect(await erc721.connect(deployer).balanceOf(deployer.address)).to.be.eq(1)

            expect(await erc721.connect(deployer).ownerOf(0)).to.be.eq(deployer.address)

            expect(await erc721.connect(deployer).transferFrom(deployer.address, escrow.target, 0))

            expect(await erc721.connect(deployer).balanceOf(escrow.target)).to.be.eq(1)

            expect(await erc721.connect(deployer).ownerOf(0)).to.be.eq(escrow.target)

            await expect(escrow.connect(partyA).withdrawERC721(partyA.address, erc721.target, 0)).to.be.reverted
           
            expect(await erc721.connect(deployer).balanceOf(escrow.target)).to.be.eq(1)

            expect(await erc721.connect(deployer).ownerOf(0)).to.be.eq(escrow.target)
        });
        
    });
    
    describe('Ownable Functions', () => {

        it('Owner Should be The Same As The Deployer', async () => {
            const {deployer, partyA, partyB} = await loadFixture(loadAccounts);

            expect(await escrow.connect(deployer).owner()).to.be.eq(deployer.address)

            
        });

        it('Should Transfer Ownership', async () => {
            const {deployer, partyA, partyB} = await loadFixture(loadAccounts);

            await expect(escrow.connect(deployer).transferOwnership(partyA.address)).to.not.be.reverted

            expect(await escrow.connect(deployer).owner()).to.be.eq(partyA.address)

            
        });

        it('Should Not Transfer Ownerships', async () => {
            const {deployer, partyA, partyB} = await loadFixture(loadAccounts);

            await expect(escrow.connect(partyB).transferOwnership(partyA.address)).to.be.reverted

            expect(await escrow.connect(partyB).owner()).to.be.eq(deployer.address)
            
        });
        
    });

    describe('Fees Functions', () => {

        it('Should Set Fees', async () => {
            const {deployer, partyA, partyB} = await loadFixture(loadAccounts);

            await expect(escrow.connect(deployer).setFee(hre.ethers.parseEther("0.1"))).to.not.be.reverted

            expect(await escrow.connect(deployer).feeInETH()).to.be.eq(hre.ethers.parseEther("0.1"))

            
        });

        it('Should Not Set Fees', async () => {
            const {deployer, partyA, partyB} = await loadFixture(loadAccounts);

            await expect(escrow.connect(partyB).setFee(hre.ethers.parseEther("0.1"))).to.be.reverted

            expect(await escrow.connect(partyB).feeInETH()).to.be.eq(hre.ethers.parseEther("0.001"))
            
        });
        
        
    });
    
    describe('Pausable Functions', () => {
        
        it('Should Toggle Create and Accept', async () => {
            const {deployer, partyA, partyB} = await loadFixture(loadAccounts);

            await expect(escrow.connect(deployer).toggleCreateAndAccept()).to.not.be.reverted

            expect(await escrow.connect(deployer).interactionPaused()).to.be.true

            
        });

        it('Should Not Toggle Create and Accept', async () => {
            const {deployer, partyA, partyB} = await loadFixture(loadAccounts);

            await expect(escrow.connect(partyB).toggleCreateAndAccept()).to.be.reverted

            expect(await escrow.connect(partyB).interactionPaused()).to.be.false
            
        });

    });
    
    
    
});
