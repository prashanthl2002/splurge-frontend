import { useState, useEffect } from 'react'
import { getSummary, getTransactions, addTransaction, deleteTransaction, setBudget, getRoast } from './api/api'

const CATEGORY_ICONS = {
  food: '🍕', travel: '🚗', fun: '🎮', shopping: '👗',
  health: '💊', learning: '📚', movie: '🎬', others: '💸'
}

const CATEGORY_COLORS = {
  food: '#ff6b6b', travel: '#7b6cff', fun: '#ffb547',
  learning: '#c8ff57', shopping: '#ff6bde', health: '#6bffd4',
  movie: '#ff9f43', others: '#a8a8b3'
}

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

export default function App() {
  const now = new Date()
  const [month, setMonth]               = useState(now.getMonth() + 1)
  const [year, setYear]                 = useState(now.getFullYear())
  const [summary, setSummary]           = useState(null)
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading]           = useState(true)
  const [showModal, setShowModal]       = useState(false)
  const [showBudget, setShowBudget]     = useState(false)
  const [filterCat, setFilterCat]       = useState('')
  const [toast, setToast]               = useState(null)
  const [form, setForm]                 = useState({ name:'', amount:'', category:'food', note:'', date:'' })
  const [budgetForm, setBudgetForm]     = useState({ amount:'' })
  const [submitting, setSubmitting]     = useState(false)
  const [roast, setRoast]               = useState(null)
  const [roasting, setRoasting]         = useState(false)

  useEffect(() => { loadData() }, [month, year, filterCat])

  const loadData = async () => {
    try {
      setLoading(true)
      const [sRes, tRes] = await Promise.all([
        getSummary(month, year),
        getTransactions(filterCat)
      ])
      setSummary(sRes.data)
      setTransactions(tRes.data)
    } catch (e) {
      showToast('Could not connect to backend', 'error')
    } finally {
      setLoading(false)
    }
  }

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  const handleAdd = async () => {
    if (!form.name || !form.amount) return showToast('Fill in name and amount', 'error')
    try {
      setSubmitting(true)
      await addTransaction({ ...form, amount: parseFloat(form.amount) })
      setShowModal(false)
      setForm({ name:'', amount:'', category:'food', note:'', date:'' })
      await loadData()
      showToast('Transaction added! ✦')
    } catch (e) {
      showToast('Failed to add transaction', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this transaction?')) return
    try {
      await deleteTransaction(id)
      await loadData()
      showToast('Deleted successfully')
    } catch (e) {
      showToast('Failed to delete', 'error')
    }
  }

  const handleSetBudget = async () => {
    if (!budgetForm.amount) return showToast('Enter a budget amount', 'error')
    try {
      await setBudget({ month, year, amount: parseFloat(budgetForm.amount) })
      setShowBudget(false)
      setBudgetForm({ amount: '' })
      await loadData()
      showToast('Budget updated! ✦')
    } catch (e) {
      showToast('Failed to set budget', 'error')
    }
  }

  const handleRoast = async () => {
    try {
      setRoasting(true)
      setRoast(null)
      const res = await getRoast(month, year)
      setRoast(res.data.roast)
    } catch (e) {
      showToast('Could not analyse spending', 'error')
    } finally {
      setRoasting(false)
    }
  }

  // Parse AI response into structured sections
  const parseAnalysis = (text) => {
    if (!text) return null
    const lines = text.split('\n').filter(l => l.trim())
    return lines.map((line, i) => {
      if (line.startsWith('VERDICT:')) {
        return { type: 'verdict', text: line.replace('VERDICT:', '').trim(), key: i }
      } else if (line.startsWith('TIP 1:') || line.startsWith('TIP 2:') || line.startsWith('TIP 3:')) {
        const [label, ...rest] = line.split(':')
        return { type: 'tip', label: label.trim(), text: rest.join(':').trim(), key: i }
      } else if (line.startsWith('SAVE THIS MONTH:')) {
        return { type: 'save', text: line.replace('SAVE THIS MONTH:', '').trim(), key: i }
      } else {
        return { type: 'other', text: line.trim(), key: i }
      }
    })
  }

  const pct = Math.min(summary?.percentageUsed ?? 0, 100)
  const barColor = pct > 85 ? '#ff6b6b' : pct > 60 ? '#ffb547' : '#c8ff57'
  const parsed = parseAnalysis(roast)

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Mono:wght@300;400;500&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
          --bg: #080810;
          --surface: #0f0f1a;
          --card: #13131f;
          --border2: #2a2a40;
          --accent: #c8ff57;
          --accent2: #ff6b6b;
          --accent3: #7b6cff;
          --text: #e8e8f4;
          --muted: #5a5a7a;
          --muted2: #3a3a55;
        }

        html, body, #root {
          min-height: 100vh;
          background: var(--bg);
          color: var(--text);
          font-family: 'DM Mono', monospace;
        }

        .page {
          min-height: 100vh;
          background: var(--bg);
          background-image:
            radial-gradient(ellipse 700px 500px at 95% 0%, rgba(123,108,255,0.07) 0%, transparent 60%),
            radial-gradient(ellipse 600px 500px at 0% 100%, rgba(200,255,87,0.04) 0%, transparent 60%);
        }

        @media (min-width: 900px) {
          .page-inner {
            max-width: 1160px;
            margin: 0 auto;
            padding: 0 48px 80px;
            display: grid;
            grid-template-columns: 380px 1fr;
            grid-template-areas:
              "header  header"
              "left    right";
            column-gap: 28px;
            align-items: start;
          }
          .area-header { grid-area: header; }
          .area-left   { grid-area: left; }
          .area-right  { grid-area: right; }
        }

        @media (max-width: 899px) {
          .page-inner {
            max-width: 480px;
            margin: 0 auto;
            padding: 0 0 110px;
          }
          .area-header, .area-left, .area-right { padding: 0; }
        }

        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 28px 0 24px;
        }

        @media (max-width: 899px) {
          .header { padding: 24px 18px 20px; }
        }

        .logo {
          font-family: 'Syne', sans-serif;
          font-weight: 800; font-size: 26px;
          color: var(--accent); letter-spacing: -0.5px;
        }

        .logo span { color: var(--text); }

        .month-nav {
          display: flex; align-items: center; gap: 10px;
          background: var(--card); border: 1px solid var(--border2);
          border-radius: 20px; padding: 7px 14px;
        }

        .nav-btn {
          background: none; border: none;
          color: var(--muted); cursor: pointer;
          font-size: 15px; padding: 2px 4px;
          transition: color 0.2s; font-family: 'DM Mono', monospace;
        }

        .nav-btn:hover { color: var(--accent); }

        .month-label {
          font-size: 12px; color: var(--text);
          min-width: 66px; text-align: center; letter-spacing: 0.5px;
        }

        /* Score Card */
        .score-card {
          background: var(--card); border: 1px solid var(--border2);
          border-radius: 24px; padding: 26px;
          position: relative; overflow: hidden;
          animation: fadeUp 0.4s ease both; margin-bottom: 12px;
        }

        @media (max-width: 899px) {
          .score-card { margin: 0 16px 12px; }
        }

        .score-card::before {
          content: ''; position: absolute;
          top: 0; left: 0; right: 0; height: 2px;
          background: linear-gradient(90deg, var(--accent3), var(--accent), var(--accent2));
        }

        .card-label {
          font-size: 10px; letter-spacing: 2px;
          color: var(--muted); text-transform: uppercase; margin-bottom: 10px;
        }

        .card-amount {
          font-family: 'Syne', sans-serif;
          font-weight: 800; font-size: 48px;
          letter-spacing: -2px; line-height: 1;
          color: var(--text); margin-bottom: 18px;
        }

        .card-amount .sym {
          font-size: 22px; color: var(--muted);
          vertical-align: super; margin-right: 2px;
        }

        .budget-row {
          display: flex; justify-content: space-between;
          font-size: 11px; color: var(--muted); margin-bottom: 8px;
        }

        .budget-row .hi { color: var(--accent); font-weight: 500; }

        .bar-bg {
          height: 5px; background: var(--border2);
          border-radius: 10px; overflow: hidden; margin-bottom: 6px;
        }

        .bar-fill {
          height: 100%; border-radius: 10px;
          transition: width 1.2s cubic-bezier(0.4,0,0.2,1), background 0.5s;
        }

        .bar-pct { font-size: 10px; color: var(--muted); text-align: right; }

        .budget-btn {
          margin-top: 16px; background: none;
          border: 1px dashed var(--border2); border-radius: 12px;
          padding: 9px 14px; font-family: 'DM Mono', monospace;
          font-size: 11px; color: var(--muted);
          cursor: pointer; transition: all 0.2s; width: 100%;
        }

        .budget-btn:hover { border-color: var(--accent3); color: var(--accent3); }

        /* AI Analysis Card */
        .analysis-card {
          background: var(--card); border: 1px solid var(--border2);
          border-radius: 24px; padding: 22px;
          position: relative; overflow: hidden;
          margin-bottom: 12px; animation: fadeUp 0.4s ease both;
        }

        @media (max-width: 899px) {
          .analysis-card { margin: 0 16px 12px; }
        }

        .analysis-card::before {
          content: ''; position: absolute;
          top: 0; left: 0; right: 0; height: 2px;
          background: linear-gradient(90deg, #7b6cff, #c8ff57);
        }

        .analysis-label {
          font-size: 10px; letter-spacing: 2px;
          color: var(--muted); text-transform: uppercase; margin-bottom: 14px;
        }

        .analysis-placeholder {
          font-size: 12px; color: var(--muted);
          line-height: 1.8; margin-bottom: 14px;
        }

        /* Verdict row */
        .verdict-row {
          background: rgba(200,255,87,0.06);
          border: 1px solid rgba(200,255,87,0.15);
          border-radius: 12px; padding: 12px 14px;
          font-size: 12px; color: var(--accent);
          line-height: 1.6; margin-bottom: 10px;
        }

        /* Tip rows */
        .tip-row {
          display: flex; gap: 10px; align-items: flex-start;
          padding: 10px 0;
          border-bottom: 1px solid var(--border2);
        }

        .tip-row:last-of-type { border-bottom: none; }

        .tip-num {
          flex-shrink: 0;
          width: 22px; height: 22px;
          background: rgba(123,108,255,0.15);
          border: 1px solid rgba(123,108,255,0.3);
          border-radius: 6px;
          font-family: 'Syne', sans-serif;
          font-weight: 700; font-size: 10px;
          color: var(--accent3);
          display: flex; align-items: center; justify-content: center;
        }

        .tip-text {
          font-size: 12px; color: var(--text); line-height: 1.6;
        }

        /* Save row */
        .save-row {
          display: flex; justify-content: space-between;
          align-items: center;
          background: rgba(107,255,212,0.06);
          border: 1px solid rgba(107,255,212,0.15);
          border-radius: 12px; padding: 12px 14px;
          margin-top: 10px;
        }

        .save-label {
          font-size: 10px; letter-spacing: 1px;
          color: var(--muted); text-transform: uppercase;
        }

        .save-amount {
          font-family: 'Syne', sans-serif; font-weight: 800;
          font-size: 18px; color: #6bffd4;
        }

        .analyse-btn {
          width: 100%; padding: 11px 18px; margin-top: 14px;
          border: none; border-radius: 12px;
          font-family: 'Syne', sans-serif; font-weight: 700;
          font-size: 13px; color: var(--bg); cursor: pointer;
          transition: all 0.2s;
          background: linear-gradient(135deg, var(--accent3), var(--accent));
        }

        .analyse-btn:disabled {
          background: var(--border2); color: var(--muted); cursor: not-allowed;
        }

        .analyse-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(123,108,255,0.4);
        }

        /* Section title */
        .section-title {
          font-family: 'Syne', sans-serif;
          font-size: 11px; font-weight: 700;
          letter-spacing: 2px; text-transform: uppercase;
          color: var(--muted); padding: 20px 0 12px;
        }

        @media (max-width: 899px) {
          .section-title { padding: 20px 18px 12px; }
        }

        /* Category grid */
        .cat-grid {
          display: grid; grid-template-columns: 1fr 1fr; gap: 8px;
        }

        @media (max-width: 899px) {
          .cat-grid { padding: 0 16px; }
        }

        .cat-card {
          background: var(--card); border: 1px solid var(--border2);
          border-radius: 18px; padding: 16px;
          cursor: pointer; transition: all 0.2s;
          animation: fadeUp 0.4s ease both;
        }

        .cat-card:hover { transform: translateY(-2px); border-color: var(--accent3); }
        .cat-card.active { border-color: var(--accent3); background: rgba(123,108,255,0.1); }

        .cat-icon { font-size: 22px; margin-bottom: 8px; }
        .cat-name { font-size: 10px; color: var(--muted); text-transform: uppercase; letter-spacing: 1px; margin-bottom: 3px; }
        .cat-amt  { font-family: 'Syne', sans-serif; font-weight: 700; font-size: 18px; color: var(--text); }
        .cat-bar-bg   { height: 3px; background: var(--border2); border-radius: 10px; margin-top: 10px; overflow: hidden; }
        .cat-bar-fill { height: 100%; border-radius: 10px; transition: width 1s 0.3s ease; }

        /* Tabs */
        .tabs {
          display: flex; gap: 6px; overflow-x: auto;
          scrollbar-width: none; padding-bottom: 2px; margin-bottom: 12px;
        }

        @media (max-width: 899px) {
          .tabs { padding: 0 16px 2px; }
        }

        .tabs::-webkit-scrollbar { display: none; }

        .tab {
          flex-shrink: 0; padding: 7px 14px; border-radius: 20px;
          background: var(--card); border: 1px solid var(--border2);
          font-family: 'DM Mono', monospace; font-size: 11px;
          color: var(--muted); cursor: pointer; transition: all 0.2s; white-space: nowrap;
        }

        .tab:hover { border-color: var(--text); color: var(--text); }
        .tab.active { background: rgba(123,108,255,0.15); border-color: var(--accent3); color: var(--accent3); }

        /* Transactions */
        .txn-list { display: flex; flex-direction: column; gap: 8px; }

        @media (max-width: 899px) {
          .txn-list { padding: 0 16px; }
        }

        .txn {
          background: var(--card); border: 1px solid var(--border2);
          border-radius: 16px; padding: 14px 16px;
          display: flex; align-items: center; gap: 12px;
          animation: fadeUp 0.3s ease both; transition: all 0.2s;
        }

        .txn:hover { background: var(--surface); transform: translateX(3px); }

        .txn-emoji {
          width: 40px; height: 40px; border-radius: 12px;
          background: var(--surface); border: 1px solid var(--border2);
          display: flex; align-items: center; justify-content: center;
          font-size: 18px; flex-shrink: 0;
        }

        .txn-info { flex: 1; min-width: 0; }
        .txn-name { font-size: 13px; color: var(--text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-bottom: 3px; }
        .txn-meta { font-size: 10px; color: var(--muted); }

        .txn-right { text-align: right; flex-shrink: 0; }
        .txn-amt   { font-family: 'Syne', sans-serif; font-weight: 700; font-size: 14px; color: var(--accent2); }

        .del-btn {
          background: none; border: none; color: var(--muted2);
          cursor: pointer; font-size: 12px; margin-top: 5px;
          display: block; margin-left: auto; transition: color 0.2s; padding: 2px 4px;
        }

        .del-btn:hover { color: var(--accent2); }

        .empty {
          text-align: center; color: var(--muted); font-size: 12px;
          padding: 44px 20px; background: var(--card);
          border: 1px dashed var(--border2); border-radius: 18px; line-height: 2.2;
        }

        /* FAB */
        .fab {
          position: fixed; bottom: 28px; left: 50%;
          transform: translateX(-50%); z-index: 100;
          background: var(--accent); color: var(--bg);
          border: none; border-radius: 50px; padding: 15px 32px;
          font-family: 'Syne', sans-serif; font-weight: 700;
          font-size: 14px; cursor: pointer;
          display: flex; align-items: center; gap: 8px;
          box-shadow: 0 8px 32px rgba(200,255,87,0.35);
          transition: all 0.2s; white-space: nowrap;
        }

        .fab:hover { transform: translateX(-50%) translateY(-3px); box-shadow: 0 12px 40px rgba(200,255,87,0.5); }

        /* Modals */
        .overlay {
          position: fixed; inset: 0;
          background: rgba(0,0,0,0.75); backdrop-filter: blur(10px);
          z-index: 200; display: flex;
          align-items: flex-end; justify-content: center;
          opacity: 0; pointer-events: none; transition: opacity 0.3s;
        }

        .overlay.open { opacity: 1; pointer-events: all; }

        .modal {
          background: var(--card); border: 1px solid var(--border2);
          border-radius: 28px 28px 0 0; padding: 28px 24px 52px;
          width: 100%; max-width: 480px;
          transform: translateY(100%);
          transition: transform 0.4s cubic-bezier(0.4,0,0.2,1);
          max-height: 92vh; overflow-y: auto;
        }

        .overlay.open .modal { transform: translateY(0); }

        .modal-handle {
          width: 36px; height: 4px; background: var(--border2);
          border-radius: 10px; margin: 0 auto 24px;
        }

        .modal-title {
          font-family: 'Syne', sans-serif; font-weight: 800;
          font-size: 22px; margin-bottom: 22px; letter-spacing: -0.5px;
        }

        .form-label {
          font-size: 10px; color: var(--muted); letter-spacing: 1.5px;
          text-transform: uppercase; display: block; margin-bottom: 8px;
        }

        .form-group { margin-bottom: 16px; }

        .form-input {
          width: 100%; background: var(--surface);
          border: 1px solid var(--border2); border-radius: 14px;
          padding: 13px 16px; font-family: 'DM Mono', monospace;
          font-size: 14px; color: var(--text);
          outline: none; transition: border-color 0.2s;
        }

        .form-input:focus { border-color: var(--accent3); }

        .amt-input {
          font-family: 'Syne', sans-serif; font-weight: 700;
          font-size: 32px; text-align: center; letter-spacing: -1px;
        }

        .chip-row { display: flex; flex-wrap: wrap; gap: 7px; }

        .chip {
          padding: 8px 14px; border-radius: 12px;
          background: var(--surface); border: 1px solid var(--border2);
          font-family: 'DM Mono', monospace; font-size: 11px;
          cursor: pointer; color: var(--muted); transition: all 0.2s;
        }

        .chip.active { background: rgba(123,108,255,0.18); border-color: var(--accent3); color: var(--accent3); }
        .chip:hover  { border-color: var(--text); color: var(--text); }

        .btn-full {
          width: 100%; padding: 16px; background: var(--accent);
          color: var(--bg); border: none; border-radius: 16px;
          font-family: 'Syne', sans-serif; font-weight: 700;
          font-size: 16px; cursor: pointer; margin-top: 10px; transition: all 0.2s;
        }

        .btn-full:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(200,255,87,0.3); }
        .btn-full:disabled { opacity: 0.5; cursor: not-allowed; }

        /* Toast */
        .toast {
          position: fixed; top: 20px; left: 50%;
          transform: translateX(-50%) translateY(-90px);
          padding: 12px 22px; border-radius: 14px;
          font-family: 'Syne', sans-serif; font-weight: 600;
          font-size: 13px; z-index: 500;
          transition: transform 0.35s cubic-bezier(0.4,0,0.2,1);
          white-space: nowrap; pointer-events: none;
          box-shadow: 0 4px 20px rgba(0,0,0,0.4);
        }

        .toast.show    { transform: translateX(-50%) translateY(0); }
        .toast.success { background: var(--accent); color: var(--bg); }
        .toast.error   { background: var(--accent2); color: white; }

        /* Loading */
        .loading {
          display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          height: 60vh; gap: 16px; color: var(--muted);
          font-size: 11px; letter-spacing: 2px;
        }

        .spinner {
          width: 28px; height: 28px;
          border: 2px solid var(--border2);
          border-top-color: var(--accent);
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
        }

        @keyframes spin   { to { transform: rotate(360deg); } }
        @keyframes fadeUp { from { opacity:0; transform:translateY(14px); } to { opacity:1; transform:translateY(0); } }
      `}</style>

      <div className="page">
        <div className="page-inner">

          {/* Header */}
          <div className="area-header">
            <div className="header">
              <div className="logo">SPLURGE<span>.</span></div>
              <div className="month-nav">
                <button className="nav-btn" onClick={() => {
                  if (month === 1) { setMonth(12); setYear(y => y - 1) }
                  else setMonth(m => m - 1)
                }}>←</button>
                <span className="month-label">{MONTHS[month-1]} {year}</span>
                <button className="nav-btn" onClick={() => {
                  if (month === 12) { setMonth(1); setYear(y => y + 1) }
                  else setMonth(m => m + 1)
                }}>→</button>
              </div>
            </div>
          </div>

          {loading ? (
            <div style={{ gridColumn: '1 / 3' }}>
              <div className="loading"><div className="spinner" />LOADING</div>
            </div>
          ) : (
            <>
              {/* LEFT: summary + analysis + categories */}
              <div className="area-left">

                {/* Score Card */}
                <div className="score-card">
                  <div className="card-label">{MONTHS[month-1]} {year} — total spend</div>
                  <div className="card-amount">
                    <span className="sym">₹</span>
                    {(summary?.totalSpent ?? 0).toLocaleString('en-IN')}
                  </div>
                  <div className="budget-row">
                    <span>Budget <span className="hi">₹{(summary?.budget ?? 0).toLocaleString('en-IN')}</span></span>
                    <span>Left <span className="hi">₹{(summary?.remaining ?? 0).toLocaleString('en-IN')}</span></span>
                  </div>
                  <div className="bar-bg">
                    <div className="bar-fill" style={{ width: `${pct}%`, background: barColor }} />
                  </div>
                  <div className="bar-pct">{pct.toFixed(1)}% used</div>
                  <button className="budget-btn" onClick={() => setShowBudget(true)}>
                    ✦ {summary?.budget ? 'Update' : 'Set'} monthly budget
                  </button>
                </div>

                {/* AI Analysis Card */}
                <div className="analysis-card">
                  <div className="analysis-label">💡 AI Spending Analysis</div>

                  {parsed ? (
                    <>
                      {parsed.map(item => {
                        if (item.type === 'verdict') return (
                          <div key={item.key} className="verdict-row">
                            {item.text}
                          </div>
                        )
                        if (item.type === 'tip') return (
                          <div key={item.key} className="tip-row">
                            <div className="tip-num">{item.label.replace('TIP ', '')}</div>
                            <div className="tip-text">{item.text}</div>
                          </div>
                        )
                        if (item.type === 'save') return (
                          <div key={item.key} className="save-row">
                            <div className="save-label">Potential savings</div>
                            <div className="save-amount">{item.text}</div>
                          </div>
                        )
                        return null
                      })}
                    </>
                  ) : (
                    <div className="analysis-placeholder">
                      Get 3 personalized tips to save money this month ✦
                    </div>
                  )}

                  <button className="analyse-btn" onClick={handleRoast} disabled={roasting}>
                    {roasting ? '⏳ Analysing your spending...' : '💡 Analyse & Save'}
                  </button>
                </div>

                {/* Categories */}
                {summary?.byCategory && Object.keys(summary.byCategory).length > 0 && (
                  <>
                    <div className="section-title">📊 by category</div>
                    <div className="cat-grid">
                      {Object.entries(summary.byCategory).map(([cat, amt], i) => {
                        const max = Math.max(...Object.values(summary.byCategory))
                        const w   = max > 0 ? (amt / max) * 100 : 0
                        return (
                          <div key={cat}
                            className={`cat-card ${filterCat === cat ? 'active' : ''}`}
                            style={{ animationDelay: `${i * 0.06}s` }}
                            onClick={() => setFilterCat(filterCat === cat ? '' : cat)}>
                            <div className="cat-icon">{CATEGORY_ICONS[cat] ?? '💸'}</div>
                            <div className="cat-name">{cat}</div>
                            <div className="cat-amt">₹{amt.toLocaleString('en-IN')}</div>
                            <div className="cat-bar-bg">
                              <div className="cat-bar-fill" style={{ width:`${w}%`, background: CATEGORY_COLORS[cat] ?? '#7b6cff' }} />
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </>
                )}
              </div>

              {/* RIGHT: transactions */}
              <div className="area-right">
                <div className="section-title">⚡ transactions</div>
                <div className="tabs">
                  {['','food','travel','fun','shopping','health','learning','movie','others'].map(cat => (
                    <button key={cat || 'all'}
                      className={`tab ${filterCat === cat ? 'active' : ''}`}
                      onClick={() => setFilterCat(cat)}>
                      {cat ? `${CATEGORY_ICONS[cat] ?? ''} ${cat}` : 'All'}
                    </button>
                  ))}
                </div>
                <div className="txn-list">
                  {transactions.length === 0
                    ? <div className="empty">No transactions yet.<br />Hit <strong style={{color:'var(--accent)'}}>+ Add spend</strong> to log one!</div>
                    : transactions.map((txn, i) => (
                      <div key={txn.id} className="txn" style={{ animationDelay: `${i * 0.04}s` }}>
                        <div className="txn-emoji">{CATEGORY_ICONS[txn.category] ?? '💸'}</div>
                        <div className="txn-info">
                          <div className="txn-name">{txn.name}</div>
                          <div className="txn-meta">{txn.date} · {txn.category}{txn.note ? ` · ${txn.note}` : ''}</div>
                        </div>
                        <div className="txn-right">
                          <div className="txn-amt">−₹{txn.amount.toLocaleString('en-IN')}</div>
                          <button className="del-btn" title="Delete" onClick={() => handleDelete(txn.id)}>✕</button>
                        </div>
                      </div>
                    ))
                  }
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* FAB */}
      <button className="fab" onClick={() => setShowModal(true)}>+ Add spend</button>

      {/* Add Transaction Modal */}
      <div className={`overlay ${showModal ? 'open' : ''}`}
           onClick={e => e.target === e.currentTarget && setShowModal(false)}>
        <div className="modal">
          <div className="modal-handle" />
          <div className="modal-title">What'd you spend on?</div>
          <div className="form-group">
            <label className="form-label">Amount (₹)</label>
            <input className="form-input amt-input" type="number" placeholder="0"
              value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} />
          </div>
          <div className="form-group">
            <label className="form-label">What for?</label>
            <input className="form-input" type="text" placeholder="e.g. Zomato, Rapido, Movie..."
              value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
          </div>
          <div className="form-group">
            <label className="form-label">Category</label>
            <div className="chip-row">
              {['food','travel','fun','shopping','health','learning','movie','others'].map(cat => (
                <button key={cat} className={`chip ${form.category === cat ? 'active' : ''}`}
                  onClick={() => setForm({...form, category: cat})}>
                  {CATEGORY_ICONS[cat]} {cat}
                </button>
              ))}
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Note (optional)</label>
            <input className="form-input" type="text" placeholder="Any note..."
              value={form.note} onChange={e => setForm({...form, note: e.target.value})} />
          </div>
          <div className="form-group">
            <label className="form-label">Date (optional — defaults to today)</label>
            <input className="form-input" type="date"
              value={form.date} onChange={e => setForm({...form, date: e.target.value})} />
          </div>
          <button className="btn-full" onClick={handleAdd} disabled={submitting}>
            {submitting ? 'Saving...' : 'Log it ✦'}
          </button>
        </div>
      </div>

      {/* Set Budget Modal */}
      <div className={`overlay ${showBudget ? 'open' : ''}`}
           onClick={e => e.target === e.currentTarget && setShowBudget(false)}>
        <div className="modal">
          <div className="modal-handle" />
          <div className="modal-title">Set Monthly Budget</div>
          <div className="form-group">
            <label className="form-label">Budget for {MONTHS[month-1]} {year} (₹)</label>
            <input className="form-input amt-input" type="number" placeholder="25000"
              value={budgetForm.amount} onChange={e => setBudgetForm({ amount: e.target.value })} />
          </div>
          <button className="btn-full" onClick={handleSetBudget}>Set Budget ✦</button>
        </div>
      </div>

      {/* Toast */}
      {toast && <div className={`toast show ${toast.type}`}>{toast.msg}</div>}
    </>
  )
}