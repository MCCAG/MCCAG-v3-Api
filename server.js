import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { createCanvas, loadImage } from 'canvas';

import { fetchMojangProfile, fetchSkinWebsiteProfile } from './Scripts/Network.js';
import { renderAvatar, renderBackground, regulateAvatar } from './Scripts/Index.js';
import { Logger } from './Scripts/Logger.js';

const app = express();
const port = process.env.PORT || 3000;

// 请求日志中间件
app.use((req, res, next) => {
    const startTime = Date.now();

    Logger.log('Server', `${req.method} ${req.url}`);

    // 记录响应时间
    res.on('finish', () => {
        const duration = Date.now() - startTime;
        Logger.log('Server', `${res.statusCode} - ${duration}ms`);
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
    Logger.log('SkinLoader', `开始获取皮肤，方式: ${method}`);

    try {
        switch (method) {
            case 'mojang':
                Logger.log('SkinLoader', `Mojang模式 - 用户名: ${data.username}`);
                const profile = await fetchMojangProfile(data.username);
                if (!profile) {
                    Logger.error('SkinLoader', `未找到玩家信息: ${data.username}`);
                    throw new Error('未找到该玩家信息');
                }
                Logger.log('SkinLoader', `找到玩家: ${profile.name}`);

                try {
                    const textureResponse = await fetch(`https://sessionserver.mojang.com/session/minecraft/profile/${profile.id}?unsigned=false`);
                    if (!textureResponse.ok)
                        throw new Error(`获取纹理信息失败: ${textureResponse.status}`);

                    const textureData = await textureResponse.json();
                    if (!textureData.properties || !textureData.properties[0])
                        throw new Error('纹理数据不存在');

                    const textureInfo = JSON.parse(Buffer.from(textureData.properties[0].value, 'base64').toString());
                    const skinUrl = textureInfo.textures.SKIN.url;

                    const skinImage = await loadImage(skinUrl);
                    Logger.log('SkinLoader', `皮肤加载成功 - ${skinImage.width}x${skinImage.height}`);
                    return skinImage;
                } catch (imageError) {
                    Logger.error('SkinLoader', '皮肤图片加载失败', imageError);
                    throw new Error(`加载皮肤图片失败: ${imageError.message}`);
                }

            case 'website':
                Logger.log('SkinLoader', `皮肤站模式 - ${data.website}/${data.username}`);
                const website = 'https://' + data.website;

                try {
                    const skinData = await fetchSkinWebsiteProfile(website, data.username);
                    if (!skinData || !skinData.skins) {
                        Logger.error('SkinLoader', `皮肤站未找到玩家: ${data.username}`);
                        throw new Error('未找到该玩家的皮肤数据');
                    }

                    const texturePath = Object.values(skinData.skins)[0];
                    const textureUrl = `${website}/textures/${texturePath}`;

                    const skinImage = await loadImage(textureUrl);
                    Logger.log('SkinLoader', `皮肤站图片加载成功 - ${skinImage.width}x${skinImage.height}`);
                    return skinImage;
                } catch (websiteError) {
                    Logger.error('SkinLoader', '皮肤站请求失败', websiteError);
                    throw new Error(`皮肤站请求失败: ${websiteError.message}`);
                }

            case 'upload':
                Logger.log('SkinLoader', `上传模式 - ${data.skinBuffer?.length || 0} bytes`);
                if (!data.skinBuffer) {
                    Logger.error('SkinLoader', '上传模式但未找到文件数据');
                    throw new Error('未找到上传的皮肤文件');
                }

                try {
                    const skinImage = await loadImage(data.skinBuffer);
                    Logger.log('SkinLoader', `上传图片加载成功 - ${skinImage.width}x${skinImage.height}`);
                    return skinImage;
                } catch (uploadError) {
                    Logger.error('SkinLoader', '上传图片加载失败', uploadError);
                    throw new Error(`上传图片格式错误: ${uploadError.message}`);
                }

            default:
                Logger.error('SkinLoader', `不支持的获取方式: ${method}`);
                throw new Error('请提供有效的皮肤获取方式 (mojang, website, upload)');
        }
    } catch (error) {
        Logger.error('SkinLoader', `获取皮肤失败 - ${method}`, error);
        throw error;
    }
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
    Logger.log('Generator', '开始处理头像生成请求');

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

        if (!method) {
            Logger.error('Generator', '参数错误: 缺少 method 参数');
            return res.status(400).json({
                error: '参数错误',
                message: '请指定皮肤获取方式 (mojang, website, upload)'
            });
        }

        // 验证必填参数
        if (method === 'mojang' && !username) {
            Logger.error('Generator', 'mojang 模式缺少 username');
            return res.status(400).json({
                error: '参数错误',
                message: 'mojang 模式需要提供 username 参数'
            });
        }

        if (method === 'website' && (!username || !website)) {
            Logger.error('Generator', 'website 模式缺少必要参数');
            return res.status(400).json({
                error: '参数错误',
                message: 'website 模式需要提供 username 和 website 参数'
            });
        }

        if (method === 'upload' && !req.file) {
            Logger.error('Generator', 'upload 模式缺少文件');
            return res.status(400).json({
                error: '参数错误',
                message: 'upload 模式需要上传皮肤文件'
            });
        }

        // 解析JSON字符串参数
        let parsedGenerateOptions, parsedBackgroundOptions;

        try {
            parsedGenerateOptions = typeof generateOptions === 'string' ? JSON.parse(generateOptions) : generateOptions;
            parsedBackgroundOptions = typeof backgroundOptions === 'string' ? JSON.parse(backgroundOptions) : backgroundOptions;
        } catch (parseError) {
            Logger.error('Generator', '参数解析失败', parseError);
            return res.status(400).json({
                error: '参数错误',
                message: '选项格式错误，请提供有效的 JSON'
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

        // 获取皮肤图片
        const skinData = { username, website, skinBuffer: req.file?.buffer };
        const skinImage = await getSkinImage(method, skinData);

        // 生成头像
        Logger.log('Generator', `开始渲染 - 模型: ${modelType}`);
        const avatarCanvas = renderAvatar(skinImage, modelType, defaultGenerateOptions);

        const regulatedAvatarCanvas = regulateAvatar(avatarCanvas, defaultGenerateOptions);

        let finalCanvas;

        // 根据 withBackground 参数决定是否添加背景
        if (withBackground === true || withBackground === 'true') {
            Logger.log('Generator', '生成背景');
            const backgroundCanvas = renderBackground(modelType, defaultBackgroundOptions);
            finalCanvas = createCanvas(1000, 1000);
            const context = finalCanvas.getContext('2d');
            context.drawImage(backgroundCanvas, 0, 0);
            context.drawImage(regulatedAvatarCanvas, 0, 0);
        } else finalCanvas = regulatedAvatarCanvas;

        // 返回图片
        const buffer = finalCanvas.toBuffer('image/png');
        Logger.log('Generator', `生成完成 - ${buffer.length} bytes`);

        res.set({
            'Content-Type': 'image/png',
            'Content-Length': buffer.length,
            'Cache-Control': 'public, max-age=3600'
        });

        res.send(buffer);

    } catch (error) {
        Logger.error('Generator', '生成头像失败', error);

        // 根据错误类型返回不同的状态码和消息
        let statusCode = 500;
        let errorMessage = error.message;

        if (error.message.includes('未找到该玩家信息'))
            statusCode = 404;
        else if (error.message.includes('参数错误') || error.message.includes('格式错误'))
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
});

// 获取支持的模型类型
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
    Logger.error('Server', `服务器错误: ${req.method} ${req.url}`, error);

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
    Logger.log('Server', `服务器启动 - 端口: ${port}`);

    // 定期内存监控（每5分钟）
    setInterval(() => {
        const memoryUsage = process.memoryUsage();
        const heapUsedMB = Math.round(memoryUsage.heapUsed / 1024 / 1024);

        // 内存使用过高警告
        if (heapUsedMB > 500)
            Logger.warn('Monitor', `内存使用过高: ${heapUsedMB}MB`);
    }, 5 * 60 * 1000);
});

export default app;