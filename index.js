// 获取canvas
const canvas = document.getElementById("canvas");

// 获取画布的绘图环境
const ctx = canvas.getContext("2d")


let list = [];
/**
 * 画圆
 * @param ctx  画笔
 * @param cx   圆的中心的x坐标
 * @param cy   圆的中心的y坐标
 * @param r    圆的半径
 */
const drawCircle = (ctx, cx, cy, r) => {
    // 保存目前Canvas的状态, 将目前Canvas的状态推到绘图堆栈中
    ctx.save();
    // 开始路径
    ctx.beginPath();


    // 画圆弧，圆心: (cx, cy), 半径: r, 起始弧度: 0， 结束弧度: 2π
    ctx.arc(cx, cy, r, 0, Math.PI * 2)
    // 设置描边的颜色
    ctx.strokeStyle = "blue";
    // 描边
    ctx.stroke();

    //  闭合路径
    ctx.closePath();
    // 从绘图堆栈中的顶端弹出最近保存的状态，并且根据这些存储的值来设置当前绘图状态
    ctx.restore();

}
drawCircle(ctx, 100, 100, 50);
list.push({ x: 100, y: 100, r: 50 });

drawCircle(ctx, 200, 200, 20);
list.push({ x: 200, y: 200, r: 20 });

/**
 * 获取鼠标当前坐标
 * @param e
 * @param offset   画布偏移
 * @param scale    画布缩放比例
 * @returns {{x: number, y: number}}
 */
const getCanvasPosition = (e, offset = { x: 0, y: 0 }, scale = 1) => {
    return {
        x: (e.offsetX - offset.x) / scale,
        y: (e.offsetY - offset.y) / scale
    }
}

/**
 * 状态
 * IDLE: 空闲状态（拖拽结束）
 * DRAG_START: 拖拽开始
 * DRAGGING: 拖拽中
 * MOVE_START: 开始移动画布
 * MOVING: 画布移动中
 * @type {{IDLE: number, MOVING: number, MOVE_START: number, DRAGGING: number, DRAG_START: number}}
 */
const statusConfig = {
    IDLE: 0,
    DRAG_START: 1,
    DRAGGING: 2,
    MOVE_START: 3,
    MOVING: 4
}

/**
 * 画布信息
 * target: 拖拽的对象
 * lastEventPos: 鼠标按下时的位置
 * offsetEventPos: 偏移量, 鼠标和圆心的距离
 * offset: 画布偏移量
 * scale: 画布缩放的比例
 * scaleStep: 每次缩放的变化量
 * maxScale: 最大放大比例
 * minScale: 最小缩小比例
 * @type {{offsetEventPos: {x: null, y: null}, offset: {x: number, y: number}, lastEventPos: {x: null, y: null}, status: number, target: null, scale: number, scaleStep: number, maxScale: number, minScale: number}}
 */
const canvasInfo = {
    status: statusConfig.IDLE,
    target: null,
    lastEventPos: { x: null, y: null },
    offsetEventPos: { x: null, y: null },
    offset: { x: 0, y: 0 },
    scale: 1,
    scaleStep: .1,
    maxScale: 2,
    minScale: .5
}

// 禁止canvas的右键菜单
canvas.oncontextmenu = () => false;
/**
 * 按下鼠标时的监听事件
 */
canvas.addEventListener("mousedown", e => {
    const pos = getCanvasPosition(e, canvasInfo.offset, canvasInfo.scale);
    let circleRef = isInCircle(pos);
    if (e.button === 0) {
        // 鼠标按下的位置是否在list中能找到，如果找到，则返回引用的对象
        if (circleRef) {
            // 当在圆内按下鼠标时，拖拽对象指向list中对应的图形对象
            canvasInfo.target = circleRef;
            // 状态为开始拖动
            canvasInfo.status = statusConfig.DRAG_START;
            // 按下鼠标时的起始位置
            canvasInfo.lastEventPos = pos;
            // 改变鼠标样式
            canvas.style.cursor = "all-scroll";
        }
    } else if (e.button === 2 && !circleRef) {
        // 鼠标右键被按下 且不在圆内
        canvasInfo.status = statusConfig.MOVE_START;
        canvasInfo.lastEventPos = pos;
        canvasInfo.offsetEventPos = pos;
    }
})

