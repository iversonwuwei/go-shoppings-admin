<script setup lang="ts">
import {
  createPlatformCategory,
  deletePlatformCategory,
  listPlatformCategories,
  updatePlatformCategory,
  type Category,
} from '@/api/product'
import { ElMessage, ElMessageBox } from 'element-plus'
import { onMounted, reactive, ref } from 'vue'

const loading = ref(false)
const list = ref<Category[]>([])
const dialog = ref(false)
const editing = ref<Category | null>(null)
const form = reactive<Partial<Category>>({ name: '', parent_id: 0, sort: 0, status: 1 })

async function load() {
  loading.value = true
  try {
    list.value = await listPlatformCategories()
  } finally {
    loading.value = false
  }
}

function openCreate() {
  editing.value = null
  Object.assign(form, { name: '', parent_id: 0, sort: 0, status: 1 })
  dialog.value = true
}

function openEdit(row: Category) {
  editing.value = row
  Object.assign(form, {
    name: row.name,
    parent_id: row.parent_id,
    sort: row.sort,
    status: row.status,
  })
  dialog.value = true
}

async function submit() {
  if (!form.name) return ElMessage.warning('请填写分类名称')
  try {
    if (editing.value) {
      await updatePlatformCategory(editing.value.id, form)
      ElMessage.success('已更新')
    } else {
      await createPlatformCategory(form)
      ElMessage.success('已创建')
    }
    dialog.value = false
    await load()
  } catch (e: any) {
    ElMessage.error(e?.message || '保存失败')
  }
}

async function toggleStatus(row: Category) {
  try {
    await updatePlatformCategory(row.id, { ...row, status: row.status === 1 ? 0 : 1 })
    await load()
  } catch (e: any) {
    ElMessage.error(e?.message || '更新失败')
  }
}

async function remove(row: Category) {
  await ElMessageBox.confirm(
    `确认删除分类「${row.name}」？如果已被商品引用，相关商品的分类将变为未分类。`,
    '提示',
    { type: 'warning' },
  ).catch(() => null)
  try {
    await deletePlatformCategory(row.id)
    ElMessage.success('已删除')
    await load()
  } catch (e: any) {
    ElMessage.error(e?.message || '删除失败')
  }
}

onMounted(load)
</script>

<template>
  <div class="page">
    <div class="page-header">
      <h2>商品分类（平台统一管理）</h2>
      <el-button type="primary" @click="openCreate">新增分类</el-button>
    </div>

    <el-alert
      type="info"
      show-icon
      :closable="false"
      title="所有租户共享此分类。禁用后，租户端将不再可选。"
      style="margin-bottom: 12px"
    />

    <el-table v-loading="loading" :data="list" border stripe>
      <el-table-column prop="id" label="ID" width="80" />
      <el-table-column prop="name" label="名称" />
      <el-table-column prop="parent_id" label="父级 ID" width="100" />
      <el-table-column prop="sort" label="排序" width="100" />
      <el-table-column label="状态" width="100">
        <template #default="{ row }">
          <el-tag :type="row.status === 1 ? 'success' : 'info'">
            {{ row.status === 1 ? '启用' : '禁用' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="240">
        <template #default="{ row }">
          <el-button link type="primary" @click="openEdit(row)">编辑</el-button>
          <el-button link type="warning" @click="toggleStatus(row)">
            {{ row.status === 1 ? '禁用' : '启用' }}
          </el-button>
          <el-button link type="danger" @click="remove(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog v-model="dialog" :title="editing ? '编辑分类' : '新增分类'" width="480px">
      <el-form :model="form" label-width="90px">
        <el-form-item label="分类名称" required>
          <el-input v-model="form.name" maxlength="50" />
        </el-form-item>
        <el-form-item label="父级 ID">
          <el-input-number v-model="form.parent_id" :min="0" style="width: 100%" />
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="form.sort" :min="0" style="width: 100%" />
        </el-form-item>
        <el-form-item label="状态">
          <el-switch
            :model-value="form.status === 1"
            @update:model-value="(v) => (form.status = v ? 1 : 0)"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialog = false">取消</el-button>
        <el-button type="primary" @click="submit">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.page {
  padding: 16px;
}
.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}
</style>
