const allowedOrigins = [
    'https://srt-material-supplychain.vercel.app',
    'https://client-mauve-kappa-45.vercel.app'
]

export default async function handler(req, res) {
    const origin = req.headers.origin
    if (origin && allowedOrigins.includes(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin)
    }
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

    if (req.method === 'OPTIONS') return res.status(204).end()

    const url = req.url || ''
    if (url === '/api/health' || url.startsWith('/api/health?')) {
        return res.status(200).json({ ok: true, mongoConfigured: true, mongoReady: false })
    }

    try {
        const backend = await import('../src/index.js')
        await backend.connectDatabase()
        return backend.app(req, res)
    } catch (error) {
        console.error('Backend serverless error:', error)
        return res.status(500).json({ ok: false, error: error.message || 'Backend connection failed' })
    }
}
