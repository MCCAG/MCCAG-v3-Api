// 渲染模块
import { createCanvas } from 'canvas';
import { minimalOperationData } from './Data.js';
import { preprecessSkinImage, processImage } from './Image.js';

/**
 * 根据头像类型和皮肤尺寸获取操作列表
 * @param {string} avatarType - 头像类型
 * @param {Array} skinSize - 皮肤尺寸 [width, height]
 * @returns {Array} 操作列表
 */
function getOperations(avatarType, skinSize) {
    if (!minimalOperationData) return [];

    if (avatarType === 'head') return minimalOperationData.head;
    if (avatarType === 'big-head') avatarType = 'full';

    const skinVersion = (skinSize[0] === 64 && skinSize[1] === 32) ? 'old' : 'new';
    return minimalOperationData[avatarType][skinVersion];
}


/**
 * 处理图像部分（裁剪、缩放、镜像、阴影）
 * @param {CanvasRenderingContext2D} mainContext - 主画布上下文
 * @param {HTMLCanvasElement} skinCanvas - 皮肤图像画布
 * @param {Array} cropBox - 裁剪框 [x, y, width, height]
 * @param {number} scaleFactor - 缩放因子
 * @param {Array} pastePosition - 粘贴位置 [x, y]
 * @param {boolean} mirror - 是否镜像
 */
function operate(mainContext, skinCanvas, cropBox, mirror, scaleFactor, pastePosition) {
    const [pasteX, pasteY] = pastePosition;
    const [cropX, cropY, cropWidth, cropHeight] = cropBox;

    // 处理图片
    const canvas = processImage(
        skinCanvas, cropX, cropY, cropWidth, cropHeight,
        cropWidth * scaleFactor, cropHeight * scaleFactor, mirror || false
    );

    // 将裁剪的图像粘贴到带边框的画布中（15像素内边距）
    // 在主上下文中绘制带边框的图像（调整粘贴位置）
    mainContext.drawImage(canvas, pasteX, pasteY);
}

/**
 * 渲染头像
 * @param {HTMLImageElement} skinImage - 皮肤图像
 * @param {string} avatarType - 头像类型 ('head', 'full', 'big_head')
 * @returns {HTMLCanvasElement} 渲染后的画布
 */
export function renderAvatar(skinImage, avatarType) {
    let canvas = createCanvas(1000, 1000);
    const context = canvas.getContext('2d');
    context.shadowColor = `rgba(0, 0, 0, 0.2)`;
    context.shadowOffsetX = 0;
    context.shadowOffsetY = 0;
    context.shadowBlur = 15;

    // 清空画布
    context.clearRect(0, 0, 1000, 1000);

    // 确定皮肤尺寸
    const skinSize = [skinImage.width, skinImage.height];

    skinImage = preprecessSkinImage(skinImage);
    // 获取操作列表
    const operations = getOperations(avatarType, skinSize);

    // 执行渲染操作
    for (const operation of operations) operate(context, skinImage, ...operation);

    // 如果是big_head类型，进行特殊处理
    if (avatarType === 'big-head') {
        const bigHeadCanvas = createCanvas(1400, 1400);
        const bigHeadContext = bigHeadCanvas.getContext('2d');

        // 放大图像
        bigHeadContext.imageSmoothingEnabled = false;
        bigHeadContext.drawImage(canvas, 0, 0, 1400, 1400);

        // 裁剪到1000x1000
        const finalCanvas = createCanvas(1000, 1000);
        const finalContext = finalCanvas.getContext('2d');
        finalContext.drawImage(bigHeadCanvas, 200, 0, 1000, 1000, 0, 0, 1000, 1000);

        return finalCanvas
    }
    
    return canvas;
}