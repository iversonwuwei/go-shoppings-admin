<script setup lang="ts">
import {
    auditDistributor,
    getDistributionSettings,
    listCommissions,
    listDistributors,
    updateDistributionSettings,
    type CommissionLog,
    type DistributionSettings, type Distributor,
} from '@/api/distribution'
import { ElMessage } from 'element-plus'
import { onMounted, ref } from 'vue'

const tab = ref('settings')
const featureDisabled = ref(false)
const featureMsg = ref('')

// ----- Settings -----
const settings = ref<DistributionSettings>({
  enabled: 1, level1_rate: 0.10, level2_rate: 0.05,
  min_withdraw: 10, auto_become: 0, remark: '',
})
const loadingS = ref(false)
const savingS = ref(false)

async function loadSettings() {
  loadingS.value = true
  try {
    const data = await getDistributionSettings()
    settings.value = {
      enabled: data.enabled ?? 1,
      level1_rate: data.level1_rate ?? 0.10,
      level2_rate: data.level2_rate ?? 0.05,
      min_withdraw: data.min_withdraw ?? 10,
      auto_become: data.auto_become ?? 0,
      remark: data.remark ?? '',
    }
    featureDisabled.value = false
  } catch (e: any) {
    if (e?.code === 30004) {
      featureDisabled.value = true
      featureMsg.value = e.message || '当前套餐未开通分销功能'
    } else {
      ElMessage.error(e?.message || '加载失败')
    }
  } finally { loadingS.value = false }
}

async function saveSettings() {
  savingS.value = true
  try {
    await updateDistributionSettings({
      enabled: Number(settings.value.enabled),
      level1_rate: settings.value.level1_rate,
      level2_rate: settings.value.level2_rate,
      min_withdraw: settings.value.min_withdraw,
      auto_become: Number(settings.value.auto_become),
      remark: settings.value.remark,
    })
    ElMessage.success('已保存')
  } catch (e: any) {
    ElMessage.error(e?.message || '保存失败')
  } finally { savingS.value = false }
}

// ----- Distributors -----
const dList = ref<Distributor[]>([])
const dTotal = ref(0)
const dPage = ref(1)
const dSize = ref(20)
const dStatus = ref<number | ''>('')
const dLoading = ref(false)

async function loadDistributors() {
  dLoading.value = true
  try {
    const params: any = { page: dPage.value, size: dSize.value }
    if (dStatus.value !== '') params.status = dStatus.value
    const res = await listDistributors(params)
    dList.value = res.list
    dTotal.value = res.total
  } catch (e: any) {
    if (e?.code === 30004) { featureDisabled.value = true; featureMsg.value = e.message || '' }
    else ElMessage.error(e?.message || '加载失败')
  } finally { dLoading.value = false }
}

async function approve(row: Distributor) {
  try { await auditDistributor(row.id, 1); ElMessage.success('已通过'); loadDistributors() }
  catch (e: any) { ElMessage.error(e?.message || '操作失败') }
}
async function freeze(row: Distributor) {
  try { await auditDistributor(row.id, 2); ElMessage.success('已冻结'); loadDistributors() }
  catch (e: any) { ElMessage.error(e?.message || '操作失败') }
}

// ----- Commissions -----
const cList = ref<CommissionLog[]>([])
const cTotal = ref(0)
const cPage = ref(1)
const cSize = ref(20)
const cDistributorID = ref<number | null>(null)
const cLoading = ref(false)

async function loadCommissions() {
  cLoading.value = true
  try {
    const params: any = { page: cPage.value, size: cSize.value }
    if (cDistributorID.value) params.distributor_id = cDistributorID.value
    const res = await listCommissions(params)
    cList.value = res.list
    cTotal.value = res.total
  } catch (e: any) {
    if (e?.code === 30004) { featureDisabled.value = true; featureMsg.value = e.message || '' }
    else ElMessage.error(e?.message || '加载失败')
  } finally { cLoading.value = false }
}

function statusText(s: number) {
  return s === 0 ? '待审核' : s === 1 ? '正常' : s === 2 ? '冻结' : String(s)
}
function statusTag(s: number) {
  return s === 0 ? 'warning' : s === 1 ? 'success' : 'danger'
}
function commStatusText(s: number) {
  return s === 1 ? '待结算' : s === 2 ? '已结算' : s === 3 ? '已取消' : String(s)
}

function onTabChange(name: string | number) {
  const n = String(name)
  if (n === 'settings') loadSettings()
  else if (n === 'distributors') loadDistributors()
  else if (n === 'commissions') loadCommissions()
}

onMounted(loadSettings)
</script>

