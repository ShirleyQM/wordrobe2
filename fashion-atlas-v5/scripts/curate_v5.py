from pathlib import Path
import json
ROOT=Path(__file__).resolve().parent.parent
entries=[]
def add(title,kind,url,source_title,publisher,author,date,quote,quote_zh,en,zh,focus,fact,opts,explain,word,meaning,wrong,discussion):
    n=len(entries)+1
    # Rotate choices deterministically without creating an answer-position pattern.
    positions=[1,2,0,2,1,0,1,0,2,0,2,1,2,0,1,1,2,0,0,1,2,1,0,2,2,1,0,1,2,0]
    k=positions[n-1]; choices=list(opts); correct=choices.pop(0); choices.insert(k,correct)
    vk=(k+2)%3; vo=list(wrong);vo.insert(vk,meaning)
    entries.append(dict(series_id=f'S{n:02d}',title_zh=title,kind=kind,
        source=dict(url=url,title=source_title,publisher=publisher,author=author,date=date,checked_on='2026-10-29',verification='正文已通过公开网页读取',access_note='核验时可读取正文；外站访问条件可能变化。',quote_en=quote,quote_zh=quote_zh),
        guide_en=en,guide_zh=zh,focus_zh=focus,
        questions=[dict(type='comprehension',prompt_en=fact,options_en=choices,answer_index=k,explanation_zh=explain,evidence_basis='本页英文导读'),
        dict(type='vocabulary_in_context',prompt_en=f'In this reading, what does “{word}” mean?',options_en=vo,answer_index=vk,explanation_zh=f'结合导读语境，{word} 在这里表示：{meaning}。',evidence_basis='本页英文导读语境'),
        dict(type='discussion',prompt_en=discussion,rubric_zh='没有唯一答案。用一个具体服装、材料或视觉细节支持你的判断。',assessment='open')]))
