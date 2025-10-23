<script setup lang="ts">
import type { CreditForm } from '../types'
import { stateOptions } from '../utilities';
const props = defineProps<{ modelValue: CreditForm }>()
const emit = defineEmits(['update:modelValue', 'next', 'back'])
const form = props.modelValue
</script>

<template>
    <div class="q-gutter-md">
        <q-toggle v-model="form.isResale" label="Do you claim resale or tax exemption?" />

        <div v-if="form.isResale" class="q-mt-md">
            <q-select v-model="form.exemptStates" :options="stateOptions" label="Exempt States" multiple />

            <div v-for="(state) in form.exemptStates" :key="state" class="row q-mt-sm items-center">
                <div class="col-4 text-bold">{{ state }}</div>
                <div class="col-8">
                    <q-input v-model="form.resaleNumbers[state]" label="Resale Number" dense />
                </div>
            </div>
        </div>

        <div class="row q-gutter-sm q-mt-md">
            <q-btn color="secondary" label="Back" @click="emit('back')" />
            <q-btn color="primary" label="Next" @click="emit('next')" />
        </div>
    </div>
</template>
