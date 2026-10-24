# 词秀 · 独立衣橱

保留移动端界面、换装、发型染色、层级、配饰调整及收藏。没有学习课程。原始素材不缩小、不重新编码；asset-manifest.json 记录 SHA-256。保存的版型、发型位置、展示设置在 data/。隐藏素材保留在库中，但不进入玩家界面。

## 手机使用

Node.js 18+，运行 npm start。电脑和手机接同一 Wi-Fi，手机打开 http://电脑局域网IP:4188/ 。也可把整个目录部署到静态 HTTPS 站点；Git 仓库链接本身不是运行网址。首次使用需要加载原图，素材按界面请求加载。asset-manifest.json 中含每个 PNG 的宽高和哈希。可直接读取 data/wardrobe.json、data/materials.json、data/hair-defaults.json；图片路径相对于本目录解析。也可用同源 iframe 嵌入 index.html 来复用完整界面。裁缝铺沿用当前关闭状态。 

## 与已有学习模块连接

默认 libraryMode=true，方便直接试用整个可见库。改 standalone-config.js 的 libraryMode=false 可恢复积分购买；studyUrl 填你独立学习界面的地址。WordrobeBridge.credit(唯一奖励ID,积分) 可在同源调用中记积分，重复ID不会重复到账；跨域学习需要宿主提供安全的账户同步，不会自动共享浏览器存档。WordrobeBridge.catalog()/materials() 返回完整目录。

可部署在域名根目录或子目录；入口将 /api 请求映射到相对 data/ 快照，界面引用使用相对素材路径。用户存档保存在当前浏览器，不会自动从电脑同步到手机。

## 校验

npm run verify 校验每个素材原始字节。仓库含当前运行库及隐藏项目的引用素材，不含历史美术归档、预览截图、学习题库和打包压缩版本。第三方头发/字体等素材的原有权利和商用许可要求仍需遵守。
