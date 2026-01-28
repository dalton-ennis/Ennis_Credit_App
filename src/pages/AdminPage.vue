<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useQuasar } from 'quasar'
import { useRoute, useRouter } from 'vue-router'
import axios, { type AxiosError } from 'axios'
import { fieldUi } from '../components/credit-form/utilities'

type PlantOption = { label: string; value: number }
type Plant = {
  Logo: string
  PlantId: number
  Name: string
  Code: string
}

type MatchingApp = {
  ApplicationGuid: string
}

type PlantSummary = {
  Name: string
}

type ApplicationSummary = {
  ApplicationGuid: string
  CustomerFirstName: string
  CustomerLastName: string
  CustomerEmail: string
  Status: string
  CreatedAt: string
  Plant?: PlantSummary | null
}

const API_BASE = (import.meta.env.VITE_BE_ENDPOINT ?? '') as string

const plantOptions = ref<PlantOption[] | undefined>()

const plant = ref<number | null>(null)
const email = ref('')
const firstName = ref('')
const lastName = ref('')
const customerFinanceName = ref('')
const customerFinanceEmail = ref('')
const csaName = ref('')
const csaEmail = ref('')
const isDocusignProduction = ref(false)
const backendGuid = ref<string | null>(null)
const backendLink = ref<string>('')
const plants = ref()

const VIEWER_STORAGE_KEY = 'docusign-viewers'

const $q = useQuasar()
const route = useRoute()
const router = useRouter()

const activeTab = ref<'send' | 'apps'>('send')
const loadingApps = ref(false)
const apps = ref<ApplicationSummary[]>([])
const searchQuery = ref('')
const plantFilter = ref('all')
const statusFilter = ref('all')
const ageFilter = ref<'all' | 'new' | 'old'>('all')
const confirmOpen = ref(false)
const pendingDelete = ref<ApplicationSummary | null>(null)

