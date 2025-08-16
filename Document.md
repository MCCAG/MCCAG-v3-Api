# Minecraft 头像生成器 API 文档

## 概述

这是一个基于 Node.js 和 Express 的 Minecraft 头像生成服务，支持多种皮肤获取方式和头像风格。

**基础URL**: `http://localhost:3000`

## 核心功能

- 支持多种皮肤获取方式：Mojang 官方、皮肤站、文件上传、URL链接
- 提供多种头像风格：简约、复古、侧面
- 支持自定义背景和头像参数
- 提供 POST 和 GET 两种调用方式

## API 端点

### 1. 健康检查

**GET** `/health`

检查服务运行状态和系统信息。

**响应示例**:
```json
{
  "status": "ok",
  "message": "Minecraft 头像生成器服务运行正常！",
  "uptime": "15分32秒",
  "memory": {
    "used": "45MB",
    "total": "128MB"
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### 2. 生成头像 (POST)

**POST** `/api/generate`

通过 POST 请求生成头像，支持所有皮肤获取方式。

**Content-Type**: `multipart/form-data` (上传文件时) 或 `application/json`

#### 请求参数

| 参数 | 类型 | 必填 | 描述 |
|------|------|------|------|
| `method` | string | ✅ | 皮肤获取方式: `mojang`, `website`, `upload`, `url` |
| `username` | string | 条件 | 玩家用户名 (mojang/website 模式必填) |
| `website` | string | 条件 | 皮肤站域名 (website 模式必填) |
| `skinUrl` | string | 条件 | 皮肤图片链接 (url 模式必填) |
| `skin` | file | 条件 | 皮肤文件 (upload 模式必填，最大2MB) |
| `modelType` | string | ❌ | 头像模型: `minimal`, `vintage`, `side` (默认: `minimal`) |
| `generateOptions` | object/string | ❌ | 头像生成选项 |
| `backgroundOptions` | object/string | ❌ | 背景选项 |
| `withBackground` | boolean | ❌ | 是否添加背景 (默认: `true`) |

#### generateOptions 参数

| 参数 | 类型 | 默认值 | 范围 | 描述 |
|------|------|--------|------|------|
| `type` | string | `head` | `head`, `half`, `full` | 头像类型 |
| `scale` | number | 100 | 50-200 | 缩放比例 |
| `shadow` | number | 50 | 0-100 | 阴影强度 |
| `texture` | boolean | true | - | 是否启用纹理 |
| `color` | string | `#FFFFFF` | - | 边框颜色 |
| `border` | number | 1 | 0-50 | 边框宽度 |

#### backgroundOptions 参数

| 参数 | 类型 | 默认值 | 范围 | 描述 |
|------|------|--------|------|------|
| `angle` | number | 45 | 0-360 | 渐变角度 |
| `colors` | array | `["#87CEEB", "#FFB6C1"]` | - | 渐变颜色数组 |
| `stripes` | number | 5 | 1-20 | 条纹数量 |
| `vignette` | number | 30 | 0-100 | 暗角强度 |
| `image` | string | null | - | 背景图片URL |

#### 请求示例

**Mojang 模式**:
```bash
curl -X POST http://localhost:3000/api/generate \
  -H "Content-Type: application/json" \
  -d '{
    "method": "mojang",
    "username": "Notch",
    "modelType": "minimal",
    "generateOptions": {
      "type": "head",
      "scale": 120,
      "shadow": 60
    },
    "withBackground": true
  }'
```

**文件上传模式**:
```bash
curl -X POST http://localhost:3000/api/generate \
  -F "method=upload" \
  -F "modelType=vintage" \
  -F "skin=@skin.png" \
  -F "generateOptions={\"scale\": 150}" \
  -F "withBackground=true"
```

**响应**: 返回 PNG 图片数据

### 3. 生成头像 (GET)

**GET** `/api/generate/:modelType/:method/:username`

通过 GET 请求生成头像，支持 URL 参数配置。

#### 路径参数

| 参数 | 类型 | 必填 | 描述 |
|------|------|------|------|
| `modelType` | string | ✅ | 头像模型: `minimal`, `vintage`, `side` |
| `method` | string | ✅ | 皮肤获取方式: `mojang`, `website`, `url` |
| `username` | string | ✅ | 玩家用户名 |

#### 查询参数

| 参数 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| `scale` | number | 100 | 缩放比例 (50-200) |
| `shadow` | number | 50 | 阴影强度 (0-100) |
| `texture` | string | `true` | 是否启用纹理 |
| `color` | string | `#FFFFFF` | 边框颜色 |
| `border` | number | 1 | 边框宽度 (0-50) |
| `type` | string | `head` | 头像类型: `head`, `half`, `full` |
| `withBackground` | string | `true` | 是否添加背景 |
| `angle` | number | 45 | 背景渐变角度 (0-360) |
| `colors` | string | `["#87CEEB", "#FFB6C1"]` | 背景渐变颜色 (JSON数组) |
| `stripes` | number | 5 | 背景条纹数量 (1-20) |
| `vignette` | number | 30 | 背景暗角强度 (0-100) |
| `skinUrl` | string | - | 皮肤图片链接 (url 模式必填) |

