<script setup lang="ts">
import {
  getMemberDetail,
  listMembers,
  updateMemberLevel,
  updateMemberStatus,
  type AdminMember,
  type AdminMemberDetailResp,
} from '@/api/member'
import { listMemberLevels, type MemberLevel } from '@/api/memberLevel'
import { Medal, Refresh, Search, SwitchButton, View } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { onMounted, ref } from 'vue'

const rows = ref<AdminMember[]>([])
const total = ref(0)
const page = ref(1)
const size = ref(20)
const keyword = ref('')
const status = ref<number | undefined>()
const loading = ref(false)

const detailVisible = ref(false)
const detailLoading = ref(false)
const detail = ref<AdminMemberDetailResp | null>(null)

const levelVisible = ref(false)
const levelSaving = ref(false)
const levelOptions = ref<MemberLevel[]>([])
const currentMember = ref<AdminMember | null>(null)
const levelForm = ref<{ level_id: number | null; level_expire_at: string | null }>({
  level_id: null,
  level_expire_at: null,
})

async function load() {
  loading.value = true
  try {
    const params: { page: number; size: number; keyword?: string; status?: number } = {
      page: page.value,
      size: size.value,
    }
    const kw = keyword.value.trim()
    if (kw) params.keyword = kw
    if (status.value !== undefined) params.status = status.value
    const resp = await listMembers(params)
    rows.value = resp.list
    total.value = resp.total
  } finally {
    loading.value = false
  }
}

function search() {
  page.value = 1
  load()
}

function reset() {
  keyword.value = ''
  status.value = undefined
  page.value = 1
  load()
}

function handleSizeChange(value: number) {
  size.value = value
  page.value = 1
  load()
}

function displayName(row: AdminMember) {
  return row.nickname || row.phone || `会员 #${row.id}`
}

function memberInitial(row: AdminMember) {
  return displayName(row).slice(0, 1) || '会'
}

function statusText(value: number) {
  return value === 1 ? '正常' : '已禁用'
}

function statusType(value: number) {
  return value === 1 ? 'success' : 'info'
}

function genderText(value: number) {
  return { 1: '男', 2: '女' }[value] || '未知'
}

function formatTime(value?: string | null) {
  if (!value) return '-'
  return value.replace('T', ' ').slice(0, 19)
}

async function openDetail(row: AdminMember) {
  detailVisible.value = true
  detailLoading.value = true
  detail.value = null
  try {
    detail.value = await getMemberDetail(row.id)
  } finally {
    detailLoading.value = false
  }
}

async function toggleStatus(row: AdminMember) {
  const nextStatus = row.status === 1 ? 0 : 1
  try {
    await ElMessageBox.confirm(
      `确认${nextStatus === 1 ? '启用' : '禁用'}会员「${displayName(row)}」？`,
      '会员状态',
      { type: nextStatus === 1 ? 'info' : 'warning' },
    )
  } catch {
    return
  }
  await updateMemberStatus(row.id, nextStatus)
  ElMessage.success(nextStatus === 1 ? '会员已启用' : '会员已禁用')
  await load()
}

async function ensureLevelOptions() {
  if (levelOptions.value.length > 0) return true
  try {
    levelOptions.value = await listMemberLevels()
    return true
  } catch {
    return false
  }
}

async function openLevel(row: AdminMember) {
  const ok = await ensureLevelOptions()
  if (!ok) return
  currentMember.value = row
  levelForm.value = {
    level_id: row.level_id || null,
    level_expire_at: row.level_expire_at || null,
  }
  levelVisible.value = true
}

async function submitLevel() {
  if (!currentMember.value) return
  levelSaving.value = true
  try {
    await updateMemberLevel(currentMember.value.id, levelForm.value.level_id, levelForm.value.level_expire_at)
    ElMessage.success('会员等级已更新')
    levelVisible.value = false
    await load()
  } finally {
    levelSaving.value = false
  }
}

onMounted(load)
</script>

