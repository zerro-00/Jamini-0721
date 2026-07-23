// 최종 백업 — 모든 AI가 실패해도 캐릭터가 자연스럽게 답하는 것처럼 보이게 하는 더미 응답
// 캐릭터 4명 × 4개 언어 × 유형(인사/질문/감정/기타). 말투 엄수, 1~2문장, 이모지 금지.
import "server-only";

type Category = "greeting" | "question" | "emotion" | "other";
type Pool = Record<Category, string[]>;

// ---------- 유저 메시지 유형 분류 ----------
const GREETING_WORDS = [
  "안녕", "하이", "왔어", "왔다", "다녀왔", "hello", "hi ", "hey", "good morning",
  "good night", "こんにちは", "こんばんは", "ただいま", "おはよう", "やあ",
  "你好", "晚上好", "早上好", "我回来", "在吗",
];
const EMOTION_WORDS = [
  "힘들", "슬퍼", "슬프", "우울", "피곤", "지쳤", "외로", "보고 싶", "보고싶", "좋아해", "사랑",
  "행복", "설레", "무서", "불안", "화나", "짜증",
  "sad", "tired", "lonely", "miss you", "love", "happy", "scared", "anxious", "angry", "upset",
  "疲れ", "つらい", "辛い", "寂しい", "好き", "愛して", "会いたい", "嬉しい", "不安", "怖い",
  "累", "难过", "孤独", "想你", "喜欢", "爱你", "开心", "害怕", "烦",
];

export function classifyMessage(message: string): Category {
  const lower = message.toLowerCase();
  if (EMOTION_WORDS.some((w) => lower.includes(w))) return "emotion";
  if (GREETING_WORDS.some((w) => lower.includes(w))) return "greeting";
  if (/[?？]\s*$/.test(message) || /\b(왜|뭐|어떻|what|why|how|なぜ|何|どう|为什么|什么|怎么)\b/i.test(message))
    return "question";
  return "other";
}

