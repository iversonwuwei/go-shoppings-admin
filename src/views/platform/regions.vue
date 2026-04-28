<script setup lang="ts">
import { createRegion, deleteRegion, listRegions, updateRegion, type Region } from '@/api/regions';
import { ElMessage, ElMessageBox } from 'element-plus';
import { computed, onMounted, reactive, ref } from 'vue';

interface TreeNode { value: number; label: string; children?: TreeNode[] }

const loading = ref(false)
const list = ref<Region[]>([])
const dialog = ref(false)
const editing = ref<Region | null>(null)
const form = reactive<Partial<Region>>({ parent_id: 0, code: '', name: '', sort: 0, enabled: 1 })

const nameMap = computed(() => {
  const map = new Map<number, string>()
  for (const item of list.value) map.set(item.id, item.name)
  return map
})

function collectDescendants(rootId: number): Set<number> {
  const set = new Set<number>([rootId])
  let changed = true
  while (changed) {
    changed = false
    for (const item of list.value) {
      if (!set.has(item.id) && set.has(item.parent_id)) {
        set.add(item.id)
        changed = true
      }
    }
  }
  return set
}

const parentOptions = computed<TreeNode[]>(() => {
  const forbid = editing.value ? collectDescendants(editing.value.id) : new Set<number>()
  const byParent = new Map<number, Region[]>()
  for (const item of list.value) {
    if (forbid.has(item.id) || item.level >= 3) continue
    const arr = byParent.get(item.parent_id) || []
    arr.push(item)
    byParent.set(item.parent_id, arr)
  }
  const build = (parentId: number): TreeNode[] =>
    (byParent.get(parentId) || [])
      .sort((a, b) => b.sort - a.sort || a.id - b.id)
      .map((item) => {
        const children = build(item.id)
        const label = `${levelLabel(item.level)} / ${item.name}`
        return children.length ? { value: item.id, label, children } : { value: item.id, label }
      })
  return [{ value: 0, label: '顶级省份', children: build(0) }]
})

const sortedList = computed(() => {
  const result: Array<Region & { _depth: number }> = []
  const byParent = new Map<number, Region[]>()
  for (const item of list.value) {
    const arr = byParent.get(item.parent_id) || []
    arr.push(item)
    byParent.set(item.parent_id, arr)
  }
  const walk = (parentId: number, depth: number) => {
    const arr = (byParent.get(parentId) || []).sort((a, b) => b.sort - a.sort || a.id - b.id)
    for (const item of arr) {
      result.push({ ...item, _depth: depth })
      walk(item.id, depth + 1)
    }
  }
  walk(0, 0)
  const seen = new Set(result.map((item) => item.id))
  for (const item of list.value) if (!seen.has(item.id)) result.push({ ...item, _depth: 0 })
  return result
})

async function load() {
  loading.value = true
  try {
    list.value = await listRegions()
  } finally {
    loading.value = false
  }
}

function levelLabel(level: number) {
  return level === 1 ? '省份' : level === 2 ? '城市' : level === 3 ? '区县' : '-'
}

function levelTagType(level: number): 'success' | 'warning' | 'info' {
  return level === 1 ? 'success' : level === 2 ? 'warning' : 'info'
}

function openCreate(parent?: Region) {
  editing.value = null
  Object.assign(form, { parent_id: parent?.id || 0, code: '', name: '', sort: 0, enabled: 1 })
  dialog.value = true
}

function openEdit(row: Region) {
  editing.value = row
  Object.assign(form, {
    parent_id: row.parent_id,
    code: row.code,
    name: row.name,
    sort: row.sort,
    enabled: row.enabled,
  })
  dialog.value = true
}

async function submit() {
  if (!form.name) return ElMessage.warning('请填写城市名称')
  try {
    if (editing.value) {
      await updateRegion(editing.value.id, form)
      ElMessage.success('已更新')
    } else {
      await createRegion(form)
      ElMessage.success('已创建')
    }
    dialog.value = false
    await load()
  } catch (error: any) {
    ElMessage.error(error?.message || '保存失败')
  }
}