<template>
  <div class="page">
    <el-card>
      <div class="toolbar">
        <div class="filters">
          <el-input
            v-model="keyword"
            clearable
            placeholder="搜索昵称 / 手机 / OpenID / ID"
            class="keyword"
            @keyup.enter="search"
          />
          <el-select v-model="status" clearable placeholder="会员状态" class="status-filter">
            <el-option label="正常" :value="1" />
            <el-option label="已禁用" :value="0" />
          </el-select>
          <el-button type="primary" :icon="Search" @click="search">查询</el-button>
          <el-button :icon="Refresh" @click="reset">重置</el-button>
        </div>
      </div>

      <el-table :data="rows" v-loading="loading" stripe>
        <el-table-column label="会员" min-width="220">
          <template #default="{ row }">
            <div class="member-cell">
              <el-avatar :size="36" :src="row.avatar || undefined">{{ memberInitial(row) }}</el-avatar>
              <div class="member-meta">
                <div class="member-name">{{ displayName(row) }}</div>
                <div class="member-id">ID {{ row.id }}</div>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="phone" label="手机号" width="140">
          <template #default="{ row }">{{ row.phone || '-' }}</template>
        </el-table-column>
        <el-table-column label="等级" width="130">
          <template #default="{ row }">
            <el-tag v-if="row.level_name" :color="row.level_color || undefined" effect="dark" disable-transitions>
              {{ row.level_name }}
            </el-tag>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column prop="points" label="积分" width="90" />
        <el-table-column prop="growth_value" label="成长值" width="100" />
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="statusType(row.status)">{{ statusText(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="最近登录" width="170">
          <template #default="{ row }">{{ formatTime(row.last_login_at) }}</template>
        </el-table-column>
        <el-table-column label="注册时间" width="170">
          <template #default="{ row }">{{ formatTime(row.created_at) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="240" fixed="right">
          <template #default="{ row }">
            <el-button size="small" :icon="View" @click="openDetail(row)">详情</el-button>
            <el-button size="small" :icon="Medal" @click="openLevel(row)">等级</el-button>
            <el-button size="small" :type="row.status === 1 ? 'warning' : 'success'" :icon="SwitchButton" @click="toggleStatus(row)">
              {{ row.status === 1 ? '禁用' : '启用' }}
            </el-button>
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
        @current-change="(value) => { page = value; load() }"
        @size-change="handleSizeChange"
      />
    </el-card>

    <el-drawer v-model="detailVisible" title="会员详情" size="620px">
      <div v-loading="detailLoading">
        <template v-if="detail">
          <div class="detail-head">
            <el-avatar :size="48" :src="detail.member.avatar || undefined">{{ memberInitial(detail.member) }}</el-avatar>
            <div>
              <div class="detail-name">{{ displayName(detail.member) }}</div>
              <div class="detail-sub">{{ detail.member.phone || '未绑定手机号' }}</div>
            </div>
          </div>

          <el-descriptions :column="2" border class="detail-block">
            <el-descriptions-item label="会员ID">{{ detail.member.id }}</el-descriptions-item>
            <el-descriptions-item label="状态">{{ statusText(detail.member.status) }}</el-descriptions-item>
            <el-descriptions-item label="性别">{{ genderText(detail.member.gender) }}</el-descriptions-item>
            <el-descriptions-item label="生日">{{ formatTime(detail.member.birthday) }}</el-descriptions-item>
            <el-descriptions-item label="积分">{{ detail.member.points }}</el-descriptions-item>
            <el-descriptions-item label="成长值">{{ detail.member.growth_value }}</el-descriptions-item>
            <el-descriptions-item label="等级">{{ detail.member.level_name || '-' }}</el-descriptions-item>
            <el-descriptions-item label="等级到期">{{ formatTime(detail.member.level_expire_at) }}</el-descriptions-item>
            <el-descriptions-item label="OpenID" :span="2">{{ detail.member.openid || '-' }}</el-descriptions-item>
          </el-descriptions>

          <div class="section-title">收货地址</div>
          <el-table :data="detail.addresses" size="small" empty-text="暂无地址">
            <el-table-column prop="receiver_name" label="收件人" width="90" />
            <el-table-column prop="receiver_phone" label="电话" width="130" />
            <el-table-column label="地址" min-width="260">
              <template #default="{ row }">
                {{ row.province }}{{ row.city }}{{ row.district }}{{ row.address }}
              </template>
            </el-table-column>
            <el-table-column label="默认" width="70">
              <template #default="{ row }">
                <el-tag v-if="row.is_default === 1" size="small">是</el-tag>
                <span v-else>-</span>
              </template>
            </el-table-column>
          </el-table>

          <div class="section-title">最近积分明细</div>
          <el-table :data="detail.points_logs" size="small" empty-text="暂无积分明细">
            <el-table-column prop="change_type" label="类型" width="110" />
            <el-table-column prop="change_value" label="变动" width="80" />
            <el-table-column prop="balance_after" label="余额" width="80" />
            <el-table-column prop="source_desc" label="来源" min-width="160" show-overflow-tooltip />
            <el-table-column label="时间" width="160">
              <template #default="{ row }">{{ formatTime(row.created_at) }}</template>
            </el-table-column>
          </el-table>
        </template>
      </div>
    </el-drawer>

    <el-dialog v-model="levelVisible" title="调整会员等级" width="460px">
      <el-form :model="levelForm" label-width="100px">
        <el-form-item label="当前会员">
          <span>{{ currentMember ? displayName(currentMember) : '-' }}</span>
        </el-form-item>
        <el-form-item label="会员等级">
          <el-select v-model="levelForm.level_id" clearable placeholder="不设置等级" style="width: 240px">
            <el-option v-for="level in levelOptions" :key="level.id" :label="level.name" :value="level.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="到期时间">
          <el-date-picker
            v-model="levelForm.level_expire_at"
            type="datetime"
            value-format="YYYY-MM-DDTHH:mm:ssZ"
            placeholder="永久有效"
            clearable
            style="width: 240px"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="levelVisible = false">取消</el-button>
        <el-button type="primary" :loading="levelSaving" @click="submitLevel">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.page { padding: 16px; }
.toolbar { display: flex; margin-bottom: 12px; }
.filters { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; }
.keyword { width: 280px; }
.status-filter { width: 140px; }
.member-cell { display: flex; align-items: center; gap: 10px; min-width: 0; }
.member-meta { min-width: 0; }
.member-name { font-weight: 600; color: #303133; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.member-id { color: #909399; font-size: 12px; margin-top: 2px; }
.pager { margin-top: 12px; justify-content: flex-end; display: flex; }
.detail-head { display: flex; align-items: center; gap: 12px; margin-bottom: 16px; }
.detail-name { font-size: 16px; font-weight: 600; color: #303133; }
.detail-sub { color: #909399; margin-top: 4px; }
.detail-block { margin-bottom: 18px; }
.section-title { margin: 18px 0 10px; font-weight: 600; color: #303133; }

@media (max-width: 720px) {
  .page { padding: 8px; }
  .keyword { width: 100%; }
  .status-filter { width: 100%; }
}
</style>
