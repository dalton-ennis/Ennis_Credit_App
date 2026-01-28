<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import axios, { type AxiosHeaders } from 'axios'
import { useQuasar } from 'quasar'
import CreditAppStepper from 'src/components/credit-form/CreditAppStepper.vue'
import CommandConsole from 'src/components/credit-form/CommandConsole.vue'
import { useCreditForm } from 'src/components/credit-form/useCreditForm'
import type {
  CreditForm,
  Address,
  Contact,
  Owner,
  TradeRef,
  Bank,
  ResaleCertificate,
  Signer,
} from 'src/components/credit-form/types'
import { useWizardStore } from 'src/stores/wizard'

type StepperInstance = InstanceType<typeof CreditAppStepper> & {
  validateCurrentStep?: () => Promise<boolean>
  nextValidated?: () => Promise<boolean>
  next?: () => void
}

const route = useRoute()
const $q = useQuasar()
const wizard = useWizardStore()
const { form } = useCreditForm()
const stepperRef = ref<StepperInstance | null>(null)
const loading = ref(false)
const error = ref<string | null>(null)
const savingBusiness = ref(false)
const savingCredit = ref(false)
const savingTax = ref(false)
const etag = ref<string | null>(null)
const completed = ref(false)
const completedStatus = ref('')

const API_BASE = import.meta.env.VITE_BE_ENDPOINT ?? 'https://localhost:7009'
const guid = computed(() => route.params.guid as string | undefined)

type BusinessMailingDto = {
  Address: string
  City: string
  State: string
  Zip: string
  Country?: string
}

type CreditAddressDto = {
  Address: string
  City: string
  State: string
  Zip: string
  Country?: string
}

type CreditOwnerDto = {
  Name: string
  Title: string
  Phone?: string
  Email?: string
  HomeAddress: CreditAddressDto
}

type CreditTradeRefDto = {
  Name: string
  AccountNo?: string
  Phone?: string
  Fax?: string
  Email?: string
  Address: CreditAddressDto
}

type CreditBankDto = {
  Name?: string
  AccountNo?: string
  Phone?: string
  Fax?: string
  Email?: string
  Address: CreditAddressDto
}

type CreditSectionDto = {
  CreditAmount?: number | null
  CreditDisclosureAck?: boolean
  Owners: CreditOwnerDto[]
  TradeRefs: CreditTradeRefDto[]
  Bank: CreditBankDto
}

type ExemptStateDto = {
  State: string
  ResaleNumber?: string | null
}

type DateDto = {
  Day?: number
  Month?: number
  Year?: number
}

type ResaleCertificateDto = {
  Resale?: boolean
  Incorporating?: boolean
  ProductDescription?: string
  OtherExemption?: string
  EffectiveDate?: DateDto | null
  PurchaserName?: string
  PurchaserAddress?: string
  PurchaserCity?: string
  PurchaserState?: string
  PurchaserZip?: string
  PurchaserCountry?: string
  SignatureName?: string
  SignatureTitle?: string
  SignatureDate?: string
  CustomerNumber?: number | null
}

type NySt120Dto = {
  PurchaserName?: string
  PurchaserAddress?: string
  PurchaserCountry?: string
  NyRegistration?: string
  VendorName?: string
  SignerName?: string
  SignerTitle?: string
  SignerDate?: string
}

type TaxExemptionDto = {
  ExemptStates?: ExemptStateDto[]
  ResaleCertificate?: ResaleCertificateDto
  NySt120?: NySt120Dto
}

type BusinessDto = {
  CompanyName: string
  DbaName?: string
  Phone?: string
  Fax?: string
  Email?: string
  EIN?: string
  Address: string
  City: string
  State: string
  Zip: string
  Country?: string
  MailingDifferent: boolean
  Mailing?: BusinessMailingDto
  EntityType: string
  PrimaryBusiness?: string
  CustomerNumber?: string
  StateOfIncorp?: string
  YearsInBusiness?: string
  InvoiceEmail?: string
  StatementEmail?: string
  AcknowledgementEmail?: string
  Contacts?: Contact[]
  PoRequired?: boolean
}

type BusinessSection = {
  CompanyName?: string
  DbaName?: string
  Phone?: string
  Fax?: string
  Email?: string
  EIN?: string
  Address?: string
  City?: string
  State?: string
  Zip?: string
  Country?: string
  MailingDifferent?: boolean
  Mailing?: BusinessMailingDto
  EntityType?: string
  PrimaryBusiness?: string
  CustomerNumber?: string
  StateOfIncorp?: string
  YearsInBusiness?: string
  InvoiceEmail?: string
  StatementEmail?: string
  AcknowledgementEmail?: string
  Contacts?: Contact[]
  contacts?: Contact[]
  PoRequired: boolean
}

