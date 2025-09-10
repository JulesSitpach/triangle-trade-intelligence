// Minimal test to check if basic Next.js is working
import { createServer } from 'http'
import { parse } from 'url'
import next from 'next'

const dev = process.env.NODE_ENV !== 'production'
const hostname = 'localhost'
const port = 3000

const app = next({ dev, hostname, port })

console.log('Testing Next.js basic functionality...')
console.log('If this hangs, there\'s a fundamental issue with Next.js setup')