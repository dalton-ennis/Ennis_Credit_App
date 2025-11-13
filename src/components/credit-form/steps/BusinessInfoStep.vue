<script setup lang="ts">
import { ref, watch, onMounted, computed } from 'vue'
import type { CreditForm, Address } from '../types'
import { countryOptions, stateOptions, provinceOptions } from '../utilities'
import { required, emailRule, zipRule, phoneRule, canadianPostalRule } from 'src/utility/validators';
import { fieldUi } from '../utilities';

const props = defineProps<{ modelValue: CreditForm }>()
const emit = defineEmits(['update:modelValue', 'next'])

const emptyAddr = (country = ''): Address => ({ address: '', city: '', state: '', zip: '', country })
const ensureMailing = (form: CreditForm) => {
    if (form.mailingDifferent && !form.mailing) form.mailing = emptyAddr(form.country)
    if (form.mailing && !form.mailing.country) form.mailing.country = form.country || form.mailing.country || ''
}

const ensureContacts = (form: CreditForm) => {
    if (!Array.isArray(form.contacts) || form.contacts.length === 0) {
        form.contacts = [{ role: 'main', name: '', title: '', email: '' }]
    } else {
        // Make sure first one is tagged as main
        form.contacts[0]!.role = form.contacts[0]!.role || 'main'
    }
}

const cloneForm = (form: CreditForm): CreditForm => {
    const copy: CreditForm = {
        ...form,
        contacts: Array.isArray(form.contacts) ? form.contacts.map(c => ({ ...c })) : [],
    }
    if (form.mailing) {
        copy.mailing = { ...form.mailing }
    } else {
        delete copy.mailing
    }
    return copy
}

const local = ref<CreditForm>(cloneForm(props.modelValue))

onMounted(() => {
    ensureMailing(local.value)
    ensureContacts(local.value)
})

const syncToParent = (form: CreditForm): CreditForm => {
    const copy: CreditForm = {
        ...form,
        contacts: Array.isArray(form.contacts) ? form.contacts.map(c => ({ ...c })) : [],
    }
    if (form.mailingDifferent) {
        copy.mailing = form.mailing ? { ...form.mailing } : emptyAddr(form.country)
    } else if (form.mailing) {
        copy.mailing = { ...form.mailing }
    } else {
        delete copy.mailing
    }
    return copy
}

let skipNextEmit = false

watch(
    local,
    (val) => {
        if (skipNextEmit) {
            skipNextEmit = false
            return
        }
        emit('update:modelValue', syncToParent(val))
    },
    { deep: true }
)

watch(
    () => props.modelValue,
    (val) => {
        skipNextEmit = true
        local.value = cloneForm(val)
        ensureMailing(local.value)
        ensureContacts(local.value)
    },
    { deep: false }
)

/** Validation rules for required fields (Business step) **/
const formRef = ref()

// async function onNext() {
//     const ok = await formRef.value?.validate()
//     if (ok) emit('next')
// }

async function validate() {
    return await formRef.value?.validate()
}
defineExpose({ validate })

function addContact() {
    if (local.value.contacts.length < 5) {
        local.value.contacts.push({ role: 'additional', name: '', title: '', email: '' })
    }
}
function removeContact(i: number) {
    if (local.value.contacts.length > 1) {
        local.value.contacts.splice(i, 1)
    }
}
function contactLabel(i: number) {
    return i === 0 ? 'Main Contact' : `Additional Contact ${i}`
}

// Country-driven UI behavior
const isCA = computed(() => local.value.country === 'CA')
const regionOptions = computed(() => isCA.value ? provinceOptions : stateOptions)
const regionLabel = computed(() => isCA.value ? 'Province/Territory *' : 'State *')
const postalLabel = computed(() => isCA.value ? 'Postal Code *' : 'ZIP *')
const postalRules = computed(() => isCA.value ? [required, canadianPostalRule] : [required, zipRule])

watch(() => local.value.country, () => {
    // Clear region/postal when country changes to prevent invalid combos
    local.value.state = ''
    local.value.zip = ''
    if (local.value.mailing) {
        local.value.mailing.state = ''
        local.value.mailing.zip = ''
    }
})

</script>

