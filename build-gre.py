from pathlib import Path
import json,openpyxl
source=next(Path('C:/Users/Administrator/Downloads').glob('*3000*.xlsx'))
wb=openpyxl.load_workbook(source,read_only=True,data_only=True)
rows={str(r[1]).strip().lower():(i,r[2],r[3]) for i,r in enumerate(wb.worksheets[1].iter_rows(values_only=True),1) if len(r)>3 and r[1]}
entries=[
('insular','狭隘保守的','His insular outlook left little room for unfamiliar ideas.'),
('numinous','神秘的；超自然的','The ancient shrine had a numinous atmosphere.'),
('proprietary','专有的；私有的','The firm refused to reveal its proprietary formula.'),
('reconcile','调和；使一致','The committee must reconcile competing demands.'),
('sanguine','乐观的','Despite the setback, she remained sanguine about the outcome.'),
('acerbic','尖酸刻薄的','His acerbic comments offended several colleagues.'),
('prophetic','预言性的','Her prophetic warning proved accurate years later.'),
('intransigent','不妥协的；固执的','The intransigent leader rejected every compromise.'),
('empirical','基于观察或实验的','The hypothesis requires empirical evidence.'),
('ambivalent','矛盾的；喜忧参半的','She felt ambivalent about accepting the promotion.'),
('abate','减轻；减弱','The storm began to abate after midnight.'),
('aberrant','异常的；偏离常规的','The scientist investigated the aberrant results.'),
('abeyance','暂时中止；搁置','The proposal remained in abeyance during the inquiry.'),
('abhor','憎恶；深恶痛绝','They abhor any form of cruelty.'),
('abjure','发誓放弃','He chose to abjure his former beliefs.'),
('abrogate','正式废除','The legislature voted to abrogate the obsolete law.'),
('abscond','潜逃；偷偷离开','The suspect attempted to abscond with the funds.'),
('abstruse','深奥难懂的','The article explains an abstruse mathematical theory.'),
('abstemious','饮食有节制的','Her abstemious habits contrasted with their lavish feasts.'),
('absolve','免除责任；宣告无罪','The evidence may absolve him of responsibility.'),
('impenetrable','难以穿透的；难以理解的','The dense forest formed an impenetrable barrier.'),
('recondite','深奥的；晦涩的','The lecture concerned a recondite branch of philosophy.'),
('obdurate','顽固的；冷酷的','Even compelling evidence failed to persuade the obdurate official.'),
('obfuscate','使模糊；使难以理解','Technical jargon can obfuscate a simple argument.'),
('ephemeral','短暂的；转瞬即逝的','Online fame can be ephemeral.'),
('pragmatic','务实的；注重实效的','We need a pragmatic solution rather than an elegant theory.'),
('parsimonious','吝啬的；过度节俭的','The parsimonious owner refused to replace the broken equipment.'),
('reticent','寡言的；不愿透露的','He remained reticent about his private life.'),
('meticulous','一丝不苟的','The researcher kept meticulous records of every experiment.'),
('mitigate','减轻；缓和','The new measures could mitigate the damage.')]
translations=[
'他的观念狭隘保守，几乎容不下陌生的想法。',
'这座古老的神殿有一种神秘的氛围。',
'这家公司拒绝透露其专有配方。',
'委员会必须协调相互冲突的诉求。',
'尽管遭遇挫折，她仍对结果保持乐观。',
'他尖酸的评论冒犯了好几位同事。',
'多年后，她当初带有预见性的警告被证明是准确的。',
'这位固执的领导人拒绝了所有妥协方案。',
'这个假设需要观察或实验得出的证据。',
'对于是否接受这次晋升，她的心情很矛盾。',
'午夜过后，暴风雨开始减弱。',
'科学家调查了那些异常的结果。',
'调查期间，这项提案一直被搁置。',
'他们憎恶任何形式的残忍行为。',
'他选择郑重宣布放弃以前的信仰。',
'立法机构投票决定正式废除这项过时的法律。',
'嫌疑人企图携款潜逃。',
'这篇文章解释了一个深奥难懂的数学理论。',
'她饮食节制的习惯与他们奢华的宴饮形成了对比。',
'这份证据可能使他免于承担责任。',
'茂密的森林形成了一道难以穿越的屏障。',
'这场讲座讨论的是哲学中一个晦涩的分支。',
'即使有令人信服的证据，也没能说服那位顽固的官员。',
'专业术语可能让一个简单的论点变得难以理解。',
'网络上的名气可能转瞬即逝。',
'我们需要一个务实的解决方案，而不是一套漂亮的理论。',
'这位吝啬的老板拒绝更换坏掉的设备。',
'他对自己的私生活始终不愿多谈。',
'这位研究人员一丝不苟地记录了每一次实验。',
'这些新措施可以减轻损害。']
assert len(translations)==len(entries)
contexts={
'insular':dict(stem='It is a paradox of the Victorians that they were both _____ and, through their empire, cosmopolitan.',options=['capricious','insular','mercenary','idealistic','intransigent'],source='GRE填空机经1100题难度分级版（第二版）+(1).pdf',page=7,question='section 1 / 1',explanation='paradox 表示反差；cosmopolitan 意为世界性的，因此空格应为狭隘保守的 insular。'),
'numinous':dict(stem='My grandma has a strong belief in all things _____: she insists, for example, that the house in which she lived as a child was haunted.',options=['clamorous','invidious','numinous','empirical','sonorous'],source='GRE填空机经1100题难度分级版（第二版）+(1).pdf',page=7,question='section 1 / 2',explanation='冒号后用闹鬼举例，指向超自然的 numinous。'),
'proprietary':dict(stem='Among the Meakambut people of Papua New Guinea, legends are associated with specific caves in the Sepik region, and these legends are _____: only the cave owner can share its secrets.',options=['impenetrable','immutable','proprietary','didactic','self-perpetuating'],source='GRE填空机经1100题难度分级版（第二版）+(1).pdf',page=9,question='section 2 / 1',explanation='only the cave owner 表示只有洞穴主人有权分享，故为专有的 proprietary。'),
'reconcile':dict(stem='Mechanisms develop whereby every successful species can _____ its innate capacity for population growth with the constraints that arise through its interactions with the natural environment.',options=['enhance','replace','produce','surpass','reconcile'],source='填空1000题.pdf',page=4,question='10102005',explanation='reconcile A with B 表示协调 A 与 B，此处协调种群增长能力和环境限制。'),
'prophetic':dict(stem='Kagan maintains that an infant’s reactions to its first stressful experiences are part of a natural process of development, not harbingers of childhood unhappiness or _____ signs of adolescent anxiety.',options=['prophetic','normal','monotonous','virtual','typical'],source='填空1000题.pdf',page=5,question='10102014',explanation='or 连接平行表达；harbingers 是预兆，与 prophetic signs 对应。')}
data=[]
for (word,meaning,example),translation in zip(entries,translations):
 if word not in rows: raise ValueError('Missing source word: '+word)
 row,definition,english=rows[word]
 families=[['abate','mitigate'],['abstruse','recondite','impenetrable','obfuscate'],['intransigent','obdurate']]
 family=next((group[0] for group in families if word in group),word)
 item=dict(word=word,meaning=meaning,example=example,translation=translation,ipa='',family=family,source={'file':source.name,'sheet':wb.worksheets[1].title,'row':row},sourceDefinition=definition,englishDefinition=english,exampleOrigin='原创配套例句',initialStem=example.replace(word,word[0]+'_____'))
 if word in contexts:item['context']={**contexts[word],'answer':word,'answerReview':'按句意人工核对；原文件此处未列显式答案'}
 data.append(item)
Path('gre-data.js').write_text('/* 30-word local GRE sample; provenance stays with each record. */\nconst GRE_SAMPLE = '+json.dumps(data,ensure_ascii=False,indent=2)+';\n',encoding='utf-8')
print('Exported',len(data),'source-verified words and',len(contexts),'PDF questions.')