async function emailCustomer() {
  if (!backendGuid.value || !plant.value || !email.value) {
    $q.notify({ type: 'warning', message: 'Create the form first, and ensure plant & email are set.' })
    return
  }

  const plantCode = plants.value.find((p: Plant) => plant.value === p.PlantId).Name

  try {
    await axios.post(
      `${API_BASE}/api/apps/${backendGuid.value}/send-link`,
      {
        toEmail: email.value,
        plantCode,
        firstName: firstName.value || null,
        lastName: lastName.value || null
      },
    )

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

function formatDate(value: string) {
  const date = new Date(value)
  return Number.isNaN(date.valueOf()) ? value : date.toLocaleString()
}

function appTitle(app: ApplicationSummary) {
  const first = app.CustomerFirstName?.trim() ?? ''
  const last = app.CustomerLastName?.trim() ?? ''
  return `${first} ${last}`.trim() || 'Unnamed Customer'
}

const plantFilterOptions = computed(() => {
  const options = [{ label: 'All Plants', value: 'all' }]
  const plantItems = (plants.value ?? [])
    .map((plant: Plant) => ({ label: plant.Name, value: String(plant.PlantId) }))
    .sort((a: { label: string }, b: { label: string }) => a.label.localeCompare(b.label))
  return options.concat(plantItems)
})

const statusFilterOptions = computed(() => {
  const unique = new Set<string>()
  for (const app of apps.value) {
    if (app.Status) unique.add(app.Status)
  }
  const items = Array.from(unique)
    .sort((a, b) => a.localeCompare(b))
    .map(status => ({ label: status, value: status }))
  return [{ label: 'All Statuses', value: 'all' }, ...items]
})

const filteredApps = computed(() => {
  const query = searchQuery.value.trim().toLowerCase()
  const now = Date.now()
  const sevenDaysMs = 7 * 24 * 60 * 60 * 1000

  return apps.value.filter((app) => {
    if (plantFilter.value !== 'all') {
      const plantId = (plants.value ?? []).find((p: Plant) => p.Name === app.Plant?.Name)?.PlantId
      if (String(plantId ?? '') !== plantFilter.value) return false
    }

    if (statusFilter.value !== 'all' && app.Status !== statusFilter.value) return false

    if (ageFilter.value !== 'all') {
      const createdAt = new Date(app.CreatedAt).getTime()
      if (!Number.isFinite(createdAt)) return false
      const isNew = now - createdAt <= sevenDaysMs
      if (ageFilter.value === 'new' && !isNew) return false
      if (ageFilter.value === 'old' && isNew) return false
    }

    if (!query) return true
    const haystack = [
      appTitle(app),
      app.CustomerEmail,
      app.Plant?.Name ?? '',
      app.Status ?? ''
    ]
      .join(' ')
      .toLowerCase()
    return haystack.includes(query)
  })
})

const creating = ref(false)

async function createForm() {
  try {
    creating.value = true

    let matchingApp: MatchingApp = { ApplicationGuid: '' }
    try {
      const { data } = await axios.get<MatchingApp>(
        `${API_BASE}/api/apps/by-plant-and-email?plantId=${plant.value}&email=${email.value}`
      )
      matchingApp = data
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && err.response?.status === 404) {
        matchingApp = { ApplicationGuid: '' }
      } else {
        throw err
      }
    }

    const plantCode = plants.value.find((p: Plant) => plant.value === p.PlantId).Code

    if (!matchingApp.ApplicationGuid) {
      const payload = {
        plantCode,
        // plantId: plant.value,
        customerEmail: email.value,
        customerFirst: firstName.value || null,
        customerLast: lastName.value || null,
        companyName: '',
        phone: '',
        ein: '',
        address1: '',
        city: '',
        state: '',
        zip: '',
        customerFinanceEmail: customerFinanceEmail.value,
        customerFinanceName: customerFinanceName.value,
        csaEmail: csaEmail.value,
        csaName: csaName.value,
        isDocusignProduction: isDocusignProduction.value
      }

      console.log(payload)

      const { data } = await axios.post(`${API_BASE}/api/apps`, payload)
      backendGuid.value = data.Guid
      backendLink.value = data.Link

      $q.notify({ type: 'positive', message: 'Form created and link generated.' })
      await emailCustomer()
    } else {
      $q.notify({ type: 'warning', message: `${email.value} already has an application open with ${plantCode}.` })
      console.log(isDocusignProduction.value)
      backendLink.value = `${import.meta.env.VITE_FE_URL}/${plantCode.toLowerCase()}/creditapp/${matchingApp.ApplicationGuid}`
    }
  } catch (err: unknown) {
    console.error(err)
    const msg = extractAxiosMessage(err)
    $q.notify({ type: 'negative', message: msg })
  } finally {
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

function loadViewerFields() {
  const raw = localStorage.getItem(VIEWER_STORAGE_KEY)
  if (!raw) return
  try {
    const data = JSON.parse(raw) as {
      customerFinanceName?: string
      customerFinanceEmail?: string
      csaName?: string
      csaEmail?: string
    }
    customerFinanceName.value = data.customerFinanceName ?? ''
    customerFinanceEmail.value = data.customerFinanceEmail ?? ''
    csaName.value = data.csaName ?? ''
    csaEmail.value = data.csaEmail ?? ''
  } catch {
    localStorage.removeItem(VIEWER_STORAGE_KEY)
  }
}

async function loadApps() {
  try {
    loadingApps.value = true
    const { data } = await axios.get<ApplicationSummary[]>(`${API_BASE}/api/apps`)
    apps.value = data
  } catch (err: unknown) {
    $q.notify({ type: 'negative', message: extractAxiosMessage(err) })
  } finally {
    loadingApps.value = false
  }
}

function requestDelete(app: ApplicationSummary) {
  pendingDelete.value = app
  confirmOpen.value = true
}

async function confirmDelete() {
  const app = pendingDelete.value
  if (!app) return
  confirmOpen.value = false
  pendingDelete.value = null

  try {
    await axios.delete(`${API_BASE}/api/apps/${app.ApplicationGuid}`)
    apps.value = apps.value.filter((entry) => entry.ApplicationGuid !== app.ApplicationGuid)
    $q.notify({ type: 'positive', message: 'Application deleted.' })
  } catch (err: unknown) {
    $q.notify({ type: 'negative', message: extractAxiosMessage(err) })
  }
}

function syncTabFromRoute() {
  const tab = route.query.tab === 'apps' ? 'apps' : 'send'
  activeTab.value = tab
}

async function syncRouteFromTab(tab: 'send' | 'apps') {
  await router.replace({ path: '/admin', query: tab === 'apps' ? { tab: 'apps' } : {} })
}

watch(
  [customerFinanceName, customerFinanceEmail, csaName, csaEmail],
  () => {
    const payload = {
      customerFinanceName: customerFinanceName.value.trim(),
      customerFinanceEmail: customerFinanceEmail.value.trim(),
      csaName: csaName.value.trim(),
      csaEmail: csaEmail.value.trim()
    }
    localStorage.setItem(VIEWER_STORAGE_KEY, JSON.stringify(payload))
  }
)

watch(
  () => route.query.tab,
  () => syncTabFromRoute(),
  { immediate: true }
)

watch(activeTab, async (tab) => {
  await syncRouteFromTab(tab)
  if (tab === 'apps' && apps.value.length === 0) {
    void loadApps()
  }
})

onMounted(async () => {
  syncTabFromRoute()
  loadViewerFields()

  const data = await axios.get(`${API_BASE}/api/Plants`)
  plants.value = data.data
  plantOptions.value = plants.value.map((p: Plant) => {
    return { label: p.Name, value: p.PlantId }
  })
})
</script>

<template>
  <q-page class="q-pa-lg bg-grey-2">
    <div class="max-w-screen-lg q-mx-auto">
      <div class="row items-center q-mb-md">
        <div class="text-h5 text-weight-medium">Admin Dashboard</div>
        <q-space />
        <q-btn v-if="activeTab === 'apps'" outline color="primary" label="Refresh" :loading="loadingApps"
          @click="loadApps" />
      </div>

      <q-tabs v-model="activeTab" dense class="text-grey-7 q-mb-lg" active-color="primary" indicator-color="primary"
        align="left" inline-label>
        <q-tab name="send" label="Send Application" icon="send" />
        <q-tab name="apps" label="View Applications" icon="view_list" />
      </q-tabs>

      <q-tab-panels v-model="activeTab" animated>
        <q-tab-panel name="send">
          <div class="row q-col-gutter-md items-start">
            <div class="col-12 col-md-5">
              <q-card flat bordered class="q-pa-md">
                <q-card-section class="q-gutter-md">
                  <div class="text-subtitle2">DocuSign Viewer Settings</div>
                  <div class="text-body2 text-grey-8">
                    These contacts are added as viewers when the DocuSign is sent. Viewers can access the envelope and
                    download copies, but cannot sign or edit any fields.
                  </div>
                  <q-input v-bind="fieldUi" v-model="customerFinanceName" label="Customer Finance Name" />
                  <q-input v-bind="fieldUi" v-model="customerFinanceEmail" label="Customer Finance Email" type="email"
                    placeholder="finance@example.com" />
                  <q-input v-bind="fieldUi" v-model="csaName" label="CSA Name" />
                  <q-input v-bind="fieldUi" v-model="csaEmail" label="CSA Email" type="email"
                    placeholder="csa@example.com" />
                </q-card-section>
              </q-card>
            </div>

            <div class="col-12 col-md-7">
              <div class="q-gutter-md">
                <q-card flat bordered class="q-pa-md">
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
                    <div class="row items-center">
                      <q-toggle v-model="isDocusignProduction" label="Use Production" />
                      <q-tooltip>Warning: enabling production consumes a DocuSign document.</q-tooltip>
                    </div>
                  </q-card-section>

                  <q-separator />

                  <q-card-section class="q-gutter-md">
                    <div class="text-subtitle2">Form Link</div>
                    <q-input :model-value="fullLink" readonly placeholder="Select a plant to generate a link" dense
                      outlined>
                      <template #append>
                        <q-btn icon="content_copy" flat round dense @click="copyLink" :disable="!fullLink" />
                      </template>
                    </q-input>

                    <div class="row q-gutter-sm">
                      <q-btn color="primary" label="Email Form" :loading="creating"
                        :disable="creating || !plant || !email" @click="createForm" />
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
            </div>
          </div>
        </q-tab-panel>

        <q-tab-panel name="apps">
          <q-card flat bordered class="q-pa-md q-mb-md">
            <div class="row q-col-gutter-md items-center">
              <div class="col-12 col-md-5">
                <q-input v-model="searchQuery" outlined dense label="Search applications"
                  placeholder="Name, email, plant, status" clearable />
              </div>
              <div class="col-12 col-sm-6 col-md-3">
                <q-select v-model="plantFilter" :options="plantFilterOptions" emit-value map-options outlined dense
                  label="Plant" />
              </div>
              <div class="col-12 col-sm-6 col-md-2">
                <q-select v-model="statusFilter" :options="statusFilterOptions" emit-value map-options outlined dense
                  label="Status" />
              </div>
              <div class="col-12 col-sm-6 col-md-2">
                <q-select v-model="ageFilter" :options="[
                  { label: 'All', value: 'all' },
                  { label: 'New', value: 'new' },
                  { label: 'Old', value: 'old' }
                ]" emit-value map-options outlined dense label="Age" />
              </div>
            </div>
          </q-card>

          <q-card flat bordered class="q-pa-md" v-if="!loadingApps && apps.length === 0">
            <div class="text-body2 text-grey-7">No applications yet.</div>
          </q-card>

          <q-card flat bordered class="q-pa-md" v-if="!loadingApps && filteredApps.length === 0 && apps.length > 0">
            <div class="text-body2 text-grey-7">No applications match the current filters.</div>
          </q-card>

          <q-card flat bordered class="q-pa-none">
            <q-list separator>
              <q-item class="list-header">
                <q-item-section class="col-name text-caption text-grey-6">Customer</q-item-section>
                <q-item-section class="col-plant text-caption text-grey-6">Plant</q-item-section>
                <q-item-section class="col-status text-caption text-grey-6">Status</q-item-section>
                <q-item-section class="col-created text-caption text-grey-6">Created</q-item-section>
                <q-item-section class="col-actions text-caption text-grey-6" side>Actions</q-item-section>
              </q-item>

              <q-item v-for="app in filteredApps" :key="app.ApplicationGuid">
                <q-item-section class="col-name">
                  <div class="text-body1 text-weight-medium">{{ appTitle(app) }}</div>
                  <div class="text-caption text-grey-7">{{ app.CustomerEmail }}</div>
                </q-item-section>
                <q-item-section class="col-plant">
                  <div class="text-body2">{{ app.Plant?.Name ?? 'Unknown' }}</div>
                </q-item-section>
                <q-item-section class="col-status">
                  <q-badge class="status-badge"
                    :color="app.Status.toLowerCase() === 'signed' ? 'green' : 'blue-7'" align="middle">
                    {{ app.Status }}
                  </q-badge>
                </q-item-section>
                <q-item-section class="col-created">
                  <div class="text-body2">{{ formatDate(app.CreatedAt) }}</div>
                </q-item-section>
                <q-item-section class="col-actions" side>
                  <q-btn icon="close" flat round dense color="negative" @click="requestDelete(app)"
                    aria-label="Delete application" />
                </q-item-section>
              </q-item>
            </q-list>
          </q-card>
        </q-tab-panel>
      </q-tab-panels>
    </div>

    <q-dialog v-model="confirmOpen" persistent>
      <q-card>
        <q-card-section class="text-subtitle1 text-weight-medium">Delete application</q-card-section>
        <q-card-section class="text-body2">
          Delete {{ pendingDelete ? appTitle(pendingDelete) : 'this application' }}? This cannot be undone.
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Cancel" color="grey-7" v-close-popup />
          <q-btn flat label="Delete" color="negative" @click="confirmDelete" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<style scoped>
.max-w-screen-lg {
  max-width: 1100px;
}

.monospace {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
}

ol {
  margin: 0;
}

.list-header {
  background: #f7f7f7;
}

.col-name {
  min-width: 220px;
}

.col-plant {
  min-width: 140px;
}

.col-status {
  min-width: 120px;
}

.col-created {
  min-width: 180px;
}

.col-actions {
  min-width: 60px;
}

.status-badge {
  width: fit-content;
}
</style>
