import { SignInButton, SignOutButton } from "@/features/auth/ui"

import { auth } from "@/shared/lib/auth"

export async function Header() {
  const session = await auth()

  return (
    <header className="border-b border-secondary">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold">TOCS</h1>
        
        <nav className="flex items-center gap-4">
          {session ? (
            <div className="flex items-center gap-4">
              <span>Welcome, {session.user?.name}</span>
              <SignOutButton />
            </div>
          ) : (
            <SignInButton />
          )}
        </nav>
      </div>
    </header>
  )
}