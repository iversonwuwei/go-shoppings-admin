<template>
  <div class="page">
    <el-card>
      <div class="toolbar">
        <el-input v-model="keyword" placeholder="搜索公司名/编号/联系人" style="width: 260px" clearable @change="load" />
        <el-select v-model="status" placeholder="状态" style="width: 140px; margin-left: 8px" clearable @change="load">
          <el-option label="待审核" :value="0" />
          <el-option label="正常" :value="1" />
          <el-option label="欠费" :value="2" />
          <el-option label="封禁" :value="3" />
        </el-select>
        <el-button type="primary" @click="load">查询</el-button>
      </div>

      <el-table :data="rows" v-loading="loading" stripe>
        <el-table-column prop="id" label="ID" width="60" />
        <el-table-column prop="code" label="编号" width="120" />
        <el-table-column prop="company_name" label="公司名称" min-width="180" />
        <el-table-column prop="contact_name" label="联系人" width="100" />
        <el-table-column prop="contact_phone" label="联系电话" width="140" />
        <el-table-column label="套餐" width="120">
          <template #default="{ row }">{{ planName(row.plan_id) }}</template>
        </el-table-column>
        <el-table-column label="到期时间" width="170">
          <template #default="{ row }">
            <span :class="{ 'expired': isExpired(row.plan_expire_at) }">{{ formatDate(row.plan_expire_at) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="附加功能" width="110">
          <template #default="{ row }">
            <el-tag v-if="row.extra_features && row.extra_features.length" type="success" size="small">
              +{{ row.extra_features.length }} 项
            </el-tag>
            <span v-else style="color:#909399">无</span>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="tagType(row.status)">{{ statusLabel(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="360" fixed="right">
          <template #default="{ row }">
            <template v-if="row.status === 0">
              <el-button size="small" type="primary" @click="audit(row, true)">通过</el-button>
              <el-button size="small" type="danger" @click="audit(row, false)">拒绝</el-button>
            </template>
            <template v-else>
              <el-button size="small" @click="openPlan(row)">套餐/续期</el-button>
              <el-button size="small" @click="openFeatures(row)">附加功能</el-button>
              <el-button size="small" @click="openQuickEntries(row)">快捷入口</el-button>
              <el-button v-if="row.status !== 3" size="small" type="danger" @click="toggleBan(row, true)">封禁</el-button>
              <el-button v-else size="small" type="success" @click="toggleBan(row, false)">恢复</el-button>
            </template>
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

    <el-dialog v-model="planDialog" title="修改套餐 / 续期" width="480px">
      <el-form label-width="90px" :model="planForm">
        <el-form-item label="租户">
          <span>{{ current?.company_name }}</span>
        </el-form-item>
        <el-form-item label="套餐">
          <el-select v-model="planForm.plan_id" placeholder="请选择套餐" style="width:100%">
            <el-option v-for="p in plans" :key="p.id" :label="`${p.name}（${p.code}）`" :value="p.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="到期时间">
          <el-date-picker
            v-model="planForm.plan_expire_at"
            type="datetime"
            placeholder="不修改则保持原值"
            value-format="YYYY-MM-DDTHH:mm:ssZ"
            style="width:100%"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="planDialog = false">取消</el-button>
        <el-button type="primary" @click="submitPlan">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="featDialog" title="附加功能（与套餐取并集）" width="720px">
      <div v-if="current" style="margin-bottom:8px;color:#909399">
        租户：{{ current.company_name }} · 套餐：{{ planName(current.plan_id) }}
      </div>
      <el-alert
        type="info"
        :closable="false"
        show-icon
        style="margin-bottom:12px"
        title="此处仅授予【套餐之外】的附加功能；套餐自带的功能无需重复勾选。"
      />
      <el-transfer
        v-model="featForm.extra_features"
        :data="featOptions"
        :titles="['可选功能', '已授予']"
        filterable
        filter-placeholder="搜索编码/名称"
        :props="{ key: 'key', label: 'label' }"
        style="text-align:left"
      />
      <template #footer>
        <el-button @click="featDialog = false">取消</el-button>
        <el-button type="primary" @click="submitFeatures">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="quickDialog" title="商城快捷入口" width="720px">
      <div v-if="current" style="margin-bottom: 12px; color: #909399">
        租户：{{ current.company_name }}（{{ current.code }}）
      </div>
      <div class="config-list">
        <div v-for="(item, idx) in quickForm.storefront_quick_entries" :key="`quick-entry-${idx}`" class="config-card">
          <div class="config-card__head">
            <strong>入口 {{ idx + 1 }}</strong>
            <el-button text type="danger" @click="removeQuickEntry(idx)">删除</el-button>
          </div>
          <el-form label-width="90px">
            <el-form-item label="标题">
              <el-input v-model="item.title" />
            </el-form-item>
            <el-form-item label="副标题">
              <el-input v-model="item.subtitle" />
            </el-form-item>
            <el-form-item label="跳转页面">
              <el-select v-model="item.path" style="width: 100%">
                <el-option v-for="pathOption in storefrontPathOptions" :key="pathOption.value" :label="pathOption.label" :value="pathOption.value" />
              </el-select>
            </el-form-item>
          </el-form>
        </div>
      </div>
      <template #footer>
        <el-button @click="addQuickEntry">新增快捷入口</el-button>
        <el-button @click="quickDialog = false">取消</el-button>
        <el-button type="primary" @click="submitQuickEntries">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { listFeatures, listPlans, type Plan, type PlanFeature } from '@/api/plans'
import {
    auditTenant,
    getTenantQuickEntries,
    listTenants,
    updateTenantQuickEntries,
    updateTenantFeatures,
    updateTenantPlan,
    updateTenantStatus,
    type TenantRow,
} from '@/api/platform'
import type { StorefrontQuickEntry } from '@/api/site'
import { ElMessage, ElMessageBox } from 'element-plus'
import { computed, onMounted, reactive, ref } from 'vue'

const rows = ref<TenantRow[]>([])
const total = ref(0)
const page = ref(1)
const size = ref(20)
const keyword = ref('')
const status = ref<number | undefined>()
const loading = ref(false)

const plans = ref<Plan[]>([])
const features = ref<PlanFeature[]>([])

const current = ref<TenantRow | null>(null)
const planDialog = ref(false)
const planForm = reactive<{ plan_id?: number; plan_expire_at?: string }>({})
const featDialog = ref(false)
const featForm = reactive<{ extra_features: string[] }>({ extra_features: [] })
const quickDialog = ref(false)
const quickForm = reactive<{ storefront_quick_entries: StorefrontQuickEntry[] }>({ storefront_quick_entries: [] })

const planMap = computed(() => {
  const m = new Map<number, string>()
  for (const p of plans.value) m.set(p.id, p.name)
  return m
})
function planName(id: number) {
  return planMap.value.get(id) || `未找到套餐 #${id}`
}

const featOptions = computed(() => {
  const own = new Set<string>()
  if (current.value) {
    const p = plans.value.find((x) => x.id === current.value!.plan_id)
    if (p) for (const f of p.features || []) own.add(f)
  }
  return features.value
    .filter((f) => f.status === 1 && !own.has(f.code))
    .map((f) => ({ key: f.code, label: `${f.name}（${f.code}）` }))
})

const storefrontPathOptions = [
  { label: '首页', value: '/' },
  { label: '全部商品', value: '/catalog' },
  { label: '热卖商品页', value: '/catalog?source=hot' },
  { label: '领券中心', value: '/coupons' },
  { label: '购物车', value: '/cart' },
  { label: '订单列表', value: '/orders' },
  { label: '会员中心', value: '/profile' },
  { label: '登录页', value: '/login' },
]

function newQuickEntry(): StorefrontQuickEntry {
  return { title: '', subtitle: '', path: '/catalog' }
}

async function load() {
  loading.value = true
  try {
    const resp = await listTenants({
      page: page.value,
      size: size.value,
      keyword: keyword.value,
      status: status.value,
    })
    rows.value = resp.list
    total.value = resp.total
  } finally {
    loading.value = false
  }
}

async function loadMeta() {
  try {
    const [ps, fs] = await Promise.all([listPlans(), listFeatures()])
    plans.value = ps || []
    features.value = fs || []
  } catch {
    plans.value = []
    features.value = []
  }
}

function statusLabel(s: number) {
  return s === 0 ? '待审核' : s === 1 ? '正常' : s === 2 ? '欠费' : s === 3 ? '封禁' : '-'
}
function tagType(s: number): 'warning' | 'success' | 'danger' | 'info' {
  return s === 0 ? 'warning' : s === 1 ? 'success' : s === 2 ? 'info' : 'danger'
}
function formatDate(s?: string) {
  if (!s) return '-'
  return s.replace('T', ' ').slice(0, 19)
}
function isExpired(s?: string) {
  if (!s) return false
  return new Date(s).getTime() < Date.now()
}

async function audit(row: TenantRow, approve: boolean) {
  let reason = ''
  if (!approve) {
    const r = await ElMessageBox.prompt('请输入拒绝理由', '租户审核', {
      inputPattern: /.+/,
      inputErrorMessage: '不能为空',
    }).catch(() => null)
    if (!r) return
    reason = r.value
  }
  await auditTenant(row.id, approve, reason)
  ElMessage.success(approve ? '已通过' : '已拒绝')
  load()
}

async function toggleBan(row: TenantRow, ban: boolean) {
  let reason = ''
  if (ban) {
    const r = await ElMessageBox.prompt('请输入封禁原因', '封禁租户', {
      inputPattern: /.+/,
      inputErrorMessage: '不能为空',
      confirmButtonText: '确认封禁',
      confirmButtonClass: 'el-button--danger',
    }).catch(() => null)
    if (!r) return
    reason = r.value
  } else {
    const ok = await ElMessageBox.confirm(
      `确认恢复租户「${row.company_name}」为正常状态？`,
      '恢复租户',
      { type: 'warning' },
    ).catch(() => null)
    if (!ok) return
  }
  await updateTenantStatus(row.id, ban ? 3 : 1, reason)
  ElMessage.success(ban ? '已封禁' : '已恢复')
  load()
}

function openPlan(row: TenantRow) {
  current.value = row
  planForm.plan_id = row.plan_id
  planForm.plan_expire_at = undefined
  planDialog.value = true
}

async function submitPlan() {
  if (!current.value || !planForm.plan_id) return ElMessage.warning('请选择套餐')
  await updateTenantPlan(current.value.id, planForm.plan_id, planForm.plan_expire_at)
  ElMessage.success('已更新')
  planDialog.value = false
  load()
}

function openFeatures(row: TenantRow) {
  current.value = row
  featForm.extra_features = [...(row.extra_features || [])]
  featDialog.value = true
}

async function submitFeatures() {
  if (!current.value) return
  await updateTenantFeatures(current.value.id, featForm.extra_features)
  ElMessage.success('已更新')
  featDialog.value = false
  load()
}

async function openQuickEntries(row: TenantRow) {
  current.value = row
  const data = await getTenantQuickEntries(row.id)
  quickForm.storefront_quick_entries = (data.storefront_quick_entries || []).map((item) => ({ ...item }))
  quickDialog.value = true
}

function addQuickEntry() {
  quickForm.storefront_quick_entries.push(newQuickEntry())
}

function removeQuickEntry(index: number) {
  quickForm.storefront_quick_entries.splice(index, 1)
}

async function submitQuickEntries() {
  if (!current.value) return
  await updateTenantQuickEntries(
    current.value.id,
    quickForm.storefront_quick_entries.filter((item) => item.title.trim()),
  )
  ElMessage.success('快捷入口已更新')
  quickDialog.value = false
}

onMounted(() => {
  loadMeta()
  load()
})
</script>

<style scoped>
.toolbar { display: flex; gap: 8px; margin-bottom: 12px; }
.pager { margin-top: 12px; justify-content: flex-end; display: flex; }
.expired { color: #f56c6c; }
.config-list { display: grid; gap: 16px; }
.config-card {
  padding: 16px;
  border: 1px solid var(--el-border-color-light);
  border-radius: 12px;
  background: var(--el-fill-color-blank);
}
.config-card__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}
</style>
