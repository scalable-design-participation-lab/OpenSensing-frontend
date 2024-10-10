<template>
  <ol-feature v-for="feature in polygonFeatures" :key="feature.id">
    <ol-geom-polygon :coordinates="feature.coordinates" />
    <ol-style>
      <ol-style-stroke color="black" :width="2" :line-dash="[10, 10]" />
      <ol-style-fill :color="[0, 0, 0, 0]" />
    </ol-style>
  </ol-feature>

  <ol-overlay
    v-for="feature in visiblePolygonFeatures"
    :key="`overlay-${feature.id}`"
    :position="getFeatureIconPosition(feature)"
    :offset="[0, 0]"
  >
    <div
      class="cursor-pointer text-black-500 rounded-full p-0.5 flex justify-center items-center shadow-md"
      @click.stop="toggleCommentPopup(feature)"
    >
      <svg
        width="18"
        height="18"
        viewBox="0 0 18 18"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle cx="9" cy="9" r="9" fill="black" />
        <path
          d="M9 14L9 4"
          stroke="white"
          stroke-width="4"
          stroke-linecap="round"
        />
        <path
          d="M4 9L14 9"
          stroke="white"
          stroke-width="4"
          stroke-linecap="round"
        />
      </svg>
    </div>
  </ol-overlay>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useMapUIStore } from '@/stores/mapUI'

const emit = defineEmits(['toggle-comment-popup'])

const mapUIStore = useMapUIStore()

const polygonFeatures = computed(() =>
  mapUIStore.features.filter((feature) => feature.type === 'Polygon')
)

const visiblePolygonFeatures = computed(() => {
  const spaceSubwindow = mapUIStore.spaceSubwindow
  return spaceSubwindow === 3 ? polygonFeatures.value : []
})

function getFeatureIconPosition(feature) {
  const coordinates = feature.coordinates[0]
  const sumX = coordinates.reduce((sum, coord) => sum + coord[0], 0)
  const sumY = coordinates.reduce((sum, coord) => sum + coord[1], 0)
  const centerX = sumX / coordinates.length
  const centerY = sumY / coordinates.length
  return [centerX, centerY]
}

function toggleCommentPopup(feature) {
  emit('toggle-comment-popup', feature)
}
</script>
