<script setup lang="ts">
import { ref, watch } from 'vue'
import type { CreditForm, Bank, Address } from '../types'
import { stateOptions } from '../utilities';

const props = defineProps<{ modelValue: CreditForm }>()
const emit = defineEmits(['update:modelValue', 'next', 'back'])

// small helpers
const emptyAddr = (): Address => ({ address: '', city: '', state: '', zip: '' })
const emptyBank = (): Bank => ({
    name: '',
    accountNo: '',
    phone: '',
    fax: '',
    email: '',
    address: emptyAddr()
})

// local, editable copy to avoid mutating props
const localBank = ref<Bank>(props.modelValue.bank ? { ...props.modelValue.bank } : emptyBank())

// sync up to parent on any change
watch(
    localBank,
    (val) => {
        emit('update:modelValue', { ...props.modelValue, bank: { ...val } })
    },
    { deep: true }
)
</script>

<template>
    <div class="q-gutter-md">

        <div class="row q-col-gutter-md">
            <div class="col-12 col-md-6">
                <q-input v-model="localBank.name" label="Bank Name *" />
            </div>
            <div class="col-12 col-md-6">
                <q-input v-model="localBank.accountNo" label="Account # *" />
            </div>

            <div class="col-12 col-md-4">
                <q-input v-model="localBank.phone" label="Phone" mask="(###) ###-####" fill-mask />
            </div>
            <div class="col-12 col-md-4">
                <q-input v-model="localBank.fax" label="Fax" mask="(###) ###-####" fill-mask />
            </div>
            <div class="col-12 col-md-4">
                <q-input v-model="localBank.email" label="Email" type="email" />
            </div>
        </div>

        <q-separator />

        <div class="text-subtitle2">Bank Address</div>
        <div class="row q-col-gutter-md">
            <div class="col-12">
                <q-input v-model="localBank.address.address" label="Street" />
            </div>
            <div class="col-12 col-md-5">
                <q-input v-model="localBank.address.city" label="City" />
            </div>
            <div class="col-6 col-md-3">
                <q-select v-model="localBank.address.state" :options="stateOptions" label="State" emit-value
                    map-options />
            </div>
            <div class="col-6 col-md-4">
                <q-input v-model="localBank.address.zip" label="ZIP" mask="#####-####" fill-mask />
            </div>
        </div>

        <div class="row q-gutter-sm q-mt-md">
            <q-btn color="secondary" label="Back" @click="emit('back')" />
            <q-btn color="primary" label="Next" @click="emit('next')" />
        </div>
    </div>
</template>
