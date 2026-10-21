沈知微 · 同画布拆件 v2

打开：http://127.0.0.1:4173/assets/gentle-campus-v2/index.html
本地文件页面需要通过 HTTP 服务器读取 JSON，不建议直接双击 HTML。

人物：22 岁大四语言学学姐。外表温柔，吐槽精准，关心藏在复习安排里。详细人设与 12 条情境台词见 character.json 或页面。

本批独立件：
layers/upper.png       上衣组合件：白衬衫＋雾蓝开衫，不是两个可独立卸下的槽位
layers/skirt.png       深蓝百褶裙，补齐隐藏腰头，保留原图可见褶皱与裙摆
layers/bag.png         包身＋前段背带
layers/socks.png       完整袜子，包含袜脚
layers/shoes.png       一双乐福鞋，不含袜口
layers/hair-front.png  无刘海前发：中分发冠和鬓角
layers/hair-back.png   补全后的完整后发，放身体之后
layers/body.png        身体与原基础内搭，供检查发型与服装定位
layers/earrings.png    小银耳钉
layers/necklace.png    细项链与蓝色吊坠

所有导出均为 939 × 1676 RGBA，原点 (0,0)，保持透明画布，不对单个物件自动居中。预览大图会放大单件以便查看，但下载原 PNG 始终保留完整画布。

切分方法：固定画布＋轮廓 alpha 遮罩。原图可见区域保持源 RGB；遮挡区域先用 image_gen 补画，再记录几何归位。不要把重新生成的区域称为原图无损裁切。来源见 layers.json 与 registration.json。

上衣去除包带与头发遮挡后补画。裙子只用补画填隐藏区，可见褶皱从原套装恢复。袜子补全脚部，并按身体脚部轮廓加 2px 布料余量。后发补画了原先被头和身体挡住的中间部分；前发从原母版切出。相关提示词在 generation-prompts.txt，图像生成使用内置 image_gen。

穿鞋遮挡：显示鞋子时，将 body.png 与 socks.png 分别换成 body-shoes-on.png 与 socks-shoes-on.png。鞋内的脚和袜脚被隐藏，避免脚趾轮廓从鞋边露出。卸鞋必须切回完整版本。不要删除完整袜脚。

建议层序：后发 → 身体与内搭 → 袜 → 下衣 → 上衣 → 鞋 → 包 → 项链 → 耳饰 → 前发。

检查：深浅底切换，逐个开关上下装、包、袜、鞋和前后发；重点看领口、腕口、腰头、袜口、鞋口。qa.json 检查尺寸、透明度和切分源 RGB 一致性；程序检查不能代替人工边缘签收。

当前状态：已完成彩色同画布分件，可预览、单独取用和组合检查；仍标记为 cut-preview，尚未交付独立线稿、基色、阴影、色区遮罩，不能直接宣称任意改色的生产资产。首饰极小，仍需放大人工修边。

复现顺序（需要本机 bundled sharp 与 @napi-rs/canvas，路径见脚本）：
node split.cjs                 首次生成可见区遮罩
node register-repairs.cjs      补画归位并恢复原图可见裙褶
node split.cjs                 导出最终同画布切片与穿鞋遮挡版本
node contact.cjs               导出拆件总览与叠加预览
node qa.cjs                    检查记录

split.cjs 的轮廓坐标是这一人物版本的定义，不可直接用于不同体型人物。所有新版本必须保留母版与旧素材，不要覆盖原始图片。