#### 请求示例

**Mojang 模式**:
```
GET /api/generate/minimal/mojang/Notch?scale=120&shadow=60&withBackground=true
```

**URL 模式**:
```
GET /api/generate/vintage/url/player?skinUrl=https://example.com/skin.png&scale=150
```

**皮肤站模式** (默认使用 minecraft.net):
```
GET /api/generate/side/website/player?scale=100&texture=true
```

**响应**: 返回 PNG 图片数据

### 4. 获取支持的模型

**GET** `/api/models`

获取所有支持的头像模型类型和参数。

**响应示例**:
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

## 皮肤获取方式

### 1. Mojang 官方 (`mojang`)
- 从 Mojang 官方服务器获取玩家皮肤
- 需要提供有效的 Minecraft 用户名
- 支持正版和离线模式玩家

### 2. 皮肤站 (`website`)
- 从第三方皮肤站获取皮肤
- 需要提供皮肤站域名和用户名
- 支持大部分兼容 Blessing Skin 的皮肤站

### 3. 文件上传 (`upload`)
- 直接上传皮肤文件
- 支持 PNG/JPG 格式
- 文件大小限制 2MB
- 仅支持 POST 请求

### 4. URL 链接 (`url`)
- 通过图片链接获取皮肤
- 需要提供可访问的皮肤图片URL
- 支持 PNG/JPG 格式

## 头像模型类型

### 1. Minimal (简约风格)
- 支持头部、半身、全身三种类型
- 可调节缩放和阴影
- 简洁现代的设计风格

### 2. Vintage (复古风格)
- 经典的像素风格
- 可自定义边框颜色和宽度
- 怀旧的视觉效果

### 3. Side (侧面风格)
- 侧面视角的头像
- 支持纹理开关
- 独特的展示角度

## 错误处理

API 使用标准的 HTTP 状态码：

- `200` - 成功返回图片
- `400` - 请求参数错误
- `404` - 未找到玩家信息
- `500` - 服务器内部错误

**错误响应格式**:
```json
{
  "success": false,
  "message": "错误描述信息"
}
```

## 常见错误

| 错误信息 | 原因 | 解决方案 |
|----------|------|----------|
| "请指定皮肤获取方式" | 缺少 method 参数 | 提供有效的 method 值 |
| "未找到该玩家信息" | 玩家不存在 | 检查用户名是否正确 |
| "文件太大" | 上传文件超过2MB | 压缩图片或使用更小的文件 |
| "网络连接失败" | 网络问题 | 稍后重试或检查网络连接 |
| "参数格式错误" | JSON 格式错误 | 检查参数格式是否正确 |

## 性能优化

- 图片缓存：生成的图片会被缓存1小时
- 内存监控：服务器会定期监控内存使用情况
- 请求日志：所有请求都会被记录用于性能分析

## 使用限制

- 文件上传大小限制：2MB
- 支持的图片格式：PNG, JPG
- 缩放范围：50-200%
- 背景条纹数量：1-20条
- 边框宽度：0-50像素

## 示例代码

### JavaScript (Fetch API)

```javascript
// POST 请求示例
async function generateAvatar() {
  const response = await fetch('http://localhost:3000/api/generate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      method: 'mojang',
      username: 'Notch',
      modelType: 'minimal',
      generateOptions: {
        type: 'head',
        scale: 120
      },
      withBackground: true
    })
  });
  
  if (response.ok) {
    const blob = await response.blob();
    const imageUrl = URL.createObjectURL(blob);
    document.getElementById('avatar').src = imageUrl;
  }
}

// GET 请求示例
function generateAvatarGet() {
  const imageUrl = 'http://localhost:3000/api/generate/minimal/mojang/Notch?scale=120&withBackground=true';
  document.getElementById('avatar').src = imageUrl;
}
```

### Python (requests)

```python
import requests

# POST 请求
def generate_avatar():
    url = 'http://localhost:3000/api/generate'
    data = {
        'method': 'mojang',
        'username': 'Notch',
        'modelType': 'minimal',
        'generateOptions': {
            'type': 'head',
            'scale': 120
        },
        'withBackground': True
    }
    
    response = requests.post(url, json=data)
    if response.status_code == 200:
        with open('avatar.png', 'wb') as f:
            f.write(response.content)

# GET 请求
def generate_avatar_get():
    url = 'http://localhost:3000/api/generate/minimal/mojang/Notch'
    params = {
        'scale': 120,
        'withBackground': 'true'
    }
    
    response = requests.get(url, params=params)
    if response.status_code == 200:
        with open('avatar.png', 'wb') as f:
            f.write(response.content)
```

## 更新日志

### v2.0.0 (当前版本)
- 重构代码架构，将头像生成逻辑封装到独立函数
- 优化错误处理和日志记录
- 改进参数验证和类型检查
- 增强代码可维护性和复用性

### v1.0.0
- 初始版本发布
- 支持基本的头像生成功能
- 提供 POST 和 GET 两种调用方式