type Plant = {
  Name: string,
  Logo: string
}

type CreditApplicationDto = {
  ETag?: string | null
  Status?: string
  Business?: BusinessSection
  Contacts?: Contact[]
  Mailing?: Address
  Owners?: Owner[]
  Bank?: Bank
  TradeRefs?: TradeRef[]
  ResaleCertificate?: ResaleCertificate
  NySt120?: CreditForm['nySt120']
  TaxExemption?: TaxExemptionDto
  Signers?: Signer[]
  RequestLineOfCredit?: boolean
  RequestTaxExempt?: boolean
  CreditAmount?: number | null
  CreditDisclosureAck?: boolean
  Plant?: Plant
  CsaName?: string
  CsaEmail?: string
  CustomerFinanceEmail?: string
  CustomerFinanceName?: string
} & Partial<CreditForm>

const entityTypeOptions: CreditForm['entityType'][] = ['Proprietorship', 'Partnership', 'Corporation', 'LLC']
const sanitize = (value?: string | null) => value ?? ''
const emptyAddress = (): Address => ({ address: '', city: '', state: '', zip: '', country: '' })
const cloneCreditForm = (src: CreditForm): CreditForm => JSON.parse(JSON.stringify(src)) as CreditForm
const normalizeAddress = (input?: Partial<Address> & Record<string, unknown>): Address => {
  const source = input ?? {}
  const read = (key: string) => {
    const camel = (source as Record<string, unknown>)[key]
    if (typeof camel === 'string') return camel
    const pascalKey = key.charAt(0).toUpperCase() + key.slice(1)
    const pascal = (source as Record<string, unknown>)[pascalKey]
    return typeof pascal === 'string' ? pascal : ''
  }
  return {
    address: sanitize(read('address')),
    city: sanitize(read('city')),
    state: sanitize(read('state')),
    zip: sanitize(read('zip')),
    country: sanitize(read('country')),
  }
}
const toCreditAddressDto = (addr?: Address): CreditAddressDto => ({
  Address: sanitize(addr?.address),
  City: sanitize(addr?.city),
  State: sanitize(addr?.state),
  Zip: sanitize(addr?.zip),
  Country: sanitize(addr?.country),
})
const toCreditOwnerDto = (owner: Owner): CreditOwnerDto => ({
  Name: sanitize(owner.name),
  Title: sanitize(owner.title),
  Phone: sanitize(owner.phone),
  Email: sanitize(owner.email),
  HomeAddress: toCreditAddressDto(owner.homeAddress ?? emptyAddress()),
})
const toCreditTradeDto = (trade: TradeRef): CreditTradeRefDto => ({
  Name: sanitize(trade.name),
  AccountNo: sanitize(trade.accountNo),
  Phone: sanitize(trade.phone),
  Fax: sanitize(trade.fax),
  Email: sanitize(trade.email),
  Address: toCreditAddressDto(trade.address ?? emptyAddress()),
})
const toCreditBankDto = (bank?: Bank): CreditBankDto => ({
  Name: sanitize(bank?.name),
  AccountNo: sanitize(bank?.accountNo),
  Phone: sanitize(bank?.phone),
  Fax: sanitize(bank?.fax),
  Email: sanitize(bank?.email),
  Address: toCreditAddressDto(bank?.address ?? emptyAddress()),
})
const readStringField = (source: Record<string, unknown>, key: string, fallback = '') => {
  const camel = source[key]
  if (typeof camel === 'string') return camel
  const pascalKey = key.charAt(0).toUpperCase() + key.slice(1)
  const pascal = source[pascalKey]
  return typeof pascal === 'string' ? pascal : fallback
}

const readBooleanField = (source: Record<string, unknown>, key: string): boolean | undefined => {
  const camel = source[key]
  if (typeof camel === 'boolean') return camel
  const pascalKey = key.charAt(0).toUpperCase() + key.slice(1)
  const pascal = source[pascalKey]
  if (typeof pascal === 'boolean') return pascal
  return undefined
}

const toNumeric = (value: unknown): number | null => {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (!trimmed) return null
    const parsed = Number(trimmed)
    return Number.isFinite(parsed) ? parsed : null
  }
  return null
}

