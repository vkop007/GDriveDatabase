import { listBucketFiles } from "../../actions/bucket";
import FileManager from "../../../components/bucket/FileManager";

export const dynamic = "force-dynamic";

export default async function BucketPage() {
  const files = await listBucketFiles();

  return (
    <div className="max-w-full mx-auto min-h-screen px-4 pb-4 pt-20 text-slate-950 md:p-8 md:pt-8 dark:text-white">
      <FileManager initialFiles={files} />
    </div>
  );
}
