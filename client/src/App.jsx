import { useEffect, useMemo, useRef, useState } from 'react'
import html2canvas from 'html2canvas'
import {
  Archive, ArrowLeft, Boxes, Check, ChevronDown, Copy, Edit3, History,
  Home, LayoutGrid, Menu, PackagePlus, Plus, ReceiptText, Redo2, RotateCcw,
  Search, Send, Trash2, Undo2, Users, Warehouse, X, Eye
} from 'lucide-react'
import './App.css'

const API = `${(import.meta.env.VITE_API_URL || 'https://best-supplier-material-order.vercel.app').replace(/\/$/, '')}/api`
const LS = { items: 'jacquard.items.v2', bills: 'jacquard.bills.v2' }

const seedItems = [
  { id: 'i1', name: 'Jacquard Heald Wire', size: '5 × 10', category: 'Healds', unit: 'pcs', createdAt: '2026-11-18' },
  { id: 'i2', name: 'Allen Screw', size: '5 × 10 mm', category: 'Fasteners', unit: 'pcs', createdAt: '2026-11-17' },
  { id: 'i3', name: 'Bolt & Nut', size: 'M8 × 25 mm', category: 'Fasteners', unit: 'boxes', createdAt: '2026-11-16' },
  { id: 'i4', name: 'Harness Cord', size: 'No. 9', category: 'Harness Parts', unit: 'kgs', createdAt: '2026-11-15' },
]

