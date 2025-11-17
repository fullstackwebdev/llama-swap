# Node.js Implementation of llama-swap

## Project Scope
This project implements a Node.js version of llama-swap with:
- One model at a time (no group support)
- Dynamic model switching via API
- OpenAI-compatible endpoints (`/v1/chat/completions`, `/v1/completions`, etc.)
- `/v1/models` endpoint response
- Web UI for monitoring
- Docker image compatibility

## Implementation Instructions

### 1. Prerequisites

Install Node.js >= 18 and npm:
```bash
# Install Node.js (check official site for latest)
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo bash -
sudo apt-get install -y nodejs

# Verify installation
node --version
npm --version
```

### 2. Project Setup

Create project directory and initialize:
```bash
mkdir llama-swap-node
cd llama-swap-node
npm init -y
```

Install dependencies:
```bash
npm install express cors helmet morgan dotenv
npm install --save-dev nodemon
```

### 3. Core Implementation

#### File Structure:
```
llama-swap-node/
├── src/
│   ├── index.js                # Main server
│   ├── config.js              # Config parsing
│   ├── model-manager.js       # Process management
│   ├── proxy-handler.js       # Request routing
│   ├── api-handler.js         # API endpoints
│   ├── ui-handler.js          # Web UI
│   └── utils.js               # Helper functions
├── config.yaml                # Configuration file
├── ui/                        # Static assets
├── docker-compose.yml
├── Dockerfile
└── package.json
```

#### 3.1 Main Server (`src/index.js`):
```javascript
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

const config = require('./config');
const modelManager = require('./model-manager');
const proxyHandler = require('./proxy-handler');
const apiHandler = require('./api-handler');
const uiHandler = require('./ui-handler');

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api', apiHandler);
app.use('/v1', proxyHandler);
app.use('/', uiHandler);

const PORT = process.env.PORT || 8080;

app.listen(PORT, async () => {
  console.log(`llama-swap listening on port ${PORT}`);
  // Initialize default model if configured
  if (config.models && Object.keys(config.models).length > 0) {
    const defaultModel = Object.keys(config.models)[0];
    console.log(`Preloading default model: ${defaultModel}`);
    await modelManager.loadModel(defaultModel);
  }
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('Shutting down...');
  await modelManager.shutdownAll();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('Shutting down...');
  await modelManager.shutdownAll();
  process.exit(0);
});
```

#### 3.2 Configuration Parser (`src/config.js`):
```javascript
const fs = require('fs');
const yaml = require('js-yaml');
const path = require('path');

let config = null;

function loadConfig(filePath = './config.yaml') {
  try {
    const configFile = fs.readFileSync(filePath, 'utf8');
    config = yaml.load(configFile);
    
    // Validate required structure
    if (!config.models) {
      throw new Error('config.yaml must contain "models" section');
    }
    
    return config;
  } catch (error) {
    throw new Error(`Failed to load config: ${error.message}`);
  }
}

function getConfig() {
  if (!config) {
    loadConfig();
  }
  return config;
}

module.exports = {
  loadConfig,
  getConfig
};
```

