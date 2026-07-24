"use client";

// 말풍선 대화 UI — 늦은 밤의 사적인 대화방 분위기
// 메시지 전송 → /api/chat 호출 → 답변 표시. OpenAI 는 서버에서만 호출된다.
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { trackChatStart } from "@/lib/gaEvents";
import {
  trackEvent,
  trackEventBeacon,
  noteChatActivity,
} from "@/lib/events";
import { focalPosition } from "@/lib/focal";
import ModelPicker, { type ModelInfo } from "@/components/ModelPicker";

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

  // GA + 자체 이벤트: 대화 시작 (1회, 개인정보 없음)
  useEffect(() => {
    trackChatStart(slug);
    // 진입 경로 분류: 메일 링크(?src=mail) > 캐릭터 상세 > 홈 > 직접
    const urlSrc = new URLSearchParams(window.location.search).get("src");
    const ref = document.referrer;
    const src =
      urlSrc === "mail"
        ? "mail"
        : ref.includes("/characters/")
          ? "detail"
          : ref
            ? "home"
            : "direct";
    trackEvent({ event_type: "chat_start", character_slug: slug, locale, src });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  // 대화 이탈 이벤트 — 탭이 가려질 때 마지막 턴 수 기록 (sendBeacon)
  // 기존 대화가 있으면 그 유저 턴 수부터 시작
  const turnRef = useRef(
    initialMessages.filter((m) => m.role === "user").length
  );
  useEffect(() => {
    function onHide() {
      if (document.visibilityState === "hidden" && turnRef.current > 0) {
        trackEventBeacon({
          event_type: "chat_leave",
          character_slug: slug,
          locale,
          turn_count: turnRef.current,
        });
      }
    }
    document.addEventListener("visibilitychange", onHide);
    return () => document.removeEventListener("visibilitychange", onHide);
  }, [slug, locale]);

  // ---------- AI 모델 선택 ----------
  // 키가 설정된 모델만 서버가 내려준다 (키 값은 절대 안 내려옴).
  // 기본값은 "자동"(null) = 기존 폴백 체인 그대로. 선택은 사용자 단위로 localStorage에 유지.
  const MODEL_STORAGE_KEY = "vue-model";
  const [models, setModels] = useState<ModelInfo[]>([]);
  const [selectedModel, setSelectedModel] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/models")
      .then((res) => res.json())
      .then((data: { models: ModelInfo[] }) => {
        setModels(data.models);
        if (data.models.length === 0) return;
        const saved = localStorage.getItem(MODEL_STORAGE_KEY);
        // 저장값이 현재 활성 모델이면 복원, 아니면 자동(null) 유지
        setSelectedModel(
          data.models.some((m) => m.id === saved) ? saved : null
        );
      })
      .catch(() => {}); // 실패해도 대화는 가능 (서버가 알아서 폴백)
  }, []);

  function handleModelSelect(id: string | null) {
    // 자체 이벤트: 모델 변경 (변경 전/후 + 그 시점의 턴 수)
    if (id !== selectedModel) {
      trackEvent({
        event_type: "model_change",
        character_slug: slug,
        locale,
        prev_model: selectedModel ?? "auto",
        model: id ?? "auto",
        turn_count: turnRef.current,
      });
    }
    setSelectedModel(id);
    if (id) localStorage.setItem(MODEL_STORAGE_KEY, id);
    else localStorage.removeItem(MODEL_STORAGE_KEY);
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
          // "자동"이면 model 을 보내지 않는다 → 기존 폴백 로직 그대로
          ...(selectedModel ? { model: selectedModel } : {}),
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

      // 턴 수 갱신 (이탈 이벤트·요금제 "대화 후 진입" 판별용)
      turnRef.current += 1;
      noteChatActivity(turnRef.current);

      // 특정 모델을 선택했는데 그 모델이 응답하지 못한 경우:
      // 짧은 안내를 보여주고 "자동"으로 되돌린다 (대화 자체는 폴백으로 이미 이어짐)
      if (selectedModel && data.via && data.via !== selectedModel) {
        setNotice(t("modelFallbackNotice"));
        handleModelSelect(null);
        setTimeout(() => setNotice(null), 4000);
      }
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
    // 대화 영역이 화면 세로를 가득 채운다 (100dvh - 상단 네비 3.5rem)
    // dvh 단위: 모바일 주소창 높이 변화에도 입력창이 잘리지 않음
    <div className="mx-auto flex h-[calc(100dvh-3.5rem)] w-full max-w-2xl flex-col px-4">
      {/* 대화 상대 헤더 (고정 높이) */}
      <div className="-mx-4 flex shrink-0 items-center gap-3 border-b border-line bg-night px-4 py-3">
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
          <div className="max-w-[240px] truncate text-[11px] text-ink-soft sm:max-w-md">
            {character.description}
          </div>
        </div>
      </div>

      {/* 말풍선 목록 — 남는 공간을 모두 차지하고, 넘치면 여기만 스크롤 */}
      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto py-6">
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
        {/* 모델 자동 전환 안내 (잠깐 표시 후 사라짐) */}
        {notice && (
          <div className="mx-auto rounded-xl border border-wine/40 bg-panel px-4 py-2 text-center text-xs text-wine">
            {notice}
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* 입력 영역 (모델 선택 + 입력창) — 대화 영역 맨 아래 고정 (메시지가 적어도 위로 안 뜸) */}
      <div className="-mx-4 shrink-0 border-t border-line bg-night px-4 pb-3 pt-2">
        {/* AI 모델 선택 — 입력창 바로 위, 왼쪽 정렬. 사용 가능 모델 0개면 렌더링 안 함 */}
        {models.length > 0 && (
          <div className="mb-2 flex justify-start">
            <ModelPicker
              models={models}
              selected={selectedModel}
              onSelect={handleModelSelect}
            />
          </div>
        )}
        <form onSubmit={handleSend} className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t("placeholder", { name: character.name })}
            className="min-w-0 flex-1 rounded-full border border-line bg-panel px-4 py-2.5 text-sm text-ink outline-none transition placeholder:text-ink-soft/60 focus:border-wine"
            maxLength={1000}
          />
          <button
            type="submit"
            disabled={sending || !input.trim()}
            className="shrink-0 rounded-full bg-cta px-5 py-2.5 text-sm font-semibold text-ink transition hover:bg-cta-hover disabled:opacity-40"
          >
            {t("send")}
          </button>
        </form>
      </div>
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
