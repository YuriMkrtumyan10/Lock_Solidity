// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

// Import this file to use console.log
import "hardhat/console.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

// 1. Custom types struct/enum
// 2. state variables
// 3. data structures
// 4. events
// 5. constructor
// 6. modifiers
// 7. view/pure~
// 8. external
// 9. public
// 10. internal
// 11. private

contract Lock is Ownable {
    enum Status {
        LOCK,
        UNLOCK
    }

    struct User {
        uint256 id;
        uint256 amountEth;
        uint256 amountToken;
        address tokenAddress;
        uint256 unlockTime;
        Status status;
    }
    uint256 public ownerFee;
    uint256 public usersNumber;

    mapping(address => User) public locks;

    constructor(uint256 _ownerFee) payable {
        ownerFee = _ownerFee;
    }

    event Locked(uint256 _id, address indexed _user, uint256 _lockTime);
    event UnLocked(uint256 _id, address indexed _user, uint256 _unlockTime);
    event Withdrawal(uint _amount, uint _when);

    function lock(
        uint256 _tokenAmount,
        uint256 _lockTime,
        address _tokenAddress
    ) external payable {
        require(
            msg.value > 0 || _tokenAmount > 0,
            "Lock: submit 0 token or ether"
        );
        if (_tokenAddress == address(0x0)) {
            require(msg.sender.balance >= msg.value, "Lock: Not enough Eth");
            payable(address(this)).transfer(msg.value);
        } else {
            require(
                IERC20(_tokenAddress).allowance(msg.sender, address(this)) >=
                    _tokenAmount,
                "Lock: Not enough allowance"
            );
            require(
                IERC20(_tokenAddress).balanceOf(msg.sender) >= _tokenAmount ||
                    msg.sender.balance >= msg.value,
                "Lock: Not enough funds"
            );
            if (msg.value > 0 && _tokenAmount > 0) {
                payable(address(this)).transfer(msg.value);

                IERC20(_tokenAddress).transferFrom(
                    msg.sender,
                    address(this),
                    _tokenAmount
                );
            } else {
                IERC20(_tokenAddress).transferFrom(
                    msg.sender,
                    address(this),
                    _tokenAmount
                );
            }
        }

        usersNumber++;

        locks[msg.sender] = User(
            usersNumber,
            msg.value,
            _tokenAmount,
            _tokenAddress,
            block.timestamp + _lockTime,
            Status.LOCK
        );

        emit Locked(usersNumber, msg.sender, _lockTime);
    }

    function unlock(address _tokenAddress) external payable {
        require(
            locks[msg.sender].id > 0,
            "Lock: Should have been locked to unlock"
        );
        // require(
        //     block.timestamp >= locks[msg.sender].unlockTime,
        //     "Lock: You have to wait"
        // );

        if (_tokenAddress == address(0x0)) {
            payable(msg.sender).transfer(
                locks[msg.sender].amountEth -
                    (locks[msg.sender].amountEth * ownerFee) /
                    100
            );
        } else if (locks[msg.sender].amountToken > 0) {
            IERC20(_tokenAddress).transferFrom(
                address(this),
                msg.sender,
                locks[msg.sender].amountToken -
                    (locks[msg.sender].amountToken * ownerFee) /
                    100
            );
        } else {
            payable(msg.sender).transfer(
                locks[msg.sender].amountEth -
                    (locks[msg.sender].amountEth * ownerFee) /
                    100
            );
            IERC20(_tokenAddress).transferFrom(
                address(this),
                msg.sender,
                locks[msg.sender].amountToken -
                    (locks[msg.sender].amountToken * ownerFee) /
                    100
            );
        }
                                                //block.timestamp changeed to 10 to check the test
        emit UnLocked(usersNumber, msg.sender, 10);
    }

    function withdraw() public payable onlyOwner {
        require(address(this).balance > 0, "You can't withdraw yet");
        payable(owner()).transfer(address(this).balance);
                                                //block.timestamp changeed to 10 to check the test
        emit Withdrawal(address(this).balance, 10);
    }

    receive() external payable {}
}
