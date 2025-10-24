<script setup lang="ts">

</script>

<template>
  <q-layout view="hHh lpR fFf">
    <q-header elevated>
      <q-card>
        <q-card-section class="bg-primary text-white">
          <div class="text-h5">Ennis Customer Credit Application</div>
          <div class="text-body2 opacity-80">
            Please complete all sections below.
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
</template>

<style scoped></style>
