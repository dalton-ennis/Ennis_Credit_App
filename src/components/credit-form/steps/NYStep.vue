<script setup lang="ts">
import { computed } from 'vue'
import type { CreditForm } from '../types'

const props = defineProps<{ modelValue: CreditForm }>()
const emit = defineEmits(['update:modelValue', 'next', 'back'])

const ny = computed({
    get: () => props.modelValue.nySt120 || {},
    set: (val) => {
        emit('update:modelValue', {
            ...props.modelValue,
            nySt120: val
        })
    }
})
</script>

<template>
    <div class="q-gutter-md">
        <q-input v-model="ny.purchaserName" label="Purchaser Name" />
        <q-input v-model="ny.purchaserAddress" label="Purchaser Address" />
        <q-input v-model="ny.nyRegistration" label="NY Registration #" />
        <q-input v-model="ny.vendorName" label="Vendor Name" />

        <div class="row q-gutter-sm">
            <q-btn color="secondary" label="Back" @click="emit('back')" />
            <q-btn color="primary" label="Next" @click="emit('next')" />
        </div>
    </div>
</template>
