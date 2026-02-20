import { useNavigate } from 'react-router-dom'
import { getHistory } from '../utils/storage'
import { useEffect, useState } from 'react'
import type { Measurement } from '../types'

function formatDate(ts: number) {
  return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(ts))
}

export default function Home() {
  const navigate = useNavigate()
  const [recent, setRecent] = useState<Measurement[]>([])

  useEffect(() => {
    setRecent(getHistory().slice(0, 3))
  }, [])

  return (
    <main className="flex flex-col flex-1 px-4 pt-12 pb-4">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-2xl">📦</span>
          <h1 className="text-2xl font-bold tracking-tight">Scan Your Courier</h1>
        </div>
        <p className="text-slate-400 text-sm">Measure parcels instantly with your camera</p>
      </div>

      {/* CTA */}
      <button
        onClick={() => navigate('/scanner')}
        className="w-full bg-cyan-500 hover:bg-cyan-400 active:bg-cyan-600 text-slate-900 font-bold text-lg py-5 rounded-2xl flex items-center justify-center gap-3 transition-colors shadow-lg shadow-cyan-500/20"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-6 h-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 9V6a1 1 0 011-1h3M3 15v3a1 1 0 001 1h3m11-13h3a1 1 0 011 1v3m0 6v3a1 1 0 01-1 1h-3" />
        </svg>
        Scan a Parcel
      </button>

      {/* How it works */}
      <div className="mt-8 grid grid-cols-3 gap-3">
        {[
          { icon: '📷', label: 'Point camera', desc: 'Aim at your parcel' },
          { icon: '🤖', label: 'AI detects', desc: 'Auto measures box' },
          { icon: '💰', label: 'Compare prices', desc: 'Best courier rates' },
        ].map(step => (
          <div key={step.label} className="bg-slate-800 rounded-xl p-3 text-center">
            <div className="text-2xl mb-1">{step.icon}</div>
            <div className="text-xs font-semibold text-white">{step.label}</div>
            <div className="text-xs text-slate-400 mt-0.5">{step.desc}</div>
          </div>
        ))}
      </div>

      {/* Recent scans */}
      {recent.length > 0 && (
        <div className="mt-8">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-slate-300">Recent Scans</h2>
            <button
              onClick={() => navigate('/history')}
              className="text-xs text-cyan-400 hover:text-cyan-300"
            >
              View all
            </button>
          </div>
          <div className="space-y-2">
            {recent.map(m => (
              <button
                key={m.id}
                onClick={() => navigate('/results', { state: { measurement: m } })}
                className="w-full bg-slate-800 hover:bg-slate-700 rounded-xl px-4 py-3 flex items-center justify-between transition-colors"
              >
                <div className="text-left">
                  <div className="text-sm font-medium">
                    {m.dimensions.length} × {m.dimensions.width} × {m.dimensions.height} {m.unit}
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5">{formatDate(m.timestamp)}</div>
                </div>
                <div className="text-xs bg-slate-700 rounded-lg px-2 py-1 text-slate-300">
                  {m.weight}kg
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </main>
  )
}
