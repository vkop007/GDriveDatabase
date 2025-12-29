import { authenticateWithGoogle } from "./actions";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import LoginClient from "@/components/LoginClient";

export default async function Home() {
  const cookieStore = await cookies();
  const token = cookieStore.get("gdrive_tokens")?.value;

  if (token) {
    redirect("/dashboard");
  }

  return <LoginClient onSubmit={authenticateWithGoogle} />;
}
