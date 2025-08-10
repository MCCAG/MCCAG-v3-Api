import { createCanvas } from 'canvas';
import { processImage } from './Image.js';
import { renderAvatar as renderSideAvater } from './Side.js';
import { renderAvatar as renderMinimalAvater } from './Minimal.js';
import { renderBackground as renderVintageBackground, renderAvatar as renderVintageAvater } from './Vintage.js';


export function renderAvatar(skinImage, modelType, options) {
    if (modelType === 'minimal') return renderMinimalAvater(skinImage, options.type);
    else if (modelType === 'vintage') return renderVintageAvater(skinImage, options);
    else if (modelType === 'side') return renderSideAvater(skinImage, options.texture);
    // 其他类型的渲染逻辑可以在这里添加
    throw new Error(`不支持的类型：${modelType}`);
}


export function renderBackground(modelType, options = null) {
    // 计算旋转后需要的绘制区域大小
    function calculateRotatedBounds(width, height, rotationAngle) {
        const radians = rotationAngle * Math.PI / 180;
        const cos = Math.abs(Math.cos(radians));
        const sin = Math.abs(Math.sin(radians));

        // 计算旋转后的边界框
        const rotatedWidth = width * cos + height * sin;
        const rotatedHeight = width * sin + height * cos;

        return {
            width: Math.ceil(rotatedWidth),
            height: Math.ceil(rotatedHeight)
        };
    }

    const { angle, colors, image } = options;
    const canvas = createCanvas(1000, 1000);
    const context = canvas.getContext('2d');

    if (image) {
        // 支持旋转背景
        if (angle) {
            // 计算旋转后需要的区域大小
            const bounds = calculateRotatedBounds(1000, 1000, angle);
            const padding = Math.max(bounds.width, bounds.height) * 0.5; // 添加50%的边距确保安全

            context.translate(500, 500);
            context.rotate(angle * Math.PI / 180);
            context.translate(-500, -500);

            // 如果有自定义背景，绘制自定义背景
            const imageRatio = image.width / image.height;
            const canvasRatio = canvas.width / canvas.height;

            let drawWidth, drawHeight, offsetX, offsetY;

            if (imageRatio > canvasRatio) {
                drawHeight = canvas.height + padding * 2;
                drawWidth = image.width * (drawHeight / image.height);
                offsetX = (canvas.width - drawWidth) / 2;
                offsetY = -padding;
            } else {
                drawWidth = canvas.width + padding * 2;
                drawHeight = image.height * (drawWidth / image.width);
                offsetX = -padding;
                offsetY = (canvas.height - drawHeight) / 2;
            }

            context.drawImage(image, offsetX, offsetY, drawWidth, drawHeight);
        } else {
            // 不旋转时的正常绘制
            const imageRatio = image.width / image.height;
            const canvasRatio = canvas.width / canvas.height;

            let drawWidth, drawHeight, offsetX, offsetY;

            if (imageRatio > canvasRatio) {
                drawHeight = canvas.height;
                drawWidth = image.width * (drawHeight / image.height);
                offsetX = (canvas.width - drawWidth) / 2;
                offsetY = 0;
            } else {
                drawWidth = canvas.width;
                drawHeight = image.height * (drawWidth / image.width);
                offsetX = 0;
                offsetY = (canvas.height - drawHeight) / 2;
            }

            context.drawImage(image, offsetX, offsetY, drawWidth, drawHeight);
        }
        return canvas;
    }
    if (modelType === 'vintage') return renderVintageBackground(options);

    if (colors.length <= 1) {
        context.fillStyle = colors[0];
        context.fillRect(0, 0, 1000, 1000);
        return canvas;
    }

    const gradientAngle = angle * Math.PI / 180;
    const startX = 500 - 500 * Math.cos(gradientAngle);
    const startY = 500 - 500 * Math.sin(gradientAngle);
    const endX = 500 + 500 * Math.cos(gradientAngle);
    const endY = 500 + 500 * Math.sin(gradientAngle);

    const gradient = context.createLinearGradient(startX, startY, endX, endY);
    for (let index = 0; index < colors.length; index++)
        gradient.addColorStop(index / (colors.length - 1), colors[index]);
    context.fillStyle = gradient;
    context.fillRect(0, 0, 1000, 1000);
    return canvas;
}


export function regulateAvatar(canvas, options) {
    const { shadow, scale } = options;
    // 从缩放后的图像中心裁剪出1000x1000的区域
    const scaledWidth = 10 * scale;
    const scaledHeight = 10 * scale;
    const scaledCanvas = createCanvas(scaledWidth, scaledHeight);
    const context = scaledCanvas.getContext('2d');
    context.shadowColor = `rgba(0, 0, 0, ${shadow / 100})`;
    context.shadowOffsetX = 0;
    context.shadowOffsetY = 0;
    context.shadowBlur = 40 * (scale / 100);
    context.drawImage(canvas, 0, 0, 1000, 1000, 0, 0, scaledWidth, scaledHeight);

    if (scaledWidth > 1000 && scaledHeight > 1000)
        return processImage(scaledCanvas, (scaledWidth - 1000) / 2, (scaledHeight - 1000) / 2, 1000, 1000, 1000, 1000);
    const fillCanvas = createCanvas(1000, 1000);
    const fillContext = fillCanvas.getContext('2d');
    fillContext.drawImage(scaledCanvas, 0, 0, scaledWidth, scaledHeight, (1000 - scaledWidth) / 2, (1000 - scaledHeight) / 2, scaledWidth, scaledHeight);
    return fillCanvas;
}