<template>
    <q-form ref="formRef" greedy class="q-gutter-lg">
        <!-- Core business identity -->
        <div class="row q-col-gutter-md">
            <div class="col-12 col-md-4">
                <q-input v-bind="fieldUi" v-model="local.companyName" label="Company Name *" :rules="[required]" />
            </div>

            <div class="col-12 col-md-4">
                <q-input v-bind="fieldUi" v-model="local.ein" label="EIN *" :rules="[required]" />
            </div>


            <div class="col-12 col-md-4">
                <q-input v-bind="fieldUi" v-model="local.dbaName" label="DBA" />
            </div>

            <div class="col-12 col-md-3">
                <q-input v-bind="fieldUi" v-model="local.phone" label="Phone *" mask="(###) ###-####" fill-mask
                    :rules="[required, phoneRule]" />
            </div>

            <div class="col-12 col-md-3">
                <q-input v-bind="fieldUi" v-model="local.fax" label="Fax" mask="(###) ###-####" fill-mask />
            </div>

            <div class="col-12 col-md-6">
                <q-input v-bind="fieldUi" v-model="local.email" label="Email *" type="email"
                    :rules="[required, emailRule]" />
            </div>


            <div class="col-12 col-md-2">
                <q-select v-bind="fieldUi" v-model="local.country" label="Country *" :options="countryOptions"
                    emit-value map-options :rules="[required]" />
            </div>
            <div class="col-12 col-md-10">
                <q-input v-bind="fieldUi" v-model="local.address" label="Business Address *" :rules="[required]" />
            </div>

            <div class="col-12 col-md-4">
                <q-input v-bind="fieldUi" v-model="local.city" label="City *" :rules="[required]" />
            </div>
            <div class="col-6 col-md-3">
                <q-select v-bind="fieldUi" v-model="local.state" :options="regionOptions" :label="regionLabel"
                    emit-value map-options :rules="[required]" :disable="!local.country" />
            </div>
            <div class="col-6 col-md-3">
                <q-input v-bind="fieldUi" v-model="local.zip" :label="postalLabel" :mask="isCA ? undefined : '#####'"
                    :fill-mask="!isCA" :rules="postalRules" :disable="!local.country" />
            </div>
        </div>

        <!-- Mailing address -->
        <q-toggle v-model="local.mailingDifferent" label="Mailing address is different"
            class="q-mt-none q-mb-none q-pb-none"
            @update:model-value="val => val && (local.mailing ??= { address: '', city: '', state: '', zip: '' })" />
        <div v-if="local.mailingDifferent" class="row q-col-gutter-md q-mt-none">
            <div class="col-12">
                <q-input v-bind="fieldUi" v-model="(local.mailing!.address)" label="Mailing Street" />
            </div>
            <div class="col-12 col-md-5">
                <q-input v-bind="fieldUi" v-model="(local.mailing!.city)" label="Mailing City" />
            </div>
            <div class="col-6 col-md-3">
                <q-select v-bind="fieldUi" v-model="(local.mailing!.state)" :options="regionOptions"
                    :label="isCA ? 'Mailing Province/Territory' : 'Mailing State'" emit-value map-options
                    :disable="!local.country" />
            </div>
            <div class="col-6 col-md-4">
                <q-input v-bind="fieldUi" v-model="(local.mailing!.zip)"
                    :label="isCA ? 'Mailing Postal Code' : 'Mailing ZIP'" :mask="isCA ? undefined : '#####'"
                    :fill-mask="!isCA" :disable="!local.country" />
            </div>
        </div>

        <!-- Business meta -->
        <div class="row q-col-gutter-md">
            <div class="col-12 col-md-4">
                <q-input v-bind="fieldUi" v-model="local.primaryBusiness" label="Primary Type of Business" />
            </div>
            <div class="col-12 col-md-4">
                <q-select v-bind="fieldUi" v-model="local.entityType"
                    :options="['Proprietorship', 'Partnership', 'Corporation', 'LLC']" label="Entity Type *"
                    :rules="[required]" />
            </div>
            <div class="col-12 col-md-4">
                <q-select v-bind="fieldUi" v-model="local.stateOfIncorp" :options="regionOptions"
                    :label="isCA ? 'Province/Territory of Incorporation/Registration' : 'State of Incorporation/Registration'"
                    emit-value map-options />
            </div>
            <!-- <div class="col-12 col-md-3">
                <q-input v-bind="fieldUi" v-model="local.yearsInBusiness" label="Years in Business"
                    type="number" min="0" />
            </div> -->
        </div>

        <!-- Contacts -->
        <div class="q-gutter-sm">
            <div class="row items-center justify-between q-mb-sm">
                <div class="text-subtitle2">Contacts</div>
                <q-btn color="primary" flat icon="add" label="Add contact" @click="addContact"
                    :disable="local.contacts.length >= 5" />
            </div>

            <div v-for="(c, i) in local.contacts" :key="i" class="q-mb-md">
                <q-card flat bordered class="q-pa-sm">
                    <q-card-section class="text-bold q-pb-sm">{{ contactLabel(i) }}</q-card-section>
                    <q-card-section class="q-gutter-sm">
                        <q-input v-bind="fieldUi" v-model="c.name" label="Name *" :rules="[required]" />
                        <q-input v-bind="fieldUi" v-model="c.title" label="Title *" :rules="[required]" />
                        <q-input v-bind="fieldUi" v-model="c.email" label="Email *" type="email"
                            :rules="[required, emailRule]" />
                        <div class="q-mt-xs">
                            <q-btn color="negative" flat icon="delete" label="Remove contact"
                                :disable="local.contacts.length <= 1" @click="removeContact(i)" />
                        </div>
                    </q-card-section>
                </q-card>
            </div>
        </div>

        <!-- Optional invoice email -->
        <div class="row q-col-gutter-md q-mt-md">
            <div class="col-12 col-md-4">
                <q-input v-bind="fieldUi" v-model="local.invoiceEmail" label="Invoice Email" type="email"
                    :rules="[v => !v || emailRule(v)]" hint="If provided, invoices will be emailed here." />
            </div>
            <div class="col-12 col-md-4">
                <q-input v-bind="fieldUi" v-model="local.statementEmail" label="Statement Email" type="email"
                    :rules="[v => !v || emailRule(v)]" hint="If provided, Statements will be emailed here." />
            </div>
            <div class="col-12 col-md-4">
                <q-input v-bind="fieldUi" v-model="local.AcknowledgementEmail" label="Acknowledgement Email"
                    type="email" :rules="[v => !v || emailRule(v)]"
                    hint="If provided, Acknowledgement will be emailed here." />
            </div>
        </div>

    </q-form>
</template>

<style></style>
