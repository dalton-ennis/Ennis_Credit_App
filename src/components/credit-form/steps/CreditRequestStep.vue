<script setup lang="ts">
import { ref, watch, defineExpose, onMounted, nextTick, computed } from 'vue'
import type { CreditForm, Owner, Address, Bank, TradeRef } from '../types'
import type { QForm } from 'quasar'
import { stateOptions, provinceOptions, countryOptions } from '../utilities'
import { required, zipRule, phoneRule, faxRule, emailRule, canadianPostalRule } from '../../../utility/validators'
import { fieldUi } from '../utilities';

const props = defineProps<{ modelValue: CreditForm }>()
const emit = defineEmits(['update:modelValue', 'next', 'back'])

// helpers
const defaultCountry = computed(() => props.modelValue.country || 'US')
const ensureAddress = (addr?: Address): Address => ({
  address: addr?.address ?? '',
  city: addr?.city ?? '',
  state: addr?.state ?? '',
  zip: addr?.zip ?? '',
  country: addr?.country ?? defaultCountry.value
})
const emptyOwner = (): Owner => ({ name: '', title: '', ssn: '', homeAddress: ensureAddress() })
const emptyBank = (): Bank => ({ name: '', accountNo: '', phone: '', fax: '', email: '', address: ensureAddress() })
const emptyRef = (): TradeRef => ({ name: '', accountNo: '', phone: '', fax: '', email: '', address: ensureAddress() })

// Local editable copies
const owners = ref<Owner[]>(
  (props.modelValue.owners?.length ? props.modelValue.owners : [emptyOwner()])
    .map(o => ({ ...o, homeAddress: ensureAddress(o.homeAddress) }))
)
const bank = ref<Bank>(props.modelValue.bank ? { ...props.modelValue.bank, address: ensureAddress(props.modelValue.bank.address) } : emptyBank())
const refs = ref<TradeRef[]>(
  props.modelValue.tradeRefs?.length ? props.modelValue.tradeRefs.map(r => ({ ...r, address: ensureAddress(r.address) }))
    : [emptyRef(), emptyRef(), emptyRef()]
)
const yearsInBusiness = ref<string>(props.modelValue.yearsInBusiness ?? '')
const creditAmount = ref<number | null>(props.modelValue.creditAmount ?? null)

// Sync to parent on change
watch([owners, bank, refs, yearsInBusiness, creditAmount], () => {
  emit('update:modelValue', {
    ...props.modelValue,
    owners: owners.value.map(o => ({ ...o, homeAddress: o.homeAddress ? { ...o.homeAddress } : undefined })),
    bank: { ...bank.value, address: bank.value.address ? { ...bank.value.address } : undefined },
    tradeRefs: refs.value.map(r => ({ ...r, address: r.address ? { ...r.address } : undefined })),
    yearsInBusiness: yearsInBusiness.value,
    creditAmount: creditAmount.value,
  })
}, { deep: true })

// Owner list controls
function addOwner() { owners.value.push(emptyOwner()) }
function removeOwner(i: number) { if (owners.value.length > 1) owners.value.splice(i, 1) }


// Ensure we have at least 3 references for UI
if (refs.value.length < 3) {
  while (refs.value.length < 3) refs.value.push(emptyRef())
}

function onAddressCountryChange(addr: Address | undefined, val: string) {
  if (!addr) return
  addr.country = val
  addr.state = ''
  addr.zip = ''
}

const isAddressCA = (addr?: Address) => (addr?.country || defaultCountry.value) === 'CA'
const regionLabelFor = (addr?: Address) => isAddressCA(addr) ? 'Province/Territory *' : 'State *'
const postalLabelFor = (addr?: Address) => isAddressCA(addr) ? 'Postal Code *' : 'ZIP *'
const regionOptionsFor = (addr?: Address) => isAddressCA(addr) ? provinceOptions : stateOptions
const postalRulesFor = (addr?: Address) => isAddressCA(addr) ? [required, canadianPostalRule] : [required, zipRule]
const postalMaskFor = (addr?: Address) => isAddressCA(addr) ? undefined : '#####'
const postalFillMaskFor = (addr?: Address) => !isAddressCA(addr)

