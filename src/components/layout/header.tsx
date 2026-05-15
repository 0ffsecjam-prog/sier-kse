import { UserMenu } from "./user-menu";

interface Props {
  user: { name: string; email: string; role: "ADMIN" | "VIEWER" };
}

export function Header({ user }: Props) {
  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b bg-card px-6">
      <div className="md:hidden">
        <span className="font-semibold tracking-tight">sier-kse</span>
      </div>
      <div className="ml-auto">
        <UserMenu name={user.name} email={user.email} role={user.role} />
      </div>
    </header>
  );
}
