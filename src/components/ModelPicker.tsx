"use client";

// AI 모델 선택 — 알약(pill) 버튼 + 모달
// 기본값은 "자동"(폴백 체인 그대로). 특정 모델을 고르면 그 모델을 우선 사용.
// 사용 가능한 모델이 0개면 부모에서 렌더링하지 않는다.
import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";

export type ModelInfo = {
  id: string;
  label: string; // 실제 모델명 (원본 그대로)
  provider: string; // 예: Google
  status: string;
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

  return (
    <>
      {/* 알약 버튼 — 현재 선택 모델명 + 화살표 */}
      <button
        onClick={openModal}
        aria-label={t("modelPickerTitle")}
        className="flex max-w-[150px] items-center gap-1.5 rounded-full border border-line bg-panel px-3 py-1.5 text-[11px] text-ink transition hover:border-wine sm:max-w-[200px]"
      >
        <span className="truncate">{currentLabel}</span>
        <svg width="10" height="10" viewBox="0 0 12 12" fill="none" aria-hidden>
          <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {/* 모달 */}
      {open && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-night/70 px-4 backdrop-blur-sm"
          onClick={() => setOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label={t("modelPickerTitle")}
        >
          <div
            className="vue-rise w-full max-w-sm rounded-2xl border border-line bg-panel p-5 shadow-[0_16px_60px_rgba(0,0,0,0.55)]"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="mb-4 text-sm font-bold text-ink">
              {t("modelPickerTitle")}
            </h2>

            <div className="flex flex-col gap-1.5" role="radiogroup">
              {models.map((m, i) => (
                <label
                  key={m.id}
                  className={`flex cursor-pointer items-center gap-3 rounded-xl border px-3.5 py-2.5 transition-colors duration-200 ${
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
                  <span className="flex-1">
                    <span className="block text-sm font-semibold text-ink">
                      {m.label}
                    </span>
                    <span className="block text-[11px] text-ink-soft">
                      {m.provider}
                    </span>
                  </span>
                  {/* 상태 점 (활성 = 초록) */}
                  <span
                    className="h-2 w-2 rounded-full bg-[#4a9d6e]"
                    aria-label="online"
                  />
                </label>
              ))}

              {/* 자동 — 기본 선택값 */}
              <label
                className={`flex cursor-pointer items-center gap-3 rounded-xl border px-3.5 py-2.5 transition-colors duration-200 ${
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

            <div className="mt-5 flex justify-end gap-2">
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
        </div>
      )}
    </>
  );
}
