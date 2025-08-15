# MCCAG HTTP API

基于 Node.js 的 Minecraft 头像生成器 API 服务。

[接口文档](https://github.com/MCCAG/MCCAG-v3-Api#api-%E6%8E%A5%E5%8F%A3%E6%96%87%E6%A1%A3)

## 特性

- ✅ 完整的 Minecraft 头像渲染功能。
- ✅ 多种渲染风格（简约、复古、侧面）。
- ✅ 支持多种皮肤来源（Mojang、皮肤站、上传、URL）。
- ✅ 支持POST和GET两种API调用方式。
- ✅ 智能背景生成（根据参数自动决定透明或带背景）。
- ✅ 可自定义生成选项和背景样式。
- ✅ 文件大小限制和类型验证。
- ✅ 内存存储，不写入磁盘。
- ✅ 完整的错误处理和日志记录。

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
  "version": "1.0.1",
  "message": "Minecraft 头像生成器服务运行正常！",
  "uptime": "15分32秒",
  "memory": {
    "used": "45MB",
    "total": "128MB"
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
> 但请注意 POST 支持 Upload 上传皮肤，但是不支持 Url 获取皮肤；而 GET 不支持 Upload 但支持 Url 方式。

#### POST

**请求**

```http
POST /api/generate
Content-Type: application/json 或 multipart/form-data
```

**参数**

| 参数名              | 类型          | 必填     | 说明                                                    |
| ------------------- | ------------- | -------- | ------------------------------------------------------- |
| `method`            | string        | ✅       | 皮肤获取方式：`mojang`、`website`、`upload`、`url`      |
| `username`          | string        | 条件必填 | 玩家用户名（mojang/website 模式时必填）                 |
| `website`           | string        | 条件必填 | 皮肤站地址（website 模式时必填，不含 https://）         |
| `skin`              | file          | 条件必填 | 皮肤文件（upload 模式时必填，最大 2MB）                 |
| `skinUrl`           | string        | 条件必填 | 皮肤图片链接（url 模式时必填）                          |
| `modelType`         | string        | ❌       | 模型类型，默认 `minimal`                                |
| `generateOptions`   | string/object | ❌       | 生成选项（JSON 字符串或对象）                           |
| `backgroundOptions` | string/object | ❌       | 背景选项（JSON 字符串或对象，为空时生成透明背景）       |

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

> 若未填写 `backgroundOptions` 参数，则默认不生成背。GET 请求同理。

**响应**

- **成功**: 返回 PNG 图片文件（Content-Type: image/png）
- **失败**: 返回 JSON 错误信息

---

#### GET

通过URL参数快速生成头像，适合直接在浏览器中访问或嵌入到网页中。

**请求**

```http
GET /api/generate/{modelType}/{method}/{username}
```

**路径参数**

| 参数名      | 类型   | 必填 | 说明                                            |
| ----------- | ------ | ---- | ----------------------------------------------- |
| `modelType` | string | ✅   | 模型类型：`minimal`、`vintage`、`side`          |
| `method`    | string | ✅   | 皮肤获取方式：`mojang`、`website`、`url`        |
| `username`  | string | ✅   | 玩家用户名（url模式时此参数被忽略）             |

**查询参数**

| 参数名     | 类型   | 默认值                   | 说明                                                    |
| ---------- | ------ | ------------------------ | ------------------------------------------------------- |
| `scale`    | number | `100`                    | 图片缩放比例：50-200                                    |
| `shadow`   | number | `50`                     | 阴影深度：0-100                                         |
| `texture`  | string | `true`                   | 是否启用纹理：`true`/`false`（仅side模式）              |
| `color`    | string | `#FFFFFF`                | 边框颜色（仅vintage模式）                               |
| `border`   | number | `1`                      | 边框粗细：0-50（仅vintage模式）                         |
| `type`     | string | `head`                   | 生成类型：`head`、`half`、`full`（仅minimal模式）       |
| `skinUrl`  | string | -                        | 皮肤图片链接（仅url模式时必填）                         |
| `angle`    | number | `45`                     | 背景渐变角度：0-360（提供任一背景参数时生成背景）       |
| `colors`   | string | `["#87CEEB", "#FFB6C1"]` | 背景颜色数组JSON字符串（提供任一背景参数时生成背景）    |
| `stripes`  | number | `5`                      | 条纹数量：1-20（提供任一背景参数时生成背景）            |
| `vignette` | number | `30`                     | 暗角强度：0-100（提供任一背景参数时生成背景）           |

**响应**

- **成功**: 返回 PNG 图片文件（Content-Type: image/png）
- **失败**: 返回 JSON 错误信息

**示例**

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

#### 4. 使用皮肤URL生成头像

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
- **生成背景**: 当URL中提供任何背景参数（`angle`、`colors`、`stripes`、`vignette`）时
- **透明背景**: 当URL中未提供任何背景参数时

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
