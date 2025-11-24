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
const etag = ref<string | null>(null)

const API_BASE = import.meta.env.VITE_BE_ENDPOINT ?? 'https://localhost:7009'
const guid = computed(() => route.params.guid as string | undefined)

type BusinessMailingDto = {
  Address: string
  City: string
  State: string
  Zip: string
  Country?: string
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
}

type CreditApplicationDto = {
  ETag?: string | null
  Business?: BusinessSection
  Contacts?: Contact[]
  Mailing?: Address
  Owners?: Owner[]
  Bank?: Bank
  TradeRefs?: TradeRef[]
  ResaleCertificate?: ResaleCertificate
  NySt120?: CreditForm['nySt120']
  Signers?: Signer[]
  RequestLineOfCredit?: boolean
  RequestTaxExempt?: boolean
  CreditAmount?: number | null
} & Partial<CreditForm>

const entityTypeOptions: CreditForm['entityType'][] = ['Proprietorship', 'Partnership', 'Corporation', 'LLC']
const sanitize = (value?: string | null) => value ?? ''
const emptyAddress = (): Address => ({ address: '', city: '', state: '', zip: '', country: '' })
const cloneCreditForm = (src: CreditForm): CreditForm => JSON.parse(JSON.stringify(src)) as CreditForm

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
  }

  if (src.mailingDifferent && src.mailing) {
    payload.Mailing = mapMailing(src.mailing)
  }

  return payload
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

  await stepper.nextValidated?.()
}

function onBack() {
  stepperRef.value?.back()
}

async function fetchApplication() {
  if (!guid.value) return
  loading.value = true
  error.value = null
  try {
    const response = await axios.get<CreditApplicationDto>(`${API_BASE}/api/apps/${guid.value}`)
    console.log(response, 'Data')
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

function applyRemoteForm(payload: CreditApplicationDto | undefined) {
  if (!payload) return
  const safe = JSON.parse(JSON.stringify(payload)) as CreditApplicationDto
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

  if (safe.Business) mapBusinessToForm(safe.Business, nextForm)

  if (Array.isArray(safe.Contacts) && safe.Contacts.length)
    nextForm.contacts = safe.Contacts.map(contact => ({ ...contact }))

  if (Array.isArray(safe.Owners) && safe.Owners.length)
    nextForm.owners = safe.Owners.map(owner => ({ ...owner }))

  if (Array.isArray(safe.TradeRefs) && safe.TradeRefs.length)
    nextForm.tradeRefs = safe.TradeRefs.map(ref => ({ ...ref }))

  if (Array.isArray(safe.Signers) && safe.Signers.length)
    nextForm.signers = safe.Signers.map(signer => ({ ...signer }))

  if (safe.Bank) nextForm.bank = { ...safe.Bank }

  if (safe.ResaleCertificate) nextForm.resaleCertificate = { ...safe.ResaleCertificate }

  if (safe.NySt120) nextForm.nySt120 = { ...safe.NySt120 }

  form.value = nextForm
}

function resetInviteState() {
  loading.value = false
  error.value = null
  savingBusiness.value = false
  etag.value = null
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
    const response = await axios.patch(
      `${API_BASE}/api/apps/${guid.value}/business`,
      payload,
      { headers: { 'If-Match': ifMatch } }
    )
    const nextEtag = readEtag(response.headers)
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

watch(
  () => guid.value,
  (newGuid) => {
    resetInviteState()
    if (newGuid) void fetchApplication()
  },
  { immediate: true }
)

</script>

<template>
  <q-page class="q-pa-md bg-grey-1">
    <div class="max-w-screen-xl q-mx-auto">
      <!-- <q-banner v-if="hasInvite" class="bg-primary text-white q-mb-md" rounded>
        <div>
          <div class="text-subtitle2 text-weight-bold">Invite Link Details</div>
          <div>Plant: <span class="text-weight-medium">{{ plant }}</span></div>
          <div>Application ID: <span class="text-weight-medium">{{ guid }}</span></div>
        </div>
        <template #action>
          <q-btn flat color="white" label="Reload" @click="fetchApplication" :loading="loading" />
        </template>
</q-banner> -->

      <!-- <q-banner v-if="error" class="bg-negative text-white q-mb-md" rounded>
        <div>{{ error }}</div>
        <template #action>
          <q-btn flat color="white" label="Retry" @click="fetchApplication" />
        </template>
      </q-banner> -->

      <q-card flat bordered class="q-mb-md" v-if="loading">
        <q-card-section class="row items-center q-gutter-sm">
          <q-spinner color="primary" size="24px" />
          <div class="text-body1">Loading application...</div>
        </q-card-section>
      </q-card>

      <div class="row q-col-gutter-md" :class="{ 'opacity-50 pointer-events-none': loading }">
        <div class="col-12 col-md-9">
          <CreditAppStepper ref="stepperRef" v-model="form" />
        </div>
        <div class="col-12 col-md-3">
          <CommandConsole v-model="form" @next="onNext" @back="onBack" :next-busy="savingBusiness" />
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
