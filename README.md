<div align="center">

# MCCAG HTTP API

_Minecraft Cute Avatar Generator Api_  
_使用 API 轻松生成个性化的 Minecraft 头像_

[![Docker](https://img.shields.io/badge/docker-%230db7ed.svg)](https://github.com/users/YOUR_USERNAME/packages/container/package/minecraft-cute-avatar-generator-api)
[![Node.js](https://img.shields.io/badge/node.js-6DA55F)](https://nodejs.org/)
[![License](https://img.shields.io/badge/License-GPL%20v3-blue.svg)](https://www.gnu.org/licenses/gpl-3.0)

**[接口文档](#api-接口文档)**

**[公用 API 列表](#快速开始)**

</div>

基于 Node.js 的 Minecraft 头像生成器 API 服务，内置智能缓存系统，提供毫秒级响应速度。

## 特性

- ✅ 完整的 Minecraft 头像渲染功能
- ✅ 多种渲染风格（简约、复古、侧面）
- ✅ 支持多种皮肤来源（Mojang、皮肤站、上传、URL）
- ✅ 支持 POST 和 GET 两种 API 调用方式
- ✅ 智能背景生成（根据参数自动决定透明或带背景）
- ✅ 可自定义生成选项和背景样式
- ✅ 文件大小限制和类型验证
- ✅ 完整的错误处理和日志记录
- ⚡ 智能缓存系统（内存+磁盘双层缓存，大幅提升响应速度）
- 🐳 Docker 支持，一键部署
- 🚀 GitHub Actions 自动构建镜像

## 项目结构

```text
├── Server.js              # 主服务器文件
├── Scripts/
│   ├── Network.js         # 网络请求模块
│   ├── Logger.js          # 日志格式化工具
│   ├── Index.js           # 入口文件
│   ├── Data.js            # 皮肤数据定义
│   ├── Image.js           # 图像处理工具
│   ├── Cache.js           # 缓存系统模块
│   ├── Minimal.js         # 简约风格渲染器
│   ├── Vintage.js         # 复古风格渲染器
│   └── Side.js            # 侧面风格渲染器
├── Config.js              # 配置文件
├── CACHE_README.md        # 缓存系统详细文档
└── README.md              # 项目说明
```

## 快速开始

### 🙏 使用公用 API

**感谢所有提供公用 API 的贡献者！同时也希望使用者不要滥用，让我们共同构建一个和谐互助的社区环境！**

> 若你也想贡献，可以提出 Issue 或者直接 Pr 我们将会收录到这里。

收录顺序按时间排列，以下为收录的 API 列表：

- https://x.xzt.plus/ 提供者 [LoosePrince](https://github.com/LoosePrince)

> [!WARNING]
> 但同时，这些 API 由贡献者提供，作者无法保证其可用性，并且对于其带来的所有问题都与作者无关。但无论如何，都感谢贡献者们的贡献。

### 🐳 Docker 部署

使用 Docker 是最简单的部署方式，无需安装 Node.js 和系统依赖：

```bash
# 拉取最新镜像
docker pull ghcr.io/mccag/mccag-v3-api:latest

# 运行容器
docker run -d \
  --name minecraft-avatar-api \
  -p 3000:3000 \
  ghcr.io/YOUR_USERNAME/minecraft-cute-avatar-generator-api:latest

# 检查服务状态
curl http://localhost:3000/health
```

### 📦 本地开发

如果你想本地开发或自定义部署：

#### 安装依赖

```bash
pnpm install
```

#### Canvas 安装问题解决方案

如果 Canvas 安装失败，请根据你的系统安装相应依赖：

##### macOS

```bash
# 使用 Homebrew 安装系统依赖
brew install pkg-config cairo pango libpng jpeg giflib librsvg pixman

# 然后重新安装
pnpm install
```

##### Ubuntu/Debian

```bash
# 安装系统依赖
sudo apt-get install build-essential libcairo2-dev libpango1.0-dev libjpeg-dev libgif-dev librsvg2-dev

# 然后重新安装
pnpm install
```

##### Windows

- 推荐使用 WSL2 或 Docker 运行项目
- 或者安装 Visual Studio Build Tools

#### 启动服务器

```bash
# 生产环境
pnpm start

# 开发环境
pnpm run dev
```

## API 接口文档

> **安全提示**: 如果设置了 `API_TOKEN` 环境变量，所有 API 请求都需要在请求头中包含 `Authorization: <token>`。

### 1. 健康检查

检查服务器运行状态。

#### 请求

```http
GET /health
Authorization: Bearer <token>  # 仅在设置了 API_TOKEN 或 CACHE_API_TOKEN 时需要
```

#### 响应

```json
{
  "status": "ok",
  "version": "1.0.1",
  "message": "Minecraft 头像生成器服务运行正常！",
  "uptime": "15分32秒",
  "memory": {
    "used": "45MB",
    "total": "128MB"
  },
  "cache": {
    "diskFiles": 45,
    "diskSize": "2MB",
    "memoryItems": 12
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

---

### 2. 生成头像

生成 Minecraft 头像图片，支持带背景或透明背景。

> [!TIP]
> 有两种方式可以生成头像，你可以根据自己的需求来选择。
>
> 但请注意只有 POST 支持所有获取皮肤的方法，而 GET 不支持 Upload 上传皮肤的方式。

#### POST

##### 请求

```http
POST /api/generate
Content-Type: application/json 或 multipart/form-data
Authorization: Bearer <token>  # 仅在设置了 API_TOKEN 时需要
```

##### 参数

| 参数名              | 类型          | 必填     | 说明                                               |
| ------------------- | ------------- | -------- | -------------------------------------------------- |
| `method`            | string        | ✅       | 皮肤获取方式：`mojang`、`website`、`upload`、`url` |
| `username`          | string        | 条件必填 | 玩家用户名（mojang/website 模式时必填）            |
| `website`           | string        | 条件必填 | 皮肤站地址（website 模式时必填，不含 https://）    |
| `skin`              | file          | 条件必填 | 皮肤文件（upload 模式时必填，最大 2MB）            |
| `skinUrl`           | string        | 条件必填 | 皮肤图片链接（url 模式时必填）                     |
| `modelType`         | string        | ❌       | 模型类型，默认 `minimal`                           |
| `generateOptions`   | string/object | ❌       | 生成选项（JSON 字符串或对象）                      |
| `backgroundOptions` | string/object | ❌       | 背景选项（JSON 字符串或对象，为空时生成透明背景）  |

##### generateOptions 参数

| 参数名    | 类型    | 默认值    | 说明                                                |
| --------- | ------- | --------- | --------------------------------------------------- |
| `type`    | string  | `head`    | 生成类型：`head`、`half`、`full`（仅 minimal 模式） |
| `scale`   | number  | `100`     | 图片缩放比例：50-200                                |
| `shadow`  | number  | `50`      | 阴影深度：0-100                                     |
| `texture` | boolean | `true`    | 是否启用纹理（仅 side 模式）                        |
| `color`   | string  | `#FFFFFF` | 边框颜色（仅 vintage 模式）                         |
| `border`  | number  | `1`       | 边框粗细：0-50（仅 vintage 模式）                   |

##### backgroundOptions 参数

| 参数名     | 类型   | 默认值                   | 说明                               |
| ---------- | ------ | ------------------------ | ---------------------------------- |
| `angle`    | number | `45`                     | 渐变角度：0-360                    |
| `colors`   | array  | `["#87CEEB", "#FFB6C1"]` | 背景颜色数组                       |
| `stripes`  | number | `5`                      | 条纹数量（仅 vintage 模式）        |
| `vignette` | number | `30`                     | 暗角强度：0-100（仅 vintage 模式） |
| `image`    | object | `null`                   | 自定义背景图片                     |

> 若未填写 `backgroundOptions` 参数，则默认不生成背景。GET 请求同理。

##### 响应

- **成功**: 返回 PNG 图片文件（Content-Type: image/png）
- **失败**: 返回 JSON 错误信息

---

#### GET

通过 URL 参数快速生成头像，适合直接在浏览器中访问或嵌入到网页中。

##### 请求

```http
GET /api/generate/{modelType}/{method}/{username}
Authorization: Bearer <token>  # 仅在设置了 API_TOKEN 时需要
```

##### 路径参数

| 参数名      | 类型   | 必填 | 说明                                     |
| ----------- | ------ | ---- | ---------------------------------------- |
| `modelType` | string | ✅   | 模型类型：`minimal`、`vintage`、`side`   |
| `method`    | string | ✅   | 皮肤获取方式：`mojang`、`website`、`url` |
| `username`  | string | ✅   | 玩家用户名（url 模式时此参数被忽略）     |

##### 查询参数

| 参数名     | 类型   | 默认值                   | 说明                                                   |
| ---------- | ------ | ------------------------ | ------------------------------------------------------ |
| `scale`    | number | `100`                    | 图片缩放比例：50-200                                   |
| `shadow`   | number | `50`                     | 阴影深度：0-100                                        |
| `texture`  | string | `true`                   | 是否启用纹理：`true`/`false`（仅 side 模式）           |
| `color`    | string | `#FFFFFF`                | 边框颜色（仅 vintage 模式）                            |
| `border`   | number | `1`                      | 边框粗细：0-50（仅 vintage 模式）                      |
| `type`     | string | `head`                   | 生成类型：`head`、`half`、`full`（仅 minimal 模式）    |
| `skinUrl`  | string | -                        | 皮肤图片链接（仅 url 模式时必填）                      |
| `angle`    | number | `45`                     | 背景渐变角度：0-360（提供任一背景参数时生成背景）      |
| `colors`   | string | `["#87CEEB", "#FFB6C1"]` | 背景颜色数组 JSON 字符串（提供任一背景参数时生成背景） |
| `stripes`  | number | `5`                      | 条纹数量：1-20（提供任一背景参数时生成背景）           |
| `vignette` | number | `30`                     | 暗角强度：0-100（提供任一背景参数时生成背景）          |

##### 响应

- **成功**: 返回 PNG 图片文件（Content-Type: image/png）
- **失败**: 返回 JSON 错误信息

##### 示例

```bash
# 基础用法 - 生成透明背景头像
curl "http://localhost:3000/api/generate/minimal/mojang/Notch" --output avatar.png

# 带背景 - 提供背景参数时自动生成背景
curl "http://localhost:3000/api/generate/minimal/mojang/Notch?colors=[\"#FF6B6B\",\"#4ECDC4\"]&angle=90" --output avatar.png

# 自定义选项
curl "http://localhost:3000/api/generate/vintage/mojang/Notch?scale=150&border=20&color=#FF0000" --output avatar.png

# 使用皮肤URL
curl "http://localhost:3000/api/generate/side/url/ignored?skinUrl=https://example.com/skin.png&texture=false" --output avatar.png
```

---

### 3. 缓存管理

管理头像缓存系统，提供缓存统计、清理等功能。

#### 获取缓存统计

```http
GET /api/cache/stats
Authorization: Bearer <token>  # 需要 API_TOKEN 或 CACHE_API_TOKEN
```

**响应示例：**

```json
{
  "success": true,
  "data": {
    "diskCache": {
      "files": 45,
      "size": 2048576,
      "sizeFormatted": "2MB"
    },
    "memoryCache": {
      "items": 12,
      "maxItems": 100
    },
    "config": {
      "maxAge": 86400000,
      "maxSize": 104857600,
      "cleanupInterval": 3600000
    }
  }
}
```

#### 清空所有缓存

```http
DELETE /api/cache
Authorization: Bearer <token>  # 需要 API_TOKEN 或 CACHE_API_TOKEN
```

#### 手动触发缓存清理

```http
POST /api/cache/cleanup
Authorization: Bearer <token>  # 需要 API_TOKEN 或 CACHE_API_TOKEN
```

---

### 4. 获取支持的模型类型

获取所有支持的头像渲染模型及其配置选项。

#### 请求

```http
GET /api/models
Authorization: Bearer <token>  # 仅在设置了 API_TOKEN 时需要
```

#### 响应

```json
{
  "models": [
    {
      "type": "minimal",
      "name": "简约风格",
      "description": "灵感来源：噪音回放",
      "options": {
        "type": ["head", "half", "full"],
        "scale": { "min": 50, "max": 200, "default": 100 },
        "shadow": { "min": 0, "max": 100, "default": 50 }
      }
    },
    {
      "type": "vintage",
      "name": "复古风格",
      "description": "灵感来源：Minecraft Skin Avatar",
      "options": {
        "scale": { "min": 50, "max": 200, "default": 100 },
        "border": { "min": 0, "max": 50, "default": 10 },
        "color": "string"
      }
    },
    {
      "type": "side",
      "name": "侧面风格",
      "description": "灵感来源：Henry Packs",
      "options": {
        "scale": { "min": 50, "max": 200, "default": 100 },
        "shadow": { "min": 0, "max": 100, "default": 50 },
        "texture": { "type": "boolean", "default": true }
      }
    }
  ]
}
```

---

### 错误响应格式

所有接口的错误响应都遵循以下格式：

```json
{
  "success": false,
  "message": "错误信息"
}
```

#### 常见错误码

| HTTP 状态码 | 错误类型       | 说明                        |
| ----------- | -------------- | --------------------------- |
| 400         | 参数错误       | 缺少必填参数或参数格式错误  |
| 400         | 文件太大       | 上传的皮肤文件超过 2MB 限制 |
| 401         | 未授权访问     | 缺少或无效的 API 令牌       |
| 403         | 访问被拒绝     | API 令牌验证失败            |
| 404         | 玩家不存在     | 未找到指定的 Minecraft 玩家 |
| 404         | 接口不存在     | 请求的 API 路径不存在       |
| 500         | 生成头像失败   | 头像生成过程中发生错误      |
| 500         | 服务器内部错误 | 服务器内部发生未知错误      |

## 使用示例

### 基础示例

#### 1. 使用 Mojang 用户名生成头像（带背景）

```bash
# 无令牌验证
curl -X POST http://localhost:3000/api/generate \
  -H "Content-Type: application/json" \
  -d '{"method": "mojang", "username": "Notch", "modelType": "minimal"}' \
  --output avatar.png

# 带令牌验证
curl -X POST http://localhost:3000/api/generate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-api-token" \
  -d '{"method": "mojang", "username": "Notch", "modelType": "minimal"}' \
  --output avatar.png
```

#### 2. 使用皮肤站生成头像（无背景）

```bash
curl -X POST http://localhost:3000/api/generate \
  -H "Content-Type: application/json" \
  -d '{"method": "website", "username": "player", "website": "example.com", "modelType": "vintage"}' \
  --output avatar.png
```

#### 3. 上传皮肤文件生成头像（带背景）

```bash
curl -X POST http://localhost:3000/api/generate \
  -F "method=upload" \
  -F "modelType=side" \
  -F "backgroundOptions={\"colors\":[\"#FF6B6B\",\"#4ECDC4\"]}" \
  -F "skin=@skin.png" \
  --output avatar.png
```

#### 4. 使用皮肤 URL 生成头像

```bash
curl -X POST http://localhost:3000/api/generate \
  -H "Content-Type: application/json" \
  -d '{"method": "url", "skinUrl": "https://example.com/skin.png", "modelType": "minimal"}' \
  --output avatar.png
```

### 高级用法

#### 1. 自定义生成选项

```bash
curl -X POST http://localhost:3000/api/generate \
  -H "Content-Type: application/json" \
  -d '{
    "method": "mojang",
    "username": "Notch",
    "modelType": "minimal",
    "generateOptions": {
      "type": "full",
      "scale": 150,
      "shadow": 80
    }
  }' \
  --output avatar.png
```

#### 2. 自定义背景选项

```bash
curl -X POST http://localhost:3000/api/generate \
  -H "Content-Type: application/json" \
  -d '{
    "method": "mojang",
    "username": "Notch",
    "modelType": "minimal",
    "backgroundOptions": {
      "angle": 90,
      "colors": ["#FF6B6B", "#4ECDC4"]
    }
  }' \
  --output avatar.png
```

#### 3. Vintage 模式自定义边框

```bash
curl -X POST http://localhost:3000/api/generate \
  -H "Content-Type: application/json" \
  -d '{
    "method": "mojang",
    "username": "Notch",
    "modelType": "vintage",
    "generateOptions": {
      "scale": 120,
      "border": 15,
      "color": "#FF0000"
    },
    "backgroundOptions": {
      "stripes": 8,
      "vignette": 50
    }
  }' \
  --output avatar.png
```

#### 5. 生成透明背景头像

```bash
curl -X POST http://localhost:3000/api/generate \
  -H "Content-Type: application/json" \
  -d '{
    "method": "mojang",
    "username": "Notch",
    "modelType": "side",
    "generateOptions": {
      "scale": 200,
      "shadow": 30,
      "texture": false
    }
  }' \
  --output avatar_transparent.png
```

## 背景生成逻辑

API 会根据 `backgroundOptions` 参数自动决定是否生成背景：

### POST 模式

- **生成背景**: 当 `backgroundOptions` 包含任何属性时
- **透明背景**: 当 `backgroundOptions` 为空对象 `{}` 或未提供时

### GET 模式

- **生成背景**: 当 URL 中提供任何背景参数（`angle`、`colors`、`stripes`、`vignette`）时
- **透明背景**: 当 URL 中未提供任何背景参数时

### 示例对比

```bash
# 透明背景 - POST模式
curl -X POST http://localhost:3000/api/generate \
  -H "Content-Type: application/json" \
  -d '{"method": "mojang", "username": "Notch"}'

# 带背景 - POST模式
curl -X POST http://localhost:3000/api/generate \
  -H "Content-Type: application/json" \
  -d '{"method": "mojang", "username": "Notch", "backgroundOptions": {"colors": ["#FF6B6B"]}}'

# 透明背景 - GET模式
curl "http://localhost:3000/api/generate/minimal/mojang/Notch"

# 带背景 - GET模式
curl "http://localhost:3000/api/generate/minimal/mojang/Notch?colors=[\"#FF6B6B\"]"
```

## 缓存使用示例

### 缓存管理

```bash
# 查看缓存统计信息（无令牌）
curl http://localhost:3000/api/cache/stats

# 查看缓存统计信息（带令牌）
curl -H "Authorization: Bearer your-token" \
  http://localhost:3000/api/cache/stats

# 手动触发缓存清理（清理过期缓存）
curl -X POST \
  -H "Authorization: Bearer your-token" \
  http://localhost:3000/api/cache/cleanup

# 清空所有缓存
curl -X DELETE \
  -H "Authorization: Bearer your-token" \
  http://localhost:3000/api/cache

# 测试缓存系统
npm run test:cache
```

### 性能对比

```bash
# 第一次请求（缓存未命中）- 响应时间约 200-500ms
time curl "http://localhost:3000/api/generate/minimal/mojang/Notch" --output avatar1.png

# 第二次相同请求（缓存命中）- 响应时间约 5-20ms
time curl "http://localhost:3000/api/generate/minimal/mojang/Notch" --output avatar2.png
```

### 缓存配置示例

```bash
# 开发环境 - 禁用缓存
export CACHE_DISABLED=true
npm start

# 生产环境 - 自定义缓存配置
export CACHE_MAX_AGE=43200    # 12小时过期
export CACHE_MAX_SIZE=200     # 200MB磁盘缓存
export CACHE_MAX_MEMORY_ITEMS=200  # 200个内存缓存项
npm start
```

## 模型类型

- **Minimal**: 简约风格，灵感来源：噪音回放
- **Vintage**: 复古风格，灵感来源：Minecraft Skin Avatar
- **Side**: 侧面风格，灵感来源：Henry Packs

## 配置选项

### 环境变量

| 变量名                   | 默认值  | 说明                                   |
| ------------------------ | ------- | -------------------------------------- |
| `PORT`                   | `3000`  | 服务器监听端口                         |
| `API_TOKEN`              | -       | API 访问令牌，设置后所有接口都需要验证 |
| `CACHE_API_TOKEN`        | -       | 缓存接口专用令牌，仅对缓存接口有效     |
| `CACHE_DISABLED`         | -       | 设置为 `true` 禁用缓存系统             |
| `CACHE_MAX_AGE`          | `86400` | 缓存过期时间（秒）                     |
| `CACHE_MAX_SIZE`         | `100`   | 磁盘缓存最大大小（MB）                 |
| `CACHE_MAX_MEMORY_ITEMS` | `100`   | 内存缓存最大项目数                     |

### API 安全配置

为了保护你的 API 服务，可以设置访问令牌：

#### 全局 API 令牌

```bash
# 设置全局 API 令牌，所有接口都需要验证
export API_TOKEN="your-secret-token"
```

使用时需要在请求头中添加令牌：

```bash
# GET 请求
curl -H "Authorization: Bearer your-secret-token" \
  "http://localhost:3000/api/generate/minimal/mojang/Notch"

# POST 请求
curl -X POST \
  -H "Authorization: Bearer your-secret-token" \
  -H "Content-Type: application/json" \
  -d '{"method": "mojang", "username": "Notch"}' \
  http://localhost:3000/api/generate
```

#### 缓存接口专用令牌

```bash
# 仅对缓存管理接口设置令牌
export CACHE_API_TOKEN="your-cache-token"
```

> **注意**: 如果同时设置了 `API_TOKEN` 和 `CACHE_API_TOKEN`，缓存接口将优先使用 `API_TOKEN`。

### 完整配置文件

项目使用 `Config.js` 文件进行配置管理：

```javascript
export const config = {
  // 服务器配置
  port: 3000,

  // 安全配置
  apiToken: null, // 全局 API 令牌
  cacheApiToken: null, // 缓存接口专用令牌

  // 缓存开关
  cacheEnabled: true, // 是否启用缓存系统
  cacheEnableMemoryCache: true, // 是否启用内存缓存
  cacheEnableDiskCache: true, // 是否启用磁盘缓存

  // 缓存配置
  cacheDir: "./cache", // 缓存目录
  cacheMaxAge: 24 * 60 * 60 * 1000, // 缓存过期时间（24小时）
  cacheMaxSize: 100 * 1024 * 1024, // 磁盘缓存最大大小（100MB）
  cacheMaxMemoryItems: 100, // 内存缓存最大项目数
  cacheCleanupInterval: 60 * 60 * 1000, // 清理间隔（1小时）
};

// 环境变量自动覆盖配置
if (process.env.PORT) config.port = parseInt(process.env.PORT);
if (process.env.API_TOKEN) config.apiToken = process.env.API_TOKEN;
if (process.env.CACHE_API_TOKEN)
  config.cacheApiToken = process.env.CACHE_API_TOKEN;
if (process.env.CACHE_DISABLED === "true") config.cacheEnabled = false;
if (process.env.CACHE_MAX_AGE)
  config.cacheMaxAge = parseInt(process.env.CACHE_MAX_AGE) * 1000;
if (process.env.CACHE_MAX_SIZE)
  config.cacheMaxSize = parseInt(process.env.CACHE_MAX_SIZE) * 1024 * 1024;
if (process.env.CACHE_MAX_MEMORY_ITEMS)
  config.cacheMaxMemoryItems = parseInt(process.env.CACHE_MAX_MEMORY_ITEMS);
```

#### 自定义配置示例

如果你需要修改默认配置，可以直接编辑 `Config.js` 文件：

```javascript
// 生产环境配置示例
export const config = {
  port: 8080,
  apiToken: "your-production-token",
  cacheEnabled: true,
  cacheMaxAge: 12 * 60 * 60 * 1000, // 12小时缓存
  cacheMaxSize: 200 * 1024 * 1024, // 200MB磁盘缓存
  cacheMaxMemoryItems: 200, // 200个内存缓存项
  cacheCleanupInterval: 30 * 60 * 1000, // 30分钟清理一次
};

// 开发环境配置示例
export const config = {
  port: 3000,
  apiToken: null, // 开发环境不需要令牌
  cacheEnabled: false, // 开发时禁用缓存便于调试
};
```

### 缓存系统配置

缓存系统提供了灵活的配置选项：

#### 缓存类型控制

```bash
# 仅启用内存缓存（重启后丢失，但速度最快）
export CACHE_ENABLE_MEMORY_CACHE=true
export CACHE_ENABLE_DISK_CACHE=false

# 仅启用磁盘缓存（持久化，但速度较慢）
export CACHE_ENABLE_MEMORY_CACHE=false
export CACHE_ENABLE_DISK_CACHE=true

# 双层缓存（推荐，兼顾速度和持久化）
export CACHE_ENABLE_MEMORY_CACHE=true
export CACHE_ENABLE_DISK_CACHE=true
```

#### 缓存大小和时间控制

```bash
# 设置缓存过期时间为12小时
export CACHE_MAX_AGE=43200

# 设置磁盘缓存最大为200MB
export CACHE_MAX_SIZE=200

# 设置内存缓存最多存储200个项目
export CACHE_MAX_MEMORY_ITEMS=200
```

### 配置示例

#### 开发环境配置

```bash
# 开发环境 - 禁用缓存，便于调试
export PORT=3000
export CACHE_DISABLED=true
export NODE_ENV=development

# 启动开发服务器
pnpm run dev
```

#### 生产环境配置

```bash
# 生产环境 - 启用安全令牌和优化缓存
export PORT=3000
export API_TOKEN="your-production-secret-token"
export CACHE_MAX_AGE=43200        # 12小时缓存
export CACHE_MAX_SIZE=200         # 200MB磁盘缓存
export CACHE_MAX_MEMORY_ITEMS=200 # 200个内存缓存项
export NODE_ENV=production

# 启动生产服务器
pnpm start
```

#### 高性能配置

```bash
# 高性能环境 - 大容量缓存配置
export PORT=3000
export CACHE_MAX_AGE=86400        # 24小时缓存
export CACHE_MAX_SIZE=500         # 500MB磁盘缓存
export CACHE_MAX_MEMORY_ITEMS=500 # 500个内存缓存项
export CACHE_CLEANUP_INTERVAL=1800 # 30分钟清理一次

pnpm start
```

#### 安全配置

```bash
# 安全环境 - 分离令牌管理
export PORT=3000
export API_TOKEN="main-api-secret-token"
export CACHE_API_TOKEN="cache-management-token"

pnpm start
```

#### Docker 环境配置

```bash
# Docker 部署配置
docker run -d \
  --name minecraft-avatar-api \
  -p 3000:3000 \
  -e API_TOKEN="your-docker-token" \
  -e CACHE_MAX_SIZE=300 \
  -e CACHE_MAX_AGE=86400 \
  --restart unless-stopped \
  ghcr.io/YOUR_USERNAME/minecraft-cute-avatar-generator-api:latest
```

## 安全配置

### 🔐 API 令牌验证

为了保护你的 API 服务免受未授权访问，可以配置访问令牌：

#### 全局令牌保护

```bash
# 设置全局 API 令牌
export API_TOKEN="your-secret-token-here"
```

设置后，所有 API 接口都需要在请求头中包含令牌：

```bash
curl -H "Authorization: Bearer your-secret-token-here" \
  "http://localhost:3000/api/generate/minimal/mojang/Notch"
```

#### 缓存接口专用令牌

```bash
# 仅对缓存管理接口设置令牌
export CACHE_API_TOKEN="your-cache-management-token"
```

这样可以将缓存管理权限与普通 API 使用权限分离。

#### 令牌优先级

- 如果同时设置了 `API_TOKEN` 和 `CACHE_API_TOKEN`，缓存接口将优先验证 `API_TOKEN`
- 如果只设置了 `CACHE_API_TOKEN`，则只有缓存接口需要验证令牌
- 如果都没设置，则所有接口都无需验证

#### 安全建议

- 使用强随机字符串作为令牌（建议 32 位以上）
- 定期更换令牌
- 在生产环境中务必设置令牌保护
- 不要在代码中硬编码令牌，使用环境变量

```bash
# 生成安全令牌示例
openssl rand -hex 32
# 或者
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## 缓存系统

### ⚡ 性能提升

启用缓存后，API 性能将显著提升：

- **响应速度**: 缓存命中时从几百毫秒降低到几毫秒
- **服务器负载**: 减少重复的图像生成计算
- **网络带宽**: 减少重复的皮肤下载请求
- **用户体验**: 常用头像几乎瞬间加载

### 🔧 缓存架构

- **内存缓存**: 使用 Map 存储最近访问的头像，提供毫秒级访问速度
- **磁盘缓存**: 持久化存储，服务重启后仍然有效
- **智能管理**: 自动过期清理、大小限制、LRU 策略

### 📊 缓存监控

通过以下方式监控缓存状态：

```bash
# 查看缓存统计
curl http://localhost:3000/api/cache/stats

# 查看服务健康状态（包含缓存信息）
curl http://localhost:3000/health

# 手动清理缓存
curl -X POST http://localhost:3000/api/cache/cleanup

# 清空所有缓存
curl -X DELETE http://localhost:3000/api/cache
```

### 📖 详细文档

更多缓存系统的详细信息，请参考 [CACHE_README.md](./CACHE_README.md)

## 部署

### 🐳 Docker 部署

#### 使用预构建镜像（推荐）

每次发布新版本时，GitHub Actions 会自动构建并推送 Docker 镜像到 GitHub Container Registry：

```bash
# 拉取最新版本
docker pull ghcr.io/mccag/mccag-v3-api:latest

# 或拉取指定版本
docker pull ghcr.io/mccag/mccag-v3-api:v1.0.1

# 运行容器
docker run -d \
  --name minecraft-avatar-api \
  -p 3000:3000 \
  --restart unless-stopped \
  ghcr.io/YOUR_USERNAME/minecraft-cute-avatar-generator-api:latest
```

#### 自定义构建

如果你需要自定义构建：

```bash
# 克隆仓库
git clone https://github.com/YOUR_USERNAME/minecraft-cute-avatar-generator-api.git
cd minecraft-cute-avatar-generator-api

# 构建镜像
docker build -t minecraft-avatar-api .

# 运行容器
docker run -d \
  --name minecraft-avatar-api \
  -p 3000:3000 \
  --restart unless-stopped \
  minecraft-avatar-api
```

#### Docker Compose

创建 `docker-compose.yml`：

```yaml
version: "3.8"

services:
  minecraft-avatar-api:
    image: ghcr.io/YOUR_USERNAME/minecraft-cute-avatar-generator-api:latest
    container_name: minecraft-avatar-api
    ports:
      - "3000:3000"
    restart: unless-stopped
    environment:
      - NODE_ENV=production
      - PORT=3000
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
```

运行：

```bash
docker-compose up -d
```

### 🚀 自动化部署

项目包含 GitHub Actions workflow，会在以下情况自动构建 Docker 镜像：

- 创建新的 Release 时
- 支持多架构构建（amd64/arm64）
- 自动推送到 GitHub Container Registry
- 生成多种版本标签

#### 发布新版本

1. 更新 `package.json` 中的版本号
2. 提交并推送代码
3. 在 GitHub 上创建新的 Release
4. GitHub Actions 会自动构建并推送 Docker 镜像

### 🔧 传统部署

如果你不使用 Docker，也可以直接在服务器上部署：

```bash
# 安装 Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 安装系统依赖
sudo apt-get install build-essential libcairo2-dev libpango1.0-dev libjpeg-dev libgif-dev librsvg2-dev

# 克隆项目
git clone https://github.com/YOUR_USERNAME/minecraft-cute-avatar-generator-api.git
cd minecraft-cute-avatar-generator-api

# 安装依赖
npm install -g pnpm
pnpm install

# 启动服务
pnpm start
```

### 🔍 健康检查

部署完成后，可以通过以下方式检查服务状态：

```bash
# 检查服务健康状态（包含缓存信息）
curl http://localhost:3000/health

# 测试头像生成
curl "http://localhost:3000/api/generate/minimal/mojang/Notch" --output test-avatar.png

# 检查缓存统计
curl http://localhost:3000/api/cache/stats

# 测试缓存系统
npm run test:cache
```
