# MCCAG HTTP API

基于 Node.js 的 Minecraft 头像生成器 API 服务。

## 特性

- ✅ 完整的 Minecraft 头像渲染功能
- ✅ 多种渲染风格（简约、复古、侧面）
- ✅ 支持多种皮肤来源（Mojang、皮肤站、上传）
- ✅ 可自定义生成选项和背景
- ✅ 文件大小限制和类型验证
- ✅ 内存存储，不写入磁盘
- ✅ 完整的错误处理和日志记录

## 项目结构

```text
├── Server.js              # 主服务器文件
├── Scripts/
│   ├── Network.js         # 网络请求模块
│   ├── Renderers/         # 渲染器模块
│   ├── Index.js           # 入口文件
│   ├── Data.js            # 皮肤数据定义
│   ├── Image.js           # 图像处理工具
│   ├── Minimal.js         # 简约风格渲染器
│   ├── Vintage.js         # 复古风格渲染器
│   └── Side.js            # 侧面风格渲染器
└── README.md              # 项目说明
```

## 安装依赖

```bash
pnpm install
```

### Canvas 安装问题解决方案

如果 Canvas 安装失败，请根据你的系统安装相应依赖：

**macOS:**

```bash
# 使用 Homebrew 安装系统依赖
brew install pkg-config cairo pango libpng jpeg giflib librsvg pixman

# 然后重新安装
pnpm install
```

**Ubuntu/Debian:**

```bash
# 安装系统依赖
sudo apt-get install build-essential libcairo2-dev libpango1.0-dev libjpeg-dev libgif-dev librsvg2-dev

# 然后重新安装
pnpm install
```

**Windows:**

- 推荐使用 WSL2 或 Docker 运行项目
- 或者安装 Visual Studio Build Tools

## 启动服务器

```bash
# 生产环境
pnpm start

# 开发环境
pnpm run dev
```

## API 接口文档

### 1. 健康检查

检查服务器运行状态。

**请求**

```http
GET /health
```

**响应**

```json
{
  "status": "ok",
  "message": "Minecraft 头像生成器服务运行正常！"
}
```

---

### 2. 生成头像

生成 Minecraft 头像图片，支持带背景或透明背景。

**请求**

```http
POST /api/generate
Content-Type: application/json 或 multipart/form-data
```

**参数**

| 参数名              | 类型          | 必填     | 说明                                                             |
| ------------------- | ------------- | -------- | ---------------------------------------------------------------- |
| `method`            | string        | ✅       | 皮肤获取方式：`mojang`、`website`、`upload`                      |
| `username`          | string        | 条件必填 | 玩家用户名（mojang/website 模式时必填）                          |
| `website`           | string        | 条件必填 | 皮肤站地址（website 模式时必填，不含 https://）                  |
| `skin`              | file          | 条件必填 | 皮肤文件（upload 模式时必填，最大 2MB）                          |
| `modelType`         | string        | ❌       | 模型类型，默认 `minimal`                                         |
| `withBackground`    | boolean       | ❌       | 是否生成背景，默认 `true`                                        |
| `generateOptions`   | string/object | ❌       | 生成选项（JSON 字符串或对象）                                    |
| `backgroundOptions` | string/object | ❌       | 背景选项（JSON 字符串或对象，仅当 `withBackground=true` 时有效） |

**generateOptions 参数**

| 参数名    | 类型    | 默认值    | 说明                                                |
| --------- | ------- | --------- | --------------------------------------------------- |
| `type`    | string  | `head`    | 生成类型：`head`、`half`、`full`（仅 minimal 模式） |
| `scale`   | number  | `100`     | 图片缩放比例：50-200                                |
| `shadow`  | number  | `50`      | 阴影深度：0-100                                     |
| `texture` | boolean | `true`    | 是否启用纹理（仅 side 模式）                        |
| `color`   | string  | `#FFFFFF` | 边框颜色（仅 vintage 模式）                         |
| `border`  | number  | `1`       | 边框粗细：0-50（仅 vintage 模式）                   |

