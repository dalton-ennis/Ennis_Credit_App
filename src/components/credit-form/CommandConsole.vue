<script setup lang="ts">
import { computed } from 'vue'
import { useQuasar } from 'quasar'
import type { CreditForm } from './types'
import { useWizardStore } from 'src/stores/wizard'

const props = defineProps<{ modelValue: CreditForm; nextBusy?: boolean }>()
const emit = defineEmits(['update:modelValue', 'next', 'back'])
const $q = useQuasar()
const wizard = useWizardStore()

const form = computed({
  get: () => props.modelValue,
  set: (v: CreditForm) => emit('update:modelValue', v)
})

const lockAll = computed(() => wizard.lockAll)
const nextBusy = computed(() => !!props.nextBusy)

function onNext() {
  if (nextBusy.value) return
  emit('next')
}
function onBack() { emit('back') }

function onLocChange(val: boolean) {
  if (lockAll.value) return
  const current = wizard.current
  // Prevent turning off while on the credit step
  if (current === 'credit' && form.value.requestLineOfCredit && val === false) {
    $q.notify({ type: 'warning', message: 'Cannot disable while on Credit Request step' })
    return
  }
  emit('update:modelValue', { ...form.value, requestLineOfCredit: val })
}

function onTaxChange(val: boolean) {
  if (lockAll.value) return
  const current = wizard.current
  if (current === 'tax' && form.value.requestTaxExempt && val === false) {
    $q.notify({ type: 'warning', message: 'Cannot disable while on Tax Exemption step' })
    return
  }
  emit('update:modelValue', { ...form.value, requestTaxExempt: val })
}
</script>

<template>
  <div class="sticky">
    <q-card flat bordered class="q-pa-sm">
      <q-card-section class="q-pt-sm q-pb-xs">
        <div class="text-subtitle2">Console</div>
        <div class="text-caption text-grey-7">Quick actions & toggles</div>
      </q-card-section>
      <q-separator />
      <q-card-section class="q-gutter-sm">
        <q-toggle :model-value="form.requestLineOfCredit" @update:model-value="onLocChange" :disable="lockAll"
          label="Request line of credit" />
        <q-toggle :model-value="form.requestTaxExempt" @update:model-value="onTaxChange" :disable="lockAll"
          label="Request sales tax exemption" />
      </q-card-section>
      <q-separator />
      <q-card-section class="q-gutter-xs">
        <q-btn color="primary" label="Next" class="full-width" @click="onNext" :loading="nextBusy"
          :disable="lockAll || nextBusy" />
        <q-btn color="secondary" outline label="Back" class="full-width" @click="onBack" :disable="nextBusy" />
      </q-card-section>
    </q-card>
  </div>

</template>

<style scoped>
.sticky {
  position: sticky;
  top: 16px;
}

.full-width {
  width: 100%;
}
</style>
