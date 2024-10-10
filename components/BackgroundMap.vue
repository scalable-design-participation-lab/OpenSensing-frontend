<template>
  <ol-map
    :load-tiles-while-animating="true"
    :load-tiles-while-interacting="true"
    style="width: 100%; height: 100vh"
    @click="handleMapClick"
  >
    <ol-view
      ref="view"
      :center="[28.41097, 49.23278]"
      :zoom="18"
      :projection="projection"
    />

    <ol-tile-layer>
      <ol-source-osm />
    </ol-tile-layer>

    <ol-tile-layer>
      <ol-source-tile-arcgis-rest
        :url="arcgisUrl"
        :tile-size="[1024, 1024]"
        :params="requestParams"
      />
    </ol-tile-layer>

    <DrawingLayer
      :projection="projection"
      @toggle-comment-popup="toggleCommentPopup"
    />

    <ol-overlay
      v-if="commentPopupVisible"
      :position="commentPopupPosition"
      :offset="[30, 20]"
    >
      <CommentPopup
        :is-visible="commentPopupVisible"
        :feature-id="selectedFeatureId"
        class="z-50"
        @close="closeCommentPopup"
      />
    </ol-overlay>
  </ol-map>

  <CommentPopup
    :is-visible="commentPopupVisible"
    :feature-id="selectedFeatureId"
    @close="closeCommentPopup"
  />
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useMapUIStore } from '@/stores/mapUI'

const mapUIStore = useMapUIStore()

const projection = ref('EPSG:4326')
const commentPopupVisible = ref(false)
const selectedFeatureId = ref(null)
const commentPopupPosition = ref(null)

const arcgisUrl =
  'https://services.wvgis.wvu.edu/arcgis/rest/services/Imagery_BaseMaps_EarthCover/wv_imagery_WVGISTC_leaf_off_mosaic/MapServer'
const requestParams = {
  layers: 'show:30,27,24,23,22',
  format: 'PNG32',
  f: 'image',
  dpi: 96,
  transparent: true,
  bboxSR: 102100,
  imageSR: 102100,
  size: '1024,1024',
  _ts: false,
}

function toggleCommentPopup(feature) {
  if (commentPopupVisible.value && selectedFeatureId.value === feature.id) {
    closeCommentPopup()
  } else {
    openCommentPopup(feature)
  }
}

function openCommentPopup(feature) {
  selectedFeatureId.value = feature.id
  commentPopupVisible.value = true
  if (feature.type === 'Point') {
    commentPopupPosition.value = feature.coordinates
  } else if (feature.type === 'Polygon') {
    const coordinates = feature.coordinates[0] // 取外环坐标
    const sumX = coordinates.reduce((sum, coord) => sum + coord[0], 0)
    const sumY = coordinates.reduce((sum, coord) => sum + coord[1], 0)
    const centerX = sumX / coordinates.length
    const centerY = sumY / coordinates.length
    commentPopupPosition.value = [centerX, centerY]
  } else {
    commentPopupPosition.value = feature.coordinates[0]
  }
}

function closeCommentPopup() {
  commentPopupVisible.value = false
  selectedFeatureId.value = null
}

function handleMapClick(event) {
  if (mapUIStore.drawEnable && mapUIStore.drawType === 'Point') {
    const coordinate = event.coordinate
    mapUIStore.addFeature({
      type: 'Point',
      coordinates: coordinate,
      frequency: mapUIStore.currentFrequency,
    })
  }
}
</script>
