import express from 'express'
import mongoose from 'mongoose'

const router = express.Router()
const itemSchema = new mongoose.Schema({ name: String, size: String, length: String, category: String, unit: { type: String, default: 'pcs' }, customUnit: String, deletedAt: Date }, { timestamps: true })
const billSchema = new mongoose.Schema({
    number: String,
    name: String,
    supplier: String,
    customer: String,
    category: String,
    date: Date,
    status: { type: String, enum: ['draft', 'passed', 'deleted'], default: 'draft' },
    lines: [{ itemId: String, name: String, size: String, length: String, quantity: Number, unit: String }],
    items: [{ itemId: String, name: String, size: String, length: String, quantity: Number, unit: String }],
    deletedAt: Date
}, { timestamps: true })
const Item = mongoose.models.Item || mongoose.model('Item', itemSchema)
const Bill = mongoose.models.Bill || mongoose.model('Bill', billSchema)

router.get('/items', async (_, res) => res.json(await Item.find({ deletedAt: { $exists: false } }).sort({ name: 1 })))
router.post('/items', async (req, res) => res.status(201).json(await Item.create(req.body)))
router.put('/items/:id', async (req, res) => res.json(await Item.findByIdAndUpdate(req.params.id, req.body, { new: true })))
router.delete('/items/:id', async (req, res) => res.json(await Item.findByIdAndUpdate(req.params.id, { deletedAt: new Date() }, { new: true })))
router.get('/bills', async (req, res) => res.json(await Bill.find(req.query.status ? { status: req.query.status } : {}).sort({ updatedAt: -1 })))
router.post('/bills', async (req, res) => res.status(201).json(await Bill.create(req.body)))
router.put('/bills/:id', async (req, res) => res.json(await Bill.findByIdAndUpdate(req.params.id, req.body, { new: true })))
router.delete('/bills/:id', async (req, res) => res.json(await Bill.findByIdAndUpdate(req.params.id, { status: 'deleted', deletedAt: new Date() }, { new: true })))
router.get('/bin', async (_, res) => res.json({ items: await Item.find({ deletedAt: { $exists: true } }), bills: await Bill.find({ status: 'deleted' }) }))

export default router
