import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { createCanvas, loadImage } from 'canvas';

import { fetchMojangProfile, fetchSkinWebsiteProfile } from './Scripts/Network.js';
import { renderAvatar, renderBackground, regulateAvatar } from './Scripts/Index.js';

const app = express();
const port = process.env.PORT || 3000;

// 请求日志中间件
app.use((req, res, next) => {
    const requestId = Math.random().toString(36).substr(2, 9);
    const startTime = Date.now();
    
    req.requestId = requestId;
    
    console.log(`[${requestId}] ${req.method} ${req.url} - ${req.ip} - ${req.get('User-Agent')}`);
    
    // 记录响应时间
    res.on('finish', () => {
        const duration = Date.now() - startTime;
        console.log(`[${requestId}] ${res.statusCode} - ${duration}ms`);
    });
    
    next();
});

// 中间件
app.use(cors());
app.use(express.json());

// 文件上传配置
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 2 * 1024 * 1024 }, // 2MB限制
    fileFilter: (_req, file, cb) => {
        if (file.mimetype.startsWith('image/')) cb(null, true);
        else cb(new Error('只支持图片文件'), false);
    }
});

/**
 * 获取皮肤图片
 */
async function getSkinImage(method, data) {
    console.log(`[getSkinImage] 开始获取皮肤，方式: ${method}`);
    
    try {
        switch (method) {
            case 'mojang':
                console.log(`[getSkinImage] Mojang模式 - 用户名: ${data.username}`);
                const profile = await fetchMojangProfile(data.username);
                if (!profile) {
                    console.error(`[getSkinImage] 未找到玩家信息: ${data.username}`);
                    throw new Error('未找到该玩家信息');
                }
                console.log(`[getSkinImage] 找到玩家信息 - ID: ${profile.id}, 名称: ${profile.name}`);
                
                // 使用 Mojang 官方 API 获取皮肤纹理信息
                try {
                    const textureResponse = await fetch(`https://sessionserver.mojang.com/session/minecraft/profile/${profile.id}?unsigned=false`);
                    if (!textureResponse.ok) {
                        throw new Error(`获取纹理信息失败: ${textureResponse.status}`);
                    }
                    
                    const textureData = await textureResponse.json();
                    if (!textureData.properties || !textureData.properties[0]) {
                        throw new Error('纹理数据不存在');
                    }
                    
                    // 解码 Base64 纹理数据
                    const textureInfo = JSON.parse(Buffer.from(textureData.properties[0].value, 'base64').toString());
                    const skinUrl = textureInfo.textures.SKIN.url;
                    
                    console.log(`[getSkinImage] 开始加载皮肤图片: ${skinUrl}`);
                    const skinImage = await loadImage(skinUrl);
                    console.log(`[getSkinImage] 皮肤图片加载成功 - 尺寸: ${skinImage.width}x${skinImage.height}`);
                    return skinImage;
                } catch (imageError) {
                    console.error(`[getSkinImage] 皮肤图片加载失败`, imageError);
                    throw new Error(`加载皮肤图片失败: ${imageError.message}`);
                }

            case 'website':
                console.log(`[getSkinImage] 皮肤站模式 - 网站: ${data.website}, 用户名: ${data.username}`);
                const website = 'https://' + data.website;
                
                try {
                    const skinData = await fetchSkinWebsiteProfile(website, data.username);
                    if (!skinData || !skinData.skins) {
                        console.error(`[getSkinImage] 皮肤站未找到玩家数据: ${data.username}@${data.website}`);
                        throw new Error('未找到该玩家的皮肤数据');
                    }
                    
                    const texturePath = Object.values(skinData.skins)[0];
                    const textureUrl = `${website}/textures/${texturePath}`;
                    console.log(`[getSkinImage] 开始加载皮肤站图片: ${textureUrl}`);
                    
                    const skinImage = await loadImage(textureUrl);
                    console.log(`[getSkinImage] 皮肤站图片加载成功 - 尺寸: ${skinImage.width}x${skinImage.height}`);
                    return skinImage;
                } catch (websiteError) {
                    console.error(`[getSkinImage] 皮肤站请求失败: ${website}`, websiteError);
                    throw new Error(`皮肤站请求失败: ${websiteError.message}`);
                }

            case 'upload':
                console.log(`[getSkinImage] 上传模式 - 文件大小: ${data.skinBuffer?.length || 0} bytes`);
                if (!data.skinBuffer) {
                    console.error(`[getSkinImage] 上传模式但未找到文件数据`);
                    throw new Error('未找到上传的皮肤文件');
                }
                
                try {
                    const skinImage = await loadImage(data.skinBuffer);
                    console.log(`[getSkinImage] 上传图片加载成功 - 尺寸: ${skinImage.width}x${skinImage.height}`);
                    return skinImage;
                } catch (uploadError) {
                    console.error(`[getSkinImage] 上传图片加载失败`, uploadError);
                    throw new Error(`上传图片格式错误: ${uploadError.message}`);
                }

            default:
                console.error(`[getSkinImage] 不支持的获取方式: ${method}`);
                throw new Error('请提供有效的皮肤获取方式 (mojang, website, upload)');
        }
    } catch (error) {
        console.error(`[getSkinImage] 获取皮肤失败 - 方式: ${method}`, error);
        throw error;
    }
}

