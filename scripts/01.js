require("dotenv").config();
const { ContractFactory, getAddress, encodeBytes32String, ZeroHash } = require("ethers");
const WETH9 = require("./WETH9.json");
const UNIVERSAL_ROUTER = require("./UniversalRouter.json");
const UNSUPPORTED_PROTOCOL = require("./UnsupportedProtocol.json");
const fs = require("fs");
const { promisify } = require("util");

const artifacts = {
  UniswapV3Factory: require("@uniswap/v3-core/artifacts/contracts/UniswapV3Factory.sol/UniswapV3Factory.json"),
  UniswapV2Factory: require("@uniswap/v2-core/build/UniswapV2Factory.json"),
  SwapRouter: require("@uniswap/swap-router-contracts/artifacts/contracts/SwapRouter02.sol/SwapRouter02.json"),
  NFTDescriptor: require("@uniswap/v3-periphery/artifacts/contracts/libraries/NFTDescriptor.sol/NFTDescriptor.json"),
  NonfungibleTokenPositionDescriptor: require("@uniswap/v3-periphery/artifacts/contracts/NonfungibleTokenPositionDescriptor.sol/NonfungibleTokenPositionDescriptor.json"),
  NonfungiblePositionManager: require("@uniswap/v3-periphery/artifacts/contracts/NonfungiblePositionManager.sol/NonfungiblePositionManager.json"),
  multicall: require("./Multicall.json"),
  quoter: require("@uniswap/v3-periphery/artifacts/contracts/lens/QuoterV2.sol/QuoterV2.json"),
  v3Migration: require("@uniswap/v3-periphery/artifacts/contracts/V3Migrator.sol/V3Migrator.json"),
  ticklens: require("@uniswap/v3-periphery/artifacts/contracts/lens/TickLens.sol/TickLens.json"),
  WETH9,
  UNIVERSAL_ROUTER,
  UNSUPPORTED_PROTOCOL
};

const linkLibraries = ({ bytecode, linkReferences }, libraries) => {
  Object.keys(linkReferences).forEach((fileName) => {
    Object.keys(linkReferences[fileName]).forEach((contractName) => {
      if (!libraries.hasOwnProperty(contractName)) {
        throw new Error(`Missing link library name ${contractName}`);
      }
      const address = getAddress(libraries[contractName])
        .toLowerCase()
        .slice(2);
      linkReferences[fileName][contractName].forEach(({ start, length }) => {
        const start2 = 2 + start * 2;
        const length2 = length * 2;
        bytecode = bytecode
          .slice(0, start2)
          .concat(address)
          .concat(bytecode.slice(start2 + length2, bytecode.length));
      });
    });
  });
  return bytecode;
};

