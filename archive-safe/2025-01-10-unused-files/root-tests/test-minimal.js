// Minimal Next.js test
const { createServer } = require('http')
const { parse } = require('url')
const next = require('next')

const dev = process.env.NODE_ENV !== 'production'
const hostname = 'localhost'
const port = 3000

console.log('🧪 Testing minimal Next.js server...')

const app = next({ dev, hostname, port })
const handle = app.getRequestHandler()

app.prepare().then(() => {
  console.log('✅ Next.js prepared successfully!')
  
  createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true)
      await handle(req, res, parsedUrl)
    } catch (err) {
      console.error('Error occurred handling', req.url, err)
      res.statusCode = 500
      res.end('internal server error')
    }
  })
  .once('error', (err) => {
    console.error('❌ Server error:', err)
    process.exit(1)
  })
  .listen(port, () => {
    console.log(`✅ Ready on http://${hostname}:${port}`)
  })
}).catch((err) => {
  console.error('❌ Next.js preparation failed:', err)
  process.exit(1)
})