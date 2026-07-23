// 페이지 로딩 화면 — ◀◀ 가 천천히 역방향으로 도는 절제된 모션
import { getTranslations } from "next-intl/server";
import RewindMark from "@/components/RewindMark";

export default async function Loading() {
  const tVuny = await getTranslations("vuny");

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-5 py-24">
      <RewindMark size={44} className="text-wine" spinning />
      <p className="text-sm text-ink-soft">{tVuny("loading")}</p>
    </div>
  );
}