add('张扬穿衣，是对安静奢华的反击吗？','趋势评论','https://www.elle.com/fashion/trend-reports/a46522520/mob-wife-aesthetic-trend-explained/','Will the Mob Wife Aesthetic Take a Sledgehammer to Quiet Luxury?','ELLE','Véronique Hyland','2024-01-26','The hallmark of mob wife style is excess','Mob Wife 风格的标志是铺张。',
'Hyland reads mob-wife style as a reaction against restrained dressing. Fur, big hair and animal prints make excess its signature. Her column connects a viral look with screen characters and the wider cycle of feminine fashion archetypes.',
'作者把这股张扬潮流放在克制穿衣的对面，联系影视角色与女性时尚形象。','看作者如何从衣服谈到文化，而非只列必买单品。',
'What defines the style in this guide?',['Deliberate excess','Restrained tailoring','Athletic performance'],'导读把 excess 作为这股风格的辨识点。','restrained','understated and controlled',['damaged by wear','made to stretch'],'Which detail would you choose to make a quiet outfit more conspicuous, and why?')
add('Indie Sleaze：复兴还能保留随意感吗？','编辑对谈','https://www.vogue.com/article/indie-sleaze-revival-vogue-fashion-writers-debate','Can We Ever Really Have an Indie-Sleaze Revival? Vogue Fashion Writers Debate','Vogue','Christian Allaire; Hannah Jackson','2025-03-20','a curated image is everything','精心经营的形象成了一切。',
'Two Vogue writers debate an indie-sleaze revival. Allaire remembers improvised clothes and messy styling; he questions whether that spontaneity can survive today’s carefully curated images. The issue is authenticity, rather than simply bringing skinny jeans back.',
'两位编辑讨论：当形象经过精心经营，旧日穿搭的随意还能回来吗？','这是两位作者的讨论，不是全行业对复兴的共识。',
'What tension does the guide identify?',['Spontaneity versus image management','Tailoring versus waterproofing','Daywear versus eveningwear'],'导读对比自发搭配与精心经营的形象。','curated','carefully selected and arranged',['accidentally torn','legally protected'],'Can a carefully planned outfit still feel spontaneous? Give one example.')
add('球衣与蕾丝：混搭不只关乎甜酷','趋势分析','https://fashionjournal.com.au/fashion/blokette-aesthetic-tiktok/','What’s the deal with TikTok’s ‘blokette’ aesthetic?','Fashion Journal','Ella Katz','2023-08-14','But fashion isn’t just visual. It’s political.','时尚不仅关乎视觉，也涉及政治。',
'Ella Katz describes blokette as a meeting of football jerseys and coquette details. Bold sports colours sit beside lace and ribbons. Her article then asks how this mixture challenges conventional gender categories, rather than treating the outfit as merely cute.',
'文章从球衣与蕾丝的反差出发，进一步讨论服装中的性别分类。','原文后半段有设计师访谈，值得接着读。',
'What does Katz explore beyond appearance?',['Gender categories','Fabric waterproofing','Garment pricing'],'导读最后一句指出文章进入性别分类的讨论。','conventional','established or traditional',['transparent','unusually expensive'],'Choose two garments usually placed in different style categories. How could they work together?')
add('Y2K：当年的未来，今天的怀旧','时尚回顾','https://www.vogue.com/article/y2k-fashion','Y2K Fashion 101: How the Millennium Started Trending All Over Again','Vogue','Boutayna Chokrane; Christina Pérez','2025-01-26','fashion is cyclical','时尚会循环往复。',
'This overview places Y2K dressing beside the digital excitement and anxiety around the millennium. Its revival remixes a recent past: futuristic references now carry nostalgia. The article offers a broader wardrobe than a single silver, cyber-inspired outfit.',
'这篇回顾把千禧穿衣放回数字时代的兴奋与焦虑中，也解释今天的怀旧。','Y2K 的范围比图鉴中 Cyber Y2K 的分类更广。',
'What makes the revival a paradox?',['Old futuristic ideas now feel nostalgic','Every outfit uses new technology','The clothes reject all historical references'],'导读指出，昔日的未来想象如今成了怀旧素材。','revival','a return to popularity',['a manufacturing fault','a permanent disappearance'],'What object looks futuristic in an old photograph but nostalgic today? Describe it.')
add('认识 Toteme：极简品牌如何建立辨识度？','品牌秀评','https://www.vogue.com/fashion-shows/fall-2024-ready-to-wear/toteme','Toteme Fall 2024 Ready-to-Wear','Vogue','Amy Verner','2024-01-23','through its accessories, Toteme is proving more distinctive','Toteme 通过配饰显得更有辨识度。',
'Amy Verner reviews Toteme’s runway debut after a decade of growth. She finds its long, lean clothes persuasive but notes comparable options elsewhere. Accessories supply distinction. This is a useful example of praise that still identifies a competitive weakness.',
'秀评肯定细长轮廓，也指出类似衣服并不少见；配饰才带来更强辨识度。','注意评论如何同时写优点与保留意见。',
'Where does Verner locate greater distinction?',['Accessories','Show size','Seasonal colour variety'],'导读与摘录均把辨识度落在配饰上。','distinctive','recognisable as different',['easy to fold','sold at a discount'],'Can an accessory define a brand more strongly than a coat? Explain your view.')
add('暗黑学院：从荧幕人物到日常衣橱','风格报道','https://vogue.sg/dark-academia-style/','The dark academia trend is returning thanks to Jenna Ortega’s Wednesday Addams','Vogue Singapore',None,None,'romanticising the experience of learning','把学习的体验浪漫化。',
'Vogue Singapore connects dark academia with Wednesday Addams and a romanticised image of learning. Tweed blazers, pleated skirts and dark colours form its wardrobe. The piece is a styling guide with shopping suggestions, rather than a history of actual academic dress.',
'以 Wednesday 为入口，文章讲粗花呢西装、褶裙和深色配色怎样构成学院想象。','原文含购物推荐；读风格描述即可，不需要购买。',
'How should this source be read?',['As a contemporary styling guide','As an academic uniform archive','As a fabric laboratory report'],'导读说明它是当代搭配指南，而非学术服装史。','romanticised','presented as more ideal or appealing',['measured with precision','washed at high temperature'],'Which detail makes an outfit feel bookish to you, and where does that association come from?')
add('Fairycore：小饰物为何能提供情绪价值？','人物采访与趋势','https://www.nylon.com/fashion/fairycore-aesthetic-clothing-fashion','Fairycore Is The Glittery Internet Aesthetic That’s Ready To Take Over Spring','NYLON','Sara Jin Li','2024-02-20（更新）；2021-03-19（首发）','Fairycore is accessible magic','Fairycore 是触手可及的魔法。',
'NYLON interviews a fashion historian and independent sellers about fairycore. Crystal charms and mushroom jewellery are presented as small sources of optimism. The article links the aesthetic to life after lockdown, with individuality more important than a fixed costume formula.',
'历史研究者与独立卖家谈水晶、蘑菇饰物，以及封锁后人们对乐观情绪的需要。','摘录是受访者 Rachel Weingarten 的说法。',
'What role do the small accessories play?',['They offer optimism','They identify a sports team','They certify fabric quality'],'导读将这些小饰物与乐观情绪联系起来。','charms','small decorative objects worn or carried',['care instructions','garment seams'],'Describe a small accessory that changes your mood. What gives it that effect?')
add('Balletcore：一双舞鞋怎样成为潮流？','学术短评','https://star.sta.qmul.ac.uk/short-guides/balletcore/','Balletcore','School of the Arts Review / Queen Mary University of London','Cat Thy Au','2026（页面标注年份）','Algorithms are central to this fast fashion cascade','算法是这条快时尚传播链的关键。',
'Cat Thy Au follows balletcore from designer collections to celebrity images and mass retailers. The guide argues that algorithms help accelerate this cascade. Its critical focus is how trends circulate through commerce, rather than how to dress like a professional dancer.',
'作者追踪设计师、明星与零售商之间的传播链，讨论算法如何加速潮流。','这是有立场的短评；可以质疑作者对潮流寿命的判断。',
'What is the article mainly examining?',['How a trend spreads','How dancers train','How to repair pointe shoes'],'导读的中心是潮流传播链。','cascade','a chain of effects spreading onwards',['an individual buyer','a fabric sample'],'Which stage of a fashion trend’s journey interests you most: design, celebrity adoption or retail? Why?')
add('蝴蝶结也能克制：看两套名人造型','造型点评','https://www.vogue.com/article/coquette-trend-spring-selena-gomez-kendall-jenner','The Coquette Trend Is Still Thriving for Spring','Vogue','Christian Allaire','2024-04-01','choosing one frivolous detail','选取一个俏皮的细节。',
'Christian Allaire compares Kendall Jenner in Rodarte with Selena Gomez in Oscar de la Renta. Both use bows within relatively pared-back outfits. His argument is that one playful detail can carry coquette style without elaborate decoration everywhere.',
'两套不同品牌的造型都把蝴蝶结作为重点，其余部分较为克制。','回原文看图片，判断作者的“克制”是否有说服力。',
'What connects the two outfits?',['Bows within restrained styling','Identical dress construction','Matching floral prints'],'导读指出共同点是克制搭配中的蝴蝶结。','pared-back','reduced to fewer elements',['covered in pearls','cut on the bias'],'Where would you place one bow so that it becomes the focus of an outfit?')
add('认识 Chloé：新设计师怎样回应品牌历史？','品牌秀评','https://www.vogue.com/fashion-shows/fall-2024-ready-to-wear/chloe','Chloé Fall 2024 Ready-to-Wear','Vogue','Sarah Mower','2024-02-29','a balancing act between the romantic, the practical','在浪漫与实用之间取得平衡。',
'Sarah Mower reads Chemena Kamali’s Chloé debut through the house’s earlier designers. Light chiffon, capes and boots reconnect archive references with contemporary dressing. Her praise rests on the collection feeling natural, rather than resembling a checklist of brand signatures.',
'评论通过薄纱、披风与长靴，看 Kamali 怎样把品牌档案带回当下。','摘录只节选原句一部分；原文还强调 playful。',
'What does Mower value in the collection?',['A natural reinterpretation of the archive','Exact duplication of old looks','Removal of all historical references'],'导读强调自然的重新演绎，而非逐项复刻。','archive','a collection of historical records or designs',['a shop fitting room','a seasonal discount'],'How could a designer honour a brand’s past without copying an old outfit?')
add('认识 Pucci：印花之外，还有面料与身体','品牌与藏品','https://fidmmuseum.org/learn/articles/emilio-pucci','Emilio Pucci','ASU FIDM Museum',None,None,'lightweight, easily packed silk jersey dresses','轻盈、方便打包的丝质针织连衣裙。',
'The museum explains Pucci through swirling prints and lightweight silk jersey. His dresses followed the body without the rigid understructure of many 1950s designs. Pattern, packing and movement together help explain their appeal to international travellers in the early 1960s.',
'Pucci 的辨识度既来自旋转印花，也来自便携丝质针织与少用硬衬的穿着方式。','原文还追溯一件 1964 年长裙的具体图案来源。',
'What helped make the dresses suitable for travel?',['Lightweight fabric that packed easily','Rigid internal supports','Heavy layered padding'],'导读把旅行便利与轻盈、易打包的面料联系起来。','understructure','support hidden beneath the outer fabric',['a printed border','a shop window'],'What matters most in a travel dress: weight, creasing or movement? Explain your choice.')
add('法国新浪潮的衣服，如何被重新制作？','服装设计师访谈','https://www.wallpaper.com/fashion-beauty/richard-linklater-nouvelle-vague-movie-costumes-interview','Pascaline Chavanne on her dreamy costumes for new film Nouvelle Vague','Wallpaper*','Zoe Whitfield','2026-01-30','I counted all the stripes on the dress','我数清了裙子上的所有条纹。',
'Costume designer Pascaline Chavanne describes researching Nouvelle Vague, a film about making Breathless. Recreating Jean Seberg’s striped dress involved counting stripes and consulting an original purchase invoice. A seemingly effortless screen wardrobe can depend on unusually meticulous archival work.',
'重现 Seberg 的条纹裙，需要数条纹、查购买发票；随意的银幕感背后是细致研究。','讨论的是新片对旧片的重建，并非当年设计师的自述。',
'What supported the costume reconstruction?',['Archival evidence','Only modern street photographs','A new sponsor’s dress code'],'导读列出了条纹计数和原始购买发票。','meticulous','extremely careful about details',['deliberately unfinished','quickly forgotten'],'What small detail would you check before recreating an outfit from a film still?')
add('超模不只是衣架：认识 Naomi 的职业贡献','博物馆人物介绍','https://www.vam.ac.uk/articles/about-the-naomi-in-fashion-exhibition','About the NAOMI: In Fashion exhibition','V&A',None,'2025-02-14（更新）','model turned international celebrity','成为国际名人的模特。',
'The V&A presents Naomi Campbell’s career through runway work, designer relationships and activism. Its exhibition treats modelling as a skilled contribution to fashion. Campbell’s own wardrobe and archival loans show how a model helps create memorable images, rather than simply displaying clothes.',
'展览从走秀、设计师合作与倡议行动切入，强调模特本身的专业贡献。','以具体职业经历理解“超模”，比记住九十年代单品更丰富。',
'How does the exhibition frame modelling?',['As skilled creative work','As garment manufacturing','As anonymous retail work'],'导读说明模特是有技能、有创造性贡献的参与者。','activism','action intended to bring social change',['a catwalk measurement','a fabric treatment'],'How might a model change the way an audience understands a garment?')
add('Art Deco：一条裙子怎样回应电灯与舞蹈？','藏品细读','https://www.metmuseum.org/art/collection/search/137938','Dress, 1925–28 (L.2018.61.16)','The Metropolitan Museum of Art',None,None,'capture and refract light when in motion','运动时捕捉并折射光线。',
'The Met describes a 1925–28 dance dress with a simple chemise shape and elaborate glass and metal decoration. Movement makes its surface glitter under electric light. Geometric forms and contrasting metallic tones connect this particular object with Art Deco.',
'1925—28 年的舞裙以简单外形承载玻璃、金属装饰，在电灯下随动作闪烁。','页面有藏品图；可把材料、动作和照明连起来观察。',
'Why does movement matter to this dress?',['It activates reflected light','It changes the maker’s signature','It removes the metal decoration'],'装饰随运动捕光，正是导读描述的效果。','elaborate','detailed and carefully developed',['completely undecorated','easy to discard'],'Would this dress look different in daylight and under stage lighting? Explain your prediction.')
add('认识 Hermès：马术历史怎样进入腰带？','品牌与藏品','https://www.metmuseum.org/art/collection/search/158845','Hermès — Belt, ca. 1945 (2009.300.3861)','The Metropolitan Museum of Art',None,None,'first supplying harnesses to coach builders','最初为马车制造者提供挽具。',
'A Hermès belt from about 1945 carries three carriage scenes. The Met connects these images with the house’s beginnings in equestrian leather goods. This makes brand heritage visible in a specific object, rather than leaving it as an abstract luxury story.',
'一条约 1945 年的腰带，以三组马车场景呈现 Hermès 的马术皮具背景。','可在原文图片中找出三种场景，避免只记一个品牌标签。',
'What links the belt to the brand’s origins?',['Its carriage imagery','Its modern packaging','Its evening dress silhouette'],'导读把马车图像与马术皮具起点相连。','heritage','a legacy inherited from the past',['a newly invented fibre','a price reduction'],'Choose a brand symbol you know. What would you need to research before explaining its history?')
add('认识 McQueen：黑暗浪漫如何成为一场秀？','策展人讲解','https://blog.metmuseum.org/alexandermcqueen/video/','Video — Alexander McQueen: Savage Beauty','The Metropolitan Museum of Art','Andrew Bolton（讲解）','2011（展览年份）','Every collection told a story','每个系列都讲述一个故事。',
'Curator Andrew Bolton describes McQueen beginning with a runway concept, then developing clothes through fittings. The shows could provoke wonder, fear or uncertainty. Bolton links their darkness to romanticism: fashion becomes a medium for difficult ideas, beyond practical wearability.',
'策展人讲述概念、试衣与戏剧化走秀的关系，也解释黑暗浪漫怎样引发复杂情绪。','原页有视频与逐字稿；导读呈现的是 Bolton 的解释。',
'What role does the runway play here?',['A medium for complex ideas','Only a neutral sales display','A test of laundry performance'],'导读将走秀视为表达复杂观念的媒介。','provoke','cause a strong reaction',['make an exact copy','fasten with a zip'],'Should a fashion show make its audience uncomfortable? Explain your position.')
add('认识 Balenciaga：雕塑轮廓是怎么做出来的？','品牌工艺解析','https://www.vam.ac.uk/articles/secrets-of-balenciagas-construction','Secrets of Balenciaga’s construction','V&A',None,'2024-04-17（更新）','framing the figure rather than restricting it','框出身体，而非束缚身体。',
'The V&A reconstructs three Cristóbal Balenciaga designs. In the tulip dress, stiff silk gazar supports an architectural shape; the front and back joins eliminate side seams. Digital animations reveal how apparent simplicity depends on fabric behaviour and exact cutting.',
'郁金香裙的建筑感来自硬挺丝质 gazar 与裁片连接，动画把外观还原成做法。','这里讲的是 Cristóbal Balenciaga 的历史作品。',
'What supports the tulip dress’s shape?',['Stiff silk gazar','Loose knitted ribbing','Printed optical effects'],'导读明确把建筑感与硬挺 silk gazar 联系起来。','seams','lines where pieces of fabric are joined',['printed flower motifs','metal shoe heels'],'Which would you examine first in a sculptural dress: fabric, seams or internal support? Why?')
add('Poetcore：谁在把“像诗人”变成趋势？','趋势报道','https://www.voguearabia.com/article/pinterest-poetcore-trend','Pinterest Has Called the Shots Again, it’s Poetcore This Year','Vogue Arabia','Arpita Hota','2026-02-05','a fashion that feels lived-in and emotionally textured','一种有生活痕迹与情感层次的穿衣方式。',
'Arpita Hota introduces poetcore through Pinterest search trends and a wardrobe of nostalgic textures. The article contrasts its fluid mood with dark academia’s stricter image. Treat rising searches as evidence of interest, not proof that everyone dresses this way.',
'报道以 Pinterest 搜索趋势解释 Poetcore，描绘更流动、更怀旧的书卷穿衣。','搜索热度与实际穿着人数不是一回事。',
'What is one evidence source used in the article?',['Pinterest searches','Factory output records','Museum visitor counts'],'导读开头指出 Pinterest 搜索趋势。','nostalgic','expressing affection for the past',['resistant to rain','designed for competition'],'What would make a bookish outfit feel personal rather than like a costume?')
add('香港影像：旗袍怎样替角色说话？','电影与舞台评论','https://stories.sydneyoperahouse.com/stage-direction-in-the-mood-for-love/','Stage Direction: In the Mood for Love','Sydney Opera House','Ying-Di Yin',None,'mark the passing of time and translate a feeling','标记时间流逝，并传达情绪。',
'Ying-Di Yin explores the film In the Mood for Love and its stage reinterpretation. Patterned cheongsams mark time and communicate emotion. Clothing, interiors and restricted movement work together; costume is part of the narrative rather than an attractive background detail.',
'文章把旗袍花纹、室内环境与受限动作放在一起，解释服装的叙事作用。','这是电影与舞台改编的评论，不代表香港全部日常穿衣。',
'What function do costumes serve?',['They help tell the story','They identify a sports league','They document tailoring prices'],'导读指出服装参与时间与情绪的叙事。','narrative','the way a story is told',['a type of fastening','a shop’s opening hours'],'Imagine the same scene with a different dress pattern. How might the mood change?')
add('City Pop 的视觉：永井博谈永恒夏天','艺术家访谈','https://sato.art/the-story-of-hiroshi-nagai/','The Story of Hiroshi Nagai','SATO GALLERY','Sayaka Shibata（采访与整理）','2025-09-08','City pop came to me','是 City Pop 找到了我。',
'Hiroshi Nagai discusses the imagined summer landscapes behind his art. Books, postcards and interior magazines supplied references; musicians later approached him for covers. This interview concerns visual culture, not a fixed City Pop dress code. Its value lies in colour, space and atmosphere.',
'永井博从书、明信片和室内杂志寻找图像参考，音乐人后来才来邀约封面。','这是视觉文化延伸阅读；不要据此声称 City Pop 有固定服装。',
'What does the source offer this series?',['Insights into visual atmosphere','An official clothing uniform','A history of football shirts'],'导读将它定位为色彩、空间与氛围的视觉访谈。','references','materials used for ideas or information',['garment refunds','shoe fastenings'],'Translate one landscape colour relationship into an outfit. Explain the connection.')
add('Moto Boho：柔软浪漫为何加上机车靴？','趋势预测','https://www.vogue.com/article/5-womenswear-trend-predictions-for-autumn-winter-2025','5 Womenswear Trend Predictions for Fall/Winter 2025','Vogue Business','Lucy Maguire','2025-02-05','a grungier repackaging of boho','把波西米亚风重新包装得更粗粝。',
'Lucy Maguire’s forecast connects moto boho with biker boots, leather and softer bohemian details. The combination gives romance a rougher edge. This was a prediction published before the autumn/winter 2025 shows, not a retrospective finding that the forecast came true.',
'机车靴、皮革为柔软波西米亚增添粗粝感；原文写的是 2025 秋冬预测。','区分当时的预测与已经得到验证的结果。',
'What kind of claim does this source make?',['A forecast','A confirmed sales result','A museum attribution'],'标题与导读均说明这是预测。','forecast','a prediction about what may happen',['an exact copy','a garment repair'],'Which contrast would you try: leather with lace, or heavy boots with a flowing skirt? Why?')
add('认识 Lacoste：一件 Polo 如何从球场出发？','品牌自述','https://corporate.lacoste.com/our-history/','Our History / Our key events','Lacoste',None,None,'a flexible, lightweight polo shirt','一件柔软轻盈的 Polo 衫。',
'Lacoste’s own timeline links its identity to René Lacoste’s tennis career. It describes the 1933 petit-piqué polo as a flexible alternative to conventional tennis shirts. Read this as the brand’s account: function and a sporting personality become a recognisable commercial identity.',
'品牌时间线把网球生涯、1933 年 Polo 与鳄鱼身份联系起来，解释功能如何进入品牌。','品牌官网提供一手自述，语气与独立评论不同。',
'What problem did the polo address in this account?',['Comfort in tennis clothing','Protection for horse tack','Storage for opera glasses'],'导读说明柔软轻盈的 Polo 是传统网球衬衫的替代方案。','flexible','able to bend or move easily',['decorated with crystals','made only for winter'],'Which sportswear feature has become useful in your everyday clothes?')
add('Après Ski：雪场穿衣也是度假形象','时装历史报道','https://www.thezoereport.com/fashion/apres-ski-fashion-history','The Upward Slope Of Modern Ski Style','The Zoe Report','Marina Liao','2024-02-20（更新）；2023-01-10（首发）','on and off the slopes','雪道上与雪道之外。',
'Marina Liao follows ski style across changing materials, travel and luxury branding. The article treats mountain dressing as both equipment and a lifestyle image. Contemporary collaborations bring fashion labels together with sports specialists, while social photographs encourage distinctive holiday outfits.',
'报道沿材料、旅行与品牌合作讲雪场风格，既看装备，也看度假形象。','造型照片不能替代技术性能说明；原文的年代论述可继续追来源。',
'What two roles does mountain clothing play here?',['Equipment and lifestyle image','Office uniform and sleepwear','Religious dress and stage costume'],'导读明确并列 equipment 与 lifestyle image。','collaborations','projects created by partners together',['unlabelled copies','washing instructions'],'What would you wear differently for skiing and for sitting in the lodge afterwards?')
add('功能穿衣：女性的口袋原来可以拆下来','服装史','https://www.vam.ac.uk/articles/womens-tie-pockets','Women’s tie-on pockets','V&A',None,'2024-04-17（更新）','tied around the waist independently of clothing','独立于衣服，系在腰间。',
'The V&A explains detachable pockets worn at the waist and reached through openings in dresses. These large containers carried daily possessions. Bags and pockets coexisted, so their history is not a simple story of one replacing the other. Function shaped women’s clothing choices.',
'可拆卸口袋系在腰间，经裙装开口取物；它与手袋长期并存，而非简单替代。','页面有实物和穿戴示意，适合观察功能怎样决定结构。',
'Which statement matches the guide?',['Bags and pockets could coexist','Handbags immediately replaced all pockets','Pockets were always sewn into dresses'],'导读直接指出二者并存。','detachable','able to be removed',['permanently stitched down','waterproof'],'Design a pocket for one object you carry daily. Where would you put it, and why?')
add('Mermaidcore：流行文化如何进入衣橱？','趋势报道','https://www.teenvogue.com/story/mermaidcore-trend-summer-2023','The Mermaidcore Trend Is Making Waves for Summer 2023','Teen Vogue','Donya Momenian','2023-06-02','shell or pearl accessories','贝壳或珍珠配饰。',
'Donya Momenian connects mermaidcore with films, fan styling and runway references. Shimmer, aquatic colours and shells make the fantasy visible. Interviewees also describe adapting items they already own, so joining the trend need not mean buying an entirely new wardrobe.',
'电影、粉丝造型与秀场共同推动海洋幻想；受访者也会用已有物件演绎。','原文包含购物推荐，导读选取报道与采访部分。',
'What alternative to buying everything is mentioned?',['Reworking items already owned','Borrowing a competition uniform','Ordering identical outfits'],'导读最后一句提及用已有物件演绎。','aquatic','connected with water',['designed for libraries','heavily tailored'],'How could you suggest the sea using only colour and texture, without a literal shell motif?')
add('海边日常：一组街拍怎样解释一个标签？','街拍导览','https://www.vogue.com/article/street-style-fashion-week-coastal-grandmother-trend','Try Out Street Style’s ‘Coastal Grandmother’ Trend This Memorial Day Weekend','Vogue','Irene Kim','2022-05-28','a breezy oversized button-up','一件轻盈宽大的纽扣衬衫。',
'Irene Kim introduces coastal-grandmother dressing through oversized shirts, sun hats and pale knitwear. Street photographs show interpretations beyond a single outfit formula. The source is a visual trend guide from 2022, offering examples rather than evidence of a timeless regional uniform.',
'宽衬衫、遮阳帽与浅色针织是入口；街拍展示同一标签下的多种穿法。','把街拍当作具体例子，不把标签当成真实地区的统一着装。',
'What does the street-style format provide?',['Multiple visual interpretations','A legal definition of regional dress','Laboratory fabric tests'],'导读说明街拍提供不同演绎。','breezy','light and airy',['rigidly reinforced','decorated with metal studs'],'How would you adapt a relaxed seaside outfit for a city commute?')
add('Ballet Noir：轻盈舞裙背后的工程','舞台服装研究','https://www.londonmuseum.org.uk/blog/anna-pavlova-ballet-swan-costume-evolution-tutu/','Anna Pavlova’s Swan costume & the evolution of tutus','London Museum','Kathy Kincel','2025-04-17','an object of detailed engineering','一件经过精密构造的物件。',
'Costume maker Kathy Kincel studies Anna Pavlova’s Swan tutu and the evolution of ballet skirts. Materials, stiffening and layered net support the floating appearance. A garment that seems weightless from the audience can require intricate engineering and painstaking work behind the scenes.',
'研究者从 Pavlova 的天鹅舞裙讲材料、硬挺处理与层叠结构，拆解轻盈效果。','用于理解舞台服装；它不是 Ballet Noir 这一编辑标签的起源证明。',
'What creates the apparent lightness?',['Careful material and structural work','An absence of construction','Only the colour of the skirt'],'导读将轻盈外观归于材料及结构劳动。','intricate','complex and full of connected details',['machine-washable','intentionally empty'],'Which everyday garment hides more construction than its appearance suggests?')
add('现代旗袍：从香港档案看变化','地方服装史','https://www.hkmemory.hk/en/collections-cheongsam-about.html','A Century of Fashion: Hong Kong Cheongsam Story — About the Collection','Hong Kong Memory / 香港记忆',None,None,'the garment has undergone several changes','这件服装经历过多次变化。',
'Hong Kong Memory introduces cheongsam through an exhibition of dresses, tailoring tools, posters and photographs. The overview links its local development with Shanghai tailors and changing women’s lives. Such varied evidence shows a changing garment, rather than one permanent silhouette.',
'旗袍、工具、海报与照片共同记录变化，也把服装联系到裁缝迁移与女性生活。','这是香港脉络的展览介绍，不概括所有地区的旗袍历史。',
'Why use several kinds of exhibition material?',['To trace clothing in its social context','To prove every dress had the same shape','To replace all surviving garments'],'多类材料可把衣服放回社会生活中观察。','silhouette','the overall outline of a garment',['the label’s spelling','a type of needle'],'What could a tailoring tool tell you that a fashion photograph cannot?')
add('认识 Burberry：风衣的关键不只是格纹','品牌工艺与历史','https://www.vam.ac.uk/info/burberry-trench-crafting-an-icon-large-print-guide','The Burberry Trench: Crafting an Icon — Large Print Guide','V&A',None,None,'Water-resistant and breathable','防泼水且透气。',
'The V&A traces the Burberry trench through gabardine, military use and specialist making. Tightly woven twill helped combine weather protection with breathability. Its familiar appearance rests on material innovation and craft, not simply a recognisable lining or a fashionable colour.',
'展览导览从 gabardine 斜纹织物、军事使用与制作工艺解释风衣，而不只讲格纹。','防泼水与完全防水不同；原文用 water-resistant。',
'What material property is central here?',['Protection with breathability','Maximum transparency','Stretch without weaving'],'导读强调防护与透气的结合。','breathability','the ability to let air or moisture pass',['the intensity of a colour','the number of buttons'],'Which inherited functional detail on a coat do you still use today?')
add('歌剧院之夜：观众为什么也要被看见？','服装与社交史','https://www.vam.ac.uk/articles/a-night-at-the-opera','A night at the opera','V&A',None,'2024-04-17（更新）','to see and be seen','观看别人，也被别人观看。',
'The V&A describes opera-going as a social display as well as entertainment. Bright auditoriums made audiences visible; clothing and accessories advertised status. Cloaks protected delicate evening fabrics without crushing them. These objects connect spectacle with the practical demands of an evening out.',
'亮着灯的观众席也是社交舞台；斗篷既展示身份，也保护娇贵晚装。','这是历史情境，不是今日去歌剧院必须遵循的规则。',
'Why were cloaks useful over evening clothes?',['They protected fabric without crushing it','They replaced opera tickets','They blocked the wearer’s view'],'导读最后两句说明了斗篷的保护作用。','auditoriums','spaces where audiences sit',['garment storage boxes','private fitting rooms'],'What accessory combines a practical use with a social message today?')
# Keep comprehension distractors within fashion so each question requires reading.
DISTRACTORS=[
['Minimal decoration','Soft colours'],
['Vintage clothes versus new clothes','Runway looks versus retail prices'],
['The economics of vintage jerseys','The technical design of sports fabrics'],
['Old clothes become wearable technology','Digital culture removes nostalgia'],
['The long, lean silhouette','The monochrome palette'],
['As a history of school uniforms','As a designer collection review'],
['They express team loyalty','They demonstrate luxury status'],
['How dance technique develops','How rehearsal clothes are constructed'],
['Matching floral prints','Elaborate layers of decoration'],
['A checklist of familiar signatures','A complete break with the archive'],
['Rigid support beneath the fabric','Decoration that resisted movement'],
['The designer’s personal recollections alone','A contemporary version of the dress'],
['As a service with no authorship','As a purely commercial endorsement'],
['It changes the garment’s outline','It hides the surface decoration'],
['Its modern equestrian styling','Its construction for athletic use'],
['A neutral display of wearable products','A record of manufacturing methods'],
['Softly knitted wool','Heavy metallic decoration'],
['A count of clothes worn on streets','A record of garments sold'],
['They provide period accuracy alone','They keep the setting visually neutral'],
['A standard wardrobe for the genre','The artist’s response to specific songs'],
['A report of confirmed consumer purchases','A review of a completed season'],
['Storage during a tennis match','Formal appearance after a match'],
['Professional uniform and ceremonial dress','Technical equipment and stage costume'],
['Handbags gradually replaced every pocket','All pockets were sewn into garments'],
['Buying a complete matching wardrobe','Reproducing a single runway look'],
['A universal seaside dress code','A study of garment construction'],
['Fabric colour alone','The absence of internal structure'],
['To establish one unchanging silhouette','To separate clothing from daily life'],
['Maximum stiffness for a fixed shape','Complete transparency with low weight'],
['They stiffened soft evening fabrics','They replaced the evening clothes beneath']]
for row,pair in zip(entries,DISTRACTORS):
    q=row['questions'][0]; correct=q['options_en'][q['answer_index']]
    options=list(pair);options.insert(q['answer_index'],correct);q['options_en']=options

assert len(entries)==30
(ROOT/'references/curated-readings-v5.json').write_text(json.dumps(entries,ensure_ascii=False,indent=2))
print(f'Wrote {len(entries)} source cards and {sum(len(x["questions"]) for x in entries)} questions')
