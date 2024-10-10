<template>
  <div v-if="isLoading" class="flex justify-center items-center h-screen">
    Loading...
  </div>
  <div v-else class="flex flex-col min-h-screen">
    <GeneralizedHeader
      class="z-20"
      :left-items="leftItems"
      :right-items="rightItems"
      logo-src="/vector.svg"
      logo-alt="NEU Logo"
      :show-icon="true"
    />

    <main class="flex-grow relative overflow-hidden pt-16">
      <MapDashboard
        class="absolute inset-0"
        :show-icon-layer="true"
        :show-sensor-tag="true"
      />
      <GenericFilterSidebar
        v-if="showFilter && !showDashboard"
        :is-visible="showFilter && !showDashboard"
        title="Filters"
        :filter-sections="filterSections"
        class="fixed top-[calc(4rem+6vh)] right-5 z-[1001] w-[calc(100%-2.5rem)] sm:w-[240px] md:w-[300px] lg:w-[360px] h-[calc(100vh-8rem-8vh)] max-h-[800px] overflow-auto"
        @close="closeFilter"
        @reset="resetAllFilters"
        @filter-change="handleFilterChange"
      />
      <Dashboard
        v-if="showDashboard"
        class="fixed top-[calc(4rem+2vh)] left-1/2 transform -translate-x-1/2 z-20 w-[90%] h-[calc(100vh-8rem-4vh)] overflow-hidden bg-transparent"
      />
      <div class="absolute left-5 top-1/2 transform -translate-y-1/2 z-20">
        <GenericToolbar :tools="sensorTools" @tool-click="handleToolClick" />
      </div>
      <SensorDetail
        v-if="showSensorDetail"
        class="fixed top-[calc(4rem+2vh)] left-1/2 transform -translate-x-1/2 z-20 w-[50%] h-[calc(100vh-8rem-4vh)] overflow-hidden"
      />

      <div
        v-if="showDashboard || showSensorDetail"
        class="fixed inset-0 bg-black bg-opacity-50 z-10"
        @click="closeOverlay"
      ></div>
    </main>
    <GeneralizedFooter class="z-20" />
    <Teleport to="body">
      <DownloadPopup
        v-if="showDownloadPopup"
        :filter-sections="downloadFilterSections"
        @close="showDownloadPopup = false"
        @download="handleDownloadData"
      />
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useDashboardStore } from '@/stores/dashboard'
import { useFilterStore } from '@/stores/filter'
import { useMapStore } from '@/stores/map'
import { useSensorDetailStore } from '@/stores/sensorDetail'
import { useDatasetStore } from '@/stores/datasets'
import { useSensorDataStore } from '@/stores/sensorData'
import { sub } from 'date-fns'

// Dashboard store
const dashboardStore = useDashboardStore()
const { showDashboard, dataDashboardValues, dateRangeUpdate } =
  storeToRefs(dashboardStore)
const { toggleDashboard, updateDataDashboardValues, updateDateRangeUpdate } =
  dashboardStore

// Filter store
const filterStore = useFilterStore()
const { showFilter } = storeToRefs(filterStore)
const { toggleFilter, resetFilters } = filterStore

// Map store
const mapStore = useMapStore()
const { setMapType } = mapStore

// Sensor Detail store
const sensorDetailStore = useSensorDetailStore()
const { showSensorDetail } = storeToRefs(sensorDetailStore)

// Dataset store
const datasetStore = useDatasetStore()
const { existingHubs, existingDatasets } = storeToRefs(datasetStore)
const { updateExistingHubs, updateExistingDatasets } = datasetStore

// Sensor Data store
const sensorDataStore = useSensorDataStore()

const isLoading = ref(false)
const selected = ref({ start: sub(new Date(), { days: 14 }), end: new Date() })
const showDownloadPopup = ref(false)
const selectedDownloadFilters = ref({})

function updateDateRange(newRange) {
  selected.value = newRange
  updateDataDashboardValues('dateRange', [newRange.start, newRange.end])
  updateDateRangeUpdate(new Date())
}

const filterSections = computed(() => [
  {
    name: 'location',
    label: 'Location Selection',
    icon: 'i-heroicons-map-pin',
    component: 'GenericCheckboxGroup',
    props: {
      items: Object.keys(existingHubs.value).map((hub) => ({
        label: hub,
        value: hub,
      })),
      modelValue: existingHubs.value,
    },
  },
  {
    name: 'datasets',
    label: 'Data Selection',
    icon: 'i-heroicons-chart-bar',
    component: 'GenericCheckboxGroup',
    props: {
      items: Object.keys(existingDatasets.value).map((dataset) => ({
        label: dataset,
        value: dataset,
      })),
      modelValue: existingDatasets.value,
    },
  },
  {
    name: 'datetime',
    label: 'Date & Time',
    icon: 'i-heroicons-calendar',
    component: 'GenericDateRangePicker',
    props: {
      modelValue: selected.value,
    },
  },
])

