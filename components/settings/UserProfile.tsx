import Image from "next/image";
import { UserProfile as UserProfileType } from "../../app/actions/user";
import { User, LogOut } from "lucide-react";

interface UserProfileProps {
  user: UserProfileType | null;
}

export default function UserProfile({ user }: UserProfileProps) {
  if (!user) {
    return null;
  }

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-neutral-900 via-neutral-900 to-neutral-800 border border-neutral-800 p-6">
      {/* Glow effect */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-primary/5 rounded-full blur-3xl pointer-events-none" />

      <div className="relative flex flex-col md:flex-row md:items-center gap-6">
        {/* Profile Picture */}
        <div className="relative group w-20 h-20 shrink-0">
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary to-primary/50 blur-sm opacity-50 group-hover:opacity-75 transition-opacity" />
          <Image
            src={user.picture}
            alt={user.name}
            fill
            className="relative rounded-full object-cover border-2 border-neutral-700 group-hover:border-primary/50 transition-colors"
          />
        </div>

        {/* User Info */}
        <div className="space-y-2 flex-1">
          <h2 className="text-2xl font-bold text-white">{user.name}</h2>
          <p className="text-neutral-400">{user.email}</p>
          <div className="flex items-center gap-2 mt-3">
            <span className="px-3 py-1 rounded-full bg-gradient-to-r from-primary/20 to-primary/10 text-primary text-xs font-medium border border-primary/20">
              Pro User
            </span>
            <span className="px-3 py-1 rounded-full bg-green-500/10 text-green-400 text-xs font-medium border border-green-500/20 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              Active
            </span>
          </div>
        </div>

        {/* Sign Out Button */}
        <div className="md:ml-auto">
          <form
            action={async () => {
              "use server";
              await import("../../app/actions/user").then((m) => m.logout());
            }}
          >
            <button
              type="submit"
              className="flex items-center gap-2 px-4 py-2.5 bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white rounded-xl text-sm font-medium transition-all border border-red-500/20 hover:border-red-500"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