// API路由

/**
 * 健康检查
 */
app.get('/health', (_req, res) => {
    const memoryUsage = process.memoryUsage();
    const uptime = process.uptime();
    
    console.log('[Health] 健康检查请求');
    
    res.json({ 
        status: 'ok', 
        message: 'Minecraft 头像生成器服务运行正常！',
        uptime: `${Math.floor(uptime / 60)}分${Math.floor(uptime % 60)}秒`,
        memory: {
            used: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB`,
            total: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)}MB`
        },
        timestamp: new Date().toISOString()
    });
});

/**
 * 生成头像API（统一接口）
 */
app.post('/api/generate', upload.single('skin'), async (req, res) => {
    const requestId = Math.random().toString(36).substr(2, 9);
    console.log(`[${requestId}] 开始处理头像生成请求`);
    
    try {
        const {
            method,
            username,
            website,
            modelType = 'minimal',
            generateOptions = {},
            backgroundOptions = {},
            withBackground = true
        } = req.body;

        console.log(`[${requestId}] 请求参数:`, {
            method,
            username,
            website,
            modelType,
            withBackground,
            hasFile: !!req.file,
            fileSize: req.file?.size || 0
        });

        if (!method) {
            console.error(`[${requestId}] 参数错误: 缺少 method 参数`);
            return res.status(400).json({
                error: '参数错误',
                message: '请指定皮肤获取方式 (mojang, website, upload)'
            });
        }

        // 验证必填参数
        if (method === 'mojang' && !username) {
            console.error(`[${requestId}] 参数错误: mojang 模式缺少 username`);
            return res.status(400).json({
                error: '参数错误',
                message: 'mojang 模式需要提供 username 参数'
            });
        }

        if (method === 'website' && (!username || !website)) {
            console.error(`[${requestId}] 参数错误: website 模式缺少必要参数`);
            return res.status(400).json({
                error: '参数错误',
                message: 'website 模式需要提供 username 和 website 参数'
            });
        }

        if (method === 'upload' && !req.file) {
            console.error(`[${requestId}] 参数错误: upload 模式缺少文件`);
            return res.status(400).json({
                error: '参数错误',
                message: 'upload 模式需要上传皮肤文件'
            });
        }

        // 解析JSON字符串参数
        let parsedGenerateOptions, parsedBackgroundOptions;
        
        try {
            parsedGenerateOptions = typeof generateOptions === 'string'
                ? JSON.parse(generateOptions)
                : generateOptions;
            console.log(`[${requestId}] 生成选项:`, parsedGenerateOptions);
        } catch (parseError) {
            console.error(`[${requestId}] generateOptions 解析失败:`, parseError);
            return res.status(400).json({
                error: '参数错误',
                message: 'generateOptions 格式错误，请提供有效的 JSON'
            });
        }

        try {
            parsedBackgroundOptions = typeof backgroundOptions === 'string'
                ? JSON.parse(backgroundOptions)
                : backgroundOptions;
            console.log(`[${requestId}] 背景选项:`, parsedBackgroundOptions);
        } catch (parseError) {
            console.error(`[${requestId}] backgroundOptions 解析失败:`, parseError);
            return res.status(400).json({
                error: '参数错误',
                message: 'backgroundOptions 格式错误，请提供有效的 JSON'
            });
        }

        // 设置默认选项
        const defaultGenerateOptions = {
            type: 'head',
            scale: 100,
            shadow: 50,
            texture: true,
            color: '#FFFFFF',
            border: 1,
            ...parsedGenerateOptions
        };

        const defaultBackgroundOptions = {
            angle: 45,
            colors: ['#87CEEB', '#FFB6C1'],
            stripes: 5,
            vignette: 30,
            image: null,
            ...parsedBackgroundOptions
        };

        console.log(`[${requestId}] 最终选项:`, {
            generateOptions: defaultGenerateOptions,
            backgroundOptions: withBackground ? defaultBackgroundOptions : '跳过（无背景模式）'
        });

        // 获取皮肤图片
        console.log(`[${requestId}] 开始获取皮肤图片`);
        const skinData = { username, website, skinBuffer: req.file?.buffer };
        const skinImage = await getSkinImage(method, skinData);
        console.log(`[${requestId}] 皮肤图片获取成功`);

        // 生成头像
        console.log(`[${requestId}] 开始渲染头像 - 模型: ${modelType}, 皮肤尺寸: ${skinImage.width}x${skinImage.height}`);
        const avatarCanvas = renderAvatar(skinImage, modelType, defaultGenerateOptions);
        console.log(`[${requestId}] 头像渲染完成 - 画布尺寸: ${avatarCanvas.width}x${avatarCanvas.height}`);
        
        console.log(`[${requestId}] 开始调整头像`);
        const regulatedAvatarCanvas = regulateAvatar(avatarCanvas, defaultGenerateOptions);
        console.log(`[${requestId}] 头像调整完成 - 最终尺寸: ${regulatedAvatarCanvas.width}x${regulatedAvatarCanvas.height}`);

        let finalCanvas;
        
        // 根据 withBackground 参数决定是否添加背景
        if (withBackground === true || withBackground === 'true') {
            console.log(`[${requestId}] 开始生成背景`);
            // 生成背景
            const backgroundCanvas = renderBackground(modelType, defaultBackgroundOptions);
            console.log(`[${requestId}] 背景生成完成`);

            // 合成最终图片
            console.log(`[${requestId}] 开始合成最终图片`);
            finalCanvas = createCanvas(1000, 1000);
            const context = finalCanvas.getContext('2d');

            // 绘制背景
            context.drawImage(backgroundCanvas, 0, 0);
            // 绘制头像
            context.drawImage(regulatedAvatarCanvas, 0, 0);
            console.log(`[${requestId}] 图片合成完成`);
        } else {
            console.log(`[${requestId}] 无背景模式，直接使用头像`);
            // 无背景，直接使用头像
            finalCanvas = regulatedAvatarCanvas;
        }

        // 返回图片
        console.log(`[${requestId}] 开始生成 PNG 缓冲区`);
        const buffer = finalCanvas.toBuffer('image/png');
        console.log(`[${requestId}] PNG 生成完成 - 大小: ${buffer.length} bytes`);

        res.set({
            'Content-Type': 'image/png',
            'Content-Length': buffer.length,
            'Cache-Control': 'public, max-age=3600'
        });

        res.send(buffer);
        console.log(`[${requestId}] 请求处理完成`);

    } catch (error) {
        console.error(`[${requestId}] 生成头像失败:`, {
            message: error.message,
            stack: error.stack,
            cause: error.cause
        });
        
        // 根据错误类型返回不同的状态码和消息
        let statusCode = 500;
        let errorMessage = error.message;
        
        if (error.message.includes('未找到该玩家信息')) {
            statusCode = 404;
        } else if (error.message.includes('参数错误') || error.message.includes('格式错误')) {
            statusCode = 400;
        } else if (error.message.includes('ECONNRESET') || error.message.includes('fetch failed')) {
            errorMessage = '网络连接失败，请稍后重试';
        } else if (error.message.includes('ETIMEDOUT')) {
            errorMessage = '请求超时，请稍后重试';
        }
        
        res.status(statusCode).json({
            error: '生成头像失败',
            message: errorMessage,
            requestId: requestId
        });
    }
});



