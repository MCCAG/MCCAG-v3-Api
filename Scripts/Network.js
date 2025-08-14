// 网络请求模块
export async function request(url, max = 3, count = 0) {
    const requestId = Math.random().toString(36).substr(2, 6);
    console.log(`[Network-${requestId}] 开始请求: ${url} (尝试 ${count + 1}/${max})`);
    
    try {
        if (count >= max) {
            console.error(`[Network-${requestId}] 达到最大重试次数 (${max})，请求失败`);
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

        console.log(`[Network-${requestId}] 响应状态: ${response.status} ${response.statusText}`);

        if (response.ok) {
            const data = await response.json();
            console.log(`[Network-${requestId}] 请求成功，数据大小: ${JSON.stringify(data).length} 字符`);
            return data;
        }
        
        if (response.status === 404) {
            console.log(`[Network-${requestId}] 资源不存在 (404)`);
            return null;
        }

        console.warn(`[Network-${requestId}] HTTP 错误: ${response.status} ${response.statusText}`);
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);

    } catch (error) {
        console.error(`[Network-${requestId}] 请求失败 (尝试 ${count + 1}/${max}):`, {
            message: error.message,
            name: error.name,
            cause: error.cause
        });

        // 如果是最后一次尝试，抛出错误
        if (count >= max - 1) {
            throw error;
        }

        // 等待后重试
        const delay = Math.min(2000 * Math.pow(2, count), 10000); // 指数退避，最大10秒
        console.log(`[Network-${requestId}] ${delay}ms 后重试...`);
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
    console.log(`[fetchMojangProfile] 查询玩家: ${player}`);
    
    try {
        const profile = await request(`https://api.mojang.com/users/profiles/minecraft/${player}`);
        
        if (profile) {
            console.log(`[fetchMojangProfile] 找到玩家: ${profile.name} (${profile.id})`);
        } else {
            console.log(`[fetchMojangProfile] 玩家不存在: ${player}`);
        }
        
        return profile;
    } catch (error) {
        console.error(`[fetchMojangProfile] 查询失败: ${player}`, error);
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
    console.log(`[fetchSkinWebsiteProfile] 查询皮肤站: ${website}, 玩家: ${player}`);
    
    try {
        const skinData = await request(`${website}/csl/${player}.json`);
        
        if (skinData) {
            console.log(`[fetchSkinWebsiteProfile] 找到皮肤数据:`, Object.keys(skinData));
        } else {
            console.log(`[fetchSkinWebsiteProfile] 皮肤站无此玩家: ${player}@${website}`);
        }
        
        return skinData;
    } catch (error) {
        console.error(`[fetchSkinWebsiteProfile] 查询失败: ${player}@${website}`, error);
        throw new Error(`查询皮肤站数据失败: ${error.message}`);
    }
}