const readLS = (key, fallback) => { try { return JSON.parse(localStorage.getItem(key)) ?? fallback } catch { return fallback } }
const writeLS = (key, value) => localStorage.setItem(key, JSON.stringify(value))
const uid = (p = 'id') => `${p}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
const money = n => `₹${Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`
const formatDate = value => {
  if (!value) return ''
  const date = typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value) ? new Date(`${value.slice(0, 10)}T00:00:00`) : new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return `${String(date.getDate()).padStart(2, '0')}-${String(date.getMonth() + 1).padStart(2, '0')}-${date.getFullYear()}`
}
const today = () => new Date().toISOString().slice(0, 10)
const escapeHtml = value => String(value ?? '').replace(/[&<>'"]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[char])

async function api(path, options) {
  try {
    const r = await fetch(`${API}${path}`, { headers: { 'Content-Type': 'application/json' }, ...options })
    if (!r.ok) throw new Error('API unavailable')
    return await r.json()
  } catch { return null }
}

function App() {
  const [page, setPage] = useState('home')
  const [mobileNav, setMobileNav] = useState(false)
  const [items, setItems] = useState(() => readLS(LS.items, seedItems))
  const [bills, setBills] = useState(() => readLS(LS.bills, []))
  const [toast, setToast] = useState('')
  const [productModal, setProductModal] = useState(null)
  const [query, setQuery] = useState('')
  const [viewedBill, setViewedBill] = useState(null)

  useEffect(() => writeLS(LS.items, items), [items])
  useEffect(() => writeLS(LS.bills, bills), [bills])

  useEffect(() => {
    Promise.all([api('/items'), api('/bills')]).then(([remoteItems, remoteBills]) => {
      if (remoteItems?.length) setItems(remoteItems.map(x => ({ ...x, id: x._id || x.id })))
      if (remoteBills) setBills(remoteBills.map(x => ({ ...x, id: x._id || x.id })))
    })
  }, [])

  const notify = message => { setToast(message); window.clearTimeout(window.__toast); window.__toast = window.setTimeout(() => setToast(''), 2800) }
  const navigate = name => { setPage(name); setMobileNav(false); setQuery('') }

  const saveItem = item => {
    if (item.id && items.some(x => x.id === item.id)) {
      setItems(v => v.map(x => x.id === item.id ? item : x))
      api(`/items/${item.id}`, { method: 'PUT', body: JSON.stringify(item) })
      notify('Product updated')
    } else {
      const newItem = { ...item, id: uid('item'), createdAt: today() }
      setItems(v => [newItem, ...v])
      api('/items', { method: 'POST', body: JSON.stringify(newItem) })
      notify('Product added')
    }
    setProductModal(null)
  }

  const deleteItem = item => {
    setItems(v => v.map(x => x.id === item.id ? { ...x, deletedAt: new Date().toISOString() } : x))
    api(`/items/${item.id}`, { method: 'DELETE' })
    notify('Product moved to Bin')
  }

  const moveBillToBin = bill => {
    setBills(v => v.map(x => x.id === bill.id ? { ...x, status: 'deleted', deletedAt: new Date().toISOString() } : x))
    api(`/bills/${bill.id}`, { method: 'DELETE' })
    notify('Bill moved to Bin')
  }

  const activeItems = items.filter(x => !x.deletedAt)
  const draftBills = bills.filter(x => x.status === 'draft')
  const passedBills = bills.filter(x => x.status === 'passed')
  const binItems = items.filter(x => x.deletedAt)
  const binBills = bills.filter(x => x.status === 'deleted')

  const nav = [
    { id: 'home', label: 'Home', icon: Home }, { id: 'add', label: 'Add materials', icon: PackagePlus },
    { id: 'view', label: 'View materials', icon: Boxes }, { id: 'bill', label: 'Create material list', icon: ReceiptText },
    { id: 'drafts', label: 'Draft lists', icon: Edit3 }, { id: 'history', label: 'Sent lists', icon: History },
    { id: 'bin', label: 'Bin', icon: Trash2 }
  ]

  return (
    <div className="app-shell">
      <aside className={`sidebar ${mobileNav ? 'open' : ''}`}>
        <button className="brand" onClick={() => navigate('home')} aria-label="Go home">
          <span className="brand-mark"><Warehouse size={21} /></span>
          <span>SAI RAM<br /><b>TRADERS</b></span>
        </button>
        <nav>
          {nav.map(({ id, label, icon: Icon }) => (
            <button key={id} className={page === id ? 'active' : ''} onClick={() => navigate(id)} title={label}>
              <Icon size={20} /><span>{label}</span>
            </button>
          ))}
        </nav>
        <div className="sidebar-foot"><div className="avatar">SRT</div><div><b>SRT</b><small>Production manager</small></div></div>
      </aside>
      {mobileNav && <button className="nav-backdrop" onClick={() => setMobileNav(false)} aria-label="Close menu" />}

      <main className="main">
        <header className="topbar">
          <button className="menu-btn" onClick={() => setMobileNav(true)}><Menu size={21} /></button>
          <div className="page-title">
            <span>{nav.find(x => x.id === page)?.label || 'Dashboard'}</span>
            <small>{formatDate(today())}</small>
          </div>
          <div className="top-actions">
            <label className="search"><Search size={17} /><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search materials" /></label>
            <button className="icon-btn"><Archive size={18} /></button>
          </div>
        </header>

        {page === 'home' && <HomePage items={activeItems} drafts={draftBills} passed={passedBills} navigate={navigate} />}
        {page === 'add' && <ProductForm onSave={saveItem} />}
        {page === 'view' && <ItemsView items={activeItems.filter(i => `${i.name} ${i.category} ${i.size}`.toLowerCase().includes(query.toLowerCase()))} onEdit={setProductModal} onDelete={deleteItem} onAdd={() => navigate('add')} />}
        {page === 'bill' && <BillEditor key="new-bill" items={activeItems} onSave={bill => { setBills(v => [bill, ...v]); api('/bills', { method: 'POST', body: JSON.stringify(bill) }); notify('Bill saved as draft') }} onPass={bill => passBill(bill)} />}
        {page === 'drafts' && <Drafts bills={draftBills} onPrepare={() => setPage('bill')} onEdit={id => setPage(`bill:${id}`)} onDuplicate={bill => { const copy = { ...bill, id: uid('bill'), number: `${bill.number || 'ML'}-C`, name: `${bill.name || bill.number} Copy`, status: 'draft', date: today(), passedAt: undefined, deletedAt: undefined }; setBills(v => [copy, ...v]); api('/bills', { method: 'POST', body: JSON.stringify(copy) }); notify('Draft duplicated') }} onPass={passDraft} onDelete={moveBillToBin} />}
        {page === 'history' && <HistoryView bills={passedBills} onView={setViewedBill} onDuplicate={bill => { const copy = { ...bill, id: uid('bill'), number: `${bill.number}-C`, name: `${bill.name || bill.number} Copy`, status: 'draft', date: today(), passedAt: undefined, deletedAt: undefined }; setBills(v => [copy, ...v]); api('/bills', { method: 'POST', body: JSON.stringify(copy) }); setPage('drafts'); notify('Bill duplicated to Drafts') }} onDelete={moveBillToBin} />}
        {page === 'bin' && <BinView items={binItems} bills={binBills} restoreItem={item => setItems(v => v.map(x => x.id === item.id ? { ...x, deletedAt: undefined } : x))} restoreBill={bill => setBills(v => v.map(x => x.id === bill.id ? { ...x, status: 'draft', deletedAt: undefined } : x))} />}
        {page.startsWith('bill:') && <BillEditor key={page} items={activeItems} initial={bills.find(x => x.id === page.split(':')[1])} onSave={bill => { setBills(v => v.map(x => x.id === bill.id ? bill : x)); api(`/bills/${bill.id}`, { method: 'PUT', body: JSON.stringify(bill) }); notify('Draft updated') }} onPass={passBill} />}
      </main>

      {productModal && <ProductModal item={productModal === true ? null : productModal} onClose={() => setProductModal(null)} onSave={saveItem} />}
      {toast && <div className="toast"><Check size={16} />{toast}</div>}
      {viewedBill && <BillViewModal bill={viewedBill} onClose={() => setViewedBill(null)} />}
    </div>
  )

  function passBill(bill) {
    const passed = { ...bill, id: bill.id || uid('bill'), status: 'passed', passedAt: new Date().toISOString() }
    setBills(v => v.some(x => x.id === passed.id) ? v.map(x => x.id === passed.id ? passed : x) : [passed, ...v])
    api(passed.id ? `/bills/${passed.id}` : '/bills', { method: passed.id ? 'PUT' : 'POST', body: JSON.stringify(passed) })
    notify('Bill passed successfully')
    setPage('history')
  }

  async function passDraft(bill) {
    const passed = { ...bill, id: bill.id || uid('bill'), status: 'passed', passedAt: new Date().toISOString() }

    const host = document.createElement('div')
    host.style.cssText = 'position:fixed;left:-10000px;top:0;width:760px;background:#fff;color:#17223b;padding:36px;font-family:Arial,sans-serif;z-index:-1'
    host.innerHTML = `<h1 style="margin:0 0 8px">SAI RAM TRADERS</h1><p>${escapeHtml(passed.number)} · ${escapeHtml(formatDate(passed.date))}</p><hr><p><b>Bill:</b> ${escapeHtml(passed.name || passed.number)}</p><p><b>Supplier:</b> ${escapeHtml(passed.supplier || 'Not selected')}</p><hr>${(passed.lines || []).map(line => `<div style="display:flex;justify-content:space-between;border-bottom:1px solid #eee;padding:10px 0"><span>${escapeHtml(line.name)} (${escapeHtml(line.size)})</span><b>${escapeHtml(line.quantity)} ${escapeHtml(line.unit)}</b></div>`).join('')}<hr>`
    document.body.appendChild(host)

    try {
      const canvas = await html2canvas(host, { scale: 2, backgroundColor: '#ffffff', useCORS: true })
      const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'))

      if (blob && navigator.clipboard?.write && window.ClipboardItem) {
        await navigator.clipboard.write([new window.ClipboardItem({ 'image/png': blob })])
        notify('Bill image copied to clipboard')
      }

      const link = document.createElement('a')
      link.download = `${passed.name || passed.number}-${passed.number}.png`
      link.href = canvas.toDataURL('image/png')
      link.click()

      const text = encodeURIComponent(`SAI RAM TRADERS\n${passed.name || passed.number}\nSupplier: ${passed.supplier || 'Not selected'}\nDate: ${formatDate(passed.date)}`)
      window.open(`https://wa.me/?text=${text}`, '_blank', 'noopener,noreferrer')
    } catch (error) {
      console.error('Draft bill image/WhatsApp error:', error)
      notify('Opening WhatsApp without image')
      const text = encodeURIComponent(`SAI RAM TRADERS\n${passed.name || passed.number}\nSupplier: ${passed.supplier || 'Not selected'}\nDate: ${formatDate(passed.date)}`)
      window.open(`https://wa.me/?text=${text}`, '_blank', 'noopener,noreferrer')
    } finally {
      host.remove()
    }

    setBills(v => v.some(x => x.id === passed.id) ? v.map(x => x.id === passed.id ? passed : x) : [passed, ...v])
    api(passed.id ? `/bills/${passed.id}` : '/bills', { method: passed.id ? 'PUT' : 'POST', body: JSON.stringify(passed) })
    setPage('history')
  }
}

