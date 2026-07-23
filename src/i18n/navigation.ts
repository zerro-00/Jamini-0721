// 언어(locale)를 자동으로 붙여주는 Link / redirect / useRouter
// 페이지 이동은 next/link 대신 반드시 여기의 Link 를 쓴다
import { createNavigation } from "next-intl/navigation";
import { routing } from "./routing";

export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);
