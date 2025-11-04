/** US States (typed) **/
interface USState { code: string; name: string, required?: boolean }
const US_STATES: USState[] = [
    { code: 'AL', name: 'Alabama' }, { code: 'AK', name: 'Alaska' }, { code: 'AZ', name: 'Arizona' },
    { code: 'AR', name: 'Arkansas' }, { code: 'CA', name: 'California', required: true }, { code: 'CO', name: 'Colorado' },
    { code: 'CT', name: 'Connecticut' }, { code: 'DE', name: 'Delaware' }, { code: 'DC', name: 'District of Columbia' }, { code: 'FL', name: 'Florida', required: true },
    { code: 'GA', name: 'Georgia' }, { code: 'HI', name: 'Hawaii', required: true }, { code: 'ID', name: 'Idaho' },
    { code: 'IL', name: 'Illinois', required: true }, { code: 'IN', name: 'Indiana' }, { code: 'IA', name: 'Iowa' },
    { code: 'KS', name: 'Kansas' }, { code: 'KY', name: 'Kentucky' }, { code: 'LA', name: 'Louisiana', required: true },
    { code: 'ME', name: 'Maine' }, { code: 'MD', name: 'Maryland', required: true }, { code: 'MA', name: 'Massachusetts', required: true },
    { code: 'MI', name: 'Michigan' }, { code: 'MN', name: 'Minnesota' }, { code: 'MS', name: 'Mississippi' },
    { code: 'MO', name: 'Missouri' }, { code: 'MT', name: 'Montana' }, { code: 'NE', name: 'Nebraska' },
    { code: 'NV', name: 'Nevada' }, { code: 'NH', name: 'New Hampshire' }, { code: 'NJ', name: 'New Jersey' },
    { code: 'NM', name: 'New Mexico' }, { code: 'NY', name: 'New York', required: true }, { code: 'NC', name: 'North Carolina' },
    { code: 'ND', name: 'North Dakota' }, { code: 'OH', name: 'Ohio' }, { code: 'OK', name: 'Oklahoma' },
    { code: 'OR', name: 'Oregon' }, { code: 'PA', name: 'Pennsylvania' }, { code: 'RI', name: 'Rhode Island' },
    { code: 'SC', name: 'South Carolina' }, { code: 'SD', name: 'South Dakota' }, { code: 'TN', name: 'Tennessee' },
    { code: 'TX', name: 'Texas' }, { code: 'UT', name: 'Utah' }, { code: 'VT', name: 'Vermont' },
    { code: 'VA', name: 'Virginia' }, { code: 'WA', name: 'Washington', required: true }, { code: 'WV', name: 'West Virginia' },
    { code: 'WI', name: 'Wisconsin' }, { code: 'WY', name: 'Wyoming' }
]
export const stateOptions = US_STATES.map(s => ({ label: s.name, value: s.code }))

export const fieldUi = { filled: true, 'bg-color': 'grey-4', dense: true } as const

export function maskSSN(val: string): string {
    const d = (val || '').replace(/\D/g, '').slice(0, 9) // keep 9 digits max
    if (!d) return ''
    // build ***-**-LAST4 (gracefully handles partial input)
    const last4 = d.slice(-4)
    const prefix = '***-**-'
    // if not enough digits yet, fill from the end
    const paddedLast4 = last4.padStart(Math.min(4, d.length), '*')
    return prefix + paddedLast4
}
