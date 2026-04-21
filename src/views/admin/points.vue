<script setup lang="ts">
import { getPointsSettings, updatePointsSettings, type PointsSetting } from '@/api/points'
import { ElMessage } from 'element-plus'
import { onMounted, ref } from 'vue'

const form = ref<PointsSetting>({
  enabled: 1,
  earn_rate: 1,
  min_amount: 0,
  redeem_rate: 100,
  remark: ''
})
const loading = ref(false)
const saving = ref(false)
const featureDisabled = ref(false)
const featureMsg = ref('')

async function load() {
  loading.value = true
  try {
    const data = await getPointsSettings()
    form.value = {
      enabled: data.enabled ?? 1,
      earn_rate: data.earn_rate ?? 1,
      min_amount: data.min_amount ?? 0,
      redeem_rate: data.redeem_rate ?? 100,
      remark: data.remark ?? ''
    }
    featureDisabled.value = false
  } catch (e: any) {
    if (e?.code === 30004) {
      featureDisabled.value = true
      featureMsg.value = e.message || '当前套餐未开通积分功能'
    } else {
      ElMessage.error(e?.message || '加载失败')
    }
  } finally {
    loading.value = false
  }
}

async function save() {
  saving.value = true
  try {
    await updatePointsSettings({
      enabled: Number(form.value.enabled),
      earn_rate: form.value.earn_rate,
      min_amount: form.value.min_amount,
      redeem_rate: Number(form.value.redeem_rate),
      remark: form.value.remark
    })
    ElMessage.success('已保存')
    load()
  } catch (e: any) {
    if (e?.code === 30004) {
      featureDisabled.value = true
      featureMsg.value = e.message || '当前套餐未开通积分功能'
    } else {
      ElMessage.error(e?.message || '保存失败')
    }
  } finally {
    saving.value = false
  }
}

onMounted(load)
</script>

<template>
  <div class="points-page">
    <el-card shadow="never">
      <template #header>
        <div class="card-header">
          <span>积分规则</span>
        </div>
      </template>

      <el-alert
        v-if="featureDisabled"
        type="warning"
        show-icon
        :closable="false"
        :title="'当前套餐未开通「积分」功能'"
        :description="featureMsg"
        style="margin-bottom: 16px"
      />

      <el-form :model="form" label-width="140px" v-loading="loading" :disabled="featureDisabled">
        <el-form-item label="启用积分">
          <el-switch
            v-model="form.enabled"
            :active-value="1"
            :inactive-value="0"
          />
        </el-form-item>
        <el-form-item label="积分发放比例">
          <el-input-number v-model="form.earn_rate as any" :min="0" :step="0.1" :precision="4" />
          <span style="margin-left: 8px; color: #909399">每消费 1 元获得的积分数</span>
        </el-form-item>
        <el-form-item label="发放门槛(元)">
          <el-input-number v-model="form.min_amount as any" :min="0" :step="1" :precision="2" />
          <span style="margin-left: 8px; color: #909399">订单实付金额不低于该值才发放</span>
        </el-form-item>
        <el-form-item label="抵扣比例">
          <el-input-number v-model="form.redeem_rate" :min="1" :step="1" :precision="0" />
          <span style="margin-left: 8px; color: #909399">N 积分抵扣 1 元</span>
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="form.remark" type="textarea" :rows="3" maxlength="500" show-word-limit />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :loading="saving" :disabled="featureDisabled" @click="save">保存</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<style scoped>
.points-page { padding: 16px; }
.card-header { display: flex; align-items: center; }
</style>
