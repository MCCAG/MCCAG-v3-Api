import { createCanvas } from 'canvas';
import { skinData } from './Data.js';
import { processImage, preprecessSkinImage } from './Image.js';

// 直接用processImage缩放
function scaleCanvas(sourceCanvas, targetWidth, targetHeight) {
    return processImage(sourceCanvas, 0, 0, sourceCanvas.width, sourceCanvas.height, targetWidth, targetHeight, false, false);
}

// 合并两层，直接在一个canvas上绘制
function layerSlices(bottomSlice, topSlice) {
    const canvas = createCanvas(
        Math.max(bottomSlice.width, topSlice.width),
        Math.max(bottomSlice.height, topSlice.height)
    );
    const context = canvas.getContext('2d');
    context.imageSmoothingEnabled = false;
    context.drawImage(bottomSlice, 0, 0);
    context.drawImage(topSlice, 0, 0);
    return canvas;
}

// 主色提取
function getDominantColor(canvas, x = 0, y = 0, width = null, height = null) {
    const context = canvas.getContext('2d', { willReadFrequently: true });
    width = width ?? canvas.width;
    height = height ?? canvas.height;
    
    const imageData = context.getImageData(x, y, width, height);
    const data = imageData.data;
    
    // 使用 Map 替代对象，提高大数据量性能
    const colorFrequency = new Map();
    let maxCount = 0;
    let dominantR = 0, dominantG = 0, dominantB = 0;

    for (let index = 0; index < data.length; index += 4) {
        const alpha = data[index + 3];
        if (alpha <= 128) continue;

        const r = data[index];
        const g = data[index + 1];
        const b = data[index + 2];
        
        // 使用整数键代替字符串，提高性能
        const colorKey = (r << 16) | (g << 8) | b;
        
        // 更新频率计数
        const count = (colorFrequency.get(colorKey) ?? 0) + 1;
        colorFrequency.set(colorKey, count);
        
        // 实时更新主导色，避免二次遍历
        if (count > maxCount) {
            maxCount = count;
            dominantR = r;
            dominantG = g;
            dominantB = b;
        }
    }
    return { r: dominantR, g: dominantG, b: dominantB };
}

// 填充canvas区域为主色
function fillCanvasRegion(canvas, color, x = 0, y = 0, width = null, height = null) {
    const context = canvas.getContext('2d');
    width = width || canvas.width;
    height = height || canvas.height;
    const imageData = context.getImageData(x, y, width, height);
    const data = imageData.data;
    for (let index = 0; index < data.length; index += 4) {
        const a = data[index + 3];
        if (a > 128) {
            data[index] = color.r;
            data[index + 1] = color.g;
            data[index + 2] = color.b;
        }
    }
    context.putImageData(imageData, x, y);
}

// 躯干主色处理
function processTorso(torsoCanvas) {
    // 直接在原canvas上处理
    const rowCount = 3, columnCount = 2;
    const partWidth = Math.floor(torsoCanvas.width / columnCount);
    const partHeight = Math.floor(torsoCanvas.height / rowCount);
    for (let row = 0; row < rowCount; row++) {
        for (let column = 0; column < columnCount; column++) {
            const x = column * partWidth;
            const y = row * partHeight;
            const w = (column === columnCount - 1) ? torsoCanvas.width - partWidth : partWidth;
            const h = (row === rowCount - 1) ? torsoCanvas.height - (2 * partHeight) : partHeight;
            const dominantColor = getDominantColor(torsoCanvas, x, y, w, h);
            fillCanvasRegion(torsoCanvas, dominantColor, x, y, w, h);
        }
    }
    return torsoCanvas;
}

// 手臂主色处理
function processArm(armCanvas) {
    const context = armCanvas.getContext('2d');
    const height = armCanvas.height;
    const upperExtractHeight = Math.floor(height * 0.75);
    const lowerExtractHeight = height - upperExtractHeight;
    const halfHeight = Math.floor(height * 0.5);
    const upperColor = getDominantColor(armCanvas, 0, 0, armCanvas.width, upperExtractHeight);
    const lowerColor = getDominantColor(armCanvas, 0, upperExtractHeight, armCanvas.width, lowerExtractHeight);
    fillCanvasRegion(armCanvas, upperColor, 0, 0, armCanvas.width, halfHeight);
    fillCanvasRegion(armCanvas, lowerColor, 0, halfHeight, armCanvas.width, height - halfHeight);
    return armCanvas;
}

