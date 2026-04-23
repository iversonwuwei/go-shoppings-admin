<script setup lang="ts">
import ImageUploader from '@/components/ImageUploader.vue'
import { listCategories, updateTenantCategoryMedia, type Category } from '@/api/product'
import { ElMessage } from 'element-plus'
import { computed, onMounted, reactive, ref } from 'vue'

const loading = ref(false)
const list = ref<Category[]>([])
const dialog = ref(false)
const editing = ref<Category | null>(null)
const form = reactive({
  cover_image: '',
  icon: '',
})

const parentNameMap = computed(() => {
  const map = new Map<number, string>()
  for (const item of list.value) {
    map.set(item.id, item.name)
  }
  return map
})

async function load() {
  loading.value = true
  try {
    list.value = await listCategories()
  } finally {
    loading.value = false
  }
}

function openEdit(row: Category) {
  editing.value = row
  form.cover_image = row.cover_image || ''
  form.icon = row.icon || ''
  dialog.value = true
}

async function submit() {
  if (!editing.value) return
  try {
    await updateTenantCategoryMedia(editing.value.id, {
      cover_image: form.cover_image,
      icon: form.icon,
    })
    ElMessage.success('分类图片已更新')
    dialog.value = false
    await load()
  } catch (error: any) {
    ElMessage.error(error?.message || '保存失败')
  }
}

onMounted(load)
</script>

<template>
  <div class="page">
    <el-alert
      type="info"
      show-icon
      :closable="false"
      title="分类名称、层级、排序由平台统一管理；租户只能维护自己的分类图片。"
      style="margin-bottom: 12px"
    />

    <el-table v-loading="loading" :data="list" border stripe>
      <el-table-column prop="name" label="分类名称" min-width="180" />
      <el-table-column label="父级分类" min-width="140">
        <template #default="{ row }">
          <span v-if="row.parent_id === 0" style="color:#909399">顶级</span>
          <span v-else>{{ parentNameMap.get(row.parent_id) || `#${row.parent_id}` }}</span>
        </template>
      </el-table-column>
      <el-table-column label="分类图片" width="120">
        <template #default="{ row }">
          <el-image v-if="row.cover_image" :src="row.cover_image" style="width: 56px; height: 56px; border-radius: 8px" fit="cover" />
          <span v-else style="color:#909399">未设置</span>
        </template>
      </el-table-column>
      <el-table-column prop="sort" label="排序" width="90" />
      <el-table-column label="状态" width="100">
        <template #default="{ row }">
          <el-tag :type="row.status === 1 ? 'success' : 'info'">{{ row.status === 1 ? '启用' : '禁用' }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="120">
        <template #default="{ row }">
          <el-button link type="primary" @click="openEdit(row)">上传图片</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog v-model="dialog" title="设置分类图片" width="520px">
      <el-form label-width="90px">
        <el-form-item label="分类名称">
          <el-input :model-value="editing?.name || ''" disabled />
        </el-form-item>
        <el-form-item label="封面图">
          <ImageUploader v-model="form.cover_image" folder="categories" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialog = false">取消</el-button>
        <el-button type="primary" @click="submit">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>
