// Static rate tables for common couriers
// Rates are in USD, based on volumetric or actual weight (whichever is greater)
// Volumetric divisor: 5000 (cm³ / 5000 = kg)

export interface RateTier {
  maxWeight: number // kg
  price: number     // USD
}

export interface Courier {
  name: string
  color: string
  services: {
    name: string
    estimatedDays: string
    tiers: RateTier[]
  }[]
}

export const couriers: Courier[] = [
  {
    name: 'FedEx',
    color: '#4D148C',
    services: [
      {
        name: 'Ground',
        estimatedDays: '1–5 days',
        tiers: [
          { maxWeight: 0.5, price: 8.99 },
          { maxWeight: 1, price: 10.99 },
          { maxWeight: 2, price: 13.49 },
          { maxWeight: 5, price: 16.99 },
          { maxWeight: 10, price: 22.99 },
          { maxWeight: 20, price: 34.99 },
          { maxWeight: 30, price: 49.99 },
        ]
      },
      {
        name: 'Express Saver',
        estimatedDays: '3 days',
        tiers: [
          { maxWeight: 0.5, price: 14.99 },
          { maxWeight: 1, price: 17.49 },
          { maxWeight: 2, price: 21.99 },
          { maxWeight: 5, price: 28.99 },
          { maxWeight: 10, price: 39.99 },
          { maxWeight: 20, price: 59.99 },
          { maxWeight: 30, price: 79.99 },
        ]
      },
      {
        name: '2Day',
        estimatedDays: '2 days',
        tiers: [
          { maxWeight: 0.5, price: 19.99 },
          { maxWeight: 1, price: 23.49 },
          { maxWeight: 2, price: 29.99 },
          { maxWeight: 5, price: 38.99 },
          { maxWeight: 10, price: 54.99 },
          { maxWeight: 20, price: 79.99 },
          { maxWeight: 30, price: 109.99 },
        ]
      }
    ]
  },
  {
    name: 'UPS',
    color: '#351C15',
    services: [
      {
        name: 'Ground',
        estimatedDays: '1–5 days',
        tiers: [
          { maxWeight: 0.5, price: 9.49 },
          { maxWeight: 1, price: 11.49 },
          { maxWeight: 2, price: 13.99 },
          { maxWeight: 5, price: 17.49 },
          { maxWeight: 10, price: 23.49 },
          { maxWeight: 20, price: 35.99 },
          { maxWeight: 30, price: 51.99 },
        ]
      },
      {
        name: '3 Day Select',
        estimatedDays: '3 days',
        tiers: [
          { maxWeight: 0.5, price: 15.49 },
          { maxWeight: 1, price: 18.49 },
          { maxWeight: 2, price: 22.99 },
          { maxWeight: 5, price: 29.99 },
          { maxWeight: 10, price: 41.99 },
          { maxWeight: 20, price: 62.99 },
          { maxWeight: 30, price: 84.99 },
        ]
      },
      {
        name: '2nd Day Air',
        estimatedDays: '2 days',
        tiers: [
          { maxWeight: 0.5, price: 20.99 },
          { maxWeight: 1, price: 24.99 },
          { maxWeight: 2, price: 31.99 },
          { maxWeight: 5, price: 41.99 },
          { maxWeight: 10, price: 58.99 },
          { maxWeight: 20, price: 84.99 },
          { maxWeight: 30, price: 114.99 },
        ]
      }
    ]
  },
  {
    name: 'DHL',
    color: '#D40511',
    services: [
      {
        name: 'Express Worldwide',
        estimatedDays: '1–3 days',
        tiers: [
          { maxWeight: 0.5, price: 22.99 },
          { maxWeight: 1, price: 27.99 },
          { maxWeight: 2, price: 34.99 },
          { maxWeight: 5, price: 46.99 },
          { maxWeight: 10, price: 68.99 },
          { maxWeight: 20, price: 99.99 },
          { maxWeight: 30, price: 139.99 },
        ]
      },
      {
        name: 'Economy Select',
        estimatedDays: '2–5 days',
        tiers: [
          { maxWeight: 0.5, price: 12.99 },
          { maxWeight: 1, price: 15.99 },
          { maxWeight: 2, price: 19.99 },
          { maxWeight: 5, price: 26.99 },
          { maxWeight: 10, price: 38.99 },
          { maxWeight: 20, price: 57.99 },
          { maxWeight: 30, price: 79.99 },
        ]
      }
    ]
  },
  {
    name: 'USPS',
    color: '#004B87',
    services: [
      {
        name: 'Priority Mail',
        estimatedDays: '1–3 days',
        tiers: [
          { maxWeight: 0.5, price: 8.70 },
          { maxWeight: 1, price: 9.85 },
          { maxWeight: 2, price: 12.15 },
          { maxWeight: 5, price: 17.40 },
          { maxWeight: 10, price: 26.35 },
          { maxWeight: 20, price: 42.80 },
          { maxWeight: 30, price: 59.25 },
        ]
      },
      {
        name: 'First Class',
        estimatedDays: '1–3 days',
        tiers: [
          { maxWeight: 0.4, price: 5.57 },
          { maxWeight: 0.5, price: 6.12 },
          { maxWeight: 1, price: 7.35 },
          { maxWeight: 2, price: 9.80 },
          { maxWeight: 5, price: 14.60 },
          { maxWeight: 10, price: 21.45 },
          { maxWeight: 20, price: 35.20 },
        ]
      }
    ]
  }
]

export function getVolumetricWeight(l: number, w: number, h: number, unit: 'cm' | 'in'): number {
  // Convert to cm if in inches
  const factor = unit === 'in' ? 2.54 : 1
  const lcm = l * factor
  const wcm = w * factor
  const hcm = h * factor
  return (lcm * wcm * hcm) / 5000
}

export function getBillableWeight(
  actualWeight: number,
  l: number,
  w: number,
  h: number,
  unit: 'cm' | 'in'
): number {
  const volWeight = getVolumetricWeight(l, w, h, unit)
  return Math.max(actualWeight, volWeight)
}

export function getPrice(courier: Courier, serviceIndex: number, weightKg: number): number | null {
  const service = courier.services[serviceIndex]
  if (!service) return null
  const tier = service.tiers.find(t => weightKg <= t.maxWeight)
  return tier ? tier.price : null
}
