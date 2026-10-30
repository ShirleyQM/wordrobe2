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


## 30关文字与卡面整合版

index.html 现为完整图鉴：每关依次显示主题、三个品牌参考卡、逐件改造、公开来源双语导读与三道题。原有普通卡在对应关卡折叠对照。

Art Deco 与 Ballet Noir 逐卡补充具体藏品／系列及活动出处；创作场景与真实记录分别陈述。S29 的三张雨景新版保留原服装设计，旧图仍在同目录。

独立重建整合页：python3 scripts/build_complete_atlas.py。布局文件：scripts/complete-atlas.css 与 scripts/complete-atlas.js。补充出处与主题说明：references/overall-content-context.json。旧阅读页快照：reading-room-v5.html。
