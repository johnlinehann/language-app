// Curated N5 → N4 topic seeds for the generator. Each lesson introduces ≤ 7 items.
//
//   W(jp, kana, en, emoji?)        a word ("en" may be "a;b" for several meanings)
//   V(dict, kana, class, en, emoji) a verb in dictionary form; the generator conjugates it
//   S("私|わたし は 学生|がくせい です", en)   a sentence as word-bank tokens (text|reading)
//   P(particle, romaji, en, audio)  a particle (audio overrides TTS, e.g. は → わ)
//
// Readings, romaji and furigana are derived from these. When JMdict is available the
// generator adds dictionary glosses and verifies verb classes; when KANJIDIC2 is
// available it picks which kanji get stroke-order cards; Tatoeba adds example sentences.

export const W = (jp, kana, en, emoji) => ({ kind: 'word', jp, kana, en, emoji });
export const V = (jp, kana, cls, en, emoji) => ({ kind: 'verb', jp, kana, cls, en, emoji });
export const S = (tokens, en) => ({ kind: 'sentence', tokens: tokens.split(' '), en });
export const P = (jp, romaji, en, audio) => ({ kind: 'particle', jp, kana: jp, romaji, en, audio });

/** Verbs used by both the ます unit and the て unit. `masu: false` = ます form taught elsewhere. */
export const VERBS = [
  V('行く', 'いく', 'iku', 'go', '🚶'),
  V('来る', 'くる', 'kuru', 'come', '👋'),
  V('帰る', 'かえる', 'godan', 'go home;return', '🏠'),
  V('見る', 'みる', 'ichidan', 'see;watch;look', '👀'),
  V('聞く', 'きく', 'godan', 'listen;hear;ask', '👂'),
  V('読む', 'よむ', 'godan', 'read', '📖'),
  V('書く', 'かく', 'godan', 'write', '✍️'),
  V('話す', 'はなす', 'godan', 'speak;talk', '🗣️'),
  V('買う', 'かう', 'godan', 'buy', '🛍️'),
  V('起きる', 'おきる', 'ichidan', 'wake up;get up', '⏰'),
  V('寝る', 'ねる', 'ichidan', 'sleep;go to bed', '😴'),
  V('する', 'する', 'suru', 'do', '✅'),
  V('勉強する', 'べんきょうする', 'suru', 'study', '📚'),
  V('働く', 'はたらく', 'godan', 'work', '💼'),
  V('待つ', 'まつ', 'godan', 'wait', '⏳'),
  V('会う', 'あう', 'godan', 'meet', '🤝'),
  V('遊ぶ', 'あそぶ', 'godan', 'play;hang out', '🎮'),
  { ...V('食べる', 'たべる', 'ichidan', 'eat', '🍽️'), masu: false },
  { ...V('飲む', 'のむ', 'godan', 'drink', '🥤'), masu: false },
];
const verb = (jp) => VERBS.find((v) => v.jp === jp);

