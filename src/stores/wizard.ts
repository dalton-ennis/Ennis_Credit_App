import { defineStore } from 'pinia'

export type WizardStepId = 'business' | 'credit' | 'tax' | 'sign' | 'review'

export const useWizardStore = defineStore('wizard', {
  state: () => ({
    current: 'business' as WizardStepId,
  }),
  getters: {
    isCredit: (s) => s.current === 'credit',
    isTax: (s) => s.current === 'tax',
    lockAll: (s) => s.current === 'sign' || s.current === 'review',
  },
  actions: {
    setCurrent(step: WizardStepId) {
      this.current = step
    },
  },
})

