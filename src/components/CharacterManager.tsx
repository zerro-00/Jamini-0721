"use client";

// 캐릭터 추가/수정/삭제 UI (관리자 전용) — 4개 언어(한/중/영/일) 탭 입력
// 실제 DB 작업은 /api/admin/characters 를 통해서만 이뤄진다.
import { useState } from "react";
import { useRouter } from "next/navigation";
import { routing, LOCALE_LABELS, type Locale } from "@/i18n/routing";

type Translation = {
  locale: string;
  name: string;
  tagline: string | null;
  description: string | null;
  keywords: string[] | null;
  persona: string;
  greeting: string | null;
};

export type AdminCharacter = {
  id: string;
  slug: string;
  thumbnail_url: string | null;
  is_official: boolean;
  is_public: boolean;
  created_at: string;
  character_translations: Translation[];
};

// 폼에서 다루는 언어별 입력값
type TrForm = {
  name: string;
  tagline: string;
  description: string;
  keywords: string; // 쉼표 구분 문자열로 입력받아 저장 시 배열로 변환
  persona: string;
  greeting: string;
};

type FormValues = {
  slug: string;
  thumbnail_url: string;
  is_official: boolean;
  is_public: boolean;
  translations: Record<Locale, TrForm>;
};

const EMPTY_TR: TrForm = {
  name: "",
  tagline: "",
  description: "",
  keywords: "",
  persona: "",
  greeting: "",
};

function emptyForm(): FormValues {
  return {
    slug: "",
    thumbnail_url: "",
    is_official: true,
    is_public: true,
    translations: {
      ko: { ...EMPTY_TR },
      zh: { ...EMPTY_TR },
      en: { ...EMPTY_TR },
      ja: { ...EMPTY_TR },
    },
  };
}

