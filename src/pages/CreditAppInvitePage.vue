<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import axios from 'axios'
import { useQuasar } from 'quasar'
import CreditAppStepper from 'src/components/credit-form/CreditAppStepper.vue'
import CommandConsole from 'src/components/credit-form/CommandConsole.vue'
import { useCreditForm } from 'src/components/credit-form/useCreditForm'
import type { CreditForm } from 'src/components/credit-form/types'

const route = useRoute()
const $q = useQuasar()
const { form } = useCreditForm()
const stepperRef = ref<InstanceType<typeof CreditAppStepper> | null>(null)
const loading = ref(false)
const error = ref<string | null>(null)

const API_BASE = import.meta.env.VITE_BE_ENDPOINT ?? 'https://localhost:7009'
// const plant = computed(() => route.params.plant as string | undefined)
const guid = computed(() => route.params.guid as string | undefined)
// const hasInvite = computed(() => !!(plant.value && guid.value))

function onNext() {
  stepperRef.value?.nextValidated()
}
function onBack() {
  stepperRef.value?.back()
}

async function fetchApplication() {
  if (!guid.value) return
  loading.value = true
  error.value = null
  try {
    const { data } = await axios.get<Partial<CreditForm>>(`${API_BASE}/api/apps/${guid.value}`)
    applyRemoteForm(data)
    $q.notify({ type: 'positive', message: 'Application loaded from server.' })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unable to load application.'
    error.value = msg
    $q.notify({ type: 'negative', message: msg })
  } finally {
    loading.value = false
  }
}

function applyRemoteForm(payload: Partial<CreditForm> | undefined) {
  if (!payload) return
  const safe = JSON.parse(JSON.stringify(payload)) as Partial<CreditForm>

  Object.assign(form.value, safe)

  if (safe.contacts) form.value.contacts = safe.contacts
  if (safe.mailing) form.value.mailing = safe.mailing
  if (safe.owners) form.value.owners = safe.owners
  if (safe.bank) form.value.bank = safe.bank
  if (safe.tradeRefs) form.value.tradeRefs = safe.tradeRefs
  if (safe.resaleCertificate) form.value.resaleCertificate = safe.resaleCertificate
  if (safe.nySt120) form.value.nySt120 = safe.nySt120
  if (safe.signers) form.value.signers = safe.signers
}

function resetInviteState() {
  loading.value = false
  error.value = null
}

watch(
  () => guid.value,
  (newGuid) => {
    resetInviteState()
    if (newGuid) void fetchApplication()
  },
  { immediate: true }
)

</script>

<template>
  <q-page class="q-pa-md bg-grey-1">
    <div class="max-w-screen-xl q-mx-auto">
      <!-- <q-banner v-if="hasInvite" class="bg-primary text-white q-mb-md" rounded>
        <div>
          <div class="text-subtitle2 text-weight-bold">Invite Link Details</div>
          <div>Plant: <span class="text-weight-medium">{{ plant }}</span></div>
          <div>Application ID: <span class="text-weight-medium">{{ guid }}</span></div>
        </div>
        <template #action>
          <q-btn flat color="white" label="Reload" @click="fetchApplication" :loading="loading" />
        </template>
</q-banner> -->

      <!-- <q-banner v-if="error" class="bg-negative text-white q-mb-md" rounded>
        <div>{{ error }}</div>
        <template #action>
          <q-btn flat color="white" label="Retry" @click="fetchApplication" />
        </template>
      </q-banner> -->

      <q-card flat bordered class="q-mb-md" v-if="loading">
        <q-card-section class="row items-center q-gutter-sm">
          <q-spinner color="primary" size="24px" />
          <div class="text-body1">Loading application...</div>
        </q-card-section>
      </q-card>

      <div class="row q-col-gutter-md" :class="{ 'opacity-50 pointer-events-none': loading }">
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
.max-w-screen-xl {
  max-width: 1500px;
}
</style>