async function toggleEnabled(row: Region) {
  try {
    await updateRegion(row.id, { ...row, enabled: row.enabled === 1 ? 0 : 1 })
    await load()
  } catch (error: any) {
    ElMessage.error(error?.message || '更新失败')
  }
}

async function remove(row: Region) {
  const ok = await ElMessageBox.confirm(`确认删除「${row.name}」？`, '删除城市信息', { type: 'warning' }).catch(() => null)
  if (!ok) return
  try {
    await deleteRegion(row.id)
    ElMessage.success('已删除')
    await load()
  } catch (error: any) {
    ElMessage.error(error?.message || '删除失败')
  }
}

onMounted(load)
</script>

<template>
  <div class="page">
    <div class="page-header">
      <h2>城市信息</h2>
      <el-button type="primary" @click="openCreate()">新增省份</el-button>
    </div>

    <el-alert
      type="info"
      show-icon
      :closable="false"
      title="平台统一维护省 / 市 / 区数据，小程序添加地址时会使用启用状态的数据作为下拉选项。"
      style="margin-bottom: 12px"
    />

    <el-table v-loading="loading" :data="sortedList" border stripe row-key="id">
      <el-table-column prop="id" label="ID" width="80" />
      <el-table-column label="名称" min-width="240">
        <template #default="{ row }">
          <span :style="{ paddingLeft: row._depth * 20 + 'px' }">
            <span v-if="row._depth > 0" style="color:#909399">└ </span>{{ row.name }}
          </span>
        </template>
      </el-table-column>
      <el-table-column prop="code" label="编码" width="150" show-overflow-tooltip />
      <el-table-column label="层级" width="100">
        <template #default="{ row }">
          <el-tag :type="levelTagType(row.level)">{{ levelLabel(row.level) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="父级" width="160">
        <template #default="{ row }">
          <span v-if="row.parent_id === 0" style="color:#909399">顶级</span>
          <span v-else>{{ nameMap.get(row.parent_id) || `未找到 #${row.parent_id}` }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="sort" label="排序" width="90" />
      <el-table-column label="状态" width="90">
        <template #default="{ row }">
          <el-tag :type="row.enabled === 1 ? 'success' : 'info'">
            {{ row.enabled === 1 ? '启用' : '禁用' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="260" fixed="right">
        <template #default="{ row }">
          <el-button v-if="row.level < 3" link type="primary" @click="openCreate(row)">新增下级</el-button>
          <el-button link type="primary" @click="openEdit(row)">编辑</el-button>
          <el-button link type="warning" @click="toggleEnabled(row)">{{ row.enabled === 1 ? '禁用' : '启用' }}</el-button>
          <el-button link type="danger" @click="remove(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog v-model="dialog" :title="editing ? '编辑城市信息' : '新增城市信息'" width="520px">
      <el-form :model="form" label-width="90px">
        <el-form-item label="名称" required>
          <el-input v-model="form.name" maxlength="50" placeholder="如：浙江省 / 杭州市 / 西湖区" />
        </el-form-item>
        <el-form-item label="编码">
          <el-input v-model="form.code" maxlength="32" placeholder="选填，行政区划编码" />
        </el-form-item>
        <el-form-item label="父级">
          <el-tree-select
            v-model="form.parent_id"
            :data="parentOptions"
            node-key="value"
            :props="{ label: 'label', children: 'children' }"
            :default-expanded-keys="[0]"
            check-strictly
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="form.sort" :min="0" style="width: 100%" />
        </el-form-item>
        <el-form-item label="启用">
          <el-switch :model-value="form.enabled === 1" @update:model-value="(value) => (form.enabled = value ? 1 : 0)" />
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
.page { padding: 16px; }
.page-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
</style>