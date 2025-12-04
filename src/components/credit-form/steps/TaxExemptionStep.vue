<script setup lang="ts">
import { ref, watch, onMounted, computed } from 'vue'
import type { CreditForm } from '../types'
import { stateOptions, countryOptions, provinceOptions } from '../utilities'
import { dayRule, monthRule, required, yearRule, zipRule, canadianPostalRule } from 'src/utility/validators'
import type { QForm, ValidationRule } from 'quasar'
import { fieldUi } from '../utilities';

const props = defineProps<{ modelValue: CreditForm }>()
const emit = defineEmits(['update:modelValue', 'next', 'back'])

// Local editable form to avoid direct prop mutation
const local = ref<CreditForm>({ ...props.modelValue })

// Ensure nested objects exist
onMounted(() => {
  local.value.resaleCertificate ??= {}
  local.value.exemptStates ??= []
  local.value.resaleNumbers ??= {}
  local.value.nySt120 ??= { purchaserName: '', purchaserAddress: '', purchaserCountry: local.value.country || '', nyRegistration: '', vendorName: '', signerName: '', signerTitle: '', signerDate: '' }

  // Prefill some values from business info if empty
  const rc = local.value.resaleCertificate
  if (!rc.purchaserName) rc.purchaserName = local.value.companyName || ''
  if (!rc.purchaserAddress) rc.purchaserAddress = local.value.address || ''
  if (!rc.purchaserCity) rc.purchaserCity = local.value.city || ''
  if (!rc.purchaserState) rc.purchaserState = local.value.state || ''
  if (!rc.purchaserZip) rc.purchaserZip = local.value.zip || ''
  if (!rc.purchaserCountry) rc.purchaserCountry = local.value.country || ''
  if (!local.value.nySt120.purchaserCountry) local.value.nySt120.purchaserCountry = local.value.country || ''
})

// Keep parent in sync
watch(local, (val) => {
  emit('update:modelValue', JSON.parse(JSON.stringify(val)))
}, { deep: true })

const formRef = ref<QForm | null>(null)
const showingNY = computed(() => local.value.exemptStates?.includes('NY'))
const purchaserCountry = computed(() => local.value.resaleCertificate?.purchaserCountry || local.value.country || '')
const purchaserIsCA = computed(() => purchaserCountry.value === 'CA')
const purchaserRegionOptions = computed(() => purchaserIsCA.value ? provinceOptions : stateOptions)
const purchaserRegionLabel = computed(() => purchaserIsCA.value ? 'Province/Territory *' : 'State *')
const purchaserPostalLabel = computed(() => purchaserIsCA.value ? 'Postal Code *' : 'ZIP *')
const purchaserPostalRules = computed(() => purchaserIsCA.value ? [required, canadianPostalRule] : [required, zipRule])

watch(() => local.value.resaleCertificate?.purchaserCountry, () => {
  if (!local.value.resaleCertificate) return
  local.value.resaleCertificate.purchaserState = ''
  local.value.resaleCertificate.purchaserZip = ''
})


// States that require in‑state resale certificate numbers (no out‑of‑state)
const IN_STATE_ONLY = new Set(['CA', 'FL', 'HI', 'IL', 'LA', 'MD', 'MA', 'WA', 'DC'])

// Annotate special states in dropdown labels
const exemptOptions = computed(() => stateOptions.map(o => {
  if (o.value === 'NY') return { ...o, label: `${o.label} – ST-120 required` }
  if (IN_STATE_ONLY.has(o.value)) return { ...o, label: `${o.label} – State requires in state registration to be exempt` }
  return o
}))

// Cleanup resaleNumbers when states are removed
watch(() => local.value.exemptStates, (codes) => {
  const keep = new Set(codes || [])
  const nums = local.value.resaleNumbers || {}
  for (const k of Object.keys(nums)) {
    if (!keep.has(k)) delete nums[k]
  }
  local.value.resaleNumbers = { ...nums }
}, { deep: true })

