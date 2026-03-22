# 演出統合デモ -- Web小説向け

Zen Writer の Web 小説演出機能を一つのストーリーで確認するためのサンプルです。
Reader Preview (Ctrl+Shift+R) で全演出が動作します。

---

## 序章　異変の朝

:::zw-typing{speed:"40ms", mode:"auto"}
目が覚めると、世界が変わっていた。
窓の外に広がるのは、昨日までの見慣れた街並みではなかった。
:::

空は{紫紺|しこん}に染まり、見たこともない二つの月が浮かんでいる。

:::zw-dialog{speaker:"主人公", position:"left"}
嘘だろ......ここは、どこだ?
:::

:::zw-dialog{speaker:"???", position:"right", style:"bordered"}
ようこそ、{kenten|境界の狭間}へ。
あなたは選ばれたのです。
:::

---

## 第一章　探索

### 廃墟の街

:::zw-scroll{effect:"fade-in", delay:"200ms"}
街は廃墟だった。建物の壁には蔦が絡みつき、道路には砂が積もっている。
人の気配はない。ただ、遠くで何かが軋む音だけが聞こえる。
:::

:::zw-scroll{effect:"slide-up", delay:"300ms"}
角を曲がると、広場に出た。中央に巨大な石碑が立っている。
石碑には古い文字が刻まれていた。
:::

:::zw-textbox{preset:"narration", texture:"paper"}
「七つの試練を越えし者、境界の扉を開く鍵を得ん。
　第一の試練——汝の{kenten|記憶}を賭けよ」
:::

### 最初の選択

:::zw-typing{speed:"60ms", mode:"click"}
石碑の前に立つと、足元に光が走った。
二つの道が浮かび上がる。

左の道は暗く、冷たい風が吹いている。
右の道は明るいが、奇妙な熱気を帯びている。
:::

:::zw-dialog{speaker:"導き手", position:"center", style:"transparent"}
さあ、選びなさい。
どちらの道も、あなたを試練へと導くでしょう。
:::

---

## 第二章　記憶の試練

### 幻影

:::zw-scroll{effect:"slide-left", delay:"100ms"}
暗い道を進むと、霧が立ち込めてきた。
霧の中に、見覚えのある景色が浮かんでは消える。
:::

[fade]それは幼い日の記憶だった。[/fade]

[shake]突然、記憶が歪み始める。[/shake]

:::zw-textbox{preset:"monologue"}
違う。これは本当の記憶じゃない。
何かが——何かが紛れ込んでいる。
:::

### 偽りの声

:::zw-dialog{speaker:"偽りの母", position:"left", style:"bubble"}
おかえりなさい。ずっと待っていたのよ。
:::

:::zw-dialog{speaker:"主人公", position:"right"}
......あなたは、母さんじゃない。
:::

:::zw-scroll{effect:"zoom-in", delay:"200ms"}
偽りの母の姿が崩れ、黒い霧に変わった。
霧は渦を巻き、一つの形を成していく。
:::

:::zw-textbox{preset:"warning"}
第一の試練: 偽りの記憶を見破れ。
残り時間: 不明
:::

---

## 第三章　覚醒

### 真実の記憶

:::zw-typing{speed:"25ms", mode:"scroll"}
一つずつ、本物の記憶を思い出していく。

母の手の温もり。
父の背中。
友人たちの笑い声。

そのどれもが、確かにここにある。
偽物が紛れ込む隙間など、どこにもない。
:::

[glow]「これが——私の記憶だ」[/glow]

:::zw-scroll{effect:"fade-in", delay:"500ms"}
黒い霧が晴れた。
目の前に、石碑と同じ文字が光っている。
:::

:::zw-textbox{preset:"dialogue"}
「第一の試練、{kenten|合格}。
　汝の記憶は真実なり」
:::

---

## 確認項目

このドキュメントで確認できる演出:

1. タイピング演出 -- auto / click / scroll の3モード
2. ダイアログボックス -- left / right / center の3配置、default / bordered / bubble / transparent の4スタイル
3. スクロール連動 -- fade-in / slide-up / slide-left / zoom-in の4エフェクト
4. テキストボックスプリセット -- narration / monologue / warning / dialogue
5. テクスチャオーバーレイ -- paper
6. テキストアニメーション -- fade / shake / glow
7. ルビ -- {紫紺|しこん}
8. 傍点 -- {kenten|境界の狭間} 等
9. 水平線区切り
