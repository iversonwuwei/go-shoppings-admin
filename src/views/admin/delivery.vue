<template>
  <div class="page">
    <el-alert
      v-if="featureDisabled"
      type="warning"
      show-icon
      :closable="false"
      title="当前套餐未开通「配送管理」相关功能"
      description="快递配送 / 同城配送 / 到店自提 未包含时，对应区块将不可保存。"
      style="margin-bottom: 16px"
    />

    <el-tabs v-model="activeTab">
      <!-- 快递配送 -->
      <el-tab-pane label="快递配送" name="express">
        <el-form :model="form" label-width="160px" style="max-width: 640px">
          <el-form-item label="启用快递">
            <el-switch v-model="form.express_enabled" :active-value="1" :inactive-value="0" />
          </el-form-item>
          <el-form-item label="默认运费(元)">
            <el-input-number v-model="form.express_default_fee" :min="0" :precision="2" :step="1" />
          </el-form-item>
          <el-form-item label="满额包邮(元)">
            <el-input-number v-model="form.express_free_amount" :min="0" :precision="2" :step="10" />
            <div class="tip">0 表示关闭</div>
          </el-form-item>
        </el-form>
      </el-tab-pane>

      <!-- 同城配送 -->
      <el-tab-pane label="同城配送" name="city">
        <el-form :model="form" label-width="160px" style="max-width: 640px">
          <el-form-item label="启用同城配送">
            <el-switch v-model="form.city_enabled" :active-value="1" :inactive-value="0" />
          </el-form-item>
          <el-form-item label="配送半径(km)">
            <el-input-number v-model="form.city_radius_km" :min="0" :precision="2" :step="1" />
          </el-form-item>
          <el-form-item label="起步价(元)">
            <el-input-number v-model="form.city_base_fee" :min="0" :precision="2" :step="1" />
          </el-form-item>
          <el-form-item label="每公里加价(元)">
            <el-input-number v-model="form.city_per_km_fee" :min="0" :precision="2" :step="0.5" />
          </el-form-item>
          <el-form-item label="起送价(元)">
            <el-input-number v-model="form.city_min_order" :min="0" :precision="2" :step="10" />
          </el-form-item>
        </el-form>
      </el-tab-pane>

      <!-- 到店自提 -->
      <el-tab-pane label="到店自提" name="pickup">
        <el-form :model="form" label-width="160px" style="max-width: 640px">
          <el-form-item label="启用到店自提">
            <el-switch v-model="form.pickup_enabled" :active-value="1" :inactive-value="0" />
          </el-form-item>
          <el-form-item label="自提地址">
            <el-input v-model="form.pickup_address" />
          </el-form-item>
          <el-form-item label="营业时间">
            <el-input v-model="form.pickup_hours" placeholder="如：09:00-22:00" />
          </el-form-item>
          <el-form-item label="联系电话">
            <el-input v-model="form.pickup_phone" />
          </el-form-item>
        </el-form>
      </el-tab-pane>
    </el-tabs>

    <el-form-item label=" " label-width="160px">
      <el-input
        v-model="form.remark"
        type="textarea"
        :rows="2"
        placeholder="备注说明（内部可见）"
        maxlength="500"
        show-word-limit
        style="max-width: 640px"
      />
    </el-form-item>

    <div style="margin-top: 12px; padding-left: 160px">
      <el-button type="primary" @click="onSave">保存</el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { getDeliverySettings, updateDeliverySettings, type DeliverySettings } from '@/api/delivery'
import { ElMessage } from 'element-plus'
import { onMounted, reactive, ref } from 'vue'

const activeTab = ref('express')
const featureDisabled = ref(false)

const form = reactive<DeliverySettings>({
  express_enabled: 1,
  express_free_amount: 0,
  express_default_fee: 0,
  city_enabled: 0,
  city_radius_km: 5,
  city_base_fee: 5,
  city_per_km_fee: 1,
  city_min_order: 0,
  pickup_enabled: 0,
  pickup_address: '',
  pickup_hours: '',
  pickup_phone: '',
  remark: '',
})

function isDisabledErr(e: unknown): boolean {
  const err = e as { code?: number }
  return !!err && err.code === 30004
}

function coerceNumbers(d: any) {
  const keys = [
    'express_free_amount',
    'express_default_fee',
    'city_radius_km',
    'city_base_fee',
    'city_per_km_fee',
    'city_min_order',
  ]
  keys.forEach((k) => {
    if (d && d[k] !== undefined && d[k] !== null) d[k] = Number(d[k])
  })
  return d
}

async function load() {
  try {
    const data = await getDeliverySettings()
    Object.assign(form, coerceNumbers(data))
  } catch (e) {
    if (isDisabledErr(e)) featureDisabled.value = true
  }
}

async function onSave() {
  try {
    const data = await updateDeliverySettings({ ...form })
    Object.assign(form, coerceNumbers(data))
    ElMessage.success('已保存')
  } catch (e) {
    if (isDisabledErr(e)) featureDisabled.value = true
  }
}

onMounted(load)
</script>

<style scoped>
.page {
  padding: 16px;
}
.tip {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}
</style>
