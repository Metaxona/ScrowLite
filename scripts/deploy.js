const hre = require("hardhat");

async function main() {
    const deployer = await ethers.getSigner(process.env.TEST_WALLET_ADDRESS);

    console.log(`Deployer Account: ${deployer.address}`)

    const ercBalance = await hre.ethers.deployContract("ERCBalance")
    
    const idGenerator = await hre.ethers.deployContract("IdGenerator")
    // const idGenerator = await IdGenerator.deploy();
    // await idGenerator.waitForDeployment();

    const ScrowLite = await hre.ethers.getContractFactory("ScrowLite", {libraries: {IdGenerator: idGenerator.target, ERCBalance: ercBalance.target}})
    const scrowLite = await ScrowLite.deploy()
    // await escrow.waitForDeployment()

    console.log(`ERCBalance deployed to ${ercBalance.target}`);
    console.log(`IdGenerator deployed to ${idGenerator.target}`);
    console.log(`ScrowLite deployed to ${scrowLite.target}`);

    const ScrowLiteData = await hre.ethers.getContractFactory("ScrowLiteData")
    const scrowLiteData = await ScrowLiteData.deploy(scrowLite.target)

    console.log(`EscrowData deployed to ${scrowLiteData.target}`);
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
  
