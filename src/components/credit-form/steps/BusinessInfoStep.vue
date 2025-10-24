<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import type { CreditForm, Address } from '../types'
import { stateOptions } from '../utilities'
import { required, emailRule, zipRule, phoneRule } from 'src/utility/validators';

const props = defineProps<{ modelValue: CreditForm }>()
const emit = defineEmits(['update:modelValue', 'next'])

const emptyAddr = (): Address => ({ address: '', city: '', state: '', zip: '' })
const ensureMailing = (form: CreditForm) => {
    if (form.mailingDifferent && !form.mailing) form.mailing = emptyAddr()
}

const local = ref<CreditForm>({ ...props.modelValue })

onMounted(() => ensureMailing(local.value))

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

</script>

<template>
    <q-form ref="formRef" greedy class="q-gutter-lg">

        <!-- Core business identity -->
        <div class="row q-col-gutter-md">
            <div class="col-12 col-md-6">
                <q-input filled bg-color="grey-4" v-model="local.companyName" label="Company Name *"
                    :rules="[required]" />
            </div>

            <div class="col-12 col-md-6">
                <q-input filled bg-color="grey-4" v-model="local.dbaName" label="DBA" />
            </div>

            <div class="col-12 col-md-3">
                <q-input filled bg-color="grey-4" v-model="local.phone" label="Phone *" mask="(###) ###-####" fill-mask
                    :rules="[required, phoneRule]" />
            </div>

            <div class="col-12 col-md-3">
                <q-input filled bg-color="grey-4" v-model="local.fax" label="Fax" mask="(###) ###-####" fill-mask />
            </div>

            <div class="col-12 col-md-6">
                <q-input filled bg-color="grey-4" v-model="local.email" label="Email *" type="email"
                    :rules="[required, emailRule]" />
            </div>

            <div class="col-12">
                <q-input filled bg-color="grey-4" v-model="local.address" label="Business Address *"
                    :rules="[required]" />
            </div>

            <div class="col-12 col-md-4">
                <q-input filled bg-color="grey-4" v-model="local.city" label="City *" :rules="[required]" />
            </div>
            <div class="col-6 col-md-3">
                <q-select filled bg-color="grey-4" v-model="local.state" :options="stateOptions" label="State *"
                    emit-value map-options :rules="[required]" />
            </div>
            <div class="col-6 col-md-3">
                <q-input filled bg-color="grey-4" v-model="local.zip" label="ZIP *" mask="#####-####" fill-mask
                    :rules="[required, zipRule]" />
            </div>
            <div class="col-12 col-md-2">
                <q-input filled bg-color="grey-4" v-model="local.county" label="County" />
            </div>
        </div>

        <!-- Mailing address -->
        <q-toggle v-model="local.mailingDifferent" label="Mailing address is different"
            class="q-mt-none q-mb-none q-pb-none"
            @update:model-value="val => val && (local.mailing ??= { address: '', city: '', state: '', zip: '' })" />
        <div v-if="local.mailingDifferent" class="row q-col-gutter-md q-mt-none">
            <div class="col-12">
                <q-input filled bg-color="grey-4" v-model="(local.mailing!.address)" label="Mailing Street" />
            </div>
            <div class="col-12 col-md-5">
                <q-input filled bg-color="grey-4" v-model="(local.mailing!.city)" label="Mailing City" />
            </div>
            <div class="col-6 col-md-3">
                <q-select filled bg-color="grey-4" v-model="(local.mailing!.state)" :options="stateOptions"
                    label="Mailing State" emit-value map-options />
            </div>
            <div class="col-6 col-md-4">
                <q-input filled bg-color="grey-4" v-model="(local.mailing!.zip)" label="Mailing ZIP" mask="#####-####"
                    fill-mask />
            </div>
        </div>

        <!-- Business meta -->
        <div class="row q-col-gutter-md">
            <div class="col-12 col-md-4">
                <q-input filled bg-color="grey-4" v-model="local.primaryBusiness" label="Primary Type of Business" />
            </div>
            <div class="col-12 col-md-4">
                <q-select filled bg-color="grey-4" v-model="local.entityType"
                    :options="['Proprietorship', 'Partnership', 'Corporation', 'Branch']" label="Entity Type *"
                    :rules="[required]" />
            </div>
            <div class="col-12 col-md-4">
                <q-select filled bg-color="grey-4" v-model="local.stateOfIncorp" :options="stateOptions"
                    label="State of Incorporation/Registration" emit-value map-options />
            </div>
            <!-- <div class="col-12 col-md-3">
                <q-input filled bg-color="grey-4" v-model="local.yearsInBusiness" label="Years in Business"
                    type="number" min="0" />
            </div> -->
        </div>

        <!-- Contacts -->
        <div class="q-gutter-sm">
            <div class="text-subtitle2">Contacts</div>
            <div class="row q-col-gutter-md">
                <div class="col-12 col-md-4">
                    <q-card flat bordered>
                        <q-card-section class="text-bold">Main Contact</q-card-section>
                        <q-card-section class="q-gutter-sm">
                            <q-input filled bg-color="grey-4" v-model="local.contacts[0]!.name" label="Name" />
                            <q-input filled bg-color="grey-4" v-model="local.contacts[0]!.title" label="Title" />
                            <q-input filled bg-color="grey-4" v-model="local.contacts[0]!.email" label="Email"
                                type="email" />
                        </q-card-section>
                    </q-card>
                </div>
                <div class="col-12 col-md-4">
                    <q-card flat bordered>
                        <q-card-section class="text-bold">Accounting Contact</q-card-section>
                        <q-card-section class="q-gutter-sm">
                            <q-input filled bg-color="grey-4" v-model="local.contacts[1]!.name" label="Name" />
                            <q-input filled bg-color="grey-4" v-model="local.contacts[1]!.title" label="Title" />
                            <q-input filled bg-color="grey-4" v-model="local.contacts[1]!.email" label="Email"
                                type="email" />
                        </q-card-section>
                    </q-card>
                </div>
                <div class="col-12 col-md-4">
                    <q-card flat bordered>
                        <q-card-section class="text-bold">Additional Contact</q-card-section>
                        <q-card-section class="q-gutter-sm">
                            <q-input filled bg-color="grey-4" v-model="local.contacts[2]!.name" label="Name" />
                            <q-input filled bg-color="grey-4" v-model="local.contacts[2]!.title" label="Title" />
                            <q-input filled bg-color="grey-4" v-model="local.contacts[2]!.email" label="Email"
                                type="email" />
                        </q-card-section>
                    </q-card>
                </div>
            </div>
        </div>

        <div class="row q-col-gutter-md q-mb-md">
            <div class="col-12 col-md-6">
                <q-toggle v-model="local.requestLineOfCredit" label="Requesting a line of credit?" />
            </div>
            <!-- <div class="col-12 col-md-6">
                <q-toggle v-model="local.requestTaxExempt" label="Requesting tax exemption?" />
            </div> -->
        </div>

        <q-btn color="primary" label="Next" @click="onNext" class="q-mt-md" />
    </q-form>
</template>

<style></style>
