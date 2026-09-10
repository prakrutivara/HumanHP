import { signOut } from "@/app/auth/actions";
import { Button } from "@/components/ui/button";

export function LogoutButton() {
  return (
    <form action={signOut}>
      <Button type="submit" variant="ghost" className="h-8 px-2 text-xs">
        Log out
      </Button>
    </form>
  );
}
