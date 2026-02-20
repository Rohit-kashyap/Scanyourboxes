export interface Measurement {
  id: string
  timestamp: number
  dimensions: {
    length: number
    width: number
    height: number
  }
  weight: number
  unit: 'cm' | 'in'
  confidence: number
}

export interface CourierRate {
  name: string
  logo: string
  service: string
  price: number
  estimatedDays: string
  maxWeight: number
}
