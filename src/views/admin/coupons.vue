<script setup lang="ts">
import {
    createCoupon,
    deleteCoupon,
    listCoupons,
    updateCoupon,
    type Coupon, type CouponType,
} from '@/api/coupon'
import { ElMessage, ElMessageBox } from 'element-plus'
import { computed, onMounted, reactive, ref } from 'vue'

const loading = ref(false)
const list = ref<Coupon[]>([])
const dialog = ref(false)
const editing = ref<Coupon | null>(null)
const featureDisabled = ref(false)

interface FormState {
  name: string
  type: CouponType
  threshold_amount: string
  discount_value: string
  max_discount: string
  total_count: number
  per_limit: number
  receive_range: [string, string] | null
  valid_range: [string, string] | null
  valid_days: number
  status: number
}

const form = reactive<FormState>({
  name: '', type: 'cash', threshold_amount: '', discount_value: '10',
  max_discount: '', total_count: 100, per_limit: 1,
  receive_range: null, valid_range: null, valid_days: 30, status: 1,
})

const typeLabel = (t: CouponType) =>
  t === 'cash' ? '现金券' : t === 'discount' ? '折扣券' : '免邮券'

const typeTagType = (t: CouponType): 'success' | 'warning' | 'info' =>
  t === 'cash' ? 'success' : t === 'discount' ? 'warning' : 'info'

function discountLabel(row: Coupon): string {
  const v = Number(row.discount_value)
  if (row.type === 'cash') return `减 ¥${v.toFixed(2)}`
  if (row.type === 'discount') return `打 ${v}%`
  return '免邮'
}

async function load() {
  loading.value = true
  featureDisabled.value = false
  try {
    list.value = await listCoupons()
  } catch (e: any) {
    if (e?.code === 30004) featureDisabled.value = true
  } finally { loading.value = false }
}

function resetForm() {
  Object.assign(form, {
    name: '', type: 'cash', threshold_amount: '', discount_value: '10',
    max_discount: '', total_count: 100, per_limit: 1,
    receive_range: null, valid_range: null, valid_days: 30, status: 1,
  })
}

function openCreate() {
  editing.value = null
  resetForm()
  dialog.value = true
}

function openEdit(row: Coupon) {
  editing.value = row
  Object.assign(form, {
    name: row.name,
    type: row.type,
    threshold_amount: row.threshold_amount != null ? String(row.threshold_amount) : '',
    discount_value: String(row.discount_value),
    max_discount: row.max_discount != null ? String(row.max_discount) : '',
    total_count: row.total_count,
    per_limit: row.per_limit,
    receive_range: row.receive_start_at && row.receive_end_at ? [row.receive_start_at, row.receive_end_at] : null,
    valid_range: row.valid_start_at && row.valid_end_at ? [row.valid_start_at, row.valid_end_at] : null,
    valid_days: row.valid_days,
    status: row.status,
  })
  dialog.value = true
}

async function submit() {
  if (!form.name) return ElMessage.warning('请填写优惠券名称')
  if (Number(form.discount_value) <= 0) return ElMessage.warning('优惠值必须大于 0')
  if (form.total_count < 0) return ElMessage.warning('总数量不能为负')

  const body: any = {
    name: form.name,
    type: form.type,
    threshold_amount: form.threshold_amount ? Number(form.threshold_amount) : null,
    discount_value: Number(form.discount_value),
    max_discount: form.max_discount ? Number(form.max_discount) : null,
    total_count: form.total_count,
    per_limit: form.per_limit,
    receive_start_at: form.receive_range?.[0] || null,
    receive_end_at: form.receive_range?.[1] || null,
    valid_start_at: form.valid_range?.[0] || null,
    valid_end_at: form.valid_range?.[1] || null,
    valid_days: form.valid_days,
    applicable_type: 'all',
    status: form.status,
  }
  try {
    if (editing.value) {
      await updateCoupon(editing.value.id, body)
      ElMessage.success('已更新')
    } else {
      await createCoupon(body)
      ElMessage.success('已创建')
    }
    dialog.value = false
    await load()
  } catch (e: any) {
    if (e?.code === 30004) featureDisabled.value = true
    else ElMessage.error(e?.message || '保存失败')
  }
}

async function onDelete(row: Coupon) {
  try {
    await ElMessageBox.confirm(`确认删除优惠券「${row.name}」？`, '提示', { type: 'warning' })
  } catch { return }
  try {
    await deleteCoupon(row.id)
    ElMessage.success('已删除')
    await load()
  } catch (e: any) {
    ElMessage.error(e?.message || '删除失败')
  }
}

