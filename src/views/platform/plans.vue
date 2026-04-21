<script setup lang="ts">
import {
    createPlan,
    deletePlan,
    listFeatures,
    listPlans,
    updatePlan,
    type Plan,
    type PlanFeature,
} from '@/api/plans'
import { ElMessage, ElMessageBox } from 'element-plus'
import { onMounted, reactive, ref } from 'vue'

const loading = ref(false)
const list = ref<Plan[]>([])
const featureCatalog = ref<PlanFeature[]>([])
const dialog = ref(false)
const editing = ref<Plan | null>(null)
const form = reactive<Partial<Plan>>({
  code: '', name: '',
  monthly_fee: 0, yearly_fee: 0,
  product_limit: 0, order_limit: 0, user_limit: 0,
  features: [], is_default: 0, status: 1,
})

async function load() {
  loading.value = true
  try {
    const [p, f] = await Promise.all([listPlans(), listFeatures()])
    list.value = p
    featureCatalog.value = f.filter((x) => x.status === 1)
  } finally { loading.value = false }
}

function openCreate() {
  editing.value = null
  Object.assign(form, {
    code:'', name:'', monthly_fee:0, yearly_fee:0,
    product_limit:0, order_limit:0, user_limit:0,
    features:[], is_default:0, status:1,
  })
  dialog.value = true
}

function openEdit(row: Plan) {
  editing.value = row
  Object.assign(form, {
    code: row.code, name: row.name,
    monthly_fee: Number(row.monthly_fee), yearly_fee: Number(row.yearly_fee),
    product_limit: row.product_limit, order_limit: row.order_limit, user_limit: row.user_limit,
    features: [...(row.features || [])],
    is_default: row.is_default, status: row.status,
  })
  dialog.value = true
}

async function submit() {
  if (!form.code || !form.name) return ElMessage.warning('请填写套餐编码与名称')
  try {
    if (editing.value) {
      await updatePlan(editing.value.id, form)
      ElMessage.success('已更新')
    } else {
      await createPlan(form)
      ElMessage.success('已创建')
    }
    dialog.value = false
    await load()
  } catch (e: any) {
    ElMessage.error(e?.message || '保存失败')
  }
}

async function remove(row: Plan) {
  await ElMessageBox.confirm(`确认删除套餐「${row.name}」？`, '提示', { type: 'warning' })
  await deletePlan(row.id)
  ElMessage.success('已删除')
  await load()
}

function featLabel(k: string) {
  return featureCatalog.value.find((f) => f.code === k)?.name || k
}

onMounted(load)
</script>

<template>
  <div class="page">
    <div class="toolbar">
      <h3>套餐管理</h3>
      <div>
        <el-button type="primary" @click="openCreate">新增套餐</el-button>
      </div>
    </div>

    <el-table v-loading="loading" :data="list" border stripe>
      <el-table-column label="编码" prop="code" width="130" />
      <el-table-column label="名称" prop="name" width="130" />
      <el-table-column label="月费 (¥)" width="110">
        <template #default="{ row }">{{ Number(row.monthly_fee).toFixed(2) }}</template>
      </el-table-column>
      <el-table-column label="年费 (¥)" width="110">
        <template #default="{ row }">{{ Number(row.yearly_fee).toFixed(2) }}</template>
      </el-table-column>
      <el-table-column label="商品上限" width="100">
        <template #default="{ row }">{{ row.product_limit === 0 ? '不限' : row.product_limit }}</template>
      </el-table-column>
      <el-table-column label="订单上限" width="100">
        <template #default="{ row }">{{ row.order_limit === 0 ? '不限' : row.order_limit }}</template>
      </el-table-column>
      <el-table-column label="用户上限" width="100">
        <template #default="{ row }">{{ row.user_limit === 0 ? '不限' : row.user_limit }}</template>
      </el-table-column>
      <el-table-column label="功能">
        <template #default="{ row }">
          <el-tag v-for="f in (row.features || [])" :key="f" size="small" style="margin:2px">{{ featLabel(f) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="默认" width="70">
        <template #default="{ row }">
          <el-tag v-if="row.is_default === 1" type="success">默认</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="状态" width="80">
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

    <el-dialog v-model="dialog" :title="editing ? '编辑套餐' : '新增套餐'" width="640px">
      <el-form :model="form" label-width="100px">
        <el-row :gutter="12">
          <el-col :span="12">
            <el-form-item label="套餐编码" required>
              <el-input v-model="form.code" :disabled="!!editing" placeholder="如 basic / pro" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="套餐名称" required>
              <el-input v-model="form.name" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="12">
          <el-col :span="12">
            <el-form-item label="月费 (¥)">
              <el-input-number v-model="form.monthly_fee as any" :min="0" :precision="2" style="width:100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="年费 (¥)">
              <el-input-number v-model="form.yearly_fee as any" :min="0" :precision="2" style="width:100%" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="12">
          <el-col :span="8">
            <el-form-item label="商品上限">
              <el-input-number v-model="form.product_limit as any" :min="0" style="width:100%" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="订单上限">
              <el-input-number v-model="form.order_limit as any" :min="0" style="width:100%" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="用户上限">
              <el-input-number v-model="form.user_limit as any" :min="0" style="width:100%" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="功能">
          <el-select v-model="form.features as any" multiple collapse-tags collapse-tags-tooltip style="width:100%">
            <el-option v-for="opt in featureCatalog" :key="opt.code" :label="opt.name" :value="opt.code" />
          </el-select>
          <div class="tip">0 表示不限</div>
        </el-form-item>
        <el-row :gutter="12">
          <el-col :span="12">
            <el-form-item label="默认套餐">
              <el-switch
                :model-value="form.is_default === 1"
                @change="(v: any) => (form.is_default = v ? 1 : 0)"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="状态">
              <el-switch
                :model-value="form.status === 1"
                active-text="启用"
                inactive-text="停用"
                @change="(v: any) => (form.status = v ? 1 : 0)"
              />
            </el-form-item>
          </el-col>
        </el-row>
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
.tip { font-size: 12px; color: #9ca3af; }
</style>
