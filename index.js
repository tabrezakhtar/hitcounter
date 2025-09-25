import { Hono } from 'hono'
import { serve } from '@hono/node-server'
import { MongoClient } from 'mongodb'
import dotenv from 'dotenv'

dotenv.config()

const app = new Hono()
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
      return `${parts[0]}.${parts[1]}.${parts[2]}.x`
    }
  }
  if (ip.includes(':')) {
    const parts = ip.split(':')
    if (parts.length >= 3) {
      return `${parts[0]}:${parts[1]}:${parts[2]}:x:x:x:x:x`
    }
  }
  return null
}

app.get('/ping', (c) => {
  return c.text('hello')
})

app.get('/', (c) => {
  return c.json({ 
    message: 'Hono.js app is running!',
    endpoints: ['/ping', '/log']
  })
})

app.post('/log', async (c) => {
  try {
    const requestData = await c.req.json()
    const clientIP = c.req.header('x-forwarded-for')?.split(',')[0] || 
                     c.req.header('x-real-ip') || 
                     c.req.header('cf-connecting-ip') ||
                     c.env?.ip ||
                     'unknown'
    const logData = {
      date: requestData.date,
      project: requestData.project,
      userAgent: requestData.userAgent || c.req.header('user-agent'),
      ip: anonymizeIP(clientIP),
      timestamp: new Date().toISOString()
    }
    if (!logData.date || !logData.project) {
      return c.json({ 
        error: 'Missing required fields: date and project are required' 
      }, 400)
    }
    const result = await db.collection('logs').insertOne(logData)
    return c.json({ 
      success: true, 
      message: 'Log entry created successfully',
      id: result.insertedId
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