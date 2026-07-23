"use client";

// 사이트 설정 편집 UI — 언어 탭 전환 + 저장 시 토스트
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { routing, LOCALE_LABELS, type Locale } from "@/i18n/routing";

type Settings = {
  locale: string;
  site_title: string;
  tagline: string | null;
  intro_text: string | null;
};

type Form = { site_title: string; tagline: string; intro_text: string };

export default function SettingsEditor({
  initialSettings,
}: {
  initialSettings: Settings[];
}) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Locale>("ko");
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [forms, setForms] = useState<Record<Locale, Form>>(() => {
    const base: Record<Locale, Form> = {
      ko: { site_title: "VUE", tagline: "", intro_text: "" },
      zh: { site_title: "VUE", tagline: "", intro_text: "" },
      en: { site_title: "VUE", tagline: "", intro_text: "" },
      ja: { site_title: "VUE", tagline: "", intro_text: "" },
    };
    for (const s of initialSettings) {
      if ((routing.locales as readonly string[]).includes(s.locale)) {
        base[s.locale as Locale] = {
          site_title: s.site_title ?? "VUE",
          tagline: s.tagline ?? "",
          intro_text: s.intro_text ?? "",
        };
      }
    }
    return base;
  });

  // 토스트 자동 사라짐
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 2500);
    return () => clearTimeout(timer);
  }, [toast]);

  function setField(patch: Partial<Form>) {
    setForms((prev) => ({
      ...prev,
      [activeTab]: { ...prev[activeTab], ...patch },
    }));
  }

  async function handleSave() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locale: activeTab, ...forms[activeTab] }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "저장에 실패했어요.");
      setToast(`${LOCALE_LABELS[activeTab]} 설정을 저장했어요 ✓`);
      router.refresh(); // 홈 화면에 바로 반영
    } catch (err) {
      setError(err instanceof Error ? err.message : "저장에 실패했어요.");
    } finally {
      setBusy(false);
    }
  }

  const form = forms[activeTab];

  return (
    <div className="relative space-y-4">
      {/* 토스트 */}
      {toast && (
        <div className="fixed bottom-8 left-1/2 z-50 -translate-x-1/2 rounded-full border border-wine/40 bg-panel px-5 py-2.5 text-sm text-wine shadow-[0_8px_30px_rgba(0,0,0,0.5)]">
          {toast}
        </div>
      )}

      {/* 언어 탭 */}
      <div className="flex gap-1 border-b border-line">
        {routing.locales.map((l) => (
          <button
            key={l}
            onClick={() => setActiveTab(l)}
            className={`rounded-t-lg px-4 py-2 text-sm font-medium transition ${
              activeTab === l
                ? "bg-cta text-ink"
                : "bg-panel text-ink-soft hover:text-ink"
            }`}
          >
            {LOCALE_LABELS[l]}
          </button>
        ))}
      </div>

      <div className="space-y-4 rounded-2xl border border-line bg-panel p-6">
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-ink-soft">
            사이트 제목 (site_title)
          </span>
          <input
            value={form.site_title}
            onChange={(e) => setField({ site_title: e.target.value })}
            className="w-full rounded-lg border border-line bg-night px-3 py-2 text-sm text-ink outline-none transition focus:border-wine"
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-xs font-medium text-ink-soft">
            슬로건 (tagline) — 홈 상단 큰 문구. 줄바꿈 가능
          </span>
          <textarea
            value={form.tagline}
            onChange={(e) => setField({ tagline: e.target.value })}
            rows={2}
            className="w-full rounded-lg border border-line bg-night px-3 py-2 text-sm text-ink outline-none transition focus:border-wine"
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-xs font-medium text-ink-soft">
            소개 문구 (intro_text) — 슬로건 아래 작은 설명
          </span>
          <textarea
            value={form.intro_text}
            onChange={(e) => setField({ intro_text: e.target.value })}
            rows={3}
            className="w-full rounded-lg border border-line bg-night px-3 py-2 text-sm text-ink outline-none transition focus:border-wine"
          />
        </label>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <button
          onClick={handleSave}
          disabled={busy}
          className="rounded-xl bg-cta px-5 py-2 text-sm font-semibold text-ink transition hover:bg-cta-hover disabled:opacity-40"
        >
          {busy ? "저장 중…" : `${LOCALE_LABELS[activeTab]} 저장`}
        </button>
      </div>
    </div>
  );
}