/**
 * 移动鼠标时的监听事件
 */
canvas.addEventListener("mousemove", e => {
    const pos = getCanvasPosition(e, canvasInfo.offset, canvasInfo.scale);  //
    if (canvasInfo.status === statusConfig.DRAG_START && getDistance(pos, canvasInfo.lastEventPos) > 5) {
        // 当状态为开始拖拽，且移动的距离超过5，则状态改变为拖拽中
        canvasInfo.status = statusConfig.DRAGGING;
        // 当重绘图形时计算鼠标的偏移量
        canvasInfo.offsetEventPos = pos;
    } else if (canvasInfo.status === statusConfig.DRAGGING) {
        // 拖拽中
        const { target } = canvasInfo;
        // 因为按下鼠标时拖拽对象就已经指向list中的对象，所以在这里改变坐标时，list中对应的对象也会改变
        target.x += (pos.x - canvasInfo.offsetEventPos.x);
        target.y += (pos.y - canvasInfo.offsetEventPos.y);
        // 清空画板
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        // 遍历list，重新绘制图形
        list.forEach(item => {
            drawCircle(ctx, item.x, item.y, item.r);
        });
        canvasInfo.offsetEventPos = pos;
    } else if (canvasInfo.status === statusConfig.MOVE_START && getDistance(pos, canvasInfo.lastEventPos) > 5) {
        // 当状态为开始移动画布，且移动距离超过5， 则状态改变为移动中
        canvasInfo.status = statusConfig.MOVING;
        canvasInfo.offsetEventPos = pos;
    } else if (canvasInfo.status === statusConfig.MOVING) {
        // 移动画布中
        canvasInfo.offset.x += pos.x - canvasInfo.offsetEventPos.x;
        canvasInfo.offset.y += pos.y - canvasInfo.offsetEventPos.y;

        ctx.setTransform(canvasInfo.scale, 0, 0, canvasInfo.scale, canvasInfo.offset.x, canvasInfo.offset.y);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        list.forEach(item => {
            drawCircle(ctx, item.x, item.y, item.r);
        });
        canvasInfo.offsetEventPos = pos;

    }
})

canvas.addEventListener("mouseup", e => {
    // 拖拽状态置为空闲状态
    canvasInfo.status = statusConfig.IDLE;
    // 鼠标样式置为正常
    canvas.style.cursor = "";
    console.log("结束拖拽")
})

//

canvas.addEventListener("wheel", e => {
    // 阻止默认的滚轮事件
    e.preventDefault();
    const pos = getCanvasPosition(e, canvasInfo.offset, canvasInfo.scale);
    const { scaleStep, minScale, maxScale } = canvasInfo;
    const deltaX = pos.x / canvasInfo.scale * scaleStep;
    const deltaY = pos.y/ canvasInfo.scale * scaleStep;

    if (e.wheelDelta > 0 && canvasInfo.scale <= maxScale) {
        // 放大
        canvasInfo.offset.x -= deltaX;
        canvasInfo.offset.y -= deltaY;
        canvasInfo.scale += scaleStep;
    } else if (e.wheelDelta < 0 && canvasInfo.scale >= minScale) {
        // 缩小
        canvasInfo.offset.x += deltaX;
        canvasInfo.offset.y += deltaY;
        canvasInfo.scale -= scaleStep;
    }

    ctx.setTransform(canvasInfo.scale, 0, 0, canvasInfo.scale, canvasInfo.offset.x, canvasInfo.offset.y);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    list.forEach(item => {
        drawCircle(ctx, item.x, item.y, item.r);
    });
})

/**
 * 获取两个坐标的直线距离
 * @param p1
 * @param p2
 * @returns {number}
 */
const getDistance = (p1, p2) => {
    return Math.sqrt((p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2);
}

/**
 * 判断坐标是否在图形内
 * @param pos  鼠标按下时的坐标
 */
const isInCircle = (pos) => {
    for (let i = 0; i < list.length; i++) {
        // 如果两个坐标的直线距离小于圆的半径，则返回该圆形
        if (getDistance(list[i], pos) < list[i].r) {
            return list[i];
        }
    }
    return false;
}
