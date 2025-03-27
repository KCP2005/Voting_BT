const hre = require("hardhat");

async function main() {
  const VotingContract = await hre.ethers.getContractFactory("VotingContract");
  
  // Deploy the contract
  console.log("Deploying VotingContract...");
  const votingContract = await VotingContract.deploy();
  
  // Wait for deployment to complete
  await votingContract.waitForDeployment();
  
  // Get the deployed contract address
  const address = await votingContract.getAddress();
  console.log("VotingContract deployed to:", address);
  
  // Save the contract address to a file for easy access
  const fs = require("fs");
  fs.writeFileSync(
    "./frontend/src/contractAddress.json",
    JSON.stringify({ address: address }, null, 2)
  );
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });