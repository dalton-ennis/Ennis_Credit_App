<script setup lang="ts">
import { ref, computed } from 'vue'
import { useQuasar } from 'quasar'
import axios, { type AxiosError } from 'axios'
import { fieldUi } from '../components/credit-form/utilities';

type PlantOption = { label: string; value: string }

const API_BASE = (import.meta.env.VITE_BE_ENDPOINT ?? '') as string

const plantOptions: PlantOption[] = [
  { label: 'Admore', value: 'admore' },
  { label: 'Adams McClure', value: 'adams-mcclure' },
  // ensure these `value`s match the backend PlantCode (e.g., "PFC") or map them before sending
]

const plant = ref<string | null>(plantOptions[0]?.value ?? null)
const email = ref('')
const firstName = ref('')
const lastName = ref('')
const backendGuid = ref<string | null>(null)
const backendLink = ref<string>('')

const $q = useQuasar()

async function emailCustomer() {
  if (!backendGuid.value || !plant.value || !email.value) {
    $q.notify({ type: 'warning', message: 'Create the form first, and ensure plant & email are set.' })
    return
  }

  try {
    await axios.post(`${API_BASE}/api/apps/${backendGuid.value}/send-link`, {
      toEmail: email.value,
      plantCode: plant.value,
      firstName: firstName.value || null,
      lastName: lastName.value || null
    })
    console.log(`${API_BASE}/api/apps/${backendGuid.value}/send-link`)
    $q.notify({ type: 'positive', message: 'Email sent.' })
  } catch (err: unknown) {
    $q.notify({ type: 'negative', message: extractAxiosMessage(err) })
  }
}

const fullLink = computed(() => backendLink.value)

function extractAxiosMessage(err: unknown): string {
  if (axios.isAxiosError(err)) {
    const ax = err as AxiosError<{ title?: string; message?: string }>
    return ax.response?.data?.title
      ?? ax.response?.data?.message
      ?? ax.message
  }
  return err instanceof Error ? err.message : 'Request failed'
}

const creating = ref(false)

async function createForm() {
  try {
    creating.value = true

    // If your backend expects specific codes (e.g., "PFC"), map here:
    const plantCode = plant.value // transform if needed, e.g., plant.value.toUpperCase()

    const payload = {
      plantCode,
      customerEmail: email.value,
      customerFirst: firstName.value || null,
      customerLast: lastName.value || null,
      // the backend will accept blanks for the rest (CompanyName, Phone, etc.)
      companyName: '',
      phone: '',
      ein: '',
      address1: '',
      city: '',
      state: '',
      zip: ''
    }

    const { data } = await axios.post(`${API_BASE}/api/apps`, payload)
    backendGuid.value = data.Guid
    backendLink.value = data.Link

    console.log(data)

    $q.notify({ type: 'positive', message: 'Form created and link generated.' })
  } catch (err: unknown) {               // <-- no 'any'
    console.error(err)
    const msg = extractAxiosMessage(err) // <-- typed helper
    $q.notify({ type: 'negative', message: msg })
  } finally {
    await emailCustomer()
    creating.value = false
  }
}

async function copyLink() {
  if (!fullLink.value) return
  try {
    await navigator.clipboard.writeText(fullLink.value)
    $q.notify({ type: 'positive', message: 'Link copied to clipboard.' })
  } catch (err) {
    console.error(err)
    $q.notify({ type: 'negative', message: 'Unable to copy link.' })
  }
}
</script>

<template>
  <q-page class="q-pa-lg bg-grey-2">
    <div class="max-w-screen-sm q-mx-auto">
      <div class="text-h5 text-weight-medium q-mb-lg">Credit App Link Generator</div>

      <q-card flat bordered class="q-pa-md q-mb-lg">
        <q-card-section class="q-gutter-md">
          <q-select v-bind="fieldUi" v-model="plant" :options="plantOptions" label="Select Plant" emit-value
            map-options />
          <div class="row ">
            <div class="col-12 col-sm-6">
              <q-input v-bind="fieldUi" v-model="firstName" label="Customer First Name" />
            </div>
            <div class="col-12 col-sm-6 q-pl-sm">
              <q-input v-bind="fieldUi" v-model="lastName" label="Customer Last Name" />
            </div>
          </div>
          <q-input v-bind="fieldUi" v-model="email" label="Customer Email" type="email"
            placeholder="customer@example.com" />
        </q-card-section>

        <q-separator />

        <q-card-section class="q-gutter-md">
          <div class="text-subtitle2">Form Link</div>
          <q-input :model-value="fullLink" readonly placeholder="Select a plant to generate a link" dense outlined>
            <template #append>
              <q-btn icon="content_copy" flat round dense @click="copyLink" :disable="!fullLink" />
            </template>
          </q-input>

          <div class="row q-gutter-sm">
            <q-btn color="primary" label="Email Form" :loading="creating" :disable="creating || !plant || !email"
              @click="createForm" />
            <!-- <q-btn outline color="primary" label="Preview New Link" @click="regenerateGuid" :disable="creating" /> -->
          </div>
        </q-card-section>
      </q-card>

      <q-card flat bordered class="q-pa-md">
        <q-card-section>
          <div class="text-subtitle2 q-mb-sm">How it works</div>
          <ol class="text-body2 q-pl-md q-gutter-xs">
            <li>Select the plant location that will fulfill the credit application.</li>
            <li>Enter the customer's first/last name and email.</li>
            <li>Click <b>Email Form</b> to create the application and email it to the customer.</li>
            <!-- <li>Use the copy icon to send the link to your customer.</li> -->
          </ol>
        </q-card-section>
      </q-card>
    </div>
  </q-page>
</template>

<style scoped>
.max-w-screen-sm {
  max-width: 640px;
}

.monospace {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
}

ol {
  margin: 0;
}
</style>
