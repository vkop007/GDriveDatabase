import Image from "next/image";
import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { signInWithEmail, signUpWithEmail } from "../actions";
import { EmailPasswordForm } from "@/components/AuthForm";
import { parseAppSessionCookie } from "@/lib/auth/app-session";
import { APP_SESSION_COOKIE } from "@/lib/gdrive/google-oauth";
import { isTursoConfigured } from "@/lib/storage/turso";

export default async function SignInPage() {
  const cookieStore = await cookies();
  const session = parseAppSessionCookie(cookieStore.get(APP_SESSION_COOKIE)?.value);

  if (session) {
    redirect("/dashboard");
  }

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#f8fafc_0%,#fdf2f8_36%,#ecfdf5_72%,#f8fafc_100%)] px-5 py-8 text-slate-950 dark:bg-[linear-gradient(180deg,#07080d_0%,#120c16_42%,#07110f_78%,#05060a_100%)] dark:text-white">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-md flex-col justify-center">
        <Link
          href="/"
          className="mb-8 inline-flex w-fit items-center gap-2 text-sm font-semibold text-slate-600 transition hover:text-slate-950 dark:text-white/60 dark:hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to home
        </Link>

        <div className="mb-6 flex items-center gap-3">
          <Image
            src="/logo.png"
            alt="GDrive Database"
            width={44}
            height={44}
            className="h-11 w-11 rounded-lg"
            priority
          />
          <div>
            <h1 className="text-xl font-semibold leading-6">GDrive Database</h1>
            <p className="text-sm text-slate-500 dark:text-white/48">
              Sign in with email and password.
            </p>
          </div>
        </div>

        <EmailPasswordForm
          loginAction={signInWithEmail}
          signupAction={signUpWithEmail}
          isEmailAuthConfigured={isTursoConfigured()}
        />
      </div>
    </main>
  );
}
