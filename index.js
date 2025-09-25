import { Hono } from 'hono'
import { serve } from '@hono/node-server'

const app = new Hono()

// Ping endpoint that returns 'hello'
app.get('/ping', (c) => {
  return c.text('hello')
})

// Root endpoint for basic info
app.get('/', (c) => {
  return c.json({ 
    message: 'Hono.js app is running!',
    endpoints: ['/ping']
  })
})

// Start the server
const port = process.env.PORT || 3000
console.log(`Server is running on http://localhost:${port}`)

serve({
  fetch: app.fetch,
  port: port
})