import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { createCanvas, loadImage } from 'canvas';
import { renderAvatar, renderBackground, regulateAvatar } from './Modules/Renderers/Index.js';
import { fetchMojangProfile, fetchSkinWebsiteProfile } from './Modules/Network.js';

const app = express();
const port = process.env.PORT || 3000;

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
 * 加载图片（统一处理）
 */
async function loadImageSafe(source) {
    try {
        return await loadImage(source);
    } catch (error) {
        console.error('加载图片失败:', error);
        throw new Error('加载图片失败');
    }
}

/**
 * 获取皮肤图片
 */
async function getSkinImage(method, data) {
    switch (method) {
        case 'mojang':
            const profile = await fetchMojangProfile(data.username);
            if (!profile) throw new Error('未找到该玩家信息');
            return await loadImageSafe(`https://crafatar.com/skins/${profile.id}`);

        case 'website':
            const website = 'https://' + data.website;
            const skinData = await fetchSkinWebsiteProfile(website, data.username);
            if (!skinData || !skinData.skins) throw new Error('未找到该玩家的皮肤数据');
            const texturePath = Object.values(skinData.skins)[0];
            return await loadImageSafe(`${website}/textures/${texturePath}`);

        case 'upload':
            return await loadImageSafe(data.skinBuffer);

        default:
            throw new Error('请提供有效的皮肤获取方式');
    }
}

// API路由

/**
 * 健康检查
 */
app.get('/health', (_req, res) => {
    res.json({ status: 'ok', message: 'Minecraft 头像生成器服务运行正常！' });
});

/**
 * 生成头像API
 */
app.post('/api/generate', upload.single('skin'), async (req, res) => {
    try {
        const {
            method,
            username,
            website,
            modelType = 'minimal',
            generateOptions = {},
            backgroundOptions = {}
        } = req.body;

        if (!method) {
            return res.status(400).json({
                error: '参数错误',
                message: '请指定皮肤获取方式 (mojang, website, upload)'
            });
        }

        // 解析JSON字符串参数
        const parsedGenerateOptions = typeof generateOptions === 'string'
            ? JSON.parse(generateOptions)
            : generateOptions;
        const parsedBackgroundOptions = typeof backgroundOptions === 'string'
            ? JSON.parse(backgroundOptions)
            : backgroundOptions;

        // 设置默认选项
        const defaultGenerateOptions = {
            type: 'head',
            scale: 100,
            shadow: 50,
            texture: true,
            color: '#ffffff',
            border: 10,
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
        let skinImage;
        const skinData = {
            username,
            website,
            skinBuffer: req.file?.buffer
        };

        skinImage = await getSkinImage(method, skinData);

        // 生成头像
        const avatarCanvas = renderAvatar(skinImage, modelType, defaultGenerateOptions);
        const regulatedAvatarCanvas = regulateAvatar(avatarCanvas, defaultGenerateOptions);

        // 生成背景
        const backgroundCanvas = renderBackground(modelType, defaultBackgroundOptions);

        // 合成最终图片
        const finalCanvas = createCanvas(1000, 1000);
        const ctx = finalCanvas.getContext('2d');

        // 绘制背景
        ctx.drawImage(backgroundCanvas, 0, 0);
        // 绘制头像
        ctx.drawImage(regulatedAvatarCanvas, 0, 0);

        // 返回图片
        const buffer = finalCanvas.toBuffer('image/png');

        res.set({
            'Content-Type': 'image/png',
            'Content-Length': buffer.length,
            'Cache-Control': 'public, max-age=3600'
        });

        res.send(buffer);

    } catch (error) {
        console.error('生成头像失败:', error);
        res.status(500).json({
            error: '生成头像失败',
            message: error.message
        });
    }
});

/**
 * 仅生成头像（无背景）
 */
app.post('/api/avatar', upload.single('skin'), async (req, res) => {
    try {
        const {
            method,
            username,
            website,
            modelType = 'minimal',
            generateOptions = {}
        } = req.body;

        if (!method) {
            return res.status(400).json({
                error: '参数错误',
                message: '请指定皮肤获取方式 (mojang, website, upload)'
            });
        }

        const parsedGenerateOptions = typeof generateOptions === 'string'
            ? JSON.parse(generateOptions)
            : generateOptions;

        const defaultGenerateOptions = {
            type: 'head',
            scale: 100,
            shadow: 50,
            texture: true,
            color: '#ffffff',
            border: 10,
            ...parsedGenerateOptions
        };

        // 获取皮肤图片
        const skinData = {
            username,
            website,
            skinBuffer: req.file?.buffer
        };

        const skinImage = await getSkinImage(method, skinData);

        // 生成头像
        const avatarCanvas = renderAvatar(skinImage, modelType, defaultGenerateOptions);
        const regulatedAvatarCanvas = regulateAvatar(avatarCanvas, defaultGenerateOptions);

        // 返回图片
        const buffer = regulatedAvatarCanvas.toBuffer('image/png');

        res.set({
            'Content-Type': 'image/png',
            'Content-Length': buffer.length,
            'Cache-Control': 'public, max-age=3600'
        });

        res.send(buffer);

    } catch (error) {
        console.error('生成头像失败:', error);
        res.status(500).json({
            error: '生成头像失败',
            message: error.message
        });
    }
});

/**
 * 获取玩家信息
 */
app.get('/api/player/:username', async (req, res) => {
    try {
        const { username } = req.params;
        const profile = await fetchMojangProfile(username);

        if (!profile) {
            return res.status(404).json({
                error: '玩家不存在',
                message: '未找到该玩家信息'
            });
        }

        res.json({
            id: profile.id,
            name: profile.name,
            skinUrl: `https://crafatar.com/skins/${profile.id}`,
            avatarUrl: `https://crafatar.com/avatars/${profile.id}`
        });

    } catch (error) {
        console.error('获取玩家信息失败:', error);
        res.status(500).json({
            error: '获取玩家信息失败',
            message: error.message
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
app.use((error, _req, res, _next) => {
    if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                error: '文件太大',
                message: '图片大小不能超过2MB'
            });
        }
    }

    console.error('服务器错误:', error);
    res.status(500).json({
        error: '服务器内部错误',
        message: error.message
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
    console.log(`🚀 Minecraft头像生成器服务器已启动`);
    console.log(`📍 服务地址: http://localhost:${port}`);
});

export default app;