watch(defaultCountry, (newCountry, oldCountry) => {
  if (newCountry === oldCountry) return
  owners.value.forEach(o => {
    if (!o.homeAddress) return
    if (!o.homeAddress.country || o.homeAddress.country === oldCountry) {
      o.homeAddress.country = newCountry
      o.homeAddress.state = ''
      o.homeAddress.zip = ''
    }
  })
  refs.value.forEach(r => {
    if (!r.address) return
    if (!r.address.country || r.address.country === oldCountry) {
      r.address.country = newCountry
      r.address.state = ''
      r.address.zip = ''
    }
  })
  if (bank.value.address) {
    if (!bank.value.address.country || bank.value.address.country === oldCountry) {
      bank.value.address.country = newCountry
      bank.value.address.state = ''
      bank.value.address.zip = ''
    }
  }
})

// Form and validation
const formRef = ref<QForm | null>(null)
const showDisclosure = ref(true)
const canAcknowledge = ref(false)
const scrollBox = ref<HTMLElement | null>(null)

onMounted(async () => {
  if (!props.modelValue.creditDisclosureAck) {
    await nextTick()
    showDisclosure.value = true
    canAcknowledge.value = false
    await nextTick()
    const el = scrollBox.value
    if (el && el.scrollHeight <= el.clientHeight) {
      // Content fits without scrolling; allow immediate acknowledge
      canAcknowledge.value = true
    }
  }
})

function onDisclosureScroll() {
  const el = scrollBox.value
  if (!el) return
  const atBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 8
  const notScrollable = el.scrollHeight <= el.clientHeight
  if (atBottom || notScrollable) canAcknowledge.value = true
}

function acknowledgeDisclosure() {
  emit('update:modelValue', { ...props.modelValue, creditDisclosureAck: true })
  showDisclosure.value = false
}

async function validate() { return await formRef.value?.validate() }
defineExpose({ validate })

</script>

