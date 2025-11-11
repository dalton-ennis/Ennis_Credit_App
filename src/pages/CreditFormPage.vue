<script setup lang="ts">
import { ref } from 'vue'
import CreditAppStepper from 'src/components/credit-form/CreditAppStepper.vue'
import CommandConsole from 'src/components/credit-form/CommandConsole.vue'
import { useCreditForm } from 'src/components/credit-form/useCreditForm'

const { form } = useCreditForm()
const stepperRef = ref<InstanceType<typeof CreditAppStepper> | null>(null)

function onNext() { stepperRef.value?.nextValidated() }
function onBack() { stepperRef.value?.back() }
</script>

<template>
    <q-page class="q-pa-md bg-grey-1">
        <div class="max-w-screen-md mx-auto">
            <div class="row q-col-gutter-md">
                <div class="col-12 col-md-9">
                    <CreditAppStepper ref="stepperRef" v-model="form" />
                </div>
                <div class="col-12 col-md-3">
                    <CommandConsole v-model="form" @next="onNext" @back="onBack" />
                </div>
            </div>
        </div>
    </q-page>
</template>

<style scoped>
.max-w-screen-md {
    max-width: 1500px;
    margin: 0 auto;
}
</style>
