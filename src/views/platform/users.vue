<template>
  <div class="users-page">
    <el-card shadow="never">
      <template #header>
        <div class="flex-between">
          <span>平台用户</span>
          <div>
            <el-input
              v-model="keyword"
              placeholder="用户名 / 姓名 / 手机号"
              style="width: 220px; margin-right: 8px"
              clearable
              @keyup.enter="load"
            />
            <el-button @click="load">查询</el-button>
            <el-button type="primary" @click="openCreate">新增用户</el-button>
          </div>
        </div>
      </template>
      <el-table :data="rows" v-loading="loading" stripe>
        <el-table-column prop="username" label="用户名" width="160" />
        <el-table-column prop="real_name" label="姓名" width="120" />
        <el-table-column prop="phone" label="手机号" width="140" />
        <el-table-column prop="email" label="邮箱" min-width="180" />
        <el-table-column label="角色" width="140">
          <template #default="{ row }">
            <el-tag :type="roleTagType(row.role)">{{ roleLabel(row.role) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="90">
          <template #default="{ row }">
            <el-tag v-if="row.status === 1" type="success">启用</el-tag>
            <el-tag v-else type="info">禁用</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="last_login_at" label="最近登录" width="170">
          <template #default="{ row }">{{ fmt(row.last_login_at) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="260">
          <template #default="{ row }">
            <el-button size="small" @click="openEdit(row)">编辑</el-button>
            <el-button size="small" @click="openReset(row)">重置密码</el-button>
            <el-popconfirm title="确定删除该用户？" @confirm="del(row)">
              <template #reference>
                <el-button size="small" type="danger">删除</el-button>
              </template>
            </el-popconfirm>
          </template>
        </el-table-column>
      </el-table>
      <el-pagination
        class="mt-16"
        layout="prev, pager, next, total"
        :total="total"
        :page-size="pageSize"
        :current-page="page"
        @current-change="onPage"
      />
    </el-card>

    <el-dialog v-model="dlg" :title="isEdit ? '编辑用户' : '新增用户'" width="520">
      <el-form :model="form" label-width="90px">
        <el-form-item label="用户名">
          <el-input v-model="form.username" :disabled="isEdit" />
        </el-form-item>
        <el-form-item v-if="!isEdit" label="密码">
          <el-input v-model="form.password" type="password" show-password />
        </el-form-item>
        <el-form-item label="姓名">
          <el-input v-model="form.real_name" />
        </el-form-item>
        <el-form-item label="手机号">
          <el-input v-model="form.phone" />
        </el-form-item>
        <el-form-item label="邮箱">
          <el-input v-model="form.email" />
        </el-form-item>
        <el-form-item label="角色">
          <el-select v-model="form.role" style="width: 100%">
            <el-option v-for="r in roles" :key="r.value" :label="r.label" :value="r.value">
              <div>
                <div>{{ r.label }}</div>
                <div style="color:#9ca3af;font-size:12px">{{ r.desc }}</div>
              </div>
            </el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-switch v-model="statusOn" active-text="启用" inactive-text="禁用" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dlg = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="save">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="resetDlg" title="重置密码" width="420">
      <el-form label-width="90px">
        <el-form-item label="用户">
          <span>{{ resetTarget?.username }}</span>
        </el-form-item>
        <el-form-item label="新密码">
          <el-input v-model="resetPwd" type="password" show-password />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="resetDlg = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="submitReset">确认</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import {
  PLATFORM_ROLES,
  createPlatformUser,
  deletePlatformUser,
  listPlatformUsers,
  resetPlatformUserPassword,
  updatePlatformUser,
  type PlatformUser,
} from '@/api/platformUsers'

const rows = ref<PlatformUser[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(20)
const loading = ref(false)
const keyword = ref('')
const roles = PLATFORM_ROLES

const dlg = ref(false)
const isEdit = ref(false)
const saving = ref(false)
const form = ref<any>({ username: '', password: '', real_name: '', phone: '', email: '', role: 'operator', status: 1 })
const statusOn = ref(true)
const editingId = ref<number | null>(null)

const resetDlg = ref(false)
const resetTarget = ref<PlatformUser | null>(null)
const resetPwd = ref('')

async function load() {
  loading.value = true
  try {
    const r = await listPlatformUsers({ keyword: keyword.value, page: page.value, page_size: pageSize.value })
    rows.value = r.list || []
    total.value = r.total || 0
  } finally {
    loading.value = false
  }
}

function onPage(p: number) {
  page.value = p
  load()
}

function openCreate() {
  isEdit.value = false
  editingId.value = null
  form.value = { username: '', password: '', real_name: '', phone: '', email: '', role: 'operator', status: 1 }
  statusOn.value = true
  dlg.value = true
}

function openEdit(row: PlatformUser) {
  isEdit.value = true
  editingId.value = row.id
  form.value = { ...row }
  statusOn.value = row.status === 1
  dlg.value = true
}

async function save() {
  saving.value = true
  try {
    const payload = { ...form.value, status: statusOn.value ? 1 : 0 }
    if (isEdit.value && editingId.value) {
      await updatePlatformUser(editingId.value, payload)
    } else {
      if (!payload.username || !payload.password) {
        ElMessage.warning('请输入用户名和密码')
        return
      }
      await createPlatformUser(payload)
    }
    ElMessage.success('已保存')
    dlg.value = false
    load()
  } finally {
    saving.value = false
  }
}

function openReset(row: PlatformUser) {
  resetTarget.value = row
  resetPwd.value = ''
  resetDlg.value = true
}

async function submitReset() {
  if (!resetTarget.value) return
  if (resetPwd.value.length < 6) {
    ElMessage.warning('密码至少 6 位')
    return
  }
  saving.value = true
  try {
    await resetPlatformUserPassword(resetTarget.value.id, resetPwd.value)
    ElMessage.success('密码已重置')
    resetDlg.value = false
  } finally {
    saving.value = false
  }
}

async function del(row: PlatformUser) {
  await deletePlatformUser(row.id)
  ElMessage.success('已删除')
  load()
}

const roleMap = computed(() => Object.fromEntries(PLATFORM_ROLES.map((r) => [r.value, r.label])))
function roleLabel(r: string) {
  return roleMap.value[r] || r
}
function roleTagType(r: string): 'primary' | 'success' | 'warning' | 'info' | 'danger' {
  switch (r) {
    case 'super':
      return 'danger'
    case 'operator':
      return 'primary'
    case 'finance':
      return 'warning'
    case 'support':
      return 'info'
    default:
      return 'info'
  }
}
function fmt(s?: string) {
  if (!s) return '-'
  return new Date(s).toLocaleString('zh-CN', { hour12: false })
}

onMounted(load)
</script>

<style scoped>
.users-page { padding: 16px; }
.flex-between { display: flex; justify-content: space-between; align-items: center; }
.mt-16 { margin-top: 16px; }
</style>