const stateFormatValidators: Partial<Record<string, { pattern: RegExp; message: string }>> = {
  CA: { pattern: /^\d{3}-\d{6}$/, message: 'Format: NNN-NNNNNN' },
  DC: { pattern: /^\d{12}$/, message: 'Format: 12 digits' },
  FL: { pattern: /^\d{2}-\d{10}-\d$/, message: 'Format: NN-NNNNNNNNNN-N' },
  HI: { pattern: /^GE-\d{3}-\d{3}-\d{4}-\d{2}$/, message: 'Format: GE-NNN-NNN-NNNN-NN' },
  IL: { pattern: /^\d{4}-\d{4}$/, message: 'Format: NNNN-NNNN' },
  LA: { pattern: /^\d{7}-\d{3}-\d{3}$/, message: 'Format: NNNNNNN-NNN-NNN' },
  MD: { pattern: /^\d{8}$/, message: 'Format: 8 digits' },
  MA: { pattern: /^SLS-\d{8}-\d{3}$/, message: 'Format: SLS-NNNNNNNN-NNN' },
  NY: { pattern: /^\d{2}-\d{7}$/, message: 'Format: NN-NNNNNNN' },
  WA: { pattern: /^\d{3}-\d{3}-\d{3}$/, message: 'Format: NNN-NNN-NNN' },
}

const stateMaskMap: Partial<Record<string, string>> = {
  CA: '###-######',
  DC: '############',
  FL: '##-##########-#',
  HI: 'AA-###-###-####-##',
  IL: '####-####',
  LA: '#######-###-###',
  MD: '########',
  MA: 'AAA-########-###',
  NY: '##-#######',
  WA: '###-###-###',
}

const resaleMaskFor = (code: string) => stateMaskMap[code]

const normalizeValue = (val: unknown): string => {
  if (val == null) return ''

  // If it's already a string
  if (typeof val === 'string') {
    return val.trim()
  }

  // If it's a number, boolean, bigint, symbol → safe to stringify
  if (typeof val === 'number' || typeof val === 'boolean' || typeof val === 'bigint') {
    return String(val).trim()
  }

  // If it's a Date → convert to ISO or whatever format you want
  if (val instanceof Date) {
    return val.toISOString().trim()
  }

  // If it's an object or array → return empty (or throw)
  return ''
}


// Rule: require a number for in-state-only states (special formats handled)
const resaleNumberRule = (code: string): ValidationRule => (value: unknown) => {
  const trimmed = normalizeValue(value)
  const format = stateFormatValidators[code]

  if (code === 'NY') {
    if (!trimmed) return 'Required for NY'
    if (format && !format.pattern.test(trimmed)) return format.message
    return true
  }

  if (IN_STATE_ONLY.has(code) && !trimmed) {
    return 'Required for this state'
  }

  if (!trimmed) return true

  if (format) {
    return format.pattern.test(trimmed) ? true : format.message
  }

  return true
}

async function validate() { return await formRef.value?.validate() }
defineExpose({ validate })

function ensureDefaults() {
  const today = new Date()
  const todayMonth = today.getMonth() + 1 // Jan = 0
  const todayDay = today.getDate()
  const todayYear = today.getFullYear()

  // create container if missing
  if (!local.value.resaleCertificate) {
    local.value.resaleCertificate = {}
  }

  if (!local.value.resaleCertificate.effectiveDate) {
    local.value.resaleCertificate.effectiveDate = {
      month: todayMonth,
      day: todayDay,
      year: todayYear
    }
  } else {
    // fill any missing individual fields
    const eff = local.value.resaleCertificate.effectiveDate
    if (eff.month == null) eff.month = todayMonth
    if (eff.day == null) eff.day = todayDay
    if (eff.year == null) eff.year = todayYear
  }

  const rc = local.value.resaleCertificate
  if (rc && !rc.resale && !rc.incorporating && !rc.otherExemption) {
    rc.resale = true
  }
}

// run it once on setup
ensureDefaults()

type ExemptionValue = 'resale' | 'incorporating' | 'other'
const exemptionOptions: { label: string; value: ExemptionValue }[] = [
  { label: 'Resale, in the regular course of business, in the form of tangible personal property.', value: 'resale' },
  { label: 'Incorporating the same, as material, ingredient or component part, into tangible personal property produced for sale.', value: 'incorporating' },
  { label: 'Other authorized exemption (describe)', value: 'other' },
]

const selectedExemption = computed<ExemptionValue>({
  get() {
    const rc = local.value.resaleCertificate
    if (!rc) return 'resale'
    if (rc.resale) return 'resale'
    if (rc.incorporating) return 'incorporating'
    return 'other'
  },
  set(value) {
    const rc = local.value.resaleCertificate ?? (local.value.resaleCertificate = {})
    rc.resale = value === 'resale'
    rc.incorporating = value === 'incorporating'
    if (value !== 'other') {
      rc.otherExemption = ''
    } else if (rc.otherExemption === undefined) {
      rc.otherExemption = ''
    }
  },
})
</script>

