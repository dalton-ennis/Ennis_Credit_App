<script setup lang="ts">
import { ref, watch, computed, defineExpose } from 'vue'
import type { CreditForm } from '../types'
import { QForm } from 'quasar';

const props = defineProps<{ modelValue: CreditForm }>()
const emit = defineEmits(['update:modelValue', 'next', 'back'])

/** UI defaults for fields */
const fieldUi = { filled: true, 'bg-color': 'grey-4', dense: true } as const

/** Local state (avoid mutating props directly) */
const creditAmount = ref<number | null>(props.modelValue.creditAmount ?? null)
const poRequired = ref<boolean>(!!props.modelValue.poRequired)

/** Gate: only validate when requesting a line of credit */
const requestingLOC = computed(() => props.modelValue.requestLineOfCredit === true)

/** Sync up to parent on changes */
watch([creditAmount, poRequired], () => {
    emit('update:modelValue', {
        ...props.modelValue,
        creditAmount: creditAmount.value,
        poRequired: poRequired.value
    })
})

/** Quasar form & rules */

const formRef = ref<QForm | null>(null)

// inside CreditRequestStep.vue <script setup>
const requiredIfLOC = (v: unknown) => {
    if (!requestingLOC.value) return true

    // accept only finite numbers (0 is valid if you want)
    if (typeof v === 'number') return Number.isFinite(v) || 'Required'

    // if something stringy leaks in, treat empty as invalid
    if (typeof v === 'string') return v.trim().length > 0 || 'Required'

    // everything else (null/undefined/objects) -> invalid
    return 'Required'
}

const nonNegative = (v: number | null | undefined) =>
    (v == null || v >= 0) ? true : 'Must be ≥ 0'

async function onNext() {
    // If not requesting LOC, no validation needed here
    if (!requestingLOC.value) return emit('next')

    const ok = await formRef.value?.validate()
    if (ok) emit('next')
}

function onBack() {
    emit('back')
}

/** Expose validate() for parent stepper if you want header click to trigger it */
async function validate() {
    if (!requestingLOC.value) return true
    return await formRef.value?.validate()
}
defineExpose({ validate })
</script>

<template>
    <div class="q-gutter-md">
        <q-form ref="formRef" greedy>
            <div class="row q-col-gutter-md">
                <div class="col-12 col-md-6">
                    <q-input v-bind="fieldUi" v-model.number="creditAmount" label="Requested Credit Limit" type="number"
                        prefix="$" :disable="!requestingLOC" :rules="[requiredIfLOC, nonNegative]"
                        hint="Enter 0 if undecided; leave blank to discuss" />
                </div>

                <div class="col-12 col-md-6 flex items-center">
                    <q-toggle v-model="poRequired" label="Purchase Order Required?" :disable="!requestingLOC" />
                </div>
            </div>

            <div v-if="!requestingLOC" class="text-caption text-italic q-mt-sm">
                Not requesting a line of credit — this step is optional and will be skipped.
            </div>
        </q-form>

        <div class="row q-gutter-sm q-mt-md">
            <q-btn color="secondary" label="Back" @click="onBack" />
            <q-btn color="primary" label="Next" @click="onNext" />
        </div>
    </div>
</template>
