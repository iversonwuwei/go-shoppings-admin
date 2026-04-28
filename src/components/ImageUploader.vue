<!--
  ImageUploader 通用图片上传组件
  - v-model 绑定 URL(string) 或 URL 数组(string[])
  - multiple 开启多图
  - folder 指定后端保存子目录分类（products/logo/banner/avatar/...）
  - max 限制张数（multiple 模式下）
  - usage 指定图片用途，用于尺寸校验和上传前压缩
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
      <div v-if="canAdd && aiEnabled" class="uploader-tile" @click="openAIDialog">
        <div class="tile tile-ai">
          <el-icon v-if="!aiGenerating" :size="28"><MagicStick /></el-icon>
          <el-icon v-else class="is-loading" :size="28"><Loading /></el-icon>
          <div class="tip">{{ aiGenerating ? '生成中' : 'AI生成' }}</div>
        </div>
      </div>
    </div>
    <div class="hint">{{ uploadHint }}</div>

    <el-dialog v-model="aiDialogVisible" title="AI 生成图片" width="520px" append-to-body>
      <el-form label-width="90px">
        <el-form-item label="图片用途">
          <el-input :model-value="activeRule.label" disabled />
        </el-form-item>
        <el-form-item v-if="aiPromptSubject" label="生成对象">
          <el-input :model-value="aiPromptSubject" disabled />
        </el-form-item>
        <el-form-item label="生成尺寸">
          <el-input :model-value="aiSizeText" disabled />
        </el-form-item>
        <el-form-item label="描述">
          <el-input
            v-model="aiPrompt"
            type="textarea"
            :rows="5"
            maxlength="1200"
            show-word-limit
            placeholder="描述画面主体、风格、颜色和使用场景"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="aiDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="aiGenerating" @click="submitAIImage">生成并使用</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { generateAIImage, uploadImage } from '@/api/upload'
import { Delete, Loading, MagicStick, Plus, View } from '@element-plus/icons-vue'
import { ElMessage, type UploadRequestOptions } from 'element-plus'
import { computed, ref } from 'vue'

type ImageUsage =
  | 'common'
  | 'product-cover'
  | 'product-gallery'
  | 'category-cover'
  | 'storefront-banner'
  | 'brand-logo'
  | 'platform-logo'

interface ImageRule {
  label: string
  minWidth?: number
  minHeight?: number
  aspectRatio?: number
  aspectTolerance?: number
  compressMaxWidth: number
  compressMaxHeight: number
  quality: number
  maxOutputBytes: number
  outputType?: 'image/jpeg' | 'image/webp' | 'image/png'
  preservePng?: boolean
}

interface LoadedImageSource {
  source: CanvasImageSource
  width: number
  height: number
  close: () => void
}

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024
const ACCEPTED_TYPES = new Set(['image/jpeg', 'image/png', 'image/gif', 'image/webp'])
const ACCEPTED_EXTS = new Set(['jpg', 'jpeg', 'png', 'gif', 'webp'])