export default function CharacterManager({
  initialCharacters,
}: {
  initialCharacters: AdminCharacter[];
}) {
  const router = useRouter();
  const [editingId, setEditingId] = useState<string | "new" | null>(null);
  const [form, setForm] = useState<FormValues>(emptyForm());
  const [activeTab, setActiveTab] = useState<Locale>("ko");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function startNew() {
    setEditingId("new");
    setForm(emptyForm());
    setActiveTab("ko");
    setError(null);
  }

  function startEdit(c: AdminCharacter) {
    const next = emptyForm();
    next.slug = c.slug;
    next.thumbnail_url = c.thumbnail_url ?? "";
    next.is_official = c.is_official;
    next.is_public = c.is_public;
    for (const tr of c.character_translations) {
      if ((routing.locales as readonly string[]).includes(tr.locale)) {
        next.translations[tr.locale as Locale] = {
          name: tr.name ?? "",
          tagline: tr.tagline ?? "",
          description: tr.description ?? "",
          keywords: (tr.keywords ?? []).join(", "),
          persona: tr.persona ?? "",
          greeting: tr.greeting ?? "",
        };
      }
    }
    setEditingId(c.id);
    setForm(next);
    setActiveTab("ko");
    setError(null);
  }

  function setTr(locale: Locale, patch: Partial<TrForm>) {
    setForm((prev) => ({
      ...prev,
      translations: {
        ...prev.translations,
        [locale]: { ...prev.translations[locale], ...patch },
      },
    }));
  }

  async function handleSave() {
    // 한국어는 필수, 나머지 언어는 이름+persona가 있는 언어만 저장
    const ko = form.translations.ko;
    if (!form.slug.trim() || !ko.name.trim() || !ko.persona.trim()) {
      setError("slug, 한국어 이름, 한국어 persona는 꼭 채워야 해요.");
      setActiveTab("ko");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const translations = routing.locales
        .map((locale) => {
          const tr = form.translations[locale];
          if (!tr.name.trim() || !tr.persona.trim()) return null;
          return {
            locale,
            name: tr.name.trim(),
            tagline: tr.tagline.trim() || null,
            description: tr.description.trim() || null,
            keywords: tr.keywords
              .split(",")
              .map((k) => k.trim())
              .filter(Boolean),
            persona: tr.persona.trim(),
            greeting: tr.greeting.trim() || null,
          };
        })
        .filter(Boolean);

      const payload = {
        slug: form.slug.trim(),
        thumbnail_url: form.thumbnail_url.trim() || null,
        is_official: form.is_official,
        is_public: form.is_public,
        translations,
      };

      const isNew = editingId === "new";
      const res = await fetch("/api/admin/characters", {
        method: isNew ? "POST" : "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(isNew ? payload : { id: editingId, ...payload }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "저장에 실패했어요.");
      setEditingId(null);
      router.refresh(); // 서버에서 목록 다시 로드
    } catch (err) {
      setError(err instanceof Error ? err.message : "저장에 실패했어요.");
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(c: AdminCharacter) {
    const koName =
      c.character_translations.find((t) => t.locale === "ko")?.name ?? c.slug;
    if (
      !confirm(
        `"${koName}" 캐릭터를 삭제할까요?\n이 캐릭터와 나눈 모든 유저의 대화 기록도 함께 삭제됩니다.`
      )
    )
      return;
    setBusy(true);
    try {
      const res = await fetch("/api/admin/characters", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: c.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "삭제에 실패했어요.");
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "삭제에 실패했어요.");
    } finally {
      setBusy(false);
    }
  }

  const tr = form.translations[activeTab];

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button
          onClick={startNew}
          className="rounded-xl bg-cta px-4 py-2 text-sm font-semibold text-ink transition hover:bg-cta-hover"
        >
          + 새 캐릭터
        </button>
      </div>

      {/* 편집 폼 */}
      {editingId && (
        <div className="space-y-3 rounded-2xl border border-line bg-panel p-6 shadow-sm">
          <h2 className="font-bold text-ink">
            {editingId === "new" ? "새 캐릭터 만들기" : "캐릭터 수정"}
          </h2>

          {/* 공통 설정 */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="slug * (영문 소문자, URL에 쓰임. 예: kai)">
              <input
                value={form.slug}
                onChange={(e) => setForm({ ...form, slug: e.target.value })}
                className="w-full rounded-lg border border-line bg-night px-3 py-2 text-sm text-ink outline-none focus:border-wine"
                placeholder="kai"
              />
            </Field>
            <Field label="썸네일 이미지 주소 (예: /characters/kai.jpg)">
              <input
                value={form.thumbnail_url}
                onChange={(e) =>
                  setForm({ ...form, thumbnail_url: e.target.value })
                }
                className="w-full rounded-lg border border-line bg-night px-3 py-2 text-sm text-ink outline-none focus:border-wine"
                placeholder="/characters/kai.jpg"
              />
            </Field>
          </div>

          <div className="flex gap-6 text-sm text-ink-soft">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.is_official}
                onChange={(e) =>
                  setForm({ ...form, is_official: e.target.checked })
                }
              />
              공식 캐릭터
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.is_public}
                onChange={(e) =>
                  setForm({ ...form, is_public: e.target.checked })
                }
              />
              공개 (홈에 표시)
            </label>
          </div>

          {/* 언어 탭 */}
          <div className="border-b border-line pt-2">
            <div className="flex gap-1">
              {routing.locales.map((l) => {
                const filled =
                  form.translations[l].name.trim() &&
                  form.translations[l].persona.trim();
                return (
                  <button
                    key={l}
                    onClick={() => setActiveTab(l)}
                    className={`rounded-t-lg px-4 py-2 text-sm font-medium transition ${
                      activeTab === l
                        ? "bg-cta text-ink"
                        : "bg-night text-ink-soft hover:text-ink"
                    }`}
                  >
                    {LOCALE_LABELS[l]}
                    {filled ? " ✓" : ""}
                  </button>
                );
              })}
            </div>
          </div>
          <p className="text-xs text-ink-soft">
            한국어는 필수, 다른 언어는 이름+persona를 채운 언어만 저장돼요.
            언어 탭의 ✓ 표시는 저장될 언어라는 뜻입니다.
          </p>

          {/* 선택된 언어의 번역 입력 */}
          <Field label={`이름 (${LOCALE_LABELS[activeTab]}) ${activeTab === "ko" ? "*" : ""}`}>
            <input
              value={tr.name}
              onChange={(e) => setTr(activeTab, { name: e.target.value })}
              className="w-full rounded-lg border border-line bg-night px-3 py-2 text-sm text-ink outline-none focus:border-wine"
            />
          </Field>

          <Field label="한 줄 소개 (tagline)">
            <input
              value={tr.tagline}
              onChange={(e) => setTr(activeTab, { tagline: e.target.value })}
              className="w-full rounded-lg border border-line bg-night px-3 py-2 text-sm text-ink outline-none focus:border-wine"
            />
          </Field>

          <Field label="상세 소개 (description)">
            <textarea
              value={tr.description}
              onChange={(e) =>
                setTr(activeTab, { description: e.target.value })
              }
              rows={3}
              className="w-full rounded-lg border border-line bg-night px-3 py-2 text-sm text-ink outline-none focus:border-wine"
            />
          </Field>

          <Field label="키워드 (쉼표로 구분. 예: 마피아, 계승자, 위험한 보호)">
            <input
              value={tr.keywords}
              onChange={(e) => setTr(activeTab, { keywords: e.target.value })}
              className="w-full rounded-lg border border-line bg-night px-3 py-2 text-sm text-ink outline-none focus:border-wine"
            />
          </Field>

          <Field
            label={`persona (${LOCALE_LABELS[activeTab]}) ${activeTab === "ko" ? "*" : ""} — 캐릭터의 성격·말투 프롬프트`}
          >
            <textarea
              value={tr.persona}
              onChange={(e) => setTr(activeTab, { persona: e.target.value })}
              rows={10}
              className="w-full rounded-lg border border-line bg-night px-3 py-2 font-mono text-xs text-ink outline-none focus:border-wine"
            />
          </Field>

          <Field label="시작 인사말 (greeting)">
            <textarea
              value={tr.greeting}
              onChange={(e) => setTr(activeTab, { greeting: e.target.value })}
              rows={2}
              className="w-full rounded-lg border border-line bg-night px-3 py-2 text-sm text-ink outline-none focus:border-wine"
            />
          </Field>

          {error && <p className="text-sm text-red-400">{error}</p>}

          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={busy}
              className="rounded-xl bg-cta px-5 py-2 text-sm font-semibold text-ink transition hover:bg-cta-hover disabled:opacity-40"
            >
              {busy ? "저장 중…" : "저장"}
            </button>
            <button
              onClick={() => setEditingId(null)}
              disabled={busy}
              className="rounded-xl border border-line bg-night px-5 py-2 text-sm font-semibold text-ink-soft transition hover:text-ink"
            >
              취소
            </button>
          </div>
        </div>
      )}

      {/* 목록 */}
      <div className="overflow-hidden rounded-2xl border border-line bg-panel shadow-sm">
        {initialCharacters.length === 0 ? (
          <p className="px-6 py-10 text-center text-sm text-ink-soft">
            아직 캐릭터가 없어요. &ldquo;+ 새 캐릭터&rdquo;로 만들어 보세요.
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line text-left text-xs text-ink-soft">
                <th className="px-5 py-3 font-medium">slug</th>
                <th className="px-5 py-3 font-medium">이름(ko)</th>
                <th className="hidden px-5 py-3 font-medium sm:table-cell">
                  언어
                </th>
                <th className="px-5 py-3 font-medium">상태</th>
                <th className="px-5 py-3 text-right font-medium">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {initialCharacters.map((c) => {
                const koName =
                  c.character_translations.find((t) => t.locale === "ko")
                    ?.name ?? "-";
                const locales = c.character_translations
                  .map((t) => t.locale)
                  .sort()
                  .join(" · ");
                return (
                  <tr key={c.id}>
                    <td className="px-5 py-3 font-mono text-xs text-ink-soft">
                      {c.slug}
                    </td>
                    <td className="px-5 py-3 font-semibold text-ink">
                      {koName}
                    </td>
                    <td className="hidden px-5 py-3 text-xs text-ink-soft sm:table-cell">
                      {locales}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex flex-wrap gap-1">
                        {c.is_official && (
                          <span className="rounded-full bg-night px-2 py-0.5 text-[10px] font-semibold text-wine">
                            공식
                          </span>
                        )}
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                            c.is_public
                              ? "bg-night text-wine"
                              : "bg-night text-ink-soft/60"
                          }`}
                        >
                          {c.is_public ? "공개" : "비공개"}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <button
                        onClick={() => startEdit(c)}
                        className="mr-3 text-wine transition hover:text-wine"
                      >
                        수정
                      </button>
                      <button
                        onClick={() => handleDelete(c)}
                        className="text-ink-soft transition hover:text-ink"
                      >
                        삭제
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-ink-soft">
        {label}
      </span>
      {children}
    </label>
  );
}
