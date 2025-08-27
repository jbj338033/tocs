"use client"

import { SessionProvider } from "next-auth/react"
import { signIn } from "next-auth/react"
import Link from "next/link"
import { Github } from "@/shared/ui/icons"

export default function SignIn() {
  const handleSignIn = () => {
    signIn("github", { callbackUrl: "/dashboard" })
  }

  return (
    <SessionProvider>
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-[360px]">
          <div className="text-center mb-10">
            <h1 className="text-[32px] font-semibold text-black tracking-tight">Tocs</h1>
          </div>

          <button
            onClick={handleSignIn}
            className="w-full flex items-center justify-center gap-2 h-[52px] bg-black text-white rounded-lg font-medium text-[15px] hover:opacity-90 active:scale-[0.99] transition-all duration-100 cursor-pointer"
          >
            <Github size={18} />
            GitHub으로 시작하기
          </button>

          <div className="mt-8 text-center">
            <p className="text-[13px] text-gray-500 leading-[1.6]">
              계속 진행하면{" "}
              <Link href="/terms" className="text-gray-700 underline underline-offset-2 hover:text-black transition-colors cursor-pointer">이용약관</Link> 및{" "}
              <Link href="/privacy" className="text-gray-700 underline underline-offset-2 hover:text-black transition-colors cursor-pointer">개인정보처리방침</Link>에<br />
              동의하는 것으로 간주합니다.
            </p>
          </div>
        </div>
      </div>
    </SessionProvider>
  )
}