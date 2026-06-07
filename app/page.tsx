import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { codeToHtml } from "shiki";
import LoginClient from "@/components/LoginClient";
import { APP_SESSION_COOKIE } from "@/lib/gdrive/google-oauth";
import { parseAppSessionCookie } from "@/lib/auth/app-session";

const landingSdkExample = `import { GDatabase } from "gdatabase";

const db = new GDatabase(apiKey, appUrl);

await db.database("crm").table("customers").create({
  name: "Ada Lovelace",
  status: "active",
  owner: "drive://team/crm",
});

const rows = await db
  .database("crm")
  .table("customers")
  .where("status", "==", "active")
  .list();`;

export default async function Home() {
  const cookieStore = await cookies();
  const session = parseAppSessionCookie(cookieStore.get(APP_SESSION_COOKIE)?.value);

  if (session) {
    redirect("/dashboard");
  }

  const sdkCodeHtml = await codeToHtml(landingSdkExample, {
    lang: "ts",
    theme: "vesper",
  });

  return <LoginClient sdkCodeHtml={sdkCodeHtml} />;
}
