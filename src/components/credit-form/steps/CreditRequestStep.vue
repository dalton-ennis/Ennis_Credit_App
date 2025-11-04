<script setup lang="ts">
import { ref, watch, defineExpose } from 'vue'
import type { CreditForm, Owner, Address, Bank, TradeRef } from '../types'
import type { QForm } from 'quasar'
import { stateOptions } from '../utilities'
import { required, ssnRule as ssnStringRule, zipRule, phoneRule, faxRule, emailRule } from '../../../utility/validators'
import type { RuleFn } from '../../../utility/validators'
import { fieldUi } from '../utilities';
import MaskedSsnInput from './reusable/MaskedSsnInput.vue'

const props = defineProps<{ modelValue: CreditForm }>()
const emit = defineEmits(['update:modelValue', 'next', 'back'])

// helpers
const emptyAddr = (): Address => ({ address: '', city: '', state: '', zip: '' })
const emptyOwner = (): Owner => ({ name: '', title: '', ssn: '', homeAddress: emptyAddr() })
const emptyBank = (): Bank => ({ name: '', accountNo: '', phone: '', fax: '', email: '', address: emptyAddr() })
const emptyRef = (): TradeRef => ({ name: '', accountNo: '', phone: '', fax: '', email: '', address: emptyAddr() })

// Local editable copies
const owners = ref<Owner[]>(
  (props.modelValue.owners?.length ? props.modelValue.owners : [emptyOwner()])
    .map(o => ({ ...o, homeAddress: o.homeAddress ?? emptyAddr() }))
)
const bank = ref<Bank>(props.modelValue.bank ? { ...props.modelValue.bank } : emptyBank())
const refs = ref<TradeRef[]>(
  props.modelValue.tradeRefs?.length ? props.modelValue.tradeRefs.map(r => ({ ...r, address: r.address ?? emptyAddr() }))
    : [emptyRef(), emptyRef(), emptyRef()]
)
const yearsInBusiness = ref<string>(props.modelValue.yearsInBusiness ?? '')
const creditAmount = ref<number | null>(props.modelValue.creditAmount ?? null)