const readAddressObject = (source: Record<string, unknown>) => {
  const camel = source['address']
  if (camel && typeof camel === 'object') return camel as Record<string, unknown>
  const pascal = source['Address']
  if (pascal && typeof pascal === 'object') return pascal as Record<string, unknown>
  return undefined
}
const normalizeOwnerDto = (owner: Record<string, unknown>): Owner => {
  const addressSource =
    (owner['homeAddress'] as Record<string, unknown>) ??
    (owner['HomeAddress'] as Record<string, unknown>) ??
    readAddressObject(owner)
  return {
    name: sanitize(readStringField(owner, 'name')),
    title: sanitize(readStringField(owner, 'title')),
    ssn: sanitize(readStringField(owner, 'ssn')),
    phone: sanitize(readStringField(owner, 'phone')),
    email: sanitize(readStringField(owner, 'email')),
    homeAddress: normalizeAddress(addressSource),
  }
}
const normalizeTradeRefDto = (trade: Record<string, unknown>): TradeRef => {
  const addressSource =
    (trade['address'] as Record<string, unknown>) ??
    (trade['Address'] as Record<string, unknown>) ??
    readAddressObject(trade)
  return {
    name: sanitize(readStringField(trade, 'name')),
    accountNo: sanitize(readStringField(trade, 'accountNo')),
    phone: sanitize(readStringField(trade, 'phone')),
    fax: sanitize(readStringField(trade, 'fax')),
    email: sanitize(readStringField(trade, 'email')),
    address: normalizeAddress(addressSource),
  }
}
const normalizeBankDto = (bank: Record<string, unknown>): Bank => {
  const addressSource =
    (bank['address'] as Record<string, unknown>) ??
    (bank['Address'] as Record<string, unknown>) ??
    readAddressObject(bank)
  return {
    name: sanitize(readStringField(bank, 'name')),
    accountNo: sanitize(readStringField(bank, 'accountNo')),
    phone: sanitize(readStringField(bank, 'phone')),
    fax: sanitize(readStringField(bank, 'fax')),
    email: sanitize(readStringField(bank, 'email')),
    address: normalizeAddress(addressSource),
  }
}

function mapMailing(addr?: CreditForm['mailing']): BusinessMailingDto {
  return {
    Address: sanitize(addr?.address),
    City: sanitize(addr?.city),
    State: sanitize(addr?.state),
    Zip: sanitize(addr?.zip),
    Country: sanitize(addr?.country),
  }
}

function toBusinessDto(src: CreditForm): BusinessDto {
  const payload: BusinessDto = {
    CompanyName: sanitize(src.companyName),
    DbaName: sanitize(src.dbaName),
    Phone: sanitize(src.phone),
    Fax: sanitize(src.fax),
    Email: sanitize(src.email),
    EIN: sanitize(src.ein),
    Address: sanitize(src.address),
    City: sanitize(src.city),
    State: sanitize(src.state),
    Zip: sanitize(src.zip),
    Country: sanitize(src.country),
    MailingDifferent: !!src.mailingDifferent,
    EntityType: sanitize(src.entityType),
    PrimaryBusiness: sanitize(src.primaryBusiness),
    CustomerNumber: sanitize(src.customerNumber),
    StateOfIncorp: sanitize(src.stateOfIncorp),
    YearsInBusiness: sanitize(src.yearsInBusiness),
    InvoiceEmail: sanitize(src.invoiceEmail),
    StatementEmail: sanitize(src.statementEmail),
    AcknowledgementEmail: sanitize(src.AcknowledgementEmail),
    PoRequired: !!src.poRequired
  }

  if (src.mailingDifferent && src.mailing) {
    payload.Mailing = mapMailing(src.mailing)
  }

  if (Array.isArray(src.contacts) && src.contacts.length) {
    payload.Contacts = src.contacts.map(contact => ({
      role: contact.role,
      name: sanitize(contact.name),
      title: sanitize(contact.title),
      email: sanitize(contact.email),
    }))
  }

  return payload
}

function toCreditDto(src: CreditForm): CreditSectionDto {
  const owners = Array.isArray(src.owners) && src.owners.length ? src.owners : []
  const tradeRefs = Array.isArray(src.tradeRefs) && src.tradeRefs.length ? src.tradeRefs : []
  return {
    CreditAmount: src.creditAmount ?? null,
    CreditDisclosureAck: !!src.creditDisclosureAck,
    Owners: owners.map(toCreditOwnerDto),
    TradeRefs: tradeRefs.map(toCreditTradeDto),
    Bank: toCreditBankDto(src.bank),
  }
}

