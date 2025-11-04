<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import axios from 'axios'
import { useQuasar } from 'quasar'
import type { CreditForm } from '../types'

const props = defineProps<{ modelValue: CreditForm }>()
const emit = defineEmits(['update:modelValue', 'back', 'next'])

const $q = useQuasar()

/** Config **/
const DOCUSIGN_TEMPLATE_ID = 'f11e722d-9920-4eaf-9de6-ef0279ce22d7'
const API_BASE = import.meta.env.VITE_BE_ENDPOINT ?? 'https://localhost:7009' // adjust if different

/** UI state **/
const loading = ref(false)
const errorMsg = ref<string | null>(null)
const signingUrl = ref<string | null>(null)
const requested = ref(false) // ensure single fetch per enter

/** Field mapping -> DocuSign TextTabs **/
const dsFields = computed(() => {
    const f = props.modelValue
    // Prefer explicit country; default to "USA" to match DS tab
    const country = (f.country || 'USA').toUpperCase()
    return {
        companyName: f.companyName || '',
        companyAddress: f.address || '',
        companyCity: f.city || '',
        companyState: f.state || '',
        companyZip: f.zip || '',
        companyCountry: country
    }
})

/** Recipient (you can swap to your actual recipient fields on the form) **/
const recipientEmail = computed(() => props.modelValue.email || 'customer@example.com')
const recipientName = computed(() => props.modelValue.companyName || 'Customer')

type PrefillRequest = {
    templateId: string
    recipientEmail: string
    recipientName: string
    fields: Record<string, string>
}
type PrefillResponse = {
    signingUrl: string
}

async function createPrefill() {
    loading.value = true
    errorMsg.value = null
    try {
        const payload: PrefillRequest = {
            templateId: DOCUSIGN_TEMPLATE_ID,
            recipientEmail: recipientEmail.value,
            recipientName: recipientName.value,
            fields: dsFields.value
        }

        const { data } = await axios.post<PrefillResponse>(
            `${API_BASE}/api/docusign/generate-prefill`,
            payload,
            { headers: { 'Content-Type': 'application/json' } }
        )

        if (!data?.signingUrl) throw new Error('No signingUrl returned')
        signingUrl.value = data.signingUrl
    } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        errorMsg.value = `Unable to start DocuSign: ${msg}`
        $q.notify({ type: 'negative', message: errorMsg.value })
    } finally {
        loading.value = false
    }
}

async function retry() {
    signingUrl.value = null
    await createPrefill()
}

onMounted(async () => {
    if (!requested.value) {
        requested.value = true
        await createPrefill()
    }
})
</script>

<template>
    <div class="q-gutter-md">
        <div class="row q-gutter-sm q-mb-sm">
            <q-btn color="secondary" label="Back" @click="emit('back')" />
            <q-space />
            <!-- Optional: allow proceeding after signing is completed (you can also wire DS event to auto-next) -->
            <q-btn :disable="!signingUrl" color="primary" label="Next" @click="emit('next')" />
        </div>

        <q-card flat bordered class="rounded-borders">
            <q-card-section>
                <div class="text-subtitle1 q-mb-sm">Sign & Consent</div>

                <div v-if="loading" class="relative-position" style="min-height: 200px;">
                    <q-inner-loading showing />
                    <div class="text-caption q-mt-sm">Preparing your DocuSign envelope…</div>
                </div>

                <div v-else-if="errorMsg" class="column items-start q-gutter-sm">
                    <q-banner class="bg-negative text-white rounded-borders">
                        {{ errorMsg }}
                    </q-banner>
                    <q-btn color="primary" icon="refresh" label="Try again" @click="retry" />
                </div>

                <div v-else-if="signingUrl">
                    <!-- Embedded signing -->
                    <div class="q-mt-sm" style="height: 75vh; border-radius: 8px; overflow: hidden;">
                        <iframe :src="signingUrl" title="DocuSign Embedded Signing"
                            style="width: 100%; height: 100%; border: 0;" allow="clipboard-read; clipboard-write"
                            referrerpolicy="no-referrer" />
                    </div>
                    <div class="text-caption text-grey-7 q-mt-sm">
                        If the signing window doesn’t appear, your browser may be blocking third-party cookies or
                        iframes. You can also
                        <a :href="signingUrl" target="_blank" rel="noopener">open the signing link in a new tab</a>.
                    </div>
                </div>

                <div v-else class="text-body2">
                    Nothing to sign yet.
                </div>
            </q-card-section>
        </q-card>
    </div>
</template>

<style scoped>
.rounded-borders {
    border-radius: 12px;
}
</style>
