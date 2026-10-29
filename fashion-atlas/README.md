# Fashion Atlas — 阅读与服装设计

先打开 [index.html](index.html)。这是可单独离线打开的图鉴，不依赖游戏服务器。

## V4 改了什么

30篇正文从英语重新写起，随后配中文对照。文章从衣服、材料、动作或场景切入，去掉正文里的“本组设计”“我们的三张卡”等制作说明。每篇约200个英文词。相应词汇、阅读辨析、开放问题和正文依据一同更新。

保留90套造型的轮廓、配色、材料与单品设计，以及原有9张明确标为旧版的参考图。设计说明和品牌比较放在正文以外，便于独立阅读与继续修改。

## 引用状态

**还没有经核验的外部时尚评论引用。** 正文是原创阅读稿；题目中的引号指本篇正文，不是媒体或设计师原话。各篇 `external_citations` 为空，`citation_status` 明确为待补充。

2026-10-29访问 Vogue、British Vogue、The Guardian、The Met、V&A 和 FIT 的公开入口均被环境网络代理以 HTTPS CONNECT 403 拒绝。记录见 [references/source-access.json](references/source-access.json)。这些入口不是参考文献，不含假造的作者、日期或文章标题。

六个资料域名已加入环境配置草稿，但保存草稿不会更改当前实例。需在环境设置审阅并保存，再发布环境；实际访问恢复后，才能逐篇补读、核验和引用。没有绕过访问限制、登录墙或付费墙。

下一步资料编辑应为每条来源保存：作者、准确标题、媒体、日期、URL、实际访问时间、支持的具体句子，以及是直接短引还是原创转述。未读全文的页面不能标为已核查。品牌比较与历史关联仍需这一轮核验，不能当成研究定稿。

## 继续编辑

- `scripts/readings.py`：英文正文、中文对照、词汇、题目与答案依据。
- `scripts/designs.py`：90套造型设计。
- `scripts/brands.py`：品牌比较草稿。
- `scripts/card_copy.py`：逐套英文设计说明。
- `content.json`：生成后的结构化数据。
- `设计与阅读主稿.md`：生成后的全文，适合浏览和批注。
- `references/original-content-v2.json`：用户原版数据，保持原样。
- `reference-images/`：用户原有9张图片，未改动，非V4新图。

在仓库根目录运行（Python 3，仅标准库）：

```sh
python3 fashion-atlas/scripts/build.py
python3 fashion-atlas/scripts/verify.py
```

如需本地检查，可用 Python 的 HTTP 服务从 `fashion-atlas/` 提供静态文件。无需启动根目录游戏应用。图鉴支持编号、系列名、阅读标题搜索；设计总览可跳转到对应系列。

本目录不接入游戏、积分或解锁逻辑，不修改现有衣服与用户存档。新图、服装分层、纸样打样和穿戴验收均不属于本轮产物。英文结构说明不冒充完整双语生产技术包。
