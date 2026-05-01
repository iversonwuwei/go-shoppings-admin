<template>
  <div class="page">
    <el-tabs v-model="activeTab">
      <el-tab-pane label="商城装修" name="storefront">
        <el-alert
          type="info"
          show-icon
          :closable="false"
          title="这里配置的是会员商城前台真实展示内容，和商城 UI 一一对应。"
          style="margin-bottom: 16px"
        />
        <el-form label-width="160px" style="max-width: 900px">
          <el-form-item label="商城主题色">
            <el-color-picker v-model="storefrontForm.primary_color" show-alpha />
            <span style="margin-left: 12px" class="mono">{{ storefrontForm.primary_color }}</span>
          </el-form-item>
          <el-form-item label="顶部提示文案">
            <el-input v-model="storefrontForm.storefront_notice" maxlength="255" show-word-limit />
          </el-form-item>
          <el-form-item label="首页主标题">
            <el-input v-model="storefrontForm.storefront_hero_title" maxlength="120" show-word-limit />
          </el-form-item>
          <el-form-item label="首页副标题">
            <el-input v-model="storefrontForm.storefront_hero_subtitle" type="textarea" :rows="3" maxlength="500" show-word-limit />
          </el-form-item>
          <el-form-item label="搜索框占位词">
            <el-input v-model="storefrontForm.storefront_search_placeholder" maxlength="120" show-word-limit />
          </el-form-item>

          <el-divider content-position="left">首页区块标题</el-divider>
          <el-form-item label="分类区标题">
            <el-input v-model="storefrontForm.storefront_category_title" />
          </el-form-item>
          <el-form-item label="优惠券区标题">
            <el-input v-model="storefrontForm.storefront_coupon_title" />
          </el-form-item>
          <el-form-item label="热卖区标题">
            <el-input v-model="storefrontForm.storefront_hot_title" />
          </el-form-item>
          <el-form-item label="推荐区标题">
            <el-input v-model="storefrontForm.storefront_recommend_title" />
          </el-form-item>

          <el-divider content-position="left">快捷入口</el-divider>
          <el-alert
            type="info"
            :closable="false"
            show-icon
            title="快捷入口已改为平台统一管理，请到平台后台的“租户管理”中按租户配置。"
            style="margin-bottom: 16px"
          />

          <el-divider content-position="left">服务卡片</el-divider>
          <div class="config-list">
            <div v-for="(item, idx) in storefrontForm.storefront_service_cards" :key="idx" class="config-card">
              <div class="config-card__head">
                <strong>卡片 {{ idx + 1 }}</strong>
                <el-button text type="danger" @click="removeServiceCard(idx)">删除</el-button>
              </div>
              <el-form-item label="标题">
                <el-input v-model="item.title" />
              </el-form-item>
              <el-form-item label="描述">
                <el-input v-model="item.desc" type="textarea" :rows="2" />
              </el-form-item>
            </div>
          </div>
          <el-form-item>
            <el-button @click="addServiceCard">新增服务卡片</el-button>
          </el-form-item>

          <el-divider content-position="left">首页 Banner</el-divider>
          <div class="config-list">
            <div v-for="(item, idx) in storefrontForm.storefront_banners" :key="`banner-${idx}`" class="config-card">
              <div class="config-card__head">
                <strong>Banner {{ idx + 1 }}</strong>
                <el-button text type="danger" @click="removeBanner(idx)">删除</el-button>
              </div>
              <el-form-item label="标题">
                <el-input v-model="item.title" />
              </el-form-item>
              <el-form-item label="副标题">
                <el-input v-model="item.subtitle" />
              </el-form-item>
              <el-form-item label="图片">
                <ImageUploader
                  v-model="item.image"
                  folder="storefront"
                  usage="storefront-banner"
                  :ai-prompt-subject="bannerPromptSubject(item, idx)"
                  :ai-prompt-context="bannerPromptContext(item)"
                />
              </el-form-item>
              <el-form-item label="跳转路径">
                <el-select v-model="item.path" style="width: 100%">
                  <el-option v-for="pathOption in storefrontPathOptions" :key="pathOption.value" :label="pathOption.label" :value="pathOption.value" />
                </el-select>
              </el-form-item>
            </div>
          </div>
          <el-form-item>
            <el-button @click="addBanner">新增 Banner</el-button>
          </el-form-item>

          <el-divider content-position="left">首页活动卡片</el-divider>
          <div class="config-list">
            <div v-for="(item, idx) in storefrontForm.storefront_promo_cards" :key="`promo-${idx}`" class="config-card">
              <div class="config-card__head">
                <strong>活动卡 {{ idx + 1 }}</strong>
                <el-button text type="danger" @click="removePromoCard(idx)">删除</el-button>
              </div>
              <el-form-item label="标题">
                <el-input v-model="item.title" />
              </el-form-item>
              <el-form-item label="副标题">
                <el-input v-model="item.subtitle" />
              </el-form-item>
              <el-form-item label="角标">
                <el-input v-model="item.tag" placeholder="如 今日必抢 / 会员优先" />
              </el-form-item>
              <el-form-item label="跳转路径">
                <el-select v-model="item.path" style="width: 100%">
                  <el-option v-for="pathOption in storefrontPathOptions" :key="pathOption.value" :label="pathOption.label" :value="pathOption.value" />
                </el-select>
              </el-form-item>
            </div>
          </div>
          <el-form-item>
            <el-button @click="addPromoCard">新增活动卡</el-button>
          </el-form-item>

          <el-divider content-position="left">会员页快捷入口</el-divider>
          <div class="config-list">
            <div v-for="(item, idx) in storefrontForm.storefront_member_entries" :key="`member-entry-${idx}`" class="config-card">
              <div class="config-card__head">
                <strong>入口 {{ idx + 1 }}</strong>
                <el-button text type="danger" @click="removeMemberEntry(idx)">删除</el-button>
              </div>
              <el-form-item label="标题">
                <el-input v-model="item.title" />
              </el-form-item>
              <el-form-item label="副标题">
                <el-input v-model="item.subtitle" />
              </el-form-item>
              <el-form-item label="跳转路径">
                <el-select v-model="item.path" style="width: 100%">
                  <el-option v-for="pathOption in storefrontPathOptions" :key="pathOption.value" :label="pathOption.label" :value="pathOption.value" />
                </el-select>
              </el-form-item>
            </div>
          </div>
          <el-form-item>
            <el-button @click="addMemberEntry">新增会员入口</el-button>
          </el-form-item>

          <el-divider content-position="left">首页楼层顺序</el-divider>
          <div class="config-list">
            <div v-for="(item, idx) in storefrontForm.storefront_home_sections" :key="`home-section-${idx}`" class="config-card">
              <div class="config-card__head">
                <strong>楼层 {{ idx + 1 }}</strong>
                <div class="config-card__ops">
                  <el-button text :disabled="idx === 0" @click="moveSection(storefrontForm.storefront_home_sections, idx, -1)">上移</el-button>
                  <el-button text :disabled="idx === storefrontForm.storefront_home_sections.length - 1" @click="moveSection(storefrontForm.storefront_home_sections, idx, 1)">下移</el-button>
                  <el-button text type="danger" @click="removeHomeSection(idx)">删除</el-button>
                </div>
              </div>
              <el-form-item label="模块">
                <el-select v-model="storefrontForm.storefront_home_sections[idx]" style="width: 100%">
                  <el-option v-for="itemOption in homeSectionOptions" :key="itemOption.value" :label="itemOption.label" :value="itemOption.value" />
                </el-select>
              </el-form-item>
            </div>
          </div>
          <el-form-item>
            <el-button @click="addHomeSection">新增首页楼层</el-button>
          </el-form-item>

          <el-divider content-position="left">会员页模块顺序</el-divider>
          <div class="config-list">
            <div v-for="(item, idx) in storefrontForm.storefront_profile_sections" :key="`profile-section-${idx}`" class="config-card">
              <div class="config-card__head">
                <strong>模块 {{ idx + 1 }}</strong>
                <div class="config-card__ops">
                  <el-button text :disabled="idx === 0" @click="moveSection(storefrontForm.storefront_profile_sections, idx, -1)">上移</el-button>
                  <el-button text :disabled="idx === storefrontForm.storefront_profile_sections.length - 1" @click="moveSection(storefrontForm.storefront_profile_sections, idx, 1)">下移</el-button>
                  <el-button text type="danger" @click="removeProfileSection(idx)">删除</el-button>
                </div>
              </div>
              <el-form-item label="模块">
                <el-select v-model="storefrontForm.storefront_profile_sections[idx]" style="width: 100%">
                  <el-option v-for="itemOption in profileSectionOptions" :key="itemOption.value" :label="itemOption.label" :value="itemOption.value" />
                </el-select>
              </el-form-item>
            </div>
          </div>
          <el-form-item>
            <el-button @click="addProfileSection">新增会员模块</el-button>
          </el-form-item>

          <el-divider content-position="left">搜索运营关键词</el-divider>
          <div class="config-list">
            <div v-for="(item, idx) in storefrontForm.storefront_search_keywords" :key="`keyword-${idx}`" class="config-card">
              <div class="config-card__head">
                <strong>关键词 {{ idx + 1 }}</strong>
                <el-button text type="danger" @click="removeSearchKeyword(idx)">删除</el-button>
              </div>
              <el-form-item label="文案">
                <el-input v-model="storefrontForm.storefront_search_keywords[idx]" placeholder="如 水果礼盒 / 新人优惠券" />
              </el-form-item>
            </div>
          </div>
          <el-form-item>
            <el-button @click="addSearchKeyword">新增关键词</el-button>
          </el-form-item>

          <el-form-item>
            <el-button type="primary" @click="onSaveStorefront">保存商城装修</el-button>
          </el-form-item>
        </el-form>
      </el-tab-pane>

      <el-tab-pane label="小程序码" name="mini-qrcode">
        <el-alert
          type="info"
          show-icon
          :closable="false"
          title="生成当前租户的微信小程序码，扫码进入平台统一小程序；需要后端已配置平台小程序 AppID 和 AppSecret。"
          style="margin-bottom: 16px"
        />
        <div class="mini-code-layout">
          <div class="mini-code-preview">
            <el-empty v-if="!miniQRCode" description="点击生成本租户小程序码" />
            <img v-else class="mini-code-image" :src="miniQRCode.image_data_url" alt="本租户小程序码" />
          </div>
          <el-form label-width="120px" class="mini-code-info">
            <el-form-item label="租户编号">
              <span class="mono">{{ miniQRCode?.tenant_code || '-' }}</span>
            </el-form-item>
            <el-form-item label="入口页面">
              <span class="mono">{{ miniQRCode?.page || 'pages/home/index' }}</span>
            </el-form-item>
            <el-form-item label="Scene">
              <span class="mono">{{ miniQRCode?.scene || '-' }}</span>
            </el-form-item>
            <el-form-item label="调试参数">
              <span class="mono">{{ miniQRCode?.query || '-' }}</span>
            </el-form-item>
            <el-form-item label="完整路径">
              <span class="mono">{{ miniQRCode?.path || '-' }}</span>
            </el-form-item>
            <el-form-item label="生成版本">
              <span class="mono">{{ miniQRCode?.env_version || '-' }}</span>
            </el-form-item>
            <el-form-item label="校验页面">
              <span class="mono">{{ miniQRCode ? (miniQRCode.check_path ? '是' : '否') : '-' }}</span>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" :loading="miniQrLoading" @click="generateMiniQRCode">生成本租户小程序码</el-button>
              <el-button :disabled="!miniQRCode" @click="downloadMiniQRCode">下载 PNG</el-button>
              <el-button :disabled="!miniQRCode" @click="copyMiniQRCodeEntry">复制入口参数</el-button>
            </el-form-item>
          </el-form>
        </div>
      </el-tab-pane>

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
            <ImageUploader v-model="brandForm.brand_logo" folder="logo" usage="brand-logo" :ai-prompt-subject="brandForm.brand_name || '品牌'" />
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
import {
    getMiniQRCode,
    getSiteConfig,
    updateSiteBrand,
    updateSiteDeployment,
    updateSiteDomain,
    updateSiteStorefront,
    type MiniQRCode,
    type SiteConfig,
    type StorefrontBanner,
    type StorefrontMemberEntry,
    type StorefrontPromoCard,
    type StorefrontQuickEntry,
    type StorefrontServiceCard,
} from '@/api/site'
import ImageUploader from '@/components/ImageUploader.vue'
import { ElMessage } from 'element-plus'
import { onMounted, reactive, ref, watch } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()

