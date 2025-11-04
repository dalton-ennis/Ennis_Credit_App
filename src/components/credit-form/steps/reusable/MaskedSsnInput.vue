<script setup lang="ts">
import { computed, ref } from 'vue'

type RuleResult = boolean | string
type RuleFn = (v: unknown) => RuleResult | Promise<RuleResult>
type FieldUi = Record<string, unknown>


const props = defineProps<{
    modelValue: string
    label?: string
    rules?: RuleFn[]
    fieldUi?: FieldUi
}>()

const emit = defineEmits<{
    (e: 'update:modelValue', v: string): void
}>()

const isFocused = ref(false)

function maskSSN(val: string): string {
    const d = (val || '').replace(/\D/g, '').slice(0, 9)
    if (!d) return ''
    // Show ***-**-LAST4; handle partial gracefully
    const last4 = d.slice(-4)
    return `***-**-${last4.padStart(Math.min(4, d.length), '*')}`
}

const displayValue = computed(() =>
    isFocused.value ? props.modelValue : maskSSN(props.modelValue)
)
</script>

<template>
    <q-input v-bind="fieldUi" :label="label ?? 'Social Security Number *'" :model-value="modelValue"
        :display-value="displayValue" mask="###-##-####" fill-mask :rules="rules"
        @update:model-value="v => emit('update:modelValue', v as string)" @focus="isFocused = true"
        @blur="isFocused = false" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" />
</template>
