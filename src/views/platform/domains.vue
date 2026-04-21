<template>
  <div class="page">
    <div class="header">
      <h3>自定义域名审核</h3>
      <el-button @click="load">刷新</el-button>
    </div>
    <el-table :data="rows" border size="small">
      <el-table-column prop="tenant_id" label="租户ID" width="90" />
      <el-table-column prop="custom_domain" label="申请域名" width="260" />
      <el-table-column label="校验状态" width="110">
        <template #default="{ row }">
          <el-tag :type="row.domain_verified === 1 ? 'success' : 'info'" size="small">
            {{ row.domain_verified === 1 ? '已校验' : '待审核' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="ssl_status" label="SSL 状态" width="110" />
      <el-table-column prop="updated_at" label="最近更新" width="180" />
      <el-table-column label="操作" width="260">
        <template #default="{ row }">
          <el-button
            size="small"
            type="success"
            :disabled="row.domain_verified === 1"
            @click="verify(row)"
          >
            审核通过 / 签发 SSL
          </el-button>
          <el-button size="small" type="danger" @click="reject(row)">拒绝 / 解绑</el-button>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script setup lang="ts">
import { listDomains, rejectDomain, verifyDomain, type TenantSiteConfig } from '@/api/platformOps'
import { ElMessage, ElMessageBox } from 'element-plus'
import { onMounted, ref } from 'vue'

const rows = ref<TenantSiteConfig[]>([])
async function load() {
  rows.value = await listDomains()
}
async function verify(row: TenantSiteConfig) {
  await ElMessageBox.confirm(
    `确认通过域名 "${row.custom_domain}"？\n平台将标记为已校验并签发 SSL。`,
    '确认',
    { type: 'success' },
  )
  await verifyDomain(row.tenant_id)
  ElMessage.success('已通过')
  load()
}
async function reject(row: TenantSiteConfig) {
  await ElMessageBox.confirm(
    `拒绝并解绑域名 "${row.custom_domain}"？\n将清空该租户的绑定。`,
    '确认',
    { type: 'warning' },
  )
  await rejectDomain(row.tenant_id)
  ElMessage.success('已拒绝')
  load()
}
onMounted(load)
</script>

<style scoped>
.page { padding: 16px; }
.header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
.header h3 { margin: 0; }
</style>