function tabFromRoute(path: string) {
  return path === '/admin/mini-qrcode' ? 'mini-qrcode' : 'storefront'
}

const activeTab = ref(tabFromRoute(route.path))

watch(
  () => route.path,
  (path) => {
    activeTab.value = tabFromRoute(path)
  },
)

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
  storefront_notice: '',
  storefront_hero_title: '',
  storefront_hero_subtitle: '',
  storefront_search_placeholder: '',
  storefront_category_title: '',
  storefront_coupon_title: '',
  storefront_hot_title: '',
  storefront_recommend_title: '',
  storefront_quick_entries: [],
  storefront_service_cards: [],
  storefront_banners: [],
  storefront_promo_cards: [],
  storefront_member_entries: [],
  storefront_home_sections: [],
  storefront_profile_sections: [],
  storefront_search_keywords: [],
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
const storefrontForm = reactive({
  primary_color: '#409EFF',
  storefront_notice: '',
  storefront_hero_title: '',
  storefront_hero_subtitle: '',
  storefront_search_placeholder: '',
  storefront_category_title: '',
  storefront_coupon_title: '',
  storefront_hot_title: '',
  storefront_recommend_title: '',
  storefront_quick_entries: [] as StorefrontQuickEntry[],
  storefront_service_cards: [] as StorefrontServiceCard[],
  storefront_banners: [] as StorefrontBanner[],
  storefront_promo_cards: [] as StorefrontPromoCard[],
  storefront_member_entries: [] as StorefrontMemberEntry[],
  storefront_home_sections: [] as string[],
  storefront_profile_sections: [] as string[],
  storefront_search_keywords: [] as string[],
})

