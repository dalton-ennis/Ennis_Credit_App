<script setup lang="ts">
import type { CreditForm } from '../types'
const props = defineProps<{ form: CreditForm }>()
const emit = defineEmits(['back'])
</script>

<template>
    <div class="q-pa-md">
        <q-card flat bordered>
            <q-card-section class="text-h6">Review Your Application</q-card-section>
            <q-separator />
            <q-card-section>
                <pre>{{ JSON.stringify(props.form, null, 2) }}</pre>
            </q-card-section>
        </q-card>

        <div class="row q-gutter-sm q-mt-md">
            <q-btn color="secondary" label="Back" @click="emit('back')" />
            <q-btn color="primary" label="Submit" />
        </div>
    </div>
</template>
