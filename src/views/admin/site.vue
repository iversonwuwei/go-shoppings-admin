<template>
  <div class="page">
    <el-tabs v-model="activeTab">
      <!-- 自定义域名 -->
      <el-tab-pane label="自定义域名" name="domain">
        <el-alert
          v-if="domainDisabled"
          type="warning"
          show-icon
          :closable="false"
          title="当前套餐未开通「自定义域名」功能"
          style="margin-bottom: 16px"
        />
        <el-form label-width="160px" style="max-width: 640px" :disabled="domainDisabled">
          <el-form-item label="自定义域名">
            <el-input v-model="domainForm.custom_domain" placeholder="如：shop.example.com" />
          </el-form-item>
          <el-form-item label="校验状态">
            <el-tag :type="config.domain_verified === 1 ? 'success' : 'info'" size="small">
              {{ config.domain_verified === 1 ? '已校验' : '未校验' }}
            </el-tag>
            <el-tag size="small" style="margin-left: 8px">SSL：{{ config.ssl_status }}</el-tag>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" :disabled="domainDisabled" @click="onSaveDomain">保存</el-button>
          </el-form-item>
        </el-form>
      </el-tab-pane>

      <!-- 品牌白标 -->
      <el-tab-pane label="品牌白标" name="brand">
        <el-alert
          v-if="brandDisabled"
          type="warning"
          show-icon
          :closable="false"
          title="当前套餐未开通「白标定制」功能"
          style="margin-bottom: 16px"
        />
        <el-form label-width="160px" style="max-width: 640px" :disabled="brandDisabled">
          <el-form-item label="品牌名称">
            <el-input v-model="brandForm.brand_name" />
          </el-form-item>
          <el-form-item label="品牌 Logo">
            <el-input v-model="brandForm.brand_logo" placeholder="图片 URL" />
            <img v-if="brandForm.brand_logo" :src="brandForm.brand_logo" class="logo-preview" />
          </el-form-item>
          <el-form-item label="主色调">
            <el-color-picker v-model="brandForm.primary_color" show-alpha />
            <span style="margin-left: 12px" class="mono">{{ brandForm.primary_color }}</span>
          </el-form-item>
          <el-form-item label="隐藏平台标识">
            <el-switch v-model="brandForm.hide_platform_brand" :active-value="1" :inactive-value="0" />
          </el-form-item>
          <el-form-item label="页脚文案">
            <el-input v-model="brandForm.footer_text" maxlength="255" show-word-limit />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" :disabled="brandDisabled" @click="onSaveBrand">保存</el-button>
          </el-form-item>
        </el-form>
      </el-tab-pane>

      <!-- 私有部署 -->
      <el-tab-pane label="私有部署" name="deployment">
        <el-alert
          v-if="deployDisabled"
          type="warning"
          show-icon
          :closable="false"
          title="当前套餐未开通「私有部署」功能"
          style="margin-bottom: 16px"
        />
        <el-form label-width="160px" style="max-width: 640px" :disabled="deployDisabled">
          <el-form-item label="部署模式">
            <el-radio-group v-model="deployForm.deployment_mode">
              <el-radio value="shared">共享集群</el-radio>
              <el-radio value="private">私有部署</el-radio>
            </el-radio-group>
          </el-form-item>
          <el-form-item label="私有服务端点">
            <el-input v-model="deployForm.private_endpoint" placeholder="如：https://pri.example.com" />
          </el-form-item>
          <el-form-item label="运维备注">
            <el-input v-model="deployForm.private_notes" type="textarea" :rows="3" maxlength="500" show-word-limit />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" :disabled="deployDisabled" @click="onSaveDeployment">保存</el-button>
          </el-form-item>
        </el-form>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup lang="ts">
import { getSiteConfig, updateSiteBrand, updateSiteDeployment, updateSiteDomain, type SiteConfig } from '@/api/site'
import { ElMessage } from 'element-plus'
import { onMounted, reactive, ref } from 'vue'

const activeTab = ref('domain')

const config = reactive<SiteConfig>({
  custom_domain: '',
  domain_verified: 0,
  ssl_status: 'none',
  brand_name: '',
  brand_logo: '',
  primary_color: '#409EFF',
  hide_platform_brand: 0,
  footer_text: '',
  deployment_mode: 'shared',
  private_endpoint: '',
  private_notes: '',
})

const domainForm = reactive({ custom_domain: '' })
const brandForm = reactive({
  brand_name: '',
  brand_logo: '',
  primary_color: '#409EFF',
  hide_platform_brand: 0,
  footer_text: '',
})
const deployForm = reactive({
  deployment_mode: 'shared',
  private_endpoint: '',
  private_notes: '',
})

const domainDisabled = ref(false)
const brandDisabled = ref(false)
const deployDisabled = ref(false)

function isDisabledErr(e: unknown): boolean {
  const err = e as { code?: number }
  return !!err && err.code === 30004
}

function syncFromConfig() {
  domainForm.custom_domain = config.custom_domain
  brandForm.brand_name = config.brand_name
  brandForm.brand_logo = config.brand_logo
  brandForm.primary_color = config.primary_color || '#409EFF'
  brandForm.hide_platform_brand = config.hide_platform_brand
  brandForm.footer_text = config.footer_text
  deployForm.deployment_mode = config.deployment_mode || 'shared'
  deployForm.private_endpoint = config.private_endpoint
  deployForm.private_notes = config.private_notes
}

async function load() {
  const data = await getSiteConfig()
  Object.assign(config, data)
  syncFromConfig()
}

async function onSaveDomain() {
  try {
    const data = await updateSiteDomain({ custom_domain: domainForm.custom_domain })
    Object.assign(config, data)
    syncFromConfig()
    ElMessage.success('已保存')
  } catch (e) {
    if (isDisabledErr(e)) domainDisabled.value = true
  }
}
async function onSaveBrand() {
  try {
    const data = await updateSiteBrand({ ...brandForm })
    Object.assign(config, data)
    syncFromConfig()
    ElMessage.success('已保存')
  } catch (e) {
    if (isDisabledErr(e)) brandDisabled.value = true
  }
}
async function onSaveDeployment() {
  try {
    const data = await updateSiteDeployment({ ...deployForm })
    Object.assign(config, data)
    syncFromConfig()
    ElMessage.success('已保存')
  } catch (e) {
    if (isDisabledErr(e)) deployDisabled.value = true
  }
}

onMounted(load)
</script>

<style scoped>
.page {
  padding: 16px;
}
.logo-preview {
  display: block;
  margin-top: 8px;
  max-height: 60px;
  max-width: 220px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
}
.mono {
  font-family: Consolas, Menlo, monospace;
}
</style>
