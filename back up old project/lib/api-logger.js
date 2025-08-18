// API Logger - Ensures API calls are visible in terminal
import fs from 'fs'
import path from 'path'

const LOG_FILE = path.join(process.cwd(), 'api-calls.log')

export function logAPICall(endpoint, data) {
  const timestamp = new Date().toISOString()
  const logEntry = `[${timestamp}] ${endpoint}: ${JSON.stringify(data)}\n`
  
  // Write to file (this will definitely work)
  try {
    fs.appendFileSync(LOG_FILE, logEntry)
  } catch (err) {
    // Fallback to stderr
    process.stderr.write(logEntry)
  }
  
  // Also try console.error (shows in red in terminal)
  console.error(`🔴 API CALL: ${endpoint}`)
  console.error(`📊 Data:`, data)
  
  // Force flush to ensure it writes
  if (process.stderr.write) {
    process.stderr.write(`\n🚨 API ACTIVITY: ${endpoint} at ${timestamp}\n`)
  }
}