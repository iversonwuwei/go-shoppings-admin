<template>
  <div class="page">
    <el-row :gutter="16">
      <el-col :span="8">
        <el-card shadow="hover">
          <div class="label">租户总数</div>
          <div class="value">{{ data.tenants_total }}</div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card shadow="hover">
          <div class="label">平台总营收 (元)</div>
          <div class="value">{{ data.revenue_total }}</div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card shadow="hover">
          <div class="label">当前账户</div>
          <div class="value">{{ user.admin?.real_name }}</div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { getDashboard } from '@/api/platform'
import { useUserStore } from '@/stores/user'
import { onMounted, ref } from 'vue'

const user = useUserStore()
const data = ref({ tenants_total: 0, revenue_total: 0 })

onMounted(async () => {
  data.value = await getDashboard()
})
</script>

<style scoped>
.label { color: #666; font-size: 14px; }
.value { font-size: 28px; font-weight: 600; margin-top: 8px; }
</style>
