<script setup lang="ts">
import type { CreditForm } from '../types'
const props = defineProps<{ modelValue: CreditForm }>()
const emit = defineEmits(['update:modelValue', 'next', 'back'])
const form = props.modelValue
</script>

<template>
    <div class="q-gutter-md">
        <div v-for="(owner, i) in form.owners" :key="i" class="q-pa-md q-mb-md bg-grey-4 rounded-borders">
            <q-input v-model="owner.name" label="Owner Name *" />
            <q-input v-model="owner.title" label="Title *" />
            <q-input v-model="owner.ssn" label="SSN" mask="###-##-####" />
            <q-toggle v-model="owner.fullTime" label="Full-time?" />
        </div>

        <div class="row q-gutter-sm">
            <q-btn color="secondary" label="Back" @click="emit('back')" />
            <q-btn color="primary" label="Next" @click="emit('next')" />
        </div>
    </div>
</template>
