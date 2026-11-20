import { app, connectDatabase } from '../src/index.js'

export default async function handler(req, res) {
    try {
        await connectDatabase()
        return app(req, res)
    } catch (error) {
        return res.status(500).json({ ok: false, error: error.message })
    }
}
