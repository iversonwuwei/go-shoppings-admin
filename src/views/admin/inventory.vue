<template>
  <div class="page inventory-page">
    <el-card>
      <div class="toolbar">
        <el-input v-model="keyword" placeholder="商品名称" style="width: 220px" clearable @change="load" />
        <el-select v-model="stockStatus" placeholder="库存状态" style="width: 150px" @change="load">
          <el-option label="全部库存" value="" />
          <el-option label="缺货" value="out" />
          <el-option label="低库存" value="low" />
          <el-option label="库存充足" value="normal" />
        </el-select>
        <el-button type="primary" @click="load">查询</el-button>
        <el-button @click="resetFilters">重置</el-button>
      </div>

      <el-table v-loading="loading" :data="rows" stripe>
        <el-table-column label="商品" min-width="260">
          <template #default="{ row }">
            <div class="product-cell">
              <el-image v-if="row.cover_image" :src="row.cover_image" fit="cover" class="cover" />
              <div v-else class="cover cover--empty">无图</div>
              <div>
                <div class="product-name">{{ row.name }}</div>
                <div class="muted">{{ row.subtitle || '暂无副标题' }}</div>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="price" label="售价" width="100" />
        <el-table-column label="库存" width="120">
          <template #default="{ row }">
            <span v-if="row.is_virtual === 1" class="muted">无需库存</span>
            <strong v-else>{{ row.stock }}</strong>
          </template>
        </el-table-column>
        <el-table-column prop="stock_warning" label="预警值" width="100">
          <template #default="{ row }">
            <span v-if="row.is_virtual === 1" class="muted">—</span>
            <span v-else>{{ row.stock_warning }}</span>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="110">
          <template #default="{ row }">
            <el-tag :type="stockTag(row)" size="small">{{ stockText(row) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="sold_count" label="销量" width="90" />
        <el-table-column label="上架" width="90">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'info'" size="small">{{ row.status === 1 ? '上架' : '下架' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="更新时间" width="180">
          <template #default="{ row }">{{ formatTime(row.updated_at) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="90" fixed="right">
          <template #default="{ row }">
            <el-button size="small" type="primary" :disabled="row.is_virtual === 1" @click="openSettings(row)">设置</el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        class="pager"
        background
        layout="total, prev, pager, next, sizes"
        :total="total"
        :page-size="size"
        :current-page="page"
        :page-sizes="[10, 20, 50]"
        @current-change="(p) => { page = p; load() }"
        @size-change="(s) => { size = s; load() }"
      />
    </el-card>

    <el-dialog v-model="dialogVisible" title="库存设置" width="560px">
      <el-form label-width="100px">
        <el-form-item label="商品">
          <div>
            <div class="product-name">{{ currentProduct?.name }}</div>
            <div class="muted">当前库存 {{ currentProduct?.stock ?? 0 }}，预警值 {{ currentProduct?.stock_warning ?? 0 }}</div>
          </div>
        </el-form-item>

        <el-tabs v-model="form.change_type" class="inventory-tabs" @tab-change="syncQuantity">
          <el-tab-pane label="预警" name="warning">
            <el-form-item label="预警库存">
              <el-input-number v-model="form.stock_warning" :min="0" :max="999999" />
            </el-form-item>
          </el-tab-pane>
          <el-tab-pane label="入库" name="in">
            <el-form-item label="入库数量">
              <el-input-number v-model="form.quantity" :min="1" :max="999999" />
            </el-form-item>
          </el-tab-pane>
          <el-tab-pane label="出库" name="out">
            <el-form-item label="出库数量">
              <el-input-number v-model="form.quantity" :min="1" :max="999999" />
            </el-form-item>
          </el-tab-pane>
          <el-tab-pane label="盘点" name="set">
            <el-form-item label="盘点库存">
              <el-input-number v-model="form.quantity" :min="0" :max="999999" />
            </el-form-item>
          </el-tab-pane>
        </el-tabs>

        <el-form-item label="备注">
          <el-input v-model="form.remark" type="textarea" :rows="3" maxlength="200" show-word-limit placeholder="如：采购入库、损耗出库、月底盘点" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="submitAdjust">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import {
    adjustProductInventory,
    listInventoryProducts,
    type InventoryChangeType,
    type InventoryStockStatus,
} from '@/api/inventory'
import type { Product } from '@/api/product'
import { ElMessage } from 'element-plus'
import { computed, onMounted, reactive, ref } from 'vue'

const rows = ref<Product[]>([])
const total = ref(0)
const page = ref(1)
const size = ref(20)
const keyword = ref('')
const stockStatus = ref<InventoryStockStatus>('')
const loading = ref(false)
const saving = ref(false)
const dialogVisible = ref(false)
const currentProduct = ref<Product | null>(null)

const form = reactive({
  change_type: 'in' as InventoryChangeType,
  quantity: 1,
  stock_warning: 10,
  remark: '',
})

const quantityMin = computed(() => (form.change_type === 'set' ? 0 : 1))

async function load() {
  loading.value = true
  try {
    const resp = await listInventoryProducts({
      page: page.value,
      size: size.value,
      keyword: keyword.value || undefined,
      stock_status: stockStatus.value,
    })
    rows.value = resp.list
    total.value = resp.total
  } finally {
    loading.value = false
  }
}

function resetFilters() {
  keyword.value = ''
  stockStatus.value = ''
  page.value = 1
  load()
}

function openSettings(row: Product) {
  currentProduct.value = row
  form.change_type = 'warning'
  form.quantity = 1
  form.stock_warning = row.stock_warning ?? 10
  form.remark = ''
  dialogVisible.value = true
}

function syncQuantity() {
  if (!currentProduct.value) return
  form.quantity = form.change_type === 'set' ? currentProduct.value.stock : 1
}

async function submitAdjust() {
  if (!currentProduct.value) return
  if (form.change_type !== 'warning' && form.quantity < quantityMin.value) {
    ElMessage.warning('请填写有效的库存数量')
    return
  }
  saving.value = true
  try {
    await adjustProductInventory(currentProduct.value.id, {
      change_type: form.change_type,
      quantity: form.change_type === 'warning' ? 0 : form.quantity,
      stock_warning: form.change_type === 'warning' ? form.stock_warning : undefined,
      remark: form.remark,
    })
    ElMessage.success('库存已更新')
    dialogVisible.value = false
    await load()
  } finally {
    saving.value = false
  }
}

function stockText(row: Product) {
  if (row.is_virtual === 1) return '无需库存'
  if (row.stock <= 0) return '缺货'
  if (row.stock <= row.stock_warning) return '低库存'
  return '充足'
}

function stockTag(row: Product) {
  if (row.is_virtual === 1) return 'info'
  if (row.stock <= 0) return 'danger'
  if (row.stock <= row.stock_warning) return 'warning'
  return 'success'
}

function formatTime(value: string) {
  if (!value) return '-'
  return new Date(value).toLocaleString()
}

onMounted(load)
</script>

<style scoped>
.toolbar { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 12px; }
.pager { margin-top: 12px; justify-content: flex-end; }
.product-cell { display: flex; align-items: center; gap: 10px; }
.cover { width: 48px; height: 48px; border-radius: 6px; background: #f0f2f5; }
.cover--empty { display: flex; align-items: center; justify-content: center; color: #909399; font-size: 12px; }
.inventory-tabs { margin-bottom: 8px; }
.product-name { font-weight: 600; color: #303133; }
.muted { color: #909399; font-size: 12px; }
</style>
