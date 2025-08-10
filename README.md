# Minecraft 头像生成器 HTTP 服务器

基于 Node.js 的 Minecraft 头像生成器 API 服务。

## 项目结构

```
├── server.js              # 主服务器文件
├── package.json           # 项目配置和依赖
├── Modules/
│   ├── Network.js         # 网络请求模块
│   └── Renderers/         # 渲染器模块
│       ├── Index.js       # 渲染器入口
│       ├── Data.js        # 皮肤数据定义
│       ├── Image.js       # 图像处理工具
│       ├── Minimal.js     # 简约风格渲染器
│       ├── Vintage.js     # 复古风格渲染器
│       └── Side.js        # 侧面风格渲染器
└── README.md              # 项目说明
```

## 安装依赖

```bash
npm install
```

> **注意**: 如果 canvas 安装失败，请先安装系统依赖：
> - **macOS**: `brew install pkg-config cairo pango libpng jpeg giflib librsvg pixman`
> - **Ubuntu**: `sudo apt-get install build-essential libcairo2-dev libpango1.0-dev libjpeg-dev libgif-dev librsvg2-dev`

## 启动服务器

```bash
# 生产环境
npm start

# 开发环境（支持热重载）
npm run dev
```

## API 接口

### 1. 健康检查

```
GET /health
```

### 2. 生成头像（带背景）

```
POST /api/generate
```

参数：

- `method`: 获取皮肤方式 (`mojang`, `website`, `upload`) **必填**
- `username`: 玩家用户名（mojang/website 模式时必填）
- `website`: 皮肤站地址（website 模式时必填）
- `skin`: 皮肤文件（upload 模式时必填）
- `modelType`: 模型类型 (`minimal`, `vintage`, `side`)
- `generateOptions`: 生成选项（JSON 字符串）
- `backgroundOptions`: 背景选项（JSON 字符串）

### 3. 生成头像（无背景）

```
POST /api/avatar
```

参数同上，但不包含背景选项。

### 4. 获取玩家信息

```
GET /api/player/:username
```

### 5. 获取支持的模型类型

```
GET /api/models
```

## 使用示例

### curl 示例

```bash
# 使用 Mojang 用户名生成头像
curl -X POST http://localhost:3000/api/generate \
  -H "Content-Type: application/json" \
  -d '{"method": "mojang", "username": "Notch", "modelType": "vintage"}' \
  --output avatar.png

# 使用皮肤站生成头像
curl -X POST http://localhost:3000/api/generate \
  -H "Content-Type: application/json" \
  -d '{"method": "website", "username": "player", "website": "example.com", "modelType": "minimal"}' \
  --output avatar.png

# 上传皮肤文件生成头像
curl -X POST http://localhost:3000/api/generate \
  -F "method=upload" \
  -F "modelType=side" \
  -F "skin=@skin.png" \
  --output avatar.png
```

## 模型类型

- **minimal**: 简约风格，灵感来源：噪音回放
- **vintage**: 复古风格，灵感来源：Minecraft Skin Avatar
- **side**: 侧面风格，灵感来源：Henry Packs

## 技术栈

- Node.js + Express - Web 框架
- Canvas - 图像处理和渲染
- Multer - 文件上传处理
- CORS - 跨域支持