const showMaxDiscount = computed(() => form.type === 'discount')
onMounted(load)
</script>

<template>
  <div class="page">
    <el-alert v-if="featureDisabled" type="warning" show-icon :closable="false" class="mb-16"
      title="当前套餐未开通「优惠券」功能" description="请联系平台管理员升级套餐以使用该功能。" />

    <el-card>
      <div class="toolbar">
        <el-button type="primary" :disabled="featureDisabled" @click="openCreate">新建优惠券</el-button>
      </div>
      <el-table v-loading="loading" :data="list" border stripe>
        <el-table-column prop="id" label="ID" width="70" />
        <el-table-column prop="name" label="名称" min-width="140" />
        <el-table-column label="类型" width="100">
          <template #default="{ row }">
            <el-tag :type="typeTagType(row.type)" size="small">{{ typeLabel(row.type) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="优惠" width="140">
          <template #default="{ row }">{{ discountLabel(row) }}</template>
        </el-table-column>
        <el-table-column label="门槛" width="120">
          <template #default="{ row }">
            <span v-if="row.threshold_amount">满 ¥{{ Number(row.threshold_amount).toFixed(2) }}</span>
            <span v-else style="color:#bbb">无</span>
          </template>
        </el-table-column>
        <el-table-column label="数量" width="120">
          <template #default="{ row }">{{ row.remain_count }} / {{ row.total_count }}</template>
        </el-table-column>
        <el-table-column label="状态" width="90">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'info'" size="small">
              {{ row.status === 1 ? '启用' : '停用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="openEdit(row)">编辑</el-button>
            <el-button size="small" type="danger" @click="onDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="dialog" :title="editing ? '编辑优惠券' : '新建优惠券'" width="640">
      <el-form :model="form" label-width="120px">
        <el-form-item label="名称">
          <el-input v-model="form.name" maxlength="50" show-word-limit placeholder="例：新人立减 10 元" />
        </el-form-item>
        <el-form-item label="类型">
          <el-radio-group v-model="form.type">
            <el-radio value="cash">现金券</el-radio>
            <el-radio value="discount">折扣券</el-radio>
            <el-radio value="shipping">免邮券</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item :label="form.type === 'discount' ? '折扣（%)' : '优惠金额'">
          <el-input v-model="form.discount_value">
            <template v-if="form.type !== 'discount'" #prepend>¥</template>
            <template v-if="form.type === 'discount'" #append>%</template>
          </el-input>
        </el-form-item>
        <el-form-item v-if="showMaxDiscount" label="最高抵扣">
          <el-input v-model="form.max_discount" placeholder="折扣券最高可抵扣金额">
            <template #prepend>¥</template>
          </el-input>
        </el-form-item>
        <el-form-item label="满减门槛">
          <el-input v-model="form.threshold_amount" placeholder="订单满多少可用，留空则无门槛">
            <template #prepend>¥</template>
          </el-input>
        </el-form-item>
        <el-form-item label="总数量">
          <el-input-number v-model="form.total_count" :min="0" :max="999999" />
        </el-form-item>
        <el-form-item label="每人限领">
          <el-input-number v-model="form.per_limit" :min="1" :max="99" />
        </el-form-item>
        <el-form-item label="领取时间段">
          <el-date-picker v-model="form.receive_range" type="datetimerange" value-format="YYYY-MM-DDTHH:mm:ss"
            range-separator="至" start-placeholder="开始" end-placeholder="结束" />
        </el-form-item>
        <el-form-item label="使用时间段">
          <el-date-picker v-model="form.valid_range" type="datetimerange" value-format="YYYY-MM-DDTHH:mm:ss"
            range-separator="至" start-placeholder="开始" end-placeholder="结束" />
          <span class="hint">若留空则使用“领取后有效天数”</span>
        </el-form-item>
        <el-form-item label="有效天数">
          <el-input-number v-model="form.valid_days" :min="0" :max="3650" />
          <span class="hint">领取后 N 天内有效（使用时间段为空时生效）</span>
        </el-form-item>
        <el-form-item label="状态">
          <el-switch v-model="form.status" :active-value="1" :inactive-value="0" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialog = false">取消</el-button>
        <el-button type="primary" @click="submit">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.page { padding: 16px; }
.toolbar { margin-bottom: 12px; }
.mb-16 { margin-bottom: 16px; }
.hint { color:#909399; font-size:12px; margin-left:8px; }
</style>
