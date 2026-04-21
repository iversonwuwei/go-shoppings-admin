<script setup lang="ts">
import { listCarriersForTenant, queryTrack, type Carrier, type TrackResult } from '@/api/settings'
import { ElMessage } from 'element-plus'
import { onMounted, reactive, ref } from 'vue'

const loading = ref(false)
const list = ref<Carrier[]>([])

const trackVisible = ref(false)
const trackForm = reactive({ carrier_code: '', carrier_name: '', tracking_no: '' })
const trackResult = ref<TrackResult | null>(null)
const tracking = ref(false)

async function load() {
  loading.value = true
  try { list.value = await listCarriersForTenant() } finally { loading.value = false }
}

function openTrack(row: Carrier) {
  trackForm.carrier_code = row.code
  trackForm.carrier_name = row.name
  trackForm.tracking_no = ''
  trackResult.value = null
  trackVisible.value = true
}
async function doTrack() {
  if (!trackForm.tracking_no) return ElMessage.warning('请输入运单号')
  tracking.value = true
  try { trackResult.value = await queryTrack(trackForm.carrier_code, trackForm.tracking_no) }
  finally { tracking.value = false }
}

onMounted(load)
</script>

<template>
  <div>
    <el-card v-loading="loading">
      <template #header>
        <div class="hd">
          <span>可用物流承运商</span>
          <span class="tip">承运商由平台统一维护与对接，商户可直接使用以下已启用的承运商进行物流查询。</span>
        </div>
      </template>

      <el-table :data="list" stripe empty-text="暂无可用承运商，请联系平台管理员">
        <el-table-column prop="code" label="编码" width="120" />
        <el-table-column prop="name" label="名称" width="180" />
        <el-table-column prop="api_provider" label="对接方" width="140">
          <template #default="{ row }">
            {{ row.api_provider || '未对接' }}
          </template>
        </el-table-column>
        <el-table-column prop="priority" label="优先级" width="100" />
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="openTrack(row)">物流查询</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="trackVisible" :title="`物流轨迹 - ${trackForm.carrier_name}`" width="640px">
      <el-form inline :model="trackForm">
        <el-form-item label="承运商">
          <el-input v-model="trackForm.carrier_name" disabled style="width:160px" />
        </el-form-item>
        <el-form-item label="运单号">
          <el-input v-model="trackForm.tracking_no" style="width:260px" @keyup.enter="doTrack" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :loading="tracking" @click="doTrack">查询</el-button>
        </el-form-item>
      </el-form>
      <el-divider v-if="trackResult" />
      <div v-if="trackResult">
        <p>
          <b>{{ trackResult.carrier_name }}</b>
          <el-tag size="small" style="margin:0 8px">{{ trackResult.api_provider || 'none' }}</el-tag>
          状态：{{ trackResult.status }}
        </p>
        <el-timeline>
          <el-timeline-item v-for="(n, i) in trackResult.nodes" :key="i" :timestamp="n.time">
            {{ n.context }}
          </el-timeline-item>
        </el-timeline>
      </div>
    </el-dialog>
  </div>
</template>

<style scoped>
.hd { display:flex; justify-content:space-between; align-items:center; }
.tip { color:#999; font-size:12px; }
</style>
