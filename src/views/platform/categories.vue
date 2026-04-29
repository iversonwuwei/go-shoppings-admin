<script setup lang="ts">
import {
    createPlatformCategory,
    deletePlatformCategory,
    listPlatformCategories,
    updatePlatformCategory,
    type Category,
} from '@/api/product';
import { ElMessage, ElMessageBox } from 'element-plus';
import { computed, onMounted, reactive, ref } from 'vue';

interface TreeNode { value: number; label: string; children?: TreeNode[] }

const loading = ref(false)
const list = ref<Category[]>([])
const dialog = ref(false)
const editing = ref<Category | null>(null)
const form = reactive<Partial<Category>>({ name: '', parent_id: 0, sort: 0, status: 1 })

const nameMap = computed(() => {
  const m = new Map<number, string>()
  for (const c of list.value) m.set(c.id, c.name)
  return m
})

// 收集当前节点及其所有子孙 ID（用于编辑时禁止把父级设为自身或子孙）
function collectDescendants(rootId: number): Set<number> {
  const set = new Set<number>([rootId])
  let changed = true
  while (changed) {
    changed = false
    for (const c of list.value) {
      if (!set.has(c.id) && set.has(c.parent_id)) {
        set.add(c.id)
        changed = true
      }
    }
  }
  return set
}

const parentOptions = computed<TreeNode[]>(() => {
  const forbid = editing.value ? collectDescendants(editing.value.id) : new Set<number>()
  const byParent = new Map<number, Category[]>()
  for (const c of list.value) {
    if (forbid.has(c.id)) continue
    const arr = byParent.get(c.parent_id) || []
    arr.push(c)
    byParent.set(c.parent_id, arr)
  }
  const build = (pid: number): TreeNode[] =>
    (byParent.get(pid) || [])
      .sort((a, b) => b.sort - a.sort || a.id - b.id)
      .map((c) => {
        const children = build(c.id)
        return children.length
          ? { value: c.id, label: c.name, children }
          : { value: c.id, label: c.name }
      })
  return [{ value: 0, label: '（顶级）', children: build(0) }]
})

const sortedList = computed(() => {
  const result: Array<Category & { _depth: number }> = []
  const byParent = new Map<number, Category[]>()
  for (const c of list.value) {
    const arr = byParent.get(c.parent_id) || []
    arr.push(c)
    byParent.set(c.parent_id, arr)
  }
  const walk = (pid: number, depth: number) => {
    const arr = (byParent.get(pid) || []).sort((a, b) => b.sort - a.sort || a.id - b.id)
    for (const c of arr) {
      result.push({ ...c, _depth: depth })
      walk(c.id, depth + 1)
    }
  }
  walk(0, 0)
  // 把孤儿（parent_id 指向已不存在的节点）也追加出来，避免丢失
  const seen = new Set(result.map((x) => x.id))
  for (const c of list.value) if (!seen.has(c.id)) result.push({ ...c, _depth: 0 })
  return result
})

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

    <el-table v-loading="loading" :data="sortedList" border stripe row-key="id">
      <el-table-column prop="id" label="ID" width="80" />
      <el-table-column label="名称" min-width="220">
        <template #default="{ row }">
          <span :style="{ paddingLeft: row._depth * 20 + 'px' }">
            <span v-if="row._depth > 0" style="color:#909399">└ </span>{{ row.name }}
          </span>
        </template>
      </el-table-column>
      <el-table-column label="父级" width="160">
        <template #default="{ row }">
          <span v-if="row.parent_id === 0" style="color:#909399">顶级</span>
          <span v-else>{{ nameMap.get(row.parent_id) || `未找到分类 #${row.parent_id}` }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="sort" label="排序" width="100" />
      <el-table-column label="状态" width="100">
        <template #default="{ row }">
          <el-tag :type="row.status === 1 ? 'success' : 'info'">
            {{ row.status === 1 ? '启用' : '禁用' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" class-name="operation-column" width="240">
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
        <el-form-item label="父级分类">
          <el-tree-select
            v-model="form.parent_id"
            :data="parentOptions"
            node-key="value"
            :props="{ label: 'label', children: 'children' }"
            :default-expanded-keys="[0]"
            check-strictly
            style="width: 100%"
            placeholder="不选则为顶级分类"
          />
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
