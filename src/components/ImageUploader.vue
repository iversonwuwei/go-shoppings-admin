<!--
  ImageUploader 通用图片上传组件
  - v-model 绑定 URL(string) 或 URL 数组(string[])
  - multiple 开启多图
  - folder 指定后端保存子目录分类（products/logo/banner/avatar/...）
  - max 限制张数（multiple 模式下）
-->
<template>
  <div class="image-uploader">
    <div class="img-grid">
      <div v-for="(u, i) in urlList" :key="i" class="img-card">
        <el-image :src="u" fit="cover" class="img" :preview-src-list="[u]" preview-teleported />
        <div class="img-mask">
          <el-icon class="ico" @click="preview(u)"><View /></el-icon>
          <el-icon class="ico" @click="remove(i)"><Delete /></el-icon>
        </div>
      </div>
      <el-upload
        v-if="canAdd"
        :show-file-list="false"
        :before-upload="beforeUpload"
        :http-request="customUpload"
        accept="image/*"
        :multiple="false"
        class="uploader-tile"
      >
        <div class="tile">
          <el-icon v-if="!uploading" :size="28"><Plus /></el-icon>
          <el-icon v-else class="is-loading" :size="28"><Loading /></el-icon>
          <div class="tip">{{ uploading ? '上传中' : '上传图片' }}</div>
        </div>
      </el-upload>
    </div>
    <div class="hint">支持 jpg / png / gif / webp，最大 10MB{{ multiple ? `，最多 ${max} 张` : '' }}</div>
  </div>
</template>

<script setup lang="ts">
import { uploadImage } from '@/api/upload';
import { Delete, Loading, Plus, View } from '@element-plus/icons-vue';
import { ElMessage, type UploadRequestOptions } from 'element-plus';
import { computed, ref } from 'vue';

const props = withDefaults(
  defineProps<{
    modelValue: string | string[]
    multiple?: boolean
    folder?: string
    max?: number
    scope?: 'admin' | 'platform'
  }>(),
  { multiple: false, folder: 'common', max: 9 },
)
const emit = defineEmits<{ (e: 'update:modelValue', v: string | string[]): void }>()

const uploading = ref(false)

const urlList = computed<string[]>(() => {
  if (props.multiple) return (props.modelValue as string[]) || []
  const v = props.modelValue as string
  return v ? [v] : []
})

const canAdd = computed(() => {
  if (!props.multiple) return urlList.value.length === 0
  return urlList.value.length < props.max
})

function beforeUpload(file: File) {
  if (file.size > 10 * 1024 * 1024) {
    ElMessage.warning('图片不能超过 10MB')
    return false
  }
  if (!/^image\//.test(file.type)) {
    ElMessage.warning('仅支持图片格式')
    return false
  }
  return true
}

async function customUpload(opt: UploadRequestOptions) {
  uploading.value = true
  try {
    const r = await uploadImage(opt.file as File, props.folder, props.scope)
    if (props.multiple) {
      const next = [...urlList.value, r.url]
      emit('update:modelValue', next)
    } else {
      emit('update:modelValue', r.url)
    }
  } finally {
    uploading.value = false
  }
}

function remove(i: number) {
  if (props.multiple) {
    const next = [...urlList.value]
    next.splice(i, 1)
    emit('update:modelValue', next)
  } else {
    emit('update:modelValue', '')
  }
}

function preview(url: string) {
  window.open(url, '_blank')
}
</script>

<style scoped>
.img-grid { display: flex; flex-wrap: wrap; gap: 10px; }
.img-card { position: relative; width: 110px; height: 110px; border-radius: 6px; overflow: hidden; border: 1px solid #e5e7eb; }
.img { width: 100%; height: 100%; }
.img-mask {
  position: absolute; inset: 0; background: rgba(0,0,0,0.5);
  display: flex; align-items: center; justify-content: center; gap: 14px;
  color: #fff; opacity: 0; transition: opacity 0.2s;
}
.img-card:hover .img-mask { opacity: 1; }
.ico { cursor: pointer; font-size: 18px; }
.uploader-tile { display: inline-flex; }
.tile {
  width: 110px; height: 110px; border: 1px dashed #d1d5db; border-radius: 6px;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  color: #9ca3af; cursor: pointer;
}
.tile:hover { border-color: #409eff; color: #409eff; }
.tip { margin-top: 4px; font-size: 12px; }
.hint { margin-top: 8px; color: #9ca3af; font-size: 12px; }
</style>
