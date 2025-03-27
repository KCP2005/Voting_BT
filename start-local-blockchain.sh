#!/bin/bash

# Start Hardhat node in the background
echo "Starting Hardhat node..."
npx hardhat node > hardhat.log 2>&1 &
HARDHAT_PID=$!

# Wait for node to start
sleep 5

# Deploy contract
echo "Deploying contract..."
npx hardhat run scripts/deploy.js --network localhost

echo "Contract deployed! Hardhat node is running in the background."
echo "To stop the Hardhat node, run: kill $HARDHAT_PID"