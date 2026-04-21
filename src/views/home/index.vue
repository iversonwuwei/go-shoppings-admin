<script setup lang="ts">
import request from '@/api/request'
import {
    DataBoard,
    Goods,
    OfficeBuilding,
    Promotion, Setting,
    Ticket,
    Van,
    Wallet,
} from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'

interface Plan {
  id: number
  name: string
  code: string
  monthly_fee: string
  yearly_fee: string
  product_limit: number
  order_limit: number
  user_limit: number
  features: string[]
  is_default: number
}

const router = useRouter()
const plans = ref<Plan[]>([])
const loading = ref(false)
const dialog = ref(false)
const submitting = ref(false)
const billing = ref<'monthly' | 'yearly'>('yearly')

const form = reactive({
  code: '',
  company_name: '',
  contact_name: '',
  contact_phone: '',
  contact_email: '',
  brand_name: '',
  plan_id: 0 as number,
})

async function loadPlans() {
  loading.value = true
  try {
    const r = await request.get<any, Plan[]>('/public/plans')
    plans.value = (r || []).filter((p: any) => p.status === 1)
    const def = plans.value.find((p) => p.is_default === 1) || plans.value[0]
    if (def) form.plan_id = def.id
  } finally { loading.value = false }
}

function fmt(n: number | string) {
  const v = Number(n || 0)
  return v.toLocaleString('zh-CN', { maximumFractionDigits: 2 })
}
function yearlySavings(p: Plan) {
  const m = Number(p.monthly_fee || 0)
  const y = Number(p.yearly_fee || 0)
  if (m <= 0 || y <= 0) return 0
  const saved = m * 12 - y
  return saved > 0 ? saved : 0
}
function yearlyDiscount(p: Plan) {
  const m = Number(p.monthly_fee || 0)
  const y = Number(p.yearly_fee || 0)
  if (m <= 0 || y <= 0) return 0
  const pct = Math.round((1 - y / (m * 12)) * 100)
  return pct > 0 ? pct : 0
}

function openApply(planId?: number) {
  if (planId) form.plan_id = planId
  dialog.value = true
}

async function submit() {
  if (!form.code || !form.company_name || !form.contact_phone) {
    return ElMessage.warning('请填写商户编码、公司名称与联系电话')
  }
  submitting.value = true
  try {
    const r = await request.post<any, { id: number; code: string; status: number }>('/public/apply', form)
    dialog.value = false
    await ElMessageBox.alert(
      `入驻申请已提交！您的商户编码为 ${r.code}，待平台审核通过后，您将可使用此编码登录商户后台。`,
      '提交成功',
      { confirmButtonText: '好的' },
    )
    Object.assign(form, { code:'', company_name:'', contact_name:'', contact_phone:'', contact_email:'', brand_name:'' })
  } finally { submitting.value = false }
}

const featureLabels = ref<Record<string, string>>({})
async function loadFeatureLabels() {
  try {
    const rows = await request.get<any, Array<{ code: string; name: string }>>('/public/features')
    const map: Record<string, string> = {}
    for (const r of rows || []) map[r.code] = r.name
    featureLabels.value = map
  } catch { /* keep empty, will fall back to codes */ }
}
function featLabel(k: string) { return featureLabels.value[k] || k }

const features = [
  { icon: Goods, title: '商品 & SKU 管理', desc: '分类、规格、库存、上下架、批量导入，满足不同业态商品管理需求。' },
  { icon: Ticket, title: '优惠券 & 积分', desc: '满减、折扣、直减、积分抵扣多种营销玩法，提升复购转化。' },
  { icon: Wallet, title: '微信支付 & 多账户', desc: '租户独立配置商户号，平台审核通过后即刻生效，资金独立结算。' },
  { icon: Van, title: '多承运商物流', desc: '平台统一对接快递100 / 阿里云 / 顺丰，租户一键选择、实时查询轨迹。' },
  { icon: OfficeBuilding, title: '多租户隔离', desc: '数据、流量、配置完全租户维度隔离，合规安全。' },
  { icon: DataBoard, title: '数据看板', desc: '订单、销售、会员、商品多维度指标，经营状况一目了然。' },
  { icon: Promotion, title: '小程序 / H5', desc: '官方小程序模板即开即用，支持品牌域名、主题色自定义。' },
  { icon: Setting, title: '开放接口', desc: '完整 REST API + Webhook，支持 ERP / CRM 深度集成。' },
]

