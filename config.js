// 🔐 Configuration file for Intelligence Cubed
// This file contains sensitive configuration data

const config = {
    // I3 Proxy API Configuration (used by api-manager.js)
    proxy: {
        apiKey: 'ak_pxOhfZtDes9R6CUyPoOGZtnr61tGJOb2CBz-HHa_VDE',
        model: 'I3-Generic-Foundation-LLM',
        maxTokens: 4000,
        temperature: 0.7
    },

    // Pricing configuration (USDC)
    pricing: {
        currency: 'USDC',
        pricePerApiCallUsdc: 0.0008,
        gasEstimatePerCallUsdc: 0.00025,
        sharePurchaseMinUsdc: 1,
        sharePurchaseMaxUsdc: 20,
        dailyCheckInRewardUsdc: 0.01
    },

    // MCP / payment service configuration
    mcp: {
        baseUrl: 'http://localhost:3000',
        receiptExplorerBaseUrl: 'https://explorer.solana.com/tx?cluster=devnet'
    },
    mcpBaseUrl: 'http://localhost:3000',

    // Solana payment rails
    solana: {
        cluster: 'devnet',
        rpcEndpoint: 'https://api.devnet.solana.com',
        usdcMint: '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU',
        merchantAddress: 'FWSVwBwtyN3mFY96cR3myCbsNYawdyZRyX1W29nsFqYV',
        usdcDecimals: 6
    },

    // Server Configuration
    server: {
        port: 3000,
        host: 'localhost'
    },

    // Application Configuration
    app: {
        name: 'Intelligence Cubed',
        version: '1.0.0',
        environment: (typeof process !== 'undefined' && process && process.env && process.env.NODE_ENV) ? process.env.NODE_ENV : 'development'
    },

    // Model Configuration (legacy - kept for compatibility)
    models: {
        defaultModel: 'I3-Generic-Foundation-LLM',
        fallbackModel: 'I3-Generic-Foundation-LLM',
        maxConcurrentRequests: 10
    }
};

// Export for Node.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = config;
}

// Export for browser
if (typeof window !== 'undefined') {
    window.APP_CONFIG = config;
}
