<script setup lang="ts">
import CreditAppStepper from 'src/components/credit-form/CreditAppStepper.vue'
</script>

<template>
    <q-page class="q-pa-md bg-grey-1">
        <div class="max-w-screen-md mx-auto">
            <q-card flat bordered>
                <q-card-section class="bg-primary text-white">
                    <div class="text-h5">Credit Application</div>
                    <div class="text-body2 opacity-80">
                        Please complete all sections below.
                    </div>
                </q-card-section>

                <q-card-section>
                    <CreditAppStepper />
                </q-card-section>
            </q-card>
        </div>
    </q-page>
</template>



<style scoped>
.max-w-screen-md {
    max-width: 1500px;
    margin: 0 auto;
}
</style>