function HomePage({ items, drafts, passed, navigate }) {
  const lowStock = items.length ? items.slice(0, 4) : []
  const stockValue = items.length * 12450
  return (
    <div className="home">
      <section className="hero-card">
        <div className="hero-copy">
          <p className="eyebrow">DAILY OVERVIEW · {formatDate(today())}</p>
          <h1>Good morning,<br /><em>SAI RAM TRADERS.</em></h1>
          <p>Prepare today’s material requirements for your supplier.</p>
          <button className="primary light" onClick={() => navigate('bill')}><Plus size={18} /> Create material list</button>
        </div>
        <div className="warehouse-art" aria-hidden="true"><div className="shelf s1" /><div className="shelf s2" /><div className="box b1" /><div className="box b2" /><div className="box b3" /><div className="box b4" /><div className="box b5" /></div>
      </section>

      <section className="metrics">
        <Metric icon={Boxes} label="Total materials" value={items.length} detail="active components" />
        <Metric icon={LayoutGrid} label="Categories" value={new Set(items.map(i => i.category)).size} detail="material categories" />
        <Metric icon={ReceiptText} label="Draft lists" value={drafts.length} detail="ready to review" />
        <Metric icon={History} label="Sent lists" value={passed.length} detail="all time" accent />
      </section>

      <div className="dashboard-grid">
        <section className="panel stock-panel">
          <div className="panel-head"><div><p>MATERIALS</p><h2>Material catalogue</h2></div><button onClick={() => navigate('view')}>View all <ArrowLeft className="arrow" size={15} /></button></div>
          <div className="stock-list">
            {lowStock.map((item, index) => (
              <div className="stock-row" key={item.id}><div className="product-thumb"><span>{item.name.slice(0, 1)}</span></div><div className="stock-name"><b>{item.name}</b><small>{item.size} · {item.category}</small></div><div className="unit-tag">{item.unit}</div><div className="stock-level"><div><i style={{ width: `${72 - index * 10}%` }} /></div><b>{[84, 62, 48, 31][index]}%</b></div></div>
            ))}
            {!lowStock.length && <Empty text="No products yet" />}
          </div>
        </section>
        <section className="panel quick-panel">
          <div className="panel-head"><div><p>SHORTCUTS</p><h2>Quick actions</h2></div></div>
          <button onClick={() => navigate('add')}><span className="quick-icon green"><PackagePlus size={20} /></span><span><b>Add material</b><small>Update your catalogue</small></span><ArrowLeft className="arrow" size={17} /></button>
          <button onClick={() => navigate('bill')}><span className="quick-icon orange"><ReceiptText size={20} /></span><span><b>Create material list</b><small>Prepare & send to supplier</small></span><ArrowLeft className="arrow" size={17} /></button>
        </section>
      </div>
    </div>
  )
}