const downloadFilterSections = computed(() => [
  {
    name: 'location',
    label: 'Location Selection',
    icon: 'i-heroicons-map-pin',
    component: 'GenericCheckboxGroup',
    props: {
      items: Object.keys(existingHubs.value).map((hub) => ({
        label: hub,
        value: hub,
      })),
      modelValue: existingHubs.value,
    },
  },
  {
    name: 'datasets',
    label: 'Data Selection',
    icon: 'i-heroicons-chart-bar',
    component: 'GenericCheckboxGroup',
    props: {
      items: Object.keys(existingDatasets.value).map((dataset) => ({
        label: dataset,
        value: dataset,
      })),
      modelValue: existingDatasets.value,
    },
  },
  {
    name: 'datetime',
    label: 'Date & Time',
    icon: 'i-heroicons-calendar',
    component: 'GenericDateRangePicker',
    props: {
      modelValue: selected.value,
    },
  },
])

const handleFilterChange = (filterData) => {
  const { name, value } = filterData
  switch (name) {
    case 'location':
      updateExistingHubs(value)
      break
    case 'datasets':
      updateExistingDatasets(value)
      break
    case 'datetime':
      if (value.isAllTime) {
        updateDateRange({ start: null, end: null })
      } else {
        updateDateRange(value)
      }
      break
  }
  updateDateRangeUpdate(new Date())
}

const handleDownloadFilterChange = (filterData) => {
  const { name, value } = filterData
  selectedDownloadFilters.value[name] = value
}

const resetAllFilters = () => {
  const resetValue = (obj) =>
    Object.fromEntries(Object.keys(obj).map((key) => [key, true]))
  updateExistingHubs(resetValue(existingHubs.value))
  updateExistingDatasets(resetValue(existingDatasets.value))
  updateDataDashboardValues('dateRange', [])
  updateDateRangeUpdate(new Date())
}

const sensorTools = [
  { icon: 'i-heroicons-home', tooltip: 'Home' },
  { icon: 'i-heroicons-funnel', tooltip: 'Filter', action: toggleFilter },
  {
    icon: 'i-heroicons-squares-2x2',
    tooltip: 'Dashboard',
    action: toggleDashboard,
  },
  { icon: 'i-heroicons-map-pin', tooltip: 'Location Info' },
]

const handleToolClick = (index: number) => {
  console.log('Dashboard: Tool clicked:', sensorTools[index].tooltip)
}

const closeFilter = () => {
  toggleFilter()
}

const handleDownloadData = async ({ filters, format }) => {
  console.log('Download options:', filters)
  console.log('File format:', format)

  try {
    const response = await $fetch('/api/download-sensor-data', {
      method: 'POST',
      body: {
        datasets: filters.datasets,
        dateRange: filters.datetime,
        location: filters.location,
        format: format,
      },
    })

    if (response) {
      // Handle download logic
      const blob = new Blob(
        [format === 'json' ? JSON.stringify(response) : response],
        {
          type: format === 'json' ? 'application/json' : 'text/csv',
        }
      )
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `sensor_data.${format}`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    }
  } catch (error) {
    console.error('Error downloading data:', error)
    alert(`Download failed: ${error.message || 'Unknown error'}`)
  }

  showDownloadPopup.value = false
}

const leftItems = ref([
  {
    label: 'Open Sensing',
    variant: 'solid',
    color: 'black',
    onClick: () => toggleDashboard(),
  },
])

const mapItems = [
  [
    {
      label: 'Satellite',
      icon: 'i-heroicons-globe-americas-20-solid',
      click: () => setMapType('satellite'),
    },
    {
      label: 'Light',
      icon: 'i-heroicons-sun-20-solid',
      click: () => setMapType('light'),
    },
  ],
]

const rightItems = ref([
  {
    label: 'Map Selection',
    icon: 'i-heroicons-map-20-solid',
    variant: 'outline',
    color: 'gray',
    dropdown: {
      items: mapItems,
      popper: { placement: 'bottom-end' },
    },
  },
  {
    label: 'Download',
    icon: 'i-heroicons-arrow-down-tray-20-solid',
    variant: 'outline',
    color: 'gray',
    onClick: () => (showDownloadPopup.value = true),
  },
])

const closeOverlay = () => {
  if (showDashboard.value) {
    toggleDashboard(false)
  }
  if (showSensorDetail.value) {
    sensorDetailStore.toggleSensorDetail(false)
  }
}

watch(showDashboard, (newValue) => {
  if (newValue && showFilter.value) {
    toggleFilter()
  }
})

watch(showFilter, (newValue) => {
  if (newValue && showDashboard.value) {
    toggleDashboard()
  }
})
</script>
<style scoped>
.top-\[calc\(4rem\+2vh\)\] {
  top: calc(4rem + 2vh);
}
.h-\[calc\(100vh-8rem-4vh\)\] {
  height: calc(100vh - 8rem - 4vh);
}
</style>