<template>
  <div class="q-gutter-lg">
    <q-form ref="formRef" greedy>
      <div class="text-subtitle1">Blanket Resale &amp; Exemption Certificate for all States Except New York</div>
      <div class="text-caption q-mb-sm">(If you are exempt in New York state, you must complete ST-120 in place of this
        form)</div>
      <div class="q-mb-sm">
        The undersigned vendee hereby certifies that it is a regularly licensed retailer under the Law(s) of the
        state(s)
        indicated and that all tangible personal property purchased from: <b>ENNIS, INC. AND AFFILIATES AS DEFINED IN
          printtermsandconditions.com</b>
      </div>

      <!-- Purchaser info (prefilled from Business Info) -->
      <div class="row q-col-gutter-md">
        <div class="col-12 col-md-6">
          <q-input v-bind="fieldUi" v-model="local.resaleCertificate!.purchaserName" label="Name *"
            :rules="[required]" />
        </div>
        <div class="col-12 col-md-6">
          <q-input v-bind="fieldUi" v-model="local.customerNumber" label="Customer Number" />
        </div>
        <div class="col-12 col-md-4">
          <q-select v-bind="fieldUi" v-model="local.resaleCertificate!.purchaserCountry" label="Country *"
            :options="countryOptions" emit-value map-options :rules="[required]" />
        </div>
        <div class="col-12 col-md-8">
          <q-input v-bind="fieldUi" v-model="local.resaleCertificate!.purchaserAddress" label="Address *"
            :rules="[required]" autocomplete="one-time-code" />
        </div>
        <div class="col-12 col-md-4">
          <q-input v-bind="fieldUi" v-model="local.resaleCertificate!.purchaserCity" label="City *" :rules="[required]"
            autocomplete="one-time-code" />
        </div>
        <div class="col-12 col-md-4">
          <q-select v-bind="fieldUi" v-model="local.resaleCertificate!.purchaserState" :options="purchaserRegionOptions"
            :label="purchaserRegionLabel" emit-value map-options :rules="[required]"
            :disable="!local.resaleCertificate?.purchaserCountry" autocomplete="one-time-code" />
        </div>
        <div class="col-12 col-md-4">
          <q-input v-bind="fieldUi" v-model="local.resaleCertificate!.purchaserZip" :label="purchaserPostalLabel"
            :rules="purchaserPostalRules" autocomplete="one-time-code" />
        </div>
      </div>

      <div class="row q-col-gutter-md q-mt-sm">
        <div class="col-12 col-md-6">
          <q-input v-bind="fieldUi" v-model="local.resaleCertificate!.productDescription"
            label="Product that you will purchase" :rules="[required]" />
        </div>
        <div class="col-12 col-md-6">
          <q-input v-bind="fieldUi" v-model="local.primaryBusiness" label="Primary type of business" />
        </div>
      </div>

      <!-- Exemption reasons -->
      <div class="q-mt-sm">
        <div class="text-subtitle2">Exemption reason</div>
        <q-option-group v-model="selectedExemption" :options="exemptionOptions" type="radio" />
        <div v-if="selectedExemption === 'other'" class="column q-col-gutter-md q-mt-xs">
          <div class="col">
            <q-input v-bind="fieldUi" v-model="local.resaleCertificate!.otherExemption"
              label="Other authorized exemption (describe)" :rules="[required]" />
          </div>
        </div>
      </div>

      <!-- Disclosures -->
      <div class="q-mt-md">
        <div class="text-subtitle2">Disclosures</div>
        <ul class="q-pl-md">
          <li>This certificate shall be considered a part of each order given by vendee from and after the effective
            date hereof, unless such order shall otherwise specify.</li>
          <li>This certificate shall continue in full force and effect unless and until revoked in writing by the
            vendee.</li>
          <li>The vendee understands and agrees that if it uses any property purchased tax-free under this certificate
            in any manner which would not exempt the sale from tax, it becomes the user or consumer of such property,
            and as such assumes liability for and undertakes to pay the tax and interest and penalty thereon, if any.
          </li>
          <li>By law, Ennis Inc. must charge sales tax if the provided resale certificate is not completed and returned
            to us. To be considered valid the certificate must indicate your resale certificate number(s) and must be
            signed.</li>
        </ul>
      </div>

      <!-- Effective date and signatures -->
      <div class="row q-col-gutter-md q-mt-sm">
        <div class="col-12 col-md-6">
          <div class="row q-col-gutter-sm">
            <div class="col-4">
              <q-input v-bind="fieldUi" type="number" v-model.number="local.resaleCertificate!.effectiveDate!.month"
                label="Month *" :rules="[required, monthRule]" />
            </div>
            <div class="col-4">
              <q-input v-bind="fieldUi" type="number" v-model.number="local.resaleCertificate!.effectiveDate!.day"
                label="Day *" :rules="[required, dayRule]" />
            </div>
            <div class="col-4">
              <q-input v-bind="fieldUi" type="number" v-model.number="local.resaleCertificate!.effectiveDate!.year"
                label="Year *" :rules="[required, yearRule]" />
            </div>
          </div>
        </div>
      </div>

      <div class="row q-col-gutter-md q-mt-sm">
        <div class="col-12 col-md-6">
          <q-input v-bind="fieldUi" v-model="local.resaleCertificate!.signatureName" label="Name of Purchaser *"
            :rules="[required]" />
        </div>
        <div class="col-12 col-md-6">
          <q-input v-bind="fieldUi" v-model="local.resaleCertificate!.signatureTitle"
            label="Title of Authorized Agent *" :rules="[required]" />
        </div>
      </div>

      <!-- Exempt states and numbers -->
      <div class="row q-col-gutter-md q-mt-md">
        <div class="col-12 col-md-6">
          <q-select v-bind="fieldUi" use-chips multiple emit-value map-options :options="exemptOptions"
            v-model="local.exemptStates" label="States registered in (select all that apply)" />
        </div>
        <div class="col-12">
          <div v-if="local.exemptStates.length" class="text-caption q-mb-xs">Resale Certificate Number (per state)</div>
          <div class="row q-col-gutter-md">
            <template v-for="s in local.exemptStates" :key="s">
              <div v-if="s !== 'NY'" class="col-12 col-md-4">
                <q-input v-bind="fieldUi" :label="`Resale Number for ${s} *`" v-model="local.resaleNumbers[s]"
                  :rules="[resaleNumberRule(s), required]" :mask="resaleMaskFor(s)" :fill-mask="!!resaleMaskFor(s)" />
              </div>
              <div v-else class="col-12 col-md-6">
                <q-input v-bind="fieldUi" :model-value="'Complete ST‑120 section below'" label="New York" readonly />
              </div>
            </template>
          </div>
        </div>
      </div>

      <!-- NY ST-120 section -->
      <div v-if="showingNY" class="q-mt-lg">
        <q-separator class="q-my-md" />
        <div class="text-subtitle1">New York ST-120 Certificate</div>
        <div class="row q-col-gutter-md q-mt-sm">
          <div class="col-12 col-md-6">
            <q-input v-bind="fieldUi" v-model="local.nySt120.purchaserName" label="Purchaser Name *"
              :rules="[required]" />
          </div>
          <div class="col-12 col-md-6">
            <q-input v-bind="fieldUi" v-model="local.nySt120.vendorName" label="Vendor Name *" :rules="[required]" />
          </div>
          <div class="col-12 col-md-6">
            <q-select v-bind="fieldUi" v-model="local.nySt120.purchaserCountry" label="Purchaser Country *"
              :options="countryOptions" emit-value map-options :rules="[required]" />
          </div>
          <div class="col-12">
            <q-input v-bind="fieldUi" v-model="local.nySt120.purchaserAddress" label="Purchaser Address *"
              :rules="[required]" autocomplete="one-time-code" />
          </div>
          <div class="col-12 col-md-6">
            <q-input v-bind="fieldUi" v-model="local.nySt120.nyRegistration" label="NY Registration # *"
              :rules="[required]" />
          </div>
          <div class="col-12 col-md-6">
            <q-input v-bind="fieldUi" v-model="local.nySt120.signerName" label="Signer Name *" :rules="[required]" />
          </div>
          <div class="col-12 col-md-6">
            <q-input v-bind="fieldUi" v-model="local.nySt120.signerTitle" label="Signer Title *" :rules="[required]" />
          </div>
          <div class="col-12 col-md-6">
            <q-input v-bind="fieldUi" type="date" v-model="local.nySt120.signerDate" label="Signer Date" />
          </div>
        </div>
      </div>
    </q-form>
  </div>
</template>

<style scoped>
ul {
  margin: 0;
}
</style>
