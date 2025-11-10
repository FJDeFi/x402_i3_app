// Pricing utilities for USDC-based billing
const PRICING_CONSTANTS = {
  pricePerApiCallUsdc: 0.0008,
  gasEstimatePerCallUsdc: 0.00025,
  sharePurchaseMinUsdc: 1,
  sharePurchaseMaxUsdc: 20,
  dailyCheckInRewardUsdc: 0.01
};

function formatUsdcAmount(amount, options = {}) {
  const value = Number(amount || 0);
  const minimumFractionDigits = options.minimumFractionDigits ?? 4;
  const maximumFractionDigits = options.maximumFractionDigits ?? 6;
  const min = Math.min(Math.max(minimumFractionDigits, 0), maximumFractionDigits);
  return `${value.toFixed(min)} USDC`;
}

function calculateModelCallCostUsdc(callCount = 1, overrides = {}) {
  const pricePerCall = overrides.pricePerApiCallUsdc ?? PRICING_CONSTANTS.pricePerApiCallUsdc;
  const gasPerCall = overrides.gasEstimatePerCallUsdc ?? PRICING_CONSTANTS.gasEstimatePerCallUsdc;
  const calls = Math.max(Number(callCount) || 0, 0);
  const computeCost = calls * pricePerCall;
  const gasCost = calls * gasPerCall;
  return { calls, computeCost, gasCost, totalCost: computeCost + gasCost };
}

function clampSharePrice(value) {
  const num = Number(value);
  if (!Number.isFinite(num)) return 5;
  return Math.min(PRICING_CONSTANTS.sharePurchaseMaxUsdc, Math.max(PRICING_CONSTANTS.sharePurchaseMinUsdc, num));
}

function normalizeModelPricing(model = {}) {
  const pricePerCall = Number.isFinite(model.pricePerApiCallUsdc)
    ? model.pricePerApiCallUsdc
    : PRICING_CONSTANTS.pricePerApiCallUsdc;
  const gas = Number.isFinite(model.gasEstimatePerCallUsdc)
    ? model.gasEstimatePerCallUsdc
    : PRICING_CONSTANTS.gasEstimatePerCallUsdc;
  const shareFromModel = Number.isFinite(model.sharePriceUsdc)
    ? model.sharePriceUsdc
    : (Number.isFinite(model.sharePrice) ? model.sharePrice / 10 : undefined);
  const sharePrice = clampSharePrice(shareFromModel);

  return {
    currency: 'USDC',
    pricePerCallUsdc: pricePerCall,
    gasPerCallUsdc: gas,
    sharePriceUsdc: sharePrice,
    computeTotal(callCount = 1) {
      const { computeCost, gasCost, totalCost } = calculateModelCallCostUsdc(callCount, {
        pricePerApiCallUsdc: pricePerCall,
        gasEstimatePerCallUsdc: gas
      });
      return { computeCost, gasCost, totalCost };
    }
  };
}

const PricingUtils = {
  constants: PRICING_CONSTANTS,
  formatUsdcAmount,
  calculateModelCallCostUsdc,
  normalizeModelPricing
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = PricingUtils;
}

if (typeof window !== 'undefined') {
  window.PricingUtils = PricingUtils;
}
