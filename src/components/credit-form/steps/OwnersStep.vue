<script setup lang="ts">
import { ref, watch } from 'vue'
import type { CreditForm, Owner, Address } from '../types'
import type { QForm } from 'quasar'
import { required, ssnRule, zipRule } from "../../../utility/validators"
import { stateOptions } from '../utilities' // adjust import to your path

const props = defineProps<{ modelValue: CreditForm }>()
const emit = defineEmits(['update:modelValue', 'next', 'back'])

/** UI defaults for your darker fields */
const fieldUi = { filled: true, 'bg-color': 'grey-4', dense: true } as const

/** helpers */
const emptyAddr = (): Address => ({ address: '', city: '', state: '', zip: '' })
const emptyOwner = (): Owner => ({
    name: '',
    title: '',
    ssn: '',
    fullTime: false,
    homeAddress: emptyAddr()
})

/** Local editable copy to avoid mutating props */
const owners = ref<Owner[]>(
    (props.modelValue.owners?.length ? props.modelValue.owners : [emptyOwner()])
        .map(o => ({ ...o, homeAddress: o.homeAddress ?? emptyAddr() }))
)

/** Keep parent in sync on any change */
watch(owners, (val) => {
    emit('update:modelValue', { ...props.modelValue, owners: val.map(o => ({ ...o })) })
}, { deep: true })

/** List controls */
function addOwner() {
    owners.value.push(emptyOwner())
}
function removeOwner(i: number) {
    if (owners.value.length > 1) owners.value.splice(i, 1)
}

/** Quasar form + validate exposure */
const formRef = ref<QForm | null>(null)
async function onNext() {
    const ok = await formRef.value?.validate()
    if (ok) emit('next')
}
function onBack() { emit('back') }
async function validate() { return await formRef.value?.validate() }
defineExpose({ validate })
</script>

<template>
    <div class="q-gutter-md">
        <q-form ref="formRef" greedy>
            <div class="row items-center justify-between">
                <div class="text-subtitle2">Owners & Officers</div>
                <q-btn color="primary" flat icon="add" label="Add owner" @click="addOwner" />
            </div>

            <div v-for="(owner, i) in owners" :key="i" class="q-pa-md q-mb-md bg-grey-2 rounded-borders">
                <div class="row q-col-gutter-md">
                    <div class="col-12 col-md-4">
                        <q-input v-bind="fieldUi" v-model="owner.name" label="Owner Name *" :rules="[required]" />
                    </div>
                    <div class="col-12 col-md-4">
                        <q-input v-bind="fieldUi" v-model="owner.title" label="Title *" :rules="[required]" />
                    </div>
                    <div class="col-12 col-md-4">
                        <q-input v-bind="fieldUi" v-model="owner.ssn" label="SSN *" mask="###-##-####"
                            :rules="[required, ssnRule]" />
                    </div>
                </div>

                <div class="q-mt-sm">
                    <q-toggle v-model="owner.fullTime" label="Full-time?" />
                </div>

                <q-separator class="q-my-sm" />

                <div class="text-caption text-weight-medium q-mb-xs">Home Address</div>
                <div class="row q-col-gutter-md">
                    <div class="col-12">
                        <q-input v-bind="fieldUi" v-model="owner.homeAddress!.address" label="Street *"
                            :rules="[required]" />
                    </div>
                    <div class="col-12 col-md-5">
                        <q-input v-bind="fieldUi" v-model="owner.homeAddress!.city" label="City *"
                            :rules="[required]" />
                    </div>
                    <div class="col-6 col-md-3">
                        <q-select v-bind="fieldUi" v-model="owner.homeAddress!.state" :options="stateOptions"
                            label="State *" emit-value map-options :rules="[required]" />
                    </div>
                    <div class="col-6 col-md-4">
                        <q-input v-bind="fieldUi" v-model="owner.homeAddress!.zip" label="ZIP *"
                            :rules="[required, zipRule]" mask="#####-####" fill-mask />
                    </div>
                </div>

                <div class="q-mt-sm">
                    <q-btn color="negative" flat icon="delete" label="Remove owner" :disable="owners.length <= 1"
                        @click="removeOwner(i)" />
                </div>
            </div>
        </q-form>

        <div class="row q-gutter-sm q-mt-md">
            <q-btn color="secondary" label="Back" @click="onBack" />
            <q-btn color="primary" label="Next" @click="onNext" />
        </div>
    </div>
</template>
