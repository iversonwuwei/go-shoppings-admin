<script setup lang="ts">
import { listProducts, type Product } from '@/api/product'
import {
    createSeckillActivity,
    deleteSeckillActivity,
    listSeckillActivities,
    updateSeckillActivity,
    type SeckillActivity, type SeckillProduct,
} from '@/api/seckill'
import { ElMessage, ElMessageBox } from 'element-plus'
import { onMounted, reactive, ref } from 'vue'

const loading = ref(false)
const list = ref<SeckillActivity[]>([])
const products = ref<Product[]>([])
const dialog = ref(false)
const editing = ref<SeckillActivity | null>(null)
const featureDisabled = ref(false)

const form = reactive<{
  name: string
  range: [string, string] | null
  per_limit: number
  total_stock: number
  status: number
  products: SeckillProduct[]
}>({
  name: '', range: null, per_limit: 1, total_stock: 100, status: 1, products: [],
})

async function load() {
  loading.value = true
  featureDisabled.value = false
  try {
    list.value = await listSeckillActivities()
  } catch (e: any) {
    if (e?.code === 30004) featureDisabled.value = true
  } finally { loading.value = false }
}

async function loadProducts() {
  try {
    const res: any = await listProducts({ page: 1, size: 200 })
    products.value = res?.list || res?.items || res || []
  } catch { /* ignore */ }
}

function openCreate() {
  editing.value = null
  Object.assign(form, {
    name: '', range: null, per_limit: 1, total_stock: 100, status: 1,
    products: [{ product_id: 0, sku_id: 0, seckill_price: '0.00', stock: 1 }],
  })
  dialog.value = true
}

function openEdit(row: SeckillActivity) {
  editing.value = row
  Object.assign(form, {
    name: row.name,
    range: [row.start_at, row.end_at],
    per_limit: row.per_limit,
    total_stock: row.total_stock,
    status: row.status,
    products: (row.products || []).map(p => ({
      product_id: p.product_id,
      sku_id: p.sku_id || 0,
      seckill_price: String(p.seckill_price),
      stock: p.stock,
    })),
  })
  dialog.value = true
}

function addRow() {
  form.products.push({ product_id: 0, sku_id: 0, seckill_price: '0.00', stock: 1 })
}
function removeRow(i: number) {
  form.products.splice(i, 1)
}

async function submit() {
  if (!form.name) return ElMessage.warning('请填写活动名称')
  if (!form.range || !form.range[0] || !form.range[1]) return ElMessage.warning('请选择活动时间')
  if (!form.products.length) return ElMessage.warning('至少添加一个秒杀商品')
  for (const p of form.products) {
    if (!p.product_id) return ElMessage.warning('请选择商品')
    if (Number(p.seckill_price) <= 0) return ElMessage.warning('秒杀价必须大于 0')
    if (p.stock <= 0) return ElMessage.warning('库存必须大于 0')
  }
  const body = {
    name: form.name,
    start_at: form.range[0],
    end_at: form.range[1],
    per_limit: form.per_limit,
    total_stock: form.total_stock,
    status: form.status,
    products: form.products.map(p => ({
      product_id: p.product_id,
      sku_id: p.sku_id || 0,
      seckill_price: Number(p.seckill_price),
      stock: p.stock,
    })),
  }
  try {
    if (editing.value) {
      await updateSeckillActivity(editing.value.id, body as any)
      ElMessage.success('已更新')
    } else {
      await createSeckillActivity(body as any)
      ElMessage.success('已创建')
    }
    dialog.value = false
    await load()
  } catch (e: any) {
    if (e?.code === 30004) featureDisabled.value = true
    else ElMessage.error(e?.message || '保存失败')
  }
}

async function onDelete(row: SeckillActivity) {
  try {
    await ElMessageBox.confirm(`确认删除活动「${row.name}」？`, '提示', { type: 'warning' })
  } catch { return }
  try {
    await deleteSeckillActivity(row.id)
    ElMessage.success('已删除')
    await load()
  } catch (e: any) {
    ElMessage.error(e?.message || '删除失败')
  }
}

function productName(pid: number): string {
  return products.value.find(p => p.id === pid)?.name || `#${pid}`
}