function Metric({ icon: Icon, label, value, detail, accent }) {
  return <article className={`metric ${accent ? 'accent' : ''}`}><div className="metric-icon"><Icon size={19} /></div><div><p>{label}</p><h3>{value}</h3><small>{detail}</small></div></article>
}

function ProductForm({ onSave }) { return <ProductEditor onSave={onSave} /> }
function ProductModal({ item, onClose, onSave }) { return <div className="modal-wrap"><div className="modal"><div className="modal-head"><div><p>{item ? 'UPDATE MATERIAL' : 'NEW MATERIAL'}</p><h2>{item ? 'Edit material' : 'Add material'}</h2></div><button onClick={onClose}><X size={20} /></button></div><ProductEditor item={item} onSave={onSave} inline /></div></div> }

function ProductEditor({ item, onSave, inline = false }) {
  const [form, setForm] = useState(item || { name: '', size: '', category: '', unit: 'pcs' })
  const set = (key, value) => setForm(v => ({ ...v, [key]: value }))
  const submit = e => { e.preventDefault(); if (form.name.trim()) onSave({ ...form, name: form.name.trim(), unit: form.unit === 'other' ? (form.customUnit || 'other').trim() : form.unit }) }
  return <form className={`product-editor ${inline ? 'inline' : ''}`} onSubmit={submit}>
    <section className="panel form-panel">
      <div className="panel-head"><div><p>MATERIAL DETAILS</p><h2>{item ? 'Edit material' : 'Create material'}</h2></div></div>
      <div className="form-grid">
        <label className="field span-2"><span>Material name</span><input required value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Allen screw" /></label>
        <label className="field"><span>Size / specification</span><input required value={form.size} onChange={e => set('size', e.target.value)} placeholder="e.g. 5 × 10 mm" /></label>
        <label className="field"><span>Category</span><input required value={form.category} onChange={e => set('category', e.target.value)} placeholder="e.g. Fasteners" /></label>
        <label className="field"><span>Unit</span><select value={form.unit} onChange={e => set('unit', e.target.value)}><option value="pcs">Pieces (pcs)</option><option value="kgs">Kilograms (kgs)</option><option value="boxes">Boxes</option><option value="meters">Meters</option><option value="boards">Boards</option><option value="other">Other</option></select></label>
        {form.unit === 'other' && <label className="field"><span>Custom unit</span><input required value={form.customUnit || ''} onChange={e => set('customUnit', e.target.value)} placeholder="e.g. rolls, sets, packs" /></label>}
      </div>
      <div className="form-actions"><button type="button" className="secondary" onClick={() => setForm({ name: '', size: '', category: '', unit: 'pcs' })}><RotateCcw size={16} /> Reset</button><button className="primary" type="submit"><Check size={17} />{item ? 'Save changes' : 'Add material'}</button></div>
    </section>
  </form>
}

