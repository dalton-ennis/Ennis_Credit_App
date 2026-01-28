<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useQuasar } from 'quasar'
import axios, { type AxiosError } from 'axios'

const API_BASE = (import.meta.env.VITE_BE_ENDPOINT ?? '') as string

const route = useRoute()
const $q = useQuasar()

const guid = computed(() => (route.params.guid as string | undefined) ?? '')
const event = computed(() => (route.query.event as string | undefined) ?? '')

const updating = ref(false)
const updateState = ref<'idle' | 'success' | 'error'>('idle')
const updateMessage = ref('')
const updatedOnce = ref(false)

function extractAxiosMessage(err: unknown): string {
  if (axios.isAxiosError(err)) {
    const ax = err as AxiosError<{ title?: string; message?: string }>
    return ax.response?.data?.title ?? ax.response?.data?.message ?? ax.message
  }
  return err instanceof Error ? err.message : 'Request failed'
}

async function notifySigningComplete() {
  if (!guid.value || event.value !== 'signing_complete' || updatedOnce.value) return
  updatedOnce.value = true
  updating.value = true
  updateState.value = 'idle'

  try {
    await axios.put(`${API_BASE}/api/apps/${guid.value}/status`, {
      status: 'Signed',
      // event: event.value
    })
    updateState.value = 'success'
    updateMessage.value = 'Application status updated.'
  } catch (err: unknown) {
    updateState.value = 'error'
    updateMessage.value = extractAxiosMessage(err)
    $q.notify({ type: 'negative', message: updateMessage.value })
  } finally {
    updating.value = false
  }
}

watch([guid, event], () => {
  void notifySigningComplete()
})

onMounted(() => {
  void notifySigningComplete()
})
</script>

<template>
  <q-page class="q-pa-lg bg-grey-2">
    <div class="max-w-screen-sm q-mx-auto">
      <q-card flat bordered class="q-pa-lg">
        <q-card-section>
          <div class="text-h5 text-weight-medium q-mb-sm">Thank you for signing</div>
          <div class="text-body2 text-grey-7">
            We have received your DocuSign submission and will process your application.<br />
            Expect a response within 2-3 buisness days.
          </div>
        </q-card-section>

        <q-separator />

        <q-card-section class="q-gutter-sm">
          <div class="row items-center">
            <div class="text-caption text-grey-6">Application</div>
            <q-space />
            <div class="text-body2">{{ guid }}</div>
          </div>
          <div class="row items-center">
            <div class="text-caption text-grey-6">Event</div>
            <q-space />
            <div class="text-body2">{{ event || 'n/a' }}</div>
          </div>
          <div class="row items-center" v-if="event === 'signing_complete'">
            <div class="text-caption text-grey-6">Status</div>
            <q-space />
            <div class="text-body2">
              <q-spinner size="18px" class="q-mr-sm" v-if="updating" />
              <span v-else-if="updateState === 'success'">Updated</span>
              <span v-else-if="updateState === 'error'">Update failed</span>
              <span v-else>Pending</span>
            </div>
          </div>
        </q-card-section>

        <q-card-section v-if="updateState === 'error'" class="text-caption text-negative">
          {{ updateMessage }}
        </q-card-section>
      </q-card>
    </div>
  </q-page>
</template>

<style scoped>
.max-w-screen-sm {
  max-width: 640px;
}
</style>
