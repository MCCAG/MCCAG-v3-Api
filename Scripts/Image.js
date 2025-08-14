import { createCanvas } from 'canvas';
import { Logger } from './Logger.js';

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

    // 如果尺寸已经正确，直接返回原图
    if (skinSize[0] === resizedSize[0] && skinSize[1] === resizedSize[1]) 
        return image;

    const processedImage = processImage(image, 0, 0, ...skinSize, ...resizedSize);
    return processedImage;
}
