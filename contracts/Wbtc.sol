pragma solidity ^0.8.20;

import '@openzeppelin/contracts/token/ERC20/ERC20.sol';
import "@openzeppelin/contracts/access/Ownable.sol";

contract WrappedBTC is ERC20, Ownable {
  constructor() ERC20('Wrapped Bitcoin', 'WBTC') Ownable(msg.sender) {}

  function mint(address to, uint256 amount) public onlyOwner {
    _mint(to, amount);
  }

  function decimals() public override view virtual returns (uint8) {
    return 8;
  }
}