export const TOPICS = [
  {
    unit: 'u05',
    title: 'Family',
    level: 'N5',
    description: 'Talk about your family, friends and pets.',
    lessons: [
      { title: 'My family', items: [W('家族', 'かぞく', 'family', '👨‍👩‍👧'), W('父', 'ちち', 'my father;father', '👨'), W('母', 'はは', 'my mother;mother', '👩'), W('兄', 'あに', 'my older brother;older brother'), W('姉', 'あね', 'my older sister;older sister'), W('弟', 'おとうと', 'younger brother'), W('妹', 'いもうと', 'younger sister')] },
      { title: "Someone's family", items: [W('お父さん', 'おとうさん', 'father;dad'), W('お母さん', 'おかあさん', 'mother;mom'), W('お兄さん', 'おにいさん', 'older brother'), W('お姉さん', 'おねえさん', 'older sister'), W('子供', 'こども', 'child;children', '🧒'), W('友達', 'ともだち', 'friend', '🧑‍🤝‍🧑')] },
      { title: 'People & pets', items: [W('男', 'おとこ', 'man;male', '👨'), W('女', 'おんな', 'woman;female', '👩'), W('人', 'ひと', 'person', '🧍'), W('赤ちゃん', 'あかちゃん', 'baby', '👶'), W('犬', 'いぬ', 'dog', '🐕'), W('猫', 'ねこ', 'cat', '🐈')] },
      { title: 'How many people?', items: [W('一人', 'ひとり', 'one person;alone'), W('二人', 'ふたり', 'two people'), W('三人', 'さんにん', 'three people'), W('何人', 'なんにん', 'how many people'), S('家族|かぞく は 四人|よにん です', 'my family has four people;there are four people in my family'), S('兄|あに が 二人|ふたり います', 'I have two older brothers')] },
      { title: 'This is my mother', items: [S('これ は 私|わたし の 母|はは です', 'this is my mother'), S('犬|いぬ が います', 'there is a dog;I have a dog'), S('猫|ねこ が 好き|すき です', 'I like cats'), S('友達|ともだち と 遊びます|あそびます', 'I hang out with friends;I play with my friend'), S('妹|いもうと は 学生|がくせい です', 'my younger sister is a student')] },
    ],
  },
  {
    unit: 'u06',
    title: 'Verbs: ます form',
    level: 'N5',
    description: 'Everyday actions in the polite present, negative and past.',
    lessons: [
      { title: 'Coming & going', verbs: ['行く', '来る', '帰る', '見る', '聞く'] },
      { title: 'Reading & writing', verbs: ['読む', '書く', '話す', '買う', '起きる', '寝る'] },
      { title: 'Work & play', verbs: ['する', '勉強する', '働く', '待つ', '会う', '遊ぶ'] },
      { title: "Didn't, did, let's", items: [W('ません', 'ません', "don't (polite negative);do not"), W('ました', 'ました', 'did (polite past)'), W('ませんでした', 'ませんでした', "didn't (polite past negative);did not"), W('ましょう', 'ましょう', "let's"), S('ご飯|ごはん を 食べましょう|たべましょう', "let's eat"), S('テレビ を 見ません|みません', "I don't watch TV")] },
      { title: 'My day', items: [S('学校|がっこう に 行きます|いきます', 'I go to school'), S('本|ほん を 読みます|よみます', 'I read a book;I read books'), S('昨日|きのう 勉強しました|べんきょうしました', 'I studied yesterday'), S('毎朝|まいあさ 七時|しちじ に 起きます|おきます', 'I get up at seven every morning'), S('一緒|いっしょ に 行きません|いきません か', "won't you go together;shall we go together"), S('友達|ともだち に 会いました|あいました', 'I met a friend')] },
    ],
  },
  {
    unit: 'u07',
    title: 'Particles',
    level: 'N5',
    description: 'The little words that glue Japanese sentences together.',
    lessons: [
      { title: 'は が を の', items: [P('は', 'wa', 'topic marker;as for', 'わ'), P('が', 'ga', 'subject marker'), P('を', 'o', 'object marker', 'お'), P('の', 'no', "'s (possessive);of"), S('これ は 私|わたし の 本|ほん です', 'this is my book'), S('水|みず を 飲みます|のみます', 'I drink water')] },
      { title: 'に で へ', items: [P('に', 'ni', 'at (time);to (place)'), P('で', 'de', 'at (place of action);by (means)'), P('へ', 'e', 'toward;to', 'え'), S('七時|しちじ に 起きます|おきます', 'I get up at seven'), S('駅|えき で 待ちます|まちます', 'I wait at the station'), S('日本|にほん へ 行きます|いきます', 'I go to Japan'), S('バス で 行きます|いきます', 'I go by bus')] },
      { title: 'と も か', items: [P('と', 'to', 'and;with'), P('も', 'mo', 'also;too'), P('か', 'ka', 'question marker'), S('友達|ともだち と 行きます|いきます', 'I go with a friend'), S('私|わたし も 学生|がくせい です', 'I am a student too;I am also a student'), S('パン と 卵|たまご', 'bread and eggs')] },
      { title: 'から まで ね よ', items: [P('から', 'kara', 'from'), P('まで', 'made', 'until;to'), P('ね', 'ne', "isn't it;right"), P('よ', 'yo', 'you know (emphasis)'), S('九時|くじ から 五時|ごじ まで 働きます|はたらきます', 'I work from nine to five'), S('いい 天気|てんき です ね', "it's nice weather, isn't it;nice weather, isn't it"), S('おいしい です よ', "it's delicious, you know")] },
    ],
  },
  {
    unit: 'u08',
    title: 'Adjectives',
    level: 'N5',
    description: 'Describe things with い- and な-adjectives.',
    lessons: [
      { title: 'Big & small', items: [W('大きい', 'おおきい', 'big;large', '🐘'), W('小さい', 'ちいさい', 'small;little', '🐭'), W('高い', 'たかい', 'expensive;tall;high', '💰'), W('安い', 'やすい', 'cheap;inexpensive', '🏷️'), W('新しい', 'あたらしい', 'new', '✨'), W('古い', 'ふるい', 'old', '🏚️'), W('いい', 'いい', 'good', '👍')] },
      { title: 'Hot & cold', items: [W('暑い', 'あつい', 'hot (weather)', '🥵'), W('寒い', 'さむい', 'cold (weather)', '🥶'), W('楽しい', 'たのしい', 'fun;enjoyable', '🎉'), W('難しい', 'むずかしい', 'difficult;hard', '🧩'), W('易しい', 'やさしい', 'easy', '🍰'), W('忙しい', 'いそがしい', 'busy', '🏃')] },
      { title: 'な-adjectives', items: [W('好き', 'すき', 'like;liked', '❤️'), W('嫌い', 'きらい', 'dislike;hate', '👎'), W('静か', 'しずか', 'quiet', '🤫'), W('元気', 'げんき', 'healthy;energetic;well', '💪'), W('有名', 'ゆうめい', 'famous', '⭐'), W('便利', 'べんり', 'convenient', '🔧'), W('きれい', 'きれい', 'pretty;clean;beautiful', '🌸')] },
      { title: 'Describing', items: [S('この 本|ほん は 高い|たかい です', 'this book is expensive'), S('今日|きょう は 寒い|さむい です', "it's cold today;today is cold"), S('日本語|にほんご は 難しい|むずかしい です', 'Japanese is difficult'), S('東京|とうきょう は 大きい|おおきい 町|まち です', 'Tokyo is a big city;Tokyo is a big town'), S('この 町|まち は 静か|しずか です', 'this town is quiet'), S('お元気|おげんき です か', 'how are you;are you well'), S('とても 楽しい|たのしい です', "it's very fun;it is very fun")] },
      { title: 'Not very', items: [W('とても', 'とても', 'very'), W('あまり', 'あまり', 'not very (with negative)'), S('高く|たかく ない です', "it's not expensive;it isn't expensive"), S('あまり 寒く|さむく ない です', "it's not very cold"), S('好き|すき じゃ ない です', "I don't like it"), S('この 部屋|へや は きれい です', 'this room is clean;this room is pretty')] },
    ],
  },
  {
    unit: 'u09',
    title: 'Travel',
    level: 'N5',
    description: 'Get around: stations, tickets, directions and hotels.',
    lessons: [
      { title: 'Places', items: [W('駅', 'えき', 'station', '🚉'), W('空港', 'くうこう', 'airport', '🛫'), W('ホテル', 'ホテル', 'hotel', '🏨'), W('銀行', 'ぎんこう', 'bank', '🏦'), W('病院', 'びょういん', 'hospital', '🏥'), W('トイレ', 'トイレ', 'toilet;restroom;bathroom', '🚻'), W('店', 'みせ', 'shop;store', '🏪')] },
      { title: 'Getting around', items: [W('電車', 'でんしゃ', 'train', '🚃'), W('バス', 'バス', 'bus', '🚌'), W('車', 'くるま', 'car', '🚗'), W('自転車', 'じてんしゃ', 'bicycle;bike', '🚲'), W('飛行機', 'ひこうき', 'airplane;plane', '✈️'), W('切符', 'きっぷ', 'ticket', '🎫'), W('地図', 'ちず', 'map', '🗺️')] },
      { title: 'Directions', items: [W('右', 'みぎ', 'right', '👉'), W('左', 'ひだり', 'left', '👈'), W('まっすぐ', 'まっすぐ', 'straight ahead;straight', '⬆️'), W('ここ', 'ここ', 'here', '📍'), W('そこ', 'そこ', 'there'), W('あそこ', 'あそこ', 'over there'), W('どこ', 'どこ', 'where', '❓')] },
      { title: 'Where is…?', items: [S('駅|えき は どこ です か', 'where is the station'), S('トイレ は どこ です か', 'where is the toilet;where is the restroom'), S('まっすぐ 行って|いって ください', 'please go straight;go straight please'), S('右|みぎ に あります', "it's on the right;it is on the right"), S('切符|きっぷ を 一枚|いちまい ください', 'one ticket, please;one ticket please'), S('東京|とうきょう まで いくら です か', 'how much is it to Tokyo')] },
      { title: 'At the hotel', items: [W('予約', 'よやく', 'reservation;booking', '📅'), W('部屋', 'へや', 'room', '🛏️'), W('鍵', 'かぎ', 'key', '🔑'), W('荷物', 'にもつ', 'luggage;baggage', '🧳'), S('予約|よやく が あります', 'I have a reservation'), S('チェックイン を お願い|おねがい します', 'check-in, please;I would like to check in')] },
    ],
  },
  {
    unit: 'u10',
    title: 'Verbs: て form',
    level: 'N4',
    description: 'Link actions, make requests, and say what is happening now.',
    lessons: [
      { title: 'て form I', teVerbs: ['食べる', '飲む', '行く', '来る', '見る', '書く', '読む'], note: 'る-verbs: drop る, add て. Most う-verbs change: く→いて, む→んで, う/つ/る→って.' },
      { title: 'て form II', teVerbs: ['話す', '買う', '待つ', '遊ぶ', 'する', '起きる', '聞く'] },
      { title: 'Please…', items: [S('ちょっと 待って|まって ください', 'please wait a moment;wait a moment please'), S('ゆっくり 話して|はなして ください', 'please speak slowly'), S('もう 一度|いちど 言って|いって ください', 'please say it again'), S('ここ に 書いて|かいて ください', 'please write here;please write it here'), S('見て|みて ください', 'please look')] },
      { title: "What's happening", items: [S('今|いま 食べて|たべて います', "I'm eating now;I am eating now"), S('雨|あめ が 降って|ふって います', "it's raining;it is raining"), S('東京|とうきょう に 住んで|すんで います', 'I live in Tokyo'), S('日本語|にほんご を 勉強して|べんきょうして います', "I'm studying Japanese;I am studying Japanese"), S('何|なに を して います か', 'what are you doing')] },
      { title: 'May I…?', items: [S('写真|しゃしん を 撮って|とって も いい です か', 'may I take a photo;can I take a picture'), S('ここ で 食べて|たべて は いけません', 'you must not eat here;you cannot eat here'), S('入って|はいって も いい です か', 'may I come in;can I come in'), S('はい どうぞ', 'yes, go ahead;yes, please')] },
    ],
  },
];

export { verb };