<template>
  <div class="q-gutter-lg">
    <q-form ref="formRef" greedy>
      <!-- Owners & Officers -->
      <div class="row items-center justify-between">
        <div class="text-subtitle2">Principal Owners &amp; Officers</div>
        <q-btn :disable="owners.length === 2" color="primary" flat icon="add" label="Add owner" @click="addOwner" />
      </div>

      <div v-for="(o, i) in owners" :key="i" class="q-pa-md q-mb-sm bg-grey-2 rounded-borders">
        <q-card flat bordered class="q-pa-sm">
          <q-card-section class="q-pa-none q-ma-none">
            <p>Owner {{ i + 1 }}</p>
          </q-card-section>
          <div class="row q-col-gutter-md">
            <div class="col-12 col-md-6">
              <q-input v-bind="fieldUi" v-model="o.name" label="First and Last Name *" :rules="[required]" />
            </div>
            <div class="col-12 col-md-6">
              <q-input v-bind="fieldUi" v-model="o.title" label="Position or Title *" :rules="[required]" />
            </div>
          </div>
          <div class="text-caption text-weight-medium q-mt-sm">Address</div>
          <div class="row q-col-gutter-md">
            <div class="col-12 col-md-4">
              <q-select v-bind="fieldUi" v-model="o.homeAddress!.country" label="Country *" :options="countryOptions"
                emit-value map-options :rules="[required]"
                @update:model-value="val => onAddressCountryChange(o.homeAddress, val as string)" />
            </div>
            <div class="col-12 col-md-8">
              <q-input v-bind="fieldUi" v-model="o.homeAddress!.address" label="Street *" :rules="[required]" />
            </div>
            <div class="col-12 col-md-5">
              <q-input v-bind="fieldUi" v-model="o.homeAddress!.city" label="City *" :rules="[required]" />
            </div>
            <div class="col-6 col-md-3">
              <q-select v-bind="fieldUi" v-model="o.homeAddress!.state" :options="regionOptionsFor(o.homeAddress)"
                :label="regionLabelFor(o.homeAddress)" emit-value map-options :rules="[required]"
                :disable="!o.homeAddress?.country" />
            </div>
            <div class="col-6 col-md-4">
              <q-input v-bind="fieldUi" v-model="o.homeAddress!.zip" :label="postalLabelFor(o.homeAddress)"
                :mask="postalMaskFor(o.homeAddress)" :fill-mask="postalFillMaskFor(o.homeAddress)"
                :rules="postalRulesFor(o.homeAddress)" />
            </div>
          </div>
          <div class="q-mt-sm">
            <q-btn color="negative" flat icon="delete" label="Remove owner" :disable="owners.length <= 1"
              @click="removeOwner(i)" />
          </div>
        </q-card>
      </div>

      <!-- Meta and Credit Amount -->
      <div class="row q-col-gutter-md q-pl-md q-pr-md">
        <div class="col-12 col-md-6">
          <q-input v-bind="fieldUi" v-model="yearsInBusiness" label="How Long Have You Been in Business? *"
            :rules="[required]" />
        </div>
        <div class="col-12 col-md-6">
          <q-input v-bind="fieldUi" v-model.number="creditAmount" label="Amount of Credit Requested *" type="number"
            prefix="$" :rules="[required]" />
        </div>
      </div>

      <!-- Bank Reference section removed per requirements -->

      <!-- Credit References 1-3 -->
      <div class="text-subtitle2 q-mt-lg">Credit References (3 required)</div>
      <div v-for="(r, i) in refs.slice(0, 3)" :key="i" class="q-pa-md q-mt-sm bg-grey-2 rounded-borders">
        <div class="text-weight-medium q-mb-sm">Credit Reference: {{ i + 1 }}</div>
        <div class="row q-col-gutter-md">
          <div class="col-12 col-md-6">
            <q-input v-bind="fieldUi" v-model="r.name" label="Supplier Name *" :rules="[required]" />
          </div>
          <div class="col-12 col-md-6">
            <q-input v-bind="fieldUi" v-model="r.accountNo" label="Account Number *" :rules="[required]" />
          </div>
          <div class="col-12 col-md-4">
            <q-input v-bind="fieldUi" v-model="r.phone" label="Phone Number *" mask="(###) ###-####" fill-mask
              :rules="[required, phoneRule]" />
          </div>
          <div class="col-12 col-md-4">
            <q-input v-bind="fieldUi" v-model="r.fax" label="Fax Number *" mask="(###) ###-####" fill-mask
              :rules="[v => !v || faxRule(v), required]" />
          </div>
          <div class="col-12 col-md-4">
            <q-input v-bind="fieldUi" v-model="r.email" label="Email Address *" type="email"
              :rules="[v => !v || emailRule(v), required]" />
          </div>
          <div class="col-12">
            <q-select v-bind="fieldUi" v-model="r.address!.country" label="Country *" :options="countryOptions"
              emit-value map-options :rules="[required]"
              @update:model-value="val => onAddressCountryChange(r.address, val as string)" />
          </div>
          <div class="col-12">
            <q-input v-bind="fieldUi" v-model="r.address!.address" label="Address *" :rules="[required]" />
          </div>
          <div class="col-12 col-md-5">
            <q-input v-bind="fieldUi" v-model="r.address!.city" label="City *" :rules="[required]" />
          </div>
          <div class="col-6 col-md-3">
            <q-select v-bind="fieldUi" v-model="r.address!.state" :options="regionOptionsFor(r.address)"
              :label="regionLabelFor(r.address)" emit-value map-options :rules="[required]"
              :disable="!r.address?.country" />
          </div>
          <div class="col-6 col-md-4">
            <q-input v-bind="fieldUi" v-model="r.address!.zip" :label="postalLabelFor(r.address)"
              :mask="postalMaskFor(r.address)" :fill-mask="postalFillMaskFor(r.address)"
              :rules="postalRulesFor(r.address)" />
          </div>
        </div>
      </div>
    </q-form>
  </div>

  <!-- One-time disclosure modal -->
  <q-dialog v-model="showDisclosure" persistent>
    <q-card style="max-width: 800px; width: 95vw">
      <q-card-section class="text-h6">Credit Application Disclosures</q-card-section>
      <q-separator />
      <q-card-section>
        <div ref="scrollBox" @scroll="onDisclosureScroll" style="max-height:60vh; overflow:auto" class="q-pa-sm">
          <div class="text-subtitle2 q-mb-sm">Additional Contacts</div>
          <p class="q-mb-sm">
            Upon receipt and approval of your application, your company will be added to our mailing list for all
            marketing related literature. Use the space below (on the application) to indicate additional individuals
            within your company who should receive this information. Please attach additional sheets if necessary.
          </p>
          <p class="q-mb-md text-caption text-grey-7">
            Email Policy: At no time will we sell or share your email address with a third party. In addition to order
            confirmations and shipping notifications, we send promotional emails, which include special offers, sales
            tips and other information. Anyone who receives these emails can unsubscribe at any time.
          </p>

          <div class="text-subtitle2 q-mb-sm">Applicant’s Signature</div>
          <p class="q-mb-sm">
            Applicant’s signature attests financial responsibility, willingness, and ability to pay invoices in
            accordance with Ennis Inc. terms. Further, it is understood orders or shipments will be held if account
            falls beyond terms. Applicant also acknowledges responsibility for any cost and expenses incurred in the
            collection of account by third party. The above information is willingly supplied and applicant authorizes
            Ennis Inc. to make the necessary inquiries with bank/trade references, and to obtain credit reports
            individually (if applicable) and/or financial statements from Company in the extension or continuation of
            credit terms. Applicant’s signature or first submitted order also attests acceptance of Ennis Inc. trade
            policies, individual facility terms, and the terms and conditions set out at printtermsandconditions.com.
          </p>

          <!-- <div class="text-subtitle2 q-mb-sm">Personal Guarantee</div>
          <p class="q-mb-lg">
            In consideration for credit extended, or to be extended, to the company listed on this application, I/we do
            hereby agree, individually/jointly, to guarantee payment of the indebtedness of the company. The undersigned
            expressly waives all notice of acceptance of this guarantee, notice of extension of credit, presentment of
            demand for payment, any notice of default, and other notices to which the guarantor might be entitled. This
            guarantee shall inure to the benefit of the heirs, administrators, executors, successors, or assigns of the
            parties hereto.
          </p> -->

          <q-separator class="q-my-md" />

          <div class="text-subtitle2 q-mb-sm">Privacy Notice for Business Credit Applications</div>
          <p class="q-mb-sm">
            By submitting this application, you acknowledge and agree that Ennis and its affiliates ("Ennis") may
            collect, use, and retain the information provided for the purpose of:
          </p>
          <ul class="q-mb-sm">
            <li>Evaluating creditworthiness and establishing or maintaining a business account;</li>
            <li>Verifying trade, banking, and tax information;</li>
            <li>Managing billing, collections, and account communications; and</li>
            <li>Complying with applicable tax, legal, and regulatory requirements.</li>
          </ul>
          <p class="q-mb-sm">
            Information submitted may include both business and personal information (such as owner or guarantor contact
            details, identification numbers, or financial data). Ennis may verify or share this information with third
            parties such as credit reporting agencies, trade references, and financial institutions solely for purposes
            related to credit evaluation, account administration, or legal compliance.
          </p>
          <p class="q-mb-sm">
            We maintain reasonable physical, electronic, and procedural safeguards to protect your information from
            unauthorized access, use, or disclosure. Information provided on any Personal Guaranty or Sales Tax
            Exemption Certificate will be used only to verify identity, confirm tax status, and process account
            documentation.
          </p>
          <p class="q-mb-sm">
            We do not sell, lease, or disclose your information for marketing purposes outside of Ennis and its
            affiliates.
          </p>
          <p class="q-mb-md">
            For additional information regarding our information practices, please review our full Privacy Policy at
            <a href="https://www.ennis.com/privacy-policy/" target="_blank"
              rel="noopener">https://www.ennis.com/privacy-policy/</a>.
          </p>
          <p class="text-caption text-grey-7 q-mt-sm">
            By clicking "I Acknowledge", you confirm you have read and agree to the Privacy Notice and the Company's
            Privacy Policy.
          </p>
        </div>
      </q-card-section>
      <q-separator />
      <q-card-actions align="right">
        <q-btn flat label="Close" @click="acknowledgeDisclosure" color="primary" />
        <q-btn color="primary" label="I Acknowledge" @click="acknowledgeDisclosure" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>
