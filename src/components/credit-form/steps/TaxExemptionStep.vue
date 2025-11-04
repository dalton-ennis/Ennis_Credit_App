<script setup lang="ts">
import { ref, watch, onMounted, computed } from 'vue'
import type { CreditForm } from '../types'
import { stateOptions } from '../utilities'
import { dayRule, monthRule, required, yearRule } from 'src/utility/validators'
import type { QForm } from 'quasar'
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
  local.value.nySt120 ??= { purchaserName: '', purchaserAddress: '', nyRegistration: '', vendorName: '', signerName: '', signerTitle: '', signerDate: '' }

  // Prefill some values from business info if empty
  const rc = local.value.resaleCertificate
  if (!rc.purchaserName) rc.purchaserName = local.value.companyName || ''
  if (!rc.purchaserAddress) rc.purchaserAddress = local.value.address || ''
  if (!rc.purchaserCity) rc.purchaserCity = local.value.city || ''
  if (!rc.purchaserState) rc.purchaserState = local.value.state || ''
  if (!rc.purchaserZip) rc.purchaserZip = local.value.zip || ''
})

// Keep parent in sync
watch(local, (val) => {
  emit('update:modelValue', JSON.parse(JSON.stringify(val)))
}, { deep: true })

const formRef = ref<QForm | null>(null)
const showingNY = computed(() => local.value.exemptStates?.includes('NY'))

// States that require in‑state resale certificate numbers (no out‑of‑state)
const IN_STATE_ONLY = new Set(['CA', 'FL', 'HI', 'IL', 'LA', 'MD', 'MA', 'WA', 'DC'])

// Annotate special states in dropdown labels
const exemptOptions = computed(() => stateOptions.map(o => {
  if (o.value === 'NY') return { ...o, label: `${o.label} — ST‑120 required` }
  if (IN_STATE_ONLY.has(o.value)) return { ...o, label: `${o.label} — in‑state only` }
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

// Rule: require a number for in‑state‑only states (except NY which uses ST‑120)
const resaleNumberRule = (code: string) => (v: string) => {
  if (code === 'NY') return true
  return IN_STATE_ONLY.has(code) ? ((v && v.trim()) ? true : 'Required for this state') : true
}

async function onNext() {
  const ok = await formRef.value?.validate()
  if (ok) emit('next')
}
function onBack() { emit('back') }

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
}

// run it once on setup
ensureDefaults()
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
        <div class="col-12">
          <q-input v-bind="fieldUi" v-model="local.resaleCertificate!.purchaserAddress" label="Address *"
            :rules="[required]" />
        </div>
        <div class="col-12 col-md-4">
          <q-input v-bind="fieldUi" v-model="local.resaleCertificate!.purchaserCity" label="City *"
            :rules="[required]" />
        </div>
        <div class="col-12 col-md-4">
          <q-input v-bind="fieldUi" v-model="local.resaleCertificate!.purchaserState" label="State *"
            :rules="[required]" />
        </div>
        <div class="col-12 col-md-4">
          <q-input v-bind="fieldUi" v-model="local.resaleCertificate!.purchaserZip" label="Zip *" :rules="[required]" />
        </div>
      </div>

      <div class="row q-col-gutter-md q-mt-sm">
        <div class="col-12 col-md-6">
          <q-input v-bind="fieldUi" v-model="local.resaleCertificate!.productDescription"
            label="Product that you will purchase" />
        </div>
        <div class="col-12 col-md-6">
          <q-input v-bind="fieldUi" v-model="local.primaryBusiness" label="Primary type of business" />
        </div>
      </div>

      <!-- Exemption reasons -->
      <div class="q-mt-sm">
        <q-checkbox v-model="local.resaleCertificate!.resale"
          label="Resale, in the regular course of business, in the form of tangible personal property." />
        <q-checkbox v-model="local.resaleCertificate!.incorporating"
          label="Incorporating the same, as material, ingredient or component part, into tangible personal property produced for sale." />
        <div class="row q-col-gutter-md q-mt-xs">
          <div class="col">
            <q-input v-bind="fieldUi" v-model="local.resaleCertificate!.otherExemption"
              label="Other authorized exemption (describe)" />
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
        <div class="col-12">
          <q-input v-bind="fieldUi" v-model="local.resaleCertificate!.signatureDate" label="Signature Date" />
        </div>
      </div>

      <!-- Exempt states and numbers -->
      <div class="row q-col-gutter-md q-mt-md">
        <div class="col-12 col-md-6">
          <q-select v-bind="fieldUi" use-chips multiple emit-value map-options :options="exemptOptions"
            v-model="local.exemptStates" label="States Exempt In (select all that apply)" />
        </div>
        <div class="col-12">
          <div class="text-caption q-mb-xs">Resale Certificate Number (per state)</div>
          <div class="row q-col-gutter-md">
            <template v-for="s in local.exemptStates" :key="s">
              <div v-if="s !== 'NY'" class="col-12 col-md-4">
                <q-input v-bind="fieldUi" :label="`Resale Number for ${s}`" v-model="local.resaleNumbers[s]"
                  :rules="[resaleNumberRule(s)]" />
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
          <div class="col-12">
            <q-input v-bind="fieldUi" v-model="local.nySt120.purchaserAddress" label="Purchaser Address *"
              :rules="[required]" />
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

    <div class="row q-gutter-sm q-mt-md">
      <q-btn color="secondary" label="Back" @click="onBack" />
      <q-btn color="primary" label="Next" @click="onNext" />
    </div>
  </div>
</template>

<style scoped>
ul {
  margin: 0;
}
</style>
