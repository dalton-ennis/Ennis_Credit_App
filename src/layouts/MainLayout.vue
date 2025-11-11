<script setup lang="ts">
import { ref } from 'vue'
import FaqDialog from 'src/components/FaqDialog.vue'

const showFaq = ref(false)
</script>

<template>
  <q-layout view="hHh lpR fFf">
    <q-header elevated>
      <q-card>
        <q-card-section class="bg-primary text-white">
          <div class="row items-center no-wrap justify-between">
            <div>
              <div class="text-h5">Ennis Customer Credit Application</div>
              <div class="text-body2 opacity-80">Please complete all sections below.</div>
            </div>
            <div class="row items-center">
              <q-btn color="white" text-color="primary" unelevated label="FAQ" icon="help_outline" @click="showFaq = true" />
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
