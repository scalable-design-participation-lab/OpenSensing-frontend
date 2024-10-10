<!--
 * MapDashboard Component
 * 
 * This component renders a map with sensor markers using Mapbox GL and deck.gl.
 * It displays sensor locations, allows interaction with sensors, and updates
 * the map based on user interactions and selected sensors.
 * 
 * @displayName MapDashboard
 * @usage
 * <MapDashboard />
 -->

<template>
  <div>
    <main id="main-container" />
    <SensorTag
      v-if="showSensorTag && showSensorInfo"
      :marker-position="markerPosition"
    />
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, watch, computed } from 'vue'
import { MapboxLayer } from '@deck.gl/mapbox'
import { IconLayer } from '@deck.gl/layers'
import { storeToRefs } from 'pinia'
import { useSensorDetailStore } from '../../stores/sensorDetail'
import { useMapStore } from '../../stores/map'
import mapboxgl from 'mapbox-gl'

interface Props {
  showIconLayer: boolean
  showSensorTag: boolean
}

const props = withDefaults(defineProps<Props>(), {
  showIconLayer: true,
  showSensorTag: true,
})

/**
 * Mapbox access token
 * @type {string}
 */
const accessToken =
  'pk.eyJ1IjoiY2VzYW5kb3ZhbDA5IiwiYSI6ImNsdHl3OXI0eTBoamkya3MzamprbmlsMTUifQ.bIy013nDKsteOtWQRZMjqw'

const sensorDetailStore = useSensorDetailStore()
const mapStore = useMapStore()

const { sensors, selectedSensorId, showSensorInfo } =
  storeToRefs(sensorDetailStore)
const { mapType, mapCenter } = storeToRefs(mapStore)
const { updateSelectedSensor, updateClickPosition } = sensorDetailStore
const { updateMapCenter } = mapStore

/**
 * Mapbox map instance
 * @type {mapboxgl.Map}
 */
let map: mapboxgl.Map

/**
 * Position of the marker for the selected sensor
 * @type {import('vue').Ref<{x: number, y: number}>}
 */
const markerPosition = ref({ x: 0, y: 0 })

/**
 * Computed property for the currently selected sensor
 * @type {import('vue').ComputedRef<import('@/types').Sensor | undefined>}
 */
const selectedSensor = computed(() =>
  sensors.value.find((s) => s.id === selectedSensorId.value)
)

onMounted(() => loadMapDraw())

/**
 * Adds an icon layer to the map for sensor markers
 */
const addIconLayer = () => {
  if (!props.showIconLayer) return

  const ICON_MAPPING = {
    marker: { x: 0, y: 0, width: 128, height: 128, mask: true },
  }

  map.addLayer(
    new MapboxLayer({
      id: 'sensor-markers',
      type: IconLayer,
      data: sensors.value,
      pickable: true,
      iconAtlas:
        'https://raw.githubusercontent.com/visgl/deck.gl-data/master/website/icon-atlas.png',
      iconMapping: ICON_MAPPING,
      getIcon: () => 'marker',
      getPosition: (d) => d.coordinates,
      getSize: () => 40,
      getColor: (d) =>
        d.status === 'Active'
          ? [0, 255, 0]
          : d.status === 'Inactive'
          ? [255, 0, 0]
          : [255, 255, 0],
      onClick: (info) => {
        if (info.object) {
          updateSelectedSensor(info.object.id)
          updateClickPosition({ x: info.x, y: info.y })
          updateMarkerPosition()
        }
      },
    })
  )
}

/**
 * Initializes and loads the Mapbox map
 */
const loadMapDraw = () => {
  mapboxgl.accessToken = accessToken

  map = new mapboxgl.Map({
    container: 'main-container',
    style: `mapbox://styles/mapbox/${mapType.value}-v9`,
    center: [-71.0892, 42.3398], // Center of NEU campus
    zoom: 15,
    attributionControl: false,
  })

  map.on('load', () => {
    addIconLayer()
    map.on('move', updateMarkerPosition)
  })
}

/**
 * Updates the position of the marker for the selected sensor
 */
const updateMarkerPosition = () => {
  if (selectedSensor.value && map) {
    const pixelPosition = map.project(selectedSensor.value.coordinates)
    markerPosition.value = {
      x: pixelPosition.x,
      y: pixelPosition.y,
    }
  }
}

watch(mapType, (newMapType) => {
  if (map) {
    map.setStyle(`mapbox://styles/mapbox/${newMapType}-v9`)
    map.once('style.load', () => {
      addIconLayer()
    })
  }
})

watch(selectedSensorId, (newId) => {
  if (newId && map) {
    const sensor = sensors.value.find((s) => s.id === newId)
    if (sensor) {
      map.flyTo({
        center: sensor.coordinates,
        zoom: 17,
        duration: 1000,
      })

      map.once('moveend', () => {
        const center = map.getCenter()
        updateMapCenter({ lng: center.lng, lat: center.lat })
        updateMarkerPosition()
      })
    }
  }
})

watch(
  () => props.showIconLayer,
  (newValue) => {
    if (map) {
      if (newValue) {
        addIconLayer()
      } else {
        if (map.getLayer('sensor-markers')) {
          map.removeLayer('sensor-markers')
        }
      }
    }
  }
)
</script>

<style lang="postcss" scoped>
#main-container {
  width: 100%;
  min-height: 100vh;
  margin: 0;
  flex-direction: column;
}
</style>
