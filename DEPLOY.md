# 部署指南

> 适用:中国大陆服务器上线(需 ICP 备案,备案流程见「考研工作台-产品方案.md」第 8 节)

## 1. 前置准备

- 服务器:阿里云/腾讯云轻量应用服务器(2核2G 起步),系统 Ubuntu 22.04+
- 域名 + 已提交 ICP 备案(备案通过前网站必须关闭)
- 准备事项:域名解析到服务器 IP、云厂商安全组放行 80/443 端口

## 2. 服务器安装

```bash
# Node.js 20+(推荐 22 LTS)
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs git nginx postgresql

# 启动 PostgreSQL 并创建数据库
sudo -u postgres psql -c "CREATE USER kaoyan WITH PASSWORD '换成强密码';"
sudo -u postgres psql -c "CREATE DATABASE kaoyan OWNER kaoyan;"
```

## 3. 部署代码

```bash
cd /var/www
git clone <你的仓库地址> kaoyan-desk   # 或直接上传项目目录
cd kaoyan-desk
npm ci --production=false

# 配置环境变量
cp .env.example .env
vi .env   # 填入 DATABASE_URL(PostgreSQL)+ SESSION_SECRET

# 数据库迁移(生产环境)
npx prisma migrate deploy
npx prisma generate

# 生产构建
npm run build
```

## 4. 进程守护(二选一)

**systemd**(推荐):
```ini
# /etc/systemd/system/kaoyan-desk.service
[Unit]
Description=Kaoyan Desk
After=network.target

[Service]
Type=simple
WorkingDirectory=/var/www/kaoyan-desk
ExecStart=/usr/bin/node node_modules/next/dist/bin/next start -p 3000
Restart=always
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now kaoyan-desk
```

## 5. Nginx 反向代理 + HTTPS

```nginx
# /etc/nginx/sites-available/kaoyan-desk
server {
    listen 80;
    server_name peishangan.cn;
    client_max_body_size 10m;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/kaoyan-desk /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx

# HTTPS 证书(免费,Let's Encrypt)
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d peishangan.cn
```

## 6. 上线后检查清单

- [ ] 网站底部展示 ICP 备案号 + 公安备案号
- [ ] `SESSION_SECRET` 已改为随机长字符串
- [ ] 数据库每日备份(建议 cron:`pg_dump` 定时备份到异地)
- [ ] 手机浏览器打开站点 → 可"添加到主屏幕"(PWA 生效)

## 7. 数据迁移(SQLite → PostgreSQL)

开发期数据在 `dev.db`,上线前迁移:

```bash
# 1. 本地导出
#    登录网页 → 设置 → 导出数据(JSON)
# 2. 部署到服务器后,如需要历史数据,可用脚本导入(后续迭代提供)
```

## 8. AI 功能配置(可选)

不配置 AI 功能不影响其他功能(统计页 AI 周报按钮、错题本拍照识别会自动提示未配置)。

| 用途 | 推荐服务 | 获取方式 | 环境变量 |
|---|---|---|---|
| AI 周报(文本) | DeepSeek | [platform.deepseek.com](https://platform.deepseek.com) 注册 → API Keys 创建 | `AI_API_KEY` |
| 错题图片识别(视觉) | 阿里云百炼 qwen-vl-plus | [bailian.console.aliyun.com](https://bailian.console.aliyun.com) 开通模型服务 → API-KEY 管理创建 | `AI_VISION_API_KEY` |

```bash
vi .env
# 填入后重启服务
sudo systemctl restart kaoyan-desk
```

费用参考:DeepSeek 一次周报约几百 tokens(几分钱);qwen-vl-plus 识别一张图约几厘钱。新用户均有免费额度,日常使用成本几乎可忽略。

**成本控制(内置配额)**:每个用户每天 AI 周报 3 次、错题识别 20 张(数据库按天记录,用完提示次日恢复)。以 1000 日活用户全部用满计算,日成本约 3~10 元;实际使用率远低于此。配额可用环境变量调整:`AI_REPORT_DAILY_LIMIT` / `AI_OCR_DAILY_LIMIT`。后续如需接入广告解锁额外次数,只需扩展配额逻辑。

## 9. 回滚

```bash
# 保留上一版本目录,切换 systemd 的 WorkingDirectory 即可
```

## 附:切换 PostgreSQL 的注意事项

- 修改 `prisma/schema.prisma` 的 `datasource db { provider = "postgresql" }`
- `npm install @prisma/adapter-pg pg`(当前 SQLite adapter 换为 pg)
- `src/lib/prisma.ts` 中 adapter 创建改为 `new PrismaPg({ connectionString })`
- 重新 `npx prisma migrate dev`(本地)/ `npx prisma migrate deploy`(生产)
