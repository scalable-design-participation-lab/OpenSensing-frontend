<template>
  <template v-for="feature in features" :key="feature.id">
    <ol-feature>
      <ol-geom-point :coordinates="feature.coordinates" />
      <ol-style>
        <ol-style-icon
          :src="getIconForFeature(feature)"
          :scale="1"
          :anchor="[0.5, 0.5]"
        />
      </ol-style>
    </ol-feature>
    <ol-overlay :position="feature.coordinates" :offset="[0, 0]">
      <div
        class="cursor-pointer text-black-500 rounded-full p-0.5 flex justify-center items-center shadow-md"
        @click.stop="$emit('toggle-comment-popup', feature)"
      >
        <img
          src="@/assets/icons/open-icon.svg"
          alt="Open Icon"
          class="w-6 h-6"
        />
      </div>
    </ol-overlay>
  </template>
</template>

<script setup lang="ts">
defineProps({
  features: {
    type: Array,
    required: true,
  },
  getIconForFeature: {
    type: Function,
    required: true,
  },
})

defineEmits(['toggle-comment-popup'])
</script>
