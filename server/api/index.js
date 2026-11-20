import { app, connectDatabase } from '../src/index.js'

export default async function handler(req, res) {
    await connectDatabase()
    return app(req, res)
}
