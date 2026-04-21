<script setup lang="ts">
import {
    createMemberLevel,
    deleteMemberLevel,
    listMemberLevels,
    updateMemberLevel,
    type MemberLevel,
} from '@/api/memberLevel'
import { ElMessage, ElMessageBox } from 'element-plus'
import { onMounted, reactive, ref } from 'vue'

const loading = ref(false)
const list = ref<MemberLevel[]>([])
const dialog = ref(false)
const editing = ref<MemberLevel | null>(null)
const featureDisabled = ref(false)

const form = reactive<Partial<MemberLevel>>({
  name: '', icon: '', color: '#409EFF',
  min_growth: 0, discount_rate: 100, points_mult: 1, sort: 0,
})

async function load() {
  loading.value = true
  featureDisabled.value = false
  try {
    list.value = await listMemberLevels()
  } catch (e: any) {
    // 30004 = 当前套餐未开通该功能
    if (e?.code === 30004) featureDisabled.value = true
  } finally { loading.value = false }
}

function openCreate() {
  editing.value = null
  Object.assign(form, { name:'', icon:'', color:'#409EFF', min_growth:0, discount_rate:100, points_mult:1, sort:0 })
  dialog.value = true
}

function openEdit(row: MemberLevel) {
  editing.value = row
  Object.assign(form, {
    name: row.name, icon: row.icon || '', color: row.color || '#409EFF',
    min_growth: row.min_growth,
    discount_rate: Number(row.discount_rate),
    points_mult: Number(row.points_mult),
    sort: row.sort,
  })
  dialog.value = true
}

async function submit() {
  if (!form.name) return ElMessage.warning('请填写等级名称')
  const body = {
    ...form,
    discount_rate: Number(form.discount_rate),
    points_mult: Number(form.points_mult),
  }
  try {
    if (editing.value) {
      await updateMemberLevel(editing.value.id, body)
      ElMessage.success('已更新')
    } else {
      await createMemberLevel(body)
      ElMessage.success('已创建')
    }
    dialog.value = false
    await load()
  } catch (e: any) {
    ElMessage.error(e?.message || '保存失败')
  }
}

async function remove(row: MemberLevel) {
  await ElMessageBox.confirm(`确认删除等级「${row.name}」？`, '提示', { type: 'warning' })
  await deleteMemberLevel(row.id)
  ElMessage.success('已删除')
  await load()
}

onMounted(load)
</script>

<template>
  <div class="page">
    <div class="toolbar">
      <h3>会员等级</h3>
      <el-button type="primary" :disabled="featureDisabled" @click="openCreate">新增等级</el-button>
    </div>

    <el-alert v-if="featureDisabled" type="warning" :closable="false" show-icon
      title="当前套餐未开通「会员等级」功能"
      description="请联系平台管理员升级套餐，或在平台后台为您的套餐勾选 member_level 功能。" />

    <el-alert v-else type="info" :closable="false" show-icon style="margin-bottom:12px"
      title="会员会根据累计成长值自动升到不超过其成长值的最高等级；折扣率 100 表示不打折，80 表示 8 折；积分倍率 1 表示原倍。" />

    <el-table v-if="!featureDisabled" v-loading="loading" :data="list" border stripe>
      <el-table-column label="排序" prop="sort" width="70" />
      <el-table-column label="等级名称" width="140">
        <template #default="{ row }">
          <el-tag :color="row.color" effect="dark" disable-transitions>{{ row.name }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="成长值门槛" prop="min_growth" width="110" />
      <el-table-column label="折扣率(%)" width="110">
        <template #default="{ row }">{{ Number(row.discount_rate) }}</template>
      </el-table-column>
      <el-table-column label="积分倍率" width="100">
        <template #default="{ row }">× {{ Number(row.points_mult) }}</template>
      </el-table-column>
      <el-table-column label="颜色" prop="color" width="110" />
      <el-table-column label="图标URL" prop="icon" show-overflow-tooltip />
      <el-table-column label="操作" width="160" fixed="right">
        <template #default="{ row }">
          <el-button size="small" @click="openEdit(row)">编辑</el-button>
          <el-button size="small" type="danger" @click="remove(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog v-model="dialog" :title="editing ? '编辑等级' : '新增等级'" width="520px">
      <el-form :model="form" label-width="110px">
        <el-form-item label="名称" required>
          <el-input v-model="form.name" maxlength="30" placeholder="如 普通/白银/黄金" />
        </el-form-item>
        <el-form-item label="成长值门槛">
          <el-input-number v-model="form.min_growth as any" :min="0" style="width:200px" />
          <div class="help">累计成长值 ≥ 该值即可升至此等级</div>
        </el-form-item>
        <el-form-item label="折扣率 (%)">
          <el-input-number v-model="form.discount_rate as any" :min="1" :max="100" :precision="2" style="width:200px" />
          <div class="help">100 = 不打折，80 = 8 折</div>
        </el-form-item>
        <el-form-item label="积分倍率">
          <el-input-number v-model="form.points_mult as any" :min="0" :max="9.99" :step="0.1" :precision="2" style="width:200px" />
        </el-form-item>
        <el-form-item label="标识色">
          <el-color-picker v-model="form.color as any" />
        </el-form-item>
        <el-form-item label="图标URL">
          <el-input v-model="form.icon" placeholder="可选" />
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="form.sort as any" :min="0" style="width:200px" />
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
.toolbar { display:flex; justify-content:space-between; align-items:center; margin-bottom: 12px; }
.toolbar h3 { margin: 0; }
.help { color: #909399; font-size: 12px; margin-top: 2px; }
</style>
