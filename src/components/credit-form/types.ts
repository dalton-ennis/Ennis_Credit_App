export type Address = {
    address: string
    city: string
    state: string
    zip: string
    county?: string
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
    purchaserCityStateZip?: string
    signatureName?: string
    signatureTitle?: string
    signatureDate?: string
}

export type Signer = {
    name: string
    title: string
    agree: boolean
    date?: string
    signatureDataUrl?: string
}

export type CreditForm = {
    // business
    companyName: string
    dbaName?: string
    phone: string
    fax?: string
    email: string
    address: string
    city: string
    state: string
    zip: string
    county?: string
    mailingDifferent?: boolean
    mailing?: Address
    entityType: 'Proprietorship' | 'Partnership' | 'Corporation' | 'Branch'
    primaryBusiness?: string
    stateOfIncorp?: string
    yearsInBusiness?: string
    contacts: Contact[]

    // branching
    requestLineOfCredit: boolean
    requestTaxExempt: boolean

    // credit app sections
    creditAmount?: number | null
    poRequired?: boolean
    owners: Owner[]
    bank?: Bank
    tradeRefs: TradeRef[]   // expect 3

    // tax exemption
    isResale?: boolean
    exemptStates: string[]
    resaleNumbers: Record<string, string>
    resaleCertificate?: ResaleCertificate
    nySt120: NYSt120

    // signing
    signers: Signer[]
}