const usageRules: Record<ImageUsage, ImageRule> = {
  common: {
    label: '通用图片',
    compressMaxWidth: 1600,
    compressMaxHeight: 1600,
    quality: 0.82,
    maxOutputBytes: 1200 * 1024,
    outputType: 'image/jpeg',
  },
  'product-cover': {
    label: '商品封面',
    minWidth: 600,
    minHeight: 600,
    compressMaxWidth: 1600,
    compressMaxHeight: 1600,
    quality: 0.82,
    maxOutputBytes: 1200 * 1024,
    outputType: 'image/jpeg',
  },
  'product-gallery': {
    label: '商品图',
    minWidth: 600,
    minHeight: 600,
    compressMaxWidth: 1600,
    compressMaxHeight: 1600,
    quality: 0.82,
    maxOutputBytes: 1200 * 1024,
    outputType: 'image/jpeg',
  },
  'category-cover': {
    label: '分类图片',
    minWidth: 240,
    minHeight: 240,
    aspectRatio: 1,
    aspectTolerance: 0.25,
    compressMaxWidth: 600,
    compressMaxHeight: 600,
    quality: 0.82,
    maxOutputBytes: 360 * 1024,
    outputType: 'image/jpeg',
  },
  'storefront-banner': {
    label: '首页 Banner',
    minWidth: 750,
    minHeight: 330,
    aspectRatio: 750 / 330,
    aspectTolerance: 0.22,
    compressMaxWidth: 1500,
    compressMaxHeight: 660,
    quality: 0.8,
    maxOutputBytes: 800 * 1024,
    outputType: 'image/jpeg',
  },
  'brand-logo': {
    label: '品牌 Logo',
    minWidth: 120,
    minHeight: 40,
    compressMaxWidth: 800,
    compressMaxHeight: 400,
    quality: 0.85,
    maxOutputBytes: 400 * 1024,
    preservePng: true,
  },
  'platform-logo': {
    label: '平台 Logo',
    minWidth: 120,
    minHeight: 40,
    compressMaxWidth: 800,
    compressMaxHeight: 400,
    quality: 0.85,
    maxOutputBytes: 400 * 1024,
    preservePng: true,
  },
}

const props = withDefaults(
  defineProps<{
    modelValue: string | string[]
    multiple?: boolean
    folder?: string
    max?: number
    scope?: 'admin' | 'platform'
    usage?: ImageUsage
    aiEnabled?: boolean
    aiPromptSubject?: string
    aiPromptContext?: string
    aiDefaultPrompt?: string
  }>(),
  { multiple: false, folder: 'common', max: 9, usage: 'common', aiEnabled: true },
)
const emit = defineEmits<{ (e: 'update:modelValue', v: string | string[]): void }>()

const uploading = ref(false)
const aiDialogVisible = ref(false)
const aiGenerating = ref(false)
const aiPrompt = ref('')

const activeRule = computed(() => usageRules[props.usage] || usageRules.common)
const aiEnabled = computed(() => props.aiEnabled)
const aiPromptSubject = computed(() => (props.aiPromptSubject || '').trim())
const aiWidth = computed(() => activeRule.value.compressMaxWidth)
const aiHeight = computed(() => activeRule.value.compressMaxHeight)
const aiAspectRatio = computed(() => formatAspectRatio(activeRule.value.aspectRatio || aiWidth.value / aiHeight.value))
const aiSizeText = computed(() => `${aiWidth.value}×${aiHeight.value}px，比例 ${aiAspectRatio.value}`)

const urlList = computed<string[]>(() => {
  if (props.multiple) return (props.modelValue as string[]) || []
  const v = props.modelValue as string
  return v ? [v] : []
})

const canAdd = computed(() => {
  if (!props.multiple) return urlList.value.length === 0
  return urlList.value.length < props.max
})

const uploadHint = computed(() => {
  const rule = activeRule.value
  const parts = ['支持 jpg / png / gif / webp', '最大 10MB']
  if (props.multiple) parts.push(`最多 ${props.max} 张`)
  if (rule.minWidth && rule.minHeight) parts.push(`${rule.label}不小于 ${rule.minWidth}×${rule.minHeight}px`)
  if (rule.aspectRatio) parts.push(`比例约 ${formatAspectRatio(rule.aspectRatio)}`)
  parts.push(`上传前压缩至 ${rule.compressMaxWidth}×${rule.compressMaxHeight}px 内`)
  return parts.join('，')
})

function beforeUpload(file: File) {
  if (file.size > MAX_UPLOAD_BYTES) {
    ElMessage.warning('图片不能超过 10MB')
    return false
  }
  if (!isSupportedImage(file)) {
    ElMessage.warning('仅支持 jpg / png / gif / webp 图片')
    return false
  }
  return true
}

async function customUpload(opt: UploadRequestOptions) {
  uploading.value = true
  try {
    const file = await prepareUploadFile(opt.file as File)
    if (!file) return
    const r = await uploadImage(file, props.folder, props.scope)
    appendImageURL(r.url)
  } catch (error: any) {
    ElMessage.error(error?.message || '上传失败')
    opt.onError?.(error)
  } finally {
    uploading.value = false
  }
}

