<script setup lang="ts">
import type { TenantRow } from '@/api/platform'
import { auditPayment, listPaymentAudit, type PaymentConfig } from '@/api/settings'
import RelatedInfo from '@/components/RelatedInfo.vue'
import { loadTenantLookup, tenantInfo } from '@/utils/adminLookups'
import { ElMessage, ElMessageBox } from 'element-plus'
import { onMounted, ref } from 'vue'

const loading = ref(false)
const list = ref<PaymentConfig[]>([])
const total = ref(0)
const page = ref(1)
const size = ref(20)
const status = ref<number | undefined>(0)
const tenantLookup = ref(new Map<number, TenantRow>())

function tenantCell(id: number) {
  return tenantInfo(tenantLookup.value.get(Number(id || 0)), id)
}

async function load() {
  loading.value = true
  try {
    const r = await listPaymentAudit({ page: page.value, size: size.value, status: status.value })
    list.value = r.list || []; total.value = r.total || 0
    tenantLookup.value = await loadTenantLookup(list.value.map((item) => item.tenant_id), tenantLookup.value)
  } finally { loading.value = false }
}

async function doAudit(row: PaymentConfig, approve: boolean) {
  let remark = ''
  if (!approve) {
    const r = await ElMessageBox.prompt('驳回原因', '驳回', { inputPlaceholder: '请填写原因', confirmButtonText:'确认驳回' })
    remark = r.value || ''
  }
  await auditPayment(row.id, approve, remark)
  ElMessage.success(approve ? '已通过' : '已驳回')
  load()
}

function auditLabel(s: number) { return s === 1 ? '已通过' : s === 2 ? '已驳回' : '待审核' }
function auditType(s: number): 'success' | 'danger' | 'warning' { return s === 1 ? 'success' : s === 2 ? 'danger' : 'warning' }

onMounted(load)
</script>

<template>
  <el-card v-loading="loading">
    <template #header>
      <div class="hd">
        <span>商户结算资料审核</span>
        <el-select v-model="status" style="width:160px" @change="(page=1, load())" clearable placeholder="审核状态">
          <el-option label="待审核" :value="0" />
          <el-option label="已通过" :value="1" />
          <el-option label="已驳回" :value="2" />
        </el-select>
      </div>
    </template>

    <el-table :data="list" stripe>
      <el-table-column prop="id" label="ID" width="70" />
      <el-table-column label="租户" min-width="220">
        <template #default="{ row }"><RelatedInfo v-bind="tenantCell(row.tenant_id)" /></template>
      </el-table-column>
      <el-table-column prop="provider" label="类型" width="100" />
      <el-table-column prop="settlement_account_name" label="结算户名" width="160" />
      <el-table-column prop="settlement_account_no" label="结算账号" width="180" show-overflow-tooltip />
      <el-table-column prop="settlement_bank_name" label="开户行/渠道" width="160" />
      <el-table-column prop="settlement_remark" label="备注" show-overflow-tooltip />
      <el-table-column label="状态" width="120">
        <template #default="{ row }">
          <el-tag :type="auditType(row.audit_status)">{{ auditLabel(row.audit_status) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="submitted_at" label="提交时间" width="180" />
      <el-table-column label="操作" align="center" class-name="operation-column" width="180" fixed="right">
        <template #default="{ row }">
          <el-button link type="success" :disabled="row.audit_status === 1" @click="doAudit(row, true)">通过</el-button>
          <el-button link type="danger" :disabled="row.audit_status === 2" @click="doAudit(row, false)">驳回</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-pagination
      style="margin-top:12px"
      v-model:current-page="page" v-model:page-size="size"
      :page-sizes="[10,20,50]" layout="total, sizes, prev, pager, next"
      :total="total" @current-change="load" @size-change="load"
    />
  </el-card>
</template>

<style scoped>.hd{display:flex;justify-content:space-between;align-items:center;}</style>
