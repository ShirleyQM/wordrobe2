统一衣橱自动入库

出图前先读 assets/materials/PRODUCTION_SOP.md。人物统一使用 assets/materials/characters/open-arms/body.png（939×1676，后期盘发张臂立绘）；新交付 body=open-arms-v2。禁止从旧垂手人物或旧试穿图另选母版。腰头、袖口只做正面可见部分，衣服不带人体或头发。

主程序运行时每 15 秒读取已配置的交付目录；打开衣橱时也会检查。
当前接收：本项目 assets/deliveries/*、assets/materials/sources/*，以及美术会话 worktree 的 assets/deliveries/*。
目录配置：项目根 art-delivery-config.json。新会话直接在本项目 assets/deliveries/新批次/ 交付即可，不必另开界面或人工修改 catalog。

已有两种交付清单均支持：
1. manifest.json：kind=approved-front-only-clothing-import，count、items；每件包含稳定 id、name、slot、body、front、originalSize、sha256。前片为真实透明 PNG；按原比例初步放置；后片仅透明占位。
2. delivery.json：status=delivered-for-manual-fitting、technicalPass=true、itemCount、items。每件 directory 内含 front.png、back.png 和 qa.json；qa.canvasAndLayers 记录每层相对批次的路径及 sha256。画布 939×1676，已有美术归位直接保留；材料分层也留存。

所有 PNG 与 QA 完成后再原子写入/更新清单；失败包会自动重试。相同稳定 id 永远跳过，不覆盖用户手调、备注、已保存印花或旧原图；同款新版本请给新 id。现有衣服的重做继续使用主界面重新生成流程。
只交素材和数据，禁止另建/维护素材库页面。主程序只有一套衣橱与编辑器。
导入结果与失败原因：assets/materials/sources/deliveries/sync-status.json。
