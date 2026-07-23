"use client";

// 말풍선 대화 UI — 늦은 밤의 사적인 대화방 분위기
// 메시지 전송 → /api/chat 호출 → 답변 표시. OpenAI 는 서버에서만 호출된다.
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { trackChatStart } from "@/lib/gaEvents";
import { focalPosition } from "@/lib/focal";

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

type CharacterInfo = {
  id: string;
  name: string;
  description: string | null;
  greeting: string | null;
  thumbnail_url: string | null;
};

export default function ChatRoom({
  character,
  slug,
  locale,
  initialMessages,
}: {
  character: CharacterInfo;
  slug: string;
  locale: string;
  initialMessages: { id: string; role: string; content: string }[];
}) {
  const t = useTranslations("chat");

  // GA: 캐릭터별 대화 시작 이벤트 (1회, 개인정보 없음)
  useEffect(() => {
    trackChatStart(slug);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  // ---------- AI 모델 선택 ----------
  // 키가 설정된 모델만 서버가 내려준다. 선택은 대화(캐릭터)별로 localStorage에 유지.
  const [models, setModels] = useState<{ id: string; label: string }[]>([]);
  const [selectedModel, setSelectedModel] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/models")
      .then((res) => res.json())
      .then((data: { models: { id: string; label: string }[] }) => {
        setModels(data.models);
        if (data.models.length === 0) return;
        const saved = localStorage.getItem(`vue-model-${slug}`);
        const valid = data.models.find((m) => m.id === saved);
        // 기본값: 가장 안정적인 모델(목록 첫 번째 = Gemini)
        setSelectedModel(valid ? valid.id : data.models[0].id);
      })
      .catch(() => {}); // 실패해도 대화는 가능 (서버가 알아서 폴백)
  }, [slug]);

  function handleModelChange(e: React.ChangeEvent<HTMLSelectElement>) {
    setSelectedModel(e.target.value);
    localStorage.setItem(`vue-model-${slug}`, e.target.value);
  }
  const [messages, setMessages] = useState<ChatMessage[]>(
    initialMessages.map((m) => ({
      id: m.id,
      role: m.role as "user" | "assistant",
      content: m.content,
    }))
  );
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // 새 메시지가 생기면 맨 아래로 스크롤
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || sending) return;

    setErrorMsg(null);
    setInput("");
    setSending(true);
    // 내 메시지를 화면에 먼저 표시
    setMessages((prev) => [
      ...prev,
      { id: `local-${prev.length}`, role: "user", content: text },
    ]);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          characterId: character.id,
          message: text,
          locale,
          model: selectedModel,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error ?? t("sendFailed"));
      }

      setMessages((prev) => [
        ...prev,
        { id: `local-${prev.length}`, role: "assistant", content: data.reply },
      ]);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : t("sendFailed"));
    } finally {
      setSending(false);
    }
  }

  const avatar = (
    <div className="relative mt-1 h-8 w-8 shrink-0 overflow-hidden rounded-full border border-line bg-panel">
      {character.thumbnail_url ? (
        <Image
          src={character.thumbnail_url}
          alt={character.name}
          fill
          unoptimized
          className="object-cover"
          style={{ objectPosition: focalPosition(slug) }}
        />
      ) : (
        <div className="flex h-full items-center justify-center text-xs font-bold text-wine">
          {character.name.charAt(0)}
        </div>
      )}
    </div>
  );

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-4">
      {/* 대화 상대 헤더 */}
      <div className="sticky top-14 z-40 -mx-4 flex items-center gap-3 border-b border-line bg-night/90 px-4 py-3 backdrop-blur">
        <Link href="/" className="text-ink-soft transition hover:text-ink">
          ←
        </Link>
        <div className="relative h-9 w-9 overflow-hidden rounded-full border border-line">
          {character.thumbnail_url ? (
            <Image
              src={character.thumbnail_url}
              alt={character.name}
              fill
              unoptimized
              className="object-cover"
              style={{ objectPosition: focalPosition(slug) }}
            />
          ) : (
            <div className="flex h-full items-center justify-center bg-panel text-sm font-bold text-wine">
              {character.name.charAt(0)}
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-bold text-ink">{character.name}</div>
          <div className="max-w-[180px] truncate text-[11px] text-ink-soft sm:max-w-md">
            {character.description}
          </div>
        </div>

        {/* AI 모델 선택 — 실제 모델명 그대로 표기 (키 없으면 숨김) */}
        {models.length > 0 && selectedModel && (
          <select
            value={selectedModel}
            onChange={handleModelChange}
            aria-label="AI model"
            className="max-w-[150px] cursor-pointer truncate rounded-full border border-line bg-panel px-2.5 py-1.5 text-[11px] text-ink outline-none transition hover:border-wine sm:max-w-[220px]"
          >
            {models.map((m) => (
              <option key={m.id} value={m.id}>
                {m.label} — {t(`models.${m.id}`)}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* 말풍선 목록 */}
      <div className="flex flex-1 flex-col gap-3 py-6">
        {/* 대화 기록이 없으면 캐릭터의 시작 인사말 표시 */}
        {messages.length === 0 && character.greeting && (
          <Bubble role="assistant" avatar={avatar}>
            {character.greeting}
          </Bubble>
        )}

        {messages.map((m) => (
          <Bubble key={m.id} role={m.role} avatar={avatar}>
            {m.content}
          </Bubble>
        ))}

        {/* 답변 대기 — 점 3개 타이핑 인디케이터 */}
        {sending && (
          <Bubble role="assistant" avatar={avatar}>
            <span className="inline-flex gap-1 text-ink-soft">
              <span className="animate-bounce">·</span>
              <span className="animate-bounce [animation-delay:120ms]">·</span>
              <span className="animate-bounce [animation-delay:240ms]">·</span>
            </span>
          </Bubble>
        )}

        {errorMsg && (
          <div className="mx-auto rounded-xl border border-line bg-panel px-4 py-2 text-center text-xs text-ink-soft">
            {errorMsg}
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* 입력창 */}
      <form
        onSubmit={handleSend}
        className="sticky bottom-0 -mx-4 flex gap-2 border-t border-line bg-night px-4 py-3"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={t("placeholder", { name: character.name })}
          className="flex-1 rounded-full border border-line bg-panel px-4 py-2.5 text-sm text-ink outline-none transition placeholder:text-ink-soft/60 focus:border-wine"
          maxLength={1000}
        />
        <button
          type="submit"
          disabled={sending || !input.trim()}
          className="rounded-full bg-cta px-5 py-2.5 text-sm font-semibold text-ink transition hover:bg-cta-hover disabled:opacity-40"
        >
          {t("send")}
        </button>
      </form>
    </div>
  );
}

// 말풍선 한 개 — 좌: 캐릭터(패널색) / 우: 유저(저채도 골드)
function Bubble({
  role,
  avatar,
  children,
}: {
  role: "user" | "assistant";
  avatar: React.ReactNode;
  children: React.ReactNode;
}) {
  const isUser = role === "user";
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div className={`max-w-[80%] ${isUser ? "" : "flex gap-2"}`}>
        {!isUser && avatar}
        <div
          className={`whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
            isUser
              ? "rounded-br-md bg-cta/40 text-ink"
              : "rounded-bl-md border border-line bg-panel text-ink"
          }`}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