const homeSectionOptions = [
  { label: 'Banner 轮播', value: 'banners' },
  { label: '快捷入口', value: 'quick_entries' },
  { label: '活动卡片', value: 'promo_cards' },
  { label: '服务卡片', value: 'service_cards' },
  { label: '分类楼层', value: 'categories' },
  { label: '优惠券楼层', value: 'coupons' },
  { label: '热卖楼层', value: 'hot' },
  { label: '推荐楼层', value: 'recommend' },
]

const profileSectionOptions = [
  { label: '快捷入口', value: 'member_entries' },
  { label: '会员资料', value: 'member_info' },
  { label: '收货地址', value: 'addresses' },
  { label: '积分记录', value: 'points' },
]

const storefrontPathOptions = [
  { label: '首页', value: '/' },
  { label: '全部商品', value: '/catalog' },
  { label: '热卖商品页', value: '/catalog?source=hot' },
  { label: '领券中心', value: '/coupons' },
  { label: '购物车', value: '/cart' },
  { label: '订单列表', value: '/orders' },
  { label: '会员中心', value: '/profile' },
  { label: '登录页', value: '/login' },
]

const domainDisabled = ref(false)
const brandDisabled = ref(false)
const deployDisabled = ref(false)
const miniQrLoading = ref(false)
const miniQRCode = ref<MiniQRCode | null>(null)

