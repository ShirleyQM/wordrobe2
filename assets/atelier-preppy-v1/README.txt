学院风单件素材 · V1

母版：references/body.png，939×1676，当前双臂展开、无刘海版本。
生成方式：内置 image_gen，逐件先生成原创线稿、校正试穿，再以上述线稿为参考上色。
实际提示词和生成文件记录：generation-record.json。

每件目录 items/<id>/
lineart-original.png：AI 原始线稿，不是彩色图自动去色。
color-original.png：AI 上色原稿。
lineart.png / display.png：归位到人物原画布的完整展示层。
front.png / back.png：穿戴前层和后层，同画布、真正透明 PNG。
lineart-front.png / lineart-back.png：对应线稿参考层。
alpha.png / back-mask.png：轮廓和前后分区遮罩。
item.json / qa.json：款式、坐标、技术与视觉检查记录。
tryon.png、front-white.png、front-dark.png：当前人物试穿与边缘证据。
短裙另有 tryon-with-shirt.png，用于检查有/无上衣的腰头关系。

这些是可独立穿戴的彩色素材，保留原始线稿；尚未拆成线稿/基色/独立材质阴影的可分区染色生产包。
AI 原稿按肩、腰、踝、鞋底归位，做了明确记录的缩放、局部横向调整及鞋子镜像，并非声称原稿无损切片。
后领、后腰口和鞋口后缘已拆到身体后方；鞋装会隐藏鞋内的基础脚部。当前验收只适用于这张母版。

独立面板：index.html；用现有本地服务器打开 /assets/atelier-preppy-v1/index.html。
不接积分、学习、商品解锁或其他业务数据。
“网格变形”：直接扭动彩色图片，格纹、扣子、缝线随网格一起移动。
“轮廓曲线”：复用 PrintGarment 顶点/曲线模块，调整透明裁切边界。蓝点为轮廓，橙柄为曲率。
双击蓝点把直线改为曲线；“增点”后点击轮廓线添加节点。
轮廓裁切只能修边，增加/移动衣服范围请用网格变形。
支持左右对称、撤销/重做、自动本地保存、导入/导出调整 JSON。
“下载单件”导出当前调整的透明 PNG，仍为 939×1676；“下载试穿图”导出当前人物搭配。
两款鞋在试穿时切换，原始素材各自独立保留。

后续制作仍沿用同母版与单件归位约定，素材进这个面板校正；无需修改学习游戏逻辑。
网格数学与资产清单校验：项目根目录 node test-atelier.cjs --complete。
