import { createCanvas } from 'canvas';

export function processImage(
    image, cropX, cropY, cropWidth, cropHeight,
    scaledWidth = null, scaledHeight = null, mirror = false, smoothing = false
) {
    if (!scaledWidth) scaledWidth = cropWidth;
    if (!scaledHeight) scaledHeight = cropHeight;
    
    const canvas = createCanvas(scaledWidth, scaledHeight);
    const context = canvas.getContext('2d');
    
    context.imageSmoothingEnabled = smoothing;
    if (mirror) {
        context.translate(scaledWidth, 0);
        context.scale(-1, 1);
    }
    context.drawImage(image, cropX, cropY, cropWidth, cropHeight, 0, 0, scaledWidth, scaledHeight);
    return canvas;
}

export function preprecessSkinImage(image) {
    const skinSize = [image.width, image.height];
    // 调整皮肤图像尺寸
    const resizedSize = (skinSize[0] === 64 && skinSize[1] === 32) ? [128, 64] : [128, 128];
    return processImage(image, 0, 0, ...skinSize, ...resizedSize);
}

export function calculateAutoColors(image) {
    if (!image) return [];
    
    // 如果已经是 canvas，直接使用；否则转换为 canvas
    const canvas = processImage(image, 0, 0, image.width, image.height);
    const imageData = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    
    let pixelCount = 0;
    let totalR = 0, totalG = 0, totalB = 0;
    
    // 计算所有非透明像素的平均颜色
    for (let index = 0; index < data.length; index += 4) {
        const a = data[index + 3];
        if (a > 128) {
            totalR += data[index];
            totalG += data[index + 1];
            totalB += data[index + 2];
            pixelCount++;
        }
    }
    
    if (pixelCount === 0) return [];
    
    const avgR = Math.floor(totalR / pixelCount);
    const avgG = Math.floor(totalG / pixelCount);
    const avgB = Math.floor(totalB / pixelCount);
    const autoColors = [];
    for (let index = -2; index <= 7; index++) {
        const offset = index * 30;
        autoColors.push(`rgb(${Math.max(0, avgR - offset)}, ${Math.max(0, avgG - offset)}, ${Math.max(0, avgB - offset)})`);
    }
    return autoColors;
}