function isDisabledErr(e: unknown): boolean {
  const err = e as { code?: number }
  return !!err && err.code === 30004
}

function newQuickEntry(): StorefrontQuickEntry {
  return { title: '', subtitle: '', path: '/catalog' }
}

function newServiceCard(): StorefrontServiceCard {
  return { title: '', desc: '' }
}

function newBanner(): StorefrontBanner {
  return { title: '', subtitle: '', image: '', path: '/catalog' }
}

function newPromoCard(): StorefrontPromoCard {
  return { title: '', subtitle: '', tag: '', path: '/catalog' }
}

function newMemberEntry(): StorefrontMemberEntry {
  return { title: '', subtitle: '', path: '/profile' }
}

function bannerPromptSubject(item: StorefrontBanner, index: number) {
  return (item.title || storefrontForm.storefront_hero_title || `Banner ${index + 1}`).trim()
}

function bannerPromptContext(item: StorefrontBanner) {
  const parts: string[] = []
  if (item.subtitle) parts.push(`副标题：${item.subtitle}`)
  if (storefrontForm.storefront_hero_subtitle) parts.push(`商城定位：${storefrontForm.storefront_hero_subtitle}`)
  return parts.join('，')
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

  storefrontForm.storefront_notice = config.storefront_notice
  storefrontForm.primary_color = config.primary_color || '#409EFF'
  storefrontForm.storefront_hero_title = config.storefront_hero_title
  storefrontForm.storefront_hero_subtitle = config.storefront_hero_subtitle
  storefrontForm.storefront_search_placeholder = config.storefront_search_placeholder
  storefrontForm.storefront_category_title = config.storefront_category_title
  storefrontForm.storefront_coupon_title = config.storefront_coupon_title
  storefrontForm.storefront_hot_title = config.storefront_hot_title
  storefrontForm.storefront_recommend_title = config.storefront_recommend_title
  storefrontForm.storefront_quick_entries = (config.storefront_quick_entries || []).map((item) => ({ ...item }))
  storefrontForm.storefront_service_cards = (config.storefront_service_cards || []).map((item) => ({ ...item }))
  storefrontForm.storefront_banners = (config.storefront_banners || []).map((item) => ({ ...item }))
  storefrontForm.storefront_promo_cards = (config.storefront_promo_cards || []).map((item) => ({ ...item }))
  storefrontForm.storefront_member_entries = (config.storefront_member_entries || []).map((item) => ({ ...item }))
  storefrontForm.storefront_home_sections = [...(config.storefront_home_sections || [])]
  storefrontForm.storefront_profile_sections = [...(config.storefront_profile_sections || [])]
  storefrontForm.storefront_search_keywords = [...(config.storefront_search_keywords || [])]
}

