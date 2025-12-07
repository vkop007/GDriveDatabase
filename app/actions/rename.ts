"use server";

import { revalidateTag } from "next/cache";
import { renameFile } from "../../lib/gdrive/operations";
import { getAuth } from "../../lib/gdrive/auth";

export async function renameItem(
  fileId: string,
  newName: string,
  type: "database" | "collection",
  parentId?: string
) {
  if (!fileId || !newName) {
    return { success: false, error: "Missing required parameters" };
  }

  // Ensure authenticated
  await getAuth();

  try {
    await renameFile(fileId, newName);

    // Revalidate relevant caches
    if (type === "database") {
      revalidateTag("databases", { expire: 0 });
      revalidateTag("database-tree", { expire: 0 });
    } else if (type === "collection" && parentId) {
      revalidateTag(`collections-${parentId}`, { expire: 0 });
      revalidateTag("database-tree", { expire: 0 });
    }

    return { success: true };
  } catch (error) {
    console.error("Error renaming item:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