function toTaxDto(src: CreditForm): TaxExemptionDto {
  const exemptStates = Array.isArray(src.exemptStates) ? src.exemptStates : []
  const exemptPayload: ExemptStateDto[] = exemptStates
    .map(state => ({
      State: sanitize(state).toUpperCase(),
      ResaleNumber: sanitize(src.resaleNumbers?.[state]),
    }))
    .filter(entry => !!entry.State)
  const rc = src.resaleCertificate ?? {}
  const ny = src.nySt120 ?? {}
  const numericCustomer = toNumeric(
    rc.customerNumber ?? src.customerNumber ?? null
  )
  return {
    ExemptStates: exemptPayload,
    ResaleCertificate: {
      Resale: !!rc.resale,
      Incorporating: !!rc.incorporating,
      ProductDescription: sanitize(rc.productDescription),
      OtherExemption: sanitize(rc.otherExemption),
      PurchaserName: sanitize(rc.purchaserName),
      PurchaserAddress: sanitize(rc.purchaserAddress),
      PurchaserCity: sanitize(rc.purchaserCity),
      PurchaserState: sanitize(rc.purchaserState),
      PurchaserZip: sanitize(rc.purchaserZip),
      PurchaserCountry: sanitize(rc.purchaserCountry),
      SignatureName: sanitize(rc.signatureName),
      SignatureTitle: sanitize(rc.signatureTitle),
      CustomerNumber: numericCustomer,
    },
    NySt120: {
      PurchaserName: sanitize(ny.purchaserName),
      PurchaserAddress: sanitize(ny.purchaserAddress),
      PurchaserCountry: sanitize(ny.purchaserCountry),
      NyRegistration: sanitize(ny.nyRegistration),
      VendorName: sanitize(ny.vendorName),
      SignerName: sanitize(ny.signerName),
      SignerTitle: sanitize(ny.signerTitle),
      SignerDate: sanitize(ny.signerDate),
    },
  }
}

const headerValueToString = (value: unknown): string | null => {
  if (value == null) return null

  if (Array.isArray(value)) {
    for (const entry of value) {
      const converted = headerValueToString(entry)
      if (converted) return converted
    }
    return null
  }

  if (typeof value === 'string') return value
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  return null
}

const ensureQuotedEtag = (value: string | null | undefined): string | null => {
  if (!value) return null
  const trimmed = value.trim()
  if (!trimmed) return null
  const hasQuotes = trimmed.startsWith('"') && trimmed.endsWith('"')
  return hasQuotes ? trimmed : `"${trimmed}"`
}

const isAxiosHeaders = (headers: unknown): headers is AxiosHeaders =>
  !!headers && typeof (headers as AxiosHeaders).get === 'function'

function readEtag(headers: unknown): string | null {
  if (!headers) return null
  let raw: unknown = null
  if (isAxiosHeaders(headers)) {
    raw = headers.get('etag') ?? headers.get('ETag') ?? headers.get('ETAG')
  } else if (typeof headers === 'object') {
    const bag = headers as Record<string, unknown>
    raw = bag['etag'] ?? bag['ETag'] ?? bag['ETAG']
  } else if (typeof headers === 'string') {
    raw = headers
  }
  return ensureQuotedEtag(headerValueToString(raw))
}

async function onNext() {
  const stepper = stepperRef.value
  if (!stepper) return

  if (wizard.current === 'business') {
    if (savingBusiness.value) return
    const valid = (await stepper.validateCurrentStep?.()) ?? true
    if (!valid) return
    const saved = await saveBusinessStep()
    if (!saved) return
    stepper.next?.()
    return
  }

  if (wizard.current === 'credit') {
    if (savingCredit.value) return
    const valid = (await stepper.validateCurrentStep?.()) ?? true
    if (!valid) return
    const saved = await saveCreditStep()
    if (!saved) return
    stepper.next?.()
    return
  }

  if (wizard.current === 'tax') {
    if (savingTax.value) return
    const valid = (await stepper.validateCurrentStep?.()) ?? true
    if (!valid) return
    const saved = await saveTaxStep()
    if (!saved) return
    stepper.next?.()
    return
  }

  await stepper.nextValidated?.()
}

function onBack() {
  stepperRef.value?.back()
}

async function fetchApplication() {
  if (!guid.value) return
  loading.value = true
  error.value = null
  console.log(guid.value)
  try {
    const response = await axios.get<CreditApplicationDto>(`${API_BASE}/api/apps/${guid.value}`)

    const statusValue = readStringField(response.data as Record<string, unknown>, 'status')
    const normalizedStatus = statusValue.trim().toLowerCase()
    completedStatus.value = statusValue
    completed.value = normalizedStatus === 'signed'
    if (completed.value) {
      return
    }

    applyRemoteForm(response.data)
    const headerTag = readEtag(response.headers)
    const bodyTag = ensureQuotedEtag(response.data.ETag)
    etag.value = headerTag ?? bodyTag ?? null
    $q.notify({ type: 'positive', message: 'Application loaded from server.' })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unable to load application.'
    error.value = msg
    $q.notify({ type: 'negative', message: msg })
  } finally {
    loading.value = false
  }
}

