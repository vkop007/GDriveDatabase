import Image from "next/image";
import { UserProfile as UserProfileType } from "../../app/actions/user";

interface UserProfileProps {
  user: UserProfileType | null;
}

export default function UserProfile({ user }: UserProfileProps) {
  if (!user) {
    return null;
  }

  return (
    <div className="bg-neutral-900/50 border border-neutral-800 rounded-xl p-6 backdrop-blur-sm">
      <div className="flex items-center gap-6">
        {/* Profile Picture */}
        <div className="relative group w-20 h-20 shrink-0">
          <Image
            src={user.picture}
            alt={user.name}
            fill
            className="rounded-full object-cover border border-gray-400"
          />
        </div>

        {/* User Info */}
        <div className="space-y-1">
          <h2 className="text-2xl font-bold text-white">{user.name}</h2>
          <p className="text-neutral-400 font-medium">{user.email}</p>
          <div className="flex items-center gap-2 mt-2">
            <span className="px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 text-xs font-medium border border-purple-500/20">
              Pro User
            </span>
            <span className="px-2 py-0.5 rounded-full bg-green-500/10 text-green-400 text-xs font-medium border border-green-500/20">
              Active
            </span>
          </div>
        </div>
        <div className="ml-auto">
          <form
            action={async () => {
              "use server";
              await import("../../app/actions/user").then((m) => m.logout());
            }}
          >
            <button
              type="submit"
              className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-lg text-sm font-medium transition-colors border border-red-500/20"
            >
              Sign Out
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
