<template>
  <div class="page">
    <el-card>
      <div class="toolbar">
        <el-select v-model="status" placeholder="订单状态" clearable style="width: 180px" @change="load">
          <el-option label="待付款" value="pending_pay" />
          <el-option label="待发货" value="paid" />
          <el-option label="处理中" value="preparing" />
          <el-option label="已发货" value="shipped" />
          <el-option label="已完成" value="completed" />
          <el-option label="已取消" value="cancelled" />
        </el-select>
        <el-button type="primary" @click="load">查询</el-button>
      </div>

      <el-table :data="rows" v-loading="loading" stripe>
        <el-table-column prop="order_no" label="订单号" min-width="180" />
        <el-table-column prop="member_id" label="会员 ID" width="100" />
        <el-table-column prop="total_amount" label="总金额" width="100" />
        <el-table-column prop="actual_amount" label="实付" width="100" />
        <el-table-column prop="status" label="状态" width="110">
          <template #default="{ row }">
            <el-tag>{{ statusText(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="receiver_name" label="收件人" width="100" />
        <el-table-column prop="receiver_phone" label="电话" width="140" />
        <el-table-column prop="created_at" label="下单时间" width="180" />
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button v-if="row.status === 'paid'" size="small" type="primary" @click="openShip(row)">发货</el-button>
            <el-button size="small" @click="openLogs(row)">轨迹</el-button>
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

    <el-dialog v-model="shipVisible" title="订单发货" width="420">
      <el-form :model="ship" label-width="90px">
        <el-form-item label="物流公司">
          <el-input v-model="ship.company" />
        </el-form-item>
        <el-form-item label="物流单号">
          <el-input v-model="ship.no" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="shipVisible = false">取消</el-button>
        <el-button type="primary" :loading="shipping" @click="doShip">确认发货</el-button>
      </template>
    </el-dialog>

    <el-drawer v-model="logsVisible" title="订单状态轨迹" size="520px">
      <div class="timeline-header">
        <div>订单号：{{ currentOrder?.order_no }}</div>
        <div>当前状态：{{ statusText(currentOrder?.status || '') }}</div>
      </div>
      <el-timeline>
        <el-timeline-item
          v-for="item in logs"
          :key="item.id"
          :timestamp="item.created_at"
          placement="top"
        >
          <div class="log-title">{{ actionText(item.action) }}</div>
          <div class="log-meta">{{ statusText(item.before_status) }} → {{ statusText(item.after_status) }}</div>
          <div class="log-meta">{{ operatorText(item.operator_type, item.operator_id) }}</div>
          <div v-if="item.remark" class="log-remark">{{ item.remark }}</div>
        </el-timeline-item>
      </el-timeline>
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import { listOrderLogs, listOrders, shipOrder, type Order, type OrderLog } from '@/api/order'
import { ElMessage } from 'element-plus'
import { onMounted, reactive, ref } from 'vue'

const rows = ref<Order[]>([])
const total = ref(0)
const page = ref(1)
const size = ref(20)
const status = ref<string | undefined>()
const loading = ref(false)

const shipVisible = ref(false)
const shipping = ref(false)
const ship = reactive({ id: 0, company: '', no: '' })
const logsVisible = ref(false)
const logs = ref<OrderLog[]>([])
const currentOrder = ref<Order | null>(null)

const statusMap: Record<string, string> = {
  pending_pay: '待付款',
  paid: '待发货',
  preparing: '处理中',
  shipped: '已发货',
  delivered: '已送达',
  completed: '已完成',
  cancelled: '已取消',
  refunding: '退款中',
  refunded: '已退款',
}

function statusText(value: string) {
  return statusMap[value] || value || '-'
}

function actionText(value: string) {
  return {
    create: '买家下单',
    pay_success: '支付成功',
    cancel: '买家取消',
    ship: '卖家发货',
    confirm: '买家确认收货',
  }[value] || value
}

function operatorText(type: string, id: number) {
  return {
    member: `买家 #${id || '-'}`,
    admin: `卖家 #${id || '-'}`,
    system: '系统',
  }[type] || type
}

async function load() {
  loading.value = true
  try {
    const resp = await listOrders({ page: page.value, size: size.value, status: status.value })
    rows.value = resp.list
    total.value = resp.total
  } finally {
    loading.value = false
  }
}

function openShip(row: Order) {
  ship.id = row.id
  ship.company = ''
  ship.no = ''
  shipVisible.value = true
}

async function openLogs(row: Order) {
  currentOrder.value = row
  logs.value = await listOrderLogs(row.id)
  logsVisible.value = true
}

async function doShip() {
  if (!ship.company || !ship.no) {
    ElMessage.warning('请填写完整')
    return
  }
  shipping.value = true
  try {
    await shipOrder(ship.id, ship.company, ship.no)
    ElMessage.success('已发货')
    shipVisible.value = false
    load()
  } finally {
    shipping.value = false
  }
}

onMounted(load)
</script>

<style scoped>
.toolbar { display: flex; gap: 8px; margin-bottom: 12px; }
.pager { margin-top: 12px; justify-content: flex-end; display: flex; }
.timeline-header { margin-bottom: 16px; color: #606266; line-height: 1.8; }
.log-title { font-weight: 600; margin-bottom: 4px; }
.log-meta { color: #606266; margin-bottom: 4px; }
.log-remark { color: #303133; }
</style>
