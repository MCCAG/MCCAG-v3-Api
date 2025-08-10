function resizeCropBox(box, deltaX, deltaY, deltaWidth, deltaHeight) {
    return [ box[0] + deltaX, box[1] + deltaY, box[2] + deltaWidth, box[3] + deltaHeight ];
}

export const skinData = Object.freeze({
    old: {
        rightLeg: { cropBox: [8, 40, 8, 24], mirror: false },
        leftLeg: { cropBox: [8, 40, 8, 24], mirror: true },
        rightArm: { cropBox: [86, 40, 6, 24], mirror: false },
        leftArm: { cropBox: [86, 40, 6, 24], mirror: true },
        torso: { cropBox: [40, 40, 16, 24], mirror: false },
        head: { cropBox: [16, 16, 16, 16], mirror: false },
        headSide: { cropBox: [0, 16, 16, 16], mirror: false },
        headOuter: { cropBox: [80, 16, 16, 16], mirror: false },
    },
    new: {
        rightLeg: { cropBox: [8, 40, 8, 24], mirror: false },
        rightLegOuter: { cropBox: [8, 72, 8, 24], mirror: false },
        leftLeg: { cropBox: [40, 104, 8, 24], mirror: false },
        leftLegOuter: { cropBox: [8, 104, 8, 24], mirror: false },
        rightArm: { cropBox: [86, 40, 6, 24], mirror: false },
        rightArmSide: { cropBox: [98, 40, 6, 24], mirror: false },
        rightArmOuter: { cropBox: [88, 72, 6, 24], mirror: false },
        leftArm: { cropBox: [74, 104, 6, 24], mirror: false },
        leftArmSide: { cropBox: [92, 40, 6, 24], mirror: false },
        leftArmOuter: { cropBox: [104, 104, 6, 24], mirror: false },
        torso: { cropBox: [40, 40, 16, 24], mirror: false },
        torsoOuter: { cropBox: [40, 72, 16, 24], mirror: false },
        head: { cropBox: [16, 16, 16, 16], mirror: false },
        headSide: { cropBox: [0, 16, 16, 16], mirror: false },
        headOuter: { cropBox: [80, 16, 16, 16], mirror: false },
    }
});


export const minimalOperationData = Object.freeze({
    head: [
        [skinData.new.head.cropBox, skinData.new.head.mirror, 37.5, [200, 200]],
        [skinData.new.headOuter.cropBox, skinData.new.headOuter.mirror, 41, [175, 175]]
    ],
    full: {
        old: [
            [skinData.old.torso.cropBox, skinData.old.torso.mirror, 8.0625, [437, 561]],
            [skinData.old.rightLeg.cropBox, skinData.old.rightLeg.mirror, 8.375, [434, 751]],
            [skinData.old.leftLeg.cropBox, skinData.old.leftLeg.mirror, 8.375, [505, 751]],
            [skinData.old.rightArm.cropBox, skinData.old.rightArm.mirror, 8.167, [388, 561]],
            [skinData.old.leftArm.cropBox, skinData.old.leftArm.mirror, 8.167, [566, 561]],
            [skinData.old.head.cropBox, skinData.old.head.mirror, 26.875, [287, 131]],
            [skinData.old.headOuter.cropBox, skinData.old.headOuter.mirror, 30.8125, [254, 107]]
        ],
        new: [
            [skinData.new.torso.cropBox, skinData.new.torso.mirror, 8.0625, [437, 561]],
            [skinData.new.torsoOuter.cropBox, skinData.new.torsoOuter.mirror, 8.6575, [432, 555]],
            [skinData.new.rightLeg.cropBox, skinData.new.rightLeg.mirror, 8.375, [434, 751]],
            [skinData.new.rightLegOuter.cropBox, skinData.new.rightLegOuter.mirror, 9.375, [428, 737]],
            [skinData.new.leftLeg.cropBox, skinData.new.leftLeg.mirror, 8.375, [505, 751]],
            [skinData.new.leftLegOuter.cropBox, skinData.new.leftLegOuter.mirror, 9.375, [503, 737]],
            [skinData.new.rightArm.cropBox, skinData.new.rightArm.mirror, 8.167, [388, 561]],
            [skinData.new.rightArmOuter.cropBox, skinData.new.rightArmOuter.mirror, 9.5, [382, 538]],
            [skinData.new.leftArm.cropBox, skinData.new.leftArm.mirror, 8.167, [566, 561]],
            [skinData.new.leftArmOuter.cropBox, skinData.new.leftArmOuter.mirror, 9.5, [564, 538]],
            [skinData.new.head.cropBox, skinData.new.head.mirror, 26.875, [287, 131]],
            [skinData.new.headOuter.cropBox, skinData.new.headOuter.mirror, 30.8125, [254, 107]]
        ]
    }
});


export const sideOperationData = Object.freeze({
    old: [
        [resizeCropBox(skinData.old.head.cropBox, 0, 2, -2, -2), skinData.old.head.mirror, 20, [420, 360]],
        [resizeCropBox(skinData.old.headOuter.cropBox, 8, 2, -10, -2), skinData.old.headOuter.mirror, 20, [420, 320]],
        [resizeCropBox(skinData.old.headSide.cropBox, 8, 2, -10, -2), skinData.old.headSide.mirror, 20, [300, 360]],
        [skinData.old.rightArm.cropBox, skinData.old.rightArm.mirror, 20, [580, 720]],
        [skinData.old.torso.cropBox, skinData.old.torso.mirror, 20, [340, 640]],
        [resizeCropBox(skinData.old.leftArm.cropBox, 0, 0, -2, 0), skinData.old.leftArm.mirror, 20, [300, 720]]
    ],
    new: [
        [resizeCropBox(skinData.new.headSide.cropBox, 8, 2, -10, -2), skinData.new.headSide.mirror, 20, [300, 360]],
        [resizeCropBox(skinData.new.head.cropBox, 0, 2, -2, -2), skinData.new.head.mirror, 20, [420, 360]],
        [skinData.new.headOuter.cropBox, skinData.new.headOuter.mirror, 20, [420, 320]],
        [skinData.new.rightArmSide.cropBox, skinData.new.rightArmSide.mirror, 20, [580, 720]],
        [skinData.new.torso.cropBox, skinData.new.torso.mirror, 20, [340, 640]],
        [resizeCropBox(skinData.new.leftArmSide.cropBox, 0, 0, -2, 0), skinData.new.leftArmSide.mirror, 20, [300, 720]],
    ]
});