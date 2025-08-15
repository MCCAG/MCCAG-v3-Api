import { createCanvas } from 'canvas';
import { minimalOperationData } from './Data.js';
import { preprecessSkinImage, processImage } from './Image.js';
import { Logger } from './Logger.js';

function getOperations(avatarType, skinSize) {
    if (!minimalOperationData) return [];
    if (avatarType === 'head') return minimalOperationData.head;
    if (avatarType === 'big-head') avatarType = 'full';

    const skinVersion = (skinSize[0] === 64 && skinSize[1] === 32) ? 'old' : 'new';
    return minimalOperationData[avatarType][skinVersion];
}


function operate(mainContext, skinCanvas, cropBox, mirror, scaleFactor, pastePosition) {
    const [pasteX, pasteY] = pastePosition;
    const [cropX, cropY, cropWidth, cropHeight] = cropBox;

    const canvas = processImage(
        skinCanvas, cropX, cropY, cropWidth, cropHeight,
        cropWidth * scaleFactor, cropHeight * scaleFactor, mirror || false
    );

    mainContext.drawImage(canvas, pasteX, pasteY);
}

export function renderAvatar(skinImage, avatarType) {
    Logger.log('Minimal', `开始渲染 - 类型：${avatarType}`);
    
    const canvas = createCanvas(1000, 1000);
    const context = canvas.getContext('2d');
    
    context.clearRect(0, 0, 1000, 1000);
    context.shadowColor = `rgba(0, 0, 0, 0.2)`;
    context.shadowOffsetX = 0;
    context.shadowOffsetY = 0;
    context.shadowBlur = 15;

    const skinSize = [skinImage.width, skinImage.height];
    const processedSkinImage = preprecessSkinImage(skinImage);
    const operations = getOperations(avatarType, skinSize);

    if (operations.length === 0) {
        Logger.error('Minimal', `未找到操作列表 - 类型：${avatarType}`);
        const headCanvas = processImage(processedSkinImage, 8, 8, 8, 8, 200, 200);
        context.drawImage(headCanvas, 400, 400);
        return canvas;
    }

    for (const operation of operations) {
        operate(context, processedSkinImage, ...operation);
    }

    if (avatarType === 'big-head') {
        const bigHeadCanvas = createCanvas(1400, 1400);
        const bigHeadContext = bigHeadCanvas.getContext('2d');
        bigHeadContext.imageSmoothingEnabled = false;
        bigHeadContext.drawImage(canvas, 0, 0, 1400, 1400);

        const finalCanvas = createCanvas(1000, 1000);
        const finalContext = finalCanvas.getContext('2d');
        finalContext.drawImage(bigHeadCanvas, 200, 0, 1000, 1000, 0, 0, 1000, 1000);
        return finalCanvas;
    }
    
    return canvas;
}