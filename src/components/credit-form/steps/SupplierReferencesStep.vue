<script setup lang="ts">
import { ref, watch } from 'vue'
import type { CreditForm, TradeRef, Address } from '../types'
import { stateOptions } from '../utilities'

const props = defineProps<{ modelValue: CreditForm }>()
const emit = defineEmits(['update:modelValue', 'next', 'back'])

/* helpers */
const emptyAddr = (): Address => ({ address: '', city: '', state: '', zip: '' })
const emptyRef = (): TradeRef => ({
    name: '',
    accountNo: '',
    phone: '',
    fax: '',
    email: '',
    address: emptyAddr()
})

/* local editable copy (no prop mutation) */
const localRefs = ref<TradeRef[]>(
    props.modelValue.tradeRefs?.length
        ? props.modelValue.tradeRefs.map(r => ({ ...r, address: r.address ?? emptyAddr() }))
        : [emptyRef(), emptyRef(), emptyRef()]
)

/* keep parent in sync */
watch(
    localRefs,
    (val) => {
        emit('update:modelValue', {
            ...props.modelValue,
            tradeRefs: val.map(r => ({ ...r, address: r.address ?? emptyAddr() }))
        })
    },
    { deep: true }
)

/* list controls */
function addRef() {
    localRefs.value.push(emptyRef())
}
function removeRef(i: number) {
    if (localRefs.value.length > 3) {
        localRefs.value.splice(i, 1)
    }
}
</script>

<template>
    <div class="q-gutter-md">

        <div class="row items-center justify-between">
            <div class="text-subtitle2">Trade / Supplier References (minimum 3)</div>
            <q-btn color="primary" flat icon="add" label="Add reference" @click="addRef" />
        </div>

        <div v-for="(r, i) in localRefs" :key="i" class="q-pa-md q-mb-md bg-grey-2 rounded-borders">
            <div class="row q-col-gutter-md">
                <div class="col-12 col-md-6">
                    <q-input v-model="r.name" label="Supplier Name *" />
                </div>
                <div class="col-12 col-md-6">
                    <q-input v-model="r.accountNo" label="Account #" />
                </div>

                <div class="col-12 col-md-4">
                    <q-input v-model="r.phone" label="Phone" mask="(###) ###-####" fill-mask />
                </div>
                <div class="col-12 col-md-4">
                    <q-input v-model="r.fax" label="Fax" mask="(###) ###-####" fill-mask />
                </div>
                <div class="col-12 col-md-4">
                    <q-input v-model="r.email" label="Email" type="email" />
                </div>
            </div>

            <q-separator class="q-my-sm" />

            <div class="text-caption text-weight-medium q-mb-xs">Supplier Address</div>
            <div class="row q-col-gutter-md">
                <div class="col-12">
                    <q-input v-model="(r.address!.address)" label="Street" />
                </div>
                <div class="col-12 col-md-5">
                    <q-input v-model="(r.address!.city)" label="City" />
                </div>
                <div class="col-6 col-md-3">
                    <q-select v-model="(r.address!.state)" :options="stateOptions" label="State" emit-value
                        map-options />
                </div>
                <div class="col-6 col-md-4">
                    <q-input v-model="(r.address!.zip)" label="ZIP" mask="#####-####" fill-mask />
                </div>
            </div>

            <div class="q-mt-sm">
                <q-btn color="negative" flat icon="delete" label="Remove" :disable="localRefs.length <= 3"
                    @click="removeRef(i)" />
            </div>
        </div>

        <div class="row q-gutter-sm q-mt-md">
            <q-btn color="secondary" label="Back" @click="emit('back')" />
            <q-btn color="primary" label="Next" @click="emit('next')" />
        </div>
    </div>
</template>
