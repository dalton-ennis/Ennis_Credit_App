// src/router/routes.ts
import type { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      { path: '', redirect: 'credit-form' }, // note: no leading slash inside children
      { path: 'credit-form', component: () => import('pages/CreditFormPage.vue') },
      { path: ':catchAll(.*)*', component: () => import('pages/ErrorNotFound.vue') },
    ],
  },
]

export default routes
