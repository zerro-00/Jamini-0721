// VUE 브랜드 심볼 ◀◀ — déjà vue, "다시 보고 싶은 그 장면"의 되감기 기호
// 미니멀한 선 두 개의 삼각형. 색은 currentColor (기본: 뮤트 와인)
export default function RewindMark({
  size = 20,
  className = "text-wine",
  spinning = false,
}: {
  size?: number;
  className?: string;
  spinning?: boolean; // 로딩 시 2초에 1바퀴 역방향 회전
}) {
  return (
    <svg
      width={size}
      height={(size * 2) / 3}
      viewBox="0 0 48 32"
      fill="none"
      aria-hidden
      className={`${className} ${spinning ? "vue-rewind-spin" : ""}`}
    >
      <path
        d="M22 5 L7 16 L22 27 Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
        fill="none"
      />
      <path
        d="M42 5 L27 16 L42 27 Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}
