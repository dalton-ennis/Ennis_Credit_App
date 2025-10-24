<script setup lang="ts">
import type { CreditForm } from '../types'
const props = defineProps<{ modelValue: CreditForm }>()
const emit = defineEmits(['update:modelValue', 'next', 'back'])
const form = props.modelValue
</script>

<template>
    <div class="q-gutter-md">
        <div v-for="(s, i) in form.signers" :key="i" class="q-pa-md bg-grey-2 rounded-borders q-mb-md">
            <q-input filled bg-color="grey-4" v-model="s.name" label="Signer Name *" />
            <q-input filled bg-color="grey-4" v-model="s.title" label="Title *" />
            <q-toggle v-model="s.agree" label="I agree to the credit terms" />
        </div>

        <div class="row q-gutter-sm">
            <q-btn color="secondary" label="Back" @click="emit('back')" />
            <q-btn color="primary" label="Next" @click="emit('next')" />
        </div>
    </div>
</template>