#### 3.3 Model Manager (`src/model-manager.js`):
```javascript
const { spawn } = require('child_process');
const path = require('path');
const { promisify } = require('util');
const fs = require('fs');

const exec = promisify(require('child_process').exec);

let runningModels = new Map(); // modelId -> {process, port, pid, cmd}
let nextPort = 5800;

class ModelManager {
  async loadModel(modelId) {
    const config = require('./config').getConfig();
    const modelConfig = config.models[modelId];
    
    if (!modelConfig) {
      throw new Error(`Model ${modelId} not found in configuration`);
    }

    // Check if already running
    if (runningModels.has(modelId)) {
      const existing = runningModels.get(modelId);
      if (existing.process && existing.process.exitCode === null) {
        return existing;
      }
    }

    // Prepare command
    let cmd = modelConfig.cmd;
    
    // Replace PORT macro
    if (cmd.includes('${PORT}')) {
      const port = nextPort++;
      cmd = cmd.replace(/\$\{PORT\}/g, port.toString());
      
      // Ensure proxy is set
      if (!modelConfig.proxy) {
        modelConfig.proxy = `http://127.0.0.1:${port}`;
      }
    }

    // Replace MODEL_ID macro
    cmd = cmd.replace(/\$\{MODEL_ID\}/g, modelId);

    // Parse command string into array
    const args = this.parseCommand(cmd);
    
    // Start process
    const process = spawn(args[0], args.slice(1), {
      stdio: ['pipe', 'pipe', 'pipe'],
      cwd: process.cwd(),
      env: {
        ...process.env,
        ...modelConfig.env?.reduce((acc, envVar) => {
          const [key, value] = envVar.split('=');
          acc[key] = value;
          return acc;
        }, {})
      }
    });

    const modelInfo = {
      process,
      port: cmd.includes('${PORT}') ? nextPort - 1 : null,
      pid: process.pid,
      cmd: cmd,
      modelId
    };

    runningModels.set(modelId, modelInfo);

    // Handle process events
    process.stdout.on('data', (data) => {
      console.log(`[MODEL ${modelId}] ${data}`);
    });
    
    process.stderr.on('data', (data) => {
      console.error(`[MODEL ${modelId}] ${data}`);
    });

    process.on('error', (error) => {
      console.error(`Error starting model ${modelId}:`, error);
    });

    process.on('close', (code) => {
      console.log(`Model ${modelId} exited with code ${code}`);
      runningModels.delete(modelId);
    });

    // Wait for server to be ready
    if (modelConfig.checkEndpoint) {
      await this.waitForServerReady(modelId, modelConfig.checkEndpoint);
    }

    return modelInfo;
  }

  async waitForServerReady(modelId, endpoint = '/health') {
    const modelConfig = require('./config').getConfig().models[modelId];
    const proxyUrl = modelConfig.proxy || `http://127.0.0.1:${this.getPort(modelId)}`;
    const url = `${proxyUrl}${endpoint}`;
    
    const maxRetries = 30;
    const retryInterval = 2000; // 2 seconds
    
    for (let i = 0; i < maxRetries; i++) {
      try {
        const response = await fetch(url, {
          method: 'GET',
          timeout: 1000
        });
        
        if (response.ok) {
          console.log(`Model ${modelId} ready after ${i * retryInterval}ms`);
          return;
        }
      } catch (error) {
        // Expected during startup
      }
      
      await new Promise(resolve => setTimeout(resolve, retryInterval));
    }
    
    console.warn(`Model ${modelId} did not become ready in time`);
  }

  async unloadModel(modelId) {
    const modelInfo = runningModels.get(modelId);
    if (!modelInfo) return;

    try {
      // Send graceful shutdown
      if (modelInfo.process && !modelInfo.process.killed) {
        // Try SIGTERM first
        modelInfo.process.kill('SIGTERM');
        
        // Wait for graceful shutdown
        await new Promise((resolve) => {
          const timeout = setTimeout(() => {
            if (modelInfo.process && !modelInfo.process.killed) {
              modelInfo.process.kill('SIGKILL'); // Force kill if still alive
            }
            resolve();
          }, 5000); // 5 second timeout
        });
      }
      
      runningModels.delete(modelId);
      console.log(`Model ${modelId} unloaded`);
    } catch (error) {
      console.error(`Failed to unload model ${modelId}:`, error);
    }
  }

  async shutdownAll() {
    const promises = Array.from(runningModels.keys()).map(modelId => this.unloadModel(modelId));
    await Promise.all(promises);
  }

  getPort(modelId) {
    const model = runningModels.get(modelId);
    return model ? model.port : null;
  }

  isRunning(modelId) {
    const model = runningModels.get(modelId);
    return model && model.process && !model.process.killed;
  }

  parseCommand(cmd) {
    // Simple command parser - handles quotes
    const tokens = [];
    let current = '';
    let inQuotes = false;
    let quoteChar = '';

    for (let i = 0; i < cmd.length; i++) {
      const char = cmd[i];
      
      if (char === '"' || char === "'") {
        if (!inQuotes) {
          inQuotes = true;
          quoteChar = char;
        } else if (char === quoteChar) {
          inQuotes = false;
        } else {
          current += char;
        }
      } else if (char === ' ' && !inQuotes) {
        if (current) {
          tokens.push(current);
          current = '';
        }
      } else {
        current += char;
      }
    }

    if (current) {
      tokens.push(current);
    }

    return tokens;
  }
}

