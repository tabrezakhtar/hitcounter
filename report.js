import { MongoClient } from 'mongodb'
import dotenv from 'dotenv'

dotenv.config()

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  gray: '\x1b[90m'
}

function colorizeJson(obj, indent = 0) {
  const spaces = '  '.repeat(indent)
  
  if (obj === null) return `${colors.gray}null${colors.reset}`
  if (typeof obj === 'string') return `${colors.green}"${obj}"${colors.reset}`
  if (typeof obj === 'number') return `${colors.yellow}${obj}${colors.reset}`
  if (typeof obj === 'boolean') return `${colors.magenta}${obj}${colors.reset}`
  
  if (Array.isArray(obj)) {
    if (obj.length === 0) return '[]'
    const items = obj.map(item => `${spaces}  ${colorizeJson(item, indent + 1)}`).join(',\n')
    return `[\n${items}\n${spaces}]`
  }
  
  if (typeof obj === 'object') {
    const keys = Object.keys(obj)
    if (keys.length === 0) return '{}'
    
    const items = keys.map(key => {
      const coloredKey = `${colors.cyan}"${key}"${colors.reset}`
      const coloredValue = colorizeJson(obj[key], indent + 1)
      return `${spaces}  ${coloredKey}: ${coloredValue}`
    }).join(',\n')
    
    return `{\n${items}\n${spaces}}`
  }
  
  return String(obj)
}

async function viewLast24Hours() {
  let client = null
  
  try {
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/hitcounter'
    client = new MongoClient(uri)
    await client.connect()
    const db = client.db()
    
    console.log(`${colors.bright}${colors.blue}Fetching logs from the last 24 hours...${colors.reset}\n`)
    
    // Get logs from last 24 hours
    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000)
    
    const logs = await db.collection('logs')
      .find({
        timestamp: { $gte: last24Hours.toISOString() }
      })
      .sort({ timestamp: -1 }) // Most recent first
      .toArray()
    
    if (logs.length === 0) {
      console.log(`${colors.yellow}No logs found in the last 24 hours.${colors.reset}`)
      return
    }
    
    console.log(`${colors.bright}Found ${colors.yellow}${logs.length}${colors.reset}${colors.bright} logs in the last 24 hours:${colors.reset}\n`)
    
    // Display logs as pretty-printed colored JSON
    logs.forEach((log, index) => {
      // Convert ObjectId to string for better display
      const logForDisplay = {
        ...log,
        _id: log._id.toString()
      }
      
      console.log(colorizeJson(logForDisplay))
      console.log('')
    })
    
  } catch (error) {
    console.error(`${colors.red}Error: ${error.message}${colors.reset}`)
  } finally {
    if (client) {
      await client.close()
    }
  }
}

viewLast24Hours()