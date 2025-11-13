<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import FaqDialog from 'src/components/FaqDialog.vue'
import { plantTypes, isPlantCode, type PlantDetails } from 'src/utility/Utility'

const route = useRoute()

const plantDetails = ref<PlantDetails | null>(null)

onMounted(() => {
  const p = Array.isArray(route.params.plant)
    ? route.params.plant[0]
    : route.params.plant

  if (isPlantCode(p)) {
    plantDetails.value = plantTypes[p]     // safe after narrowing
  } else {
    plantDetails.value = null
  }
})

const showFaq = ref(false)
</script>


<template>
  <q-layout view="hHh lpR fFf">
    <q-header elevated>
      <q-card>
        <q-card-section :class="plantDetails?.color">
          <!-- <q-img :src="plantDetails.icon" /> -->
          <div class="row items-center no-wrap justify-between">
            <div>
              <div class="text-h5">{{ route.params.plant ?? 'Ennis' }} Customer Credit Application</div>
              <div class="text-body2 opacity-80">Please complete all sections below.</div>
            </div>
            <div class="row items-center">
              <q-btn color="white" text-color="primary" unelevated label="FAQ" icon="help_outline"
                @click="showFaq = true" />
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