async function load() {
  const data = await getSiteConfig()
  Object.assign(config, data)
  syncFromConfig()
}

async function generateMiniQRCode() {
  miniQrLoading.value = true
  try {
    miniQRCode.value = await getMiniQRCode()
    ElMessage.success('本租户小程序码已生成')
  } finally {
    miniQrLoading.value = false
  }
}

async function copyText(text: string) {
  if (!text) return
  try {
    await navigator.clipboard.writeText(text)
    ElMessage.success('已复制')
  } catch {
    const input = document.createElement('textarea')
    input.value = text
    input.style.position = 'fixed'
    input.style.left = '-9999px'
    document.body.appendChild(input)
    input.select()
    document.execCommand('copy')
    document.body.removeChild(input)
    ElMessage.success('已复制')
  }
}

function copyMiniQRCodeEntry() {
  const item = miniQRCode.value
  if (!item) return
  copyText([
    `tenantCode=${item.tenant_code}`,
    `page=${item.page}`,
    `scene=${item.scene}`,
    `query=${item.query}`,
    `path=${item.path}`,
    `env_version=${item.env_version || '-'}`,
    `check_path=${item.check_path ? 'true' : 'false'}`,
  ].join('\n'))
}

function downloadMiniQRCode() {
  const item = miniQRCode.value
  if (!item) return
  const link = document.createElement('a')
  link.href = item.image_data_url
  link.download = `mini-qrcode-${item.tenant_code}.png`
  link.click()
}

function addQuickEntry() {
  storefrontForm.storefront_quick_entries.push(newQuickEntry())
}

function removeQuickEntry(index: number) {
  storefrontForm.storefront_quick_entries.splice(index, 1)
}

function addServiceCard() {
  storefrontForm.storefront_service_cards.push(newServiceCard())
}

