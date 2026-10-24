# 统一素材库

主界面、印花和修版统一从这个目录读取素材。

衣橱「删除这件」为可撤销删除，状态单独保存在 `published/deleted-garments.json`；衣橱、印花和微调同步隐藏，相同 ID 不会因自动入库而复活。原图、版型、印花与备注保留，点击「撤销删除」按最近顺序恢复，刷新页面后仍可撤销。

美术共同规范见 [PRODUCTION_SOP.md](PRODUCTION_SOP.md)。当前唯一人物母版是 `characters/open-arms/body.png`（939×1676，后期张臂版）；`characters/campus/` 只保留历史来源，不再用于预览或新出图。所有批次按 `assets/deliveries/README.txt` 自动入库。

- `garments/`：可选衣服的固定编辑源、透明前后片、缩略图与轮廓，当前数量以 `catalog.json` 为准。
- `patterns/motifs/`：207 张新增透明图案、512 方形版、源图与检查图。
- `patterns/classic/`：9 张原有印花图案。
- `characters/`：统一人物母版与历史人物来源档案。
- `published/`：当前生效的服装、修版和印花版本；调整后自动写入这里。
- `sources/imported/`：37 件导入素材的原始切图与接入清单。
- `catalog.json`：素材分类与数量索引。
- `migration.json`：整理时的版本和草稿校验记录。

`garments/` 是固定编辑来源，不要用修版后的图反复覆盖它；当前可用版看 `published/` 的 JSON 清单。

其他会话仍在使用的 `assets/atelier-unified-v2/`、`assets/extracted-motifs-v1/` 和旧原画目录保留为生成工作区；未完成的重绘不替换当前衣服。旧 `assets/live-wardrobe/` 保留历史版本及旧脚本需要的快照，应用的新保存写入本目录的 `published/`。旧链接由服务端兼容解析。

美术成果已合入同一库：28 件现有衣服带可编辑的领口/腰口前后片，3 款无发上身内搭位于内衣分类。固定编辑源与原有网格、轮廓保持不变；新开口在同一修版面板调整。`sources/art-results/` 保存导入来源与记录，不另设试衣间。

28 件的当前版本已直接采用美术试穿页的实际宽高、位置及前后片 PNG，见 `sources/art-results/adjusted-import.json`。更早的主界面调整在该目录的 `before-adjusted-import-*` 中备份；其余单品不变。

印花现在仅预览：点击「保存为新衣服」才生成独立单品，默认名称为图案名印花＋原衣服名＋三位编号。原衣服、修版草稿与旧自动印花记录不会被改写。旧自动印花记录另备份在 `sources/legacy-print-autosave/`。新单品记录在 `published/printed-garments.json`，仍使用同一个衣橱与修版面板。

新增 16 款连衣裙前片位于连衣裙分类，来源 `sources/front-dresses-16/`。原始 PNG 原样归档，939×1676 注册图只作整数平移，无缩放/拉伸/自动变形；透明 back 仅为技术占位。待手调状态保留在内部 QA，不显示额外标签；尚未验收穿戴，也未分离可改色图层。
