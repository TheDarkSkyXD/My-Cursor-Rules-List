import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import express from 'express';
import cors from 'cors';
import { setupSSE } from './sse.js';

export interface HttpServerConfig {
  port: number;
  host: string;
  corsOrigin?: string;
  enableSSE?: boolean;
  ssePath?: string;
}

export async function startHttpServer(
  server: Server,
  config: HttpServerConfig
): Promise<void> {
  const app = express();

  // Enable CORS
  app.use(cors({
    origin: config.corsOrigin || '*',
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  }));

  // Handle preflight requests
  app.options('*', (req, res) => {
    res.status(204).end();
  });

  // Health check endpoint
  app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  // Set up SSE if enabled
  if (config.enableSSE) {
    setupSSE(app, config.ssePath || '/events');
  }

  // Start the server
  await new Promise<void>((resolve, reject) => {
    try {
      const httpServer = app.listen(config.port, config.host, () => {
        console.log(`HTTP server listening at http://${config.host}:${config.port}`);
        resolve();
      });

      httpServer.on('error', (error) => {
        reject(error);
      });
    } catch (error) {
      reject(error);
    }
  });
} 