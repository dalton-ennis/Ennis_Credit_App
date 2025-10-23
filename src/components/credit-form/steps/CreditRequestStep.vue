<script setup lang="ts">
import type { CreditForm } from '../types'
const props = defineProps<{ modelValue: CreditForm }>()
const emit = defineEmits(['update:modelValue', 'next', 'back'])
const form = props.modelValue
</script>

<template>
    <div class="q-gutter-md">
        <q-input v-model.number="form.creditAmount" label="Requested Credit Limit" type="number" prefix="$" />
        <q-toggle v-model="form.poRequired" label="Purchase Order Required?" />

        <div class="row q-gutter-sm">
            <q-btn color="secondary" label="Back" @click="emit('back')" />
            <q-btn color="primary" label="Next" @click="emit('next')" />
        </div>
    </div>
</template>
