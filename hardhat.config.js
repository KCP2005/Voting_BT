require("@nomicfoundation/hardhat-toolbox");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.19",
  networks: {
    hardhat: {
      chainId: 1337 // This makes it easier to connect with MetaMask
    },
    localhost: {
      url: "http://127.0.0.1:8545/",
      chainId: 1337
    }
  },
  paths: {
    artifacts: "./frontend/src/artifacts",
  }
};