/**
 * 获取支持的模型类型
 */
app.get('/api/models', (_req, res) => {
    res.json({
        models: [
            {
                type: 'minimal',
                name: '简约风格',
                description: '灵感来源：噪音回放',
                options: {
                    type: ['head', 'half', 'full'],
                    scale: { min: 50, max: 200, default: 100 },
                    shadow: { min: 0, max: 100, default: 50 }
                }
            },
            {
                type: 'vintage',
                name: '复古风格',
                description: '灵感来源：Minecraft Skin Avatar',
                options: {
                    scale: { min: 50, max: 200, default: 100 },
                    border: { min: 0, max: 50, default: 10 },
                    color: 'string'
                }
            },
            {
                type: 'side',
                name: '侧面风格',
                description: '灵感来源：Henry Packs',
                options: {
                    scale: { min: 50, max: 200, default: 100 },
                    shadow: { min: 0, max: 100, default: 50 },
                    texture: { type: 'boolean', default: true }
                }
            }
        ]
    });
});

// 错误处理中间件
app.use((error, req, res, _next) => {
    const errorId = Math.random().toString(36).substr(2, 9);
    
    console.error(`[Error-${errorId}] 服务器错误:`, {
        url: req.url,
        method: req.method,
        userAgent: req.get('User-Agent'),
        ip: req.ip,
        error: {
            name: error.name,
            message: error.message,
            stack: error.stack
        }
    });

    if (error instanceof multer.MulterError) {
        console.log(`[Error-${errorId}] Multer 错误: ${error.code}`);
        
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                error: '文件太大',
                message: '图片大小不能超过 2MB',
                errorId: errorId
            });
        }
        
        if (error.code === 'LIMIT_UNEXPECTED_FILE') {
            return res.status(400).json({
                error: '文件字段错误',
                message: '请使用 skin 字段上传文件',
                errorId: errorId
            });
        }
        
        return res.status(400).json({
            error: '文件上传错误',
            message: error.message,
            errorId: errorId
        });
    }

    // 其他错误
    res.status(500).json({
        error: '服务器内部错误',
        message: '服务器处理请求时发生错误，请稍后重试',
        errorId: errorId
    });
});

