import { useRef, useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useModel } from '../hooks/useModel'
import { useCamera } from '../hooks/useCamera'
import { findBestBox, estimateDimensions, drawOverlay, type DetectedBox } from '../utils/dimensions'
import type { Measurement } from '../types'
import { saveMeasurement } from '../utils/storage'

export default function Scanner() {
  const navigate = useNavigate()
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animFrameRef = useRef<number>(0)

  const { model, state: modelState } = useModel()
  const { state: camState, error: camError } = useCamera(videoRef)

  const [currentBox, setCurrentBox] = useState<DetectedBox | null>(null)
  const [unit, setUnit] = useState<'cm' | 'in'>('cm')
  const [capturing, setCapturing] = useState(false)

  const runDetection = useCallback(async () => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas || !model || video.readyState < 2) {
      animFrameRef.current = requestAnimationFrame(runDetection)
      return
    }

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Match canvas to video
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight

    const predictions = await model.detect(video)
    const box = findBestBox(predictions)
    setCurrentBox(box)
    drawOverlay(ctx, box, canvas.width, canvas.height)

    animFrameRef.current = requestAnimationFrame(runDetection)
  }, [model])

  useEffect(() => {
    if (modelState === 'ready' && camState === 'active') {
      animFrameRef.current = requestAnimationFrame(runDetection)
    }
    return () => cancelAnimationFrame(animFrameRef.current)
  }, [modelState, camState, runDetection])

  const handleCapture = useCallback(() => {
    const video = videoRef.current
    if (!video || !currentBox) return

    setCapturing(true)
    cancelAnimationFrame(animFrameRef.current)

    const dims = estimateDimensions(
      currentBox,
      video.videoWidth,
      video.videoHeight,
      unit
    )

    const measurement: Measurement = {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      dimensions: dims,
      weight: 0, // user fills this in on Results page
      unit,
      confidence: currentBox.score
    }

    saveMeasurement(measurement)
    navigate('/results', { state: { measurement } })
  }, [currentBox, unit, navigate])

  const isReady = modelState === 'ready' && camState === 'active'
  const isLoading = modelState === 'loading' || camState === 'requesting'

  return (
    <main className="flex flex-col flex-1 bg-black relative">
      {/* Back button */}
      <button
        onClick={() => navigate('/')}
        className="absolute top-4 left-4 z-20 bg-black/50 backdrop-blur-sm rounded-full p-2"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-5 h-5 text-white">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      {/* Unit toggle */}
      <div className="absolute top-4 right-4 z-20 bg-black/50 backdrop-blur-sm rounded-full flex overflow-hidden">
        {(['cm', 'in'] as const).map(u => (
          <button
            key={u}
            onClick={() => setUnit(u)}
            className={`px-3 py-1.5 text-sm font-medium transition-colors ${
              unit === u ? 'bg-cyan-500 text-slate-900' : 'text-white'
            }`}
          >
            {u}
          </button>
        ))}
      </div>

      {/* Video + Canvas */}
      <div className="relative flex-1 flex items-center justify-center overflow-hidden">
        <video
          ref={videoRef}
          className="absolute inset-0 w-full h-full object-cover"
          playsInline
          muted
        />
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full object-cover"
        />

        {/* Loading overlay */}
        {isLoading && (
          <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center gap-3 z-10">
            <div className="w-10 h-10 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
            <p className="text-white text-sm">
              {camState === 'requesting'
                ? 'Requesting camera...'
                : camState === 'active' && modelState === 'loading'
                ? 'Loading AI model...'
                : 'Starting up...'}
            </p>
          </div>
        )}

        {/* Camera error */}
        {camError && (
          <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center gap-3 z-10 px-6 text-center">
            <div className="text-4xl">📷</div>
            <p className="text-white font-medium">Camera access required</p>
            <p className="text-slate-400 text-sm">{camError}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-2 bg-cyan-500 text-slate-900 font-semibold px-5 py-2 rounded-full text-sm"
            >
              Try again
            </button>
          </div>
        )}

        {/* Model error */}
        {modelState === 'error' && (
          <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center gap-3 z-10 px-6 text-center">
            <div className="text-4xl">🤖</div>
            <p className="text-white font-medium">AI model failed to load</p>
            <p className="text-slate-400 text-sm">Check your internet connection and try again</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-2 bg-cyan-500 text-slate-900 font-semibold px-5 py-2 rounded-full text-sm"
            >
              Retry
            </button>
          </div>
        )}
      </div>

      {/* Bottom bar */}
      <div className="bg-slate-900/95 backdrop-blur-sm px-6 py-5 flex flex-col items-center gap-3">
        {isReady && !currentBox && (
          <p className="text-slate-400 text-sm text-center">
            Place your parcel in frame — AI will detect it automatically
          </p>
        )}
        {isReady && currentBox && (
          <p className="text-cyan-400 text-sm text-center font-medium">
            Parcel detected ({Math.round(currentBox.score * 100)}% confidence) — tap Capture
          </p>
        )}

        <button
          onClick={handleCapture}
          disabled={!isReady || !currentBox || capturing}
          className={`w-20 h-20 rounded-full border-4 flex items-center justify-center transition-all ${
            currentBox && isReady && !capturing
              ? 'border-cyan-400 bg-cyan-400/20 active:scale-95'
              : 'border-slate-600 bg-slate-700 opacity-40 cursor-not-allowed'
          }`}
        >
          <div className={`w-14 h-14 rounded-full transition-colors ${
            currentBox && isReady && !capturing ? 'bg-cyan-400' : 'bg-slate-600'
          }`} />
        </button>

        <p className="text-xs text-slate-500">
          Accuracy ±10–20% — you can adjust measurements after capture
        </p>
      </div>
    </main>
  )
}
