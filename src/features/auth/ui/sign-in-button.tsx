import { signIn } from "@/shared/lib/auth"
import { Button } from "@/shared/ui"

export function SignInButton() {
  return (
    <form
      action={async () => {
        "use server"
        await signIn("github", { redirectTo: "/" })
      }}
    >
      <Button type="submit">
        Sign in with GitHub
      </Button>
    </form>
  )
}