import { ref } from 'vue'
import type { Address, CreditForm } from './types'

const EMPTY_ADDR = (): Address => ({ address: '', city: '', state: '', zip: '', country: '' })

export function useCreditForm() {
    const form = ref<CreditForm>({
        // Business
        companyName: '',
        dbaName: '',
        phone: '',
        fax: '',
        email: '',
        ein: '',
        address: '',
        city: '',
        state: '',
        zip: '',
        country: '',
        poRequired: false,
        mailingDifferent: false,
        mailing: EMPTY_ADDR(),
        entityType: 'Corporation',
        primaryBusiness: '',
        customerNumber: '',
        stateOfIncorp: '',
        yearsInBusiness: '',
        contacts: [
            { role: 'main', name: '', title: '', email: '' },
        ],
        invoiceEmail: '',
        statementEmail: '',
        AcknowledgementEmail: '',
        // Branching
        requestLineOfCredit: true,
        requestTaxExempt: true,

        // Credit app
        creditAmount: null,
        creditDisclosureAck: false,
        owners: [{ name: '', title: '', ssn: '', phone: '', email: '', homeAddress: EMPTY_ADDR() }],
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
        exemptStates: [],
        resaleNumbers: {},
        resaleCertificate: {
            resale: false,
            incorporating: false,
            productDescription: '',
            otherExemption: '',
            effectiveDate: { day: 1, month: 1, year: new Date().getFullYear() },
            purchaserName: '',
            purchaserAddress: '',
            purchaserCity: '',
            purchaserState: '',
            purchaserZip: '',
            purchaserCountry: '',
            signatureName: '',
            signatureTitle: '',
            signatureDate: '',
        },
        nySt120: {
            purchaserName: '',
            purchaserAddress: '',
            purchaserCountry: '',
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
    function next() {
        step.value++
    }

    function back() {
        step.value--
    }

    return { form, step, next, back }
}
