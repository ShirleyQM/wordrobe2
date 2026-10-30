# 归位、合成与预检代码

依赖 Python 3、Pillow、numpy。优先使用已配置的 bundled runtime。以下命令中 python 为该解释器，SKILL 为当前 skill 的绝对目录。所有配置图片路径相对配置文件所在目录解析；输出路径由命令明确指定。

## 归位候选包

`scripts/register_front.py` 沉淀实际绘制 alpha × 批准服装轮廓、显式等比归位、全透明 back、浅深底、人物试穿、100% 局部与哈希记录。没有按身体扩边或缺布填色，也不会自动拉伸或自动签收。

先准备原稿、独立批准的衣服遮罩和轮廓记录，再写配置：

```json
{
  "canvas": [939, 1676],
  "source": "original.png",
  "outline": "outline.png",
  "outlineRecord": "outline-record.json",
  "body": "body-reference.png",
  "registration": {"scale": 1.0, "translate": [0, 0]},
  "details": [[150, 350, 450, 850], [490, 350, 790, 850]]
}
```

坐标仅为配置示例，必须按本件肩腋、腰胯和袖口调整；不自动推断。没有旋转、宽度曲线、胸腰分段拟合或非等比缩放入口。同画布图通常 scale=1 / translate=[0,0]，切勿再自动对齐。源图不自动清理连通分量，避免误删蝴蝶结、流苏和蕾丝；杂点导致边界异常时先人工确认再清理。

`outline-record.json` 的内容必须来自真实批准与溯源，不能为了过检查任意标记：

```json
{
  "basis": "approved-garment-outline",
  "approved": true,
  "bodyAlphaExpanded": false,
  "sha256": "outline.png的实际SHA-256"
}
```

遮罩接受 L 灰度覆盖，或 LA/RGBA 的 alpha；拒绝普通 RGB 遮罩，以免把黑白 RGB 图的全不透明 alpha 当衣服。批准遮罩是服装自己的轮廓。哈希只证实文件身份，不证实轮廓来源正确。

```powershell
python "$SKILL/scripts/register_front.py" ./job/registration.json --output ./job/candidate-v1
```

输出目录必须不存在，失败不写最终候选包。工具保留：registered-paint.png、front.png、全透明 back.png、mask.png、review-light/dark.png、可选 tryon.png、各个 detail 图、qa.json 和参数快照。没有原稿复制，qa 保存输入哈希；制作方仍需归档原稿/轮廓/提示词及生成参考。参数快照的相对路径仍相对原配置目录，不可移到新目录直接重跑。

`body` 仅用于预览，不参与服装 alpha 计算。当前简单试穿为 body→衣服，长裙遮手等关系需另按实际渲染器制作前景遮挡证据；不把该预览当全部组合验收。

## 可选约束

在归位配置中设置 `forbidden` 指向禁止区域遮罩：领口后缘、袖筒后片等区域必须全透明。工具不能自己识别语义，禁止区要按本件设计确定。

`requiredOpaque` 标记应该有实布的内部，`opaqueThreshold` 默认250。排除抗锯齿边缘与透孔；纱/蕾丝的半透明位置不能放进必需不透明区。缺布失败后用 image_gen 画材质，不设置更低阈值掩盖缺陷。

源目录 coverage.json 如有 completedPixels>0 会被拒绝。这个检查只识别已知标记，不能证明其他路径没有旧扩边；必须独立查原始生成图和制作记录。

## 已归位图只读复检

```powershell
python "$SKILL/scripts/validate_front.py" --front ./job/candidate-v1/front.png --back ./job/candidate-v1/back.png --outline ./job/outline.png --outline-record ./job/outline-record.json --canvas 939 1676
```

可增加 `--forbidden ./job/forbidden.png` 和 `--required-opaque ./job/required.png`。退出码0表示技术约束通过，1表示失败；JSON中 visualPass=null、runtimeValidated=false，不能当签收记录。不得忽略退出码继续发布。

## 实际代码原则

- 输出 alpha = 已定位原稿 alpha × 批准的服装遮罩 / 255，不用遮罩替换原稿 alpha，避免把不存在的衣料或透孔变成实布。
- 等比仿射采样先转 Pillow RGBa 预乘颜色空间，采样后转回 RGBA，避免透明像素隐藏的 RGB 形成毛边。归位只做一次，不重复缩放。
- RGBA 叠加用 alpha_composite，不能 paste(tile,pos,tile) 后再重复乘 alpha。
- 不自动设 visualPass=true；输出文件哈希绑定验收证据。预检不会检测所有人体残留、内片或糊边，必须人工检查。
- 脚本不生成自动发现的发布 manifest、不写正式素材库。检查全部通过后才按目标项目合同发布；不重置保存的手调。

## 自检

```powershell
python "$SKILL/scripts/test_front_pipeline.py"
```

用临时合成样本验证半透明不被抹掉、空 back、等比定位、禁止区、缺布、旧扩边、越界与拒绝覆盖。它不是具体衣服的视觉验收。


## 防止正常原稿被通用轮廓硬裁

Afternoon Pause 毛衣曾在 alpha 相乘时被偏窄通用轮廓删掉约2.6万个实布像素，袖口罗纹、两侧布量和下摆被切断；游戏加载的是同一张裁后文件。原稿正常、back全透明、文件哈希一致，均不能证明裁切正确。

register_front.py 现在统计裁切前后 alpha 覆盖损失。默认超过总覆盖2%时阻止生产输出；这是排查阈值，不是美术合格线，阈值以下也必须逐件视觉检查。半透明材质按 alpha 覆盖量计算，不只统计不透明像素。

```powershell
python "$SKILL/scripts/register_front.py" ./job/registration.json --inspect-clipping --output ./job/clipping-inspection-v1
```

此命令成功只表示诊断证据已输出，不是技术通过。目录包含 registered-paint.png、clipped-preview.png、removed-paint.png、clipping-comparison.png 和 inspection.json；不输出 front.png，不签视觉通过、不写发布清单。

必须打开比较图与被删衣料图，再看人物全身和100%细节。检查左右袖口、两侧、腋下和裙腰/下摆等。大面积损失通常应先修定位或临时轮廓；若用户已经锁定轮廓，则重画让实际衣料符合设计，不以扩大遮罩违背用户版型。不允许脚本批量生成 reviewed=true 来消除报错。

只有确属有意删除、且已经实际检查的裁切，才在原配置增加 clippingReview，指向如下记录。sourceSha256、outlineSha256、canvas、registration、evidenceSha256 可从 inspection.json 读取；reason 写真实观察，evidence 路径相对审阅记录文件解析：

```json
{
  "reviewed": true,
  "sourceSha256": "实际原稿哈希",
  "outlineSha256": "实际轮廓哈希",
  "canvas": [939, 1676],
  "registration": {"scale": 1.0, "translate": [0, 0]},
  "reason": "实际观察到的有意裁切范围及原因",
  "evidence": "clipping-inspection-v1/clipping-comparison.png",
  "evidenceSha256": "实际比较图哈希"
}
```

审阅只绑定当前原稿、轮廓、画布、归位参数及证据文件；任一变化就重新检查。它不能代替成品视觉签收或游戏实际加载验收。
