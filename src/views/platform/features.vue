<script setup lang="ts">
import {
    createFeature,
    deleteFeature,
    listFeatures,
    updateFeature,
    type PlanFeature,
} from '@/api/plans'
import { ElMessage, ElMessageBox } from 'element-plus'
import { onMounted, reactive, ref } from 'vue'

const loading = ref(false)
const list = ref<PlanFeature[]>([])
const dialog = ref(false)
const editing = ref<PlanFeature | null>(null)
const form = reactive<Partial<PlanFeature>>({
  code: '', name: '', description: '', group_name: '', sort: 0, status: 1,
})

async function load() {
  loading.value = true
  try { list.value = await listFeatures() } finally { loading.value = false }
}

function openCreate() {
  editing.value = null
  Object.assign(form, { code:'', name:'', description:'', group_name:'', sort:0, status:1 })
  dialog.value = true
}

function openEdit(row: PlanFeature) {
  editing.value = row
  Object.assign(form, {
    code: row.code, name: row.name, description: row.description,
    group_name: row.group_name, sort: row.sort, status: row.status,
  })
  dialog.value = true
}

async function submit() {
  if (!form.code || !form.name) return ElMessage.warning('请填写编码与名称')
  try {
    if (editing.value) {
      await updateFeature(editing.value.id, form)
      ElMessage.success('已更新')
    } else {
      await createFeature(form)
      ElMessage.success('已创建')
    }
    dialog.value = false
    await load()
  } catch (e: any) {
    ElMessage.error(e?.message || '保存失败')
  }
}

async function remove(row: PlanFeature) {
  await ElMessageBox.confirm(
    `确认删除功能「${row.name}」？如果已有套餐包含此功能，将残留过期编码。`,
    '提示', { type: 'warning' },
  )
  await deleteFeature(row.id)
  ElMessage.success('已删除')
  await load()
}

onMounted(load)
</script>

<template>
  <div class="page">
    <div class="toolbar">
      <h3>套餐功能目录</h3>
      <div>
        <el-button type="primary" @click="openCreate">新增功能</el-button>
      </div>
    </div>
    <el-alert
      type="info" :closable="false" show-icon style="margin-bottom:12px"
      title="这里维护的是套餐可以包含的功能清单。编码 (code) 用于后端判断权限，修改编码可能导致已发布套餐失效。"
    />

    <el-table v-loading="loading" :data="list" border stripe>
      <el-table-column label="排序" prop="sort" width="80" />
      <el-table-column label="编码" prop="code" width="180" />
      <el-table-column label="名称" prop="name" width="160" />
      <el-table-column label="分组" prop="group_name" width="100" />
      <el-table-column label="描述" prop="description" show-overflow-tooltip />
      <el-table-column label="状态" width="90">
        <template #default="{ row }">
          <el-tag :type="row.status === 1 ? 'success' : 'info'">{{ row.status === 1 ? '启用' : '停用' }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="160" fixed="right">
        <template #default="{ row }">
          <el-button size="small" @click="openEdit(row)">编辑</el-button>
          <el-button size="small" type="danger" @click="remove(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog v-model="dialog" :title="editing ? '编辑功能' : '新增功能'" width="520px">
      <el-form :model="form" label-width="90px">
        <el-form-item label="编码" required>
          <el-input v-model="form.code" :disabled="!!editing" placeholder="英文+下划线，如 custom_domain" />
        </el-form-item>
        <el-form-item label="名称" required>
          <el-input v-model="form.name" placeholder="如 品牌域名" />
        </el-form-item>
        <el-form-item label="分组">
          <el-input v-model="form.group_name" placeholder="如 商品 / 营销 / 会员 / 履约" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="form.description" type="textarea" :rows="2" maxlength="255" />
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="form.sort as any" :min="0" style="width:180px" />
        </el-form-item>
        <el-form-item label="状态">
          <el-switch
            :model-value="form.status === 1"
            active-text="启用"
            inactive-text="停用"
            @change="(v: any) => (form.status = v ? 1 : 0)"
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
.page { padding: 16px; }
.toolbar { display:flex; justify-content:space-between; align-items:center; margin-bottom: 12px; }
.toolbar h3 { margin: 0; }
</style>
