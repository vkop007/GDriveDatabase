import { authenticateWithGoogle } from "./actions";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import LoginClient from "@/components/LoginClient";
import {
  APP_SESSION_COOKIE,
  isGoogleOAuthConfigured,
} from "@/lib/gdrive/google-oauth";

export default async function Home() {
  const cookieStore = await cookies();
  const session = cookieStore.get(APP_SESSION_COOKIE)?.value;

  if (session) {
    redirect("/dashboard");
  }

  return (
    <LoginClient
      onSubmit={authenticateWithGoogle}
      isGoogleLoginConfigured={isGoogleOAuthConfigured()}
    />
  );
}
