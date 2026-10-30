# 换装背单词游戏：项目接入

项目根目录 D:/文档/ChatGPT/换装背单词游戏；此路径和坐标只属于当前用户项目，其他人物重新配置。工作区 AGENTS.md 与 assets/materials/PRODUCTION_SOP.md 最新版优先于 skill 内快照。

## 生产约束

当前母版 assets/materials/characters/open-arms/body.png，939×1676。不要改人物姿势、身体轮廓或给身体重新勾线。所有衣服不画内片；back 全透明。已有用户手调、擦除、印花、备注保留。腰挂衣/裙片为配件；包不做；重复款复用。

## 复用来源与禁止复用

- assets/deliveries/knit-gauze-capsule-v1/register.py 的真实绘图 alpha × 衣服遮罩、alpha_composite、浅深底/试穿已提炼进 scripts/register_front.py。批次原脚本有款式特定比例与包围盒猜测，不原样跨款复制。
- tools/validate-clothing-art.py 的只读技术检查已提炼进 scripts/validate_front.py，新增可配置 canvas。项目工具保留原接口，skill 内实现为可移植版本。
- 旧 skill register.cjs 的分段拉伸不再使用。旧 finish-edges / nearest-color / harmonic fill 及人物 alpha 补布逻辑不复用。
- 旧 sleeve-repaint-v1 仅换 RGB 强留 before alpha 的做法不能修复轮廓污染。粉色蕾丝和彩虹针织问题查 sources/sleeve-edge-investigation-v1；历史撤回签收不代表后来已修完。

## 真正的基础款能力

基础款标签和可换色/印花/面料能力分别验证。提供同坐标 base-mask、shadow、highlight、texture、lineart、material.json；必要 trim-mask 保护扣件和饰边。真正线稿在上色前保留，不从彩稿去色冒充。

复用 assets/garment-prints/material.js 的 M.pixels()：源 alpha 不扩张，布纹调制 RGB，阴影 multiply、高光 screen、线稿叠加。geometryDisplacement=false。通用格纹/花纹按独立平铺与缩放/偏移实现，不能改变轮廓。真实蕾丝透孔需要面料 alpha 能力，不能宣称现有 RGB 纹理代码已支持；新增时输出 alpha 只能是原 alpha 的子集。

登记合同对照 assets/deliveries/bookshop-plaid-v1 的基础衬衫；不要误把分离后的灰彩稿说成真正原线稿。浅色/蓝色/深色及适用面料实际测试。

## 新件和返修发布

新件：读 assets/deliveries/README.txt。已归位彩稿使用 approved-front-only-registered-import；真正分层件使用 approved-layered-registered-import。混合批次分别提供合适清单。全部检查完成最后写 manifest/delivery，候选目录不要放自动发现的清单。导入器不会自动运行本 skill 预检。

已有 ID 被追加导入跳过。修原件沿用 ID，必须读根目录 REGENERATION.md，按受保护返修流程替换，归档旧图。不得手写 collection 或把同件新 ID 当修好。

检查 app.js、wardrobe-store.cjs、art-delivery-sync.cjs 与 tools/prepare-art-deliveries.py 的当前实现后再接入，路径/合同不能仅凭快照推断。桌面端 jewelry 的 belt/waistwrap/armwarmers 分装备键，帽子 cap；移动端按当前实现验证，不擅自重建系统。

实际衣橱：核对图片URL/哈希、手调覆盖来源、切换/卸装/刷新。遇到袖子长条或模糊，先比原稿→归位→后处理→手调→当前加载文件，不盲改 CSS。源图已经有问题就回绘图链修。
