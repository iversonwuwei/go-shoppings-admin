<template>
  <div class="page">
    <el-card>
      <div class="toolbar">
        <el-select v-model="status" clearable placeholder="消息状态" style="width: 180px" @change="load">
          <el-option label="全部" value="" />
          <el-option label="未读" value="unread" />
          <el-option label="已读" value="read" />
        </el-select>
        <el-button type="primary" @click="load">查询</el-button>
        <el-tag type="danger">未读 {{ unread }}</el-tag>
        <el-button @click="readAll">全部标记已读</el-button>
      </div>

      <el-table :data="rows" v-loading="loading" stripe>
        <el-table-column prop="title" label="消息标题" min-width="180" />
        <el-table-column prop="order_no" label="订单号" min-width="180" />
        <el-table-column prop="event_type" label="事件类型" width="140" />
        <el-table-column prop="content" label="消息内容" min-width="260" show-overflow-tooltip />
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 'unread' ? 'danger' : 'info'">
              {{ row.status === 'unread' ? '未读' : '已读' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="创建时间" width="180" />
        <el-table-column label="操作" align="center" class-name="operation-column" width="120">
          <template #default="{ row }">
            <el-button v-if="row.status === 'unread'" link type="primary" @click="readOne(row.id)">标记已读</el-button>
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
        @current-change="(p) => { page = p; load() }"
        @size-change="(s) => { size = s; load() }"
      />
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { listOrderMessages, markAllOrderMessagesRead, markOrderMessageRead, type OrderMessage } from '@/api/order'
import { ElMessage } from 'element-plus'
import { onMounted, ref } from 'vue'

const rows = ref<OrderMessage[]>([])
const total = ref(0)
const unread = ref(0)
const page = ref(1)
const size = ref(20)
const status = ref('')
const loading = ref(false)

async function load() {
  loading.value = true
  try {
    const resp = await listOrderMessages({ page: page.value, size: size.value, status: status.value || undefined })
    rows.value = resp.list
    total.value = resp.total
    unread.value = resp.unread
  } finally {
    loading.value = false
  }
}

async function readOne(id: number) {
  await markOrderMessageRead(id)
  ElMessage.success('已标记')
  await load()
}

async function readAll() {
  await markAllOrderMessagesRead()
  ElMessage.success('已全部标记为已读')
  await load()
}

onMounted(load)
</script>

<style scoped>
.toolbar { display: flex; gap: 8px; margin-bottom: 12px; align-items: center; }
.pager { margin-top: 12px; justify-content: flex-end; display: flex; }
</style>
