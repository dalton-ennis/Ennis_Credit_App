<script setup lang="ts">
import { computed, ref } from 'vue'
import type { CreditForm, NYSt120 } from '../types'
import type { QForm } from 'quasar'
import { required } from '../../../utility//validators'

const props = defineProps<{ modelValue: CreditForm }>()
const emit = defineEmits(['update:modelValue', 'next', 'back'])

/** Field UI defaults */
const fieldUi = { filled: true, 'bg-color': 'grey-4', dense: true } as const

/** Default NY ST-120 shape (prevents optional chaining assignments) */
const emptyNY = (): NYSt120 => ({
    purchaserName: '',
    purchaserAddress: '',
    nyRegistration: '',
    vendorName: '',
    signerName: '',
    signerTitle: '',
    signerDate: ''
})

/** Two-way computed model with safe default */
const ny = computed<NYSt120>({
    get: () => props.modelValue.nySt120 ?? emptyNY(),
    set: (val) => {
        emit('update:modelValue', { ...props.modelValue, nySt120: { ...val } })
    }
})

/** Quasar form + validate exposure */
const formRef = ref<QForm | null>(null)

async function onNext() {
    const ok = await formRef.value?.validate()
    if (ok) emit('next')
}
function onBack() {
    emit('back')
}

/** Expose validate() so header clicks can trigger it from parent stepper */
async function validate() {
    return await formRef.value?.validate()
}
defineExpose({ validate })
</script>

<template>
    <div class="q-gutter-md">
        <q-form ref="formRef" greedy>
            <div class="row q-col-gutter-md">
                <div class="col-12 col-md-6">
                    <q-input v-bind="fieldUi" v-model="ny.purchaserName" label="Purchaser Name *" :rules="[required]" />
                </div>
                <div class="col-12 col-md-6">
                    <q-input v-bind="fieldUi" v-model="ny.purchaserAddress" label="Purchaser Address *"
                        :rules="[required]" />
                </div>

                <div class="col-12 col-md-6">
                    <q-input v-bind="fieldUi" v-model="ny.nyRegistration" label="NY Registration # *"
                        :rules="[required]" />
                </div>
                <div class="col-12 col-md-6">
                    <q-input v-bind="fieldUi" v-model="ny.vendorName" label="Vendor Name *" :rules="[required]" />
                </div>
            </div>

            <q-separator class="q-my-md" />

            <div class="text-subtitle2 q-mb-sm">Signer</div>
            <div class="row q-col-gutter-md">
                <div class="col-12 col-md-4">
                    <q-input v-bind="fieldUi" v-model="ny.signerName" label="Signer Name *" :rules="[required]" />
                </div>
                <div class="col-12 col-md-4">
                    <q-input v-bind="fieldUi" v-model="ny.signerTitle" label="Signer Title *" :rules="[required]" />
                </div>
                <div class="col-12 col-md-4">
                    <!-- Use date input for simplicity; replace with QDate/QInputMask if preferred -->
                    <q-input v-bind="fieldUi" v-model="ny.signerDate" label="Date *" type="date" :rules="[required]" />
                </div>
            </div>
        </q-form>

        <div class="row q-gutter-sm q-mt-md">
            <q-btn color="secondary" label="Back" @click="onBack" />
            <q-btn color="primary" label="Next" @click="onNext" />
        </div>
    </div>
</template>