<template>
  <div class="distribution-page">
    <el-alert
      v-if="featureDisabled"
      type="warning"
      show-icon
      :closable="false"
      title="当前套餐未开通「分销」功能"
      :description="featureMsg"
      style="margin: 16px"
    />

    <el-tabs v-model="tab" class="tabs" @tab-change="onTabChange">
      <el-tab-pane label="分销规则" name="settings">
        <el-card shadow="never">
          <el-form :model="settings" label-width="140px" v-loading="loadingS" :disabled="featureDisabled">
            <el-form-item label="启用分销">
              <el-switch v-model="settings.enabled" :active-value="1" :inactive-value="0" />
            </el-form-item>
            <el-form-item label="一级佣金比例">
              <el-input-number v-model="settings.level1_rate as any" :min="0" :max="1" :step="0.01" :precision="4" />
              <span style="margin-left:8px;color:#909399">如 0.10 表示 10%</span>
            </el-form-item>
            <el-form-item label="二级佣金比例">
              <el-input-number v-model="settings.level2_rate as any" :min="0" :max="1" :step="0.01" :precision="4" />
            </el-form-item>
            <el-form-item label="最低提现金额">
              <el-input-number v-model="settings.min_withdraw as any" :min="0" :step="1" :precision="2" />
              <span style="margin-left:8px;color:#909399">元</span>
            </el-form-item>
            <el-form-item label="自动成为分销员">
              <el-switch v-model="settings.auto_become" :active-value="1" :inactive-value="0" />
              <span style="margin-left:8px;color:#909399">开启则首次下单后自动成为，关闭则需人工审核</span>
            </el-form-item>
            <el-form-item label="备注">
              <el-input v-model="settings.remark" type="textarea" :rows="3" maxlength="500" show-word-limit />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" :loading="savingS" :disabled="featureDisabled" @click="saveSettings">保存</el-button>
            </el-form-item>
          </el-form>
        </el-card>
      </el-tab-pane>

      <el-tab-pane label="分销员列表" name="distributors">
        <el-card shadow="never">
          <div style="margin-bottom:12px">
            <el-select v-model="dStatus" placeholder="状态筛选" clearable style="width:160px" @change="() => { dPage = 1; loadDistributors() }">
              <el-option label="全部" :value="''" />
              <el-option label="待审核" :value="0" />
              <el-option label="正常" :value="1" />
              <el-option label="冻结" :value="2" />
            </el-select>
          </div>
          <el-table v-loading="dLoading" :data="dList" border stripe>
            <el-table-column prop="id" label="ID" width="80" />
            <el-table-column prop="member_id" label="会员ID" width="100" />
            <el-table-column prop="parent_id" label="上级" width="90" />
            <el-table-column prop="invite_count" label="邀请数" width="90" />
            <el-table-column prop="total_commission" label="累计佣金" width="120" />
            <el-table-column prop="pending_commission" label="待结算" width="120" />
            <el-table-column prop="withdrawn" label="已提现" width="120" />
            <el-table-column label="状态" width="100">
              <template #default="{ row }">
                <el-tag :type="statusTag(row.status)">{{ statusText(row.status) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="created_at" label="申请时间" width="180" />
            <el-table-column label="操作" width="180" fixed="right">
              <template #default="{ row }">
                <el-button v-if="row.status === 0" link type="primary" :disabled="featureDisabled" @click="approve(row)">审核通过</el-button>
                <el-button v-if="row.status === 1" link type="danger" :disabled="featureDisabled" @click="freeze(row)">冻结</el-button>
                <el-button v-if="row.status === 2" link type="primary" :disabled="featureDisabled" @click="approve(row)">解冻</el-button>
              </template>
            </el-table-column>
          </el-table>
          <el-pagination
            style="margin-top:16px;justify-content:flex-end;display:flex"
            v-model:current-page="dPage"
            v-model:page-size="dSize"
            :total="dTotal"
            :page-sizes="[10,20,50,100]"
            layout="total, sizes, prev, pager, next, jumper"
            @size-change="loadDistributors"
            @current-change="loadDistributors"
          />
        </el-card>
      </el-tab-pane>

      <el-tab-pane label="佣金记录" name="commissions">
        <el-card shadow="never">
          <div style="margin-bottom:12px;display:flex;gap:8px">
            <el-input-number v-model="cDistributorID as any" :min="0" placeholder="分销员ID" />
            <el-button @click="() => { cPage = 1; loadCommissions() }">查询</el-button>
          </div>
          <el-table v-loading="cLoading" :data="cList" border stripe>
            <el-table-column prop="id" label="ID" width="80" />
            <el-table-column prop="distributor_id" label="分销员" width="100" />
            <el-table-column prop="member_id" label="会员" width="90" />
            <el-table-column prop="order_no" label="订单号" width="200" />
            <el-table-column prop="buyer_id" label="买家" width="90" />
            <el-table-column label="层级" width="80">
              <template #default="{ row }">
                <el-tag size="small" :type="row.level === 1 ? 'primary' : 'info'">
                  {{ row.level === 1 ? '直推' : '间推' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="rate" label="佣金率" width="100" />
            <el-table-column prop="amount" label="佣金金额" width="120" />
            <el-table-column label="状态" width="100">
              <template #default="{ row }">{{ commStatusText(row.status) }}</template>
            </el-table-column>
            <el-table-column prop="created_at" label="创建时间" width="180" />
          </el-table>
          <el-pagination
            style="margin-top:16px;justify-content:flex-end;display:flex"
            v-model:current-page="cPage"
            v-model:page-size="cSize"
            :total="cTotal"
            :page-sizes="[10,20,50,100]"
            layout="total, sizes, prev, pager, next, jumper"
            @size-change="loadCommissions"
            @current-change="loadCommissions"
          />
        </el-card>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<style scoped>
.distribution-page { padding: 16px; }
.tabs :deep(.el-tabs__nav-wrap) { padding: 0 8px; }
</style>
