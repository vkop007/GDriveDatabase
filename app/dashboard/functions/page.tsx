import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { listFunctions } from "../../actions/function";
import FunctionsClient from "@/components/functions/FunctionsClient";

export default async function FunctionsPage() {
  const cookieStore = await cookies();
  const tokensStr = cookieStore.get("gdrive_tokens")?.value;

  if (!tokensStr) {
    redirect("/");
  }

  const functions = await listFunctions();

  return <FunctionsClient initialFunctions={functions} />;
}
