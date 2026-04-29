<script setup lang="ts">
import { approveAfterSale, listAfterSales, receiveAfterSale, refundAfterSale, rejectAfterSale, type AfterSaleOrder } from '@/api/afterSale'
import { listMembers, type AdminMember } from '@/api/member'
import RelatedInfo from '@/components/RelatedInfo.vue'
import { memberInfo, uniquePositiveIds } from '@/utils/adminLookups'
import { ElMessage, ElMessageBox } from 'element-plus'
import { onMounted, ref } from 'vue'

const rows = ref<AfterSaleOrder[]>([])
const total = ref(0)
const page = ref(1)
const size = ref(20)
const status = ref<string | undefined>()
const loading = ref(false)
const memberLookup = ref(new Map<number, AdminMember>())

const statusMap: Record<string, string> = {
  pending: '待审核',
  approved: '已同意',
  rejected: '已驳回',
  returning: '退货中',
  received: '已收货',
  refunded: '已退款',
  cancelled: '已取消',
}

const typeMap: Record<string, string> = {
  refund: '仅退款',
  return_refund: '退货退款',
}

function statusText(value: string) {
  return statusMap[value] || value || '-'
}

function statusType(value: string): 'success' | 'warning' | 'info' | 'danger' {
  if (value === 'refunded') return 'success'
  if (value === 'pending' || value === 'returning' || value === 'received') return 'warning'
  if (value === 'rejected') return 'danger'
  return 'info'
}

function typeText(value: string) {
  return typeMap[value] || value || '-'
}

function memberCell(id: number) {
  return memberInfo(memberLookup.value.get(Number(id || 0)), id)
}

async function ensureMembers(ids: Array<number | null | undefined>) {
  const missing = uniquePositiveIds(ids).filter((id) => !memberLookup.value.has(id))
  if (!missing.length) return
  const next = new Map(memberLookup.value)
  await Promise.all(missing.map(async (id) => {
    const resp = await listMembers({ page: 1, size: 5, keyword: String(id) })
    const member = (resp.list || []).find((item) => item.id === id)
    if (member) next.set(id, member)
  }))
  memberLookup.value = next
}

async function load() {
  loading.value = true
  try {
    const resp = await listAfterSales({ page: page.value, size: size.value, status: status.value })
    rows.value = resp.list || []
    total.value = resp.total || 0
    await ensureMembers(rows.value.map((row) => row.member_id))
  } finally {
    loading.value = false
  }
}

async function askRemark(title: string, placeholder = '可填写处理说明') {
  const result = await ElMessageBox.prompt(placeholder, title, {
    confirmButtonText: '确认',
    cancelButtonText: '取消',
    inputType: 'textarea',
  })
  return result.value || ''
}

async function doApprove(row: AfterSaleOrder) {
  const remark = await askRemark('同意售后')
  await approveAfterSale(row.id, remark)
  ElMessage.success('已同意售后')
  load()
}

async function doReject(row: AfterSaleOrder) {
  const remark = await askRemark('驳回售后', '请填写驳回原因')
  await rejectAfterSale(row.id, remark)
  ElMessage.success('已驳回')
  load()
}

async function doReceive(row: AfterSaleOrder) {
  const remark = await askRemark('确认收货')
  await receiveAfterSale(row.id, remark)
  ElMessage.success('已确认收到退货')
  load()
}

async function doRefund(row: AfterSaleOrder) {
  const remark = await askRemark('标记退款完成', '真实微信退款接入前，请填写线下退款凭据或备注')
  await refundAfterSale(row.id, remark)
  ElMessage.success('已标记退款完成')
  load()
}

onMounted(load)
</script>

<template>
  <el-card v-loading="loading">
    <template #header>
      <div class="hd">
        <span>售后处理</span>
        <div class="filters">
          <el-select v-model="status" clearable placeholder="售后状态" style="width: 160px" @change="(page = 1, load())">
            <el-option label="待审核" value="pending" />
            <el-option label="已同意" value="approved" />
            <el-option label="退货中" value="returning" />
            <el-option label="已收货" value="received" />
            <el-option label="已退款" value="refunded" />
            <el-option label="已驳回" value="rejected" />
            <el-option label="已取消" value="cancelled" />
          </el-select>
          <el-button type="primary" @click="load">查询</el-button>
        </div>
      </div>
    </template>

    <el-table :data="rows" stripe>
      <el-table-column prop="after_sale_no" label="售后单号" min-width="180" />
      <el-table-column prop="order_no" label="订单号" min-width="170" />
      <el-table-column label="会员" min-width="180">
        <template #default="{ row }"><RelatedInfo v-bind="memberCell(row.member_id)" /></template>
      </el-table-column>
      <el-table-column label="类型" width="110">
        <template #default="{ row }">{{ typeText(row.type) }}</template>
      </el-table-column>
      <el-table-column prop="amount" label="金额" width="100" />
      <el-table-column prop="reason" label="原因" min-width="160" show-overflow-tooltip />
      <el-table-column label="状态" width="110">
        <template #default="{ row }"><el-tag :type="statusType(row.status)">{{ statusText(row.status) }}</el-tag></template>
      </el-table-column>
      <el-table-column label="退货物流" min-width="180" show-overflow-tooltip>
        <template #default="{ row }">
          <span>{{ row.return_express_no ? `${row.return_express_company} ${row.return_express_no}` : '-' }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="created_at" label="申请时间" width="180" />
      <el-table-column label="操作" align="center" class-name="operation-column" width="260" fixed="right">
        <template #default="{ row }">
          <el-button v-if="row.status === 'pending'" link type="success" @click="doApprove(row)">同意</el-button>
          <el-button v-if="row.status === 'pending'" link type="danger" @click="doReject(row)">驳回</el-button>
          <el-button v-if="row.status === 'returning'" link type="primary" @click="doReceive(row)">确认收货</el-button>
          <el-button v-if="row.status === 'approved' && row.type === 'refund'" link type="primary" @click="doRefund(row)">退款完成</el-button>
          <el-button v-if="row.status === 'received'" link type="primary" @click="doRefund(row)">退款完成</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-pagination
      class="pager"
      v-model:current-page="page"
      v-model:page-size="size"
      :page-sizes="[10, 20, 50]"
      layout="total, sizes, prev, pager, next"
      :total="total"
      @current-change="load"
      @size-change="load"
    />
  </el-card>
</template>

<style scoped>
.hd { display: flex; justify-content: space-between; align-items: center; gap: 12px; }
.filters { display: flex; align-items: center; gap: 8px; }
.pager { margin-top: 12px; justify-content: flex-end; display: flex; }
</style>
