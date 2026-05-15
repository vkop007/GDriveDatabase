import { redirect } from "next/navigation";
import { listFunctions } from "../../actions/function";
import FunctionsClient from "@/components/functions/FunctionsClient";
import { hasCurrentDriveConnection } from "@/lib/gdrive/drive-connection-store";

export default async function FunctionsPage() {
  if (!(await hasCurrentDriveConnection())) {
    redirect("/dashboard");
  }

  const functions = await listFunctions();

  return <FunctionsClient initialFunctions={functions} />;
}