function activityState(row: SeckillActivity): { text: string; type: 'success' | 'info' | 'warning' | 'danger' } {
  if (row.status !== 1) return { text: '已停用', type: 'info' }
  const now = Date.now()
  const s = new Date(row.start_at).getTime()
  const e = new Date(row.end_at).getTime()
  if (now < s) return { text: '未开始', type: 'warning' }
  if (now > e) return { text: '已结束', type: 'info' }
  return { text: '进行中', type: 'success' }
}

onMounted(() => { load(); loadProducts() })
</script>

<template>
  <div class="page">
    <el-alert v-if="featureDisabled" type="warning" show-icon :closable="false" class="mb-16"
      title="当前套餐未开通「限时秒杀」功能" description="请联系平台管理员升级套餐以使用该功能。" />

    <el-card>
      <div class="toolbar">
        <el-button type="primary" :disabled="featureDisabled" @click="openCreate">新建活动</el-button>
      </div>
      <el-table v-loading="loading" :data="list" border stripe>
        <el-table-column prop="id" label="ID" width="70" />
        <el-table-column prop="name" label="活动名称" min-width="160" />
        <el-table-column label="时间段" min-width="260">
          <template #default="{ row }">
            {{ row.start_at }} ~ {{ row.end_at }}
          </template>
        </el-table-column>
        <el-table-column label="商品数" width="90">
          <template #default="{ row }">{{ (row.products || []).length }}</template>
        </el-table-column>
        <el-table-column prop="total_stock" label="总库存" width="90" />
        <el-table-column prop="per_limit" label="单用户限购" width="110" />
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="activityState(row).type" size="small">{{ activityState(row).text }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="openEdit(row)">编辑</el-button>
            <el-button size="small" type="danger" @click="onDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="dialog" :title="editing ? '编辑秒杀活动' : '新建秒杀活动'" width="760">
      <el-form :model="form" label-width="100px">
        <el-form-item label="活动名称">
          <el-input v-model="form.name" placeholder="例：双11秒杀" maxlength="100" show-word-limit />
        </el-form-item>
        <el-form-item label="活动时间">
          <el-date-picker v-model="form.range" type="datetimerange" value-format="YYYY-MM-DDTHH:mm:ss"
            range-separator="至" start-placeholder="开始时间" end-placeholder="结束时间" />
        </el-form-item>
        <el-form-item label="单用户限购">
          <el-input-number v-model="form.per_limit" :min="1" :max="999" />
          <span class="hint">每个用户在本活动中最多可购买的件数</span>
        </el-form-item>
        <el-form-item label="总库存">
          <el-input-number v-model="form.total_stock" :min="1" :max="999999" />
          <span class="hint">活动总库存（仅用于展示，实际扣减以每个商品库存为准）</span>
        </el-form-item>
        <el-form-item label="状态">
          <el-switch v-model="form.status" :active-value="1" :inactive-value="0" />
        </el-form-item>
        <el-form-item label="秒杀商品">
          <div style="width:100%">
            <el-table :data="form.products" border size="small">
              <el-table-column label="商品">
                <template #default="{ row }">
                  <el-select v-model="row.product_id" filterable placeholder="选择商品" style="width:100%">
                    <el-option v-for="p in products" :key="p.id" :label="p.name" :value="p.id" />
                  </el-select>
                </template>
              </el-table-column>
              <el-table-column label="秒杀价" width="140">
                <template #default="{ row }">
                  <el-input v-model="row.seckill_price" placeholder="0.00" />
                </template>
              </el-table-column>
              <el-table-column label="库存" width="120">
                <template #default="{ row }">
                  <el-input-number v-model="row.stock" :min="1" :max="999999" />
                </template>
              </el-table-column>
              <el-table-column label="" width="70">
                <template #default="{ $index }">
                  <el-button size="small" link type="danger" @click="removeRow($index)">移除</el-button>
                </template>
              </el-table-column>
            </el-table>
            <el-button size="small" style="margin-top:8px" @click="addRow">+ 添加商品</el-button>
          </div>
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
.toolbar { margin-bottom: 12px; }
.mb-16 { margin-bottom: 16px; }
.hint { color:#909399; font-size:12px; margin-left:8px; }
</style>
