<script setup lang="ts">
import { ref, watch } from 'vue'
import type { CreditForm, Bank, Address } from '../types'
import { stateOptions } from '../utilities'
import { required, faxRule, emailRule, zipRule, phoneRule } from 'src/utility/validators'

const props = defineProps<{ modelValue: CreditForm }>()
const emit = defineEmits(['update:modelValue', 'next', 'back'])

const emptyAddr = (): Address => ({ address: '', city: '', state: '', zip: '' })
const emptyBank = (): Bank => ({
    name: '',
    accountNo: '',
    phone: '',
    fax: '',
    email: '',
    address: emptyAddr()
})

const localBank = ref<Bank>(props.modelValue.bank ? { ...props.modelValue.bank } : emptyBank())

watch(
    localBank,
    (val) => {
        emit('update:modelValue', { ...props.modelValue, bank: { ...val } })
    },
    { deep: true }
)

const formRef = ref()

async function onNext() {
    const ok = await formRef.value?.validate()
    if (ok === true) emit('next')
}
</script>

<template>
    <q-form ref="formRef" greedy class="q-gutter-md">

        <div class="row q-col-gutter-md">
            <div class="col-12 col-md-6">
                <q-input filled bg-color="grey-4" v-model="localBank.name" label="Bank Name *" :rules="[required]" />
            </div>
            <div class="col-12 col-md-6">
                <q-input filled bg-color="grey-4" v-model="localBank.accountNo" label="Account # *"
                    :rules="[required]" />
            </div>

            <div class="col-12 col-md-4">
                <q-input filled bg-color="grey-4" v-model="localBank.phone" label="Phone" mask="(###) ###-####"
                    fill-mask :rules="[required, phoneRule]" />
            </div>
            <div class="col-12 col-md-4">
                <q-input filled bg-color="grey-4" v-model="localBank.fax" label="Fax" mask="(###) ###-####" fill-mask
                    :rules="[faxRule]" />
            </div>
            <div class="col-12 col-md-4">
                <q-input filled bg-color="grey-4" v-model="localBank.email" label="Email" type="email"
                    :rules="[required, emailRule]" />
            </div>
        </div>

        <q-separator />

        <div class="text-subtitle2">Bank Address</div>
        <div class="row q-col-gutter-md">
            <div class="col-12">
                <q-input filled bg-color="grey-4" v-model="localBank.address.address" label="Street"
                    :rules="[required]" />
            </div>
            <div class="col-12 col-md-5">
                <q-input filled bg-color="grey-4" v-model="localBank.address.city" label="City" :rules="[required]" />
            </div>
            <div class="col-6 col-md-3">
                <q-select filled bg-color="grey-4" v-model="localBank.address.state" :options="stateOptions"
                    label="State" emit-value map-options :rules="[required]" />
            </div>
            <div class="col-6 col-md-4">
                <q-input filled bg-color="grey-4" v-model="localBank.address.zip" label="ZIP" mask="#####-####"
                    fill-mask :rules="[required, zipRule]" />
            </div>
        </div>

        <div class="row q-gutter-sm q-mt-md">
            <q-btn color="secondary" label="Back" @click="emit('back')" />
            <q-btn color="primary" label="Next" @click="onNext" />
        </div>
    </q-form>
</template>
