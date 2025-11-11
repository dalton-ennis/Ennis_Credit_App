<script setup lang="ts">
import { ref, watch } from 'vue'

// Expose a v-model style prop for open/close control
const props = defineProps<{ modelValue: boolean }>()
const emit = defineEmits<{ (e: 'update:modelValue', value: boolean): void }>()

const isOpen = ref(props.modelValue)

watch(
  () => props.modelValue,
  (v) => {
    isOpen.value = v
  }
)

function close() {
  emit('update:modelValue', false)
}

type FaqItem = { q: string; a: string }
type FaqSection = { title: string; items: FaqItem[] }

const sections: FaqSection[] = [
  {
    title: 'General Application',
    items: [
      {
        q: 'Who should complete the credit application?',
        a: 'An authorized officer or company representative should complete the application. Preferably an owner, since the Personal Guarantee must be signed by an owner when terms are requested.'
      },
      {
        q: 'How long does it take to process a credit application?',
        a: 'Most applications are reviewed within 3–5 business days.'
      },
      {
        q: 'Can we submit our own credit application form instead of yours?',
        a: 'No. Please use our application and accept our terms and conditions.'
      },
      {
        q: 'If I want to pay by credit card or prepay, do I still need to fill out the application?',
        a: 'Yes. The customer application is required even when prepaying. Complete Section 1 (customer information) and the signature pages, and accept our terms and conditions.'
      },
      {
        q: 'How will I know when my application has been approved?',
        a: 'You will receive an email confirmation once your account has been reviewed and approved.'
      }
    ]
  },
  {
    title: 'Credit Terms & Account Management',
    items: [
      {
        q: 'What are your standard credit terms?',
        a: 'Typically Net 30 days from invoice date with approved credit, unless otherwise stated in your approval notice.'
      }
    ]
  },
  {
    title: 'Personal Guarantee',
    items: [
      {
        q: 'Will a personal guarantee be required?',
        a: 'Yes. A personal guarantee is required when applying for open account terms.'
      }
    ]
  },
  {
    title: 'Account Updates & Past Due',
    items: [
      {
        q: 'How can I update my company or billing information after approval?',
        a: 'Contact our Credit Department or submit the Account Update form on our website. The Hotline can assist with questions about the online portion.'
      },
      {
        q: 'What happens if my account becomes past due?',
        a: 'Late payments may result in suspended shipments or reversion to prepayment terms until the account is current.'
      }
    ]
  },
  {
    title: 'Resale & Tax Exemption',
    items: [
      {
        q: 'Who needs to complete a resale or exemption certificate?',
        a: 'Any customer claiming sales tax exemption or resale status must provide a completed and signed exemption certificate before tax can be excluded from invoices.'
      },
      {
        q: 'Do you keep resale certificates on file?',
        a: 'Yes. Certificates are kept on file and must be renewed if the exemption number or business name changes. When resale certificates expire, an updated version must be submitted.'
      },
      {
        q: 'What if I forget to submit my exemption certificate before placing an order?',
        a: 'Sales tax may be charged until a valid certificate is received. Previously charged tax cannot be refunded retroactively.'
      }
    ]
  },
  {
    title: 'Technical & Support',
    items: [
      {
        q: 'Who can I contact if I have questions about the form or upload process?',
        a: 'For credit application questions, contact our Credit Department. For upload assistance, the Hotline can help: hotlinesupport@ennis.com or hotline@ennis.com.'
      },
      {
        q: 'Can I save and finish the online form later?',
        a: 'Yes. You can save your progress and return using the secure link emailed to you.'
      },
      {
        q: 'Is my information secure?',
        a: 'Yes. Submissions are encrypted and stored securely in compliance with applicable data privacy laws.'
      },
      {
        q: 'Can international customers apply for credit or exemption status?',
        a: 'International customers are reviewed on a case‑by‑case basis. Please contact our Credit Department before submitting.'
      }
    ]
  }
]
</script>

<template>
  <q-dialog :model-value="isOpen" @update:model-value="emit('update:modelValue', $event)">
    <q-card style="max-width: 900px; width: 95vw; max-height: 90vh" class="column no-wrap">
      <q-card-section class="row items-center justify-between bg-primary text-white">
        <div class="text-h6">Frequently Asked Questions</div>
        <q-btn dense flat icon="close" color="white" @click="close" aria-label="Close FAQ" />
      </q-card-section>

      <q-card-section class="scroll">
        <q-list separator>
          <div v-for="section in sections" :key="section.title" class="q-mb-md">
            <div class="text-subtitle1 text-weight-bold q-mb-sm">{{ section.title }}</div>
            <q-expansion-item
              v-for="(item, idx) in section.items"
              :key="section.title + '-' + idx"
              expand-icon="expand_more"
              icon="help_outline"
              :label="item.q"
            >
              <q-card>
                <q-card-section>
                  <div class="text-body1">{{ item.a }}</div>
                </q-card-section>
              </q-card>
            </q-expansion-item>
          </div>
        </q-list>
      </q-card-section>
    </q-card>
  </q-dialog>
  
</template>

<style scoped>
.scroll {
  overflow: auto;
}
</style>