function appendImageURL(url: string) {
  if (props.multiple) {
    const next = [...urlList.value, url]
    emit('update:modelValue', next)
  } else {
    emit('update:modelValue', url)
  }
}

function openAIDialog() {
  if (!canAdd.value || aiGenerating.value) return
  aiPrompt.value = defaultAIPrompt()
  aiDialogVisible.value = true
}

function defaultAIPrompt() {
  const explicitPrompt = props.aiDefaultPrompt?.trim()
  if (explicitPrompt) return explicitPrompt

  const label = activeRule.value.label
  const subject = aiPromptSubject.value
  const quotedSubject = subject ? `“${subject}”` : label
  const context = props.aiPromptContext?.trim()
  const contextText = context ? `，${context}` : ''

  if (props.usage === 'category-cover') return `${quotedSubject}分类封面图${contextText}，展示该分类代表性商品，商品陈列清晰，明亮干净，适合微信商城分类入口，不要文字、水印、二维码和边框`
  if (props.usage === 'storefront-banner') return `${quotedSubject}首页 Banner${contextText}，电商促销横幅，主体突出，留出标题空间，明亮高级，不要文字、水印、二维码和边框`
  if (props.usage === 'brand-logo' || props.usage === 'platform-logo') return `${quotedSubject}Logo${contextText}，简洁现代，品牌识别清晰，适合商城后台和小程序展示，不要复杂背景、水印、二维码和边框`
  if (props.usage === 'product-cover') return `${quotedSubject}商品封面${contextText}，商业摄影风格，背景干净，产品主体突出，真实电商质感，不要文字、水印、二维码和边框`
  if (props.usage === 'product-gallery') return `${quotedSubject}商品详情图${contextText}，多角度展示产品质感和使用场景，画面清晰，商业摄影风格，不要文字、水印、二维码和边框`
  return `${quotedSubject}${contextText}，适合微信商城运营，画面清晰，商业质感，不要文字、水印、二维码和边框`
}

async function submitAIImage() {
  const prompt = aiPrompt.value.trim()
  if (!prompt) {
    ElMessage.warning('请输入图片生成描述')
    return
  }
  aiGenerating.value = true
  try {
    const result = await generateAIImage({
      prompt,
      usage: props.usage,
      folder: props.folder,
      width: aiWidth.value,
      height: aiHeight.value,
      aspect_ratio: aiAspectRatio.value,
    }, props.scope)
    appendImageURL(result.url)
    aiDialogVisible.value = false
    ElMessage.success('AI 图片已生成')
  } catch (error: any) {
    ElMessage.error(error?.message || 'AI 图片生成失败')
  } finally {
    aiGenerating.value = false
  }
}

async function prepareUploadFile(file: File) {
  const rule = activeRule.value
  const image = await loadImageSource(file)
  try {
    if (!validateDimensions(image, rule)) return null
    return await compressImage(file, image, rule)
  } finally {
    image.close()
  }
}

function validateDimensions(image: LoadedImageSource, rule: ImageRule) {
  if (rule.minWidth && image.width < rule.minWidth) {
    ElMessage.warning(`${rule.label}宽度不能小于 ${rule.minWidth}px，当前 ${image.width}px`)
    return false
  }
  if (rule.minHeight && image.height < rule.minHeight) {
    ElMessage.warning(`${rule.label}高度不能小于 ${rule.minHeight}px，当前 ${image.height}px`)
    return false
  }
  if (rule.aspectRatio) {
    const tolerance = rule.aspectTolerance ?? 0.15
    const ratio = image.width / image.height
    const minRatio = rule.aspectRatio * (1 - tolerance)
    const maxRatio = rule.aspectRatio * (1 + tolerance)
    if (ratio < minRatio || ratio > maxRatio) {
      ElMessage.warning(`${rule.label}比例应接近 ${formatAspectRatio(rule.aspectRatio)}，当前 ${image.width}×${image.height}px`)
      return false
    }
  }
  return true
}

