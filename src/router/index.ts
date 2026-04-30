import Layout from '@/layout/index.vue'
import { useUserStore } from '@/stores/user'
import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  { path: '/home', name: 'Home', component: () => import('@/views/home/index.vue'), meta: { public: true } },
  { path: '/login', component: () => import('@/views/login/index.vue'), meta: { public: true } },
  {
    path: '/',
    component: Layout,
    redirect: () => '/home',
    children: [
      {
        path: 'platform/dashboard',
        name: 'PlatformDashboard',
        component: () => import('@/views/platform/dashboard.vue'),
        meta: { title: '平台概览', role: 'platform', icon: 'DataBoard' },
      },
      {
        path: 'platform/tenants',
        name: 'PlatformTenants',
        component: () => import('@/views/platform/tenants.vue'),
        meta: { title: '租户审核', role: 'platform', icon: 'OfficeBuilding' },
      },
      {
        path: 'platform/plans',
        name: 'PlatformPlans',
        component: () => import('@/views/platform/plans.vue'),
        meta: { title: '套餐管理', role: 'platform', icon: 'PriceTag' },
      },
      {
        path: 'platform/features',
        name: 'PlatformFeatures',
        component: () => import('@/views/platform/features.vue'),
        meta: { title: '功能目录', role: 'platform', icon: 'Grid' },
      },
      {
        path: 'platform/payment-audit',
        name: 'PlatformPaymentAudit',
        component: () => import('@/views/platform/payment-audit.vue'),
        meta: { title: '结算资料审核', role: 'platform', icon: 'Wallet' },
      },
      {
        path: 'platform/carriers-audit',
        name: 'PlatformCarriers',
        component: () => import('@/views/platform/carriers.vue'),
        meta: { title: '物流承运商管理', role: 'platform', icon: 'Van' },
      },
      {
        path: 'platform/after-sale-reasons',
        name: 'PlatformAfterSaleReasons',
        component: () => import('@/views/platform/after-sale-reasons.vue'),
        meta: { title: '售后原因', role: 'platform', icon: 'Tickets' },
      },
      {
        path: 'platform/sms',
        name: 'PlatformSms',
        component: () => import('@/views/platform/sms.vue'),
        meta: { title: '短信通知', role: 'platform', icon: 'Message' },
      },
      {
        path: 'platform/api-access',
        name: 'PlatformApiAccess',
        component: () => import('@/views/platform/api-access.vue'),
        meta: { title: '开放 API', role: 'platform', icon: 'Key' },
      },
      {
        path: 'platform/domains',
        name: 'PlatformDomains',
        component: () => import('@/views/platform/domains.vue'),
        meta: { title: '自定义域名审核', role: 'platform', icon: 'Link' },
      },
      {
        path: 'platform/deployments',
        name: 'PlatformDeployments',
        component: () => import('@/views/platform/deployments.vue'),
        meta: { title: '私有部署管理', role: 'platform', icon: 'Cpu' },
      },
      {
        path: 'platform/settings',
        name: 'PlatformSettings',
        component: () => import('@/views/platform/settings.vue'),
        meta: { title: '平台设置', role: 'platform', icon: 'Setting' },
      },
      {
        path: 'platform/users',
        name: 'PlatformUsers',
        component: () => import('@/views/platform/users.vue'),
        meta: { title: '平台用户', role: 'platform', icon: 'User' },
      },
      {
        path: 'platform/categories',
        name: 'PlatformCategories',
        component: () => import('@/views/platform/categories.vue'),
        meta: { title: '商品分类', role: 'platform', icon: 'Menu' },
      },
      {
        path: 'platform/regions',
        name: 'PlatformRegions',
        component: () => import('@/views/platform/regions.vue'),
        meta: { title: '城市信息', role: 'platform', icon: 'Location' },
      },
      {
        path: 'admin/categories',
        name: 'AdminCategories',
        component: () => import('@/views/admin/categories.vue'),
        meta: { title: '商品分类', role: 'tenant', icon: 'Menu' },
      },
      {
        path: 'admin/products',
        name: 'AdminProducts',
        component: () => import('@/views/admin/products.vue'),
        meta: { title: '商品管理', role: 'tenant', icon: 'Goods' },
      },
      {
        path: 'admin/inventory',
        name: 'AdminInventory',
        component: () => import('@/views/admin/inventory.vue'),
        meta: { title: '库存管理', role: 'tenant', icon: 'Box' },
      },
      {
        path: 'admin/orders',
        name: 'AdminOrders',
        component: () => import('@/views/admin/orders.vue'),
        meta: { title: '订单列表', role: 'tenant', icon: 'Tickets' },
      },
      {
        path: 'admin/after-sales',
        name: 'AdminAfterSales',
        component: () => import('@/views/admin/after-sales.vue'),
        meta: { title: '售后处理', role: 'tenant', icon: 'Tickets' },
      },
      {
        path: 'admin/order-messages',
        name: 'AdminOrderMessages',
        component: () => import('@/views/admin/order-messages.vue'),
        meta: { title: '订单消息', role: 'tenant', icon: 'Message' },
      },
      {
        path: 'admin/members',
        name: 'AdminMembers',
        component: () => import('@/views/admin/members.vue'),
        meta: { title: '会员管理', role: 'tenant', icon: 'User' },
      },
      {
        path: 'admin/member/levels',
        name: 'AdminMemberLevels',
        component: () => import('@/views/admin/member-levels.vue'),
        meta: { title: '会员等级', role: 'tenant', icon: 'Medal' },
      },
      {
        path: 'admin/seckill',
        name: 'AdminSeckill',
        component: () => import('@/views/admin/seckill.vue'),
        meta: { title: '限时秒杀', role: 'tenant', icon: 'Timer' },
      },
      {
        path: 'admin/coupons',
        name: 'AdminCoupons',
        component: () => import('@/views/admin/coupons.vue'),
        meta: { title: '优惠券', role: 'tenant', icon: 'Discount' },
      },
      {
        path: 'admin/points',
        name: 'AdminPoints',
        component: () => import('@/views/admin/points.vue'),
        meta: { title: '积分规则', role: 'tenant', icon: 'Coin' },
      },
      {
        path: 'admin/groupon',
        name: 'AdminGroupon',
        component: () => import('@/views/admin/groupon.vue'),
        meta: { title: '拼团活动', role: 'tenant', icon: 'Present' },
      },
      {
        path: 'admin/distribution',
        name: 'AdminDistribution',
        component: () => import('@/views/admin/distribution.vue'),
        meta: { title: '分销管理', role: 'tenant', icon: 'Share' },
      },
      {
        path: 'admin/delivery',
        name: 'AdminDelivery',
        component: () => import('@/views/admin/delivery.vue'),
        meta: { title: '配送设置', role: 'tenant', icon: 'Box' },
      },
      {
        path: 'admin/site',
        name: 'AdminSite',
        component: () => import('@/views/admin/site.vue'),
        meta: { title: '商城装修', role: 'tenant', icon: 'Brush' },
      },
      {
        path: 'admin/mini-qrcode',
        name: 'AdminMiniQRCode',
        component: () => import('@/views/admin/site.vue'),
        meta: { title: '本租户小程序码', role: 'tenant', icon: 'Grid' },
      },
      {
        path: 'admin/settings/payment',
        name: 'AdminSettingsPayment',
        component: () => import('@/views/admin/settings/payment.vue'),
        meta: { title: '结算资料', role: 'tenant', icon: 'Wallet' },
      },
      {
        path: 'admin/settings/carriers',
        name: 'AdminSettingsCarriers',
        component: () => import('@/views/admin/settings/carriers.vue'),
        meta: { title: '物流承运商', role: 'tenant', icon: 'Van' },
      },
      {
        path: 'admin/billing',
        name: 'AdminBilling',
        component: () => import('@/views/admin/billing.vue'),
        meta: { title: '订阅付费', role: 'tenant', icon: 'Money' },
      },
    ],
  },
  { path: '/:pathMatch(.*)*', component: () => import('@/views/404.vue'), meta: { public: true } },
]

const router = createRouter({ history: createWebHistory(), routes })

router.beforeEach((to) => {
  const user = useUserStore()
  if (to.meta.public) return true
  if (!user.isLoggedIn) return { path: '/login', query: { redirect: to.fullPath } }
  if (to.meta.role && to.meta.role !== user.role) {
    return user.role === 'platform' ? '/platform/dashboard' : '/admin/products'
  }
  return true
})

export default router
