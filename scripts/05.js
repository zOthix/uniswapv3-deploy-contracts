require("dotenv").config();
SWAP_ROUTER_ADDRESS = process.env.SWAP_ROUTER_ADDRESS;
WETH_ADDRESS = process.env.WETH_ADDRESS;

USDC_ADDRESS = process.env.USDC_ADDRESS;
USDT_ADDRESS = process.env.USDT_ADDRESS;
DAI_ADDRESS = process.env.DAI_ADDRESS;
USDC_ADDRESS = process.env.USDC_ADDRESS;

const { Contract } = require("ethers");
const SwapRouter = require("@uniswap/v3-periphery/artifacts/contracts/SwapRouter.sol/SwapRouter.json");
const erc20 = require("../artifacts/contracts/Tether.sol/Tether.json");

const amountToSwap = 599670;
async function swap(swapRouterContract, token1Addr, token2Addr, poolName) {
  console.log("Initializing swap for pool", poolName);

  const provider = ethers.provider;
  const [owner] = await ethers.getSigners();

  const erc20Contract = new Contract(token1Addr, erc20.abi, provider);
  const tx = await erc20Contract
    .connect(owner)
    .approve(SWAP_ROUTER_ADDRESS, amountToSwap, { gasLimit: 30000000 });
  await tx.wait();
  console.log({ approveHash: tx.hash });

  const zeroForOne = token1Addr < token2Addr;
  console.log("zeroForOne", zeroForOne);

  const params = {
    tokenIn: token1Addr,
    tokenOut: token2Addr,
    fee: "3000",
    recipient: owner,
    deadline: Math.floor(Date.now() / 1000) + 60 * 10,
    amountIn: amountToSwap,
    amountOutMinimum: 0,
    sqrtPriceLimitX96: zeroForOne
      ? 5295128739n
      : 6703485210103287273052203988822378723970342n,
  };

  const condition = zeroForOne
    ? params.sqrtPriceLimitX96 < 79228162514264337593543950336n &&
      params.sqrtPriceLimitX96 > 4295128739n
    : params.sqrtPriceLimitX96 > 79228162514264337593543950336n &&
      params.sqrtPriceLimitX96 <
        1461446703485210103287273052203988822378723970342n;
  if (!condition) {
    throw new Error("SPL");
  }

  const data = await swapRouterContract
    .connect(owner)
    .exactInputSingle(params, { gasLimit: 30000000 });
  console.log("Tx hash", data.hash)
}

async function main() {
  console.log("Sanity Swapping test...");

  const swapRouterContract = new Contract(
    SWAP_ROUTER_ADDRESS,
    SwapRouter.abi,
    ethers.provider
  );

  await swap(
    swapRouterContract,
    USDC_ADDRESS,
    WETH_ADDRESS,
    "USDC & WETH POOL"
  );
  await swap(
    swapRouterContract,
    USDT_ADDRESS,
    WETH_ADDRESS,
    "USDT & WETH POOL"
  );
  await swap(swapRouterContract, DAI_ADDRESS, WETH_ADDRESS, "DAI & WETH POOL");
  await swap(
    swapRouterContract,
    USDT_ADDRESS,
    USDC_ADDRESS,
    "USDT & USDC POOL"
  );
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