function ItemsView({ items, onEdit, onDelete, onAdd }) {
  return <div className="page-view"><div className="view-heading"><div><p>MATERIAL CATALOGUE</p><h1>All materials</h1></div><button className="primary" onClick={onAdd}><Plus size={18} /> Add material</button></div>
    <section className="panel table-panel"><div className="table-wrap"><table><thead><tr><th>Product</th><th>Size</th><th>Category</th><th>Unit</th><th>Status</th><th></th></tr></thead><tbody>{items.map(item => <tr key={item.id}><td><div className="table-product"><span>{item.name[0]}</span><b>{item.name}</b></div></td><td>{item.size}</td><td><span className="category-chip">{item.category}</span></td><td>{item.unit}</td><td><span className="status in">In stock</span></td><td><div className="row-actions"><button onClick={() => onEdit(item)} title="Edit"><Edit3 size={16} /></button><button onClick={() => onDelete(item)} title="Delete"><Trash2 size={16} /></button></div></td></tr>)}</tbody></table>{!items.length && <Empty text="No products found" />}</div></section>
  </div>
}

function Empty({ text }) { return <div className="empty"><Boxes size={28} /><p>{text}</p></div> }

const blankBill = () => ({ id: uid('bill'), number: `ML-${String(Date.now()).slice(-5)}`, name: '', date: today(), category: 'Machine Parts', supplier: '', customer: '', status: 'draft', lines: [] })

