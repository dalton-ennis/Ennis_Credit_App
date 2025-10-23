import { ref, computed } from 'vue'
import type { Address, CreditForm } from './types'

const EMPTY_ADDR = (): Address => ({ address: '', city: '', state: '', zip: '' })

export function useCreditForm() {
    const form = ref<CreditForm>({
        // Business
        firmName: '',
        dbaName: '',
        phone: '',
        fax: '',
        email: '',
        address: '',
        city: '',
        state: '',
        zip: '',
        county: '',
        mailingDifferent: false,
        mailing: EMPTY_ADDR(),
        entityType: 'Corporation',
        primaryBusiness: '',
        stateOfIncorp: '',
        yearsInBusiness: '',
        contacts: [
            { role: 'main', name: '', title: '', email: '' },
            { role: 'accounting', name: '', title: '', email: '' },
            { role: 'additional', name: '', title: '', email: '' },
        ],

        // Branching
        requestLineOfCredit: true,
        requestTaxExempt: false,

        // Credit app
        creditAmount: null,
        poRequired: false,
        owners: [{ name: '', title: '', ssn: '', homeAddress: EMPTY_ADDR() }],
        bank: {
            name: '',
            accountNo: '',
            phone: '',
            fax: '',
            email: '',
            address: EMPTY_ADDR(),
        },
        tradeRefs: [
            { name: '', accountNo: '', phone: '', fax: '', email: '', address: EMPTY_ADDR() },
            { name: '', accountNo: '', phone: '', fax: '', email: '', address: EMPTY_ADDR() },
            { name: '', accountNo: '', phone: '', fax: '', email: '', address: EMPTY_ADDR() },
        ],

        // Tax exemption
        isResale: false,
        exemptStates: [],
        resaleNumbers: {},
        resaleCertificate: {
            productDescription: '',
            otherExemption: '',
            effectiveDate: { day: 1, month: 1, year: new Date().getFullYear() },
            purchaserName: '',
            purchaserAddress: '',
            purchaserCityStateZip: '',
            signatureName: '',
            signatureTitle: '',
            signatureDate: '',
        },
        nySt120: {
            purchaserName: '',
            purchaserAddress: '',
            nyRegistration: '',
            vendorName: '',
            signerName: '',
            signerTitle: '',
            signerDate: '',
        },

        // Signing
        signers: [{ name: '', title: '', agree: false, date: '', signatureDataUrl: '' }],
    })

    const step = ref(1)
    const showResale = computed(() => !!form.value.isResale)
    const showNY = computed(() => showResale.value && form.value.exemptStates.includes('NY'))

    function next() {
        step.value++
    }

    function back() {
        step.value--
    }

    return { form, step, showResale, showNY, next, back }
}
