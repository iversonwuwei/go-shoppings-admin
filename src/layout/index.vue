<template>
  <el-container class="layout">
    <el-aside width="220px" class="sidebar">
      <div class="logo">SaaS 商城后台</div>
      <el-menu :default-active="route.path" router background-color="#001529" text-color="#c9d1d9" active-text-color="#fff">
        <el-menu-item v-for="m in menus" :key="m.path" :index="m.path">
          <el-icon><component :is="m.icon" /></el-icon>
          <span>{{ m.title }}</span>
        </el-menu-item>
      </el-menu>
    </el-aside>
    <el-container>
      <el-header class="header">
        <div>
          <el-tag :type="user.isPlatform ? 'danger' : 'success'">
            {{ user.isPlatform ? '平台' : '商户' }}
          </el-tag>
          <span class="title">{{ currentTitle }}</span>
        </div>
        <el-dropdown @command="handleCmd">
          <span class="user">
            {{ user.admin?.real_name || user.admin?.username }} ({{ user.admin?.role }})
            <el-icon><ArrowDown /></el-icon>
          </span>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="logout">退出登录</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </el-header>
      <el-main class="main">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup lang="ts">
import { useUserStore } from '@/stores/user'
import { ArrowDown, Box, Brush, Coin, Cpu, DataBoard, Discount, Goods, Grid, Key, Link, Location, Medal, Menu, Message, Money, OfficeBuilding, Present, PriceTag, Setting, Share, Tickets, Timer, User, Van, Wallet } from '@element-plus/icons-vue'
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const router = useRouter()
const route = useRoute()
const user = useUserStore()

const iconMap: Record<string, any> = { DataBoard, OfficeBuilding, Goods, Tickets, Wallet, Van, PriceTag, Grid, User, Medal, Timer, Discount, Coin, Present, Share, Message, Key, Box, Brush, Link, Cpu, Location }

const allMenus = [
  { path: '/platform/dashboard', title: '平台概览', icon: DataBoard, role: 'platform' },
  { path: '/platform/tenants', title: '租户审核', icon: OfficeBuilding, role: 'platform', platformRoles: ['super', 'operator'] },
  { path: '/platform/plans', title: '套餐管理', icon: PriceTag, role: 'platform', platformRoles: ['super', 'operator'] },
  { path: '/platform/features', title: '功能目录', icon: Grid, role: 'platform', platformRoles: ['super', 'operator'] },
  { path: '/platform/payment-audit', title: '收款配置审核', icon: Wallet, role: 'platform', platformRoles: ['super', 'finance'] },
  { path: '/platform/carriers-audit', title: '物流承运商管理', icon: Van, role: 'platform', platformRoles: ['super', 'operator'] },
  { path: '/platform/sms', title: '短信通知', icon: Message, role: 'platform', platformRoles: ['super', 'operator'] },
  { path: '/platform/api-access', title: '开放 API', icon: Key, role: 'platform', platformRoles: ['super', 'operator'] },
  { path: '/platform/domains', title: '域名审核', icon: Link, role: 'platform', platformRoles: ['super', 'operator'] },
  { path: '/platform/deployments', title: '私有部署', icon: Cpu, role: 'platform', platformRoles: ['super', 'operator'] },
  { path: '/platform/settings', title: '平台设置', icon: Setting, role: 'platform', platformRoles: ['super'] },
  { path: '/platform/users', title: '平台用户', icon: User, role: 'platform', platformRoles: ['super'] },
  { path: '/platform/categories', title: '商品分类', icon: Menu, role: 'platform', platformRoles: ['super', 'operator'] },
  { path: '/platform/regions', title: '城市信息', icon: Location, role: 'platform', platformRoles: ['super', 'operator'] },
  { path: '/admin/categories', title: '商品分类', icon: Menu, role: 'tenant' },
  { path: '/admin/products', title: '商品管理', icon: Goods, role: 'tenant' },
  { path: '/admin/inventory', title: '库存管理', icon: Box, role: 'tenant' },
  { path: '/admin/orders', title: '订单列表', icon: Tickets, role: 'tenant' },
  { path: '/admin/order-messages', title: '订单消息', icon: Message, role: 'tenant' },
  { path: '/admin/members', title: '会员管理', icon: User, role: 'tenant' },
  { path: '/admin/member/levels', title: '会员等级', icon: Medal, role: 'tenant' },
  { path: '/admin/seckill', title: '限时秒杀', icon: Timer, role: 'tenant' },
  { path: '/admin/coupons', title: '优惠券', icon: Discount, role: 'tenant' },
  { path: '/admin/points', title: '积分规则', icon: Coin, role: 'tenant' },
  { path: '/admin/groupon', title: '拼团活动', icon: Present, role: 'tenant' },
  { path: '/admin/distribution', title: '分销管理', icon: Share, role: 'tenant' },
  { path: '/admin/delivery', title: '配送设置', icon: Box, role: 'tenant' },
  { path: '/admin/site', title: '商城装修', icon: Brush, role: 'tenant' },
  { path: '/admin/settings/payment', title: '收款配置', icon: Wallet, role: 'tenant' },
  { path: '/admin/settings/carriers', title: '物流承运商', icon: Van, role: 'tenant' },
  { path: '/admin/billing', title: '订阅付费', icon: Money, role: 'tenant' },
]

const menus = computed(() =>
  allMenus.filter((m) => {
    if (m.role !== user.role) return false
    if (m.role === 'platform' && m.platformRoles) {
      const r = user.admin?.role || ''
      if (!m.platformRoles.includes(r)) return false
    }
    return true
  }),
)
const currentTitle = computed(() => (route.meta.title as string) || '')

function handleCmd(cmd: string) {
  if (cmd === 'logout') {
    user.logout()
    router.replace('/login')
  }
}
void iconMap
</script>

<style scoped lang="scss">
.layout {
  height: 100vh;
}
.sidebar {
  background: #001529;
  color: #fff;
  .logo {
    height: 60px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 16px;
    font-weight: 600;
    color: #fff;
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  }
  :deep(.el-menu) {
    border-right: none;
  }
}
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #fff;
  box-shadow: 0 1px 4px rgba(0, 21, 41, 0.08);
  .title {
    margin-left: 12px;
    font-size: 16px;
    font-weight: 500;
  }
  .user {
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 4px;
  }
}
.main {
  padding: 16px;
  background: #f0f2f5;
}
</style>
