// 캐릭터 이미지 크롭 위치 (object-position)
// 실제 이미지 4장을 보고 얼굴이 카드 중앙 상단에 오도록 맞춘 값.
// 새 캐릭터 추가 시 여기에 slug 를 등록하면 되고, 없으면 기본값을 쓴다.
// (이미지 파일 자체는 수정하지 않음 — CSS 크롭만)

// ※ object-position 의 Y% 는 "값이 클수록 이미지 위쪽을 더 잘라 얼굴이 위로 올라옴"
//   (이미지 원본에서 얼굴 중심 위치: kai ~50%, ren ~30%, yul ~40%, siwoo ~30%)
const FOCAL_POSITIONS: Record<string, string> = {
  kai: "center 70%", // 얼굴 중심이 이미지 중앙쯤 — 크게 끌어올려 눈이 카드 상단 1/4에
  ren: "center 18%", // 얼굴이 원래 상단 — 유지
  yul: "center 45%", // 얼굴이 아래로 치우침 — 끌어올려 상단 1/3에
  siwoo: "center 16%", // 얼굴이 최상단 — 유지
};

export const DEFAULT_FOCAL = "center 30%";

export function focalPosition(slug: string | null | undefined): string {
  if (!slug) return DEFAULT_FOCAL;
  return FOCAL_POSITIONS[slug] ?? DEFAULT_FOCAL;
}
