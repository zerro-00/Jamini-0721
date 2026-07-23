// 요금제 — 월 구독 + 코인 충전 카드. 결제는 2단계에서 연동 예정 ("준비 중")
import { getTranslations } from "next-intl/server";

export default async function PricingPage() {
  const t = await getTranslations("pricing");

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-10">
      <div className="mb-10 text-center">
        <h1 className="text-2xl font-black text-ink sm:text-3xl">
          {t("title")}
        </h1>
        <p className="mt-2 text-sm text-ink-soft">{t("subtitle")}</p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        {/* 월 구독 */}
        <PlanCard
          badge={t("subBadge")}
          title={t("subTitle")}
          price={t("subPrice")}
          features={[t("subFeature1"), t("subFeature2"), t("subFeature3")]}
          comingSoon={t("comingSoon")}
        />
        {/* 코인 충전 */}
        <PlanCard
          badge={t("coinBadge")}
          title={t("coinTitle")}
          price={t("coinPrice")}
          features={[t("coinFeature1"), t("coinFeature2"), t("coinFeature3")]}
          comingSoon={t("comingSoon")}
        />
      </div>

      <p className="mt-8 text-center text-xs text-ink-soft">{t("priceNote")}</p>
    </div>
  );
}

function PlanCard({
  badge,
  title,
  price,
  features,
  comingSoon,
}: {
  badge: string;
  title: string;
  price: string;
  features: string[];
  comingSoon: string;
}) {
  return (
    <div className="flex flex-col rounded-2xl border border-line bg-panel p-6 shadow-sm">
      <span className="mb-3 w-fit rounded-full bg-night px-3 py-1 text-[11px] font-semibold text-wine">
        {badge}
      </span>
      <h2 className="text-lg font-bold text-ink">{title}</h2>
      <div className="mt-1 text-2xl font-black text-wine">{price}</div>
      <ul className="mt-4 flex-1 space-y-2 text-sm text-ink-soft">
        {features.map((f) => (
          <li key={f} className="flex items-start gap-2">
            <span className="text-wine">✓</span>
            {f}
          </li>
        ))}
      </ul>
      {/* 결제는 2단계 — 지금은 자리만 */}
      <button
        disabled
        className="mt-6 cursor-not-allowed rounded-xl border border-line bg-night px-4 py-3 text-sm font-semibold text-ink-soft/60"
      >
        {comingSoon}
      </button>
    </div>
  );
}
