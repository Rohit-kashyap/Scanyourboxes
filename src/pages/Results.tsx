import { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import type { Measurement } from '../types'
import { saveMeasurement, getHistory } from '../utils/storage'
import { couriers, getBillableWeight, getPrice, getVolumetricWeight } from '../data/courierRates'

export default function Results() {
  const location = useLocation()
  const navigate = useNavigate()
  const incoming = location.state?.measurement as Measurement | undefined

  const [measurement, setMeasurement] = useState<Measurement | null>(incoming ?? null)
  const [weight, setWeight] = useState(incoming?.weight?.toString() ?? '')
  const [saved, setSaved] = useState(!!incoming?.weight)

  // If arrived without state (e.g. direct nav from history), load from storage
  useEffect(() => {
    if (!measurement) {
      const history = getHistory()
      if (history.length > 0) setMeasurement(history[0])
    }
  }, [measurement])

  if (!measurement) {
    return (
      <main className="flex flex-col flex-1 items-center justify-center gap-4 px-6 text-center">
        <div className="text-4xl">📦</div>
        <p className="text-slate-300">No measurement found.</p>
        <button
          onClick={() => navigate('/scanner')}
          className="bg-cyan-500 text-slate-900 font-semibold px-5 py-2.5 rounded-full"
        >
          Scan a parcel
        </button>
      </main>
    )
  }

  const { dimensions, unit, confidence } = measurement
  const weightKg = parseFloat(weight) || 0
  const volWeight = getVolumetricWeight(dimensions.length, dimensions.width, dimensions.height, unit)
  const billable = getBillableWeight(weightKg, dimensions.length, dimensions.width, dimensions.height, unit)

  function handleDimChange(field: keyof typeof dimensions, val: string) {
    const num = parseFloat(val)
    if (isNaN(num)) return
    const updated: Measurement = {
      ...measurement!,
      dimensions: { ...measurement!.dimensions, [field]: num }
    }
    setMeasurement(updated)
    setSaved(false)
  }

  function handleSave() {
    if (!measurement) return
    const updated: Measurement = { ...measurement, weight: weightKg }
    saveMeasurement(updated)
    setMeasurement(updated)
    setSaved(true)
  }

  return (
    <main className="flex flex-col flex-1 px-4 pt-6 pb-6 overflow-y-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(-1)} className="p-2 rounded-full bg-slate-800">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-xl font-bold">Measurement Results</h1>
      </div>

      {/* Confidence badge */}
      <div className={`mb-4 text-xs font-medium px-3 py-1.5 rounded-full self-start ${
        confidence > 0.7 ? 'bg-green-900/50 text-green-400' :
        confidence > 0.4 ? 'bg-yellow-900/50 text-yellow-400' :
        'bg-red-900/50 text-red-400'
      }`}>
        {confidence > 0.7 ? '✓' : '⚠'} AI confidence: {Math.round(confidence * 100)}%
        {confidence < 0.5 && ' — verify dimensions below'}
      </div>

      {/* Dimension inputs */}
      <div className="bg-slate-800 rounded-2xl p-4 mb-4">
        <h2 className="text-sm font-semibold text-slate-400 mb-3">Dimensions ({unit})</h2>
        <div className="grid grid-cols-3 gap-3">
          {(['length', 'width', 'height'] as const).map(field => (
            <div key={field}>
              <label className="text-xs text-slate-500 capitalize block mb-1">{field}</label>
              <input
                type="number"
                inputMode="decimal"
                value={dimensions[field]}
                onChange={e => handleDimChange(field, e.target.value)}
                className="w-full bg-slate-700 rounded-xl px-3 py-2.5 text-white text-center font-semibold focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Weight input */}
      <div className="bg-slate-800 rounded-2xl p-4 mb-4">
        <h2 className="text-sm font-semibold text-slate-400 mb-3">Actual Weight</h2>
        <div className="flex items-center gap-3">
          <input
            type="number"
            inputMode="decimal"
            placeholder="0.0"
            value={weight}
            onChange={e => { setWeight(e.target.value); setSaved(false) }}
            className="flex-1 bg-slate-700 rounded-xl px-4 py-3 text-white text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-cyan-500"
          />
          <span className="text-slate-400 font-medium">kg</span>
        </div>
      </div>

      {/* Volumetric summary */}
      <div className="bg-slate-800 rounded-2xl p-4 mb-4 grid grid-cols-2 gap-3">
        <div className="bg-slate-700/50 rounded-xl p-3 text-center">
          <div className="text-xs text-slate-400 mb-1">Volumetric weight</div>
          <div className="text-lg font-bold text-cyan-400">{volWeight.toFixed(2)} kg</div>
        </div>
        <div className="bg-slate-700/50 rounded-xl p-3 text-center">
          <div className="text-xs text-slate-400 mb-1">Billable weight</div>
          <div className="text-lg font-bold text-white">{billable.toFixed(2)} kg</div>
        </div>
      </div>

      {/* Save button */}
      {!saved && (
        <button
          onClick={handleSave}
          disabled={!weight || weightKg <= 0}
          className="w-full bg-cyan-500 disabled:bg-slate-700 disabled:text-slate-500 text-slate-900 font-bold py-3.5 rounded-2xl mb-6 transition-colors"
        >
          Save & Compare Prices
        </button>
      )}

      {/* Courier rates */}
      {weightKg > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-slate-400 mb-3">Courier Prices (estimated)</h2>
          <div className="space-y-3">
            {couriers.flatMap(courier =>
              courier.services.map((service, si) => {
                const price = getPrice(courier, si, billable)
                if (price === null) return null
                return (
                  <div key={`${courier.name}-${service.name}`} className="bg-slate-800 rounded-2xl px-4 py-3 flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-sm">{courier.name}</div>
                      <div className="text-xs text-slate-400">{service.name} · {service.estimatedDays}</div>
                    </div>
                    <div className="text-lg font-bold text-cyan-400">${price.toFixed(2)}</div>
                  </div>
                )
              }).filter(Boolean)
            )}
          </div>
          <p className="text-xs text-slate-500 mt-3 text-center">
            Estimates only. Actual rates may vary by destination and surcharges.
          </p>
        </div>
      )}
    </main>
  )
}
