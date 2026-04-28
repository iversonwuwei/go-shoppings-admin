<script setup lang="ts">
import { listCoupons, type Coupon } from '@/api/coupon'
import {
    adjustMemberPoints,
    getMemberDetail,
    grantMemberCoupon,
    listMembers,
    updateMemberCouponStatus,
    updateMemberLevel,
    updateMemberStatus,
    type AdminMember,
    type AdminMemberDetailResp,
    type MemberCoupon,
} from '@/api/member'
import { listMemberLevels, type MemberLevel } from '@/api/memberLevel'
import { Medal, Refresh, Search, SwitchButton, View } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { computed, onMounted, ref } from 'vue'

const rows = ref<AdminMember[]>([])
const total = ref(0)
const page = ref(1)
const size = ref(20)
const keyword = ref('')
const status = ref<number | undefined>()
const loading = ref(false)

const detailVisible = ref(false)
const detailLoading = ref(false)
const detailActiveTab = ref('profile')
const detail = ref<AdminMemberDetailResp | null>(null)

const levelVisible = ref(false)
const levelSaving = ref(false)
const levelOptions = ref<MemberLevel[]>([])
const currentMember = ref<AdminMember | null>(null)
const levelForm = ref<{ level_id: number | null; level_expire_at: string | null }>({
  level_id: null,
  level_expire_at: null,
})

const pointsVisible = ref(false)
const pointsSaving = ref(false)
const pointsForm = ref({
  change_value: 0,
  source_desc: '后台调整',
  remark: '',
})

const grantVisible = ref(false)
const grantSaving = ref(false)
const couponOptions = ref<Coupon[]>([])
const grantForm = ref<{ coupon_id: number | null }>({ coupon_id: null })

