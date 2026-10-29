# Fashion Atlas V5

双击 index.html 即可离线使用。30个系列各有一条核实过正文的公开来源、原文短摘录、双语导读、2道选择题与1道开放题，共90题。60道客观题支持检查、解释与重试。开放题仅在页面临时输入，不上传、不持久化。

原文链接需要联网；核验时公开可读，未来站点访问条件可能变化。未确认个人署名或日期时，页面如实标注。收藏品的制作日期与文章发布日期分开处理，不混用。

导读与题目由本版编写，明确区别于第三方短摘录。没有第三方全文、图片下载或付费内容绕过。V4的90套设计以折叠区保留，旧品牌研究笔记不是V5来源证据。

文件：
- index.html：可离线打开的完整阅读版，含交互练习与打印样式。
- content.json：完整V5数据与原有设计；旧阅读在 legacy_* 字段保存。
- 阅读清单与题目_V5.md：可编辑的全部来源、导读与题目。
- references/curated-readings-v5.json：30条来源与题目，可直接维护。
- archive/content-v4.json：原始V4数据。
- reference-images/：V4已有的9张旧版参考图。
- scripts/build_v5.py：从来源清单与V4数据重建V5。不要运行旧版 build.py，后者会重建V4。

重建：python3 scripts/build_v5.py

需要PDF时点击网页的“打印 / 存为 PDF”；本包不混入旧版PDF。


## 前三篇游戏关卡

进入 [学习页](../learn.html) 的 Fashion Atlas。S01–S03 各含 6 张单词卡、12 道语境练习、可选的扩展阅读。原文短引不扩抄，新增段落区分来源导读与原创搭配练习。中文释义、例句译文和段落翻译均由界面主动展开。

完成单词与练习即可领取 40 积分、1 张典藏卡和 2 件现有可穿服装；阅读不作为领取条件。典藏卡采用 C01-A、C02-C、C03-A 的原设计身份。服装奖励是从当前展示库选出的灵感搭配，原设计中 concept_only 的服装仍未制作，不冒充已制成素材。

进度沿用 word-atelier-journey-v1，钱包沿用 word-atelier-wallet-v1；卡册为 wordrobe-fashion-cards-v1。关卡使用 fashion-atlas-s01 至 s03 独立 ID。重复回看不重复发积分，服装发放幂等，已有 30 关与手调数据不覆盖。

内容：assets/learning/fashion-lessons.json；控制器：assets/learning/fashion-atlas.js；作者数据及校验：tools/fashion-atlas/。运行 node tools/fashion-atlas/build.cjs 重建三关，运行 node tools/fashion-atlas/test.cjs 验证奖励与可选阅读。