function BillEditor({ items, initial, onSave, onPass }) {
  const [bill, setBill] = useState(initial ? { lines: [], ...initial } : blankBill())
  const [history, setHistory] = useState([bill])
  const [historyIndex, setHistoryIndex] = useState(0)
  const [picker, setPicker] = useState(false)
  const [pickerCategory, setPickerCategory] = useState('All')
  const [selectedMaterials, setSelectedMaterials] = useState([])
  const receiptRef = useRef(null)

  useEffect(() => { }, [])
  const commit = next => { const copy = [...history.slice(0, historyIndex + 1), next]; setHistory(copy); setHistoryIndex(copy.length - 1); setBill(next) }
  const setField = (key, value) => commit({ ...bill, [key]: value })
  const addLine = item => { if (!bill.lines?.some(x => x.itemId === item.id)) commit({ ...bill, lines: [...(bill.lines || []), { itemId: item.id, name: item.name, size: item.size, unit: item.unit, quantity: 1 }] }); setPicker(false) }
  const lineChange = (itemId, quantity) => commit({ ...bill, lines: bill.lines.map(l => l.itemId === itemId ? { ...l, quantity: Math.max(0, Number(quantity)) } : l) })
  const removeLine = itemId => commit({ ...bill, lines: bill.lines.filter(l => l.itemId !== itemId) })
  const undo = () => { if (historyIndex > 0) { const i = historyIndex - 1; setHistoryIndex(i); setBill(history[i]) } }
  const redo = () => { if (historyIndex < history.length - 1) { const i = historyIndex + 1; setHistoryIndex(i); setBill(history[i]) } }
  const total = bill.lines?.reduce((s, l) => s + Number(l.quantity || 0), 0) || 0

  const saveDraft = () => {
    if (!bill.name.trim()) { window.alert('Enter a bill name before saving the draft.'); return }
    if (!bill.date) { window.alert('Select a bill date.'); return }
    onSave({ ...bill, name: bill.name.trim(), status: 'draft', lines: bill.lines || [] })
  }

  const pass = async () => {
    if (!bill.name.trim()) { window.alert('Enter a bill name before sending.'); return }
    if (!bill.date) { window.alert('Select a bill date.'); return }
    if (!bill.lines?.length) return
    onPass({ ...bill, status: 'passed' })
    const receipt = receiptRef.current
    if (receipt) {
      try {
        const canvas = await html2canvas(receipt, { scale: 2, backgroundColor: '#ffffff' })
        const link = document.createElement('a'); link.download = `${bill.number || 'bill'}.png`; link.href = canvas.toDataURL('image/png'); link.click()
        const text = encodeURIComponent(`Material List ${bill.number}\nSupplier: ${bill.supplier || 'Supplier'}\nDate: ${formatDate(bill.date)}`)
        window.open(`https://wa.me/?text=${text}`, '_blank', 'noopener,noreferrer')
      } catch { window.open(`https://wa.me/?text=${encodeURIComponent(`Material List ${bill.number}`)}`, '_blank') }
    }
  }

  const saveAndCopyImage = async () => {
    if (!bill.name?.trim()) { window.alert('Enter a bill name before saving the image.'); return }
    if (!bill.lines?.length) { window.alert('Add at least one material before saving the image.'); return }
    try {
      const canvas = await html2canvas(receiptRef.current, { scale: 2, backgroundColor: '#ffffff' })
      const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'))
      if (!blob) throw new Error('Image creation failed')
      if (navigator.clipboard?.write && window.ClipboardItem) {
        await navigator.clipboard.write([new window.ClipboardItem({ 'image/png': blob })])
      }
      const link = document.createElement('a')
      link.download = `${bill.name || bill.number}-${bill.number}.png`
      link.href = canvas.toDataURL('image/png')
      link.click()
      window.alert('Image saved and copied to clipboard.')
    } catch {
      window.alert('The image was saved, but clipboard image copying is not supported in this browser.')
    }
  }

  const categories = ['All', ...new Set(items.map(item => item.category).filter(Boolean))]
  const visiblePickerItems = items.filter(item => pickerCategory === 'All' || item.category === pickerCategory)

  const toggleMaterial = item => {
    setSelectedMaterials(current => current.some(x => x.id === item.id)
      ? current.filter(x => x.id !== item.id)
      : [...current, item])
  }

  const addSelectedMaterials = () => {
    const linesToAdd = selectedMaterials
      .filter(item => !bill.lines?.some(line => line.itemId === item.id))
      .map(item => ({ itemId: item.id, name: item.name, size: item.size, unit: item.unit, quantity: 1 }))
    if (linesToAdd.length) commit({ ...bill, lines: [...(bill.lines || []), ...linesToAdd] })
    setSelectedMaterials([])
    setPicker(false)
  }

  return <div className="bill-page"><div className="view-heading"><div><p>SUPPLIER REQUIREMENTS</p><h1>{initial ? 'Edit material list' : 'Create material list'}</h1></div><div className="bill-tools"><button onClick={undo} disabled={historyIndex === 0} title="Undo"><Undo2 size={17} /></button><button onClick={redo} disabled={historyIndex === history.length - 1} title="Redo"><Redo2 size={17} /></button></div></div>
    <div className="bill-layout"><section className="panel bill-form"><div className="bill-fields"><label className="field span-2"><span>Bill name *</span><input required value={bill.name || ''} onChange={e => setField('name', e.target.value)} placeholder="e.g. Monday spring requirement" /></label><label className="field"><span>List date *</span><input type="date" required value={bill.date} onChange={e => setField('date', e.target.value)} /></label><label className="field"><span>Material category</span><select value={bill.category} onChange={e => setField('category', e.target.value)}><option>Machine Parts</option><option>Fasteners</option><option>Electronic Parts</option><option>Harness Parts</option></select></label><label className="field span-2"><span>Supplier name</span><input value={bill.supplier || ''} onChange={e => setField('supplier', e.target.value)} placeholder="Supplier or company name" /></label></div>
      <div className="bill-lines-head"><div><p>REQUIRED MATERIALS</p><h2>Material items</h2></div><button className="secondary" onClick={() => setPicker(true)}><Plus size={16} /> Add material</button></div>
      <div className="bill-lines">{bill.lines?.map(line => <div className="bill-line" key={line.itemId}><div className="table-product"><span>{line.name[0]}</span><div><b>{line.name}</b><small>{line.size}</small></div></div><div className="qty"><button onClick={() => lineChange(line.itemId, line.quantity - 1)}>−</button><input type="number" min="0" value={line.quantity} onChange={e => lineChange(line.itemId, e.target.value)} /><button onClick={() => lineChange(line.itemId, line.quantity + 1)}>+</button></div><div className="line-unit">{line.unit}</div><button className="line-remove" onClick={() => removeLine(line.itemId)}><X size={16} /></button></div>)}</div>
      {!bill.lines?.length && <div className="bill-empty"><ReceiptText size={28} /><b>No materials added</b><small>Add materials to begin this supplier list</small></div>}
      <div className="bill-actions"><button className="danger-soft" onClick={() => { onSave({ ...bill, status: 'deleted' }); }}><Trash2 size={16} /> Delete list</button><div><button className="secondary" onClick={saveDraft}>Save draft</button><button className="secondary" onClick={saveAndCopyImage}><Copy size={16} /> Save &amp; copy image</button><button className="primary" onClick={pass} disabled={!bill.lines?.length}><Send size={16} /> Send to supplier</button></div></div>
    </section>
      <aside className="panel bill-summary"><div className="summary-head"><span>SAI RAM TRADERS</span><small>{bill.number}</small></div><div className="summary-info"><div><span>Supplier</span><b>{bill.supplier || 'Not selected'}</b></div><div><span>Date</span><b>{formatDate(bill.date)}</b></div><div><span>Category</span><b>{bill.category}</b></div></div></aside>
    </div>
    <div ref={receiptRef} className="receipt-print"><h2>SAI RAM TRADERS</h2><p>{bill.number} · {formatDate(bill.date)}</p><hr /><p><b>Supplier:</b> {bill.supplier || 'Not selected'}</p>{bill.lines?.map(l => <div key={l.itemId}><span>{l.name} ({l.size})</span><b>{l.quantity} {l.unit}</b></div>)}<hr /></div>
    {picker && <div className="modal-wrap"><div className="modal picker"><div className="modal-head"><div><p>MATERIAL CATALOGUE</p><h2>Select materials by category</h2></div><button onClick={() => setPicker(false)}><X size={20} /></button></div><div className="category-tabs">{categories.map(category => <button key={category} className={pickerCategory === category ? 'active' : ''} onClick={() => setPickerCategory(category)}>{category}</button>)}</div><div className="picker-list">{visiblePickerItems.map(item => { const selected = selectedMaterials.some(x => x.id === item.id); return <button key={item.id} className={selected ? 'selected' : ''} onClick={() => toggleMaterial(item)}><span>{item.name[0]}</span><div><b>{item.name}</b><small>{item.size} · {item.category}</small></div><span className="selection-check">{selected ? <Check size={15} /> : <Plus size={15} />}</span></button> })}</div><div className="picker-footer"><small>{selectedMaterials.length} material(s) selected</small><button className="primary" onClick={addSelectedMaterials} disabled={!selectedMaterials.length}>Add selected</button></div></div></div>}
  </div>
}

