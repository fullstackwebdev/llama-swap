const express = require('express');
const cors = require('cors');
const { createProxyMiddleware } = require('http-proxy-middleware');
const { program } = require('commander');
const fs = require('fs');
const ConfigLoader = require('./config-loader');
const { ProcessManager, ProcessState } = require('./process-manager');
const { createLogger, format, transports } = require('winston');

// Define command line options
program
  .option('-c, --config <path>', 'config file path', 'config.yaml')
  .option('-l, --listen <address>', 'listen address')
  .option('--tls-cert-file <path>', 'TLS certificate file')
  .option('--tls-key-file <path>', 'TLS key file')
  .option('--version', 'show version')
  .option('--watch-config', 'watch config file for changes');

program.parse();
const options = program.opts();

if (options.version) {
  console.log('llama-swap Node.js version 1.0.0');
  process.exit(0);
}

// Create loggers
const logger = createLogger({
  level: 'info',
  format: format.combine(
    format.timestamp(),
    format.errors({ stack: true }),
    format.splat(),
    format.json()
  ),
  transports: [
    new transports.Console({
      format: format.combine(
        format.colorize(),
        format.simple()
      )
    })
  ]
});

// Load configuration
let configLoader;
let config;
let processManager;

try {
  configLoader = new ConfigLoader();
  config = configLoader.loadConfig(options.config);
  
  // Update logger level based on config
  logger.level = config.logLevel || 'info';
} catch (err) {
  logger.error(`Error loading config: ${err.message}`);
  process.exit(1);
}

// Create process manager
const upstreamLogger = createLogger({
  level: config.logLevel || 'info',
  format: format.combine(
    format.timestamp(),
    format.errors({ stack: true }),
    format.splat(),
    format.json()
  ),
  transports: [
    new transports.Console({
      format: format.combine(
        format.colorize(),
        format.simple()
      )
    })
  ]
});

processManager = new ProcessManager(config, logger, upstreamLogger);

// Create Express app
const app = express();

// Enable CORS
app.use(cors());

// Parse JSON bodies
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Handle multipart forms (for audio/speech, audio/transcriptions)
app.use('/v1/audio', express.raw({ type: 'multipart/form-data', limit: '50mb' }));

// Log requests if enabled
if (config.logRequests) {
  app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
      const duration = Date.now() - start;
      logger.info(`Request ${req.ip} "${req.method} ${req.path}" ${res.statusCode} ${res.get('Content-Length') || 0} "${req.get('User-Agent') || ''}" ${duration}ms`);
    });
    next();
  });
}

// API endpoints

// List available models
app.get('/v1/models', (req, res) => {
  const data = [];
  const createdTime = Math.floor(Date.now() / 1000);

  for (const [id, modelConfig] of Object.entries(config.models)) {
    if (modelConfig.unlisted) {
      continue;
    }

    const newRecord = (modelId) => {
      const record = {
        id: modelId,
        object: 'model',
        created: createdTime,
        owned_by: 'llama-swap',
      };

      if (modelConfig.name && modelConfig.name.trim() !== '') {
        record.name = modelConfig.name.trim();
      }
      if (modelConfig.description && modelConfig.description.trim() !== '') {
        record.description = modelConfig.description.trim();
      }

      // Add metadata if present
      if (modelConfig.metadata && Object.keys(modelConfig.metadata).length > 0) {
        record.meta = {
          llamaswap: modelConfig.metadata
        };
      }
      return record;
    };

    data.push(newRecord(id));

    // Include aliases
    if (config.includeAliasesInList && modelConfig.aliases) {
      for (const alias of modelConfig.aliases) {
        if (alias && alias.trim() !== '') {
          data.push(newRecord(alias.trim()));
        }
      }
    }
  }

  // Sort by the "id" key
  data.sort((a, b) => a.id.localeCompare(b.id));

  // Set CORS headers if origin exists
  if (req.get('Origin')) {
    res.header('Access-Control-Allow-Origin', req.get('Origin'));
  }

  res.json({
    object: 'list',
    data: data
  });
});

