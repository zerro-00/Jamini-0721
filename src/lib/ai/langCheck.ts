// 응답 언어 혼동 감지 (한국어 응답에 한자·가나가 섞였는지 등)
import "server-only";

// CJK 한자 (중국어·일본어 한자 공통 영역)
const HANZI = /[一-鿿㐀-䶿]/g;
// 일본어 가나 (히라가나·가타카나)
const KANA = /[぀-ヿ]/g;
// 한글
const HANGUL = /[가-힯]/g;

export type LangCheckResult = {
  ok: boolean;
  /** 섞여 들어온 이질 문자 수 */
  foreignCount: number;
  /** 어떤 종류가 섞였는지 (로그용) */
  kinds: string[];
};

/** locale 응답에 이질 문자가 섞였는지 검사 */
export function checkLanguage(locale: string, text: string): LangCheckResult {
  const hanzi = (text.match(HANZI) ?? []).length;
  const kana = (text.match(KANA) ?? []).length;
  const hangul = (text.match(HANGUL) ?? []).length;

  const kinds: string[] = [];
  let foreignCount = 0;

  if (locale === "ko") {
    // 한국어: 한자·가나가 1자라도 섞이면 혼동
    if (hanzi > 0) kinds.push(`한자 ${hanzi}자`);
    if (kana > 0) kinds.push(`가나 ${kana}자`);
    foreignCount = hanzi + kana;
  } else if (locale === "ja") {
    // 일본어: 한글이 섞이면 혼동 (한자·가나는 정상)
    if (hangul > 0) kinds.push(`한글 ${hangul}자`);
    foreignCount = hangul;
  } else if (locale === "zh") {
    // 중국어: 한글·가나가 섞이면 혼동
    if (hangul > 0) kinds.push(`한글 ${hangul}자`);
    if (kana > 0) kinds.push(`가나 ${kana}자`);
    foreignCount = hangul + kana;
  } else {
    // 영어: CJK 문자가 섞이면 혼동
    if (hanzi + kana + hangul > 0)
      kinds.push(`CJK ${hanzi + kana + hangul}자`);
    foreignCount = hanzi + kana + hangul;
  }

  return { ok: foreignCount === 0, foreignCount, kinds };
}
