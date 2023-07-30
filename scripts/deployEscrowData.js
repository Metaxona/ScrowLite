const hre = require("hardhat");

async function main() {

    const deployer = await ethers.getSigner(process.env.TEST_WALLET_ADDRESS);

    console.log(`Deployer Account: ${deployer.address}`)

    const EscrowData = await hre.ethers.getContractFactory("EscrowData")
    const escrowData = await EscrowData.deploy("0x61caFF3872f505D3D0a4F40E156235D506816E49")

    console.log(`EscrowData deployed to ${escrowData.target}`);
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
  
