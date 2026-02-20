import { useState, useEffect, useRef } from 'react'

type CameraState = 'idle' | 'requesting' | 'active' | 'error'

export function useCamera(videoRef: React.RefObject<HTMLVideoElement | null>) {
  const [state, setState] = useState<CameraState>('idle')
  const [error, setError] = useState<string | null>(null)
  const streamRef = useRef<MediaStream | null>(null)

  useEffect(() => {
    let cancelled = false
    setState('requesting')

    navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: { ideal: 'environment' },
        width: { ideal: 1280 },
        height: { ideal: 720 }
      },
      audio: false
    })
      .then(stream => {
        if (cancelled) {
          stream.getTracks().forEach(t => t.stop())
          return
        }
        streamRef.current = stream
        const video = videoRef.current
        if (video) {
          video.srcObject = stream
          // Wait for video to actually start playing before marking active
          video.onloadedmetadata = () => {
            video.play()
              .then(() => { if (!cancelled) setState('active') })
              .catch(() => { if (!cancelled) setState('active') }) // still mark active even if autoplay quirks
          }
        } else {
          setState('active')
        }
      })
      .catch(err => {
        if (!cancelled) {
          setError(err.message ?? 'Camera access denied')
          setState('error')
        }
      })

    return () => {
      cancelled = true
      streamRef.current?.getTracks().forEach(t => t.stop())
      streamRef.current = null
    }
  }, [videoRef])

  return { state, error }
}
