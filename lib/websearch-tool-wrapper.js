/**
 * WebSearch Tool Wrapper
 * Provides WebSearch tool functionality in API context
 */

export async function WebSearch({ query: _query, allowed_domains: _allowed_domains, blocked_domains: _blocked_domains }) {
  // This wrapper is designed to be used in Claude Code environment
  // where the WebSearch tool is available

  throw new Error('WebSearch tool wrapper needs to be called from Claude Code context with tool access');
}

export default WebSearch;