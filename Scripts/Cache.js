import path from 'path';
import crypto from 'crypto';
import fs from 'fs/promises';

import { Logger } from './Logger.js';

class AvatarCache {
    constructor(options = {}) {
        this.cacheDir = options.cacheDir || './cache';
        this.maxAge = options.cacheMaxAge || 24 * 60 * 60 * 1000; // 24小时
        this.maxSize = options.cacheMaxSize || 100 * 1024 * 1024; // 100MB
        this.cleanupInterval = options.cacheCleanupInterval || 60 * 60 * 1000; // 1小时

        this.memoryCache = new Map();
        this.maxMemoryItems = options.cacheMaxMemoryItems || 100;

        this.init();
    }

    async init() {
        try {
            await fs.mkdir(this.cacheDir, { recursive: true });
            Logger.log('Cache', `缓存目录初始化完成: ${this.cacheDir}`);

            // 启动定期清理
            this.startCleanupTimer();

            // 启动时清理一次过期缓存
            await this.cleanup();
        } catch (error) {
            Logger.error('Cache', '缓存初始化失败', error);
        }
    }

    // 生成缓存键
    generateCacheKey(method, skinData, modelType, generateOptions, backgroundOptions) {
        const keyData = {
            method,
            skinData: this.sanitizeSkinData(skinData),
            modelType,
            generateOptions,
            backgroundOptions
        };
        const keyString = JSON.stringify(keyData);
        return crypto.createHash('md5').update(keyString).digest('hex');
    }

    // 清理敏感数据，只保留用于缓存键生成的必要信息
    sanitizeSkinData(skinData) {
        const sanitized = { ...skinData };

        // 对于上传的文件，使用文件内容的hash作为标识
        if (sanitized.skinBuffer) {
            sanitized.skinBufferHash = crypto.createHash('md5')
                .update(sanitized.skinBuffer)
                .digest('hex');
            delete sanitized.skinBuffer;
        }

        return sanitized;
    }

    // 获取缓存文件路径
    getCacheFilePath(cacheKey) {
        return path.join(this.cacheDir, `${cacheKey}.png`);
    }

    // 获取缓存元数据文件路径
    getMetaFilePath(cacheKey) {
        return path.join(this.cacheDir, `${cacheKey}.meta.json`);
    }

    // 从内存缓存获取
    getFromMemory(cacheKey) {
        const item = this.memoryCache.get(cacheKey);
        if (!item) return null;

        // 检查是否过期
        if (Date.now() - item.timestamp > this.maxAge) {
            this.memoryCache.delete(cacheKey);
            return null;
        }

        // 更新访问时间
        item.lastAccess = Date.now();
        return item.buffer;
    }

    // 存储到内存缓存
    setToMemory(cacheKey, buffer) {
        // 如果内存缓存已满，删除最久未访问的项
        if (this.memoryCache.size >= this.maxMemoryItems) {
            let oldestKey = null;
            let oldestTime = Date.now();

            for (const [key, item] of this.memoryCache) {
                if (item.lastAccess < oldestTime) {
                    oldestTime = item.lastAccess;
                    oldestKey = key;
                }
            }

            if (oldestKey) {
                this.memoryCache.delete(oldestKey);
                Logger.log('Cache', `内存缓存已满，删除最久未访问项：${oldestKey}`);
            }
        }

        this.memoryCache.set(cacheKey, {
            buffer,
            timestamp: Date.now(),
            lastAccess: Date.now()
        });
    }