function mapBusinessToForm(payload: BusinessSection, target: CreditForm) {
  const safeMailing: Partial<BusinessMailingDto> = payload.Mailing ?? {}

  target.companyName = sanitize(payload.CompanyName)
  target.dbaName = sanitize(payload.DbaName)
  target.phone = sanitize(payload.Phone)
  target.fax = sanitize(payload.Fax)
  target.email = sanitize(payload.Email)
  target.ein = sanitize(payload.EIN)
  target.address = sanitize(payload.Address)
  target.city = sanitize(payload.City)
  target.state = sanitize(payload.State)
  target.zip = sanitize(payload.Zip)
  target.country = sanitize(payload.Country)
  target.mailingDifferent = payload.MailingDifferent ?? false
  const normalizedEntity = payload.EntityType as CreditForm['entityType'] | undefined
  if (normalizedEntity && entityTypeOptions.includes(normalizedEntity)) {
    target.entityType = normalizedEntity
  }
  target.primaryBusiness = sanitize(payload.PrimaryBusiness)
  target.customerNumber = sanitize(payload.CustomerNumber)
  target.stateOfIncorp = sanitize(payload.StateOfIncorp)
  target.yearsInBusiness = sanitize(payload.YearsInBusiness)
  target.invoiceEmail = sanitize(payload.InvoiceEmail)
  target.statementEmail = sanitize(payload.StatementEmail)
  target.AcknowledgementEmail = sanitize(payload.AcknowledgementEmail)
  target.poRequired = payload.PoRequired ?? false

  const payloadContacts = payload.Contacts ?? payload.contacts
  if (Array.isArray(payloadContacts) && payloadContacts.length) {
    const normalized = payloadContacts.map(contact => {
      const source = contact as Contact | Record<string, unknown>
      const readField = (camel: keyof Contact, alt?: string) => {
        const camelValue = (source as Contact)[camel] as unknown
        if (typeof camelValue === 'string') return sanitize(camelValue)
        const camelKey = camel as string
        const altKey = alt ?? `${camelKey.charAt(0).toUpperCase()}${camelKey.slice(1)}`
        const altValue = (source as Record<string, unknown>)[altKey]
        return typeof altValue === 'string' ? sanitize(altValue) : ''
      }
      return {
        role: readField('role', 'Role') || 'additional',
        name: readField('name', 'Name'),
        title: readField('title', 'Title'),
        email: readField('email', 'Email'),
      }
    })
    if (!normalized.some(c => c.role === 'main')) {
      normalized[0]!.role = 'main'
    }
    target.contacts = normalized
  }

  if (target.mailingDifferent) {
    target.mailing = target.mailing ?? emptyAddress()
    target.mailing.address = sanitize(safeMailing.Address)
    target.mailing.city = sanitize(safeMailing.City)
    target.mailing.state = sanitize(safeMailing.State)
    target.mailing.zip = sanitize(safeMailing.Zip)
    target.mailing.country = sanitize(safeMailing.Country)
  } else {
    delete target.mailing
  }
}

