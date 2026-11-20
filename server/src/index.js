import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import mongoose from 'mongoose'
import api from './routes.js'

dotenv.config()
const app = express()
const allowedOrigins = [
    'https://client-mauve-kappa-45.vercel.app'
]
app.use(cors({
    origin(origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) callback(null, true)
        else callback(null, false)
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
}))
app.use(express.json({ limit: '2mb' }))
app.get('/api/health', (_, res) => res.json({ ok: true, mongoReady: mongoose.connection.readyState === 1 }))
app.use('/api', api)

const mongoUri = process.env.MONGODB_URI

let connectionPromise = null
export async function connectDatabase() {
    if (!mongoUri) throw new Error('MONGODB_URI is required')
    if (mongoose.connection.readyState === 1) return mongoose.connection
    if (!connectionPromise) connectionPromise = mongoose.connect(mongoUri)
    return connectionPromise
}

export { app }

if (process.env.VERCEL !== '1') {
    const port = process.env.PORT || 5000
    connectDatabase()
        .then(() => app.listen(port, () => console.log(`API running at https://server-eosin-one-26.vercel.app (local port ${port})`)))
        .catch(error => { console.error('MongoDB connection failed:', error.message); process.exit(1) })
}
