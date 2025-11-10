const path = require('path');
const { randomUUID } = require('crypto');
const PricingUtils = require(path.join(__dirname, '..', '..', 'pricing.js'));

function loadModelData() {
  const modelPath = path.join(__dirname, '..', '..', 'model-data.js');
  delete require.cache[require.resolve(modelPath)];
  const moduleData = require(modelPath);
  return moduleData.MODEL_DATA || {};
}

function rankModels(models, constraints = {}) {
  const entries = Object.entries(models).map(([name, data]) => {
    const pricing = PricingUtils.normalizeModelPricing(data);
    return {
      name,
      data,
      pricing,
      totalScore: Number(data.totalScore) || 0
    };
  });

  if (constraints?.preferredCategories?.length) {
    const set = new Set(
      constraints.preferredCategories.map((item) => item.toLowerCase())
    );
    return entries
      .filter((item) => set.has((item.data.category || '').toLowerCase()))
      .sort((a, b) => b.totalScore - a.totalScore);
  }

  return entries.sort((a, b) => b.totalScore - a.totalScore);
}

function selectModelForRequest(request = {}) {
  const models = loadModelData();
  const ranked = rankModels(models, request?.constraints);
  const top = ranked[0];
  if (!top) {
    throw new Error('No models available for routing');
  }
  const reasoning = [
    `Selected model "${top.name}" with score ${top.totalScore}`,
    request?.prompt
      ? `Prompt length ${request.prompt.length} chars`
      : 'Prompt length unavailable'
  ].join('. ');
  const requestId = randomUUID();

  return {
    requestId,
    model: {
      id: top.name,
      version: top.data.version || 'latest',
      category: top.data.category,
      pricing: top.pricing
    },
    reasoning
  };
}

function estimateWorkflowNodes(workflowRequest = {}) {
  const nodes = Array.isArray(workflowRequest.nodes)
    ? workflowRequest.nodes
    : [];
  return nodes.map((node) => {
    const models = loadModelData();
    const target = models[node.name];
    const pricing = PricingUtils.normalizeModelPricing(target || {});
    const calls = Math.max(Number(node.calls || node.tokens || 1), 1);
    const compute = pricing.pricePerCallUsdc * calls;
    const gas = pricing.gasPerCallUsdc * calls;
    return {
      id: randomUUID(),
      name: node.name,
      calls,
      pricing,
      computeCost: Number(compute.toFixed(6)),
      gasCost: Number(gas.toFixed(6)),
      totalCost: Number((compute + gas).toFixed(6))
    };
  });
}

module.exports = {
  selectModelForRequest,
  estimateWorkflowNodes
};
