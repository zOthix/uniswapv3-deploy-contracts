# UniswapV3 Deployment Script Documentation

This documentation provides a comprehensive guide for deploying UniswapV3 contracts. Tailored for developers, it streamlines the process of setting up, configuring, and deploying these contracts on various blockchain networks.

## Prerequisites

- Node.js and npm must be installed on your system.
- Familiarity with Ethereum development and the use of Hardhat.

## Setup Instructions

1. **Environment Setup**

   Begin by cloning the repository and installing the necessary dependencies. Rename the `example.env` file to `.env` to prepare for environment variable configuration:

   ```shell
   mv example.env .env

2. **Configure Environment Variables**

    Open the .env file in a text editor and input your private key:
    ```shell 
    PRIVATE_KEY=<YourPrivateKeyHere>
    ```
3. **install dependencies**

    ```yarn``` or ```npm i```
4. **Adjusting Deployment Settings**

    Modify the ```hardhat.config.js``` file to target specific blockchain networks for deployment. This configuration allows for flexible deployment across supported chains.
## Deployment Script Execution
- Edit the deployment script to correspond to your sepcific network
- Run the deployment script with the following command:

```shell
bash run.bash
```
This command deploys the UniswapV3 contracts, sets up example pools, and executes some initial swap transactions for sanity checks.



## Post-Deployment
Upon successful deployment, the script outputs the addresses of the deployed contracts, example pools, and token addresses in ```.env``` file.