function removeServiceCard(index: number) {
  storefrontForm.storefront_service_cards.splice(index, 1)
}

function addBanner() {
  storefrontForm.storefront_banners.push(newBanner())
}

function removeBanner(index: number) {
  storefrontForm.storefront_banners.splice(index, 1)
}

function addPromoCard() {
  storefrontForm.storefront_promo_cards.push(newPromoCard())
}

function removePromoCard(index: number) {
  storefrontForm.storefront_promo_cards.splice(index, 1)
}

function addMemberEntry() {
  storefrontForm.storefront_member_entries.push(newMemberEntry())
}

function removeMemberEntry(index: number) {
  storefrontForm.storefront_member_entries.splice(index, 1)
}

function addHomeSection() {
  storefrontForm.storefront_home_sections.push('banners')
}

function removeHomeSection(index: number) {
  storefrontForm.storefront_home_sections.splice(index, 1)
}

function addProfileSection() {
  storefrontForm.storefront_profile_sections.push('member_entries')
}

function removeProfileSection(index: number) {
  storefrontForm.storefront_profile_sections.splice(index, 1)
}

function addSearchKeyword() {
  storefrontForm.storefront_search_keywords.push('')
}

function removeSearchKeyword(index: number) {
  storefrontForm.storefront_search_keywords.splice(index, 1)
}

function moveSection(list: string[], index: number, offset: number) {
  const target = index + offset
  if (target < 0 || target >= list.length) return
  const current = list[index]
  list[index] = list[target]
  list[target] = current
}

async function onSaveStorefront() {
  const data = await updateSiteStorefront({
    primary_color: storefrontForm.primary_color,
    storefront_notice: storefrontForm.storefront_notice,
    storefront_hero_title: storefrontForm.storefront_hero_title,
    storefront_hero_subtitle: storefrontForm.storefront_hero_subtitle,
    storefront_search_placeholder: storefrontForm.storefront_search_placeholder,
    storefront_category_title: storefrontForm.storefront_category_title,
    storefront_coupon_title: storefrontForm.storefront_coupon_title,
    storefront_hot_title: storefrontForm.storefront_hot_title,
    storefront_recommend_title: storefrontForm.storefront_recommend_title,
    storefront_service_cards: storefrontForm.storefront_service_cards.filter((item) => item.title.trim()),
    storefront_banners: storefrontForm.storefront_banners.filter((item) => item.title.trim() && item.image.trim()),
    storefront_promo_cards: storefrontForm.storefront_promo_cards.filter((item) => item.title.trim()),
    storefront_member_entries: storefrontForm.storefront_member_entries.filter((item) => item.title.trim()),
    storefront_home_sections: storefrontForm.storefront_home_sections.filter((item) => item.trim()),
    storefront_profile_sections: storefrontForm.storefront_profile_sections.filter((item) => item.trim()),
    storefront_search_keywords: storefrontForm.storefront_search_keywords.map((item) => item.trim()).filter(Boolean),
  })
  Object.assign(config, data)
  syncFromConfig()
  ElMessage.success('商城装修已保存')
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
.page { padding: 16px; }
.mono { font-family: Consolas, Menlo, monospace; }
.config-list { display: grid; gap: 16px; margin-bottom: 8px; }
.config-card {
  padding: 16px;
  border: 1px solid var(--el-border-color-light);
  border-radius: 12px;
  background: var(--el-fill-color-blank);
}
.config-card__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}
.config-card__ops {
  display: flex;
  align-items: center;
  gap: 8px;
}
.mini-code-layout {
  display: grid;
  grid-template-columns: 320px minmax(0, 1fr);
  gap: 24px;
  align-items: start;
  max-width: 900px;
}
.mini-code-preview {
  min-height: 320px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--el-border-color-light);
  border-radius: 8px;
  background: var(--el-fill-color-blank);
}
.mini-code-image {
  width: 260px;
  height: 260px;
  object-fit: contain;
}
.mini-code-info {
  max-width: 560px;
}
@media (max-width: 760px) {
  .mini-code-layout {
    grid-template-columns: 1fr;
  }
}
</style>
