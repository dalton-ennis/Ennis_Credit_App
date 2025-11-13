// src/router/routes.ts
import type { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      { path: '', redirect: 'creditapp' }, // note: no leading slash inside children
      { path: 'credit-form', component: () => import('pages/CreditAppInvitePage.vue') },
      { path: 'creditapp', component: () => import('pages/CreditAppInvitePage.vue') },
      { path: ':plant/creditapp/:guid', component: () => import('pages/CreditAppInvitePage.vue') },
      { path: 'admin', component: () => import('pages/AdminPage.vue') },
      { path: ':catchAll(.*)*', component: () => import('pages/ErrorNotFound.vue') },
    ],
  },
]

export default routes
