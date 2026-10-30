词秀 · 服装制作流程与模板
更新：2026-10-30

使用入口
1. 仓库根目录 AGENTS.md：项目约束。
2. assets/materials/PRODUCTION_SOP.md：唯一当前生产规范，优先于历史快照。
3. skills/dressup-single-item/SKILL.md：完整制作 skill；references/ 有类别规则、归位、遮挡及接入说明，scripts/ 有候选归位与只读预检。
4. 本目录 templates/：新单品规格、轮廓批准记录、归位配置、换色换料派生、验收与卡片关联的空白模板。示例均默认未批准、未验收，不能直接改成通过。
5. basic-style-templates-20261030.zip：50个基础款的完整底板快照。解压到仓库根目录，恢复 assets/garment-styles/。含原始PNG、style.json、geometry.json、索引与配方工具；文件字节不变，哈希见 template-archive.json。此包不自动覆盖正式服装或用户手调；已有同目录时先在独立目录解压比对。

模板不是完成的衣服
coverage.png / silhouette.png 是已归位轮廓快照，没有内部结构线，不是净版面料或真正线稿。保留原标记问题；不能据此自动批量换料。实际线稿必须在上色前生成并保存，净版材质须在已确认的衣服轮廓内重画。普通RGB黑白图不能冒充有透明度的遮罩。

一件衣服的顺序
库存与卡片拆件去重 → 读取当前手调和源图版本 → 明确槽位/松量/袖型/锚点 → 批准衣服自己的轮廓 → image_gen真实线稿 → 在轮廓内绘制材质 → 显式等比归位候选 → 技术预检 → 全身及100%局部视觉检查 → 游戏穿戴/脱下/切换/刷新 → 验收后再接入。
同结构只换色/面料/图案，保存styleId/baseId和源图/拟合哈希，不重新生一个版型。领口、袖型、衣长、裙量、褶位、鞋楦等实质变化另立规格。包不做；独立内搭可单独穿脱，不等于被禁止的衣服内片。

硬性要求
939×1676固定人物与姿势；服装全不画内片，back.png全透明。禁止沿人物alpha扩衣、取邻色填缝、拉长像素或模糊蒙混。缺布必须重画真实衣料。保留用户曲线/网格/缩放位置/擦除/印花/备注，已归位底图不能再次套网格。纱和蕾丝保留真实透明，不烘焙身体、肤色或内搭。
程序检查不签美术通过。尤其查看腋下、袖内缘、袖口、领口、腰口、裙裤摆与鞋脚；裁切损失检查通过也不能代替这些检查。

执行环境
Python 3 + Pillow + numpy。运行 scripts/register_front.py、validate_front.py 和 test_front_pipeline.py 前先读 --help。
Node工具重新提取基础款时需要 @napi-rs/canvas，可通过常规依赖安装，或把已有 node_modules 目录设为 WORDROBE_NODE_MODULES；不再固定到某台电脑的绝对依赖路径。生产素材需要调用可用的 image_gen，不提供伪造材质的程序替代品。

命令（从仓库根目录；python换成可用解释器）
python skills/dressup-single-item/scripts/test_front_pipeline.py
python skills/dressup-single-item/scripts/register_front.py --help
python skills/dressup-single-item/scripts/validate_front.py --help
python tools/validate-clothing-art.py --help
node tools/build-basic-styles.cjs
最后一条需本地服务 http://127.0.0.1:4173 和当前库存/基础款标记；会重提底板，不是纯检查命令。先备份现有底板，不在缺完整数据时盲目重跑。

当前基础款体系
tools/basic-style-specs.cjs：结构规格。
tools/build-basic-styles.cjs：从当前标记与已拟合源图提取底板。
模板包里的 assets/garment-styles/README.txt、recipe.js 和 manifest.json：详细合同、外观配方与50款索引。
tools/protected-material-repair.cjs：现有ID的受保护材质返修，包含快照/哈希/手调并发检查。不是自动发布按钮，不能跳过验收直接运行。
tools/soften-cuffs.py：已确认袖口的局部浅内弧辅助，不增加衣料，不生成新袖子。

历史文件
skill里的 register.cjs、accept.cjs、validate-batch.cjs 与 batch-schema.md 保留作历史核对，不能拿来给新Python候选包签收。SKILL.md及本项目当前SOP优先。
本次提交的是流程、模板、skill和配套代码；不代表全部历史衣服已修好，也不改变线上衣服、人物、默认搭配或展示白名单。