function Drafts({ bills, onPrepare, onEdit, onDuplicate, onPass, onDelete }) {
  return <ListView title="Draft material lists" eyebrow="WORK IN PROGRESS" bills={bills} extraAction={<button className="primary" onClick={onPrepare}><Plus size={17} /> Prepare draft bill</button>} actions={(bill) => <><button onClick={() => onEdit(bill.id)} title="Edit"><Edit3 size={16} /></button><button onClick={() => onDuplicate(bill)} title="Duplicate"><Copy size={16} /></button><button onClick={() => onPass(bill)} title="Send"><Send size={16} /></button><button onClick={() => onDelete(bill)} title="Delete"><Trash2 size={16} /></button></>} />
}

function HistoryView({ bills, onView, onDuplicate, onDelete }) { return <ListView title="Sent material lists" eyebrow="SUPPLIER HISTORY" bills={bills} actions={bill => <><button onClick={() => onView(bill)} title="View"><Eye size={16} /></button><button onClick={() => onDuplicate(bill)} title="Duplicate"><Copy size={16} /></button><button onClick={() => onDelete(bill)} title="Delete"><Trash2 size={16} /></button></>} /> }

function ListView({ title, eyebrow, bills, actions, extraAction }) {
  return <div className="page-view"><div className="view-heading"><div><p>{eyebrow}</p><h1>{title}</h1></div>{extraAction}</div><section className="panel table-panel"><div className="table-wrap"><table><thead><tr><th>Material list</th><th>Name</th><th>Supplier</th><th>Date</th><th>Category</th><th>Materials</th><th>Status</th><th></th></tr></thead><tbody>{bills.map(bill => <tr key={bill.id}><td><b>{bill.number}</b></td><td>{bill.name || 'Unnamed bill'}</td><td>{bill.supplier || 'Not selected'}</td><td>{formatDate(bill.date)}</td><td>{bill.category}</td><td>{bill.lines?.length || 0}</td><td><span className={`status ${bill.status}`}>{bill.status}</span></td><td><div className="row-actions">{actions(bill)}</div></td></tr>)}</tbody></table>{!bills.length && <Empty text={`No ${title.toLowerCase()} yet`} />}</div></section></div>
}

