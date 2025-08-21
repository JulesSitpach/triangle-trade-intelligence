#!/usr/bin/env node

/**
 * Test script for Context7 MCP Server
 * Verifies that the MCP server is properly installed and configured
 */

const { spawn } = require('child_process');

console.log('🔍 Testing Context7 MCP Server Installation...\n');

// Test initialization request
const initRequest = {
  jsonrpc: "2.0",
  method: "initialize",
  params: {
    protocolVersion: "0.1.0",
    clientInfo: {
      name: "Triangle Intelligence Test Client",
      version: "1.0.0"
    },
    capabilities: {}
  },
  id: 1
};

// Spawn the Context7 MCP server
const mcpServer = spawn('context7-mcp', [], {
  stdio: ['pipe', 'pipe', 'pipe']
});

let responseBuffer = '';

mcpServer.stdout.on('data', (data) => {
  responseBuffer += data.toString();
  
  // Try to parse each line as JSON
  const lines = responseBuffer.split('\n');
  for (const line of lines) {
    if (line.trim() && line.includes('{')) {
      try {
        const response = JSON.parse(line);
        if (response.result) {
          console.log('✅ Context7 MCP Server initialized successfully!');
          console.log('\n📋 Server Capabilities:');
          console.log(JSON.stringify(response.result, null, 2));
          process.exit(0);
        } else if (response.error) {
          console.log('❌ Initialization error:', response.error.message);
          process.exit(1);
        }
      } catch (e) {
        // Not a complete JSON response yet, continue buffering
      }
    }
  }
});

mcpServer.stderr.on('data', (data) => {
  const message = data.toString();
  if (message.includes('running on stdio')) {
    console.log('✅ Context7 MCP Server started on stdio transport');
    console.log('📡 Sending initialization request...\n');
  }
});

mcpServer.on('error', (error) => {
  console.error('❌ Failed to start Context7 MCP Server:', error.message);
  console.log('\n💡 Make sure Context7 MCP is installed:');
  console.log('   npm install -g @upstash/context7-mcp');
  process.exit(1);
});

// Send the initialization request
setTimeout(() => {
  mcpServer.stdin.write(JSON.stringify(initRequest) + '\n');
}, 100);

// Timeout after 5 seconds
setTimeout(() => {
  console.log('⏱️ Test timed out after 5 seconds');
  mcpServer.kill();
  process.exit(1);
}, 5000);