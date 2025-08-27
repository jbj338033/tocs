import { signOut } from "@/shared/lib/auth"
import { Button } from "@/shared/ui"

export function SignOutButton() {
  return (
    <form
      action={async () => {
        "use server"
        await signOut({ redirectTo: "/" })
      }}
    >
      <Button variant="ghost" type="submit">
        Sign out
      </Button>
    </form>
  )
}