function BinView({ items, bills, restoreItem, restoreBill }) {
  return <div className="page-view"><div className="view-heading"><div><p>RECOVERABLE ITEMS</p><h1>Bin</h1></div></div><div className="bin-grid"><section className="panel"><div className="panel-head"><div><p>MATERIALS</p><h2>Deleted materials</h2></div></div>{items.map(item => <div className="bin-row" key={item.id}><b>{item.name}</b><button onClick={() => restoreItem(item)}><RotateCcw size={15} /> Restore</button></div>)}{!items.length && <Empty text="Bin has no materials" />}</section><section className="panel"><div className="panel-head"><div><p>MATERIAL LISTS</p><h2>Deleted lists</h2></div></div>{bills.map(bill => <div className="bin-row" key={bill.id}><b>{bill.number}</b><button onClick={() => restoreBill(bill)}><RotateCcw size={15} /> Restore</button></div>)}{!bills.length && <Empty text="Bin has no material lists" />}</section></div></div>
}

function BillViewModal({ bill, onClose }) {
  return <div className="modal-wrap"><div className="modal bill-view-modal"><div className="modal-head"><div><p>SENT MATERIAL LIST</p><h2>{bill.name || bill.number}</h2></div><button onClick={onClose}><X size={20} /></button></div><div className="bill-view-info"><div><span>Supplier</span><b>{bill.supplier || 'Not selected'}</b></div><div><span>Date</span><b>{formatDate(bill.date)}</b></div><div><span>Category</span><b>{bill.category}</b></div></div><div className="bill-view-lines">{bill.lines?.map(line => <div key={line.itemId || line.name}><span>{line.name}</span><b>{line.quantity} {line.unit}</b></div>)}</div></div></div>
}

export default App
