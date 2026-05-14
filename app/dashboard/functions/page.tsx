import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { listFunctions } from "../../actions/function";
import FunctionsClient from "@/components/functions/FunctionsClient";
import { GOOGLE_TOKEN_COOKIE } from "@/lib/gdrive/google-oauth";

export default async function FunctionsPage() {
  const cookieStore = await cookies();
  const tokensStr = cookieStore.get(GOOGLE_TOKEN_COOKIE)?.value;

  if (!tokensStr) {
    redirect("/dashboard");
  }

  const functions = await listFunctions();

  return <FunctionsClient initialFunctions={functions} />;
}
