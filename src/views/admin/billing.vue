<template>
  <div class="billing-page">
    <el-card shadow="never" class="mb-16">
      <template #header>
        <div class="flex-between">
          <span>订阅付费</span>
          <el-button type="primary" @click="openCreate">续订 / 切换套餐</el-button>
        </div>
      </template>
      <div class="tips">
        <el-alert type="info" :closable="false" show-icon>
          <template #title>
            套餐到期后将进入 <b>3 天宽限期</b>，逾期 3 天自动转为「欠费」状态并限制写入；逾期 5 天将被「封禁」，恢复后所有数据完整保留。
            <br />试用期内必须先完成「首次付费」后才能切换到其他套餐。
          </template>
        </el-alert>
      </div>
    </el-card>

    <el-card shadow="never">
      <el-table :data="rows" stripe v-loading="loading">
        <el-table-column prop="order_no" label="订单号" min-width="220" />
        <el-table-column prop="billing_cycle" label="周期" width="90">
          <template #default="{ row }">{{ row.billing_cycle === 'monthly' ? '按月' : '按年' }}</template>
        </el-table-column>
        <el-table-column prop="amount" label="金额" width="120">
          <template #default="{ row }">¥ {{ row.amount }}</template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag v-if="row.status === 0" type="warning">待支付</el-tag>
            <el-tag v-else-if="row.status === 1" type="success">已支付</el-tag>
            <el-tag v-else-if="row.status === 2" type="info">已取消</el-tag>
            <el-tag v-else type="danger">已退款</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="expire_after" label="续订至" width="170">
          <template #default="{ row }">{{ row.expire_after ? fmt(row.expire_after) : '-' }}</template>
        </el-table-column>
        <el-table-column prop="created_at" label="创建时间" width="170">
          <template #default="{ row }">{{ fmt(row.created_at) }}</template>
        </el-table-column>
      </el-table>
      <el-pagination
        class="mt-16"
        layout="prev, pager, next, total"
        :total="total"
        :page-size="pageSize"
        :current-page="page"
        @current-change="onPage"
      />
    </el-card>

    <el-dialog v-model="dlg" title="创建订阅订单" width="480">
      <el-form :model="form" label-width="100px">
        <el-form-item label="计费周期">
          <el-radio-group v-model="form.billing_cycle">
            <el-radio-button value="monthly">按月</el-radio-button>
            <el-radio-button value="yearly">按年</el-radio-button>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="套餐">
          <el-select v-model="form.plan_id" placeholder="默认续订当前套餐" clearable>
            <el-option v-for="p in plans" :key="p.id" :label="p.name" :value="p.id" />
          </el-select>
        </el-form-item>
        <el-alert
          v-if="form.plan_id && !hasPaidOrder"
          type="warning"
          :closable="false"
          show-icon
          title="试用期内不能切换套餐，请先续订当前套餐完成首次付费。"
        />
      </el-form>
      <template #footer>
        <el-button @click="dlg = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submit">创建订单</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { createSubscriptionOrder, listSubscriptionOrders, type SubscriptionOrder } from '@/api/subscription'
import { listPlans, type Plan } from '@/api/plans'

const rows = ref<SubscriptionOrder[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(20)
const loading = ref(false)
const plans = ref<Plan[]>([])

const dlg = ref(false)
const submitting = ref(false)
const form = ref<{ plan_id?: number; billing_cycle: 'monthly' | 'yearly' }>({ billing_cycle: 'yearly' })

const hasPaidOrder = computed(() => rows.value.some((r) => r.status === 1))

async function load() {
  loading.value = true
  try {
    const r = await listSubscriptionOrders({ page: page.value, page_size: pageSize.value })
    rows.value = r.list || []
    total.value = r.total || 0
  } finally {
    loading.value = false
  }
}

function onPage(p: number) {
  page.value = p
  load()
}

function openCreate() {
  form.value = { billing_cycle: 'yearly' }
  dlg.value = true
}

async function submit() {
  submitting.value = true
  try {
    const r = await createSubscriptionOrder({
      plan_id: form.value.plan_id,
      billing_cycle: form.value.billing_cycle,
    })
    ElMessage.success(`订单已创建：${r.order.order_no}`)
    dlg.value = false
    load()
  } catch (e: any) {
    ElMessage.error(e?.message || '创建失败')
  } finally {
    submitting.value = false
  }
}

function fmt(s?: string) {
  if (!s) return '-'
  return new Date(s).toLocaleString('zh-CN', { hour12: false })
}

onMounted(async () => {
  plans.value = (await listPlans()) || []
  load()
})
</script>

<style scoped>
.billing-page {
  padding: 16px;
}
.flex-between {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.mb-16 {
  margin-bottom: 16px;
}
.mt-16 {
  margin-top: 16px;
}
</style>