onMounted(() => { loadPlans(); loadFeatureLabels() })
</script>

<template>
  <div class="landing">
    <header class="nav">
      <div class="brand">
        <div class="logo">微</div>
        <div>
          <div class="title">微信商城 SaaS</div>
          <div class="subtitle">一站式微信私域电商解决方案</div>
        </div>
      </div>
      <div class="actions">
        <el-button text @click="router.push('/login')">商户登录</el-button>
        <el-button type="primary" @click="openApply()">立即入驻</el-button>
      </div>
    </header>

    <section class="hero">
      <div class="inner">
        <h1>让每一家企业都能拥有自己的微信商城</h1>
        <p>SaaS 多租户架构 · 开箱即用 · 30 天免费试用，<br />覆盖商品、订单、支付、营销、物流全链路。</p>
        <div class="cta">
          <el-button type="primary" size="large" @click="openApply()">立即申请入驻</el-button>
          <el-button size="large" @click="router.push('/login')">登录后台</el-button>
        </div>
        <div class="tags">
          <el-tag type="success">数据隔离</el-tag>
          <el-tag>多承运商对接</el-tag>
          <el-tag type="warning">微信官方支付</el-tag>
          <el-tag type="info">品牌自定义</el-tag>
        </div>
      </div>
    </section>

    <section class="section">
      <h2>核心能力</h2>
      <div class="features">
        <div v-for="f in features" :key="f.title" class="feature">
          <el-icon :size="28" color="#409eff"><component :is="f.icon" /></el-icon>
          <h3>{{ f.title }}</h3>
          <p>{{ f.desc }}</p>
        </div>
      </div>
    </section>

    <section class="section pricing">
      <h2>套餐与定价</h2>
      <p class="sub">先免费试用 30 天，随业务增长灵活升级</p>
      <div class="billing-switch">
        <el-radio-group v-model="billing" size="large">
          <el-radio-button label="monthly">按月付</el-radio-button>
          <el-radio-button label="yearly">按年付<span class="save-tip">更划算</span></el-radio-button>
        </el-radio-group>
      </div>
      <div v-loading="loading" class="plans">
        <el-card v-for="p in plans" :key="p.id" class="plan" :class="{ featured: p.is_default === 1 }">
          <div class="plan-head">
            <h3>{{ p.name }}</h3>
            <el-tag v-if="p.is_default === 1" type="success">推荐</el-tag>
          </div>
          <div class="price">
            <span class="amount">¥{{ fmt(billing === 'monthly' ? p.monthly_fee : p.yearly_fee) }}</span>
            <span class="per">/{{ billing === 'monthly' ? '月' : '年' }}</span>
          </div>
          <div class="alt-price">
            <template v-if="billing === 'monthly'">
              年付 ¥{{ fmt(p.yearly_fee) }}
              <span v-if="yearlyDiscount(p) > 0" class="save">省 {{ yearlyDiscount(p) }}%</span>
            </template>
            <template v-else>
              月付 ¥{{ fmt(p.monthly_fee) }} ×12
              <span v-if="yearlySavings(p) > 0" class="save">一年省 ¥{{ fmt(yearlySavings(p)) }}</span>
            </template>
          </div>
          <ul>
            <li>商品数量：{{ p.product_limit === 0 ? '不限' : p.product_limit }}</li>
            <li>月订单量：{{ p.order_limit === 0 ? '不限' : p.order_limit }}</li>
            <li>用户规模：{{ p.user_limit === 0 ? '不限' : p.user_limit }}</li>
            <li v-for="(feat, i) in (p.features || [])" :key="i">{{ featLabel(feat) }}</li>
          </ul>
          <el-button type="primary" plain style="width:100%" @click="openApply(p.id)">选择此套餐</el-button>
        </el-card>
      </div>
    </section>

    <section class="cta-band">
      <div class="inner">
        <h2>准备好开启您的微信商城之旅了吗？</h2>
        <el-button type="primary" size="large" @click="openApply()">立即免费试用</el-button>
      </div>
    </section>

    <footer class="footer">
      <p>© {{ new Date().getFullYear() }} 微信商城 SaaS · 为企业提供专业的私域电商能力</p>
    </footer>

    <el-dialog v-model="dialog" title="申请入驻" width="560px">
      <el-form :model="form" label-width="110px">
        <el-form-item label="商户编码" required>
          <el-input v-model="form.code" placeholder="英文数字组合，如 acme2026" maxlength="30" />
        </el-form-item>
        <el-form-item label="公司名称" required>
          <el-input v-model="form.company_name" maxlength="100" />
        </el-form-item>
        <el-form-item label="品牌名">
          <el-input v-model="form.brand_name" placeholder="展示在小程序的品牌名称" />
        </el-form-item>
        <el-form-item label="联系人">
          <el-input v-model="form.contact_name" />
        </el-form-item>
        <el-form-item label="联系电话" required>
          <el-input v-model="form.contact_phone" />
        </el-form-item>
        <el-form-item label="邮箱">
          <el-input v-model="form.contact_email" />
        </el-form-item>
        <el-form-item label="套餐">
          <el-select v-model="form.plan_id" style="width:100%">
            <el-option
              v-for="p in plans"
              :key="p.id"
              :label="`${p.name} — ¥${fmt(p.monthly_fee)}/月 或 ¥${fmt(p.yearly_fee)}/年`"
              :value="p.id"
            />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialog = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submit">提交申请</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped lang="scss">
