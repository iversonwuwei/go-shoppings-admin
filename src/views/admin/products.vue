<template>
  <div class="page">
    <el-card>
      <div class="toolbar">
        <el-input v-model="keyword" placeholder="商品名称" style="width: 220px" clearable @change="load" />
        <el-select v-model="categoryId" placeholder="分类" style="width: 160px" clearable @change="load">
          <el-option v-for="c in categories" :key="c.id" :label="c.name" :value="c.id" />
        </el-select>
        <el-button type="primary" @click="load">查询</el-button>
        <el-button @click="downloadTemplate">下载导入模板</el-button>
        <el-upload
          :show-file-list="false"
          :auto-upload="true"
          accept=".csv,text/csv"
          :http-request="handleImportUpload"
        >
          <el-button type="warning" :loading="importing">批量导入</el-button>
        </el-upload>
        <el-button type="success" @click="openEdit()">新建商品</el-button>
      </div>

      <el-table :data="rows" v-loading="loading" stripe>
        <el-table-column prop="id" label="ID" width="60" />
        <el-table-column label="封面" width="80">
          <template #default="{ row }">
            <el-image v-if="row.cover_image" :src="row.cover_image" style="width: 48px; height: 48px" fit="cover" />
            <span v-else style="color: #bbb">—</span>
          </template>
        </el-table-column>
        <el-table-column prop="name" label="名称" min-width="200" />
        <el-table-column label="类型" width="90">
          <template #default="{ row }">
            <el-tag v-if="row.is_virtual === 1" type="warning" size="small">虚拟</el-tag>
            <el-tag v-else type="info" size="small">实物</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="price" label="价格" width="100" />
        <el-table-column label="库存" width="80">
          <template #default="{ row }">
            <span v-if="row.is_virtual === 1" style="color:#bbb">—</span>
            <span v-else>{{ row.stock }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="sold_count" label="销量" width="80" />
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-switch :model-value="row.status === 1" @change="(v: string | number | boolean) => toggleStatus(row, !!v)" />
          </template>
        </el-table-column>
        <el-table-column label="操作" align="center" class-name="operation-column" width="180" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="openEdit(row)">编辑</el-button>
            <el-popconfirm title="确定删除该商品？" @confirm="doDelete(row)">
              <template #reference>
                <el-button size="small" type="danger">删除</el-button>
              </template>
            </el-popconfirm>
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

    <el-dialog v-model="dialogVisible" :title="editing.id ? '编辑商品' : '新建商品'" width="560">
      <el-form :model="editing" label-width="90px">
        <el-form-item label="名称">
          <el-input v-model="editing.name" />
        </el-form-item>
        <el-form-item label="副标题">
          <el-input v-model="editing.subtitle" />
        </el-form-item>
        <el-form-item label="分类">
          <el-select v-model="editing.category_id" clearable style="width: 100%">
            <el-option v-for="c in categories" :key="c.id" :label="c.name" :value="c.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="封面图">
          <ImageUploader
            v-model="coverImage"
            folder="products"
            usage="product-cover"
            :ai-prompt-subject="productPromptSubject"
            :ai-prompt-context="productPromptContext"
          />
        </el-form-item>
        <el-form-item label="商品图">
          <ImageUploader
            v-model="productImages"
            multiple
            :max="9"
            folder="products"
            usage="product-gallery"
            :ai-prompt-subject="productPromptSubject"
            :ai-prompt-context="productPromptContext"
          />
        </el-form-item>
        <el-form-item label="视频地址">
          <el-input v-model="editing.video_url" placeholder="选填，商品介绍视频 URL" />
        </el-form-item>
        <el-form-item label="商品详情">
          <el-input v-model="editing.description" type="textarea" :rows="5" maxlength="5000" show-word-limit />
        </el-form-item>
        <el-form-item label="详情图片">
          <ImageUploader
            v-model="detailImages"
            multiple
            :max="20"
            folder="products"
            usage="product-detail"
            :ai-prompt-subject="productPromptSubject"
            :ai-prompt-context="productPromptContext"
          />
        </el-form-item>
        <el-form-item label="价格">
          <el-input v-model="editing.price" />
        </el-form-item>
        <el-form-item label="虚拟商品">
          <el-switch v-model="editing._virtual" />
          <span class="hint">虚拟商品无需发货，支付后订单自动完成</span>
        </el-form-item>
        <el-form-item v-if="!editing._virtual" label="配送方式">
          <el-checkbox-group v-model="deliveryTypes">
            <el-checkbox label="express">快递配送</el-checkbox>
            <el-checkbox label="city">同城配送</el-checkbox>
            <el-checkbox label="self_pickup">到店自提</el-checkbox>
          </el-checkbox-group>
        </el-form-item>
        <el-form-item v-if="!editing._virtual" label="运费">
          <el-input v-model="editing.delivery_fee" placeholder="如 0.00" />
        </el-form-item>
        <el-form-item label="库存">
          <el-alert type="info" :closable="false" title="商品保存后，请到“库存管理”统一入库、出库和设置预警库存。" />
        </el-form-item>
        <el-form-item label="首页推荐">
          <el-switch v-model="editing._recommend" />
        </el-form-item>
        <el-form-item label="热门商品">
          <el-switch v-model="editing._hot" />
        </el-form-item>
        <el-form-item label="排序值">
          <el-input-number v-model="editing.sort" :min="0" />
        </el-form-item>
        <el-form-item label="上架">
          <el-switch v-model="editing._active" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="save">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import {
    createProduct,
    deleteProduct,
    downloadProductImportTemplate,
    listCategories,
    listProducts,
    updateProduct,
    updateProductStatus,
    uploadProductImport,
    type Category,
    type Product,
} from '@/api/product'
import ImageUploader from '@/components/ImageUploader.vue'
import { ElMessage, ElMessageBox, type UploadRequestOptions } from 'element-plus'
import { computed, onMounted, reactive, ref } from 'vue'

const rows = ref<Product[]>([])
const total = ref(0)
const page = ref(1)
const size = ref(20)
const keyword = ref('')
const categoryId = ref<number | undefined>()
const loading = ref(false)
const categories = ref<Category[]>([])

const dialogVisible = ref(false)
const saving = ref(false)
const importing = ref(false)
const editing = reactive<Partial<Product> & {
  _active: boolean
  _virtual: boolean
  _recommend: boolean
  _hot: boolean
}>({
  _active: true,
  _virtual: false,
  _recommend: false,
  _hot: false,
  price: '0.00',
  delivery_fee: '0.00',
  images: [],
  detail_images: [],
  delivery_type: ['express'],
  sort: 0,
})

const coverImage = computed({
  get: () => editing.cover_image || '',
  set: (v: string) => { editing.cover_image = v },
})
const productImages = computed<string[]>({
  get: () => (editing.images as string[]) || [],
  set: (v: string[]) => { editing.images = v },
})
const detailImages = computed<string[]>({
  get: () => (editing.detail_images as string[]) || [],
  set: (v: string[]) => { editing.detail_images = v },
})
const selectedCategoryName = computed(() => categories.value.find((item) => item.id === editing.category_id)?.name || '')
const productPromptSubject = computed(() => (editing.name || selectedCategoryName.value || '商品').trim())
const productPromptContext = computed(() => {
  const parts: string[] = []
  if (selectedCategoryName.value) parts.push(`所属分类：${selectedCategoryName.value}`)
  if (editing.subtitle) parts.push(`卖点：${editing.subtitle}`)
  return parts.join('，')
})
const deliveryTypes = computed<string[]>({
  get: () => editing._virtual ? [] : ((editing.delivery_type as string[]) || ['express']),
  set: (v: string[]) => { editing.delivery_type = v },
})

async function load() {
  loading.value = true
  try {
    const resp = await listProducts({
      page: page.value,
      size: size.value,
      keyword: keyword.value || undefined,
      category_id: categoryId.value,
    })
    rows.value = resp.list
    total.value = resp.total
  } finally {
    loading.value = false
  }
}

async function loadCategories() {
  try {
    categories.value = await listCategories()
  } catch {
    categories.value = []
  }
}

async function downloadTemplate() {
  const blob = await downloadProductImportTemplate()
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = 'product-import-template.csv'
  link.click()
  window.URL.revokeObjectURL(url)
}

async function handleImportUpload(opt: UploadRequestOptions) {
  importing.value = true
  try {
    const result = await uploadProductImport(opt.file as File)
    if (result.errors?.length) {
      const lines = result.errors.slice(0, 20).map((item) => `第 ${item.row} 行：${item.message}`)
      await ElMessageBox.alert(
        `成功导入 ${result.imported} 条商品。<br/><br/>${lines.join('<br/>')}${result.errors.length > 20 ? '<br/>…其余错误请分批修正后重试。' : ''}`,
        '导入结果',
        { dangerouslyUseHTMLString: true },
      )
    } else {
      ElMessage.success(`成功导入 ${result.imported} 条商品`)
    }
    load()
  } finally {
    importing.value = false
  }
}

function openEdit(row?: Product) {
  Object.keys(editing).forEach((k) => delete (editing as any)[k])
  if (row) {
    Object.assign(editing, row, {
      delivery_type: row.delivery_type?.length ? row.delivery_type : ['express'],
      delivery_fee: row.delivery_fee || '0.00',
      detail_images: row.detail_images || [],
      video_url: row.video_url || '',
      sort: row.sort ?? 0,
      _active: row.status === 1,
      _virtual: row.is_virtual === 1,
      _recommend: row.is_recommend === 1,
      _hot: row.is_hot === 1,
    })
  } else {
    Object.assign(editing, {
      name: '',
      subtitle: '',
      category_id: undefined,
      cover_image: '',
      images: [],
      detail_images: [],
      video_url: '',
      description: '',
      price: '0.00',
      delivery_type: ['express'],
      delivery_fee: '0.00',
      sort: 0,
      _active: true,
      _virtual: false,
      _recommend: false,
      _hot: false,
    })
  }
  dialogVisible.value = true
}

async function save() {
  if (!editing.name) {
    ElMessage.warning('请填写名称')
    return
  }
  if (!editing._virtual && !deliveryTypes.value.length) {
    ElMessage.warning('请至少选择一种配送方式')
    return
  }
  saving.value = true
  try {
    const payload: any = {
      name: editing.name,
      subtitle: editing.subtitle,
      category_id: editing.category_id || null,
      cover_image: editing.cover_image || '',
      images: editing.images || [],
      detail_images: editing.detail_images || [],
      video_url: editing.video_url || '',
      description: editing.description || '',
      price: editing.price,
      status: editing._active ? 1 : 0,
      is_virtual: editing._virtual ? 1 : 0,
      delivery_type: editing._virtual ? [] : deliveryTypes.value,
      delivery_fee: editing._virtual ? '0.00' : (editing.delivery_fee || '0.00'),
      is_recommend: editing._recommend ? 1 : 0,
      is_hot: editing._hot ? 1 : 0,
      sort: editing.sort ?? 0,
    }
    if (editing.id) {
      await updateProduct(editing.id, payload)
      ElMessage.success('已更新')
    } else {
      await createProduct(payload)
      ElMessage.success('已创建，请到库存管理维护库存')
    }
    dialogVisible.value = false
    load()
  } finally {
    saving.value = false
  }
}

async function toggleStatus(row: Product, active: boolean) {
  await updateProductStatus(row.id, active ? 1 : 0)
  row.status = active ? 1 : 0
  ElMessage.success('状态已更新')
}

async function doDelete(row: Product) {
  await deleteProduct(row.id)
  ElMessage.success('已删除')
  load()
}

onMounted(() => {
  loadCategories()
  load()
})
</script>

<style scoped>
.toolbar { display: flex; gap: 8px; margin-bottom: 12px; }
.pager { margin-top: 12px; justify-content: flex-end; display: flex; }
.hint { color:#909399; font-size:12px; margin-left:8px; }
</style>
