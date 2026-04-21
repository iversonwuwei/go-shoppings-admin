<template>
  <div class="page">
    <el-card>
      <div class="toolbar">
        <el-input v-model="keyword" placeholder="搜索公司名/编号/联系人" style="width: 260px" clearable @change="load" />
        <el-select v-model="status" placeholder="状态" style="width: 140px; margin-left: 8px" clearable @change="load">
          <el-option label="待审核" :value="0" />
          <el-option label="正常" :value="1" />
          <el-option label="禁用" :value="2" />
        </el-select>
        <el-button type="primary" @click="load">查询</el-button>
      </div>

      <el-table :data="rows" v-loading="loading" stripe>
        <el-table-column prop="id" label="ID" width="60" />
        <el-table-column prop="code" label="编号" width="120" />
        <el-table-column prop="company_name" label="公司名称" min-width="180" />
        <el-table-column prop="contact_name" label="联系人" width="100" />
        <el-table-column prop="contact_phone" label="联系电话" width="140" />
        <el-table-column prop="plan_id" label="套餐" width="80" />
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="tagType(row.status)">{{ statusLabel(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="创建时间" width="180" />
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button size="small" type="primary" @click="audit(row, true)">通过</el-button>
            <el-button size="small" type="danger" @click="audit(row, false)">拒绝</el-button>
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
        :page-sizes="[10, 20, 50, 100]"
        @current-change="(p) => { page = p; load() }"
        @size-change="(s) => { size = s; load() }"
      />
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { auditTenant, listTenants, type TenantRow } from '@/api/platform'
import { ElMessage, ElMessageBox } from 'element-plus'
import { onMounted, ref } from 'vue'

const rows = ref<TenantRow[]>([])
const total = ref(0)
const page = ref(1)
const size = ref(20)
const keyword = ref('')
const status = ref<number | undefined>()
const loading = ref(false)

async function load() {
  loading.value = true
  try {
    const resp = await listTenants({ page: page.value, size: size.value, keyword: keyword.value, status: status.value })
    rows.value = resp.list
    total.value = resp.total
  } finally {
    loading.value = false
  }
}

function statusLabel(s: number) {
  return s === 0 ? '待审核' : s === 1 ? '正常' : '禁用'
}
function tagType(s: number): 'warning' | 'success' | 'danger' {
  return s === 0 ? 'warning' : s === 1 ? 'success' : 'danger'
}

async function audit(row: TenantRow, approve: boolean) {
  let reason = ''
  if (!approve) {
    const r = await ElMessageBox.prompt('请输入拒绝理由', '租户审核', { inputPattern: /.+/, inputErrorMessage: '不能为空' }).catch(() => null)
    if (!r) return
    reason = r.value
  }
  await auditTenant(row.id, approve, reason)
  ElMessage.success(approve ? '已通过' : '已拒绝')
  load()
}

onMounted(load)
</script>

<style scoped>
.toolbar { display: flex; gap: 8px; margin-bottom: 12px; }
.pager { margin-top: 12px; justify-content: flex-end; display: flex; }
</style>