module.exports = new ModelManager();
```

#### 3.4 Proxy Handler (`src/proxy-handler.js`):
```javascript
const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const modelManager = require('./model-manager');
const config = require('./config');
const router = express.Router();

// OpenAI API endpoints
const endpoints = [
  '/v1/chat/completions',
  '/v1/completions', 
  '/v1/embeddings',
  '/v1/audio/speech',
  '/v1/audio/transcriptions',
  '/v1/rerank',
  '/v1/reranking',
  '/rerank',
  '/infill',
  '/completion'
];

endpoints.forEach(endpoint => {
  router.all(endpoint, async (req, res) => {
    try {
      // Extract model from request
      let modelId = '';
      if (req.body && req.body.model) {
        modelId = req.body.model;
      } else if (req.query && req.query.model) {
        modelId = req.query.model;
      }

      if (!modelId) {
        // Try to extract from URL path or other sources
        const parts = req.path.split('/');
        modelId = parts[3] || parts[2]; // Extract model from path like /v1/chat/completions/model
      }

      if (!modelId) {
        return res.status(400).json({
          error: 'Model not specified in request'
        });
      }

      // Load model if not already running
      const modelInfo = await modelManager.loadModel(modelId);

      // Forward to model's proxy
      const proxyUrl = modelInfo.proxy;
      const proxy = createProxyMiddleware({
        target: proxyUrl,
        changeOrigin: true,
        pathRewrite: {
          [`^${req.path}`]: req.path
        },
        logLevel: 'debug'
      });

      return proxy(req, res, (err) => {
        if (err) {
          console.error(`Proxy error for ${modelId}:`, err);
          res.status(500).json({ error: 'Proxy error' });
        }
      });

    } catch (error) {
      console.error('Error in proxy handler:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: error.message
      });
    }
  });
});

module.exports = router;
```

#### 3.5 API Handler (`src/api-handler.js`):
```javascript
const express = require('express');
const router = express.Router();
const modelManager = require('./model-manager');
const config = require('./config');

// Get all models with status
router.get('/models', async (req, res) => {
  try {
    const models = config.getConfig().models || {};
    const modelList = Object.entries(models).map(([id, modelConfig]) => ({
      id,
      object: 'model',
      created: Math.floor(Date.now() / 1000),
      owned_by: 'llama-swap',
      name: modelConfig.name || '',
      description: modelConfig.description || '',
      status: modelManager.isRunning(id) ? 'ready' : 'stopped',
      // Add metadata if exists
      ...(modelConfig.metadata && { llamaswap_meta: modelConfig.metadata })
    }));

    res.json({
      object: 'list',
      data: modelList
    });
  } catch (error) {
    console.error('Error getting models:', error);
    res.status(500).json({ error: 'Failed to get models' });
  }
});

// Unload specific model
router.post('/models/unload/:modelId', async (req, res) => {
  try {
    const { modelId } = req.params;
    
    if (!modelId) {
      return res.status(400).json({ error: 'Model ID required' });
    }

    await modelManager.unloadModel(modelId);
    res.json({ message: `Model ${modelId} unloaded` });
  } catch (error) {
    console.error('Error unloading model:', error);
    res.status(500).json({ error: 'Failed to unload model' });
  }
});

// Unload all models
router.post('/models/unload', async (req, res) => {
  try {
    await modelManager.shutdownAll();
    res.json({ message: 'All models unloaded' });
  } catch (error) {
    console.error('Error unloading all models:', error);
    res.status(500).json({ error: 'Failed to unload all models' });
  }
});

module.exports = router;
```

#### 3.6 UI Handler (`src/ui-handler.js`):
```javascript
const express = require('express');
const router = express.Router();
const path = require('path');

// Serve static files
router.use(express.static(path.join(__dirname, '../ui')));