// Proxy OpenAI API requests
app.post('/v1/chat/completions', async (req, res) => {
  const requestedModel = req.body.model;
  if (!requestedModel) {
    return res.status(400).json({ error: 'missing or invalid \'model\' key' });
  }

  const { config: modelConfig, name: realModelName, found } = configLoader.findConfig(requestedModel);
  if (!found) {
    return res.status(400).json({ error: `could not find real modelID for ${requestedModel}` });
  }

  try {
    const { processGroup, realModelName } = await processManager.swapProcessGroup(requestedModel);

    // Get the specific process for this model and ensure it's ready
    const process = processGroup.processes.get(realModelName);
    if (!process) {
      throw new Error(`Could not find process for model ${realModelName}`);
    }

    // Start the process if it's not already ready
    if (process.getCurrentState() !== ProcessState.READY) {
      logger.info(`<${realModelName}> Starting model process...`);
      const success = await process.start();
      if (!success) {
        throw new Error(`Failed to start process for model ${realModelName}`);
      }
      logger.info(`<${realModelName}> Model process started successfully`);
    }

    // Modify the request to use the correct model name if needed
    if (modelConfig.useModelName) {
      req.body.model = modelConfig.useModelName;
    }

    // Strip parameters if configured
    if (modelConfig.filters && modelConfig.filters.stripParams) {
      const stripParams = modelConfig.filters.stripParams.split(',')
        .map(param => param.trim())
        .filter(param => param !== 'model' && param !== '');

      for (const param of stripParams) {
        delete req.body[param];
      }
    }

    // Proxy the request to the model's server
    const proxyOptions = {
      target: modelConfig.proxy,
      changeOrigin: true,
      pathRewrite: {
        '^/v1/chat/completions': '/v1/chat/completions'
      },
      onProxyReq: (proxyReq, req, res) => {
        logger.debug(`<${realModelName}> Proxying request to ${modelConfig.proxy}`);
      },
      onProxyRes: (proxyRes, req, res) => {
        logger.debug(`<${realModelName}> Received response with status ${proxyRes.statusCode}`);
      }
    };

    // Apply the proxy middleware
    createProxyMiddleware(proxyOptions)(req, res, () => {
      res.status(500).json({ error: 'Proxy error' });
    });
  } catch (err) {
    logger.error(`Error proxying request: ${err.message}`);
    res.status(500).json({ error: `error proxying request: ${err.message}` });
  }
});

// Support for other OpenAI API endpoints
const openaiEndpoints = [
  '/v1/completions',
  '/v1/embeddings',
  '/reranking',
  '/rerank',
  '/v1/rerank',
  '/v1/reranking',
  '/infill',
  '/completion',
  '/v1/audio/speech',
  '/v1/audio/transcriptions'
];

