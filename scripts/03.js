require("dotenv").config();

USDT_ADDRESS = process.env.USDT_ADDRESS;
USDC_ADDRESS = process.env.USDC_ADDRESS;
DAI_ADDRESS = process.env.DAI_ADDRESS;
WRAPPED_BITCOIN_ADDRESS = process.env.WRAPPED_BITCOIN_ADDRESS;
WETH_ADDRESS = process.env.WETH_ADDRESS;
FACTORY_ADDRESS = process.env.FACTORY_ADDRESS;
SWAP_ROUTER_ADDRESS = process.env.SWAP_ROUTER_ADDRESS;
NFT_DESCRIPTOR_ADDRESS = process.env.NFT_DESCRIPTOR_ADDRESS;
POSITION_DESCRIPTOR_ADDRESS = process.env.POSITION_DESCRIPTOR_ADDRESS;
POSITION_MANAGER_ADDRESS = process.env.POSITION_MANAGER_ADDRESS;

const artifacts = {
  UniswapV3Factory: require("@uniswap/v3-core/artifacts/contracts/UniswapV3Factory.sol/UniswapV3Factory.json"),
  NonfungiblePositionManager: require("@uniswap/v3-periphery/artifacts/contracts/NonfungiblePositionManager.sol/NonfungiblePositionManager.json"),
};

const { Contract } = require("ethers");
const bn = require("bignumber.js");
const { promisify } = require("util");
const fs = require("fs");
bn.config({ EXPONENTIAL_AT: 999999, DECIMAL_PLACES: 40 });

const provider = ethers.provider;

function encodePriceSqrt(reserve1, reserve0) {
  return BigInt(
    new bn(reserve1.toString())
      .div(reserve0.toString())
      .sqrt()
      .multipliedBy(new bn(2).pow(96))
      .integerValue(3)
      .toString()
  );
}

const nonfungiblePositionManager = new Contract(
  POSITION_MANAGER_ADDRESS,
  artifacts.NonfungiblePositionManager.abi,
  provider
);

const factory = new Contract(
  FACTORY_ADDRESS,
  artifacts.UniswapV3Factory.abi,
  provider
);

async function deployPool(token0, token1, fee, price) {
  const [owner] = await ethers.getSigners();

  const tx = await nonfungiblePositionManager
    .connect(owner)
    .createAndInitializePoolIfNecessary(token0, token1, fee, price, {
      gasLimit: 30000000,
    });
  const poolAddress = await factory.connect(owner).getPool(token0, token1, fee, {
    gasLimit: 30000000,
  });
  return poolAddress;
}

async function deployPool_(coin1Addr, coin2Addr, poolname) {
  let poolAddr;
  try {
    poolAddr = await deployPool(
      coin1Addr,
      coin2Addr,
      3000,
      encodePriceSqrt(1, 1)
    );
    if (poolAddr === "0x0000000000000000000000000000000000000000")
      throw new Error("Pool doesnt exists");
  } catch (e) {
    console.log("retrying with opposite tokens...")
    poolAddr = await deployPool(
      coin2Addr,
      coin1Addr,
      3000,
      encodePriceSqrt(1, 1)
    );
  }

  let addresses = [`${poolname}=${poolAddr}`];
  const data = "\n" + addresses.join("\n");
  const writeFile = promisify(fs.appendFile);
  const filePath = ".env";
  return await writeFile(filePath, data)
    .then(() => {
      console.log("Address recorded for Pool," , {poolAddr});
    })
    .catch((error) => {
      console.error("Error logging addresses:", error);
      throw error;
    });
}
async function main(){
  await deployPool_(WETH_ADDRESS, USDT_ADDRESS, "WETH_USDT_300" );
  await deployPool_(USDC_ADDRESS, USDT_ADDRESS, "USDC_USDT_300" );
  await deployPool_(WETH_ADDRESS, DAI_ADDRESS, "WETH_DAI_300" );
  await deployPool_(WETH_ADDRESS, USDC_ADDRESS, "WETH_USDC_300" );
};


main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
