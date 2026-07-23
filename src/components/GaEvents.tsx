"use client";

// 로그인 성공 이벤트 감지
// 구글 로그인 후 돌아올 때 주소에 ?login=success 가 붙어 오면
// GA에 login_success 이벤트를 한 번 보내고 주소를 깨끗하게 정리한다.
import { useEffect } from "react";
import { trackLoginSuccess } from "@/lib/gaEvents";

export default function GaEvents() {
  useEffect(() => {
    const url = new URL(window.location.href);
    if (url.searchParams.get("login") === "success") {
      trackLoginSuccess();
      url.searchParams.delete("login");
      window.history.replaceState({}, "", url.toString());
    }
  }, []);

  return null;
}
