# go-shoppings-admin

SaaS 微信商城 · 管理后台（Vue 3 + Vite + TypeScript + Element Plus + Pinia）。  
两端合一：**平台端**（超级管理员）与**商户端**（租户管理员）同一工程，按登录角色切换路由。

## 目录结构

```text
src/
  api/          axios 封装 + 业务 API（auth/platform/product/order）
  layout/       通用后台布局（侧边栏 + 头部 + 主区）
  router/       路由 + 登录守卫 + 角色守卫
  stores/       Pinia（用户会话，持久化到 localStorage）
  styles/       全局样式
  views/
    login/      登录页（平台/商户 Tab）
    platform/   平台：Dashboard、租户审核
    admin/      商户：商品 CRUD、订单列表/发货
```

## 已对接的后端接口

- `POST /api/v1/platform/auth/login` 平台登录
- `POST /api/v1/admin/auth/login`   商户登录（带 `X-Tenant-ID`）
- `GET  /api/v1/platform/dashboard` 平台概览
- `GET  /api/v1/platform/tenants`   租户列表（分页+搜索+状态）
- `POST /api/v1/platform/tenants/:id/audit` 审核通过/拒绝
- `GET/POST/PUT/PATCH/DELETE /api/v1/admin/products` 商品
- `GET  /api/v1/admin/categories` 分类
- `GET  /api/v1/admin/orders` 订单列表 + `/:id/ship` 发货

## 启动

```bash
# 1. 安装依赖（推荐 pnpm；npm/yarn 亦可）
pnpm install      # 或 npm install

# 2. 默认后端地址为公网 IP http://39.96.201.126
#    开发环境请求 /api/v1，并由 Vite 代理到 http://39.96.201.126
#    如需临时改用其他后端，可设置代理目标：
#    VITE_API_PROXY_TARGET=http://127.0.0.1:8080 npm run dev
# 3. 启动开发服务器（默认 5173）
pnpm dev
```

## 默认账号

- 平台：`admin` / `admin123`
- 商户：租户编号 `TEST001`，账号 `smokeadmin22` / `admin123`（绑定种子数据内置租户 `测试商城`）

## 构建

```bash
pnpm build
# 产物输出到 dist/，可被任意静态服务器或反向代理托管
```

生产构建默认直连 `http://39.96.201.126/api/v1`。如需覆盖，可设置：

```bash
VITE_API_BASE_URL=https://api.example.com/api/v1 pnpm build
```

## 部署

Admin 可通过 GitHub Actions 构建 Docker 镜像、推送到华为云 SWR，并在与 backend 相同的服务器上用镜像部署。详见 [DEPLOYMENT.md](DEPLOYMENT.md)。
