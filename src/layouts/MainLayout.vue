<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import FaqDialog from 'src/components/FaqDialog.vue'
import { plantTypes, isPlantCode, type PlantDetails } from 'src/utility/Utility'
import { useWizardStore } from 'src/stores/wizard'
// import { useWizardStore } from 'src/stores/wizard'
const route = useRoute()
const wizard = useWizardStore()
const plantDetails = ref<PlantDetails | null>(null)
const isAdmin = ref(false)

// const wizard = useWizardStore()

onMounted(() => {
  const p = Array.isArray(route.params.plant)
    ? route.params.plant[0]
    : route.params.plant

  if (isPlantCode(p)) {
    plantDetails.value = plantTypes[p]     // safe after narrowing
  } else {
    plantDetails.value = plantTypes['default']
  }
})

const showFaq = ref(false)

function toUpperAndHyphen(str: string): string {
  if (!str) return '';

  return str
    .split('-')
    .map(segment => segment.toUpperCase())
    .join('-');
}

onMounted(() => {
  if (route.fullPath.includes('admin')) {
    isAdmin.value = true
  }
})

</script>


<template>
  <q-layout view="hHh lpR fFf">
    <q-header elevated>
      <q-card>
        <q-card-section :class="plantDetails?.color">
          <div class="row items-center no-wrap justify-between">
            <div v-if="!isAdmin" class="col-8">
              <div>
                <div class="row">
                  <!-- <div class="col-4">
                    <q-img v-if="wizard.plantLogo" :src="wizard.plantLogo" height="0px" />
                  </div> -->
                  <div class="col-8">
                    <div class="text-h5">{{ toUpperAndHyphen(wizard.plantName as string) ?? 'Ennis' }} Customer Credit
                      Application</div>
                    <div class="text-body2 opacity-80">Please complete all sections below.</div>
                  </div>
                </div>
              </div>
            </div>

            <div v-else class="col-4">
              <div class="text-h5">
                Customer Credit Application - Admin
              </div>
              <div class="text-body2 opacity-80">Link Generator</div>
            </div>

            <div class="col-2">
              <div v-if="!isAdmin" class="row items-center">
                <q-btn color="white" text-color="primary" unelevated label="admin" class="q-mr-sm" href="/admin" />
                <q-btn color="white" text-color="primary" unelevated label="FAQ" icon="help_outline"
                  @click="showFaq = true" />
              </div>
            </div>
          </div>
        </q-card-section>
      </q-card>
    </q-header>
    <q-page-container>
      <q-card-section>
        <router-view />
      </q-card-section>
    </q-page-container>
  </q-layout>
  <FaqDialog v-model="showFaq" />
</template>

<style scoped></style>
