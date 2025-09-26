import { Hono } from 'hono'
import { serve } from '@hono/node-server'
import { cors } from 'hono/cors'
import { MongoClient } from 'mongodb'
import dotenv from 'dotenv'

dotenv.config()

const app = new Hono()

app.use('*', cors({
  origin: (origin) => {
    console.log('Incoming request origin:', origin)
    if (!origin) return false
    const allowedDomains = process.env.ALLOWED_DOMAINS 
      ? process.env.ALLOWED_DOMAINS.split(',').map(domain => domain.trim())
      : []
    console.log('Allowed domains:', allowedDomains)
    console.log('Origin match result:', allowedDomains.includes(origin))
    
    // Check for exact match first
    if (allowedDomains.includes(origin)) {
      return origin  // Return the actual origin, not true
    }
    
    // Check if origin matches any allowed domain (case insensitive)
    const originLower = origin.toLowerCase()
    const matchedDomain = allowedDomains.find(domain => domain.toLowerCase() === originLower)
    console.log('Case insensitive match result:', !!matchedDomain)
    
    return matchedDomain || false  // Return the matched domain or false
  },
  allowMethods: ['GET', 'POST'],
  allowHeaders: ['Content-Type'],
  credentials: false
}))

let db = null
let client = null

async function connectToDatabase() {
  try {
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/hitcounter'
    client = new MongoClient(uri)
    await client.connect()
    db = client.db()
    console.log('Connected to MongoDB successfully')
    return db
  } catch (error) {
    console.error('MongoDB connection error:', error)
    process.exit(1)
  }
}

await connectToDatabase()

function anonymizeIP(ip) {
  if (!ip) return null
  if (ip.includes('.') && !ip.includes(':')) {
    const parts = ip.split('.')
    if (parts.length === 4) {
      return `${parts[0]}.${parts[1]}.x.x`
    }
  }
  if (ip.includes(':')) {
    const parts = ip.split(':')
    if (parts.length >= 3) {
      return `${parts[0]}:${parts[1]}:x:x:x:x:x:x`
    }
  }
  return null
}

function anonymizeReferrer(referrer) {
  if (!referrer) return null
  try {
    const url = new URL(referrer)
    return `${url.protocol}//${url.host}${url.pathname}`
  } catch (error) {
    return null
  }
}

function sanitizeUserAgent(userAgent) {
  if (!userAgent) return null
  
  const ua = userAgent.toLowerCase()
  let os = 'Unknown OS'
  let browser = 'Unknown Browser'
  
  // Detect OS
  if (ua.includes('windows nt 10.0')) os = 'Windows 10/11'
  else if (ua.includes('windows nt 6.3')) os = 'Windows 8.1'
  else if (ua.includes('windows nt 6.2')) os = 'Windows 8'
  else if (ua.includes('windows nt 6.1')) os = 'Windows 7'
  else if (ua.includes('windows nt')) os = 'Windows'
  else if (ua.includes('mac os x')) {
    const macMatch = ua.match(/mac os x ([\d_]+)/)
    if (macMatch) {
      const version = macMatch[1].replace(/_/g, '.')
      os = `macOS ${version}`
    } else {
      os = 'macOS'
    }
  }
  else if (ua.includes('linux')) os = 'Linux'
  else if (ua.includes('android')) {
    const androidMatch = ua.match(/android ([\d.]+)/)
    os = androidMatch ? `Android ${androidMatch[1]}` : 'Android'
  }
  else if (ua.includes('iphone') || ua.includes('ipad')) {
    const iosMatch = ua.match(/os ([\d_]+)/)
    if (iosMatch) {
      const version = iosMatch[1].replace(/_/g, '.')
      os = `iOS ${version}`
    } else {
      os = 'iOS'
    }
  }
  
  // Detect Browser
  if (ua.includes('edg/') || ua.includes('edge/')) {
    const edgeMatch = ua.match(/edg?\/([\d.]+)/)
    browser = edgeMatch ? `Microsoft Edge ${edgeMatch[1]}` : 'Microsoft Edge'
  }
  else if (ua.includes('chrome/') && !ua.includes('edg')) {
    const chromeMatch = ua.match(/chrome\/([\d.]+)/)
    browser = chromeMatch ? `Google Chrome ${chromeMatch[1]}` : 'Google Chrome'
  }
  else if (ua.includes('firefox/')) {
    const firefoxMatch = ua.match(/firefox\/([\d.]+)/)
    browser = firefoxMatch ? `Mozilla Firefox ${firefoxMatch[1]}` : 'Mozilla Firefox'
  }
  else if (ua.includes('safari/') && !ua.includes('chrome')) {
    const safariMatch = ua.match(/version\/([\d.]+)/)
    browser = safariMatch ? `Safari ${safariMatch[1]}` : 'Safari'
  }
  else if (ua.includes('opera/') || ua.includes('opr/')) {
    const operaMatch = ua.match(/(?:opera\/|opr\/)([\d.]+)/)
    browser = operaMatch ? `Opera ${operaMatch[1]}` : 'Opera'
  }
  
  return `${os}, ${browser}`
}

function sanitizeInput(input) {
  if (!input || typeof input !== 'string') return null
  return input.replace(/[<>\"'&]/g, '')
              .replace(/\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g, '[IP_REMOVED]')
              .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[EMAIL_REMOVED]')
              .substring(0, 100)
}

app.get('/ping', (c) => {
  return c.text('hello')
})

app.get('/', (c) => {
  return c.json({ 
    message: 'Hono.js app is running!'
  })
})

app.post('/log', async (c) => {
  try {
    const clientIP = c.req.header('x-forwarded-for')?.split(',')[0] || 
                     c.req.header('x-real-ip') || 
                     c.req.header('cf-connecting-ip') ||
                     c.env?.ip ||
                     'unknown'
    if (clientIP === '127.0.0.1' || clientIP === '::1' || clientIP.startsWith('192.168.') || clientIP.startsWith('10.') || clientIP.startsWith('172.')) {
      return c.json({ 
        success: true, 
        message: 'Localhost request ignored' 
      })
    }
    const requestData = await c.req.json()
    const referrer = c.req.header('referer') || c.req.header('referrer')
    const logData = {
      project: sanitizeInput(requestData.project),
      page: sanitizeInput(requestData.page),
      userAgent: sanitizeUserAgent(requestData.userAgent || c.req.header('user-agent')),
      ip: anonymizeIP(clientIP),
      referrer: anonymizeReferrer(referrer),
      timestamp: new Date().toISOString()
    }
    if (!logData.project) {
      return c.json({ 
        error: 'Missing required field: project is required' 
      }, 400)
    }
    const result = await db.collection('logs').insertOne(logData)
    return c.json({ 
      success: true, 
      message: 'Log entry created successfully'
    })
  } catch (error) {
    console.error('Error saving log data:', error)
    return c.json({ 
      error: 'Failed to save log data' 
    }, 500)
  }
})

const port = process.env.PORT || 3000
console.log(`Server is running on http://localhost:${port}`)

process.on('SIGINT', async () => {
  console.log('Shutting down gracefully...')
  if (client) {
    await client.close()
    console.log('MongoDB connection closed')
  }
  process.exit(0)
})

serve({
  fetch: app.fetch,
  port: port
})