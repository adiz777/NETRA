import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const session = cookieStore.get("netra_session")?.value;

  if (session !== "authenticated") {
    redirect("/login");
  }

  return <>{children}</>;
}