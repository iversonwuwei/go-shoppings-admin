<script setup lang="ts">
import { listCarriersForTenant, queryTrack, type Carrier, type TrackResult } from '@/api/settings'
import { Search } from '@element-plus/icons-vue'
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

      <el-table class="desktop-table" :data="list" stripe empty-text="暂无可用承运商，请联系平台管理员">
        <el-table-column prop="code" label="编码" width="120" />
        <el-table-column prop="name" label="名称" width="180" />
        <el-table-column prop="api_provider" label="对接方" width="140">
          <template #default="{ row }">
            {{ row.api_provider || '未对接' }}
          </template>
        </el-table-column>
        <el-table-column prop="priority" label="优先级" width="100" />
        <el-table-column label="操作" align="center" class-name="operation-column" width="180" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" :icon="Search" @click="openTrack(row)">物流查询</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="mobile-list">
        <template v-if="list.length">
          <div v-for="row in list" :key="row.id" class="carrier-row">
            <div class="carrier-main">
              <div class="carrier-title">{{ row.name }}</div>
              <div class="carrier-code">{{ row.code }}</div>
            </div>
            <div class="carrier-meta">
              <div>
                <span class="meta-label">对接方</span>
                <el-tag size="small" effect="plain">{{ row.api_provider || '未对接' }}</el-tag>
              </div>
              <div>
                <span class="meta-label">优先级</span>
                <span class="priority">{{ row.priority }}</span>
              </div>
            </div>
            <el-button class="track-btn" type="primary" plain :icon="Search" @click="openTrack(row)">物流查询</el-button>
          </div>
        </template>
        <el-empty v-else description="暂无可用承运商，请联系平台管理员" />
      </div>
    </el-card>

    <el-dialog
      v-model="trackVisible"
      :title="`物流轨迹 - ${trackForm.carrier_name}`"
      class="track-dialog"
    >
      <el-form class="track-form" :model="trackForm">
        <el-form-item label="承运商">
          <el-input v-model="trackForm.carrier_name" disabled />
        </el-form-item>
        <el-form-item label="运单号">
          <el-input v-model="trackForm.tracking_no" @keyup.enter="doTrack" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" :loading="tracking" @click="doTrack">查询</el-button>
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
.hd { display:flex; justify-content:space-between; align-items:center; gap:12px; }
.tip { color:#999; font-size:12px; line-height:1.5; text-align:right; }
.mobile-list { display:none; }
.track-form { display:grid; grid-template-columns:160px minmax(220px, 1fr) auto; gap:12px; align-items:flex-start; }
.track-form :deep(.el-form-item) { margin:0; }
.track-form :deep(.el-button) { width:100%; }

@media (max-width: 720px) {
  .hd { align-items:flex-start; flex-direction:column; }
  .tip { text-align:left; }
  .desktop-table { display:none; }
  .mobile-list { display:block; }
  .carrier-row { padding:14px 0; border-bottom:1px solid #ebeef5; }
  .carrier-row:first-child { padding-top:0; }
  .carrier-row:last-child { padding-bottom:0; border-bottom:none; }
  .carrier-main { display:flex; justify-content:space-between; gap:12px; align-items:flex-start; }
  .carrier-title { min-width:0; color:#303133; font-weight:600; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
  .carrier-code { flex:none; color:#909399; font-size:12px; line-height:20px; }
  .carrier-meta { display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-top:10px; color:#606266; font-size:13px; }
  .meta-label { display:block; margin-bottom:4px; color:#909399; font-size:12px; }
  .priority { color:#303133; font-weight:600; }
  .track-btn { width:100%; margin-top:12px; }
  .track-form { display:grid; grid-template-columns:1fr; gap:12px; }
  .track-form :deep(.el-form-item__label) { line-height:20px; }
}
</style>
