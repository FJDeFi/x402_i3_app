console.log('🚀 Starting Intelligence Cubed Homepage Server...');
console.log('📦 Loading dependencies...');

const express = require('express');
const cors = require('cors');
const path = require('path');
const fetch = require('node-fetch');

console.log('✅ Dependencies loaded successfully');

const app = express();
const PORT = process.env.PORT || 3000;

console.log(`🔧 Server configuration: PORT=${PORT}, NODE_ENV=${process.env.NODE_ENV || 'development'}`);

// Enable CORS
app.use(cors());

// Parse JSON request bodies
app.use(express.json());

// Serve static files
app.use(express.static(__dirname));

// API routes
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Intelligence Cubed Homepage Server is running',
    timestamp: new Date().toISOString()
  });
});

// 新增：分页加载模型数据的API
app.get('/api/models', (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const sortBy = req.query.sortBy || 'totalScore';
    
    // 动态加载 model-data.js 来获取数据
    const modelDataPath = path.join(__dirname, 'model-data.js');
    // Use require for CommonJS since we removed ES module exports
    delete require.cache[require.resolve(modelDataPath)];
    const modelDataModule = require(modelDataPath);
    
    // 获取模型数据
    const models = Object.entries(modelDataModule.MODEL_DATA).map(([name, data]) => ({
      name,
      ...data
    }));
    
    // 排序
    models.sort((a, b) => b[sortBy] - a[sortBy]);
    
    // 分页
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedModels = models.slice(startIndex, endIndex);
    
    res.json({
      models: paginatedModels,
      pagination: {
        page,
        limit,
        total: models.length,
        totalPages: Math.ceil(models.length / limit),
        hasNext: endIndex < models.length,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Error loading models:', error);
    res.status(500).json({ error: 'Failed to load models' });
  }
});

// 新增：获取模型统计信息的API
app.get('/api/models/stats', (req, res) => {
  try {
    const modelDataPath = path.join(__dirname, 'model-data.js');
    // Use require for CommonJS since we removed ES module exports
    delete require.cache[require.resolve(modelDataPath)];
    const modelDataModule = require(modelDataPath);
    
    const totalModels = Object.keys(modelDataModule.MODEL_DATA).length;
    
    res.json({
      totalModels,
      categories: [...new Set(Object.values(modelDataModule.MODEL_DATA).map(m => m.category))],
      industries: [...new Set(Object.values(modelDataModule.MODEL_DATA).map(m => m.industry))]
    });
  } catch (error) {
    console.error('Error loading model stats:', error);
    res.status(500).json({ error: 'Failed to load model stats' });
  }
});

// 新增：嵌入向量代理API
app.post('/api/embeddings', async (req, res) => {
  try {
    const { model = 'i3-embedding', input } = req.body;
    const apiKey = req.headers['i3-api-key'] || 'ak_pxOhfZtDes9R6CUyPoOGZtnr61tGJOb2CBz-HHa_VDE';
    
    if (!input) {
      return res.status(400).json({ error: 'Input text is required' });
    }
    
    console.log('🔍 Proxying embeddings request:', { model, inputLength: input.length });
    
    const response = await fetch('http://34.71.119.178:8000/embeddings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'I3-API-Key': apiKey
      },
      body: JSON.stringify({ model, input })
    });
    
    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      console.error('❌ Embeddings API error:', response.status, errorText);
      return res.status(response.status).json({ error: errorText || 'Embeddings API error' });
    }
    
    const data = await response.json();
    console.log('✅ Embeddings response received');
    res.json(data);
    
  } catch (error) {
    console.error('❌ Embeddings proxy error:', error);
    res.status(500).json({ error: 'Failed to get embeddings' });
  }
});

// 新增：聊天完成代理API
app.post('/api/chat/completions', async (req, res) => {
  try {
    const apiKey = req.headers['i3-api-key'] || 'ak_pxOhfZtDes9R6CUyPoOGZtnr61tGJOb2CBz-HHa_VDE';
    
    console.log('🚀 Proxying chat completions request');
    
    const response = await fetch('http://34.71.119.178:8000/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'I3-API-Key': apiKey
      },
      body: JSON.stringify(req.body)
    });
    
    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      console.error('❌ Chat completions API error:', response.status, errorText);
      return res.status(response.status).json({ error: errorText || 'Chat completions API error' });
    }
    
    // For streaming responses, pipe the response
    if (req.body.stream) {
      res.setHeader('Content-Type', 'text/plain');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      
      // Pipe the response stream directly
      response.body.pipe(res);
    } else {
      const data = await response.json();
      res.json(data);
    }
    
  } catch (error) {
    console.error('❌ Chat completions proxy error:', error);
    res.status(500).json({ error: 'Failed to get chat completions' });
  }
});

// Serve the main page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Handle 404s
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Not Found',
    message: 'The requested resource was not found'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Internal Server Error',
    message: 'Something went wrong!'
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Intelligence Cubed Homepage Server is running on port ${PORT}`);
  console.log(`📱 Local: http://localhost:${PORT}`);
  console.log(`📊 API: http://localhost:${PORT}/api/models`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔧 Node version: ${process.version}`);
}).on('error', (err) => {
  console.error('❌ Server failed to start:', err);
  process.exit(1);
}); 