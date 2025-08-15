// 渲染模块
import { createCanvas } from 'canvas';
import { sideOperationData } from './Data.js';
import { preprecessSkinImage, processImage } from './Image.js';


/**
 * 根据头像类型和皮肤尺寸获取操作列表
 * @param {Array} skinSize - 皮肤尺寸 [width, height]
 * @returns {Array} 操作列表
 */
function getOperations(skinSize) {
    if (!sideOperationData) return [];
    const skinVersion = (skinSize[0] === 64 && skinSize[1] === 32) ? 'old' : 'new';
    return sideOperationData[skinVersion];
}


/**
 * 处理图像部分(裁剪、缩放、镜像、阴影)
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

    // 将裁剪的图像粘贴到带边框的画布中(15像素内边距)
    // 在主上下文中绘制带边框的图像(调整粘贴位置)
    mainContext.drawImage(canvas, pasteX, pasteY);
}


function darkenAreasBatch(context, areas, factor = 0.8) {
    // 先计算所有区域的最小包围盒
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const [x, y, width, height] of areas) {
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x + width);
        maxY = Math.max(maxY, y + height);
    }
    const imageWidth = maxX - minX;
    const imageHeight = maxY - minY;
    const imageData = context.getImageData(minX, minY, imageWidth, imageHeight);
    const data = imageData.data;
    // 标记每个区域
    for (const [x, y, width, height] of areas) {
        for (let dy = 0; dy < height; dy++) {
            for (let dx = 0; dx < width; dx++) {
                const index = ((y - minY + dy) * imageWidth + (x - minX + dx)) * 4;
                data[index] *= factor;
                data[index + 1] *= factor;
                data[index + 2] *= factor;
            }
        }
    }
    context.putImageData(imageData, minX, minY);
}


/**
 * 渲染头像
 * @param {HTMLImageElement} skinImage - 皮肤图像
 * @param {boolean} texture - 是否渲染阴影纹理
 * @returns {HTMLCanvasElement} 渲染后的画布
 */
export function renderAvatar(skinImage, texture) {
    const canvas = createCanvas(1000, 1000);
    const context = canvas.getContext('2d');

    // 确定皮肤尺寸
    const skinSize = [skinImage.width, skinImage.height];

    skinImage = preprecessSkinImage(skinImage);
    // 获取操作列表
    const operations = getOperations(skinSize);

    // 执行渲染操作
    for (const operation of operations) operate(context, skinImage, ...operation);
    // 清空部分像素点
    context.clearRect(340, 640, 40, 40);
    context.clearRect(620, 640, 40, 40);

    // 高性能颜色加深处理
    if (texture) {
        darkenAreasBatch(context, [
            [300, 360, 120, 280], // 头部阴影
            [340, 640, 320, 80],
            [300, 720, 40, 280],
            [340, 720, 40, 40],
            [380, 720, 40, 280],
            [580, 760, 40, 240],
            [620, 720, 80, 40]
        ]);
    }

    // 渲染部分阴影
    const finalCanvas = createCanvas(1000, 1000);
    const finalContext = finalCanvas.getContext('2d');
    finalContext.shadowColor = 'rgba(29, 4, 4, 0.5)';
    finalContext.shadowOffsetX = 0;
    finalContext.shadowOffsetY = 0;
    finalContext.shadowBlur = 50;
    finalContext.drawImage(processImage(canvas, 0, 0, 1000, 1000, 1200, 1200), 100, 200, 1000, 1000, 0, 0, 1000, 1000);
    return finalCanvas;
}