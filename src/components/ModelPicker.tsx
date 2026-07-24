"use client";

// AI 모델 선택 — 알약(pill) 버튼 + 중앙 모달
// 기본값은 "자동"(폴백 체인 그대로). 특정 모델을 고르면 그 모델을 우선 사용.
// 모달은 Portal 로 body 에 직접 그린다 — 부모의 backdrop-blur 때문에
// fixed 기준이 뒤틀려 상단이 잘리던 문제를 근본적으로 방지.
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";

export type ModelInfo = {
  id: string;
  label: string; // 실제 모델명 (원본 그대로)
  provider: string; // 예: Google
  status: string;
  // 실측 성능 (최근 20회) — 표본 3회 미만이면 avgSec/successRate 없음
  perf?: { samples: number; avgSec?: number; successRate?: number };
};

export default function ModelPicker({
  models,
  selected, // null = 자동
  onSelect,
}: {
  models: ModelInfo[];
  selected: string | null;
  onSelect: (id: string | null) => void;
}) {
  const t = useTranslations("chat");
  const [open, setOpen] = useState(false);
  // 모달 안에서 임시로 고른 값 (선택 버튼을 눌러야 확정)
  const [temp, setTemp] = useState<string | null>(selected);
  const firstItemRef = useRef<HTMLInputElement>(null);

  const currentLabel =
    models.find((m) => m.id === selected)?.label ?? t("modelAuto");

  function openModal() {
    setTemp(selected);
    setOpen(true);
  }

  // 접근성: Esc 로 닫기 + 열릴 때 첫 항목에 포커스
  useEffect(() => {
    if (!open) return;
    firstItemRef.current?.focus();
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  // 성능 한 줄: "Google · 평균 1.2초 · 성공률 98%" / 표본 부족 시 "측정 중"
  function perfLine(m: ModelInfo): string {
    const p = m.perf;
    if (p && p.samples >= 3 && p.avgSec !== undefined && p.successRate !== undefined) {
      return `${m.provider} · ${t("modelPerf", { sec: p.avgSec, rate: p.successRate })}`;
    }
    return `${m.provider} · ${t("modelMeasuring")}`;
  }

  const modal =
    open &&
    createPortal(
      <div
        className="fixed inset-0 z-[70] flex items-center justify-center bg-night/75 px-4"
        onClick={() => setOpen(false)}
        role="dialog"
        aria-modal="true"
        aria-label={t("modelPickerTitle")}
      >
        {/* 최대 높이 80vh — 제목·버튼 고정, 목록만 스크롤 */}
        <div
          className="vue-rise flex max-h-[80vh] w-full max-w-sm flex-col rounded-2xl border border-line bg-panel shadow-[0_16px_60px_rgba(0,0,0,0.55)]"
          onClick={(e) => e.stopPropagation()}
        >
          <h2 className="shrink-0 px-5 pb-3 pt-5 text-sm font-bold text-ink">
            {t("modelPickerTitle")}
          </h2>

          {/* 목록 (스크롤 영역) */}
          <div
            className="flex min-h-0 flex-1 flex-col gap-1.5 overflow-y-auto px-5"
            role="radiogroup"
          >
            {models.map((m, i) => (
              <label
                key={m.id}
                className={`flex shrink-0 cursor-pointer items-center gap-3 rounded-xl border px-3.5 py-2.5 transition-colors duration-200 ${
                  temp === m.id
                    ? "border-wine/70 bg-wine/10"
                    : "border-line hover:border-wine/40"
                }`}
              >
                <input
                  ref={i === 0 ? firstItemRef : undefined}
                  type="radio"
                  name="model"
                  checked={temp === m.id}
                  onChange={() => setTemp(m.id)}
                  className="accent-[#A85D7F]"
                />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-ink">
                    {m.label}
                  </span>
                  {/* 실측 성능 — 하드코딩 없음, 서버 측정값만 표시 */}
                  <span className="block text-[11px] text-ink-soft">
                    {perfLine(m)}
                  </span>
                </span>
                {/* 상태 점 (활성 = 초록) */}
                <span
                  className="h-2 w-2 shrink-0 rounded-full bg-[#4a9d6e]"
                  aria-label="online"
                />
              </label>
            ))}

            {/* 자동 — 기본 선택값 */}
            <label
              className={`flex shrink-0 cursor-pointer items-center gap-3 rounded-xl border px-3.5 py-2.5 transition-colors duration-200 ${
                temp === null
                  ? "border-wine/70 bg-wine/10"
                  : "border-line hover:border-wine/40"
              }`}
            >
              <input
                type="radio"
                name="model"
                checked={temp === null}
                onChange={() => setTemp(null)}
                className="accent-[#A85D7F]"
              />
              <span className="flex-1 text-sm font-semibold text-ink">
                {t("modelAutoDesc")}
              </span>
            </label>
          </div>

          {/* 하단 버튼 (항상 보임) */}
          <div className="flex shrink-0 justify-end gap-2 px-5 pb-5 pt-4">
            <button
              onClick={() => setOpen(false)}
              className="rounded-xl border border-line bg-night px-4 py-2 text-sm text-ink-soft transition hover:text-ink"
            >
              {t("modelCancel")}
            </button>
            <button
              onClick={() => {
                onSelect(temp);
                setOpen(false);
              }}
              className="rounded-xl bg-cta px-5 py-2 text-sm font-semibold text-ink transition hover:bg-cta-hover"
            >
              {t("modelConfirm")}
            </button>
          </div>
        </div>
      </div>,
      document.body
    );

  return (
    <>
      {/* 알약 버튼 — 입력창 위 보조 컨트롤이라 살짝 작게 */}
      <button
        onClick={openModal}
        aria-label={t("modelPickerTitle")}
        className="flex max-w-[160px] items-center gap-1.5 rounded-full border border-line bg-panel px-2.5 py-1 text-[11px] text-ink-soft transition hover:border-wine hover:text-ink"
      >
        <span className="truncate">{currentLabel}</span>
        <svg width="9" height="9" viewBox="0 0 12 12" fill="none" aria-hidden>
          <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {modal}
    </>
  );
}