    // 获取缓存
    async get(method, skinData, modelType, generateOptions, backgroundOptions) {
        const cacheKey = this.generateCacheKey(method, skinData, modelType, generateOptions, backgroundOptions);

        try {
            // 首先尝试从内存缓存获取
            const memoryResult = this.getFromMemory(cacheKey);
            if (memoryResult) {
                Logger.log('Cache', `内存缓存命中: ${cacheKey}`);
                return memoryResult;
            }

            // 尝试从磁盘缓存获取
            const filePath = this.getCacheFilePath(cacheKey);
            const metaPath = this.getMetaFilePath(cacheKey);

            // 检查文件是否存在
            const [fileStats, metaStats] = await Promise.allSettled([
                fs.stat(filePath),
                fs.stat(metaPath)
            ]);

            if (fileStats.status === 'rejected' || metaStats.status === 'rejected') return null;

            // 检查是否过期
            const fileAge = Date.now() - fileStats.value.mtime.getTime();
            if (fileAge > this.maxAge) {
                // 异步删除过期文件
                this.deleteCache(cacheKey).catch(err =>
                    Logger.error('Cache', '删除过期缓存失败', err)
                );
                return null;
            }

            // 读取缓存文件
            const buffer = await fs.readFile(filePath);

            // 更新元数据中的访问时间
            const meta = JSON.parse(await fs.readFile(metaPath, 'utf8'));
            meta.lastAccess = Date.now();
            await fs.writeFile(metaPath, JSON.stringify(meta));

            // 存储到内存缓存
            this.setToMemory(cacheKey, buffer);

            Logger.log('Cache', `磁盘缓存命中: ${cacheKey}`);
            return buffer;

        } catch (error) {
            Logger.error('Cache', `获取缓存失败: ${cacheKey}`, error);
            return null;
        }
    }

    // 设置缓存
    async set(method, skinData, modelType, generateOptions, backgroundOptions, buffer) {
        const cacheKey = this.generateCacheKey(method, skinData, modelType, generateOptions, backgroundOptions);

        try {
            // 存储到内存缓存
            this.setToMemory(cacheKey, buffer);

            // 存储到磁盘缓存
            const filePath = this.getCacheFilePath(cacheKey);
            const metaPath = this.getMetaFilePath(cacheKey);

            const meta = {
                cacheKey,
                method,
                modelType,
                size: buffer.length,
                created: Date.now(),
                lastAccess: Date.now(),
                generateOptions,
                backgroundOptions: backgroundOptions || null
            };

            await Promise.all([
                fs.writeFile(filePath, buffer),
                fs.writeFile(metaPath, JSON.stringify(meta, null, 2))
            ]);

            Logger.log('Cache', `缓存已保存: ${cacheKey} (${buffer.length} bytes)`);

        } catch (error) {
            Logger.error('Cache', `保存缓存失败: ${cacheKey}`, error);
        }
    }

    // 删除特定缓存
    async deleteCache(cacheKey) {
        try {
            const filePath = this.getCacheFilePath(cacheKey);
            const metaPath = this.getMetaFilePath(cacheKey);

            await Promise.allSettled([
                fs.unlink(filePath),
                fs.unlink(metaPath)
            ]);

            this.memoryCache.delete(cacheKey);

            Logger.log('Cache', `缓存已删除: ${cacheKey}`);
        } catch (error) {
            Logger.error('Cache', `删除缓存失败: ${cacheKey}`, error);
        }
    }

