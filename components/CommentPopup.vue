<template>
  <UCard
    v-if="isVisible"
    class="w-56 bg-black rounded-lg shadow-lg flex flex-col h-33"
  >
    <UTextarea
      v-model="localComment"
      placeholder="Write a comment"
      class="flex-grow text-sm resize-none"
    />
    <div class="flex justify-between mt-2">
      <UButton color="gray" size="sm" class="w-[48%]" @click="closePopup">
        Close
      </UButton>
      <UButton color="primary" size="sm" class="w-[48%]" @click="addComment">
        Add
      </UButton>
    </div>
  </UCard>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useMapUIStore } from '../stores/mapUI'

const props = defineProps({
  isVisible: Boolean,
  featureId: Number,
})

const emit = defineEmits(['close'])

const mapUIStore = useMapUIStore()
const localComment = ref('')

watch(
  () => props.isVisible,
  (newValue) => {
    if (newValue) {
      localComment.value = ''
    }
  }
)

function addComment() {
  if (props.featureId !== null) {
    mapUIStore.addComment(props.featureId, localComment.value)
    localComment.value = ''
    closePopup()
  }
}

function closePopup() {
  emit('close')
}
</script>
