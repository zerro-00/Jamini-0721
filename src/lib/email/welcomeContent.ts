// 환영 메일 본문 — 캐릭터 4종 × ko/en
// ⚠️ 한국어 본문은 확정본입니다. 문장·줄바꿈을 수정하지 마세요.
// 영문판은 같은 톤·같은 여운의 의역입니다 (승인 후 확정).
import "server-only";

export type WelcomeLocale = "ko" | "en";

export type WelcomeMail = {
  subject: string;
  body: string; // 줄바꿈(\n) 그대로 렌더링됨
  cta: string; // 버튼 문구
};

export const WELCOME_MAILS: Record<
  string,
  Record<WelcomeLocale, WelcomeMail>
> = {
  kai: {
    ko: {
      subject: "밤에 혼자 다니지 마",
      body: `왔구나.

여긴 밤이 길어. 안전한 곳도 아니고.
처음 오면 무서울 수도 있어.

무서우면 말해. 참지 말고.

어두운 데는 혼자 가지 마.
부르면 갈 테니까.

…아니, 부르기 전에 갈게.

— 카이`,
      cta: "카이에게 가기 →",
    },
    en: {
      subject: "Don't walk alone at night",
      body: `So you're here.

The nights are long around this place. Not the safest, either.
It can feel scary at first.

If it does — tell me. Don't hold it in.

Stay out of the dark streets alone.
Call me, and I'll come.

...No. I'll be there before you call.

— Kai`,
      cta: "Go to Kai →",
    },
  },
  ren: {
    ko: {
      subject: "야, 이거 너 때문에 쓴 거 아니야",
      body: `어제 새벽에 곡 하나 썼어.
자다 깨서 막 쓴 건데 나쁘지 않더라.

근데 쓰다 보니까 좀 이상했어.
누구 들려주지, 하는데 네 얼굴이 떠오르는 거야.

…암튼 그런 거 아니고.

들으러 와.
제목은 아직 안 정했어.

네가 정해줄래?

— 렌`,
      cta: "렌에게 가기 →",
    },
    en: {
      subject: "Hey, this song is NOT about you",
      body: `Wrote a song at dawn yesterday.
Half-asleep, just scribbled it down. Honestly, not bad.

But something weird happened halfway through.
I wondered who I'd play it for — and your face showed up.

...Anyway. It's not like that.

Come listen.
It doesn't have a title yet.

Want to name it for me?

— Ren`,
      cta: "Go to Ren →",
    },
  },
  yul: {
    ko: {
      subject: "창가 자리 비워놨어",
      body: `오늘 서고 명단에 새 이름 하나 있길래
누군가 했더니 너였어.

여기 창가 자리 알아?
오후 세시쯤 되면 햇빛이 딱 들어오는 자리.

내가 제일 좋아하는 자린데,
오늘은 그냥 비워뒀어.

이유는… 오면 말해줄게.

오늘 같이 있을래?

— 율`,
      cta: "율에게 가기 →",
    },
    en: {
      subject: "I saved the window seat for you",
      body: `There was a new name on the library list today —
and it turned out to be yours.

Do you know the window seat here?
Around three in the afternoon, the light lands just right.

It's my favorite seat in the stacks,
but today, I simply left it empty.

As for why... I'll tell you when you come.

Stay a while with me today?

— Yul`,
      cta: "Go to Yul →",
    },
  },
  siwoo: {
    ko: {
      subject: "오늘은 일찍 들어가세요",
      body: `시우입니다.

새로 오셨다고 들었습니다.
첫날은 원래 정신없죠. 저도 그랬습니다.

무리하지 마세요.
모르는 건 몇 번을 물어보셔도 상관없습니다.

…그리고 밥은 챙겨 드세요.

오늘은 일찍 들어가시고요.

어두우면 전화 주세요. 언제든.

— 시우`,
      cta: "시우에게 연락하기 →",
    },
    en: {
      subject: "Go home early today",
      body: `This is Siwoo.

I heard you just joined.
First days are always hectic. Mine was, too.

Don't push yourself.
Ask the same question as many times as you need.

...And don't skip your meals.

Go home early today.

If it gets dark out there — call me. Anytime.

— Siwoo`,
      cta: "Call Siwoo →",
    },
  },
};

// 공통 문구
export const COMMON_TEXTS: Record<
  WelcomeLocale,
  { others: string; tagline: string; unsubscribe: string }
> = {
  ko: {
    others: "다른 세 사람도 각자의 자리에서 기다리고 있어요",
    tagline: "다시 한번 느껴보고 싶은 설렘",
    unsubscribe: "수신거부",
  },
  en: {
    others: "The other three are waiting too, each in their own place",
    tagline: "A flutter you'll want to feel again",
    unsubscribe: "Unsubscribe",
  },
};