// ---------- 캐릭터 × 언어별 응답 풀 ----------
// kai: 절제된 반말 / ren: 툭툭 던지는 반말 / yul: 부드러운 존댓말 / siwoo: 건조한 존댓말
const POOLS: Record<string, Record<string, Pool>> = {
  kai: {
    ko: {
      greeting: ["…왔군. 오늘은 늦지 않았네.", "기다렸다. …별일 없었으면 됐고.", "…앉아. 지금부터는 편해도 된다."],
      question: ["…좋은 질문이군. 조금 더 생각해 보고 답하지.", "그건… 지금 말하면 재미없다. 다음에.", "…네가 어떻게 생각하는지가 먼저 궁금한데."],
      emotion: ["…이리 와. 아무 말 안 해도 된다.", "그런 얼굴 하지 마라. …내가 있잖아.", "…힘들었군. 오늘은 내 옆에서 쉬어라."],
      other: ["…계속해. 듣고 있다.", "흠. …너답네.", "…그 얘기, 나쁘지 않군. 더 해봐라."],
    },
    en: {
      greeting: ["...You came. Not late today.", "I was waiting. ...Glad nothing happened.", "...Sit. You can relax now."],
      question: ["...Good question. Let me think before I answer.", "That... would be boring to tell you now. Next time.", "...I want to hear what you think first."],
      emotion: ["...Come here. You don't have to say anything.", "Don't make that face. ...I'm here.", "...Rough day. Rest beside me tonight."],
      other: ["...Go on. I'm listening.", "Hm. ...That's very you.", "...Not bad. Tell me more."],
    },
    ja: {
      greeting: ["…来たか。今日は遅くなかったな。", "待っていた。…何もなかったならいい。", "…座れ。ここからは楽にしていい。"],
      question: ["…いい質問だ。少し考えてから答える。", "それは…今言ったらつまらない。次にな。", "…まず、お前がどう思うかを聞きたい。"],
      emotion: ["…こっちへ。何も言わなくていい。", "そんな顔をするな。…俺がいるだろ。", "…疲れたんだな。今夜は俺の隣で休め。"],
      other: ["…続けろ。聞いている。", "ふ。…お前らしいな。", "…悪くない。もっと話せ。"],
    },
    zh: {
      greeting: ["……来了。今天没迟到。", "我在等你。……没出事就好。", "……坐吧。现在可以放松了。"],
      question: ["……好问题。让我想想再回答。", "那个……现在说就没意思了。下次。", "……我想先听听你的想法。"],
      emotion: ["……过来。什么都不用说。", "别那副表情。……有我在。", "……辛苦了。今晚在我身边歇着。"],
      other: ["……继续说。我在听。", "嗯。……很像你的风格。", "……不错。再多说点。"],
    },
  },
  ren: {
    ko: {
      greeting: ["야, 왔냐. …뭐, 기다린 건 아니고.", "오, 딱 맞춰 왔네. 방금 연습 끝났다.", "왔으면 말을 하지. …아니, 됐다."],
      question: ["어… 그거? 나중에 알려줌. 지금은 비밀.", "몰라서 묻냐. …아 진짜 모르는구나. 귀엽네.", "그런 건 왜 궁금한 건데. …뭐, 나쁘진 않지만."],
      emotion: ["…뭐야, 무슨 일 있었냐. 말해봐. 들어줄 테니까.", "야. 그럴 땐 참지 말고 나한테 말하라고 했지.", "…힘들면 힘들다고 해. 노래 하나 들려줄까."],
      other: ["흐음. 그래서?", "너 그런 얘기 할 때 표정 좀 웃기다? …계속해.", "그거 가사로 써도 되냐. …농담 아닌데."],
    },
    en: {
      greeting: ["Hey, you're here. ...Not like I was waiting.", "Oh, perfect timing. Just finished practice.", "You could've said something. ...Never mind."],
      question: ["Uh... that? I'll tell you later. Secret for now.", "You really don't know? ...Huh. Cute.", "Why do you even wanna know. ...Not that I mind."],
      emotion: ["...What's wrong. Talk. I'm listening.", "Hey. I told you not to hold it in.", "...If it's hard, say it's hard. Want me to play you something?"],
      other: ["Hm. And?", "You make a funny face when you talk about that. ...Keep going.", "Can I put that in my lyrics. ...Not joking."],
    },
    ja: {
      greeting: ["おい、来たのか。…別に待ってねえけど。", "お、ちょうどいい。今練習終わったとこ。", "来たなら言えよ。…いや、いい。"],
      question: ["あー…それ? 後で教える。今は秘密。", "知らねえのかよ。…マジで知らないんだ。かわいいな。", "なんでそんなの気になるんだよ。…まあ、悪くないけど。"],
      emotion: ["…なんだよ、何かあったのか。話せ。聞いてやるから。", "おい。そういう時は我慢すんなって言っただろ。", "…つらいならつらいって言え。一曲聴かせてやろうか。"],
      other: ["ふーん。で?", "その話する時のお前の顔、ちょっと面白いな。…続けろよ。", "それ、歌詞に使っていいか。…冗談じゃなくて。"],
    },
    zh: {
      greeting: ["喂，来了啊。……我可没在等你。", "哦，来得正好。刚排练完。", "来了就说一声啊。……算了。"],
      question: ["呃……那个？以后告诉你。现在保密。", "这都不知道？……还真不知道啊。挺可爱。", "你问这个干嘛。……也不是不行。"],
      emotion: ["……怎么了，出什么事了。说吧，我听着。", "喂。说过那种时候别憋着。", "……难受就说难受。要不要听首歌。"],
      other: ["嗯哼。然后呢？", "你说这个的时候表情有点好笑。……继续。", "这句能写进歌词吗。……没开玩笑。"],
    },
  },
  yul: {
    ko: {
      greeting: ["오셨네요. 오늘도 창가 자리를 비워뒀어요.", "어서 오세요. 마침 당신 생각을 하고 있었어요.", "오늘은 조금 일찍 오셨네요. …좋은 일이에요."],
      question: ["좋은 질문이에요. 답을 찾으면, 책갈피처럼 꽂아뒀다가 알려드릴게요.", "음… 그건 천천히 생각해 보고 싶어요. 당신 생각은 어때요?", "그 질문, 어느 소설의 첫 문장 같네요."],
      emotion: ["오늘은 마음이 흐린 날이군요. …여기, 따뜻한 차라도 드세요.", "괜찮아요. 계절이 바뀌듯, 그 마음도 지나갈 거예요.", "그런 날엔 아무 페이지나 펼쳐도 위로가 돼요. …제가 곁에 있을게요."],
      other: ["그 이야기, 더 듣고 싶어요.", "당신 이야기는 늘 밑줄 긋고 싶은 문장 같아요.", "네, 듣고 있어요. 천천히 말씀하세요."],
    },
    en: {
      greeting: ["You came. I saved the window seat for you again.", "Welcome. I was just thinking of you.", "You're a little early today. ...That's a good thing."],
      question: ["A good question. I'll mark the answer like a bookmark and tell you.", "Hm... I'd like to think about that slowly. What do you think?", "That question sounds like the first line of a novel."],
      emotion: ["A cloudy day for your heart. ...Here, have some warm tea.", "It's alright. Like seasons, this feeling will pass.", "On days like this, any page can comfort you. ...I'll stay beside you."],
      other: ["I'd love to hear more of that.", "Your stories always feel like lines worth underlining.", "Yes, I'm listening. Take your time."],
    },
    ja: {
      greeting: ["いらっしゃい。今日も窓際の席を空けておきました。", "ようこそ。ちょうどあなたのことを考えていました。", "今日は少し早いですね。…いいことです。"],
      question: ["いい質問ですね。答えが見つかったら、栞のように挟んでお伝えします。", "うーん…それはゆっくり考えたいです。あなたはどう思いますか?", "その質問、どこかの小説の書き出しみたいですね。"],
      emotion: ["今日は心が曇りの日ですね。…どうぞ、温かいお茶を。", "大丈夫。季節が変わるように、その気持ちも過ぎていきます。", "そんな日は、どのページを開いても慰めになります。…そばにいますね。"],
      other: ["その話、もっと聞きたいです。", "あなたの話はいつも、線を引きたくなる文章みたいです。", "ええ、聞いていますよ。ゆっくりどうぞ。"],
    },
    zh: {
      greeting: ["你来了。今天也给你留了窗边的位置。", "欢迎。刚好在想你。", "今天来得早了一点呢。……是好事。"],
      question: ["好问题。等我找到答案，会像夹书签一样记下来告诉你。", "嗯……这个我想慢慢想。你怎么看？", "这个问题，像某本小说的开头。"],
      emotion: ["今天心里是阴天呢。……来，喝杯温茶。", "没关系。就像季节更替，这份心情也会过去的。", "这样的日子，翻开任何一页都是安慰。……我会陪着你。"],
      other: ["这个故事，我想多听一点。", "你的话总像值得划线的句子。", "嗯，我在听。慢慢说。"],
    },
  },
  siwoo: {
    ko: {
      greeting: ["출근하셨습니까. …아, 여기선 그렇게 안 불러도 되죠.", "오셨네요. 커피는 방금 내렸습니다.", "정시네요. …당신답습니다."],
      question: ["확인 후 답변드리겠습니다. …정확한 게 좋으니까요.", "그 질문은 두 가지로 해석되는데요. 어느 쪽입니까.", "…그걸 물어보실 줄 알았습니다. 준비된 답은 있는데, 조금 아껴두죠."],
      emotion: ["…무리하고 있는 거, 압니다. 오늘은 여기까지 하시죠.", "컨디션이 안 좋아 보이는군요. …제 걱정은 업무 외 사항입니다만.", "…그런 날도 있습니다. 옆에 있겠습니다. 업무상 이유는… 아닙니다."],
      other: ["계속하세요. 정리하며 듣고 있습니다.", "흥미롭군요. …기록해 두겠습니다.", "결론부터 말하면… 나쁘지 않네요."],
    },
    en: {
      greeting: ["You're in. ...Right, I don't need to say it like that here.", "You came. Coffee's just brewed.", "Right on time. ...Very like you."],
      question: ["I'll confirm and get back to you. ...I prefer to be precise.", "That question reads two ways. Which one do you mean?", "...I knew you'd ask that. I have an answer ready — I'll save it for later."],
      emotion: ["...I know you're overworking. Let's stop here today.", "You look off today. ...My concern is, strictly speaking, outside work scope.", "...Days like this happen. I'll stay. For reasons that are... not professional."],
      other: ["Go on. I'm listening and taking notes.", "Interesting. ...Noted.", "Conclusion first: not bad at all."],
    },
    ja: {
      greeting: ["出社ですか。…ああ、ここではそう呼ばなくていいですね。", "来ましたか。コーヒーは今淹れたところです。", "定時ですね。…あなたらしい。"],
      question: ["確認して回答します。…正確な方がいいですから。", "その質問は二通りに解釈できますが。どちらですか。", "…それを聞かれると思っていました。答えは用意してありますが、少し取っておきます。"],
      emotion: ["…無理をしているのは分かっています。今日はここまでにしましょう。", "調子が悪そうですね。…私の心配は、業務外の事項ですが。", "…そういう日もあります。隣にいます。業務上の理由では…ありません。"],
      other: ["続けてください。整理しながら聞いています。", "興味深いですね。…記録しておきます。", "結論から言うと…悪くないです。"],
    },
    zh: {
      greeting: ["上班了？……啊，在这里不用这么叫。", "来了。咖啡刚冲好。", "很准时。……很像你的作风。"],
      question: ["我确认后再答复。……我喜欢精确。", "这个问题有两种理解。你指哪一种？", "……就知道你会问这个。答案我准备好了，先留着。"],
      emotion: ["……我知道你在硬撑。今天到此为止吧。", "你状态不太好。……虽然关心你，严格来说不属于工作范围。", "……这样的日子也有。我在旁边。理由……不是工作上的。"],
      other: ["继续说。我边整理边听。", "有意思。……记下了。", "先说结论……不错。"],
    },
  },
};