async function main() {
  const [owner] = await ethers.getSigners();
  console.log("initializing script with owner", owner.address);

  console.log("Deploying WETH..");
  Weth = new ContractFactory(
    artifacts.WETH9.abi,
    artifacts.WETH9.bytecode,
    owner
  );
  weth = await Weth.deploy({ gasLimit: 30000000 });
  console.log({ wethAddress: weth.target });

  nativeCoinToDeposit = 1000000000000000000000;
  console.log("Depositing Native coin to get WETH", nativeCoinToDeposit / 1e18);
  const txDep = await weth.deposit({
    value: String(BigInt(nativeCoinToDeposit)),
    gasLimit: 30000000,
  });
  await txDep.wait();
  console.log({ txDep: txDep.hash });

  console.log("Deploying FactoryV3 contract...");
  Factory = new ContractFactory(
    artifacts.UniswapV3Factory.abi,
    artifacts.UniswapV3Factory.bytecode,
    owner
  );
  factoryV3 = await Factory.deploy({ gasLimit: 30000000 });
  console.log({ factoryAddress: factoryV3.target });

  console.log("Deploying FactoryV2 contract...");
  FactoryV2 = new ContractFactory(
    artifacts.UniswapV2Factory.abi,
    artifacts.UniswapV2Factory.evm.bytecode,
    owner
  );
  factoryV2 = await FactoryV2.deploy(owner.address, { gasLimit: 30000000 });
  console.log({ factoryAddress: factoryV2.target });

  NFTDescriptor = new ContractFactory(
    artifacts.NFTDescriptor.abi,
    artifacts.NFTDescriptor.bytecode,
    owner
  );
  nftDescriptor = await NFTDescriptor.deploy({ gasLimit: 30000000 });
  console.log({ nftDescriptorAddress: nftDescriptor.target });

  const linkedBytecode = linkLibraries(
    {
      bytecode: artifacts.NonfungibleTokenPositionDescriptor.bytecode,
      linkReferences: {
        "NFTDescriptor.sol": {
          NFTDescriptor: [
            {
              length: 20,
              start: 1681,
            },
          ],
        },
      },
    },
    {
      NFTDescriptor: nftDescriptor.target,
    }
  );

  NonfungibleTokenPositionDescriptor = new ContractFactory(
    artifacts.NonfungibleTokenPositionDescriptor.abi,
    linkedBytecode,
    owner
  );

  const nativeCurrencyLabelBytes = encodeBytes32String("WETH");
  nonfungibleTokenPositionDescriptor =
    await NonfungibleTokenPositionDescriptor.deploy(
      weth.target,
      nativeCurrencyLabelBytes,
      { gasLimit: 30000000 }
    );
  console.log({
    nonfungibleTokenPositionDescriptorAddress:
      nonfungibleTokenPositionDescriptor.target,
  });

  NonfungiblePositionManager = new ContractFactory(
    artifacts.NonfungiblePositionManager.abi,
    artifacts.NonfungiblePositionManager.bytecode,
    owner
  );
  nonfungiblePositionManager = await NonfungiblePositionManager.deploy(
    factoryV3.target,
    weth.target,
    nonfungibleTokenPositionDescriptor.target,
    { gasLimit: 30000000 }
  );
  console.log({
    nonfungiblePositionManagerAddress: nonfungiblePositionManager.target,
  });

  multicall = new ContractFactory(
    artifacts.multicall.abi,
    artifacts.multicall.bytecode,
    owner
  );
  multicall = await multicall.deploy({ gasLimit: 30000000 });
  console.log({ multicallAddress: multicall.target });

  ticklens = new ContractFactory(
    artifacts.ticklens.abi,
    artifacts.ticklens.bytecode,
    owner
  );
  ticklens = await ticklens.deploy({ gasLimit: 30000000 });
  console.log({ ticklensAddress: ticklens.target });

  quoter = new ContractFactory(
    artifacts.quoter.abi,
    artifacts.quoter.bytecode,
    owner
  );
  quoter = await quoter.deploy(factoryV3.target, weth.target, {
    gasLimit: 30000000,
  });
  console.log({ quoterAddress: quoter.target });

  v3Migration = new ContractFactory(
    artifacts.v3Migration.abi,
    artifacts.v3Migration.bytecode,
    owner
  );
  v3Migration = await v3Migration.deploy(
    factoryV3.target,
    weth.target,
    nonfungiblePositionManager.target,
    { gasLimit: 30000000 }
  );
  console.log({ v3MigrationAddress: v3Migration.target });

  console.log("Deploying SwapRouter02 contract...");
  SwapRouter = new ContractFactory(
    artifacts.SwapRouter.abi,
    artifacts.SwapRouter.bytecode,
    owner
  );
  swapRouter = await SwapRouter.deploy(
    factoryV2.target,
    factoryV3.target,
    nonfungiblePositionManager.target,
    weth.target,
    {
      gasLimit: 30000000,
    }
  );
  console.log({ swapRouterAddress: swapRouter.target });

  console.log("Deploying Unsupported protocol..");
  UnsupportedProtocol = new ContractFactory(
    artifacts.UNSUPPORTED_PROTOCOL.abi,
    artifacts.UNSUPPORTED_PROTOCOL.bytecode,
    owner
  );
  
  unsupportedProtocol = await UnsupportedProtocol.deploy({ gasLimit: 3000000 });
  console.log({ unsupportedProtocol : unsupportedProtocol.target });

  console.log("Deploying Universal router..");
  UniversalRouter = new ContractFactory(
    artifacts.UNIVERSAL_ROUTER.abi,
    artifacts.UNIVERSAL_ROUTER.bytecode,
    owner
  );

  universalRouter = await UniversalRouter.deploy(
    process.env.PERMIT2_ADDRESS,
    weth.target,
    unsupportedProtocol.target,
    unsupportedProtocol.target,
    unsupportedProtocol.target,
    unsupportedProtocol.target,
    unsupportedProtocol.target,
    unsupportedProtocol.target,
    unsupportedProtocol.target,
    unsupportedProtocol.target,
    unsupportedProtocol.target,
    unsupportedProtocol.target,
    unsupportedProtocol.target,
    unsupportedProtocol.target,
    unsupportedProtocol.target,
    unsupportedProtocol.target,
    unsupportedProtocol.target,
    factoryV3.target,
    ZeroHash,
    process.env.POOL_INIT_CODE_HASH);
  console.log({ universalRouterAddress: universalRouter.target });


  let addresses = [
    ``,
    `# Factory addresses`,
    `FACTORY_ADDRESS=${factoryV3.target}`,
    `FACTORY_V2_ADDRESS=${factoryV2.target}`,
    `SWAP_ROUTER_ADDRESS=${swapRouter.target}`,
    `NFT_DESCRIPTOR_ADDRESS=${nftDescriptor.target}`,
    `POSITION_DESCRIPTOR_ADDRESS=${nonfungibleTokenPositionDescriptor.target}`,
    `POSITION_MANAGER_ADDRESS=${nonfungiblePositionManager.target}`,
    `MULTICALL_ADDRESS=${multicall.target}`,
    `QUOTER_ADDRESS=${quoter.target}`,
    `V3_MIGRATOR_ADDRESS=${v3Migration.target}`,
    `TICK_LENS_ADDRESS=${ticklens.target}`,
    `UNSUPPORTED_PROTOCOL_ADDRESS=${unsupportedProtocol.target}`,
    `UNIVERSAL_ROUTER_ADDRESS=${universalRouter.target}`,
    ``,
    `# Coin Addresses`,
    `WETH_ADDRESS=${weth.target}`,
  ];
  const data = addresses.join("\n");

  const writeFile = promisify(fs.appendFile);
  const filePath = ".env";
  return writeFile(filePath, data)
    .then(() => {
      console.log("Factory Addresses recorded.");
    })
    .catch((error) => {
      console.error("Error logging addresses:", error);
      throw error;
    });
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
