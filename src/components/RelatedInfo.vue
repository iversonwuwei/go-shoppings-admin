<template>
  <div class="related-info">
    <span class="related-info__title">{{ title || emptyText }}</span>
    <span v-if="subtitle" class="related-info__subtitle">{{ subtitle }}</span>
  </div>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  title?: string
  subtitle?: string
  emptyText?: string
}>(), {
  emptyText: '-',
})
</script>

<style scoped>
.related-info {
  display: grid;
  gap: 2px;
  min-width: 0;
}

.related-info__title {
  overflow: hidden;
  color: #303133;
  font-weight: 600;
  line-height: 1.35;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.related-info__subtitle {
  overflow: hidden;
  color: #909399;
  font-size: 12px;
  line-height: 1.35;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>