// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

/**
 * @title Intelligence Cubed Check-In Core Contract
 * @dev Core contract for daily check-ins with credit rewards
 * @author Intelligence Cubed Team
 */
contract I3CheckInCore is Ownable, ReentrancyGuard, Pausable {
    
    // Check-in related events
    event CheckedIn(address indexed user, uint256 indexed dayIndex, uint256 streak, uint256 credits);
    event StreakBonusAwarded(address indexed user, uint256 streak, uint256 bonus);
    event CreditsRedeemed(address indexed user, uint256 amount);
    
    // Legacy events (for future expansion)
    event ModelQueried(address indexed user, uint256 indexed queryId, string query, string selectedModel);
    event QueryFeeUpdated(uint256 newFee);
    
    // Check-in related structs
    struct UserCheckIn {
        uint256 lastCheckInDay;        // Last day user checked in (UTC day index)
        uint256 currentStreak;         // Current consecutive check-in streak
        uint256 longestStreak;         // User's longest streak record
        uint256 totalCheckIns;         // Total number of check-ins
        uint256 totalCredits;          // Total credits earned
        uint256 availableCredits;      // Credits available to spend
        uint256 firstCheckIn;          // Timestamp of first check-in
    }
    
    struct DailyStats {
        uint256 totalUsers;            // Total users who checked in this day
        uint256 newUsers;              // New users who checked in for first time
        uint256 creditsAwarded;        // Total credits awarded this day
    }
    
    // State variables
    mapping(address => UserCheckIn) public userCheckIns;
    mapping(uint256 => DailyStats) public dailyStats;
    mapping(address => mapping(uint256 => bool)) public hasCheckedInOnDay;
    
    // Reward configuration
    uint256 public baseReward = 10;                    // Base credits per check-in
    uint256 public streakMultiplier = 2;               // Multiplier after 7-day streak
    uint256 public weeklyBonusThreshold = 7;           // Days needed for weekly bonus
    uint256 public monthlyBonusThreshold = 30;         // Days needed for monthly bonus
    uint256 public weeklyBonus = 50;                   // Weekly streak bonus
    uint256 public monthlyBonus = 200;                 // Monthly streak bonus
    
    // Platform stats
    uint256 public totalUsers;
    uint256 public totalCheckIns;
    uint256 public totalCreditsAwarded;
    uint256 public currentDay;
    
    // Token integration
    address public tokenContract;
    bool public tokenRewardsEnabled = false;
    
    // Legacy support (for future AI features)
    uint256 public defaultQueryFee = 0.001 ether;
    mapping(uint256 => string) public availableModels;
    uint256 public modelCount = 0;
    
    constructor() {
        currentDay = block.timestamp / 86400;
        
        // Initialize with some basic "AI models" for future expansion
        availableModels[1] = "Basic Assistant";
        availableModels[2] = "Crypto Analyzer";  
        availableModels[3] = "Smart Advisor";
        modelCount = 3;
    }
    
    /**
     * @dev Daily check-in function - core feature for audit
     */
    function checkIn() external payable nonReentrant whenNotPaused {
        uint256 today = block.timestamp / 86400;
        require(!hasCheckedInOnDay[msg.sender][today], "Already checked in today");
        
        UserCheckIn storage user = userCheckIns[msg.sender];
        
        // Handle first-time user
        if (user.firstCheckIn == 0) {
            user.firstCheckIn = block.timestamp;
            totalUsers++;
            dailyStats[today].newUsers++;
        }
        
        // Calculate streak
        uint256 newStreak = _calculateStreak(user.lastCheckInDay, today);
        
        // Calculate rewards
        uint256 credits = _calculateReward(newStreak);
        
        // Update user data
        _updateUserData(user, today, newStreak, credits);
        
        // Update global stats
        _updateGlobalStats(today, credits);
        
        // Award bonus tokens if enabled
        if (tokenRewardsEnabled && tokenContract != address(0)) {
            _awardTokenReward(msg.sender, credits);
        }
        
        // Check for milestone bonuses
        _checkMilestoneBonuses(msg.sender, newStreak);
        
        emit CheckedIn(msg.sender, today, newStreak, credits);
    }
    
    /**
     * @dev Calculate new streak based on last check-in day
     */
    function _calculateStreak(uint256 lastDay, uint256 today) internal pure returns (uint256) {
        if (lastDay == today - 1) {
            return lastDay == 0 ? 1 : lastDay + 1; // Handle edge case
        } else if (lastDay < today - 1) {
            return 1;
        } else {
            revert("Invalid check-in day");
        }
    }
    
    /**
     * @dev Update user check-in data
     */
    function _updateUserData(UserCheckIn storage user, uint256 today, uint256 newStreak, uint256 credits) internal {
        user.lastCheckInDay = today;
        user.currentStreak = newStreak;
        user.totalCheckIns++;
        user.totalCredits += credits;
        user.availableCredits += credits;
        
        if (newStreak > user.longestStreak) {
            user.longestStreak = newStreak;
        }
    }
    
    /**
     * @dev Update global platform statistics
     */
    function _updateGlobalStats(uint256 today, uint256 credits) internal {
        hasCheckedInOnDay[msg.sender][today] = true;
        totalCheckIns++;
        totalCreditsAwarded += credits;
        dailyStats[today].totalUsers++;
        dailyStats[today].creditsAwarded += credits;
    }
    
    /**
     * @dev Get user check-in status and preview next reward
     */
    function getUserStatus(address user) external view returns (
        uint256 lastDay,
        uint256 streak, 
        uint256 totalCredits,
        uint256 availableCredits,
        uint256 nextReward,
        bool canCheckInToday
    ) {
        UserCheckIn storage userData = userCheckIns[user];
        uint256 today = block.timestamp / 86400;
        
        uint256 potentialStreak = userData.lastCheckInDay == today - 1 ? 
            userData.currentStreak + 1 : 1;
            
        return (
            userData.lastCheckInDay,
            userData.currentStreak,
            userData.totalCredits,
            userData.availableCredits,
            _calculateReward(potentialStreak),
            !hasCheckedInOnDay[user][today]
        );
    }
    
    /**
     * @dev Get global platform statistics
     */
    function getGlobalStats() external view returns (
        uint256 totalUsersCount,
        uint256 totalCheckInsCount, 
        uint256 totalCreditsCount,
        uint256 todayUsers,
        uint256 todayCredits
    ) {
        uint256 today = block.timestamp / 86400;
        return (
            totalUsers,
            totalCheckIns,
            totalCreditsAwarded,
            dailyStats[today].totalUsers,
            dailyStats[today].creditsAwarded
        );
    }
    
    /**
     * @dev Spend credits (placeholder for future features)
     */
    function spendCredits(uint256 amount, string memory purpose) external nonReentrant {
        require(amount > 0, "Amount must be greater than 0");
        require(userCheckIns[msg.sender].availableCredits >= amount, "Insufficient credits");
        
        userCheckIns[msg.sender].availableCredits -= amount;
        
        // In the future, this could unlock premium features, models, etc.
        emit CreditsRedeemed(msg.sender, amount);
    }
    
    /**
     * @dev Future AI query function (simplified placeholder)
     */
    function queryAI(string memory query, uint256 modelId) external payable returns (string memory) {
        require(modelId > 0 && modelId <= modelCount, "Invalid model");
        require(msg.value >= defaultQueryFee, "Insufficient fee");
        require(bytes(query).length > 0, "Query cannot be empty");
        
        // Simple response for demo - in production would call actual AI service
        string memory response = string(abi.encodePacked(
            "AI Response from ", availableModels[modelId], ": ", 
            "Thank you for your query about '", query, "'"
        ));
        
        // Award small credit bonus for AI usage
        userCheckIns[msg.sender].availableCredits += 5;
        
        emit ModelQueried(msg.sender, block.timestamp, query, availableModels[modelId]);
        return response;
    }
    
    // Owner functions
    
    /**
     * @dev Set token contract for reward integration
     */
    function setTokenContract(address _tokenContract) external onlyOwner {
        require(_tokenContract != address(0), "Invalid token contract");
        tokenContract = _tokenContract;
    }
    
    /**
     * @dev Enable/disable token rewards
     */
    function setTokenRewardsEnabled(bool enabled) external onlyOwner {
        tokenRewardsEnabled = enabled;
    }
    
    /**
     * @dev Update reward configuration
     */
    function updateRewardConfig(
        uint256 _baseReward,
        uint256 _weeklyBonus,
        uint256 _monthlyBonus,
        uint256 _weeklyThreshold,
        uint256 _monthlyThreshold
    ) external onlyOwner {
        baseReward = _baseReward;
        weeklyBonus = _weeklyBonus;
        monthlyBonus = _monthlyBonus;
        weeklyBonusThreshold = _weeklyThreshold;
        monthlyBonusThreshold = _monthlyThreshold;
    }
    
    /**
     * @dev Add AI model for future expansion
     */
    function addAIModel(string memory modelName) external onlyOwner {
        modelCount++;
        availableModels[modelCount] = modelName;
    }
    
    /**
     * @dev Update query fee
     */
    function setQueryFee(uint256 newFee) external onlyOwner {
        defaultQueryFee = newFee;
        emit QueryFeeUpdated(newFee);
    }
    
    /**
     * @dev Pause contract
     */
    function pause() external onlyOwner {
        _pause();
    }
    
    /**
     * @dev Unpause contract
     */
    function unpause() external onlyOwner {
        _unpause();
    }
    
    /**
     * @dev Withdraw contract balance
     */
    function withdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No balance to withdraw");
        payable(owner()).transfer(balance);
    }
    
    // Internal functions
    
    /**
     * @dev Calculate reward based on streak
     */
    function _calculateReward(uint256 streak) internal view returns (uint256) {
        uint256 reward = baseReward;
        
        // Streak bonus - doubles after 7 days
        if (streak >= weeklyBonusThreshold) {
            reward = baseReward * streakMultiplier;
        }
        
        // Additional percentage bonus for longer streaks
        if (streak >= 14) {
            reward = (reward * 150) / 100; // 50% bonus
        }
        if (streak >= 21) {
            reward = (reward * 120) / 100; // Additional 20% bonus  
        }
        if (streak >= monthlyBonusThreshold) {
            reward = (reward * 130) / 100; // Additional 30% bonus
        }
        
        return reward;
    }
    
    /**
     * @dev Check and award milestone bonuses
     */
    function _checkMilestoneBonuses(address user, uint256 streak) internal {
        if (streak == weeklyBonusThreshold) {
            userCheckIns[user].availableCredits += weeklyBonus;
            emit StreakBonusAwarded(user, streak, weeklyBonus);
        }
        
        if (streak == monthlyBonusThreshold) {
            userCheckIns[user].availableCredits += monthlyBonus;
            emit StreakBonusAwarded(user, streak, monthlyBonus);
        }
    }
    
    /**
     * @dev Award token rewards (if token integration is enabled)
     */
    function _awardTokenReward(address user, uint256 credits) internal {
        // This would integrate with I3Token contract
        // For now, just a placeholder that could mint tokens
        // based on credits earned
        
        // Example integration:
        // II3Token(tokenContract).mintReward(user, credits * 10**18);
    }
    
    /**
     * @dev Get today's day index
     */
    function getTodayIndex() external view returns (uint256) {
        return block.timestamp / 86400;
    }
}