function mapTaxToForm(payload: TaxExemptionDto, target: CreditForm) {
  const rawStatesInput = payload.ExemptStates ?? (payload as Record<string, unknown>).exemptStates
  const rawStates = Array.isArray(rawStatesInput) ? rawStatesInput : []
  const states: string[] = []
  const resaleNumbers: Record<string, string> = {}
  for (const entry of rawStates) {
    if (!entry) continue
    const source = entry as Record<string, unknown>
    const code = sanitize(readStringField(source, 'state')).toUpperCase()
    if (!code) continue
    states.push(code)
    const num = sanitize(readStringField(source, 'resaleNumber'))
    if (num) resaleNumbers[code] = num
  }
  target.exemptStates = states
  target.resaleNumbers = resaleNumbers

  const rcSource =
    (payload.ResaleCertificate as Record<string, unknown> | undefined) ??
    (payload as Record<string, unknown>).resaleCertificate as Record<string, unknown> | undefined
  if (rcSource) {
    if (!target.resaleCertificate) {
      target.resaleCertificate = {
        resale: false,
        incorporating: false,
        productDescription: '',
        otherExemption: '',
        purchaserName: '',
        purchaserAddress: '',
        purchaserCity: '',
        purchaserState: '',
        purchaserZip: '',
        purchaserCountry: '',
        signatureName: '',
        signatureTitle: '',
        signatureDate: '',
      }
    }
    const rc = target.resaleCertificate
    if (!rc) return
    rc.resale = !!(rcSource['Resale'] ?? rcSource['resale'])
    rc.incorporating = !!(rcSource['Incorporating'] ?? rcSource['incorporating'])
    rc.productDescription = sanitize(readStringField(rcSource, 'productDescription'))
    rc.otherExemption = sanitize(readStringField(rcSource, 'otherExemption'))
    rc.purchaserName = sanitize(readStringField(rcSource, 'purchaserName'))
    rc.purchaserAddress = sanitize(readStringField(rcSource, 'purchaserAddress'))
    rc.purchaserCity = sanitize(readStringField(rcSource, 'purchaserCity'))
    rc.purchaserState = sanitize(readStringField(rcSource, 'purchaserState'))
    rc.purchaserZip = sanitize(readStringField(rcSource, 'purchaserZip'))
    rc.purchaserCountry = sanitize(readStringField(rcSource, 'purchaserCountry'))
    rc.signatureName = sanitize(readStringField(rcSource, 'signatureName'))
    rc.signatureTitle = sanitize(readStringField(rcSource, 'signatureTitle'))
    const rawCustomerNumber = rcSource['CustomerNumber'] ?? rcSource['customerNumber']
    const numericCustomer = toNumeric(rawCustomerNumber)
    rc.customerNumber = numericCustomer ?? null
    target.customerNumber = numericCustomer != null ? String(numericCustomer) : ''
  }

  const nySource =
    (payload.NySt120 as Record<string, unknown> | undefined) ??
    (payload as Record<string, unknown>).nySt120 as Record<string, unknown> | undefined
  if (nySource) {
    target.nySt120 = {
      purchaserName: sanitize(readStringField(nySource, 'purchaserName')),
      purchaserAddress: sanitize(readStringField(nySource, 'purchaserAddress')),
      purchaserCountry: sanitize(readStringField(nySource, 'purchaserCountry')),
      nyRegistration: sanitize(readStringField(nySource, 'nyRegistration')),
      vendorName: sanitize(readStringField(nySource, 'vendorName')),
      signerName: sanitize(readStringField(nySource, 'signerName')),
      signerTitle: sanitize(readStringField(nySource, 'signerTitle')),
      signerDate: sanitize(readStringField(nySource, 'signerDate')),
    }
  }
}
function normalizePlantDto(raw: Record<string, unknown>) {
  const name = raw.Name ?? raw.Name
  const logo = raw.Logo ?? raw.logo

  return {
    Name: typeof name === 'string' ? name : '',
    Logo: typeof logo === 'string' ? logo : '',
  }
}


function applyRemoteForm(payload: CreditApplicationDto | undefined) {
  if (!payload) return
  const safe = JSON.parse(JSON.stringify(payload)) as CreditApplicationDto
  const safeRecord = safe as Record<string, unknown>
  const nextForm = cloneCreditForm(form.value)

  if (safe.RequestLineOfCredit !== undefined)
    nextForm.requestLineOfCredit = !!safe.RequestLineOfCredit
  else if (safe.requestLineOfCredit !== undefined)
    nextForm.requestLineOfCredit = !!safe.requestLineOfCredit

  if (safe.RequestTaxExempt !== undefined)
    nextForm.requestTaxExempt = !!safe.RequestTaxExempt
  else if (safe.requestTaxExempt !== undefined)
    nextForm.requestTaxExempt = !!safe.requestTaxExempt

  if (safe.CreditAmount !== undefined) nextForm.creditAmount = safe.CreditAmount
  else if ((safe as CreditForm).creditAmount !== undefined) nextForm.creditAmount = (safe as CreditForm).creditAmount as number

  if (safe.CreditDisclosureAck !== undefined)
    nextForm.creditDisclosureAck = !!safe.CreditDisclosureAck
  else if ((safe as CreditForm).creditDisclosureAck !== undefined)
    nextForm.creditDisclosureAck = !!(safe as CreditForm).creditDisclosureAck

  if (safe.Business) mapBusinessToForm(safe.Business, nextForm)

  nextForm.csaName = sanitize(readStringField(safeRecord, 'csaName'))
  nextForm.csaEmail = sanitize(readStringField(safeRecord, 'csaEmail'))
  nextForm.customerFinanceEmail = sanitize(readStringField(safeRecord, 'customerFinanceEmail'))
  nextForm.customerFinanceName = sanitize(readStringField(safeRecord, 'customerFinanceName'))
  const docusignProduction = readBooleanField(safeRecord, 'isDocusignProduction')
  if (docusignProduction !== undefined) nextForm.isDocusignProduction = docusignProduction

  if (Array.isArray(safe.Contacts) && safe.Contacts.length)
    nextForm.contacts = safe.Contacts.map(contact => ({ ...contact }))

  if (Array.isArray(safe.Owners) && safe.Owners.length)
    nextForm.owners = safe.Owners.map(owner => normalizeOwnerDto(owner as Record<string, unknown>))

  if (Array.isArray(safe.TradeRefs) && safe.TradeRefs.length)
    nextForm.tradeRefs = safe.TradeRefs.map(ref => normalizeTradeRefDto(ref as Record<string, unknown>))

  if (Array.isArray(safe.Signers) && safe.Signers.length)
    nextForm.signers = safe.Signers.map(signer => ({ ...signer }))

  if (safe.Bank) nextForm.bank = normalizeBankDto(safe.Bank as Record<string, unknown>)

  const plantPayload =
    safe.Plant ??
    (safe as Record<string, unknown>).Plant


  if (plantPayload) {
    nextForm.Plant = normalizePlantDto(plantPayload as Record<string, unknown>)
    wizard.plantLogo = nextForm.Plant.Logo
    wizard.plantName = nextForm.Plant.Name
  }

  const taxPayload = safe.TaxExemption ?? (safe as Record<string, unknown>).taxExemption
  if (taxPayload) {
    mapTaxToForm(taxPayload as TaxExemptionDto, nextForm)
  } else {
    const fallbackTax: TaxExemptionDto = {}
    let hasFallback = false
    if (safe.ResaleCertificate) {
      fallbackTax.ResaleCertificate = safe.ResaleCertificate as unknown as ResaleCertificateDto
      hasFallback = true
    }
    if (safe.NySt120) {
      fallbackTax.NySt120 = safe.NySt120 as unknown as NySt120Dto
      hasFallback = true
    }
    if (hasFallback) mapTaxToForm(fallbackTax, nextForm)
  }

  form.value = nextForm
}

