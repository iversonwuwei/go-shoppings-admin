# Admin GitHub Actions CI/CD

Admin 使用 GitHub Actions 构建静态前端镜像，推送到华为云 SWR，然后在服务器上用 Docker Compose 拉取镜像并运行。流程与 backend 保持同一套服务器、SWR 与 SSH secrets，但 admin 使用独立运行目录，避免 backend 部署清理运行时文件时影响前端。

## Pipeline stages

| Stage | Trigger | Gate | Description |
| --- | --- | --- | --- |
| Verify admin | Pull request, push to `master`, manual run | Required | 安装 npm 依赖、执行 `npm run build`、构建 admin Docker 镜像。 |
| Publish SWR image | Push to `master`, manual run | Depends on verify | 登录华为云 SWR，构建 admin 生产镜像并推送 `${GITHUB_SHA}` 与 `latest` 标签。 |
| Deploy admin service | Push to `master`, manual run | Depends on publish | 通过 SSH 同步最小运行时部署工件，登录 SWR，在服务器拉取 admin 镜像并启动容器，最后检查容器健康接口与公网 Nginx 路由。 |

只有 admin 相关文件变更才触发流水线，包括源码、Vite/TypeScript 配置、Dockerfile、Compose 文件、Nginx 静态站点配置和 workflow。未通过验证不会发布或部署。部署并发按分支串行执行，避免同一目标环境被多个 workflow 同时更新。

## Runtime layout

服务器不保存 admin 源码，也不在服务器本机构建镜像。GitHub Actions 只在服务器保存运行时部署文件：

```text
docker-compose.deploy.yml
.deploy-images.env
```

默认部署目录已与当前 backend 生产部署保持一致：backend 默认目录为 `/root/docker-compose/go-shoppings`，admin 默认使用 `/root/docker-compose/go-shoppings-admin`。如需调整，应修改 workflow 中的固定部署路径后重新提交。

admin 容器名为 `wechat-mall-admin`，Compose 项目名为 `go-shoppings-admin`。容器内部由 Nginx 提供静态 SPA，并暴露 `/healthz` 用于健康检查；默认宿主机端口为 `ADMIN_HOST_PORT=18081`，公网访问优先走公共 Nginx 的 80 端口反代。生产构建默认使用：

```text
VITE_API_BASE_URL=http://39.96.201.126/api/v1
```

域名备案完成后，可把 `.env.production` 或 `ADMIN_VITE_API_BASE_URL` 调整为正式 HTTPS API 域名后重新构建发布。

## Public IP routing

当前 `api.go-shoppings.cn` 仍在备案中，因此 admin 暂时通过公网 IP 访问。admin workflow 会在服务器现有公网 Nginx 配置中维护一个受标记管理的 HTTP 入口：

- `http://<DEPLOY_HOST>/` 转发到 `wechat-mall-admin`。
- `http://<DEPLOY_HOST>/api/`、`/uploads/`、`/healthz` 继续转发到 backend gateway `wechat-mall-gateway`。
- `http://<DEPLOY_HOST>/admin-healthz` 转发到 admin 容器健康检查。

该步骤默认使用服务器现有公共 Nginx：

```text
container: go-nomads-nginx
config: /root/docker-compose/deployment/nginx/nginx.https.conf
```

如服务器路径或容器名变化，应修改 workflow 中的固定 Nginx 容器名和配置路径后重新提交。workflow 会在修改配置前备份原文件，并使用 `nginx -t` 验证后热加载。

## GitHub Actions secrets

生产部署推荐配置在仓库 `Settings -> Environments -> production -> Environment secrets`。workflow 的发布和部署 job 都声明了 `production` Environment，后续可直接加审批、保护分支或环境级密钥隔离。

当前 GitHub token 无法通过 API 创建 `production` Environment，已先把必需值创建为 repository Actions secrets，workflow 仍可读取这些值。后续在 GitHub UI 中创建 `production` Environment 后，可把同名 secrets 复制到 Environment secrets；Environment secrets 会更符合生产治理要求。

admin workflow 已固定当前 backend 的非敏感默认值：服务器 `39.96.201.126`、SSH 用户 `root`、SSH 端口 `22`、backend 部署目录 `/root/docker-compose/go-shoppings`、admin 部署目录 `/root/docker-compose/go-shoppings-admin`、SWR registry `swr.ap-southeast-3.myhuaweicloud.com`、SWR namespace `go-shoppings`、admin 镜像仓库 `wechat-mall-admin`。这些值不是密钥，默认不放进 secrets；如需以后支持多环境切换，可再改为 Environment variables。

当前已为 admin 仓库创建以下 repository Actions secrets，可作为 Environment secrets 创建前的 fallback：

```text
DEPLOY_SSH_KEY
HUAWEI_SWR_USERNAME
HUAWEI_SWR_PASSWORD
```

`DEPLOY_SSH_KEY` 使用了专用部署密钥。部署前还需要把对应公钥追加到服务器 `root` 用户的 `~/.ssh/authorized_keys`，本机公钥路径为：

```text
~/.ssh/go_shoppings_admin_deploy_ed25519.pub
```

| Secret | Required | Description |
| --- | --- | --- |
| `DEPLOY_SSH_KEY` | Yes | 可登录服务器的私钥。 |
| `HUAWEI_SWR_USERNAME` | Yes | SWR 登录用户名。 |
| `HUAWEI_SWR_PASSWORD` | Yes | SWR 登录密码/登录密钥。 |

只有这三个需要作为 secrets，因为它们是敏感值。其他部署参数当前都是非敏感固定值；如需更换服务器、目录、端口、SWR registry/namespace 或 admin 镜像仓库名，应先修改 workflow 中的固定默认值，再重新提交触发部署，或后续统一改为 Environment variables。

## Local verification

提交前建议执行：

```bash
npm ci
npm run build
docker build -t wechat-mall-admin:local .
ADMIN_IMAGE=wechat-mall-admin:local docker compose -f docker-compose.deploy.yml config --quiet
```

本地验证容器：

```bash
ADMIN_IMAGE=wechat-mall-admin:local docker compose -f docker-compose.deploy.yml up -d admin
docker compose -f docker-compose.deploy.yml exec -T admin wget -qO- http://127.0.0.1/healthz
```

## Rollback

如果部署后健康检查失败，workflow 会停止并输出容器日志。回滚时可将 `.deploy-images.env` 中的 `ADMIN_IMAGE` 改回上一可用镜像标签，然后在 admin 部署目录执行：

```bash
docker compose --env-file .deploy-images.env -f docker-compose.deploy.yml pull admin
docker compose --env-file .deploy-images.env -f docker-compose.deploy.yml up -d --no-build admin
docker compose --env-file .deploy-images.env -f docker-compose.deploy.yml exec -T admin wget -qO- http://127.0.0.1/healthz </dev/null
```
