<script setup lang="ts">
import {
    createGrouponActivity,
    deleteGrouponActivity,
    listGrouponActivities,
    updateGrouponActivity,
    type GrouponActivity,
} from '@/api/groupon'
import { listProducts, type Product } from '@/api/product'
import { ElMessage, ElMessageBox } from 'element-plus'
import { onMounted, reactive, ref } from 'vue'

const loading = ref(false)
const list = ref<GrouponActivity[]>([])
const total = ref(0)
const page = ref(1)
const size = ref(20)
const products = ref<Product[]>([])
const dialog = ref(false)
const editing = ref<GrouponActivity | null>(null)
const featureDisabled = ref(false)
const featureMsg = ref('')

const form = reactive<{
  name: string
  product_id: number
  sku_id: number
  group_price: string | number
  original_price: string | number
  require_num: number
  expire_hours: number
  total_stock: number
  range: [string, string] | null
  status: number
}>({
  name: '', product_id: 0, sku_id: 0,
  group_price: 0, original_price: 0,
  require_num: 2, expire_hours: 24, total_stock: 100,
  range: null, status: 1,
})

async function load() {
  loading.value = true
  featureDisabled.value = false
  try {
    const res = await listGrouponActivities({ page: page.value, size: size.value })
    list.value = res.list
    total.value = res.total
  } catch (e: any) {
    if (e?.code === 30004) {
      featureDisabled.value = true
      featureMsg.value = e.message || '当前套餐未开通拼团功能'
    } else {
      ElMessage.error(e?.message || '加载失败')
    }
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
    name: '', product_id: 0, sku_id: 0,
    group_price: 0, original_price: 0,
    require_num: 2, expire_hours: 24, total_stock: 100,
    range: null, status: 1,
  })
  dialog.value = true
}

function openEdit(row: GrouponActivity) {
  editing.value = row
  Object.assign(form, {
    name: row.name,
    product_id: row.product_id,
    sku_id: row.sku_id || 0,
    group_price: row.group_price,
    original_price: row.original_price,
    require_num: row.require_num,
    expire_hours: row.expire_hours,
    total_stock: row.total_stock,
    range: [row.start_at, row.end_at],
    status: row.status,
  })
  dialog.value = true
}

async function submit() {
  if (!form.name) return ElMessage.warning('请输入活动名称')
  if (!form.product_id) return ElMessage.warning('请选择商品')
  if (!form.range || form.range.length !== 2) return ElMessage.warning('请选择时间段')
  const body: GrouponActivity = {
    name: form.name,
    product_id: form.product_id,
    sku_id: form.sku_id,
    group_price: form.group_price,
    original_price: form.original_price,
    require_num: form.require_num,
    expire_hours: form.expire_hours,
    total_stock: form.total_stock,
    start_at: form.range[0],
    end_at: form.range[1],
    status: form.status,
  }
  try {
    if (editing.value?.id) {
      await updateGrouponActivity(editing.value.id, body)
    } else {
      await createGrouponActivity(body)
    }
    ElMessage.success('已保存')
    dialog.value = false
    load()
  } catch (e: any) {
    if (e?.code === 30004) {
      featureDisabled.value = true; featureMsg.value = e.message || ''
    } else {
      ElMessage.error(e?.message || '保存失败')
    }
  }
}

async function remove(row: GrouponActivity) {
  if (!row.id) return
  await ElMessageBox.confirm(`确定删除活动「${row.name}」？`, '提示', { type: 'warning' })
  try {
    await deleteGrouponActivity(row.id)
    ElMessage.success('已删除')
    load()
  } catch (e: any) {
    ElMessage.error(e?.message || '删除失败')
  }
}

onMounted(() => { load(); loadProducts() })
</script>

<template>
  <div class="groupon-page">
    <el-card shadow="never">
      <template #header>
        <div class="card-header">
          <span>拼团活动</span>
          <el-button type="primary" :disabled="featureDisabled" @click="openCreate">新增活动</el-button>
        </div>
      </template>

      <el-alert
        v-if="featureDisabled"
        type="warning"
        show-icon
        :closable="false"
        title="当前套餐未开通「拼团」功能"
        :description="featureMsg"
        style="margin-bottom: 16px"
      />

      <el-table v-loading="loading" :data="list" border stripe>
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="name" label="活动名称" />
        <el-table-column prop="product_id" label="商品ID" width="90" />
        <el-table-column prop="group_price" label="拼团价" width="100" />
        <el-table-column prop="original_price" label="原价" width="100" />
        <el-table-column prop="require_num" label="成团人数" width="100" />
        <el-table-column prop="expire_hours" label="有效期(小时)" width="120" />
        <el-table-column prop="total_stock" label="总库存" width="90" />
        <el-table-column prop="sold_count" label="已售" width="80" />
        <el-table-column label="活动时间" width="320">
          <template #default="{ row }">
            {{ row.start_at }} ~ {{ row.end_at }}
          </template>
        </el-table-column>
        <el-table-column label="状态" width="80">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'info'">
              {{ row.status === 1 ? '启用' : '停用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="160" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" :disabled="featureDisabled" @click="openEdit(row)">编辑</el-button>
            <el-button link type="danger" :disabled="featureDisabled" @click="remove(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        style="margin-top: 16px; justify-content: flex-end; display: flex"
        v-model:current-page="page"
        v-model:page-size="size"
        :total="total"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="load"
        @current-change="load"
      />
    </el-card>

    <el-dialog v-model="dialog" :title="editing ? '编辑拼团活动' : '新增拼团活动'" width="640px">
      <el-form :model="form" label-width="110px">
        <el-form-item label="活动名称">
          <el-input v-model="form.name" maxlength="100" show-word-limit />
        </el-form-item>
        <el-form-item label="商品">
          <el-select v-model="form.product_id" filterable placeholder="选择商品" style="width:100%">
            <el-option
              v-for="p in products"
              :key="p.id"
              :label="`#${p.id} ${p.name}`"
              :value="p.id!"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="SKU ID">
          <el-input-number v-model="form.sku_id" :min="0" />
          <span style="margin-left:8px;color:#909399">0 表示无 SKU</span>
        </el-form-item>
        <el-form-item label="拼团价">
          <el-input-number v-model="form.group_price as any" :min="0" :step="0.01" :precision="2" />
        </el-form-item>
        <el-form-item label="原价">
          <el-input-number v-model="form.original_price as any" :min="0" :step="0.01" :precision="2" />
        </el-form-item>
        <el-form-item label="成团人数">
          <el-input-number v-model="form.require_num" :min="2" :step="1" :precision="0" />
        </el-form-item>
        <el-form-item label="有效期(小时)">
          <el-input-number v-model="form.expire_hours" :min="1" :step="1" :precision="0" />
        </el-form-item>
        <el-form-item label="总库存">
          <el-input-number v-model="form.total_stock" :min="0" :step="1" :precision="0" />
        </el-form-item>
        <el-form-item label="活动时间">
          <el-date-picker
            v-model="form.range"
            type="datetimerange"
            range-separator="至"
            start-placeholder="开始时间"
            end-placeholder="结束时间"
            value-format="YYYY-MM-DDTHH:mm:ssZ"
            style="width:100%"
          />
        </el-form-item>
        <el-form-item label="启用">
          <el-switch v-model="form.status" :active-value="1" :inactive-value="0" />
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
.groupon-page { padding: 16px; }
.card-header { display: flex; justify-content: space-between; align-items: center; }
</style>
