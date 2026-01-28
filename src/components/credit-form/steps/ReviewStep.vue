<script setup lang="ts">
import { computed } from 'vue'
import type { CreditForm } from '../types'

const props = defineProps<{ modelValue: CreditForm }>()
const emit = defineEmits(['update:modelValue', 'back', 'next', 'jump'])

const f = computed(() => props.modelValue)
const fieldUi = { filled: true, 'bg-color': 'grey-2', dense: true, readonly: true } as const

function onBack() { emit('back') }
function onNext() { emit('next') }
function onJump(step: 'business' | 'credit' | 'tax') { emit('jump', step) }
</script>

<template>
        <div class="q-pa-md">
                <q-card flat bordered>
                        <q-card-section class="text-h6">Review Your Application</q-card-section>
                        <q-separator />

                        <!-- Business Info -->
                        <q-card-section>
                                <q-btn flat dense class="section-link q-mb-sm" icon="edit" label="Business Information"
                                        @click="onJump('business')" />
                                <div class="row q-col-gutter-md">
                                        <div class="col-12 col-md-6"><q-input v-bind="fieldUi"
                                                        :model-value="f.companyName" label="Firm Name" /></div>
                                        <div class="col-12 col-md-6"><q-input v-bind="fieldUi" :model-value="f.dbaName"
                                                        label="DBA" /></div>
                                        <div class="col-12 col-md-4"><q-input v-bind="fieldUi"
                                                        :model-value="f.entityType" label="Entity Type" /></div>
                                        <div class="col-12 col-md-4"><q-input v-bind="fieldUi" :model-value="f.phone"
                                                        label="Phone" /></div>
                                        <div class="col-12 col-md-4"><q-input v-bind="fieldUi" :model-value="f.fax"
                                                        label="Fax" /></div>
                                        <div class="col-12 col-md-6"><q-input v-bind="fieldUi" :model-value="f.email"
                                                        label="Email" /></div>
                                        <div class="col-12"><q-input v-bind="fieldUi" :model-value="f.address"
                                                        label="Business Address" />
                                        </div>
                                        <div class="col-12 col-md-4"><q-input v-bind="fieldUi" :model-value="f.city"
                                                        label="City" /></div>
                                        <div class="col-6 col-md-2"><q-input v-bind="fieldUi" :model-value="f.state"
                                                        label="State" /></div>
                                        <div class="col-6 col-md-2"><q-input v-bind="fieldUi" :model-value="f.zip"
                                                        label="Postal Code" />
                                        </div>
                                        <div class="col-12 col-md-4"><q-input v-bind="fieldUi" :model-value="f.country"
                                                        label="Country" />
                                        </div>
                                </div>

                                <div v-if="f.mailingDifferent" class="q-mt-sm">
                                        <div class="text-caption text-weight-medium q-mb-xs">Mailing Address</div>
                                        <div class="row q-col-gutter-md">
                                                <div class="col-12 col-md-4"><q-input v-bind="fieldUi"
                                                                :model-value="f.mailing?.country" label="Country" />
                                                </div>
                                                <div class="col-12 col-md-8"><q-input v-bind="fieldUi"
                                                                :model-value="f.mailing?.address"
                                                                label="Mailing Street" /></div>
                                                <div class="col-12 col-md-5"><q-input v-bind="fieldUi"
                                                                :model-value="f.mailing?.city" label="City" /></div>
                                                <div class="col-6 col-md-3"><q-input v-bind="fieldUi"
                                                                :model-value="f.mailing?.state" label="State" /></div>
                                                <div class="col-6 col-md-4"><q-input v-bind="fieldUi"
                                                                :model-value="f.mailing?.zip" label="Postal Code" />
                                                </div>
                                        </div>
                                </div>

                                <div class="q-mt-sm">
                                        <div class="text-caption text-weight-medium q-mb-xs">Contacts</div>
                                        <div class="row q-col-gutter-md">
                                                <div class="col-12 col-md-4" v-for="(c, i) in f.contacts" :key="i">
                                                        <q-card flat bordered>
                                                                <q-card-section class="text-bold">{{ c.role
                                                                        }}</q-card-section>
                                                                <q-card-section class="q-gutter-sm">
                                                                        <q-input v-bind="fieldUi" :model-value="c.name"
                                                                                label="Name" />
                                                                        <q-input v-bind="fieldUi" :model-value="c.title"
                                                                                label="Title" />
                                                                        <q-input v-bind="fieldUi" :model-value="c.email"
                                                                                label="Email" />
                                                                </q-card-section>
                                                        </q-card>
                                                </div>
                                        </div>
                                </div>

                                <div class="row q-col-gutter-md q-mt-sm">
                                        <div class="col-12 col-md-6"><q-input v-bind="fieldUi"
                                                        :model-value="f.requestLineOfCredit ? 'Yes' : 'No'"
                                                        label="Requesting line of credit?" />
                                        </div>
                                        <div class="col-12 col-md-6"><q-input v-bind="fieldUi"
                                                        :model-value="f.requestTaxExempt ? 'Yes' : 'No'"
                                                        label="Requesting tax exemption?" /></div>
                                </div>
                        </q-card-section>

                        <q-separator />

                        <!-- Credit Request (Owners, Bank, Trades) -->
                        <q-card-section v-if="f.requestLineOfCredit">
                                <q-btn flat dense class="section-link q-mb-sm" icon="edit" label="Credit Request"
                                        @click="onJump('credit')" />
                                <div class="row q-col-gutter-md">
                                        <div class="col-12 col-md-6"><q-input v-bind="fieldUi"
                                                        :model-value="f.yearsInBusiness" label="Years in Business" />
                                        </div>
                                        <div class="col-12 col-md-6"><q-input v-bind="fieldUi"
                                                        :model-value="f.creditAmount" label="Amount of Credit Requested"
                                                        prefix="$" /></div>
                                </div>

                                <div class="q-mt-md">
                                        <div class="text-caption text-weight-medium q-mb-xs">Principal Owners &amp;
                                                Officers</div>
                                        <div v-for="(o, i) in f.owners" :key="i"
                                                class="q-pa-sm q-mb-sm bg-grey-2 rounded-borders">
                                                <div class="row q-col-gutter-md">
                                                        <div class="col-12 col-md-4"><q-input v-bind="fieldUi"
                                                                        :model-value="o.name" label="Name" />
                                                        </div>
                                                        <div class="col-12 col-md-4"><q-input v-bind="fieldUi"
                                                                        :model-value="o.title" label="Title" /></div>
                                                        <div class="col-12 col-md-4"><q-input v-bind="fieldUi"
                                                                        :model-value="o.ssn" label="SSN" />
                                                        </div>
                                                        <div class="col-12 col-md-6"><q-input v-bind="fieldUi"
                                                                        :model-value="o.fullTime ? 'Full-Time' : 'Part-Time'"
                                                                        label="Employment" /></div>
                                                </div>
                                                <div class="row q-col-gutter-md q-mt-xs">
                                                        <div class="col-12 col-md-4"><q-input v-bind="fieldUi"
                                                                        :model-value="o.homeAddress?.country"
                                                                        label="Country" /></div>
                                                        <div class="col-12 col-md-8"><q-input v-bind="fieldUi"
                                                                        :model-value="o.homeAddress?.address"
                                                                        label="Home Street" /></div>
                                                        <div class="col-12 col-md-5"><q-input v-bind="fieldUi"
                                                                        :model-value="o.homeAddress?.city"
                                                                        label="City" /></div>
                                                        <div class="col-6 col-md-3"><q-input v-bind="fieldUi"
                                                                        :model-value="o.homeAddress?.state"
                                                                        label="State" /></div>
                                                        <div class="col-6 col-md-4"><q-input v-bind="fieldUi"
                                                                        :model-value="o.homeAddress?.zip"
                                                                        label="Postal Code" /></div>
                                                </div>
                                        </div>
                                </div>

                                <div class="q-mt-md">
                                        <div class="text-caption text-weight-medium q-mb-xs">Credit References</div>
                                        <div v-for="(r, i) in f.tradeRefs" :key="i"
                                                class="q-pa-sm q-mb-sm bg-grey-2 rounded-borders">
                                                <div class="text-weight-medium q-mb-xs">Reference {{ i + 1 }}</div>
                                                <div class="row q-col-gutter-md">
                                                        <div class="col-12 col-md-6"><q-input v-bind="fieldUi"
                                                                        :model-value="r.name" label="Supplier Name" />
                                                        </div>
                                                        <div class="col-12 col-md-6"><q-input v-bind="fieldUi"
                                                                        :model-value="r.accountNo"
                                                                        label="Account Number" /></div>
                                                        <div class="col-12 col-md-4"><q-input v-bind="fieldUi"
                                                                        :model-value="r.phone" label="Phone" /></div>
                                                        <div class="col-12 col-md-4"><q-input v-bind="fieldUi"
                                                                        :model-value="r.fax" label="Fax" />
                                                        </div>
                                                        <div class="col-12 col-md-4"><q-input v-bind="fieldUi"
                                                                        :model-value="r.email" label="Email" /></div>
                                                        <div class="col-12 col-md-4"><q-input v-bind="fieldUi"
                                                                        :model-value="r.address?.country"
                                                                        label="Country" /></div>
                                                        <div class="col-12 col-md-8"><q-input v-bind="fieldUi"
                                                                        :model-value="r.address?.address"
                                                                        label="Address" /></div>
                                                        <div class="col-12 col-md-5"><q-input v-bind="fieldUi"
                                                                        :model-value="r.address?.city" label="City" />
                                                        </div>
                                                        <div class="col-6 col-md-3"><q-input v-bind="fieldUi"
                                                                        :model-value="r.address?.state" label="State" />
                                                        </div>
                                                        <div class="col-6 col-md-4"><q-input v-bind="fieldUi"
                                                                        :model-value="r.address?.zip"
                                                                        label="Postal Code" /></div>
                                                </div>
                                        </div>
                                </div>
                        </q-card-section>

                        <q-separator />

                        <!-- Tax Exemption -->
                        <q-card-section v-if="f.requestTaxExempt">
                                <q-btn flat dense class="section-link q-mb-sm" icon="edit" label="Tax Exemption"
                                        @click="onJump('tax')" />
                                <div class="row q-col-gutter-md">
                                        <div class="col-12 col-md-6"><q-input v-bind="fieldUi"
                                                        :model-value="(f.exemptStates || []).join(', ')"
                                                        label="States registered in" /></div>
                                        <div class="col-12 col-md-6"><q-input v-bind="fieldUi"
                                                        :model-value="f.primaryBusiness"
                                                        label="Primary Type of Business" /></div>
                                </div>
                                <div class="q-mt-sm">
                                        <div class="text-caption text-weight-medium q-mb-xs">Blanket Resale &amp;
                                                Exemption Certificate
                                        </div>
                                        <div class="row q-col-gutter-md">
                                                <div class="col-12 col-md-6"><q-input v-bind="fieldUi"
                                                                :model-value="f.resaleCertificate?.purchaserName"
                                                                label="Purchaser Name" /></div>
                                                <div class="col-12 col-md-4"><q-input v-bind="fieldUi"
                                                                :model-value="f.resaleCertificate?.purchaserCountry"
                                                                label="Country" /></div>
                                                <div class="col-12 col-md-8"><q-input v-bind="fieldUi"
                                                                :model-value="f.resaleCertificate?.purchaserAddress"
                                                                label="Purchaser Address" /></div>
                                                <div class="col-12 col-md-5"><q-input v-bind="fieldUi"
                                                                :model-value="f.resaleCertificate?.purchaserCity"
                                                                label="City" /></div>
                                                <div class="col-6 col-md-3"><q-input v-bind="fieldUi"
                                                                :model-value="f.resaleCertificate?.purchaserState"
                                                                label="State/Province" /></div>
                                                <div class="col-6 col-md-4"><q-input v-bind="fieldUi"
                                                                :model-value="f.resaleCertificate?.purchaserZip"
                                                                label="Postal Code" /></div>
                                                <div class="col-12 col-md-6"><q-input v-bind="fieldUi"
                                                                :model-value="f.resaleCertificate?.productDescription"
                                                                label="Product that you will purchase" /></div>
                                                <div class="col-12 col-md-6"><q-input v-bind="fieldUi"
                                                                :model-value="f.resaleCertificate?.otherExemption"
                                                                label="Other authorized exemption" />
                                                </div>
                                        </div>
                                        <div class="row q-col-gutter-md q-mt-xs">
                                                <div class="col-12 col-md-6"><q-input v-bind="fieldUi"
                                                                :model-value="f.resaleCertificate?.resale ? 'Yes' : 'No'"
                                                                label="Resale" /></div>
                                                <div class="col-12 col-md-6"><q-input v-bind="fieldUi"
                                                                :model-value="f.resaleCertificate?.incorporating ? 'Yes' : 'No'"
                                                                label="Incorporating into product for sale" /></div>
                                        </div>
                                        <div class="row q-col-gutter-md q-mt-xs">
                                                <div class="col-4"><q-input v-bind="fieldUi"
                                                                :model-value="f.resaleCertificate?.effectiveDate?.day"
                                                                label="Day" /></div>
                                                <div class="col-4"><q-input v-bind="fieldUi"
                                                                :model-value="f.resaleCertificate?.effectiveDate?.month"
                                                                label="Month" /></div>
                                                <div class="col-4"><q-input v-bind="fieldUi"
                                                                :model-value="f.resaleCertificate?.effectiveDate?.year"
                                                                label="Year" /></div>
                                                <div class="col-12 col-md-6"><q-input v-bind="fieldUi"
                                                                :model-value="f.resaleCertificate?.signatureName"
                                                                label="Name of purchaser" /></div>
                                                <div class="col-12 col-md-6"><q-input v-bind="fieldUi"
                                                                :model-value="f.resaleCertificate?.signatureTitle"
                                                                label="Title of Authorized Agent" />
                                                </div>
                                                <div class="col-12"><q-input v-bind="fieldUi"
                                                                :model-value="f.resaleCertificate?.signatureDate"
                                                                label="Signature Date" /></div>
                                        </div>

                                        <div class="q-mt-sm">
                                                <div class="text-caption text-weight-medium q-mb-xs">Resale Certificate
                                                        Numbers</div>
                                                <div class="row q-col-gutter-md">
                                                        <template v-for="(num, state) in f.resaleNumbers" :key="state">
                                                                <div class="col-12 col-md-4"><q-input v-bind="fieldUi"
                                                                                :label="`Resale Number for ${state}`"
                                                                                :model-value="num" /></div>
                                                        </template>
                                                </div>
                                        </div>

                                        <div v-if="(f.exemptStates || []).includes('NY')" class="q-mt-md">
                                                <div class="text-caption text-weight-medium q-mb-xs">NY ST-120</div>
                                                <div class="row q-col-gutter-md">
                                                        <div class="col-12 col-md-6"><q-input v-bind="fieldUi"
                                                                        :model-value="f.nySt120.purchaserName"
                                                                        label="Purchaser Name" /></div>
                                                        <div class="col-12 col-md-6"><q-input v-bind="fieldUi"
                                                                        :model-value="f.nySt120.vendorName"
                                                                        label="Vendor Name" /></div>
                                                        <div class="col-12 col-md-6"><q-input v-bind="fieldUi"
                                                                        :model-value="f.nySt120.purchaserCountry"
                                                                        label="Purchaser Country" /></div>
                                                        <div class="col-12"><q-input v-bind="fieldUi"
                                                                        :model-value="f.nySt120.purchaserAddress"
                                                                        label="Purchaser Address" /></div>
                                                        <div class="col-12 col-md-6"><q-input v-bind="fieldUi"
                                                                        :model-value="f.nySt120.nyRegistration"
                                                                        label="NY Registration #" /></div>
                                                        <div class="col-12 col-md-6"><q-input v-bind="fieldUi"
                                                                        :model-value="f.nySt120.signerName"
                                                                        label="Signer Name" /></div>
                                                        <div class="col-12 col-md-6"><q-input v-bind="fieldUi"
                                                                        :model-value="f.nySt120.signerTitle"
                                                                        label="Signer Title" /></div>
                                                        <div class="col-12 col-md-6"><q-input v-bind="fieldUi"
                                                                        :model-value="f.nySt120.signerDate"
                                                                        label="Signer Date" /></div>
                                                </div>
                                        </div>
                                </div>
                        </q-card-section>

                        <q-separator />
                </q-card>

                <div class="row q-gutter-sm q-mt-md">
                        <q-btn color="secondary" label="Back" @click="onBack" />
                        <q-btn color="primary" label="Continue to Sign" @click="onNext" />
                </div>
        </div>
</template>

<style scoped>
.rounded-borders {
        border-radius: 10px;
}

.section-link {
        text-transform: none;
        font-weight: 600;
        text-decoration: underline;
}
</style>