    // 清理过期缓存
    async cleanup() {
        try {
            const files = await fs.readdir(this.cacheDir);
            const metaFiles = files.filter(file => file.endsWith('.meta.json'));

            let deletedCount = 0;
            let totalSize = 0;
            const fileInfos = [];

            for (const metaFile of metaFiles) {
                try {
                    const metaPath = path.join(this.cacheDir, metaFile);
                    const meta = JSON.parse(await fs.readFile(metaPath, 'utf8'));
                    const cacheKey = meta.cacheKey;
                    const filePath = this.getCacheFilePath(cacheKey);

                    // 检查文件是否存在
                    const fileStats = await fs.stat(filePath).catch(() => null);
                    if (!fileStats) {
                        // 元数据文件存在但缓存文件不存在，删除元数据
                        await fs.unlink(metaPath);
                        continue;
                    }

                    const fileAge = Date.now() - fileStats.mtime.getTime();

                    if (fileAge > this.maxAge) {
                        // 删除过期文件
                        await this.deleteCache(cacheKey);
                        deletedCount++;
                    } else {
                        // 记录文件信息用于大小检查
                        fileInfos.push({
                            cacheKey,
                            size: fileStats.size,
                            lastAccess: meta.lastAccess || fileStats.mtime.getTime()
                        });
                        totalSize += fileStats.size;
                    }
                } catch (error) {
                    Logger.error('Cache', `处理缓存文件失败: ${metaFile}`, error);
                }
            }

            // 如果缓存总大小超过限制，删除最久未访问的文件
            if (totalSize > this.maxSize) {
                fileInfos.sort((a, b) => a.lastAccess - b.lastAccess);

                for (const fileInfo of fileInfos) {
                    if (totalSize <= this.maxSize) break;

                    await this.deleteCache(fileInfo.cacheKey);
                    totalSize -= fileInfo.size;
                    deletedCount++;
                }
            }

            if (deletedCount > 0) {
                Logger.log('Cache', `清理完成，删除了 ${deletedCount} 个过期/超限缓存文件`);
            }

            Logger.log('Cache', `缓存状态 - 文件数: ${fileInfos.length}, 总大小: ${Math.round(totalSize / 1024 / 1024)}MB`);

        } catch (error) {
            Logger.error('Cache', '缓存清理失败', error);
        }
    }

    // 启动定期清理定时器
    startCleanupTimer() {
        setInterval(() => {
            this.cleanup().catch(error =>
                Logger.error('Cache', '定期清理失败', error)
            );
        }, this.cleanupInterval);

        Logger.log('Cache', `定期清理已启动，间隔: ${this.cleanupInterval / 1000 / 60}分钟`);
    }

    // 获取缓存统计信息
    async getStats() {
        try {
            const files = await fs.readdir(this.cacheDir);
            const metaFiles = files.filter(file => file.endsWith('.meta.json'));

            let totalSize = 0;
            let totalFiles = 0;

            for (const metaFile of metaFiles) {
                try {
                    const cacheKey = metaFile.replace('.meta.json', '');
                    const filePath = this.getCacheFilePath(cacheKey);
                    const fileStats = await fs.stat(filePath);
                    totalSize += fileStats.size;
                    totalFiles++;
                } catch (error) {
                    // 忽略不存在的文件
                }
            }

            return {
                diskCache: {
                    files: totalFiles,
                    size: totalSize,
                    sizeFormatted: `${Math.round(totalSize / 1024 / 1024)}MB`
                },
                memoryCache: {
                    items: this.memoryCache.size,
                    maxItems: this.maxMemoryItems
                },
                config: {
                    maxAge: this.maxAge,
                    maxSize: this.maxSize,
                    cleanupInterval: this.cleanupInterval
                }
            };
        } catch (error) {
            Logger.error('Cache', '获取缓存统计失败', error);
            return null;
        }
    }

    // 清空所有缓存
    async clear() {
        try {
            const files = await fs.readdir(this.cacheDir);

            await Promise.all(
                files.map(file =>
                    fs.unlink(path.join(this.cacheDir, file))
                )
            );

            this.memoryCache.clear();

            Logger.log('Cache', '所有缓存已清空');
        } catch (error) {
            Logger.error('Cache', '清空缓存失败', error);
        }
    }
}

// 创建全局缓存实例
let avatarCache = null;

// 初始化缓存实例的函数
export function initializeCache(config = {}) {
    avatarCache = new AvatarCache(config);
    return avatarCache;
}

// 获取缓存实例
export function getCache() {
    if (!avatarCache) {
        throw new Error('缓存未初始化，请先调用 initializeCache()');
    }
    return avatarCache;
}

// 为了向后兼容，导出默认实例
export { avatarCache };

export default AvatarCache;