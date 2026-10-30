> 历史参考：其中自动拟合、内片/后层要求不适用于新制作。以 SKILL.md、production-sop.md 和当前项目最新用户要求为准。旧 Node 批次合同不用于新 Python 候选包。

# 批次配置与复现

本 Skill 附带的脚本适配沈知微工程的图层命名（body、upper、hair-front/back、socks、shoes）。其他工程先改适配器或映射资源路径，不照搬肩腰坐标。

`batch.json` 放在批次目录；`masterDirectory`、`raw` 都相对该文件。`canvas` 为母版宽高；`requiredCounts` 按类别约束数量；`items` 为有稳定 ID 的款式清单。

每件至少包含 `id`、`category`（long-skirt / short-skirt / dress）、`name`、`raw`、`prompt`、`target`。

`target`：`top`、`hem` 为成品纵坐标；`centerX`、`waistY`、`waistWidth` 为腰部锚点；`maxWidth` 为裙摆基础缩放参考。`sourceWaistFraction` 是原稿实心主体包围盒内，腰线距顶部的高度比例，必须看原稿测量，不能所有连衣裙都写 0.30。

连衣裙可配置 `sourceShoulderFraction` + `target.shoulderY`：把领口、肩线、腰线分段归位。`target.shoulderWidth` 控制上半身初始缩放。`target.chestEase` 与 `chestFraction` 可调整胸部局部余量，修改后必须检查袖子和侧缝有没有波浪或断层。

窄裙可配置 `target.widthProfile`，内容为 `[高度比例, 目标宽度]` 的数组。它是针对已检查母版的轮廓修正，不是自动适配所有人物；裙摆弧线尖端不按逐行宽度硬拉满。出现大幅变形，应重出原稿。

`foregroundHandRects` 是母版手部前景区域 `[x,y,width,height]` 数组，使用身体原有 alpha 还原手部遮挡。换姿势、带手套或手部与裙摆重叠复杂时，需改成精确手部遮罩，矩形不能直接复用。

操作：生成原稿 → register → 打开 proof、必要时打开细节与无上衣图 → 修正 → accept → 下一件 → validate-batch。配置变更后重跑 register 会清除该件视觉签收，不能只改 JSON 标记。

脚本的技术检查仅覆盖画布、透明范围、边框、腰线和裙长等可测量项。它不能自动识别人脸、露内衣、材质风格和细节穿插，仍须逐件视觉检查。
