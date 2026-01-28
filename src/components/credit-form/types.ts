export type Address = {
    address: string
    city: string
    state: string
    zip: string
    country?: string
}


export type Contact = {
    role: string
    name: string
    title: string
    email: string
}

export type Owner = {
    name: string
    title: string
    ssn: string
    fullTime?: boolean
    homeAddress?: Address
    phone?: string
    email?: string
}

export type TradeRef = {
    name: string
    accountNo?: string
    phone?: string
    fax?: string
    email?: string
    address?: Address
}

export type Bank = {
    name: string
    accountNo: string
    phone?: string
    fax?: string
    email?: string
    address: Address
}

export type NYSt120 = {
    purchaserName: string
    purchaserAddress: string
    purchaserCountry?: string
    nyRegistration: string
    vendorName: string
    signerName?: string
    signerTitle?: string
    signerDate?: string
}

export type ResaleCertificate = {
    productDescription?: string
    otherExemption?: string
    effectiveDate?: { day: number; month: number; year: number }
    purchaserName?: string
    purchaserAddress?: string
    purchaserCity?: string
    purchaserState?: string
    purchaserZip?: string
    purchaserCountry?: string
    signatureName?: string
    signatureTitle?: string
    signatureDate?: string
    resale?: boolean
    incorporating?: boolean
    customerNumber?: number | null
}

export type Signer = {
    name: string
    title: string
    agree: boolean
    date?: string
    signatureDataUrl?: string
}

type Plant = {
    Name: string,
    Logo: string
}

export type CreditForm = {
    companyName: string
    dbaName?: string
    phone: string
    fax?: string
    email: string
    ein: string
    address: string
    city: string
    state: string
    zip: string
    country?: string
    poRequired: boolean
    mailingDifferent?: boolean
    mailing?: Address
    entityType: 'Proprietorship' | 'Partnership' | 'Corporation' | 'LLC'
    primaryBusiness?: string
    customerNumber?: string
    stateOfIncorp?: string
    yearsInBusiness?: string
    contacts: Contact[]
    invoiceEmail?: string
    statementEmail?: string
    AcknowledgementEmail?: string
    isDocusignProduction?: boolean
    Plant?: Plant
    // branching
    requestLineOfCredit: boolean
    requestTaxExempt: boolean

    // credit app sections
    creditAmount?: number | null
    creditDisclosureAck?: boolean
    owners: Owner[]
    bank?: Bank
    tradeRefs: TradeRef[]   // expect 3

    // tax exemption
    exemptStates: string[]
    resaleNumbers: Record<string, string>
    resaleCertificate?: ResaleCertificate
    nySt120: NYSt120

    // signing
    csaName?: string
    csaEmail?: string
    customerFinanceEmail?: string
    customerFinanceName?: string
    signers: Signer[]
}