function resetInviteState() {
  loading.value = false
  error.value = null
  savingBusiness.value = false
  savingCredit.value = false
  savingTax.value = false
  etag.value = null
  completed.value = false
  completedStatus.value = ''
}

async function saveBusinessStep() {
  if (!guid.value) {
    $q.notify({ type: 'negative', message: 'Invite link is missing an application id.' })
    return false
  }
  const ifMatch = ensureQuotedEtag(etag.value)
  if (!ifMatch) {
    $q.notify({ type: 'negative', message: 'Missing ETag from server. Reload the application and try again.' })
    return false
  }

  savingBusiness.value = true
  try {
    const payload = toBusinessDto(form.value)
    const response = await axios.patch<{ ETag?: string }>(
      `${API_BASE}/api/apps/${guid.value}/business`,
      payload,
      { headers: { 'If-Match': ifMatch } }
    )
    let nextEtag = readEtag(response.headers)
    if (!nextEtag) nextEtag = ensureQuotedEtag(response.data?.ETag)
    if (nextEtag) etag.value = nextEtag
    $q.notify({ type: 'positive', message: 'Business information saved.' })
    return true
  } catch (err) {
    let message = 'Unable to save business information.'
    if (axios.isAxiosError(err)) {
      if (err.response?.status === 409) {
        message = 'This application was updated elsewhere. Reload and try again.'
      } else if (typeof err.response?.data === 'string') {
        message = err.response.data
      } else if (err.message) {
        message = err.message
      }
    } else if (err instanceof Error) {
      message = err.message
    }
    $q.notify({ type: 'negative', message })
    return false
  } finally {
    savingBusiness.value = false
  }
}

async function saveCreditStep() {
  if (!guid.value) {
    $q.notify({ type: 'negative', message: 'Invite link is missing an application id.' })
    return false
  }
  const ifMatch = ensureQuotedEtag(etag.value)
  if (!ifMatch) {
    $q.notify({ type: 'negative', message: 'Missing ETag from server. Reload the application and try again.' })
    return false
  }

  savingCredit.value = true
  try {
    const payload = toCreditDto(form.value)
    const response = await axios.patch<{ ETag?: string }>(
      `${API_BASE}/api/apps/${guid.value}/credit`,
      payload,
      { headers: { 'If-Match': ifMatch } }
    )
    let nextEtag = readEtag(response.headers)
    if (!nextEtag) nextEtag = ensureQuotedEtag(response.data?.ETag)
    if (nextEtag) etag.value = nextEtag
    $q.notify({ type: 'positive', message: 'Credit information saved.' })
    return true
  } catch (err) {
    let message = 'Unable to save credit information.'
    if (axios.isAxiosError(err)) {
      if (err.response?.status === 409) {
        message = 'This application was updated elsewhere. Reload and try again.'
      } else if (typeof err.response?.data === 'string') {
        message = err.response.data
      } else if (err.message) {
        message = err.message
      }
    } else if (err instanceof Error) {
      message = err.message
    }
    $q.notify({ type: 'negative', message })
    return false
  } finally {
    savingCredit.value = false
  }
}

