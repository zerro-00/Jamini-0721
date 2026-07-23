// [관리자 전용 API] 사이트 설정(제목·슬로건·소개문구) 저장
// 반드시 서버에서 관리자 검사 후 service_role 로 쓴다 (화면 숨김만으로는 보안 아님)
import { NextResponse } from "next/server";
import { getAdminUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { routing } from "@/i18n/routing";

export async function PUT(request: Request) {
  const admin = await getAdminUser();
  if (!admin) {
    return NextResponse.json({ error: "관리자만 가능해요." }, { status: 403 });
  }

  const body = await request.json();
  const locale = String(body.locale ?? "");
  if (!(routing.locales as readonly string[]).includes(locale)) {
    return NextResponse.json({ error: "잘못된 언어예요." }, { status: 400 });
  }

  const values = {
    site_title: String(body.site_title ?? "").trim() || "VUE",
    tagline: String(body.tagline ?? "").trim() || null,
    intro_text: String(body.intro_text ?? "").trim() || null,
    updated_at: new Date().toISOString(),
  };

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("site_settings")
    .upsert({ locale, ...values }, { onConflict: "locale" })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ settings: data });
}
