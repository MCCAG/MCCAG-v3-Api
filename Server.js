import cors from 'cors';
import multer from 'multer';
import express from 'express';
import { createCanvas, loadImage } from 'canvas';

import { Logger } from './Scripts/Logger.js';
import { fetchMojangProfile, fetchSkinWebsiteProfile } from './Scripts/Network.js';
import { renderAvatar, renderBackground, regulateAvatar } from './Scripts/Index.js';

const app = express();
const port = process.env.PORT || 3000;

// 请求日志中间件
app.use((req, res, next) => {
    const startTime = Date.now();
    const ip = req.headers['x-forwarded-for'] || req.ip || req.connection.remoteAddress || req.socket.remoteAddress || req.connection.socket.remoteAddress || '';
    Logger.log('Server', `(${ip})${req.method} ${req.url}`);
    // 记录响应时间
    res.on('finish', () => {
        const duration = Date.now() - startTime;
        Logger.log('Server', `(${ip}) ${res.statusCode} - ${duration}ms ${req.url}`);
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

async function getSkinImage(method, data) {
    Logger.log('SkinLoader', `开始获取皮肤，方式：${method}`);

    switch (method) {
        case 'mojang':
            Logger.log('SkinLoader', `Mojang 模式 - 用户名 ${data.username}`);
            const profile = await fetchMojangProfile(data.username);
            if (!profile) {
                Logger.error('SkinLoader', `未找到玩家信息：${data.username}`);
                throw new Error('未找到该玩家信息');
            }

            const textureResponse = await fetch(`https://sessionserver.mojang.com/session/minecraft/profile/${profile.id}?unsigned=false`);
            if (!textureResponse.ok)
                throw new Error(`获取纹理信息失败：${textureResponse.status}`);

            const textureData = await textureResponse.json();
            if (!textureData.properties || !textureData.properties[0])
                throw new Error('纹理数据不存在！');

            const textureInfo = JSON.parse(Buffer.from(textureData.properties[0].value, 'base64').toString());
            const skinUrl = textureInfo.textures.SKIN.url;

            const skinImage = await loadImage(skinUrl);
            Logger.log('SkinLoader', `皮肤加载成功 - ${skinImage.width}x${skinImage.height}`);
            return skinImage;

        case 'website':
            Logger.log('SkinLoader', `皮肤站模式 - ${data.website}/${data.username}`);
            const website = data.website.startsWith('https://') ? data.website : 'https://' + data.website;

            const skinData = await fetchSkinWebsiteProfile(website, data.username);
            if (!skinData || !skinData.skins) {
                Logger.error('SkinLoader', `皮肤站未找到玩家：${data.username}`);
                throw new Error('未找到该玩家的皮肤数据');
            }

            const texturePath = Object.values(skinData.skins)[0];
            const textureUrl = `${website}/textures/${texturePath}`;

            const websiteSkinImage = await loadImage(textureUrl);
            Logger.log('SkinLoader', `皮肤站图片加载成功 - ${websiteSkinImage.width}x${websiteSkinImage.height}`);
            return websiteSkinImage;

        case 'upload':
            Logger.log('SkinLoader', `上传模式 - ${data.skinBuffer?.length || 0} Bytes`);
            if (!data.skinBuffer) {
                Logger.error('SkinLoader', '上传模式但未找到文件数据');
                throw new Error('未找到上传的皮肤文件');
            }

            const uploadSkinImage = await loadImage(data.skinBuffer);
            Logger.log('SkinLoader', `上传图片加载成功 - ${uploadSkinImage.width}x${uploadSkinImage.height}`);
            return uploadSkinImage;

        case 'url':
            Logger.log('SkinLoader', `URL 模式 - ${data.skinUrl}`);
            if (!data.skinUrl) {
                Logger.error('SkinLoader', 'URL 模式但未提供皮肤链接');
                throw new Error('请提供有效的皮肤图片链接');
            }

            const urlSkinImage = await loadImage(data.skinUrl);
            Logger.log('SkinLoader', `URL 图片加载成功 - ${urlSkinImage.width}x${urlSkinImage.height}`);
            return urlSkinImage;

        default:
            Logger.error('SkinLoader', `不支持的获取方式：${method}`);
            throw new Error('请提供有效的皮肤获取方式(Mojang、Website、Upload)');
    }
}

// 统一错误处理函数
function handleApiError(error, res, context = 'Generator') {
    Logger.error(context, '操作失败', error);

    let statusCode = 500;
    let errorMessage = error.message;

    if (error.message.includes('未找到该玩家信息'))
        statusCode = 404;
    else if (error.message.includes('参数错误') || error.message.includes('格式错误') || error.message.includes('选项格式错误'))
        statusCode = 400;
    else if (error.message.includes('ECONNRESET') || error.message.includes('fetch failed'))
        errorMessage = '网络连接失败，请稍后重试';
    else if (error.message.includes('ETIMEDOUT'))
        errorMessage = '请求超时，请稍后重试';

    res.status(statusCode).json({
        success: false,
        message: errorMessage
    });
}

// 生成头像图片的核心函数
async function generateAvatarImage(method, skinData, modelType, generateOptions, backgroundOptions) {
    Logger.log('Generator', `开始生成头像 - 模型：${modelType}，方式：${method}`);

    // 获取皮肤图片
    const skinImage = await getSkinImage(method, skinData);

    // 生成头像
    Logger.log('Generator', `开始渲染 - 模型：${modelType}`);
    const avatarCanvas = renderAvatar(skinImage, modelType, generateOptions);
    const regulatedAvatarCanvas = regulateAvatar(avatarCanvas, generateOptions);

    let finalCanvas;

    // 根据 backgroundOptions 是否为空决定是否添加背景
    if (backgroundOptions && Object.keys(backgroundOptions).length > 0) {
        Logger.log('Generator', '生成背景');
        const backgroundCanvas = renderBackground(modelType, backgroundOptions);
        finalCanvas = createCanvas(1000, 1000);
        const context = finalCanvas.getContext('2d');
        context.drawImage(backgroundCanvas, 0, 0);
        context.drawImage(regulatedAvatarCanvas, 0, 0);
    } else {
        Logger.log('Generator', '无背景模式');
        finalCanvas = regulatedAvatarCanvas;
    }

    // 返回图片buffer
    const buffer = finalCanvas.toBuffer('image/png');
    Logger.log('Generator', `生成完成 - ${buffer.length} Bytes`);

    return buffer;
}


app.get('/health', (_req, res) => {
    const memoryUsage = process.memoryUsage();
    const uptime = process.uptime();

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

// 生成头像API
app.post('/api/generate', upload.single('skin'), async (req, res) => {
    Logger.log('Generator', '开始处理头像生成请求！');

    try {
        const {
            method,
            username,
            website,
            modelType = 'minimal',
            generateOptions = {},
            backgroundOptions = {},
        } = req.body;

        if (!method) {
            Logger.error('Generator', '参数错误：缺少 Method 参数');
            return res.status(400).json({
                success: false,
                message: '请指定皮肤获取方式 (Mojang、Website、Upload) ！'
            });
        }

        // 验证必填参数
        if (method === 'mojang' && !username) {
            Logger.error('Generator', 'Mojang 模式缺少 Username');
            return res.status(400).json({
                success: false,
                message: 'Mojang 模式需要提供 Username 参数！'
            });
        }

        if (method === 'website' && (!username || !website)) {
            Logger.error('Generator', 'Website 模式缺少必要参数');
            return res.status(400).json({
                success: false,
                message: 'Website 模式需要提供 Username 和 Website 参数'
            });
        }

        if (method === 'upload' && !req.file) {
            Logger.error('Generator', 'Upload 模式缺少文件');
            return res.status(400).json({
                success: false,
                message: 'Upload 模式需要上传皮肤文件'
            });
        }

        // 解析JSON字符串参数
        const parsedGenerateOptions = typeof generateOptions === 'string' ? JSON.parse(generateOptions) : generateOptions;
        const parsedBackgroundOptions = typeof backgroundOptions === 'string' ? JSON.parse(backgroundOptions) : backgroundOptions;

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

        // 处理背景选项 - 空对象或null时不生成背景
        const finalBackgroundOptions = parsedBackgroundOptions && Object.keys(parsedBackgroundOptions).length > 0 
            ? parsedBackgroundOptions 
            : null;

        // 准备皮肤数据
        const skinData = { username, website, skinBuffer: req.file?.buffer };

        // 生成头像图片
        const buffer = await generateAvatarImage(
            method,
            skinData,
            modelType,
            defaultGenerateOptions,
  finalBackgroundOptions
        );
        res.set({
            'Content-Type': 'image/png',
            'Content-Length': buffer.length,
            'Cache-Control': 'public, max-age=3600'
        });

        res.send(buffer);

    } catch (error) {
        // 特殊处理JSON解析错误
        if (error instanceof SyntaxError && error.message.includes('JSON')) {
            return res.status(400).json({
                success: false,
                message: '选项格式错误，请提供有效的 JSON'
            });
        }
        handleApiError(error, res, 'Generator');
    }
});

// GET模式头像生成API - 支持URL参数
app.get('/api/generate/:modelType/:method/:username', async (req, res) => {
    Logger.log('Generator', '开始处理 GET 模式头像生成请求');

    try {
        const { method, username, modelType } = req.params;
        const {
            scale = 100,
            shadow = 50,
            texture = 'true',
            color = '#FFFFFF',
            border = 1,
            type = 'head',
            angle = 45,
            colors = '["#87CEEB", "#FFB6C1"]',
            stripes = 5,
            vignette = 30,
            skinUrl = null
        } = req.query;

        // 验证method参数
        if (!['mojang', 'website', 'url'].includes(method)) {
            return res.status(400).json({
                success: false,
                message: 'GET 模式只支持 Mojang、Website、URL 三种方式'
            });
        }

        // 验证必填参数
        if (method === 'mojang' && !username) {
            return res.status(400).json({
                success: false,
                message: 'Mojang 模式需要提供 Username 参数'
            });
        }

        if (method === 'website' && !username) {
            return res.status(400).json({
                success: false,
                message: 'Website 模式需要提供 Username 参数'
            });
        }

        if (method === 'url' && !skinUrl) {
            return res.status(400).json({
                success: false,
                message: 'URL 模式需要提供 SkinUrl 参数'
            });
        }

        // 解析参数
        const generateOptions = {
            type: type === 'half' ? 'half' : type === 'full' ? 'full' : 'head',
            scale: Math.max(50, Math.min(200, parseInt(scale) || 100)),
            shadow: Math.max(0, Math.min(100, parseInt(shadow) || 50)),
            texture: texture === 'true',
            color: color,
            border: Math.max(0, Math.min(50, parseInt(border) || 1))
        };

        // 只有当提供了背景相关参数时才生成背景
        // 检查是否有任何背景参数被明确设置（不是默认值）
        const hasBackgroundParams = req.query.angle || req.query.colors || req.query.stripes || req.query.vignette;
        
        const backgroundOptions = hasBackgroundParams ? {
            angle: Math.max(0, Math.min(360, parseInt(angle) || 45)),
            colors: JSON.parse(colors),
            stripes: Math.max(1, Math.min(20, parseInt(stripes) || 5)),
            vignette: Math.max(0, Math.min(100, parseInt(vignette) || 30)),
            image: null
        } : null;

        // 准备皮肤数据
        let skinData;
        if (method === 'url') {
            skinData = { skinUrl };
        } else if (method === 'website') {
            // 对于GET模式，website默认为minecraft.net
            skinData = { username, website: 'minecraft.net' };
        } else {
            skinData = { username };
        }

        // 生成头像图片
        const buffer = await generateAvatarImage(
            method,
            skinData,
            modelType,
            generateOptions,
            backgroundOptions
        );

        res.set({
            'Content-Type': 'image/png',
            'Content-Length': buffer.length,
            'Cache-Control': 'public, max-age=3600'
        });

        res.send(buffer);

    } catch (error) {
        // 特殊处理JSON解析错误
        if (error instanceof SyntaxError && error.message.includes('JSON')) {
            return res.status(400).json({
                success: false,
                message: '参数格式错误，请提供有效的 JSON'
            });
        }
        handleApiError(error, res, 'GET Generator');
    }
});

// 获取支持的模型类型
app.get('/api/models', (_req, res) => {
    res.status(200).json({
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
    Logger.error('Server', `服务器错误：${req.method} ${req.url}`, error);

    if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE')
            return res.status(400).json({
                success: false,
                message: '文件太大！图片不能超过 2MB 的限制。'
            });

        if (error.code === 'LIMIT_UNEXPECTED_FILE')
            return res.status(400).json({
                success: false,
                message: '文件字段错误！请使用 Skin 字段上传文件。'
            });

        return res.status(400).json({
            success: false,
            message: error.message
        });
    }

    // 其他错误
    res.status(500).json({
        success: false,
        message: '服务器处理请求时发生错误，请稍后重试！'
    });
});

// 404处理
app.use((_req, res) => {
    res.status(404).json({
        success: false,
        message: '接口不存在！请检查请求路径是否正确。'
    });
});

// 启动服务器
app.listen(port, () => {
    Logger.log('Server', `服务器启动 - http://0.0.0.0:${port}`);

    // 定期内存监控(每5分钟)
    setInterval(() => {
        const memoryUsage = process.memoryUsage();
        const heapUsedMB = Math.round(memoryUsage.heapUsed / 1024 / 1024);

        // 内存使用过高警告
        if (heapUsedMB > 500) Logger.warn('Monitor', `内存使用过高：${heapUsedMB}MB`);
    }, 5 * 60 * 1000);
});

export default app;
