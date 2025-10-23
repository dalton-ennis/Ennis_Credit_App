<script setup lang="ts">
import { useCreditForm } from './useCreditForm'
// import { z } from 'zod'
const { form, step, showResale, showNY, next, back } = useCreditForm()
import {
    BusinessInfoStep,
    OwnersStep,
    CreditRequestStep,
    BankReferenceStep,
    SupplierReferencesStep,
    ResaleStep,
    NYStep,
    SignatureStep,
    ReviewStep
} from './steps'


/** Validation (per-step Zod schemas) **/
// const baseBusinessSchema = z.object({
//     firmName: z.string().min(2, 'Required'),
//     phone: z.string().min(10, 'Enter phone'),
//     email: z.string().email('Enter valid email'),
//     address: z.string().min(3, 'Required'),
//     city: z.string().min(2, 'Required'),
//     state: z.string().length(2, 'Pick a state'),
//     zip: z.string().min(5, 'Enter ZIP'),
//     entityType: z.enum(['Proprietorship', 'Partnership', 'Corporation', 'Branch'])
// })

// const ownersSchema = z.object({
//     owners: z.array(z.object({
//         name: z.string().min(2, 'Owner name required'),
//         title: z.string().min(2, 'Title required'),
//         ssn: z.string().regex(/^\d{3}-\d{2}-\d{4}$/, 'Format 000-00-0000'),
//         fullTime: z.boolean().optional()
//     })).min(1, 'At least one owner/officer')
// })

// const creditSchema = z.object({
//     creditAmount: z
//         .union([z.number().nonnegative(), z.nan()])
//         .optional()
//         .refine((val) => typeof val === 'number' && !isNaN(val), {
//             message: 'Enter a number',
//         }),

//     poRequired: z.boolean().optional()
// })

// const bankSchema = z.object({
//     bankName: z.string().min(2, 'Bank name required'),
//     acctNo: z.string().min(2, 'Account # required'),
//     bankPhone: z.string().min(10, 'Phone required'),
//     bankAddr: z.string().min(3, 'Address required')
// })

// const supplierSchema = z.object({
//     suppliers: z.array(z.object({
//         name: z.string().min(2, 'Name required'),
//         phone: z.string().min(10, 'Phone required'),
//         city: z.string().optional(),
//         state: z.string().optional()
//     })).min(1, 'Need at least one supplier reference')
// })

// const resaleSchema = z.object({
//     isResale: z.boolean().optional(),
//     exemptStates: z.array(z.string()).optional(),
//     resaleNumbers: z.record(z.string(), z.string()).optional()

// })

// const nySchema = z.object({
//     nySt120: z.object({
//         purchaserName: z.string().min(2, 'Required'),
//         purchaserAddress: z.string().min(3, 'Required'),
//         nyRegistration: z.string().min(2, 'Required'),
//         vendorName: z.string().min(2, 'Required')
//     })
// })

// const signatureSchema = z.object({
//     signers: z.array(z.object({
//         name: z.string().min(2, 'Signer name required'),
//         title: z.string().min(2, 'Title required'),
//         agree: z.literal(true).refine((val) => val === true, {
//             message: 'Consent required'
//         }),

//         signatureDataUrl: z.string().optional()
//     })).min(1, 'At least one signer')
// })

/** helpers **/
// function assert<T>(schema: z.ZodTypeAny, data: T) {
//     const parsed = schema.safeParse(data)
//     if (!parsed.success) {
//         const first = parsed.error.issues[0]
//         throw new Error(first?.message || 'Validation error')
//     }
// }

// const $q = (globalThis as any).$q || { notify: (o: unknown) => console.log('Notify:', o) }

// function addOwner() { form.value.owners.push({ name: '', title: '', ssn: '' }) }
// function removeOwner(i: number) { form.value.owners.splice(i, 1) }
// function addSupplier() { form.value.suppliers.push({ name: '', phone: '' }) }
// function removeSupplier(i: number) { form.value.suppliers.splice(i, 1) }

// function toggleResale(v: boolean) { form.value.isResale = v }

// function submitAll() {
//     try {
//         assert(baseBusinessSchema, form.value)
//         assert(ownersSchema, form.value)
//         assert(creditSchema, form.value)
//         assert(bankSchema, form.value)
//         assert(supplierSchema, form.value)
//         if (showResale.value) assert(resaleSchema, form.value)
//         if (showNY.value) assert(nySchema, form.value)
//         assert(signatureSchema, form.value)

//         console.log('SUBMIT payload', JSON.parse(JSON.stringify(form.value)))
//         $q.notify({ type: 'positive', message: 'Application submitted' })
//     } catch (e: unknown) {
//         const err = e instanceof Error ? e.message : String(e)
//         $q.notify({ type: 'negative', message: err || 'Fix validation errors' })
//     }

// }

</script>

<template>
    <q-card flat bordered class="rounded-borders">
        <q-stepper v-model="step" animated color="primary" header-class="bg-grey-2 q-pa-sm rounded-borders">
            <q-step :name="1" :done="step > 1" title="Business Info">
                <BusinessInfoStep v-model="form" @next="next" />
            </q-step>

            <q-step :name="2" :done="step > 2" title="Owners & Officers">
                <OwnersStep v-model="form" @next="next" @back="back" />
            </q-step>

            <q-step :name="3" :done="step > 3" title="Credit Request">
                <CreditRequestStep v-model="form" @next="next" @back="back" />
            </q-step>

            <q-step :name="4" :done="step > 4" title="Bank Reference">
                <BankReferenceStep v-model="form" @next="next" @back="back" />
            </q-step>

            <q-step :name="5" :done="step > 5" title="Supplier References">
                <SupplierReferencesStep v-model="form" @next="next" @back="back" />
            </q-step>


            <q-step :name="6" :done="step > 6" title="Sign & Consent">
                <SignatureStep v-model="form" @next="next" @back="back" />
            </q-step>

            <q-step :name="7" :done="step > 7" title="Review & Submit">
                <ReviewStep :form="form" @back="back" />
            </q-step>

            <q-step v-if="showResale" :name="8" :done="step > 8" title="Resale/Exemption">
                <ResaleStep v-model="form" @next="next" @back="back" />
            </q-step>

            <q-step v-if="showNY" :name="9" :done="step > 9" title="NY ST-120">
                <NYStep v-model="form" @next="next" @back="back" />
            </q-step>
        </q-stepper>
    </q-card>
</template>

<style scoped>
.max-w-screen-md {
    max-width: 1600px;
}

.rounded-borders {
    border-radius: 12px;
}
</style>
