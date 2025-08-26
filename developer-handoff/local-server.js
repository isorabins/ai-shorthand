#!/usr/bin/env node

/**
 * Local Development Server for Token Compressor
 * 
 * This server mimics Vercel's serverless functions locally
 * Run with: node local-server.js
 * Then access: http://localhost:3000
 */

import { createServer } from 'http';
import { readFile } from 'fs/promises';
import { join, extname } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env' });

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// MIME types
const mimeTypes = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

// Import API handlers
const handlers = {
  '/api/search': (await import('./api/search.js')).default,
  '/api/deepseek': (await import('./api/deepseek.js')).default,
  '/api/groq': (await import('./api/groq.js')).default,
  '/api/tokenize': (await import('./api/tokenize.js')).default,
  '/api/twitter': (await import('./api/twitter.js')).default,
  '/api/test': (await import('./api/test.js')).default
};

// Create server
const server = createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathname = url.pathname;
  
  console.log(`[${new Date().toISOString()}] ${req.method} ${pathname}`);
  
  // Handle API routes
  if (pathname.startsWith('/api/')) {
    const handler = handlers[pathname];
    
    if (handler) {
      // Set CORS headers
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      
      // Handle OPTIONS preflight
      if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
      }
      
      // Create Vercel-like request/response objects
      const vercelReq = {
        ...req,
        headers: req.headers || {},
        query: Object.fromEntries(url.searchParams),
        body: await getBody(req),
        method: req.method,
        url: pathname
      };
      
      const vercelRes = {
        status: (code) => {
          res.statusCode = code;
          return vercelRes;
        },
        json: (data) => {
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(data));
        },
        send: (data) => {
          res.end(data);
        },
        setHeader: (name, value) => {
          res.setHeader(name, value);
        }
      };
      
      try {
        await handler(vercelReq, vercelRes);
      } catch (error) {
        console.error(`Error in ${pathname}:`, error);
        res.statusCode = 500;
        res.end(JSON.stringify({ error: error.message }));
      }
    } else {
      res.statusCode = 404;
      res.end(JSON.stringify({ error: 'API route not found' }));
    }
    return;
  }
  
  // Serve static files from public directory
  let filePath = pathname === '/' ? '/index.html' : pathname;
  filePath = join(__dirname, 'public', filePath);
  
  try {
    const content = await readFile(filePath);
    const ext = extname(filePath);
    const contentType = mimeTypes[ext] || 'application/octet-stream';
    
    res.setHeader('Content-Type', contentType);
    res.statusCode = 200;
    res.end(content);
  } catch (error) {
    if (error.code === 'ENOENT') {
      res.statusCode = 404;
      res.end('404 Not Found');
    } else {
      res.statusCode = 500;
      res.end('Internal Server Error');
    }
  }
});

// Helper to parse request body
async function getBody(req) {
  if (req.method !== 'POST' && req.method !== 'PUT') return {};
  
  return new Promise((resolve) => {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        resolve(JSON.parse(body));
      } catch {
        resolve(body);
      }
    });
  });
}

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`
🚀 Token Compressor Local Server
================================
Server running at: http://localhost:${PORT}
API endpoints available at: http://localhost:${PORT}/api/*
Frontend available at: http://localhost:${PORT}

Environment:
- DeepSeek API: ${process.env.DEEPSEEK_API_KEY ? '✓ Configured' : '✗ Missing'}
- Groq API: ${process.env.GROQ_API_KEY ? '✓ Configured' : '✗ Missing'}
- Brave Search: ${process.env.BRAVE_SEARCH_API_KEY ? '✓ Configured' : '✗ Missing'}
- Supabase: ${process.env.SUPABASE_URL ? '✓ Configured' : '✗ Missing'}

Press Ctrl+C to stop the server
`);
});