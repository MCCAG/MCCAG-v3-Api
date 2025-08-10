// 网络请求模块
export async function request(url, max = 2, count = 0) {
    try {
        if (count >= max) return;
        const response = await fetch(url);
        if (response.ok) return await response.json();
        if (response.status === 404) return;
        console.warn(`网络请求失败（第 ${count} 次尝试）：`, response.status, response.statusText);
    } catch (error) {
        console.error(`网络请求失败（第 ${count} 次尝试）：`, error);
    }
    await new Promise((resolve) => setTimeout(resolve, 2000));
    return request(url, max, count + 1);
}

/**
 * 获取Mojang玩家档案
 * @param {string} player - 玩家名
 * @returns {Promise<Object|null>} 玩家档案信息
 */
export async function fetchMojangProfile(player) {
    return await request(`https://api.mojang.com/users/profiles/minecraft/${player}`);
}

/**
 * 获取皮肤站数据
 * @param {string} website - 皮肤站地址
 * @param {string} player - 玩家名
 * @returns {Promise<Object|null>} 皮肤站数据
 */
export async function fetchSkinWebsiteProfile(website, player) {
    return await request(`${website}/csl/${player}.json`);
}
