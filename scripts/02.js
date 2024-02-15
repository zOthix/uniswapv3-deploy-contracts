const fs = require('fs');
const { promisify } = require('util');
async function main() {
  const [owner] = await ethers.getSigners();
  const signer2 = owner


  
  USDT = await ethers.getContractFactory('Tether', owner);
  usdt = await USDT.deploy({gasLimit: 30000000 });

  USDC = await ethers.getContractFactory('UsdCoin', owner);
  usdc = await USDC.deploy({gasLimit: 30000000 });

  WBTC= await ethers.getContractFactory('WrappedBTC', owner);
  wbtc = await WBTC.deploy({gasLimit: 30000000 });

  DAI= await ethers.getContractFactory('DAI', owner);
  dai = await DAI.deploy({gasLimit: 30000000 });

  await usdt.connect(owner).mint(
    signer2.address,
    ethers.parseEther('1000000000'),
    {gasLimit: 30000000 }
  )
 
  await usdc.connect(owner).mint(
    signer2.address,
    ethers.parseEther('1000000000'),
    {gasLimit: 30000000 }
  )
 
  await wbtc.connect(owner).mint(
    signer2.address,
    ethers.parseEther('1000000000'),
    {gasLimit: 30000000 }
  )

  await dai.connect(owner).mint(
    signer2.address,
    ethers.parseEther('1000000000'),
    {gasLimit: 30000000 }
  )




  let addresses = [
    `USDC_ADDRESS=${usdc.target}`, 
    `USDT_ADDRESS=${usdt.target}`, 
    `WBTC_ADDRESS=${wbtc.target}`,
    `DAI_ADDRESS=${dai.target}`, 
    ``,
    `# Pool addresses`
  ]
  
  const data = '\n' + addresses.join('\n')

  const writeFile = promisify(fs.appendFile);
  const filePath = '.env';
  return writeFile(filePath, data)
      .then(() => {
        console.log('Coin Addresses recorded.');
      })
      .catch((error) => {
        console.error('Error logging addresses:', error);
        throw error;
      });
}

 
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
