一、新建画布 新建一个文件夹，名称为canvasElementDrag，用idea打开 在项目根目录新建一个index.html 新建一个index.js，代码如下;

```aidl
console.log("画布元素拖拽")
```

在index.html的body中引入index.js，再添加一个canvas标签

```aidl
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="=width=device-width, initial-scale=1.0">
    <title>Title</title>
</head>
<body>
    <style>
        #canvas {
            width: 400px;
            height: 400px;
            border: 1px solid #000;
        }
    </style>
    <canvas id="canvas" width="400px" height="400px"></canvas>
    <script src="./index.js"></script>
</body>
</html>
```

用浏览器运行index.html，查看效果

二、画圆 修改index.js代码

```aidl
// 获取canvas
const canvas = document.getElementById("canvas");

// 获取画布的绘图环境
const ctx = canvas.getContext("2d")

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
```

查看效果：

三、拖拽 上一节我们成功画出了一个圆，如果我们想要拖拽它要怎么做呢？ 首先，我们需要知道画布上有哪些图形，因为canvas并不能告诉我们画布上有什么图形。 定义一个数组，每次在画布上绘制图形时都往数组里添加该图形的属性(圆的中心，半径)

```aidl
let list = [];
// ..
drawCircle(ctx, 100, 100, 50);
list.push({ x: 100, y: 100, r: 50 });
```

获取鼠标按下时的位置 给画布添加一个鼠标按下的监听事件

```aidl
canvas.addEventListener("mousedown", e => {
console.log(getCanvasPosition(e))
})```
再添加一个获取鼠标位置的方法
```const getCanvasPosition = e => {
return {
x: e.offsetX,
y: e.offsetY
}
}
```

我们需要判断当按下鼠标时，坐标是否在图形内，添加如下代码

```aidl
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
```

我们需要定义拖拽状态和拖拽对象的信息(包含状态， 拖拽目标， 拖拽的起始位置)

```aidl
/**
  * 状态
  * IDLE: 空闲状态（拖拽结束）
  * DRAG_START: 拖拽开始
  * DRAGGING: 拖拽中
  * @type {{IDLE: number, DRAG_START: number, DRAGGING: number}}
*/
const statusConfig = {
  IDLE: 0,
  DRAG_START: 1,
  DRAGGING: 2
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
```

修改鼠标按下时的监听，判断鼠标位置是否在图形数组内 canvas.addEventListener("mousedown", e => { const pos = getCanvasPosition(e); //
鼠标按下的位置是否在list中能找到，如果找到，则返回引用的对象 let circleRef = isInCircle(pos); if (circleRef) { // 当在圆内按下鼠标时，拖拽对象指向list中对应的图形对象
canvasInfo.target = circleRef; // 状态为开始拖动 canvasInfo.status = statusConfig.DRAG_START; // 按下鼠标时的起始位置
canvasInfo.lastEventPos = pos; // 改变鼠标样式 canvas.style.cursor = "all-scroll"; } })
定义移动鼠标时的监听事件 为防止鼠标的抖动而产生的误拖拽，我们还需要判断鼠标拖动的距离大于某个临界值才能确定是否要拖拽

```
/**
* 移动鼠标时的监听事件
  */
  canvas.addEventListener("mousemove", e => {
  const pos = getCanvasPosition(e);  //
  if (canvasInfo.status === statusConfig.DRAG_START && getDistance(pos, canvasInfo.lastEventPos) > 5) {
  // 当状态为开始拖拽，且移动的距离超过5，则状态改变为拖拽中
  canvasInfo.status = statusConfig.DRAGGING;
  // 当重绘图形时计算鼠标的偏移量
  canvasInfo.offsetEventPos = pos;
  } else if (canvasInfo.status === statusConfig.DRAGGING) {
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
  }
  })
  定义拖拽结束时的监听事件，清除拖拽状态
  canvas.addEventListener("mouseup", e => {
  // 拖拽状态置为空闲状态
  canvasInfo.status = statusConfig.IDLE;
  // 鼠标样式置为正常
  canvas.style.cursor = "";
  console.log("结束拖拽")
  })
```

查看效果:

四、画布缩放 给画布添加滚轮监听事件

```
canvas.addEventListener("wheel", e => {
// 阻止默认的滚轮事件
e.preventDefault();
// 获取鼠标在可视区域上的坐标
const pos = getCanvasPosition(e);
console.log(pos);
})
```

打开浏览器，在画布中滑动鼠标滚轮查看效果。 然而上面的代码获取的鼠标的位置是不准确的，我们让画布右移一段再看看效果。 通过ctx.translate(x, y)函数实现画布的位移。
我们在调用drawCircle绘制图形之前让画布向右偏移200看下效果。 ctx.translate(200, 0); drawCircle(ctx, 100, 100, 50);

偏移之后画布的x轴就向右移了200的长度。 此时我们把鼠标移动到图中偏移后的(0, 0)的位置滑动滚轮，发现输出的坐标时(200, 0)，这明显不符合我们的预期。
所以，我们需要通过计算得到鼠标在画布中的真实坐标，在滑动滚轮的监听事件中添加以下代码： const pos = getCanvasPosition(e); // 鼠标在画布上的真实坐标 const realPos = { x: pos.x
- canvasInfo.offset.x, y: pos.y - canvasInfo.offset.y }

因为缩放后，所有地方都要获取鼠标的真实坐标，所以我们改写getCanvasPosition函数 /**

* 获取鼠标当前坐标
* @param e
* @param offset 画布偏移
* @param scale 画布缩放比例
* @returns {{x: number, y: number}}
  */ const getCanvasPosition = (e, offset = { x: 0, y: 0 }, scale = 1) => { return { x: (e.offsetX - offset.x) / scale,
  y: (e.offsetY - offset.y) / scale } } 然后修改mousedown的监听事件 const pos = getCanvasPosition(e, canvasInfo.offset,
  canvasInfo.scale); 修改mousemove的监听事件 const pos = getCanvasPosition(e, canvasInfo.offset, canvasInfo.scale);
  修改鼠标滚轮的监听事件： canvas.addEventListener("wheel", e => { // 阻止默认的滚轮事件 e.preventDefault(); const pos = getCanvasPosition(e,
  canvasInfo.offset, canvasInfo.scale); const { scaleStep, minScale, maxScale } = canvasInfo; const deltaX = realPos.x /
  canvasInfo.scale * scaleStep; const deltaY = realPos.y/ canvasInfo.scale * scaleStep;

  if (e.wheelDelta > 0 && canvasInfo.scale <= maxScale) { // 放大 canvasInfo.offset.x -= deltaX; canvasInfo.offset.y -=
  deltaY; canvasInfo.scale += scaleStep; } else if (e.wheelDelta < 0 && canvasInfo.scale >= minScale) { // 缩小
  canvasInfo.offset.x += deltaX; canvasInfo.offset.y += deltaY; canvasInfo.scale -= scaleStep; }

  ctx.setTransform(canvasInfo.scale, 0, 0, canvasInfo.scale, canvasInfo.offset.x, canvasInfo.offset.y); ctx.clearRect(0,
  0, canvas.width, canvas.height); list.forEach(item => { drawCircle(ctx, item.x, item.y, item.r); }); })

五、画布拖拽









