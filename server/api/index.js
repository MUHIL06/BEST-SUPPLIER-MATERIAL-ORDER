import { app, connectDatabase } from '../src/index.js'

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', 'https://client-mauve-kappa-45.vercel.app')
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

    if (req.method === 'OPTIONS') return res.status(204).end()
    if (req.url === '/api/health' || req.url?.startsWith('/api/health?')) {
        return app(req, res)
    }

    try {
        await connectDatabase()
        return app(req, res)
    } catch (error) {
        return res.status(500).json({ ok: false, error: error.message })
    }
}
