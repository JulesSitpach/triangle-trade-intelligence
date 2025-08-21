# Context7 MCP Installation & Usage Guide

## ✅ Installation Complete!

Context7 MCP Server has been successfully installed and configured for your Triangle Intelligence Platform project.

## 📦 What Was Installed

1. **Context7 MCP Server** (`@upstash/context7-mcp` v1.0.16)
   - Global npm package installed at: `/home/paige098/.npm-global/bin/context7-mcp`
   - Provides enhanced code intelligence and documentation retrieval

2. **Configuration Files Created**:
   - `~/.config/claude/claude_desktop_config.json` - Global Claude configuration
   - `.context7-mcp-config.json` - Project-specific Context7 configuration
   - `scripts/test-context7-mcp.js` - Test script to verify installation

## 🚀 How to Use Context7 MCP

### With Claude Desktop

1. **Restart Claude Desktop** to load the new MCP configuration
2. Context7 will automatically connect when you open Claude Desktop
3. You'll have enhanced code intelligence and documentation capabilities

### Features Available

Context7 MCP provides:
- **Documentation Retrieval**: Get up-to-date documentation for any library
- **Code Examples**: Access relevant code examples
- **API References**: Quick access to API documentation
- **Library Information**: Version info, compatibility, and best practices

### Manual Testing

Run the test script to verify Context7 is working:
```bash
node scripts/test-context7-mcp.js
```

### Command Line Usage

You can also use Context7 MCP directly from the command line:
```bash
# Start the server in stdio mode (default)
context7-mcp

# Start with HTTP transport on a specific port
context7-mcp --transport http --port 3001

# With API key authentication
context7-mcp --api-key YOUR_API_KEY
```

## 🔧 Configuration Details

### Global Claude Configuration
Location: `~/.config/claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "context7": {
      "command": "context7-mcp",
      "args": [],
      "env": {},
      "description": "Context7 MCP Server for enhanced code intelligence"
    },
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/mnt/d/bacjup/triangle-simple"],
      "description": "Filesystem access to Triangle Intelligence project"
    }
  },
  "settings": {
    "defaultContext": "context7",
    "autoConnect": true,
    "verboseLogging": false
  }
}
```

### Project Configuration
Location: `.context7-mcp-config.json`

This file contains project-specific context about your Triangle Intelligence Platform, helping Context7 provide more relevant suggestions.

## 🎯 Benefits for Triangle Intelligence Platform

With Context7 MCP installed, you get:

1. **Enhanced Code Intelligence**: Better understanding of your Next.js, React, and Supabase code
2. **Documentation Access**: Instant access to docs for all your dependencies
3. **Best Practices**: Suggestions based on current best practices
4. **API Integration Help**: Better assistance with external API integrations
5. **Framework-Specific Guidance**: Tailored advice for Next.js 13.5 and React 18

## 🔍 Troubleshooting

If Context7 MCP isn't working:

1. **Check Installation**:
   ```bash
   which context7-mcp
   # Should output: /home/paige098/.npm-global/bin/context7-mcp
   ```

2. **Verify Configuration**:
   ```bash
   cat ~/.config/claude/claude_desktop_config.json
   ```

3. **Test Directly**:
   ```bash
   node scripts/test-context7-mcp.js
   ```

4. **Reinstall if Needed**:
   ```bash
   npm uninstall -g @upstash/context7-mcp
   npm install -g @upstash/context7-mcp
   ```

## 📚 Additional MCP Servers

You may want to install additional MCP servers for more capabilities:

```bash
# Git integration
npm install -g @modelcontextprotocol/server-git

# GitHub integration  
npm install -g @modelcontextprotocol/server-github

# SQLite database access
npm install -g @modelcontextprotocol/server-sqlite

# PostgreSQL access
npm install -g @modelcontextprotocol/server-postgres
```

## 🎉 Success!

Context7 MCP is now ready to enhance your development experience with the Triangle Intelligence Platform. The server will provide intelligent code suggestions, documentation, and best practices tailored to your project's tech stack.