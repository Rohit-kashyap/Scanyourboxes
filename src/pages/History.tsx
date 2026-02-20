import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getHistory, deleteMeasurement, clearHistory } from '../utils/storage'
import type { Measurement } from '../types'

function formatDate(ts: number) {
  return new Intl.DateTimeFormat('en', {
    month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit'
  }).format(new Date(ts))
}

export default function History() {
  const navigate = useNavigate()
  const [history, setHistory] = useState<Measurement[]>([])
  const [confirmClear, setConfirmClear] = useState(false)

  useEffect(() => {
    setHistory(getHistory())
  }, [])

  function handleDelete(id: string) {
    deleteMeasurement(id)
    setHistory(getHistory())
  }

  function handleClearAll() {
    if (!confirmClear) {
      setConfirmClear(true)
      setTimeout(() => setConfirmClear(false), 3000)
      return
    }
    clearHistory()
    setHistory([])
    setConfirmClear(false)
  }

  return (
    <main className="flex flex-col flex-1 px-4 pt-6 pb-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold">History</h1>
        {history.length > 0 && (
          <button
            onClick={handleClearAll}
            className={`text-xs font-medium px-3 py-1.5 rounded-full transition-colors ${
              confirmClear
                ? 'bg-red-500/20 text-red-400'
                : 'bg-slate-700 text-slate-400 hover:text-slate-200'
            }`}
          >
            {confirmClear ? 'Tap again to confirm' : 'Clear all'}
          </button>
        )}
      </div>

      {history.length === 0 ? (
        <div className="flex flex-col flex-1 items-center justify-center gap-4 text-center">
          <div className="text-5xl opacity-30">📋</div>
          <p className="text-slate-400">No scans yet</p>
          <button
            onClick={() => navigate('/scanner')}
            className="bg-cyan-500 text-slate-900 font-semibold px-5 py-2.5 rounded-full text-sm"
          >
            Scan your first parcel
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {history.map(m => (
            <div
              key={m.id}
              className="bg-slate-800 rounded-2xl px-4 py-3 flex items-center gap-3"
            >
              <button
                onClick={() => navigate('/results', { state: { measurement: m } })}
                className="flex-1 text-left"
              >
                <div className="font-semibold text-sm">
                  {m.dimensions.length} × {m.dimensions.width} × {m.dimensions.height} {m.unit}
                </div>
                <div className="text-xs text-slate-400 mt-0.5 flex items-center gap-2">
                  <span>{formatDate(m.timestamp)}</span>
                  {m.weight > 0 && (
                    <span className="bg-slate-700 rounded px-1.5 py-0.5">{m.weight}kg</span>
                  )}
                  <span className={`rounded px-1.5 py-0.5 ${
                    m.confidence > 0.7 ? 'bg-green-900/50 text-green-400' :
                    m.confidence > 0.4 ? 'bg-yellow-900/50 text-yellow-400' :
                    'bg-red-900/50 text-red-400'
                  }`}>
                    {Math.round(m.confidence * 100)}%
                  </span>
                </div>
              </button>
              <button
                onClick={() => handleDelete(m.id)}
                className="p-2 text-slate-500 hover:text-red-400 transition-colors"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </main>
  )
}
