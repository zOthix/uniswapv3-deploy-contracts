# Deploy Factory contracts & WETH
npx hardhat run scripts/01.js --network testnet
# Deploy Coins
npx hardhat run scripts/02.js --network testnet
# Deploy Pools
npx hardhat run scripts/03.js --network testnet
# Initialize pools
npx hardhat run scripts/04.js --network testnet
# Swap tests
npx hardhat run scripts/05.js --network testnet
