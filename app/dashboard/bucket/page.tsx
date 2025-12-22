import { listBucketFiles } from "../../actions/bucket";
import FileManager from "../../../components/bucket/FileManager";

export const dynamic = "force-dynamic";

export default async function BucketPage() {
  const files = await listBucketFiles();

  return (
    <div className="p-4 md:p-8 max-w-full mx-auto min-h-screen text-white">
      <FileManager initialFiles={files} />
    </div>
  );
}
