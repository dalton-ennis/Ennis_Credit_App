<script setup lang="ts">

</script>

<template>
  <q-layout view="">
    <q-header elevated>
      <q-toolbar>
        <q-toolbar-title> Ennis </q-toolbar-title>
      </q-toolbar>
    </q-header>
    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<style scoped>
.max-w-screen-md {
  max-width: 1600px;
  background-color: black;
}
</style>