for (const endpoint of openaiEndpoints) {
  app.post(endpoint, async (req, res) => {
    const requestedModel = endpoint.includes('/audio/transcriptions') 
      ? req.query.model || (req.body && req.body.model) 
      : req.body.model;
      
    if (!requestedModel) {
      return res.status(400).json({ error: 'missing or invalid \'model\' key' });
    }

    const { config: modelConfig, name: realModelName, found } = configLoader.findConfig(requestedModel);
    if (!found) {
      return res.status(400).json({ error: `could not find real modelID for ${requestedModel}` });
    }

    try {
      const { processGroup, realModelName } = await processManager.swapProcessGroup(requestedModel);

      // Get the specific process for this model and ensure it's ready
      const process = processGroup.processes.get(realModelName);
      if (!process) {
        throw new Error(`Could not find process for model ${realModelName}`);
      }

      // Start the process if it's not already ready
      if (process.getCurrentState() !== ProcessState.READY) {
        logger.info(`<${realModelName}> Starting model process...`);
        const success = await process.start();
        if (!success) {
          throw new Error(`Failed to start process for model ${realModelName}`);
        }
        logger.info(`<${realModelName}> Model process started successfully`);
      }

      // Modify the request to use the correct model name if needed
      if (modelConfig.useModelName) {
        if (req.body && req.body.model) {
          req.body.model = modelConfig.useModelName;
        } else if (req.query && req.query.model) {
          req.query.model = modelConfig.useModelName;
        }
      }

      // Strip parameters if configured
      if (modelConfig.filters && modelConfig.filters.stripParams) {
        const stripParams = modelConfig.filters.stripParams.split(',')
          .map(param => param.trim())
          .filter(param => param !== 'model' && param !== '');

        if (req.body) {
          for (const param of stripParams) {
            delete req.body[param];
          }
        }
      }

      // Proxy the request to the model's server
      const proxyOptions = {
        target: modelConfig.proxy,
        changeOrigin: true,
        pathRewrite: {
          [`^${endpoint}`]: endpoint
        },
        onProxyReq: (proxyReq, req, res) => {
          logger.debug(`<${realModelName}> Proxying request to ${modelConfig.proxy}`);
        },
        onProxyRes: (proxyRes, req, res) => {
          logger.debug(`<${realModelName}> Received response with status ${proxyRes.statusCode}`);
        }
      };

      // Apply the proxy middleware
      createProxyMiddleware(proxyOptions)(req, res, () => {
        res.status(500).json({ error: 'Proxy error' });
      });
    } catch (err) {
      logger.error(`Error proxying request: ${err.message}`);
      res.status(500).json({ error: `error proxying request: ${err.message}` });
    }
  });
}

