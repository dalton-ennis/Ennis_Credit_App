<script setup lang="ts">
import { ref, watch, computed, defineExpose } from 'vue'
import type { CreditForm } from '../types'
import { useQuasar, type QForm } from 'quasar'
import { stateOptions } from '../utilities'
import { required } from '../../../utility/validators' // you already have this

const props = defineProps<{ modelValue: CreditForm }>()
const emit = defineEmits(['update:modelValue', 'next', 'back'])
const $q = useQuasar()

/** UI defaults */
const fieldUi = { filled: true, 'bg-color': 'grey-4', dense: true } as const

/** Local state (avoid mutating props directly) */
const isResale = ref<boolean>(!!props.modelValue.isResale)
const exemptStates = ref<string[]>([...(props.modelValue.exemptStates || [])])
const resaleNumbers = ref<Record<string, string>>({ ...(props.modelValue.resaleNumbers || {}) })

/** Keep resaleNumbers keys aligned with selected states */
watch(exemptStates, (states) => {
    // add missing keys
    for (const s of states) {
        if (!(s in resaleNumbers.value)) resaleNumbers.value[s] = ''
    }
    // remove stale keys
    for (const k of Object.keys(resaleNumbers.value)) {
        if (!states.includes(k)) delete resaleNumbers.value[k]
    }
})

/** Emit up to parent whenever anything changes */
watch([isResale, exemptStates, resaleNumbers], () => {
    emit('update:modelValue', {
        ...props.modelValue,
        isResale: isResale.value,
        exemptStates: [...exemptStates.value],
        resaleNumbers: { ...resaleNumbers.value }
    })
}, { deep: true })

/** Quasar form + validation */
const formRef = ref<QForm | null>(null)

function hasAllResaleNumbers(): true | string {
    if (!isResale.value) return true
    if (!exemptStates.value.length) return 'Select at least one state'
    for (const s of exemptStates.value) {
        const v = resaleNumbers.value[s]
        if (!v || !String(v).trim()) return `Enter resale number for ${s}`
    }
    return true
}

async function onNext() {
    if (!isResale.value) { emit('next'); return }

    const okFields = await formRef.value?.validate()
    const msg = hasAllResaleNumbers() // true | string

    if (okFields && msg === true) {
        emit('next')
    } else if (msg !== true) {
        $q.notify({ type: 'negative', message: msg })
    }
}
function onBack() { emit('back') }

/** Expose to parent (so header clicks can trigger it) */
async function validate() {
    if (!isResale.value) return true
    const okFields = await formRef.value?.validate()
    return okFields && hasAllResaleNumbers() === true
}
defineExpose({ validate })

const hasNY = computed(() => exemptStates.value.includes('NY'))
</script>

<template>
    <div class="q-gutter-md">
        <q-form ref="formRef" greedy>
            <q-toggle v-model="isResale" label="Do you claim resale or tax exemption?" />

            <div v-if="isResale" class="q-mt-md">
                <q-select v-bind="fieldUi" v-model="exemptStates" :options="stateOptions" label="Exempt States *"
                    multiple emit-value map-options :rules="[required]" use-chips />

                <div v-if="hasNY" class="text-italic text-warning q-mt-xs">
                    New York selected — you’ll complete the NY ST-120 form next.
                </div>

                <div class="q-mt-md">
                    <div class="text-subtitle2 q-mb-xs">Resale / Exemption Numbers</div>
                    <div v-for="state in exemptStates" :key="state" class="row q-col-gutter-md items-center q-mb-sm">
                        <div class="col-12 col-md-4 text-bold">{{ state }}</div>
                        <div class="col-12 col-md-8">
                            <q-input v-bind="fieldUi" v-model="resaleNumbers[state]"
                                :label="`Resale/Exemption Number for ${state} *`" :rules="[required]" />
                        </div>
                    </div>
                </div>
            </div>
        </q-form>

        <div class="row q-gutter-sm q-mt-md">
            <q-btn color="secondary" label="Back" @click="onBack" />
            <q-btn color="primary" label="Next" @click="onNext" />
        </div>
    </div>
</template>
