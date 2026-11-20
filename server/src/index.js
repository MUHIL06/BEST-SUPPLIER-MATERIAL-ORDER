import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import mongoose from 'mongoose'
import api from './routes.js'

dotenv.config()
const app = express()
app.use(cors())
app.use(express.json({ limit: '2mb' }))
app.use('/api', api)

const port = process.env.PORT || 5000
const mongoUri = process.env.MONGODB_URI

if (!mongoUri) {
    console.error('MONGODB_URI is required')
    process.exit(1)
}

mongoose.connect(mongoUri)
    .then(() => app.listen(port, () => console.log(`API running at http://localhost:${port}`)))
    .catch(error => { console.error('MongoDB connection failed:', error.message); process.exit(1) })
