<script setup lang="ts">
import { ref, watch } from 'vue'
import type { CreditForm, TradeRef, Address } from '../types'
import type { QForm } from 'quasar'
import { useQuasar } from 'quasar'
import { stateOptions } from '../utilities'
import { required, emailRule, phoneRule, zipRule } from '../../../utility/validators'

const props = defineProps<{ modelValue: CreditForm }>()
const emit = defineEmits(['update:modelValue', 'next', 'back'])

const $q = useQuasar()
const fieldUi = { filled: true, 'bg-color': 'grey-4', dense: true } as const

/* helpers */
const emptyAddr = (): Address => ({ address: '', city: '', state: '', zip: '' })
const emptyRef = (): TradeRef => ({
    name: '',
    accountNo: '',
    phone: '',
    fax: '',
    email: '',
    address: emptyAddr()
})

/* local editable copy (no prop mutation) */
const localRefs = ref<TradeRef[]>(
    props.modelValue.tradeRefs?.length
        ? props.modelValue.tradeRefs.map(r => ({ ...r, address: r.address ?? emptyAddr() }))
        : [emptyRef(), emptyRef(), emptyRef()]
)

/* keep parent in sync */
watch(localRefs, (val) => {
    emit('update:modelValue', {
        ...props.modelValue,
        tradeRefs: val.map(r => ({ ...r, address: r.address ?? emptyAddr() }))
    })
}, { deep: true })

/* list controls */
function addRef() { localRefs.value.push(emptyRef()) }
function removeRef(i: number) { if (localRefs.value.length > 3) localRefs.value.splice(i, 1) }

/* Quasar form + validation */
const formRef = ref<QForm | null>(null)

/** Rule factory: require Phone OR Email */
const phoneOrEmail = (r: TradeRef) => (v: string) =>
    ((v && v.trim()) || (r.email && r.email.trim())) ? true : 'Provide phone or email'
const emailOrPhone = (r: TradeRef) => (v: string) =>
    ((v && v.trim()) || (r.phone && r.phone.trim())) ? true : 'Provide email or phone'

async function onNext() {
    // must have at least 3
    if (localRefs.value.length < 3) {
        $q.notify({ type: 'negative', message: 'Add at least 3 trade references' })
        return
    }
    const ok = await formRef.value?.validate()
    if (ok) emit('next')
}
function onBack() { emit('back') }

/** expose validate() so the stepper can call it on header click */
async function validate() {
    if (localRefs.value.length < 3) return false
    return await formRef.value?.validate()
}
defineExpose({ validate })
</script>

<template>
    <div class="q-gutter-md">
        <q-form ref="formRef" greedy>
            <div class="row items-center justify-between">
                <div class="text-subtitle2">Trade / Supplier References (minimum 3)</div>
                <q-btn color="primary" flat icon="add" label="Add reference" @click="addRef" />
            </div>

            <div v-for="(r, i) in localRefs" :key="i" class="q-pa-md q-mb-md bg-grey-2 rounded-borders">
                <div class="row q-col-gutter-md">
                    <div class="col-12 col-md-6">
                        <q-input v-bind="fieldUi" v-model="r.name" label="Supplier Name *" :rules="[required]" />
                    </div>
                    <div class="col-12 col-md-6">
                        <q-input v-bind="fieldUi" v-model="r.accountNo" label="Account #" />
                    </div>

                    <div class="col-12 col-md-4">
                        <q-input v-bind="fieldUi" v-model="r.phone" label="Phone" mask="(###) ###-####" fill-mask
                            :rules="[phoneOrEmail(r), v => !v || phoneRule(v)]" />
                    </div>
                    <div class="col-12 col-md-4">
                        <q-input v-bind="fieldUi" v-model="r.fax" label="Fax" mask="(###) ###-####" fill-mask />
                    </div>
                    <div class="col-12 col-md-4">
                        <q-input v-bind="fieldUi" v-model="r.email" label="Email" type="email"
                            :rules="[emailOrPhone(r), v => !v || emailRule(v)]" />
                    </div>
                </div>

                <q-separator class="q-my-sm" />

                <div class="text-caption text-weight-medium q-mb-xs">Supplier Address</div>
                <div class="row q-col-gutter-md">
                    <div class="col-12">
                        <q-input v-bind="fieldUi" v-model="r.address!.address" label="Street *" :rules="[required]" />
                    </div>
                    <div class="col-12 col-md-5">
                        <q-input v-bind="fieldUi" v-model="r.address!.city" label="City *" :rules="[required]" />
                    </div>
                    <div class="col-6 col-md-3">
                        <q-select v-bind="fieldUi" v-model="r.address!.state" :options="stateOptions" label="State *"
                            emit-value map-options :rules="[required]" />
                    </div>
                    <div class="col-6 col-md-4">
                        <q-input v-bind="fieldUi" v-model="r.address!.zip" label="ZIP *" mask="#####-####" fill-mask
                            :rules="[required, zipRule]" />
                    </div>
                </div>

                <div class="q-mt-sm">
                    <q-btn color="negative" flat icon="delete" label="Remove" :disable="localRefs.length <= 3"
                        @click="removeRef(i)" />
                </div>
            </div>
        </q-form>

        <div class="row q-gutter-sm q-mt-md">
            <q-btn color="secondary" label="Back" @click="onBack" />
            <q-btn color="primary" label="Next" @click="onNext" />
        </div>
    </div>
</template>