**backgroundOptions 参数**

| 参数名     | 类型   | 默认值                   | 说明                               |
| ---------- | ------ | ------------------------ | ---------------------------------- |
| `angle`    | number | `45`                     | 渐变角度：0-360                    |
| `colors`   | array  | `["#87CEEB", "#FFB6C1"]` | 背景颜色数组                       |
| `stripes`  | number | `5`                      | 条纹数量（仅 vintage 模式）        |
| `vignette` | number | `30`                     | 暗角强度：0-100（仅 vintage 模式） |
| `image`    | object | `null`                   | 自定义背景图片                     |

**响应**

- **成功**: 返回 PNG 图片文件（Content-Type: image/png）
- **失败**: 返回 JSON 错误信息

---

### 3. 获取支持的模型类型

获取所有支持的头像渲染模型及其配置选项。

**请求**

```http
GET /api/models
```

**响应**

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

**常见错误码**

| HTTP 状态码 | 错误类型       | 说明                        |
| ----------- | -------------- | --------------------------- |
| 400         | 参数错误       | 缺少必填参数或参数格式错误  |
| 400         | 文件太大       | 上传的皮肤文件超过 2MB 限制 |
| 404         | 玩家不存在     | 未找到指定的 Minecraft 玩家 |
| 404         | 接口不存在     | 请求的 API 路径不存在       |
| 500         | 生成头像失败   | 头像生成过程中发生错误      |
| 500         | 服务器内部错误 | 服务器内部发生未知错误      |

## 使用示例

### 基础示例

#### 1. 使用 Mojang 用户名生成头像（带背景）

```bash
curl -X POST http://localhost:3000/api/generate \
  -H "Content-Type: application/json" \
  -d '{"method": "mojang", "username": "Notch", "modelType": "minimal"}' \
  --output avatar.png
```

#### 2. 使用皮肤站生成头像（无背景）

```bash
curl -X POST http://localhost:3000/api/generate \
  -H "Content-Type: application/json" \
  -d '{"method": "website", "username": "player", "website": "example.com", "modelType": "vintage", "withBackground": false}' \
  --output avatar.png
```

#### 3. 上传皮肤文件生成头像

```bash
curl -X POST http://localhost:3000/api/generate \
  -F "method=upload" \
  -F "modelType=side" \
  -F "withBackground=true" \
  -F "skin=@skin.png" \
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

#### 4. 生成透明背景头像

```bash
curl -X POST http://localhost:3000/api/generate \
  -H "Content-Type: application/json" \
  -d '{
    "method": "mojang",
    "username": "Notch",
    "modelType": "side",
    "withBackground": false,
    "generateOptions": {
      "scale": 200,
      "shadow": 30,
      "texture": false
    }
  }' \
  --output avatar_transparent.png
```

## 模型类型

- **Minimal**: 简约风格，灵感来源：噪音回放
- **Vintage**: 复古风格，灵感来源：Minecraft Skin Avatar
- **Side**: 侧面风格，灵感来源：Henry Packs

## 配置选项

### 环境变量

| 变量名 | 默认值 | 说明           |
| ------ | ------ | -------------- |
| `PORT` | `3000` | 服务器监听端口 |

### 配置示例

```bash
# 设置端口
export PORT=8080

# 启动服务器
pnpm start
```

## 部署

### Docker 部署

创建 `Dockerfile`：

```dockerfile
FROM node:18-alpine

# 安装 Canvas 依赖
RUN apk add --no-cache \
    cairo-dev \
    pango-dev \
    jpeg-dev \
    giflib-dev \
    librsvg-dev \
    pixman-dev \
    pkgconfig

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 3000

CMD ["npm", "start"]
```

构建和运行：

```bash
# 构建镜像
docker build -t minecraft-avatar-server .

# 运行容器
docker run -p 3000:3000 minecraft-avatar-server
```