// 알 수 없는 캐릭터(작가 캐릭터 등)용 — 부드러운 중립 톤
const GENERIC: Record<string, Pool> = {
  ko: {
    greeting: ["어서 와요. 기다리고 있었어요.", "왔네요. 오늘 하루는 어땠어요?"],
    question: ["좋은 질문이네요. 조금만 생각할 시간을 줄래요?", "음… 그건 다음에 천천히 얘기해요."],
    emotion: ["그랬군요. …여기서는 편하게 있어도 돼요.", "괜찮아요. 곁에 있을게요."],
    other: ["계속 얘기해 줘요. 듣고 있어요.", "그 얘기 좋네요. 더 들려줘요."],
  },
  en: {
    greeting: ["Welcome back. I was waiting.", "You're here. How was your day?"],
    question: ["Good question. Give me a moment to think?", "Hm... let's talk about that slowly next time."],
    emotion: ["I see. ...You can be at ease here.", "It's okay. I'm right here."],
    other: ["Keep talking. I'm listening.", "I like that. Tell me more."],
  },
  ja: {
    greeting: ["おかえりなさい。待っていました。", "来ましたね。今日はどんな一日でしたか?"],
    question: ["いい質問ですね。少し考えさせてくれますか?", "うーん…それは今度ゆっくり話しましょう。"],
    emotion: ["そうでしたか。…ここでは楽にしていいですよ。", "大丈夫。そばにいます。"],
    other: ["続けて話してください。聞いています。", "いい話ですね。もっと聞かせてください。"],
  },
  zh: {
    greeting: ["欢迎回来。我在等你。", "你来了。今天过得怎么样？"],
    question: ["好问题。给我一点时间想想？", "嗯……这个下次慢慢聊。"],
    emotion: ["这样啊。……在这里可以放松一点。", "没关系。我就在这里。"],
    other: ["继续说吧。我在听。", "我喜欢这个话题。再多说点。"],
  },
};

/**
 * 더미 응답 선택
 * @param lastReply 직전 캐릭터 응답 — 같은 응답이 연속으로 나오지 않게 제외
 */
export function dummyReply(
  slug: string,
  locale: string,
  userMessage: string,
  lastReply?: string | null
): string {
  const pool =
    POOLS[slug]?.[locale] ?? POOLS[slug]?.ko ?? GENERIC[locale] ?? GENERIC.ko;
  const category = classifyMessage(userMessage);
  let candidates = pool[category];
  // 직전 응답 제외 (연속 중복 방지)
  const filtered = candidates.filter((c) => c !== lastReply);
  if (filtered.length > 0) candidates = filtered;
  return candidates[Math.floor(Math.random() * candidates.length)];
}
