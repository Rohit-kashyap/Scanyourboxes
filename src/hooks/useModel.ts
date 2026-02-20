import { useState, useEffect, useRef } from 'react'
import * as cocoSsd from '@tensorflow-models/coco-ssd'
import '@tensorflow/tfjs'

type ModelState = 'idle' | 'loading' | 'ready' | 'error'

export function useModel() {
  const [state, setState] = useState<ModelState>('idle')
  // Store model in state so consumers re-render when it becomes available
  const [model, setModel] = useState<cocoSsd.ObjectDetection | null>(null)
  const cancelledRef = useRef(false)

  useEffect(() => {
    cancelledRef.current = false
    setState('loading')
    cocoSsd.load({ base: 'lite_mobilenet_v2' })
      .then(loaded => {
        if (!cancelledRef.current) {
          setModel(loaded)
          setState('ready')
        }
      })
      .catch(() => {
        if (!cancelledRef.current) setState('error')
      })
    return () => { cancelledRef.current = true }
  }, [])

  return { model, state }
}
