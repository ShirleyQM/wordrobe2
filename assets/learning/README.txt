当前学习流程（2026-10-29）
30 关文章课程，共 180 个词、540 条双语例句、360 道词汇语境题、60 道阅读理解题。每关逐词学习并答题，再做 6 道混合练习，最后阅读文章并完成 2 道理解题。词 / 练习 / 阅读分别 +20 / +20 / +30；同一环节仅首次结算。中文默认折叠；所有选项都可查看英文释义；不会时可以提示或看答案继续。进度沿用 word-atelier-journey-v1。
article-lessons.json 保留已发布的前两关与 ID，并索引 4 个新增课程包；新关卡为 article-course-03 至 article-course-30。第 3–30 关为项目原创教学情境，不作为新闻或官方试题呈现。旧单词关卡记录继续保留。
内容源：tools/learning-course-30/。重建：node tools/learning-course-30/build.cjs。全课检查：node tools/learning-course-30/test.cjs。read.cjs 可将全部课程合并成单个离线数据对象；小红书打包脚本已使用该读取器，未在此轮重打素材包。

以下为历史实现记录，当前流程以上述 30 关为准。

学习与素材展示入口
素材展示：/materials.html，主界面左侧“素材展示”。衣服沿用原展示记录；首次接入的其他已有素材保留展示，新素材默认隐藏。
学习：/learn.html，手机页“学习”入口。逐张卡片→汇总→随机5题；每组+10一次；累计每30词必须通过10道进阶题，首次正确至少8道。学习状态、积分和生词本保存在当前浏览器。
来源：ECDICT MIT词库，GRE 7504词，TOEFL 6970词。TOEFL Essential Vocabulary MIT的1000条学术词汇提供部分英文例句（AI-enriched），来源及许可保存在sources.json和sources/。部分首批例句附项目原创例句或配套中文翻译。并非ETS官方题库，不使用商业真题。
阅读：NASA RSS正文与VOA Learning English RSS摘要；原链接、发布日期、正文/摘要区别保留。只提取文字，无第三方照片。VOA当前返回2025年存档；NASA当前返回2026-10-23内容。抓取时间不替代文章发布日期。
更新：node server.cjs运行时按北京时间日期检查更新，每小时检查一次；页面也支持手动刷新。服务器关闭时不在后台更新。失败保留已有缓存并记录错误。独立更新：Python tools/update-reading.py（需网络）。
适用：本地网页版。此轮没有重新生成、上传小红书离线包；RSS后台更新需要服务器，离线小工具只能随包携带缓存内容，不能直接照搬网络接口。
测试：test-learning-engine.cjs、test-learning-content.cjs、test-material-visibility.cjs；浏览器完成一组卡片和五题得到10积分，文章点词加入生词本；隐藏前发后手机列表移除，并恢复测试前设置。
积分解锁与中英界面（2026-10-24）
手机页与学习页共用 word-atelier-wallet-v1 钱包；word-atelier-learning-v1 继续保存学习进度。迁移已有积分、已穿衣服和已收藏搭配；管理主界面仍可自由调素材。
每完成一组学习，按同一 session.id 只入账一次10积分。解锁按ID永久拥有，同一件不重复扣分。积分不足可跳学习，目标衣服和差额保存在愿望记录，够分后返回原衣服确认解锁。
价格：内衣/内裤/袜子/配饰10，上下装/鞋包20，外套30，连衣裙40。命名与价格在 assets/materials/published/garment-labels.json，原ID、图片、版型文件不改。garment-label-store.cjs 为新增素材补标签，不覆盖已有标签。
中英切换：assets/i18n.js，使用 wardrobe-language-v1。换装、学习、主衣橱和素材管理共用偏好；单词释义与英文文章作为学习内容保留，不随界面语言重写。
测试：test-player-economy.cjs、test-i18n.cjs、test-learning-engine.cjs。浏览器已验证积分不足→学习一组→到账→返回并解锁→刷新后仍拥有→重复试穿不扣分。


2026-10-24 — Context journey v1
Entry: learn.html; journey.js + journey-engine.js replace the active vocabulary flow.
30 micro-lessons / 30 focus words / 65 questions, not 30 ten-word units.
2 examples per word; reconcile/impenetrable have a third for the other common sense.
2 common phrases per word. Chinese stays in closed details elements.
10 rare words use reading comprehension instead of fill-in recall. No Chinese-to-English quizzes or spelling gates.
Five questions are retained from the user-supplied local GRE sample, with PDF/page and human-answer-review notices; other questions are project authored, not official exam items.
Every level is accessible. Wrong answers allow hints or reveal, with full completion credit. No 30-word gate.
First completion: +10; wallet id journey-v1:<level-id> prevents farming on replay.
Progress key word-atelier-journey-v1; existing vocabulary history/notebook/wallet remain intact.
Progress shows completed words, phrases, assistance status and dates, with examples and replay.
Rebuild authored content: node tools/build-learning-journey.cjs.
Checks: node test-learning-journey.cjs; node test-player-economy.cjs.
Local demo only; no XHS repackage/upload in this iteration.
