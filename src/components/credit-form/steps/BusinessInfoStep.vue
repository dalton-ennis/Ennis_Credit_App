<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import type { CreditForm, Address } from '../types'
import { stateOptions } from '../utilities'

const props = defineProps<{ modelValue: CreditForm }>()
const emit = defineEmits(['update:modelValue', 'next'])

/** helpers **/
const emptyAddr = (): Address => ({ address: '', city: '', state: '', zip: '' })
const ensureMailing = (form: CreditForm) => {
    if (form.mailingDifferent && !form.mailing) form.mailing = emptyAddr()
}

/** local editable copy to avoid mutating props **/
const local = ref<CreditForm>({ ...props.modelValue })

onMounted(() => ensureMailing(local.value))

/** keep parent in sync on any change **/
watch(
    local,
    (val) => {
        // defensive clone of nested objects that may be undefined
        const cloned: CreditForm = {
            ...val,
            mailing: val.mailing ?? emptyAddr(),
            contacts: Array.isArray(val.contacts) ? val.contacts.map(c => ({ ...c })) : [],
        }
        emit('update:modelValue', cloned)
    },
    { deep: true }
)


</script>

<template>
    <div class="q-gutter-lg">

        <!-- Core business identity -->
        <div class="row q-col-gutter-md">
            <div class="col-12 col-md-8">
                <q-input v-model="local.firmName" label="Firm Name *" />
            </div>

            <div class="col-12 col-md-4">
                <q-select v-model="local.entityType"
                    :options="['Proprietorship', 'Partnership', 'Corporation', 'Branch']" label="Entity Type *" />
            </div>

            <div class="col-12 col-md-6">
                <q-input v-model="local.dbaName" label="DBA (optional)" />
            </div>
            <div class="col-12 col-md-3">
                <q-input v-model="local.phone" label="Phone *" mask="(###) ###-####" fill-mask />
            </div>
            <div class="col-12 col-md-3">
                <q-input v-model="local.fax" label="Fax" mask="(###) ###-####" fill-mask />
            </div>

            <div class="col-12 col-md-6">
                <q-input v-model="local.email" label="Email *" type="email" />
            </div>

            <div class="col-12">
                <q-input v-model="local.address" label="Business Address *" />
            </div>

            <div class="col-12 col-md-4">
                <q-input v-model="local.city" label="City *" />
            </div>
            <div class="col-6 col-md-3">
                <q-select v-model="local.state" :options="stateOptions" label="State *" emit-value map-options />
            </div>
            <div class="col-6 col-md-3">
                <q-input v-model="local.zip" label="ZIP *" mask="#####-####" fill-mask />
            </div>
            <div class="col-12 col-md-2">
                <q-input v-model="local.county" label="County" />
            </div>
        </div>

        <!-- Mailing address -->
        <q-toggle v-model="local.mailingDifferent" label="Mailing address is different"
            @update:model-value="val => val && (local.mailing ??= { address: '', city: '', state: '', zip: '' })" />
        <div v-if="local.mailingDifferent" class="row q-col-gutter-md">
            <div class="col-12">
                <q-input v-model="(local.mailing!.address)" label="Mailing Street" />
            </div>
            <div class="col-12 col-md-5">
                <q-input v-model="(local.mailing!.city)" label="Mailing City" />
            </div>
            <div class="col-6 col-md-3">
                <q-select v-model="(local.mailing!.state)" :options="stateOptions" label="Mailing State" emit-value
                    map-options />
            </div>
            <div class="col-6 col-md-4">
                <q-input v-model="(local.mailing!.zip)" label="Mailing ZIP" mask="#####-####" fill-mask />
            </div>
        </div>

        <!-- Business meta -->
        <div class="row q-col-gutter-md">
            <div class="col-12 col-md-6">
                <q-input v-model="local.primaryBusiness" label="Primary Type of Business" />
            </div>
            <div class="col-12 col-md-3">
                <q-select v-model="local.stateOfIncorp" :options="stateOptions"
                    label="State of Incorporation/Registration" emit-value map-options />
            </div>
            <div class="col-12 col-md-3">
                <q-input v-model="local.yearsInBusiness" label="Years in Business" type="number" min="0" />
            </div>
        </div>

        <!-- Contacts -->
        <div class="q-gutter-sm">
            <div class="text-subtitle2">Contacts</div>
            <div class="row q-col-gutter-md">
                <div class="col-12 col-md-4">
                    <q-card flat bordered>
                        <q-card-section class="text-bold">Main Contact</q-card-section>
                        <q-card-section class="q-gutter-sm">
                            <q-input v-model="local.contacts[0]!.name" label="Name" />
                            <q-input v-model="local.contacts[0]!.title" label="Title" />
                            <q-input v-model="local.contacts[0]!.email" label="Email" type="email" />
                        </q-card-section>
                    </q-card>
                </div>
                <div class="col-12 col-md-4">
                    <q-card flat bordered>
                        <q-card-section class="text-bold">Accounting Contact</q-card-section>
                        <q-card-section class="q-gutter-sm">
                            <q-input v-model="local.contacts[1]!.name" label="Name" />
                            <q-input v-model="local.contacts[1]!.title" label="Title" />
                            <q-input v-model="local.contacts[1]!.email" label="Email" type="email" />
                        </q-card-section>
                    </q-card>
                </div>
                <div class="col-12 col-md-4">
                    <q-card flat bordered>
                        <q-card-section class="text-bold">Additional Contact</q-card-section>
                        <q-card-section class="q-gutter-sm">
                            <q-input v-model="local.contacts[2]!.name" label="Name" />
                            <q-input v-model="local.contacts[2]!.title" label="Title" />
                            <q-input v-model="local.contacts[2]!.email" label="Email" type="email" />
                        </q-card-section>
                    </q-card>
                </div>
            </div>
        </div>

        <div class="row q-col-gutter-md">
            <div class="col-12 col-md-6">
                <q-toggle v-model="local.requestLineOfCredit" label="Requesting a line of credit?" />
            </div>
            <div class="col-12 col-md-6">
                <q-toggle v-model="local.requestTaxExempt" label="Requesting tax exemption?" />
            </div>
        </div>

        <q-btn color="primary" label="Next" @click="emit('next')" class="q-mt-md" />
    </div>
</template>

<style></style>