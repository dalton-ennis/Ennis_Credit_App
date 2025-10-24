<script setup lang="ts">
import { ref, computed, type Component } from 'vue'
import { useCreditForm } from './useCreditForm'
import {
    BusinessInfoStep,
    OwnersStep,
    CreditRequestStep,
    BankReferenceStep,
    SupplierReferencesStep,
    ResaleStep,
    NYStep,
    SignatureStep,
    ReviewStep
} from './steps'
import type { CreditForm } from './types'

const { form } = useCreditForm()

type StepId =
    | 'business'
    | 'credit'
    | 'owners'
    | 'bank'
    | 'trade'
    | 'resale'
    | 'ny'
    | 'sign'
    | 'review'

type StepDef = {
    id: StepId
    title: string
    component: Component        // ✅ instead of `any`
    show?: (f: CreditForm) => boolean
}

// Base order (semantic)
const allSteps: StepDef[] = [
    { id: 'business', title: 'Business Info', component: BusinessInfoStep },
    { id: 'credit', title: 'Credit Request', component: CreditRequestStep, show: f => !!f.requestLineOfCredit },
    { id: 'owners', title: 'Owners & Officers', component: OwnersStep },
    {
        id: 'bank', title: 'Bank Reference', component: BankReferenceStep,
        show: f => !!f.requestLineOfCredit
    },
    {
        id: 'trade', title: 'Supplier References', component: SupplierReferencesStep,
        show: f => !!f.requestLineOfCredit
    },
    { id: 'sign', title: 'Sign & Consent', component: SignatureStep },
    { id: 'review', title: 'Review & Submit', component: ReviewStep },
    // Conditional tails
    {
        id: 'resale', title: 'Resale/Exemption', component: ResaleStep,
        show: f => !!f.isResale && (!f.exemptStates?.includes('NY'))
    },
    {
        id: 'ny', title: 'NY ST-120', component: NYStep,
        show: f => !!f.isResale && f.exemptStates?.includes('NY')
    }
]

// Filtered, in order, based on current form state
const steps = computed(() =>
    allSteps.filter(s => (s.show ? s.show(form.value) : true))
)

// Current step is an ID, not a number
const current = ref<StepId>('business')

// For :done states and navigation
const currentIndex = computed(() => steps.value.findIndex(s => s.id === current.value))

function next() {
    const i = currentIndex.value
    if (i < steps.value.length - 1) current.value = steps.value[i + 1]!.id
}

function back() {
    const i = currentIndex.value
    if (i > 0) current.value = steps.value[i - 1]!.id
}
</script>

<template>
    <q-card flat bordered class="rounded-borders">
        <!-- v-model is the step ID -->
        <q-stepper v-model="current" animated color="primary" header-class="bg-grey-2 q-pa-sm rounded-borders">
            <template v-for="(s, i) in steps" :key="s.id">
                <q-step :name="s.id" :done="i < currentIndex" :title="s.title">
                    <component :is="s.component" v-model="form" @next="next" @back="back" />
                </q-step>
            </template>
        </q-stepper>
    </q-card>
</template>

<style scoped>
.rounded-borders {
    border-radius: 12px;
}
</style>