async function compressImage(file: File, image: LoadedImageSource, rule: ImageRule) {
  const mime = getImageMime(file)
  if (mime === 'image/gif') return file

  const scale = Math.min(1, rule.compressMaxWidth / image.width, rule.compressMaxHeight / image.height)
  const targetWidth = Math.max(1, Math.round(image.width * scale))
  const targetHeight = Math.max(1, Math.round(image.height * scale))
  const outputType = resolveOutputType(file, rule)
  const shouldTryCompress = scale < 1 || file.size > rule.maxOutputBytes || outputType !== mime
  if (!shouldTryCompress) return file

  const canvas = document.createElement('canvas')
  canvas.width = targetWidth
  canvas.height = targetHeight
  const context = canvas.getContext('2d')
  if (!context) return file

  context.drawImage(image.source, 0, 0, targetWidth, targetHeight)

  let quality = rule.quality
  let blob = await canvasToBlob(canvas, outputType, quality)
  while (outputType !== 'image/png' && blob.size > rule.maxOutputBytes && quality > 0.62) {
    quality = Math.max(0.62, quality - 0.08)
    blob = await canvasToBlob(canvas, outputType, quality)
  }

  if (scale === 1 && blob.size >= file.size) return file

  return new File([blob], replaceFileExt(file.name, extensionFromMime(outputType)), {
    type: outputType,
    lastModified: Date.now(),
  })
}

function loadImageSource(file: File): Promise<LoadedImageSource> {
  if ('createImageBitmap' in window) {
    return createImageBitmap(file).then((bitmap) => ({
      source: bitmap,
      width: bitmap.width,
      height: bitmap.height,
      close: () => bitmap.close(),
    }))
  }

  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const image = new Image()
    image.onload = () => {
      resolve({
        source: image,
        width: image.naturalWidth,
        height: image.naturalHeight,
        close: () => URL.revokeObjectURL(url),
      })
    }
    image.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('图片读取失败，请更换图片后重试'))
    }
    image.src = url
  })
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality: number) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob)
      else reject(new Error('图片压缩失败，请更换图片后重试'))
    }, type, quality)
  })
}

function isSupportedImage(file: File) {
  const mime = getImageMime(file)
  if (mime && ACCEPTED_TYPES.has(mime)) return true
  return ACCEPTED_EXTS.has(getFileExt(file.name))
}

function getImageMime(file: File) {
  const type = file.type.toLowerCase()
  if (type) return type
  const ext = getFileExt(file.name)
  if (ext === 'jpg' || ext === 'jpeg') return 'image/jpeg'
  if (ext === 'png') return 'image/png'
  if (ext === 'gif') return 'image/gif'
  if (ext === 'webp') return 'image/webp'
  return ''
}

function resolveOutputType(file: File, rule: ImageRule) {
  const mime = getImageMime(file)
  if (mime === 'image/png' && rule.preservePng) return 'image/png'
  if (mime === 'image/webp') return 'image/webp'
  return rule.outputType || 'image/jpeg'
}

function getFileExt(name: string) {
  return (name.split('.').pop() || '').toLowerCase()
}

function replaceFileExt(name: string, ext: string) {
  const base = name.replace(/\.[^.]+$/, '') || 'image'
  return `${base}.${ext}`
}

function extensionFromMime(mime: string) {
  if (mime === 'image/png') return 'png'
  if (mime === 'image/webp') return 'webp'
  return 'jpg'
}

function formatAspectRatio(ratio: number) {
  if (Math.abs(ratio - 1) < 0.01) return '1:1'
  return `${Number(ratio.toFixed(2))}:1`
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
.tile-ai { border-color: #b8d5ff; color: #409eff; background: #f5f9ff; }
.tile-ai:hover { border-color: #2f7ff0; color: #2f7ff0; background: #ecf5ff; }
.tip { margin-top: 4px; font-size: 12px; }
.hint { margin-top: 8px; color: #9ca3af; font-size: 12px; }
</style>