// 404处理
app.use((_req, res) => {
    res.status(404).json({
        error: '接口不存在',
        message: '请检查请求路径是否正确'
    });
});

// 启动服务器
app.listen(port, () => {
    console.log('='.repeat(50));
    console.log(`🚀 Minecraft头像生成器服务器已启动`);
    console.log(`📍 服务地址: http://localhost:${port}`);
    console.log(`⏰ 启动时间: ${new Date().toLocaleString()}`);
    console.log(`🔧 Node.js 版本: ${process.version}`);
    console.log(`💾 内存使用: ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`);
    console.log('='.repeat(50));
    
    // 测试网络连接
    console.log('🔍 测试网络连接...');
    fetch('https://api.mojang.com/users/profiles/minecraft/Notch')
        .then(response => {
            if (response.ok) {
                console.log('✅ Mojang API 连接正常');
            } else {
                console.log('⚠️  Mojang API 连接异常:', response.status);
            }
        })
        .catch(error => {
            console.log('❌ Mojang API 连接失败:', error.message);
        });
    
    // 定期内存监控（每5分钟）
    setInterval(() => {
        const memoryUsage = process.memoryUsage();
        const heapUsedMB = Math.round(memoryUsage.heapUsed / 1024 / 1024);
        const heapTotalMB = Math.round(memoryUsage.heapTotal / 1024 / 1024);
        
        console.log(`[Monitor] 内存使用: ${heapUsedMB}MB / ${heapTotalMB}MB (${Math.round(heapUsedMB / heapTotalMB * 100)}%)`);
        
        // 内存使用过高警告
        if (heapUsedMB > 500) {
            console.warn(`[Monitor] ⚠️  内存使用过高: ${heapUsedMB}MB`);
        }
    }, 5 * 60 * 1000);
});

export default app;