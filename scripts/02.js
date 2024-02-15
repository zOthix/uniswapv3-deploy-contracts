const fs = require('fs');
const { promisify } = require('util');
async function main() {
  const [owner] = await ethers.getSigners();
  const signer2 = owner


  
  Tether = await ethers.getContractFactory('Tether', owner);
  tether = await Tether.deploy({gasLimit: 30000000 });

  Usdc = await ethers.getContractFactory('UsdCoin', owner);
  usdc = await Usdc.deploy({gasLimit: 30000000 });


  UNI = await ethers.getContractFactory('Uni', owner);
  uni = await UNI.deploy({gasLimit: 30000000 });


  WBTC= await ethers.getContractFactory('WrappedBTC', owner);
  wbtc = await WBTC.deploy({gasLimit: 30000000 });

  DAI= await ethers.getContractFactory('DAI', owner);
  dai = await DAI.deploy({gasLimit: 30000000 });

  await tether.connect(owner).mint(
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
    `USDT_ADDRESS=${tether.target}`, 
    `UNI_ADDRESS=${uni.target}`,  
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
