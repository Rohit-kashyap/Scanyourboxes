import type * as cocoSsd from '@tensorflow-models/coco-ssd'

export interface DetectedBox {
  x: number
  y: number
  width: number
  height: number
  score: number
  class: string
}

// Box-like classes from COCO-SSD that could be parcels
const BOX_CLASSES = new Set([
  'suitcase', 'backpack', 'handbag', 'book', 'laptop', 'cell phone',
  'keyboard', 'tv', 'microwave', 'oven', 'toaster', 'refrigerator',
  'clock', 'vase', 'cup', 'bottle', 'bowl', 'chair', 'couch',
  'potted plant', 'bed', 'dining table', 'toilet', 'remote', 'mouse',
  'scissors', 'teddy bear', 'hair drier', 'toothbrush'
])

export function findBestBox(predictions: cocoSsd.DetectedObject[]): DetectedBox | null {
  if (predictions.length === 0) return null

  // Prefer box-like objects, fallback to highest confidence
  const boxLike = predictions.filter(p => BOX_CLASSES.has(p.class))
  const candidates = boxLike.length > 0 ? boxLike : predictions

  const best = candidates.reduce((a, b) => (a.score > b.score ? a : b))
  return {
    x: best.bbox[0],
    y: best.bbox[1],
    width: best.bbox[2],
    height: best.bbox[3],
    score: best.score,
    class: best.class
  }
}

/**
 * Estimate real-world dimensions from a bounding box.
 * Uses the assumption that the box fills a known reference space.
 * Without depth information, we estimate depth as ~60% of the smaller dimension.
 */
export function estimateDimensions(
  box: DetectedBox,
  videoWidth: number,
  videoHeight: number,
  unit: 'cm' | 'in'
): { length: number; width: number; height: number } {
  // Assume a typical "arm's length" shooting distance of ~60cm / 24in
  // and a typical camera FOV of ~60 degrees horizontal
  const fovH = 60 * (Math.PI / 180)
  const distanceCm = 60

  // Real-world width of the video frame at that distance
  const frameRealWidthCm = 2 * distanceCm * Math.tan(fovH / 2)
  const frameRealHeightCm = frameRealWidthCm * (videoHeight / videoWidth)

  const realWidthCm = (box.width / videoWidth) * frameRealWidthCm
  const realHeightCm = (box.height / videoHeight) * frameRealHeightCm
  // Estimate depth as 60% of the smaller face dimension
  const realDepthCm = Math.min(realWidthCm, realHeightCm) * 0.6

  const factor = unit === 'in' ? 1 / 2.54 : 1

  return {
    length: Math.round(Math.max(realWidthCm, realHeightCm) * factor * 10) / 10,
    width: Math.round(Math.min(realWidthCm, realHeightCm) * factor * 10) / 10,
    height: Math.round(realDepthCm * factor * 10) / 10
  }
}

export function drawOverlay(
  ctx: CanvasRenderingContext2D,
  box: DetectedBox | null,
  width: number,
  height: number
): void {
  ctx.clearRect(0, 0, width, height)

  if (!box) {
    // Draw scanning guide
    ctx.strokeStyle = 'rgba(255,255,255,0.3)'
    ctx.lineWidth = 1
    ctx.setLineDash([8, 8])
    const padding = 40
    ctx.strokeRect(padding, padding, width - padding * 2, height - padding * 2)
    ctx.setLineDash([])

    ctx.fillStyle = 'rgba(255,255,255,0.5)'
    ctx.font = '14px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('Point camera at your parcel', width / 2, height / 2)
    return
  }

  const { x, y, width: bw, height: bh, score } = box
  const color = score > 0.7 ? '#22c55e' : score > 0.4 ? '#eab308' : '#ef4444'

  // Main bounding box
  ctx.strokeStyle = color
  ctx.lineWidth = 3
  ctx.setLineDash([])
  ctx.strokeRect(x, y, bw, bh)

  // Corner accents
  const cs = 20
  ctx.lineWidth = 4
  ;[
    [x, y, x + cs, y, x, y + cs],
    [x + bw, y, x + bw - cs, y, x + bw, y + cs],
    [x, y + bh, x + cs, y + bh, x, y + bh - cs],
    [x + bw, y + bh, x + bw - cs, y + bh, x + bw, y + bh - cs],
  ].forEach(([mx, my, lx1, ly1, lx2, ly2]) => {
    ctx.beginPath()
    ctx.moveTo(lx1, ly1)
    ctx.lineTo(mx, my)
    ctx.lineTo(lx2, ly2)
    ctx.stroke()
  })

  // Confidence badge
  ctx.fillStyle = color
  ctx.fillRect(x, y - 24, 80, 22)
  ctx.fillStyle = '#000'
  ctx.font = 'bold 12px sans-serif'
  ctx.textAlign = 'left'
  ctx.fillText(`${Math.round(score * 100)}% conf.`, x + 6, y - 8)
}
