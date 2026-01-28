<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import axios from 'axios'
import { useQuasar } from 'quasar'
import type { CreditForm } from '../types'
import { useRoute } from 'vue-router'

const props = defineProps<{ modelValue: CreditForm; etag?: string | null }>()

const route = useRoute()
const $q = useQuasar()

const API_BASE = import.meta.env.VITE_BE_ENDPOINT ?? 'https://localhost:7009'

const loading = ref(false)
const errorMsg = ref<string | null>(null)
const signingUrl = ref<string | null>(null)
const requested = ref(false)

const recipientEmail = computed(() => props.modelValue.email || 'customer@example.com')
const recipientName = computed(() => props.modelValue.companyName || 'Customer')

type PrefillResponse = {
    url: string
    envelopeId?: string
    statusDateTime?: string
    status?: string
}

const ensureQuotedEtag = (value: string | null | undefined): string | null => {
    if (!value) return null
    const trimmed = value.trim()
    if (!trimmed) return null
    const hasQuotes = trimmed.startsWith('"') && trimmed.endsWith('"')
    return hasQuotes ? trimmed : `"${trimmed}"`
}

async function createPrefill() {
    loading.value = true
    errorMsg.value = null

    try {
        const primaryOwner = props.modelValue.contacts?.[0]

        const payload = {
            recipientEmail: recipientEmail.value,
            recipientName: recipientName.value,
            customerFinanceName: props.modelValue.customerFinanceName ?? '',
            customerFinanceEmail: props.modelValue.customerFinanceEmail ?? '',
            csaName: props.modelValue.csaName ?? '',
            csaEmail: props.modelValue.csaEmail ?? '',
            ownerName: primaryOwner?.name ?? '',
            ownerEmail: primaryOwner?.email ?? '',
            applicationGuid: route.params.guid,
            LogoPath:
                props.modelValue.Plant?.Logo ??
                'https://customer.ennis.com/images/ennis.png',
            ...props.modelValue
        }

        const { data } = await axios.post<PrefillResponse>(
            `${API_BASE}/api/credit-app/start-signing`,
            payload,
            { headers: { 'Content-Type': 'application/json' } }
        )

        if (!data?.url) throw new Error('No signing URL returned')

        signingUrl.value = data.url
        const ifMatch = ensureQuotedEtag(props.etag)
        if (ifMatch) {
            try {
                const requestPayload: Record<string, unknown> = {}
                if (data.envelopeId) requestPayload.envelopeId = data.envelopeId
                if (data.statusDateTime) requestPayload.docusignStatusDateTime = data.statusDateTime

                await axios.patch(
                    `${API_BASE}/api/apps/${route.params.guid as string}/docusign/requests`,
                    requestPayload,
                    { headers: { 'If-Match': ifMatch } }
                )

                await axios.put(`${API_BASE}/api/apps/${route.params.guid as string}/status`, {
                    status: data.status,
                })
            } catch (err) {
                const msg = err instanceof Error ? err.message : String(err)
                $q.notify({ type: 'warning', message: `DocuSign status update failed: ${msg}` })
            }
        } else {
            $q.notify({ type: 'warning', message: 'Missing application ETag. Unable to update DocuSign status.' })
        }

        window.location.assign(data.url)
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
        <q-card flat bordered class="rounded-borders">
            <q-card-section>
                <div class="text-subtitle1 q-mb-sm">Sign & Consent</div>

                <div v-if="loading" class="relative-position" style="min-height: 200px;">
                    <q-inner-loading showing />
                    <div class="text-caption q-mt-sm">Opening a secure DocuSign link for signing.</div>
                </div>

                <div v-else-if="errorMsg" class="column items-start q-gutter-sm">
                    <q-banner class="bg-negative text-white rounded-borders">
                        {{ errorMsg }}
                    </q-banner>
                    <q-btn color="primary" icon="refresh" label="Try again" @click="retry" />
                </div>

                <div v-else-if="signingUrl" class="q-gutter-sm">
                    <div class="text-body2">
                        We are redirecting you to a secure DocuSign signing page.
                    </div>
                    <q-btn color="primary" icon="open_in_new" label="Open DocuSign" :href="signingUrl" target="_blank"
                        rel="noopener" />
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
