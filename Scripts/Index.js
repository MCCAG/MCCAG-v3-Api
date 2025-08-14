import { createCanvas } from 'canvas';
import { processImage } from './Image.js';
import { renderAvatar as renderSideAvater } from './Side.js';
import { renderAvatar as renderMinimalAvater } from './Minimal.js';
import { renderBackground as renderVintageBackground, renderAvatar as renderVintageAvater } from './Vintage.js';


export function renderAvatar(skinImage, modelType, options) {
    if (modelType === 'minimal') return renderMinimalAvater(skinImage, options.type);
    else if (modelType === 'vintage') return renderVintageAvater(skinImage, options);
    else if (modelType === 'side') return renderSideAvater(skinImage, options.texture);
    throw new Error(`不支持的类型：${modelType}`);
}


export function renderBackground(modelType, options = null) {
    const { angle, colors, image } = options;
    const canvas = createCanvas(1000, 1000);
    const context = canvas.getContext('2d');

    if (image) {
        if (angle) {
            const radians = angle * Math.PI / 180;
            const cos = Math.abs(Math.cos(radians));
            const sin = Math.abs(Math.sin(radians));
            const rotatedWidth = 1000 * cos + 1000 * sin;
            const rotatedHeight = 1000 * sin + 1000 * cos;
            const padding = Math.max(Math.ceil(rotatedWidth), Math.ceil(rotatedHeight)) * 0.5;

            context.translate(500, 500);
            context.rotate(radians);
            context.translate(-500, -500);

            const imageRatio = image.width / image.height;
            const canvasRatio = 1;

            let drawWidth, drawHeight, offsetX, offsetY;
            if (imageRatio > canvasRatio) {
                drawHeight = 1000 + padding * 2;
                drawWidth = image.width * (drawHeight / image.height);
                offsetX = (1000 - drawWidth) / 2;
                offsetY = -padding;
            } else {
                drawWidth = 1000 + padding * 2;
                drawHeight = image.height * (drawWidth / image.width);
                offsetX = -padding;
                offsetY = (1000 - drawHeight) / 2;
            }

            context.drawImage(image, offsetX, offsetY, drawWidth, drawHeight);
        } else {
            const imageRatio = image.width / image.height;
            let drawWidth, drawHeight, offsetX, offsetY;

            if (imageRatio > 1) {
                drawHeight = 1000;
                drawWidth = image.width * (drawHeight / image.height);
                offsetX = (1000 - drawWidth) / 2;
                offsetY = 0;
            } else {
                drawWidth = 1000;
                drawHeight = image.height * (drawWidth / image.width);
                offsetX = 0;
                offsetY = (1000 - drawHeight) / 2;
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
