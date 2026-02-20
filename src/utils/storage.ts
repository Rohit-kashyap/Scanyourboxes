import type { Measurement } from '../types'

const STORAGE_KEY = 'courier-scan-history'

export function getHistory(): Measurement[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as Measurement[]) : []
  } catch {
    return []
  }
}

export function saveMeasurement(m: Measurement): void {
  const history = getHistory()
  history.unshift(m)
  // Keep last 50
  const trimmed = history.slice(0, 50)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed))
}

export function deleteMeasurement(id: string): void {
  const history = getHistory().filter(m => m.id !== id)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(history))
}

export function clearHistory(): void {
  localStorage.removeItem(STORAGE_KEY)
}
