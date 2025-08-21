#!/usr/bin/env node

/**
 * Test script for Puppeteer MCP Server
 * Verifies that the Puppeteer MCP server is properly installed and configured
 */

const { spawn } = require('child_process');

console.log('🔍 Testing Puppeteer MCP Server Installation...\n');

// Test initialization request
const initRequest = {
  jsonrpc: "2.0",
  method: "initialize",
  params: {
    protocolVersion: "2024-11-05",
    clientInfo: {
      name: "Triangle Intelligence Puppeteer Test Client",
      version: "1.0.0"
    },
    capabilities: {}
  },
  id: 1
};

// Spawn the Puppeteer MCP server
const mcpServer = spawn('mcp-server-puppeteer', [], {
  stdio: ['pipe', 'pipe', 'pipe'],
  env: { ...process.env, NODE_ENV: 'test' }
});

let responseBuffer = '';
let serverStarted = false;

mcpServer.stdout.on('data', (data) => {
  const output = data.toString();
  responseBuffer += output;
  
  console.log('📡 Server output:', output.trim());
  
  // Try to parse each line as JSON
  const lines = responseBuffer.split('\n');
  for (const line of lines) {
    if (line.trim() && line.includes('{')) {
      try {
        const response = JSON.parse(line);
        if (response.result) {
          console.log('✅ Puppeteer MCP Server initialized successfully!');
          console.log('\n📋 Server Capabilities:');
          console.log(JSON.stringify(response.result, null, 2));
          
          // Test tools listing
          setTimeout(() => {
            const toolsRequest = {
              jsonrpc: "2.0",
              method: "tools/list",
              params: {},
              id: 2
            };
            mcpServer.stdin.write(JSON.stringify(toolsRequest) + '\n');
          }, 500);
          
        } else if (response.error) {
          console.log('❌ Initialization error:', response.error.message);
          mcpServer.kill();
          process.exit(1);
        } else if (response.result && response.id === 2) {
          console.log('\n🔧 Available Tools:');
          if (response.result.tools && response.result.tools.length > 0) {
            response.result.tools.forEach(tool => {
              console.log(`  - ${tool.name}: ${tool.description}`);
            });
          } else {
            console.log('  No tools found');
          }
          mcpServer.kill();
          process.exit(0);
        }
      } catch (e) {
        // Not a complete JSON response yet, continue buffering
      }
    }
  }
});

mcpServer.stderr.on('data', (data) => {
  const message = data.toString();
  console.log('⚠️ Server stderr:', message.trim());
  
  if (!serverStarted && (message.includes('listening') || message.includes('started') || message.includes('ready'))) {
    console.log('✅ Puppeteer MCP Server started successfully');
    console.log('📡 Sending initialization request...\n');
    serverStarted = true;
    
    // Send the initialization request
    setTimeout(() => {
      mcpServer.stdin.write(JSON.stringify(initRequest) + '\n');
    }, 100);
  }
});

mcpServer.on('error', (error) => {
  console.error('❌ Failed to start Puppeteer MCP Server:', error.message);
  console.log('\n💡 Make sure Puppeteer MCP is installed:');
  console.log('   npm install -g @hisma/server-puppeteer');
  process.exit(1);
});

mcpServer.on('close', (code) => {
  if (code !== 0 && code !== null) {
    console.log(`⚠️ Server exited with code ${code}`);
  }
});

// Send the initialization request after a short delay if server hasn't indicated it's ready
setTimeout(() => {
  if (!serverStarted) {
    console.log('📡 Sending initialization request...\n');
    mcpServer.stdin.write(JSON.stringify(initRequest) + '\n');
    serverStarted = true;
  }
}, 1000);

// Timeout after 10 seconds
setTimeout(() => {
  console.log('⏱️ Test timed out after 10 seconds');
  mcpServer.kill();
  process.exit(1);
}, 10000);