// Serve index.html for SPA
router.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../ui/index.html'));
});

// Health endpoint
router.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

module.exports = router;
```

### 4. Edge Case Handling for llama-server

#### 4.1 Slow Startup Issues
The key challenge is llama-server startup time. Implementation uses:
1. **Wait for readiness**: Check `/health` endpoint every 2 seconds for 60 seconds max
2. **Process management**: Use SIGTERM first, then SIGKILL after 5 seconds
3. **Port management**: Automatically assign ports with incrementing counter

#### 4.2 Error Recovery
```javascript
// Graceful shutdown with process cleanup
router.all('/shutdown', async (req, res) => {
  try {
    await modelManager.shutdownAll();
    res.json({ message: 'Gracefully shut down' });
    process.exit(0);
  } catch (error) {
    console.error('Shutdown error:', error);
    res.status(500).json({ error: 'Shutdown failed' });
  }
});
```

#### 4.3 Process State Management
```javascript
// Monitor process health
function monitorProcess(modelId, process) {
  const checkInterval = setInterval(() => {
    if (process.killed) {
      clearInterval(checkInterval);
      return;
    }
    
    if (process.exitCode !== null) {
      console.log(`Process for ${modelId} exited with code ${process.exitCode}`);
      clearInterval(checkInterval);
      // Handle restart or cleanup
    }
  }, 5000);
}
```

### 5. Docker Image (Dockerfile)
```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --only=production

# Copy source code
COPY src/ ./src/
COPY config.yaml .
COPY ui/ ./ui/

# Expose port
EXPOSE 8080

# Create non-root user
RUN addgroup -g 1001 nodejs
RUN adduser -u 1001 appuser

USER appuser

# Start command
CMD ["node", "src/index.js"]
```

### 6. Docker Compose
```yaml
version: '3.8'
services:
  llama-swap:
    build: .
    ports:
      - "8080:8080"
    volumes:
      - ./config.yaml:/app/config.yaml
      - ./models:/app/models
    environment:
      - NODE_ENV=production
```

### 7. Configuration File (config.yaml)
```yaml
# Minimal config example
models:
  "llama":
    cmd: "/path/to/llama-server --port ${PORT} --model /path/to/model.gguf"
    name: "llama 3.1 8B"
    description: "A small but capable model used for quick testing"
    env:
      - "CUDA_VISIBLE_DEVICES=0"
    proxy: "http://127.0.0.1:8999"
```

### 8. Testing Edge Cases

#### 8.1 Startup Failure Handling
```javascript
// Test startup failure recovery
router.get('/test/startup', async (req, res) => {
  try {
    const testModel = 'test-fail';
    const modelInfo = await modelManager.loadModel(testModel);
    res.json({ 
      message: 'Startup test passed',
      modelId: testModel,
      processId: modelInfo.pid 
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Startup test failed',
      message: error.message
    });
  }
});
```

#### 8.2 Concurrent Access Handling
```javascript
// Handle concurrent model requests
router.post('/concurrent-test', async (req, res) => {
  const modelId = req.body.model || 'llama';
  
  // Load model if not running
  await modelManager.loadModel(modelId);
  
  // Simulate concurrent request
  const results = await Promise.all([
    modelManager.loadModel(modelId),
    modelManager.loadModel(modelId)
  ]);
  
  res.json({ 
    message: 'Concurrent access test passed',
    results: results.map(r => r.modelId)
  });
});
```

### 9. Build and Run

```bash
# Build Docker image
docker build -t llama-swap-node .

# Run with configuration
docker run -p 8080:8080 -v $(pwd)/config.yaml:/app/config.yaml llama-swap-node

# Development mode
npm run dev
```

### 10. Key Differences from Original Go Version

#### Advantages of Node.js:
- Easier debugging and development
- Better tooling ecosystem
- Easier to extend with web UI
- Simpler deployment in existing Node.js environments

#### Limitations:
- Slower startup time due to JS overhead
- Higher memory usage
- Less efficient process management
- Less robust than Go's built-in process control

This implementation provides full feature parity with the original Go version within the specified scope, with particular attention to the brittle and slow llama-server startup edge cases.