// 腿主色处理
function processLeg(legCanvas) {
    const dominantColor = getDominantColor(legCanvas);
    fillCanvasRegion(legCanvas, dominantColor);
    return legCanvas;
}

// 画边框
function drawBorder(context, x, y, width, height, borderWidth, borderColor = 'black') {
    if (borderWidth <= 0) return;
    context.fillStyle = borderColor;
    context.fillRect(x - borderWidth, y - borderWidth, width + 2 * borderWidth, borderWidth);
    context.fillRect(x - borderWidth, y + height, width + 2 * borderWidth, borderWidth);
    context.fillRect(x - borderWidth, y - borderWidth, borderWidth, height + 2 * borderWidth);
    context.fillRect(x + width, y - borderWidth, borderWidth, height + 2 * borderWidth);
}

// 背景
function drawRadialBackground(context, width, height, lineCount, color1, color2, rotationAngle = 0) {
    if (lineCount <= 0) return;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.sqrt(centerX * centerX + centerY * centerY);
    const angleStep = (2 * Math.PI) / lineCount;
    const angleOffset = angleStep / 2;
    
    // 将旋转角度转换为弧度
    const rotationRadians = (rotationAngle * Math.PI) / 180;
    
    for (let index = 0; index < lineCount; index++) {
        const startAngle = index * angleStep + angleOffset + rotationRadians;
        const endAngle = (index + 1) * angleStep + angleOffset + rotationRadians;
        context.fillStyle = (index % 2 === 0) ? color1 : color2;
        context.beginPath();
        context.moveTo(centerX, centerY);
        context.arc(centerX, centerY, radius, startAngle, endAngle);
        context.closePath();
        context.fill();
    }
}

// 暗角
function drawVignette(context, width, height, intensity) {
    if (intensity <= 0) return;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.sqrt(centerX * centerX + centerY * centerY);
    const gradient = context.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
    const alpha = intensity / 100;
    gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
    gradient.addColorStop(0.6, `rgba(0, 0, 0, ${alpha * 0.3})`);
    gradient.addColorStop(1, `rgba(0, 0, 0, ${alpha})`);
    context.fillStyle = gradient;
    context.fillRect(0, 0, width, height);
}

