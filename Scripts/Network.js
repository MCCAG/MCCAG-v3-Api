import { Logger } from './Logger.js';

// 网络请求模块
export async function request(url, max = 3, count = 0) {
    try {
        if (count >= max) {
            Logger.error('Network', `达到最大重试次数 (${max})`);
            throw new Error(`网络请求失败，已重试 ${max} 次`);
        }

        // 设置请求超时
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10秒超时

        const response = await fetch(url, {
            signal: controller.signal,
            headers: { 'User-Agent': 'Minecraft-Cute-Avatar-Generator-Api' }
        });

        clearTimeout(timeoutId);

        if (response.ok) {
            const data = await response.json();
            return data;
        }

        if (response.status === 404)
            return null;

        throw new Error(`HTTP ${response.status}: ${response.statusText}`);

    } catch (error) {
        // 如果是最后一次尝试，抛出错误
        if (count >= max - 1) {
            Logger.error('Network', `请求失败: ${url}`, error);
            throw error;
        }

        // 等待后重试
        const delay = Math.min(2000 * Math.pow(2, count), 10000); // 指数退避，最大10秒
        await new Promise((resolve) => setTimeout(resolve, delay));

        return request(url, max, count + 1);
    }
}

/**
 * 获取Mojang玩家档案
 * @param {string} player - 玩家名
 * @returns {Promise<Object|null>} 玩家档案信息
 */
export async function fetchMojangProfile(player) {
    Logger.log('Network', `查询 Mojang 玩家: ${player}`);

    try {
        const profile = await request(`https://api.mojang.com/users/profiles/minecraft/${player}`);

        if (profile)
            Logger.log('Network', `找到玩家: ${profile.name}`);
        else
            Logger.log('Network', `玩家不存在: ${player}`);

        return profile;
    } catch (error) {
        Logger.error('Network', `查询 Mojang 失败: ${player}`, error);
        throw new Error(`查询 Mojang 玩家信息失败: ${error.message}`);
    }
}

/**
 * 获取皮肤站数据
 * @param {string} website - 皮肤站地址
 * @param {string} player - 玩家名
 * @returns {Promise<Object|null>} 皮肤站数据
 */
export async function fetchSkinWebsiteProfile(website, player) {
    Logger.log('Network', `查询皮肤站: ${player}@${website}`);

    try {
        const skinData = await request(`${website}/csl/${player}.json`);

        if (skinData)
            Logger.log('Network', `找到皮肤数据`);
        else
            Logger.log('Network', `皮肤站无此玩家: ${player}`);

        return skinData;
    } catch (error) {
        Logger.error('Network', `查询皮肤站失败: ${player}`, error);
        throw new Error(`查询皮肤站数据失败: ${error.message}`);
    }
}
