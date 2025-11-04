export type RuleResult = true | string
export type RuleFn = (v: unknown) => RuleResult

const toNum = (v: unknown): number => {
    if (typeof v === 'number') return v
    if (typeof v === 'string') return Number(v)
    return NaN
}

export const required = (v: unknown): RuleResult => {
    if (typeof v === 'string') return v.trim().length > 0 || 'Required'
    if (typeof v === 'number') return Number.isFinite(v) || 'Required'
    if (typeof v === 'boolean') return (v === true) || 'Required'
    if (Array.isArray(v)) return v.length > 0 || 'Required'
    if (v instanceof Date) return !isNaN(v.getTime()) || 'Required'
    if (typeof v === 'object' && v !== null) {
        const maybe = (v as { value?: unknown }).value
        return maybe !== undefined ? required(maybe) : true
    }
    return 'Required'
}

export const emailRule = (v: string) =>
    (/^\S+@\S+\.\S+$/.test(v) ? true : 'Enter a valid email')

export const phoneRule = (v: string) =>
    ((v || '').replace(/\D/g, '').length === 10 ? true : 'Enter 10-digit phone')

export const faxRule = (v: string) =>
    (!v ? true : ((v || '').replace(/\D/g, '').length === 10 ? true : 'Enter 10-digit fax'))

export const zipRule = (v: string) =>
    (/^\d{5}(-\d{4})?$/.test(v || '') ? true : 'ZIP 12345 or 12345-6789')

export const ssnRule = (v: string) =>
    (/^\d{3}-\d{2}-\d{4}$/.test(v || '') ? true : 'SSN 000-00-0000')

export const positiveRule = (v: number | null | undefined) =>
    (v == null || v >= 0 ? true : 'Must be ≥ 0')

export const oneOfRequired = (labelA: string, labelB: string) => (a?: string, b?: string): RuleResult => {
    const aOk = !!(a && a.trim())
    const bOk = !!(b && b.trim())
    return (aOk || bOk) ? true : `Provide ${labelA} or ${labelB}`
}

export const minItems = (n: number) => (arr: unknown[]): RuleResult =>
    (Array.isArray(arr) && arr.length >= n) ? true : `At least ${n} items`

export const nonEmptyForEachKey = (obj: Record<string, string>, keys: string[]): RuleResult => {
    for (const k of keys) {
        if (!obj?.[k] || !obj[k].trim()) return `Enter value for ${k}`
    }
    return true
}



// Year must be within [currentYear - 18, currentYear + 1]
export const yearRule = (v: unknown) => {
    const yr = toNum(v)
    const min = new Date().getFullYear() - 18
    const max = new Date().getFullYear() + 1

    if (!Number.isFinite(yr)) return 'Enter a year'
    if (yr < min || yr > max) return `Year must be between ${min} and ${max}`
    return true
}

// Month must be 1-12
export const monthRule = (v: unknown) => {
    const mm = toNum(v)

    if (!Number.isFinite(mm)) return 'Enter a month'
    if (mm < 1 || mm > 12) return 'Month must be 1–12'
    return true
}

// Day must be 1-31
export const dayRule = (v: unknown) => {
    const dd = toNum(v)

    if (!Number.isFinite(dd)) return 'Enter a day'
    if (dd < 1 || dd > 31) return 'Day must be 1–31'
    return true
}