require("dotenv").config();

USDT_ADDRESS = process.env.USDT_ADDRESS;
WRAPPED_BITCOIN_ADDRESS = process.env.WRAPPED_BITCOIN_ADDRESS;
WETH_ADDRESS = process.env.WETH_ADDRESS;
FACTORY_ADDRESS = process.env.FACTORY_ADDRESS;
SWAP_ROUTER_ADDRESS = process.env.SWAP_ROUTER_ADDRESS;
NFT_DESCRIPTOR_ADDRESS = process.env.NFT_DESCRIPTOR_ADDRESS;
POSITION_DESCRIPTOR_ADDRESS = process.env.POSITION_DESCRIPTOR_ADDRESS;
POSITION_MANAGER_ADDRESS = process.env.POSITION_MANAGER_ADDRESS;

USDC_ADDRESS = process.env.USDC_ADDRESS;
USDT_ADDRESS = process.env.USDT_ADDRESS
UNI_ADDRESS = process.env.UNI_ADDRESS
WBTC_ADDRESS = process.env.WBTC_ADDRESS
DAI_ADDRESS = process.env.DAI_ADDRESS

USDC_USDT_300 = process.env.USDC_USDT_300;
WETH_USDT_300 = process.env.WETH_USDT_300;
WETH_DAI_300 = process.env.WETH_DAI_300;
WETH_USDC_300 = process.env.WETH_USDC_300;

const artifacts = {
  NonfungiblePositionManager: require("@uniswap/v3-periphery/artifacts/contracts/NonfungiblePositionManager.sol/NonfungiblePositionManager.json"),
  Usdt: require("../artifacts/contracts/Tether.sol/Tether.json"),
  Usdc: require("../artifacts/contracts/UsdCoin.sol/UsdCoin.json"),
  UniswapV3Pool: require("@uniswap/v3-core/artifacts/contracts/UniswapV3Pool.sol/UniswapV3Pool.json"),
};

const { Contract } = require("ethers");
const { Token } = require("@uniswap/sdk-core");
const { Pool, Position, nearestUsableTick } = require("@uniswap/v3-sdk");

async function getPoolData(poolContract) {
  const [tickSpacing, fee, liquidity, slot0] = await Promise.all([
    poolContract.tickSpacing(),
    poolContract.fee(),
    poolContract.liquidity(),
    poolContract.slot0(),
  ]);

  return {
    tickSpacing: tickSpacing,
    fee: fee,
    liquidity: liquidity,
    sqrtPriceX96: slot0[0],
    tick: slot0[1],
  };
}

async function initializePool(coin1Addr, coin2Addr, poolAddr, poolName) {
  console.log({coin1Addr, coin2Addr, poolAddr, poolName})
  const [_owner] = await ethers.getSigners();
  const signer2 = _owner;
  const provider = ethers.provider;

  const coin2Contract = new Contract(
    coin2Addr,
    artifacts.Usdt.abi,
    provider
  );
  const coin1Contract = new Contract(coin1Addr, artifacts.Usdc.abi, provider);

  await coin2Contract
    .connect(signer2)
    .approve(POSITION_MANAGER_ADDRESS, ethers.parseEther("100"), {gasLimit: 30000000 });
  await coin1Contract
    .connect(signer2)
    .approve(POSITION_MANAGER_ADDRESS, ethers.parseEther("100"), {gasLimit: 30000000 });

  const poolContract = new Contract(
    poolAddr,
    artifacts.UniswapV3Pool.abi,
    provider
  );

  const poolData = await getPoolData(poolContract);
  const fee = Number(poolData.fee);

  const coin1Token = new Token(97, coin2Addr, 18, "USDT", "Tether");
  const coin2Token = new Token(97, coin1Addr, 18, "USDC", "UsdCoin");

  const pool = new Pool(
    coin1Token,
    coin2Token,
    Number(poolData.fee),
    poolData.sqrtPriceX96.toString(),
    poolData.liquidity.toString(),
    Number(poolData.tick)
  );

  const position = new Position({
    pool: pool,
    liquidity: "100000000000000000000", // 100 eth
    tickLower:
      nearestUsableTick(Number(poolData.tick), Number(poolData.tickSpacing)) -
      Number(poolData.tickSpacing) * 2,
    tickUpper:
      nearestUsableTick(Number(poolData.tick), Number(poolData.tickSpacing)) +
      Number(poolData.tickSpacing) * 2,
  });


  const { amount0: amount0Desired, amount1: amount1Desired } =
    position.mintAmounts;

  params = {
    token0: coin1Addr,
    token1: coin2Addr,
    fee: poolData.fee,
    tickLower:
      nearestUsableTick(Number(poolData.tick), Number(poolData.tickSpacing)) -
      Number(poolData.tickSpacing) * 2,
    tickUpper:
      nearestUsableTick(Number(poolData.tick), Number(poolData.tickSpacing)) +
      Number(poolData.tickSpacing) * 2,
    amount0Desired: amount0Desired.toString(),
    amount1Desired: amount1Desired.toString(),
    amount0Min: 0,
    amount1Min: 0,
    recipient: signer2.address,
    deadline: Math.floor(Date.now() / 1000) + 60 * 10,
  };

  const nonfungiblePositionManager = new Contract(
    POSITION_MANAGER_ADDRESS,
    artifacts.NonfungiblePositionManager.abi,
    provider
  );

  try {
    const tx = await nonfungiblePositionManager
      .connect(signer2)
      .mint(params, { gasLimit: "1000000" });
    await tx.wait();
  } catch (e) {
    console.log("retrying with opposite tokens...")
    params.token0 = coin2Addr;
    params.token1 = coin1Addr;
    const tx = await nonfungiblePositionManager
      .connect(signer2)
      .mint(params, { gasLimit: "1000000" });
    await tx.wait();
  }

  console.log("initialized pool:", poolName)
}

async function main() {
  await initializePool(WETH_ADDRESS, USDT_ADDRESS, WETH_USDT_300, "WETH_USDT_300")
  await initializePool(USDT_ADDRESS, USDC_ADDRESS, USDC_USDT_300, "USDC_USDT_300")
  await initializePool(WETH_ADDRESS, DAI_ADDRESS, WETH_DAI_300, "WETH_DAI_300")
  await initializePool(WETH_ADDRESS, USDC_ADDRESS, WETH_USDC_300, "WETH_USDC_300")
}
 
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