export function renderAvatar(skinImage, options) {
    // 1. 放大原图
    skinImage = preprecessSkinImage(skinImage);
    // 2. 判断皮肤类型
    const skinType = skinImage.height === 128 ? 'new' : 'old';
    const operationData = skinData[skinType];
    // 3. 提取所有切片
    const slices = {};
    for (const name in operationData) {
        const { cropBox, mirror } = operationData[name];
        slices[name] = processImage(skinImage, ...cropBox, null, null, mirror);
    }

    // 4. 合并分层和处理各部分(直接在切片canvas上处理，减少canvas创建)
    const head = operationData.headOuter
        ? layerSlices(slices.head, slices.headOuter)
        : slices.head;
    const headScaled = scaleCanvas(head, 16, 16);

    const torsoLayered = operationData.torsoOuter
        ? layerSlices(slices.torso, slices.torsoOuter)
        : slices.torso;
    processTorso(torsoLayered);
    const torso = scaleCanvas(torsoLayered, 4, 6);

    const leftArmLayered = operationData.leftArmOuter && slices.leftArmOuter
        ? layerSlices(slices.leftArm, slices.leftArmOuter)
        : slices.leftArm;
    processArm(leftArmLayered);
    const leftArm = scaleCanvas(leftArmLayered, 2, 4);

    const rightArmLayered = operationData.rightArmOuter && slices.rightArmOuter
        ? layerSlices(slices.rightArm, slices.rightArmOuter)
        : slices.rightArm;
    processArm(rightArmLayered);
    const rightArm = scaleCanvas(rightArmLayered, 2, 4);

    const leftLegLayered = operationData.leftLegOuter && slices.leftLegOuter
        ? layerSlices(slices.leftLeg, slices.leftLegOuter)
        : slices.leftLeg;
    processLeg(leftLegLayered);
    const leftLeg = scaleCanvas(leftLegLayered, 2, 2);

    const rightLegLayered = operationData.rightLegOuter && slices.rightLegOuter
        ? layerSlices(slices.rightLeg, slices.rightLegOuter)
        : slices.rightLeg;
    processLeg(rightLegLayered);
    const rightLeg = scaleCanvas(rightLegLayered, 2, 2);

    // 合并腿到一个canvas
    const legs = createCanvas(4, 2);
    const legsContext = legs.getContext('2d');
    legsContext.imageSmoothingEnabled = false;
    legsContext.drawImage(leftLeg, 0, 0);
    legsContext.drawImage(rightLeg, 2, 0);

    // 5. 计算布局尺寸
    const headWidth = headScaled.width;
    const headHeight = headScaled.height;
    const torsoWidth = torso.width;
    const torsoHeight = torso.height;
    const armHeight = Math.max(leftArm.height, rightArm.height);
    const legsWidth = legs.width;
    const legsHeight = legs.height;
    const totalWidth = Math.max(
        headWidth + 2 * options.border,
        leftArm.width + torsoWidth + rightArm.width + 4 * options.border,
        legsWidth + 2 * options.border
    );
    const totalHeight = headHeight + Math.max(torsoHeight, armHeight) + legsHeight + 4 * options.border;

    // 6. 绘制人形到临时画布(只用一个canvas)
    const tempCanvas = createCanvas(totalWidth, totalHeight);
    const tempContext = tempCanvas.getContext('2d');
    tempContext.imageSmoothingEnabled = false;
    let currentY = options.border;
    const headX = (totalWidth - headWidth) / 2;
    drawBorder(tempContext, headX, currentY, headWidth, headHeight, options.border, options.color);
    tempContext.drawImage(headScaled, headX, currentY);
    currentY += headHeight + options.border;
    const bodyRowY = currentY;
    const bodyRowWidth = leftArm.width + torsoWidth + rightArm.width + 2 * options.border;
    const bodyRowStartX = (totalWidth - bodyRowWidth) / 2;
    const leftArmX = bodyRowStartX;
    drawBorder(tempContext, leftArmX, bodyRowY, leftArm.width, leftArm.height, options.border, options.color);
    tempContext.drawImage(leftArm, leftArmX, bodyRowY);
    const torsoX = leftArmX + leftArm.width + options.border;
    drawBorder(tempContext, torsoX, bodyRowY, torsoWidth, torsoHeight, options.border, options.color);
    tempContext.drawImage(torso, torsoX, bodyRowY);
    const rightArmX = torsoX + torsoWidth + options.border;
    drawBorder(tempContext, rightArmX, bodyRowY, rightArm.width, rightArm.height, options.border, options.color);
    tempContext.drawImage(rightArm, rightArmX, bodyRowY);
    currentY += Math.max(torsoHeight, armHeight) + options.border;
    const legsX = (totalWidth - legsWidth) / 2;
    drawBorder(tempContext, legsX, currentY, legsWidth, legsHeight, options.border, options.color);
    tempContext.drawImage(legs, legsX, currentY);

    // 7. 输出到最终画布
    const canvas = createCanvas(1000, 1000);
    const context = canvas.getContext('2d');
    context.imageSmoothingEnabled = false;
    
    // 计算缩放和定位
    const scaledWidth = totalWidth * 20;
    const scaledHeight = totalHeight * 20;
    const x = (canvas.width - scaledWidth) / 2;
    const y = (canvas.height - scaledHeight) / 2;
    
    context.drawImage(tempCanvas, x, y, scaledWidth, scaledHeight);
    return canvas;
}


export function renderBackground(options) {
    const { angle, colors, count, vignette } = options;
    const canvas = createCanvas(1000, 1000);
    const context = canvas.getContext('2d');
    context.imageSmoothingEnabled = false;
    drawRadialBackground(context, 1000, 1000, count, colors[0], colors[1], angle);
    if (vignette > 0) drawVignette(context, 1000, 1000, vignette);
    return canvas;
}