// Sync to parent on change
watch([owners, bank, refs, yearsInBusiness, creditAmount], () => {
  emit('update:modelValue', {
    ...props.modelValue,
    owners: owners.value.map(o => ({ ...o })),
    bank: { ...bank.value },
    tradeRefs: refs.value.map(r => ({ ...r })),
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

// Form and validation
const formRef = ref<QForm | null>(null)

async function onNext() {
  const ok = await formRef.value?.validate()
  if (ok) emit('next')
}
function onBack() { emit('back') }

async function validate() { return await formRef.value?.validate() }
defineExpose({ validate })

const ssnRuleUnknown: RuleFn = (v) =>
  ssnStringRule(typeof v === 'string' ? v : '')

const rulesForSsn: RuleFn[] = [required, ssnRuleUnknown]
</script>

<template>
  <div class="q-gutter-lg">
    <q-form ref="formRef" greedy>
      <!-- Owners & Officers -->
      <div class="row items-center justify-between">
        <div class="text-subtitle2">Principal Owners &amp; Officers</div>
        <q-btn color="primary" flat icon="add" label="Add owner" @click="addOwner" />
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
              <MaskedSsnInput v-model="o.ssn" :field-ui="fieldUi" :rules="rulesForSsn"
                label="Social Security Number *" />
            </div>
            <div class="col-12 col-md-6">
              <q-input v-bind="fieldUi" v-model="o.title" label="Position or Title *" :rules="[required]" />
            </div>
          </div>
          <div class="text-caption text-weight-medium q-mt-sm">Home Address</div>
          <div class="row q-col-gutter-md">
            <div class="col-12">
              <q-input v-bind="fieldUi" v-model="o.homeAddress!.address" label="Street *" :rules="[required]" />
            </div>
            <div class="col-12 col-md-5">
              <q-input v-bind="fieldUi" v-model="o.homeAddress!.city" label="City *" :rules="[required]" />
            </div>
            <div class="col-6 col-md-3">
              <q-select v-bind="fieldUi" v-model="o.homeAddress!.state" :options="stateOptions" label="State *"
                emit-value map-options :rules="[required]" />
            </div>
            <div class="col-6 col-md-4">
              <q-input v-bind="fieldUi" v-model="o.homeAddress!.zip" label="Zip *" mask="#####" fill-mask
                :rules="[required, zipRule]" />
            </div>
          </div>
          <div class="q-mt-sm">
            <q-btn color="negative" flat icon="delete" label="Remove owner" :disable="owners.length <= 1"
              @click="removeOwner(i)" />
          </div>
        </q-card>
      </div>

      <!-- Meta and Credit Amount -->
      <div class="row q-col-gutter-md">
        <div class="col-12 col-md-6">
          <q-input v-bind="fieldUi" v-model="yearsInBusiness" label="How Long Have You Been in Business? *"
            :rules="[required]" />
        </div>
        <div class="col-12 col-md-6">
          <q-input v-bind="fieldUi" v-model.number="creditAmount" label="Amount of Credit Requested *" type="number"
            prefix="$" :rules="[required]" />
        </div>
      </div>

      <!-- Bank Reference -->
      <div class="text-subtitle2 q-mt-lg">Bank Reference (required)</div>
      <div class="row q-col-gutter-md">
        <div class="col-12 col-md-6">
          <q-input v-bind="fieldUi" v-model="bank.name" label="Bank Name *" :rules="[required]" />
        </div>
        <div class="col-12 col-md-6">
          <q-input v-bind="fieldUi" v-model="bank.accountNo" label="Account Number *" :rules="[required]" />
        </div>
        <div class="col-12 col-md-4">
          <q-input v-bind="fieldUi" v-model="bank.phone" label="Phone Number *" mask="(###) ###-####" fill-mask
            :rules="[required, phoneRule]" />
        </div>
        <div class="col-12 col-md-4">
          <q-input v-bind="fieldUi" v-model="bank.fax" label="Fax Number" mask="(###) ###-####" fill-mask
            :rules="[v => !v || faxRule(v)]" />
        </div>
        <div class="col-12 col-md-4">
          <q-input v-bind="fieldUi" v-model="bank.email" label="Email Address" type="email"
            :rules="[v => !v || emailRule(v)]" />
        </div>
        <div class="col-12">
          <q-input v-bind="fieldUi" v-model="bank.address.address" label="Bank Address *" :rules="[required]" />
        </div>
        <div class="col-12 col-md-5">
          <q-input v-bind="fieldUi" v-model="bank.address.city" label="City *" :rules="[required]" />
        </div>
        <div class="col-6 col-md-3">
          <q-select v-bind="fieldUi" v-model="bank.address.state" :options="stateOptions" label="State *" emit-value
            map-options :rules="[required]" />
        </div>
        <div class="col-6 col-md-4">
          <q-input v-bind="fieldUi" v-model="bank.address.zip" label="Zip *" mask="#####" fill-mask
            :rules="[required, zipRule]" />
        </div>
      </div>

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
            <q-input v-bind="fieldUi" v-model="r.fax" label="Fax Number" mask="(###) ###-####" fill-mask
              :rules="[v => !v || faxRule(v)]" />
          </div>
          <div class="col-12 col-md-4">
            <q-input v-bind="fieldUi" v-model="r.email" label="Email Address" type="email"
              :rules="[v => !v || emailRule(v)]" />
          </div>
          <div class="col-12">
            <q-input v-bind="fieldUi" v-model="r.address!.address" label="Address *" :rules="[required]" />
          </div>
          <div class="col-12 col-md-5">
            <q-input v-bind="fieldUi" v-model="r.address!.city" label="City *" :rules="[required]" />
          </div>
          <div class="col-6 col-md-3">
            <q-select v-bind="fieldUi" v-model="r.address!.state" :options="stateOptions" label="State *" emit-value
              map-options :rules="[required]" />
          </div>
          <div class="col-6 col-md-4">
            <q-input v-bind="fieldUi" v-model="r.address!.zip" label="Zip *" mask="#####" fill-mask
              :rules="[required, zipRule]" />
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
