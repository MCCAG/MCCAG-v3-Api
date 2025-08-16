// 头像缓存配置文件
export const config = {
    // 服务器端口
    port: 3000,

    // 服务器 token 若留空则无需填写，对所有接口均有用
    apiToken: null,
    // 缓存 api token 仅对缓存接口有用，若设置了 apiToken 则以 apiToken 为准
    cacheApiToken: null,

    // 是否启用缓存
    cacheEnabled: true,
    // 是否启用内存缓存
    cacheEnableMemoryCache: true,
    // 是否启用磁盘缓存
    cacheEnableDiskCache: true,

    // 缓存目录
    cacheDir: './cache',
    // 缓存过期时间（毫秒）
    // 默认: 24小时 = 24 * 60 * 60 * 1000
    cacheMaxAge: 24 * 60 * 60 * 1000,
    // 磁盘缓存最大大小（字节）
    // 默认: 100MB = 100 * 1024 * 1024
    cacheMaxSize: 100 * 1024 * 1024,
    // 内存缓存最大项目数
    // 默认: 100个项目
    cacheMaxMemoryItems: 100,
    // 清理间隔（毫秒）
    // 默认: 1小时 = 60 * 60 * 1000
    cacheCleanupInterval: 60 * 60 * 1000,
};

// 根据环境变量覆盖配置
if (process.env.PORT) config.port = parseInt(process.env.PORT);
if (process.env.API_TOKEN) config.apiToken = process.env.API_TOKEN;
if (process.env.CACHE_API_TOKEN) config.cacheApiToken = process.env.CACHE_API_TOKEN;
if (process.env.CACHE_DISABLED === 'true') config.cacheEnabled = false;
if (process.env.CACHE_MAX_AGE) config.cacheMaxAge = parseInt(process.env.CACHE_MAX_AGE) * 1000;
if (process.env.CACHE_MAX_SIZE) config.cacheMaxSize = parseInt(process.env.CACHE_MAX_SIZE) * 1024 * 1024;
if (process.env.CACHE_MAX_MEMORY_ITEMS) config.cacheMaxMemoryItems = parseInt(process.env.CACHE_MAX_MEMORY_ITEMS);

export default config;