// Proxy to upstream models via path
app.all('/upstream/*', async (req, res) => {
  const upstreamPath = req.params[0]; // This captures everything after /upstream/
  
  // Split the path and search for the model name
  const parts = upstreamPath.split('/').filter(part => part !== '');
  if (parts.length === 0) {
    return res.status(400).json({ error: 'model id required in path' });
  }

  let modelFound = false;
  let searchModelName = '';
  let modelName = '';
  let remainingPath = '';

  for (let i = 0; i < parts.length; i++) {
    if (parts[i] === '') continue;

    if (searchModelName === '') {
      searchModelName = parts[i];
    } else {
      searchModelName = searchModelName + '/' + parts[i];
    }

    if (configLoader.realModelName(searchModelName)) {
      modelName = configLoader.realModelName(searchModelName);
      remainingPath = '/' + parts.slice(i + 1).join('/');
      modelFound = true;
      
      // Check if this is exactly a model name with no additional path
      // and doesn't end with a trailing slash
      if (remainingPath === '/' && !upstreamPath.endsWith('/')) {
        const newPath = `/upstream/${searchModelName}/`;
        const query = req.url.split('?')[1];
        res.redirect(301, query ? `${newPath}?${query}` : newPath);
        return;
      }
      break;
    }
  }

  if (!modelFound) {
    return res.status(400).json({ error: 'model id required in path' });
  }

  try {
    const { processGroup, realModelName } = await processManager.swapProcessGroup(modelName);

    // Get model config
    const modelConfig = config.models[realModelName];

    // Get the specific process for this model and ensure it's ready
    const process = processGroup.processes.get(realModelName);
    if (!process) {
      throw new Error(`Could not find process for model ${realModelName}`);
    }

    // Start the process if it's not already ready
    if (process.getCurrentState() !== ProcessState.READY) {
      logger.info(`<${realModelName}> Starting model process...`);
      const success = await process.start();
      if (!success) {
        throw new Error(`Failed to start process for model ${realModelName}`);
      }
      logger.info(`<${realModelName}> Model process started successfully`);
    }

    // Proxy the request to the model's server
    const proxyOptions = {
      target: modelConfig.proxy,
      changeOrigin: true,
      pathRewrite: {
        [`^/upstream/${modelName}`]: remainingPath
      },
      onProxyReq: (proxyReq, req, res) => {
        logger.debug(`<${realModelName}> Proxying upstream request to ${modelConfig.proxy}`);
      },
      onProxyRes: (proxyRes, req, res) => {
        logger.debug(`<${realModelName}> Received upstream response with status ${proxyRes.statusCode}`);
      }
    };

    // Apply the proxy middleware
    createProxyMiddleware(proxyOptions)(req, res, () => {
      res.status(500).json({ error: 'Proxy error' });
    });
  } catch (err) {
    logger.error(`Error proxying upstream request: ${err.message}`);
    res.status(500).json({ error: `error proxying request: ${err.message}` });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

// Get running models
app.get('/running', (req, res) => {
  const runningProcesses = [];
  
  for (const [groupId, group] of processManager.processGroups) {
    for (const [modelId, process] of group.processes) {
      if (process.getCurrentState() === ProcessState.READY) {
        runningProcesses.push({
          model: modelId,
          state: process.getCurrentState()
        });
      }
    }
  }
  
  res.json({ running: runningProcesses });
});

// Unload all models
app.get('/unload', async (req, res) => {
  try {
    await processManager.shutdownAll();
    res.status(200).send('OK');
  } catch (err) {
    logger.error(`Error unloading models: ${err.message}`);
    res.status(500).json({ error: 'Error unloading models' });
  }
});

// Set up signal handlers for graceful shutdown
let isShuttingDown = false;

const shutdown = async () => {
  if (isShuttingDown) return;
  isShuttingDown = true;
  
  logger.info('Received shutdown signal, shutting down gracefully...');
  
  try {
    await processManager.shutdownAll();
    logger.info('All processes stopped, exiting.');
    process.exit(0);
  } catch (err) {
    logger.error(`Error during shutdown: ${err.message}`);
    process.exit(1);
  }
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

// Start the server
const listenAddr = options.listen || ':8080';
const [host, port] = listenAddr.startsWith(':') ? ['0.0.0.0', listenAddr.substring(1)] : listenAddr.split(':');
const portNum = parseInt(port, 10);

if (isNaN(portNum)) {
  logger.error('Invalid port number');
  process.exit(1);
}

// Check if TLS options are provided
const useTLS = options.tlsCertFile && options.tlsKeyFile;

if (useTLS && (!options.tlsCertFile || !options.tlsKeyFile)) {
  logger.error('Both --tls-cert-file and --tls-key-file must be provided for TLS');
  process.exit(1);
}

if (useTLS) {
  const https = require('https');
  const fs = require('fs');
  
  try {
    const cert = fs.readFileSync(options.tlsCertFile);
    const key = fs.readFileSync(options.tlsKeyFile);
    
    https.createServer({ cert, key }, app).listen(portNum, host, () => {
      logger.info(`llama-swap listening with TLS on https://${host}:${portNum}`);
    });
  } catch (err) {
    logger.error(`Error starting HTTPS server: ${err.message}`);
    process.exit(1);
  }
} else {
  app.listen(portNum, host, () => {
    logger.info(`llama-swap listening on http://${host}:${portNum}`);
  });
}

// Run preload hooks if configured
if (config.hooks.on_startup.preload && config.hooks.on_startup.preload.length > 0) {
  setTimeout(async () => {
    logger.info('Running startup hooks...');
    for (const modelName of config.hooks.on_startup.preload) {
      logger.info(`Preloading model: ${modelName}`);
      try {
        const { processGroup } = await processManager.swapProcessGroup(modelName);
        logger.info(`Successfully preloaded model: ${modelName}`);
      } catch (err) {
        logger.error(`Failed to preload model ${modelName}: ${err.message}`);
      }
    }
  }, 1000); // Delay preload slightly to allow server to start
}