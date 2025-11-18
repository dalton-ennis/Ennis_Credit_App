import admLogo from 'src/assets/ADM.jpg'
import amcLogo from 'src/assets/AMC.jpg'

export const plantTypes = {
    admore: { color: ['bg-green', 'text-white'], logo: admLogo },
    amc: { color: ['bg-purple', 'text-white'], logo: amcLogo },
    default: { color: ['bg-blue', 'text-white'], logo: 'n/a' }

} as const

export type PlantCode = keyof typeof plantTypes              // 'admore' | 'amc'
export type PlantDetails = (typeof plantTypes)[PlantCode]    // { color: string; logo: string }

export function isPlantCode(x: unknown): x is PlantCode {
    return typeof x === 'string' && x in plantTypes
}