const sortedMemberCoupons = computed(() => {
  return [...(detail.value?.coupons || [])].sort((left, right) => {
    const priorityDiff = couponStatusPriority(memberCouponDisplayStatus(left)) - couponStatusPriority(memberCouponDisplayStatus(right))
    if (priorityDiff !== 0) return priorityDiff
    return new Date(right.received_at || 0).getTime() - new Date(left.received_at || 0).getTime()
  })
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

function money(value?: string | number | null) {
  return `¥${Number(value || 0).toFixed(2)}`
}

function trimNumberText(value?: string | number | null) {
  return Number(value || 0).toFixed(2).replace(/\.00$/, '').replace(/(\.\d)0$/, '$1')
}

function couponDiscountLabel(row: MemberCoupon | Coupon) {
  const raw = row as any
  const type = raw.type || raw.coupon_type
  if (type === 'discount') return `打 ${trimNumberText(raw.discount_value)}%`
  if (type === 'shipping') return '免邮'
  return `减 ${money(raw.discount_value)}`
}

function couponThresholdLabel(row: MemberCoupon | Coupon) {
  const threshold = Number(row.threshold_amount || 0)
  return threshold > 0 ? `满 ${money(threshold)} 可用` : '无门槛'
}

function couponStatusText(status: string) {
  const map: Record<string, string> = { unused: '未使用', used: '已使用', expired: '已过期' }
  return map[status] || status || '-'
}

function memberCouponDisplayStatus(row: MemberCoupon) {
  if (row.status === 'unused' && new Date(row.valid_end_at).getTime() < Date.now()) return 'expired'
  return row.status
}

function couponStatusPriority(status: string) {
  const map: Record<string, number> = { unused: 0, used: 1, expired: 2 }
  return map[status] ?? 9
}

function couponStatusClass(status: string) {
  return `coupon-status coupon-status-${status || 'unknown'}`
}

function pointsChangeText(value: number) {
  return value > 0 ? `+${value}` : String(value)
}

function pointsChangeTypeText(type: string) {
  const map: Record<string, string> = {
    earn: '订单赠送',
    consume: '消费抵扣',
    refund: '退款返还',
    admin_add: '后台增加',
    admin_deduct: '后台扣减',
  }
  return map[type] || type || '-'
}

function availableCouponLabel(row: Coupon) {
  return `${row.name} · ${couponDiscountLabel(row)} · ${couponThresholdLabel(row)}`
}

async function reloadDetail() {
  if (!detail.value) return
  detail.value = await getMemberDetail(detail.value.member.id)
}

async function openDetail(row: AdminMember) {
  detailVisible.value = true
  detailLoading.value = true
  detailActiveTab.value = 'profile'
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

async function openPointsAdjust() {
  pointsForm.value = { change_value: 0, source_desc: '后台调整', remark: '' }
  pointsVisible.value = true
}

async function submitPointsAdjust() {
  if (!detail.value) return
  if (!pointsForm.value.change_value) {
    ElMessage.warning('请输入非 0 的积分变动值')
    return
  }
  pointsSaving.value = true
  try {
    await adjustMemberPoints(detail.value.member.id, pointsForm.value)
    ElMessage.success('积分已调整')
    pointsVisible.value = false
    await reloadDetail()
    await load()
  } finally {
    pointsSaving.value = false
  }
}

async function ensureCouponOptions() {
  if (couponOptions.value.length > 0) return true
  try {
    couponOptions.value = (await listCoupons()).filter((item) => item.status === 1)
    return true
  } catch {
    return false
  }
}

async function openGrantCoupon() {
  const ok = await ensureCouponOptions()
  if (!ok) return
  grantForm.value = { coupon_id: null }
  grantVisible.value = true
}

async function submitGrantCoupon() {
  if (!detail.value || !grantForm.value.coupon_id) {
    ElMessage.warning('请选择要发放的优惠券')
    return
  }
  grantSaving.value = true
  try {
    await grantMemberCoupon(detail.value.member.id, grantForm.value.coupon_id)
    ElMessage.success('优惠券已发放')
    grantVisible.value = false
    await reloadDetail()
  } finally {
    grantSaving.value = false
  }
}

async function setMemberCouponStatus(row: MemberCoupon, nextStatus: 'unused' | 'expired') {
  if (!detail.value) return
  try {
    await ElMessageBox.confirm(
      `确认${nextStatus === 'expired' ? '作废' : '恢复'}优惠券「${row.coupon_name}」？`,
      '优惠券状态',
      { type: nextStatus === 'expired' ? 'warning' : 'info' },
    )
  } catch {
    return
  }
  await updateMemberCouponStatus(detail.value.member.id, row.id, nextStatus)
  ElMessage.success(nextStatus === 'expired' ? '优惠券已作废' : '优惠券已恢复')
  await reloadDetail()
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

    <el-drawer v-model="detailVisible" title="会员详情" size="70%">
      <div v-loading="detailLoading">
        <template v-if="detail">
          <div class="detail-head">
            <el-avatar :size="48" :src="detail.member.avatar || undefined">{{ memberInitial(detail.member) }}</el-avatar>
            <div>
              <div class="detail-name">{{ displayName(detail.member) }}</div>
              <div class="detail-sub">{{ detail.member.phone || '未绑定手机号' }}</div>
            </div>
          </div>

          <div class="asset-strip">
            <div>
              <span>{{ detail.member.points }}</span>
              <label>当前积分</label>
            </div>
            <div>
              <span>{{ detail.member.growth_value }}</span>
              <label>成长值</label>
            </div>
            <div>
              <span>{{ (detail.coupons || []).length }}</span>
              <label>已领优惠</label>
            </div>
            <div>
              <span>{{ (detail.points_logs || []).length }}</span>
              <label>最近积分动态</label>
            </div>
          </div>

          <el-tabs v-model="detailActiveTab">
            <el-tab-pane label="基础信息" name="profile">
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
            </el-tab-pane>

            <el-tab-pane label="优惠券" name="coupons">
              <div class="tab-toolbar">
                <span>已领取 {{ (detail.coupons || []).length }} 张</span>
                <el-button type="primary" size="small" @click="openGrantCoupon">发放优惠券</el-button>
              </div>
              <el-table :data="sortedMemberCoupons" size="small" empty-text="暂无优惠券" max-height="420">
                <el-table-column prop="coupon_name" label="优惠券" min-width="160" show-overflow-tooltip />
                <el-table-column label="优惠" width="110">
                  <template #default="{ row }">{{ couponDiscountLabel(row) }}</template>
                </el-table-column>
                <el-table-column label="门槛" width="120">
                  <template #default="{ row }">{{ couponThresholdLabel(row) }}</template>
                </el-table-column>
                <el-table-column label="状态" width="110">
                  <template #default="{ row }">
                    <span :class="couponStatusClass(memberCouponDisplayStatus(row))">
                      {{ couponStatusText(memberCouponDisplayStatus(row)) }}
                    </span>
                  </template>
                </el-table-column>
                <el-table-column label="有效期" min-width="230">
                  <template #default="{ row }">{{ formatTime(row.valid_start_at) }} 至 {{ formatTime(row.valid_end_at) }}</template>
                </el-table-column>
                <el-table-column label="领取时间" width="160">
                  <template #default="{ row }">{{ formatTime(row.received_at) }}</template>
                </el-table-column>
                <el-table-column label="操作" width="150" fixed="right">
                  <template #default="{ row }">
                    <el-button
                      v-if="row.status === 'unused' && memberCouponDisplayStatus(row) === 'unused'"
                      size="small"
                      type="warning"
                      link
                      @click="setMemberCouponStatus(row, 'expired')"
                    >作废</el-button>
                    <el-button
                      v-else-if="row.status === 'expired'"
                      size="small"
                      type="primary"
                      link
                      @click="setMemberCouponStatus(row, 'unused')"
                    >恢复</el-button>
                    <span v-else class="muted">不可操作</span>
                  </template>
                </el-table-column>
              </el-table>
            </el-tab-pane>

            <el-tab-pane label="积分动态" name="points">
              <div class="tab-toolbar">
                <span>当前积分 {{ detail.member.points }}</span>
                <el-button type="primary" size="small" @click="openPointsAdjust">调整积分</el-button>
              </div>
              <el-table :data="detail.points_logs || []" size="small" empty-text="暂无积分明细" max-height="420">
                <el-table-column label="类型" width="110">
                  <template #default="{ row }">{{ pointsChangeTypeText(row.change_type) }}</template>
                </el-table-column>
                <el-table-column label="变动" width="90">
                  <template #default="{ row }">
                    <span :class="row.change_value >= 0 ? 'positive' : 'negative'">{{ pointsChangeText(row.change_value) }}</span>
                  </template>
                </el-table-column>
                <el-table-column prop="balance_after" label="余额" width="80" />
                <el-table-column prop="source_desc" label="来源" min-width="150" show-overflow-tooltip />
                <el-table-column prop="remark" label="备注" min-width="150" show-overflow-tooltip />
                <el-table-column label="时间" width="160">
                  <template #default="{ row }">{{ formatTime(row.created_at) }}</template>
                </el-table-column>
              </el-table>
            </el-tab-pane>

            <el-tab-pane label="收货地址" name="addresses">
              <el-table :data="detail.addresses" size="small" empty-text="暂无地址" max-height="420">
                <el-table-column prop="receiver_name" label="收件人" width="90" />
                <el-table-column prop="receiver_phone" label="电话" width="130" />
                <el-table-column label="地址" min-width="320">
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
            </el-tab-pane>
          </el-tabs>
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

    <el-dialog v-model="pointsVisible" title="调整会员积分" width="460px">
      <el-form :model="pointsForm" label-width="100px">
        <el-form-item label="变动积分">
          <el-input-number v-model="pointsForm.change_value" :min="-999999" :max="999999" controls-position="right" />
        </el-form-item>
        <el-form-item label="来源">
          <el-input v-model="pointsForm.source_desc" maxlength="200" placeholder="例：客服补偿 / 活动奖励" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="pointsForm.remark" maxlength="500" type="textarea" :rows="3" placeholder="记录本次调整原因" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="pointsVisible = false">取消</el-button>
        <el-button type="primary" :loading="pointsSaving" @click="submitPointsAdjust">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="grantVisible" title="发放优惠券" width="520px">
      <el-form :model="grantForm" label-width="100px">
        <el-form-item label="优惠券">
          <el-select v-model="grantForm.coupon_id" filterable placeholder="选择可发放优惠券" style="width: 340px">
            <el-option
              v-for="coupon in couponOptions"
              :key="coupon.id"
              :label="availableCouponLabel(coupon)"
              :value="coupon.id"
            />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="grantVisible = false">取消</el-button>
        <el-button type="primary" :loading="grantSaving" @click="submitGrantCoupon">发放</el-button>
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
.asset-strip { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 16px; }
.asset-strip > div { min-height: 68px; padding: 12px; border: 1px solid #ebeef5; border-radius: 6px; background: #fafafa; }
.asset-strip span { display: block; color: #303133; font-size: 20px; font-weight: 700; line-height: 26px; }
.asset-strip label { display: block; margin-top: 6px; color: #909399; font-size: 12px; }
.tab-toolbar { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 12px; color: #606266; }
.muted { color: #909399; }
.coupon-status { font-weight: 600; }
.coupon-status-unused { color: #67c23a; }
.coupon-status-used { color: #409eff; }
.coupon-status-expired { color: #f56c6c; }
.coupon-status-unknown { color: #909399; }
.positive { color: #67c23a; font-weight: 600; }
.negative { color: #f56c6c; font-weight: 600; }

@media (max-width: 720px) {
  .page { padding: 8px; }
  .keyword { width: 100%; }
  .status-filter { width: 100%; }
  .asset-strip { grid-template-columns: repeat(2, 1fr); }
}
</style>
