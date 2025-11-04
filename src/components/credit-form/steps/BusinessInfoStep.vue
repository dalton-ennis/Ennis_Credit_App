<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import type { CreditForm, Address } from '../types'
import { stateOptions } from '../utilities'
import { required, emailRule, zipRule, phoneRule } from 'src/utility/validators';
import { fieldUi } from '../utilities';

const props = defineProps<{ modelValue: CreditForm }>()
const emit = defineEmits(['update:modelValue', 'next'])

const emptyAddr = (): Address => ({ address: '', city: '', state: '', zip: '' })
const ensureMailing = (form: CreditForm) => {
    if (form.mailingDifferent && !form.mailing) form.mailing = emptyAddr()
}

const ensureContacts = (form: CreditForm) => {
    if (!Array.isArray(form.contacts) || form.contacts.length === 0) {
        form.contacts = [{ role: 'main', name: '', title: '', email: '' }]
    } else {
        // Make sure first one is tagged as main
        form.contacts[0]!.role = form.contacts[0]!.role || 'main'
    }
}

const local = ref<CreditForm>({ ...props.modelValue })

onMounted(() => {
    ensureMailing(local.value)
    ensureContacts(local.value)
})

watch(
    local,
    (val) => {
        const cloned: CreditForm = {
            ...val,
            mailing: val.mailing ?? emptyAddr(),
            contacts: Array.isArray(val.contacts) ? val.contacts.map(c => ({ ...c })) : [],
        }
        emit('update:modelValue', cloned)
    },
    { deep: true }
)

/** Validation rules for required fields (Business step) **/
const formRef = ref()

async function onNext() {
    const ok = await formRef.value?.validate()
    if (ok) emit('next')
}

function addContact() {
    local.value.contacts.push({ role: 'additional', name: '', title: '', email: '' })
}
function removeContact(i: number) {
    if (local.value.contacts.length > 1) {
        local.value.contacts.splice(i, 1)
    }
}
function contactLabel(i: number) {
    return i === 0 ? 'Main Contact' : `Additional Contact ${i}`
}

</script>

<template>
    <q-form ref="formRef" greedy class="q-gutter-lg">
        <!-- Core business identity -->
        <div class="row q-col-gutter-md">
            <div class="col-12 col-md-6">
                <q-input v-bind="fieldUi" v-model="local.companyName" label="Company Name *" :rules="[required]" />
            </div>

            <div class="col-12 col-md-6">
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

            <div class="col-12">
                <q-input v-bind="fieldUi" v-model="local.address" label="Business Address *" :rules="[required]" />
            </div>

            <div class="col-12 col-md-4">
                <q-input v-bind="fieldUi" v-model="local.city" label="City *" :rules="[required]" />
            </div>
            <div class="col-6 col-md-3">
                <q-select v-bind="fieldUi" v-model="local.state" :options="stateOptions" label="State *" emit-value
                    map-options :rules="[required]" />
            </div>
            <div class="col-6 col-md-3">
                <q-input v-bind="fieldUi" v-model="local.zip" label="ZIP *" mask="#####" fill-mask
                    :rules="[required, zipRule]" />
            </div>
            <div class="col-12 col-md-2">
                <q-input v-bind="fieldUi" v-model="local.country" label="Country" />
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
                <q-select v-bind="fieldUi" v-model="(local.mailing!.state)" :options="stateOptions"
                    label="Mailing State" emit-value map-options />
            </div>
            <div class="col-6 col-md-4">
                <q-input v-bind="fieldUi" v-model="(local.mailing!.zip)" label="Mailing ZIP" mask="#####" fill-mask />
            </div>
        </div>

        <!-- Business meta -->
        <div class="row q-col-gutter-md">
            <div class="col-12 col-md-4">
                <q-input v-bind="fieldUi" v-model="local.primaryBusiness" label="Primary Type of Business" />
            </div>
            <div class="col-12 col-md-4">
                <q-select v-bind="fieldUi" v-model="local.entityType"
                    :options="['Proprietorship', 'Partnership', 'Corporation', 'Branch']" label="Entity Type *"
                    :rules="[required]" />
            </div>
            <div class="col-12 col-md-4">
                <q-select v-bind="fieldUi" v-model="local.stateOfIncorp" :options="stateOptions"
                    label="State of Incorporation/Registration" emit-value map-options />
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
                <q-btn color="primary" flat icon="add" label="Add contact" @click="addContact" />
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

        <div class="row q-col-gutter-md q-mb-md">
            <div class="col-12 col-md-6">
                <q-toggle v-model="local.requestLineOfCredit" label="Requesting a line of credit?" />
            </div>
            <div class="col-12 col-md-6">
                <q-toggle v-model="local.requestTaxExempt" label="Requesting tax exemption?" />
            </div>
        </div>

        <q-btn color="primary" label="Next" @click="onNext" class="q-mt-md" />
    </q-form>
</template>

<style></style>