async function saveTaxStep() {
  if (!guid.value) {
    $q.notify({ type: 'negative', message: 'Invite link is missing an application id.' })
    return false
  }
  const ifMatch = ensureQuotedEtag(etag.value)
  if (!ifMatch) {
    $q.notify({ type: 'negative', message: 'Missing ETag from server. Reload the application and try again.' })
    return false
  }

  savingTax.value = true
  try {
    const payload = toTaxDto(form.value)
    const response = await axios.patch<{ ETag?: string }>(
      `${API_BASE}/api/apps/${guid.value}/tax`,
      payload,
      { headers: { 'If-Match': ifMatch } }
    )
    let nextEtag = readEtag(response.headers)
    if (!nextEtag) nextEtag = ensureQuotedEtag(response.data?.ETag)
    if (nextEtag) etag.value = nextEtag
    $q.notify({ type: 'positive', message: 'Tax exemption information saved.' })
    return true
  } catch (err) {
    let message = 'Unable to save tax exemption information.'
    if (axios.isAxiosError(err)) {
      if (err.response?.status === 409) {
        message = 'This application was updated elsewhere. Reload and try again.'
      } else if (typeof err.response?.data === 'string') {
        message = err.response.data
      } else if (err.message) {
        message = err.message
      }
    } else if (err instanceof Error) {
      message = err.message
    }
    $q.notify({ type: 'negative', message })
    return false
  } finally {
    savingTax.value = false
  }
}

watch(
  () => guid.value,
  (newGuid) => {
    resetInviteState()
    if (newGuid) void fetchApplication()
  },
  { immediate: true }
)

watch(() => form.value.requestTaxExempt, async (val, prev) => {
  if (val === prev) return
  if (!guid.value) return
  const ifMatch = ensureQuotedEtag(etag.value)
  if (!ifMatch) return
  const payload = {
    requestLineOfCredit: form.value.requestLineOfCredit,
    requestTaxExempt: form.value.requestTaxExempt,
  }

  const res = await axios.patch(
    `${API_BASE}/api/apps/${guid.value}/requests`,
    payload,
    { headers: { "If-Match": ifMatch } }
  )

  etag.value = res.data.ETag
})

watch(() => form.value.requestLineOfCredit, async (val, prev) => {
  if (val === prev) return
  if (!guid.value) return
  const ifMatch = ensureQuotedEtag(etag.value)
  if (!ifMatch) return
  const payload = {
    requestLineOfCredit: form.value.requestLineOfCredit,
    requestTaxExempt: form.value.requestTaxExempt,
  }

  const res = await axios.patch(
    `${API_BASE}/api/apps/${guid.value}/requests`,
    payload,
    { headers: { "If-Match": ifMatch } }
  )

  etag.value = res.data.ETag
})
</script>

<template>
  <q-page class="q-pa-md bg-grey-1">
    <div class="max-w-screen-xl q-mx-auto">
      <q-card flat bordered class="q-mb-md" v-if="loading">
        <q-card-section class="row items-center q-gutter-sm">
          <q-spinner color="primary" size="24px" />
          <div class="text-body1">Loading application...</div>
        </q-card-section>
      </q-card>

      <q-card flat bordered class="q-pa-lg" v-if="!loading && completed">
        <div class="text-h5 text-weight-medium q-mb-sm">Application completed</div>
        <div class="text-body2 text-grey-7">
          We have received your signed application. Expect a response within 2-3 business days.
        </div>
        <div class="text-caption text-grey-6 q-mt-md" v-if="completedStatus">
          Status: {{ completedStatus }}
        </div>
      </q-card>

      <div v-else-if="!loading" class="row q-col-gutter-md" :class="{ 'opacity-50 pointer-events-none': loading }">
        <div class="col-12 col-md-9">
          <CreditAppStepper ref="stepperRef" v-model="form" :etag="etag" />
        </div>
        <div class="col-12 col-md-3">
          <CommandConsole v-model="form" @next="onNext" @back="onBack"
            :next-busy="savingBusiness || savingCredit || savingTax" />
        </div>
      </div>
    </div>
  </q-page>
</template>

<style scoped>
.max-w-screen-xl {
  max-width: 1500px;
}
</style>
