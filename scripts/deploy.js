const hre = require("hardhat");

async function main() {
    const deployer = await ethers.getSigner(process.env.TEST_WALLET_ADDRESS);

    console.log(`Deployer Account: ${deployer.address}`)

    const ercBalance = await hre.ethers.deployContract("ERCBalance")
    
    const idGenerator = await hre.ethers.deployContract("IdGenerator")
    // const idGenerator = await IdGenerator.deploy();
    // await idGenerator.waitForDeployment();

    const Escrow = await hre.ethers.getContractFactory("Escrow", {libraries: {IdGenerator: idGenerator.target, ERCBalance: ercBalance.target}})
    const escrow = await Escrow.deploy()
    // await escrow.waitForDeployment()

    console.log(`ERCBalance deployed to ${ercBalance.target}`);
    console.log(`IdGenerator deployed to ${idGenerator.target}`);
    console.log(`Escrow deployed to ${escrow.target}`);
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
  
