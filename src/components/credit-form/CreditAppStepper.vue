<script setup lang="ts">
import { ref, computed, watch, type Component, type ComponentPublicInstance } from 'vue'
import {
    BusinessInfoStep,
    CreditRequestStep,
    TaxExemptionStep,
    SignatureStep,
    ReviewStep
} from './steps'
import type { CreditForm } from './types'
import { useWizardStore } from 'src/stores/wizard'

const props = defineProps<{ modelValue: CreditForm }>()
const emit = defineEmits(['update:modelValue'])
const form = computed({
    get: () => props.modelValue,
    set: (v: CreditForm) => emit('update:modelValue', v)
})

type StepId =
    | 'business'
    | 'credit'
    | 'tax'
    | 'sign'
    | 'review'

type StepDef = {
    id: StepId
    title: string
    component: Component        // ✅ instead of `any`
    icon?: string
    show?: (f: CreditForm) => boolean,
}

// Base order (semantic)
const allSteps: StepDef[] = [
    { id: 'business', title: 'Business Info', component: BusinessInfoStep, icon: "apartment" },
    { id: 'credit', title: 'Credit Request', component: CreditRequestStep, show: f => !!f.requestLineOfCredit, icon: 'request_quote' },
    { id: 'tax', title: 'Sales Tax Exemption', component: TaxExemptionStep, show: f => !!f.requestTaxExempt, icon: 'receipt_long' },
    { id: 'sign', title: 'Sign & Consent', component: SignatureStep, icon: "draw" },
    { id: 'review', title: 'Review & Submit', component: ReviewStep, icon: "fact_check" },
]
interface StepComponent extends ComponentPublicInstance {
    validate?: () => Promise<boolean>
}
// Filtered, in order, based on current form state
const steps = computed(() =>
    allSteps.filter(s => (s.show ? s.show(form.value) : true))
)

// Current step is an ID, not a number
const current = ref<StepId>('business')
const wizard = useWizardStore()
// eslint-disable-next-line @typescript-eslint/no-explicit-any
watch(current, (v) => wizard.setCurrent(v as any), { immediate: true })

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

const stepRefs: Record<string, StepComponent | null> = {}

function setStepRef(id: StepId, el: StepComponent | null) {
    if (el) stepRefs[id] = el
}

async function validateCurrentStep() {
    const inst = stepRefs[current.value as string]
    if (inst && typeof inst.validate === 'function') {
        return await inst.validate()
    }
    return true
}

async function nextValidated() {
    const ok = await validateCurrentStep()
    if (!ok) return false
    next()
    return true
}

defineExpose({ next, back, current, nextValidated, validateCurrentStep })
</script>

<template>
    <q-card flat bordered class="rounded-borders">
        <!-- v-model is the step ID -->
        <q-stepper v-model="current" animated color="primary" header-class="bg-grey-2 q-pa-sm rounded-borders">
            <template v-for="(s, i) in steps" :key="s.id">
                <q-step :name="s.id" :done="i < currentIndex" :title="s.title" :icon="s.icon">
                    <component :is="s.component" v-model="form" @next="next" @back="back"
                        :ref="(el: ComponentPublicInstance | null) => setStepRef(s.id, el)" />
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