.landing { min-height: 100vh; background: #fff; color: #1f2937; }

.nav {
  display: flex; justify-content: space-between; align-items: center;
  padding: 14px 40px; border-bottom: 1px solid #eee; position: sticky; top: 0; background: #fff; z-index: 10;
  .brand { display:flex; align-items:center; gap:12px; }
  .logo {
    width:40px; height:40px; border-radius:10px;
    background: linear-gradient(135deg,#409eff,#36d399); color:#fff;
    display:flex; align-items:center; justify-content:center; font-weight:700;
  }
  .title { font-weight:600; }
  .subtitle { font-size:12px; color:#9ca3af; }
}

.hero {
  background: linear-gradient(135deg,#eff6ff 0%, #ecfdf5 100%);
  padding: 80px 40px;
  .inner { max-width: 960px; margin: 0 auto; text-align: center; }
  h1 { font-size: 40px; margin: 0 0 16px; letter-spacing: 1px; }
  p { color:#4b5563; font-size: 16px; line-height: 1.8; }
  .cta { margin-top: 28px; display:flex; gap:12px; justify-content:center; }
  .tags { margin-top: 20px; display:flex; gap:8px; justify-content:center; flex-wrap:wrap; }
}

.section {
  padding: 72px 40px;
  h2 { text-align:center; font-size: 28px; margin: 0 0 8px; }
  .sub { text-align:center; color:#6b7280; margin-bottom: 32px; }
}

.features {
  max-width: 1160px; margin: 0 auto;
  display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 20px;
  .feature {
    background:#fff; border:1px solid #eef2f7; border-radius: 12px; padding: 20px;
    transition: all .2s;
    &:hover { box-shadow: 0 8px 24px rgba(16,24,40,.06); transform: translateY(-2px); }
    h3 { font-size: 16px; margin: 10px 0 6px; }
    p { color:#6b7280; font-size: 13px; line-height: 1.7; margin: 0; }
  }
}

.pricing { background:#fafafa; }
.billing-switch { display:flex; justify-content:center; margin-bottom: 28px; }
.billing-switch .save-tip {
  margin-left: 6px; padding: 1px 6px; border-radius: 8px;
  background: #fef3c7; color:#b45309; font-size: 11px;
}
.plans {
  max-width: 1160px; margin: 0 auto;
  display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 20px;
  .plan {
    border-radius: 12px;
    .plan-head { display:flex; justify-content:space-between; align-items:center; }
    h3 { margin: 0; }
    .price { margin-top: 10px; .amount { font-size: 32px; font-weight: 700; color:#111827; } .per { color:#6b7280; } }
    .alt-price {
      color:#9ca3af; font-size: 12px; margin-bottom: 14px;
      .save { margin-left: 6px; padding: 1px 6px; border-radius: 8px; background:#ecfdf5; color:#059669; font-weight:600; }
    }
    ul { padding-left: 18px; color:#4b5563; font-size: 14px; line-height: 2; }
    &.featured { border: 2px solid #409eff; }
  }
}

.cta-band {
  background: linear-gradient(135deg,#1d4ed8,#0ea5e9); color:#fff; padding: 56px 40px; text-align:center;
  h2 { margin: 0 0 16px; }
}

.footer { padding: 24px; text-align:center; color:#9ca3af; font-size: 12px; }
</style>
