<template>
  <UCard>
    <div class="space-y-4">
      <UProgress :value="progressPercentage" color="yellow" class="mb-4" />
      <div v-if="title || icon" class="flex items-center space-x-2">
        <UIcon v-if="icon" :name="icon" class="text-2xl" />
        <h2 v-if="title" class="text-xl font-semibold text-black">
          {{ title }}
        </h2>
      </div>
      <p v-if="paragraph" class="text-sm text-gray-500 dark:text-gray-400">
        {{ paragraph }}
      </p>

      <UButton
        v-if="button"
        :color="button.color"
        class="w-full mb-2"
        @click="button.action"
      >
        {{ button.text }}
      </UButton>

      <div v-if="buttonGroup" class="space-y-2">
        <UButton
          v-for="btn in buttonGroup"
          :key="btn.text"
          :color="btn.color"
          class="w-full mb-2"
          @click="btn.action"
        >
          {{ btn.text }}
        </UButton>
      </div>

      <div v-if="iconGrid" class="mt-4">
        <p class="text-sm text-gray-600 mb-2">{{ iconGrid.title }}</p>
        <div class="grid grid-cols-3 gap-4">
          <UButton
            v-for="icon in iconGrid.icons"
            :key="icon.name"
            variant="ghost"
            class="p-2 flex items-center justify-center"
            @click="iconGrid.onSelect(icon.name)"
          >
            <img :src="icon.src" :alt="icon.name" class="w-12 h-12" />
          </UButton>
        </div>
      </div>

      <slot></slot>

      <UButtonGroup class="mt-4">
        <UButton
          icon="i-heroicons-arrow-left-20-solid"
          color="gray"
          variant="ghost"
          :disabled="currentSubwindow === 1"
          @click="$emit('prev')"
        />
        <UButton
          icon="i-heroicons-arrow-right-20-solid"
          color="gray"
          variant="ghost"
          :disabled="currentSubwindow === maxSubwindow"
          @click="$emit('next')"
        />
      </UButtonGroup>
    </div>
  </UCard>
</template>

<script setup lang="ts">
interface Button {
  text: string
  color: string
  action: () => void
}

interface IconGridItem {
  name: string
  src: string
}

interface IconGrid {
  title: string
  icons: IconGridItem[]
  onSelect: (iconName: string) => void
}

defineProps({
  currentSubwindow: {
    type: Number,
    required: true,
  },
  maxSubwindow: {
    type: Number,
    required: true,
  },
  progressPercentage: {
    type: Number,
    required: true,
  },
  title: {
    type: String,
    default: '',
  },
  icon: {
    type: String,
    default: '',
  },
  paragraph: {
    type: String,
    default: '',
  },
  button: {
    type: Object as () => Button,
    default: null,
  },
  buttonGroup: {
    type: Array as () => Button[],
    default: () => [],
  },
  iconGrid: {
    type: Object as () => IconGrid,
    default: null,
  },
})

defineEmits(['prev', 'next'])
</script>
