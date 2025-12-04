import Image from "next/image";
import { UserProfile as UserProfileType } from "../../actions/user";

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
        <div className="relative group w-20 h-20">
          <div className="absolute -inset-0.5 bg-linear-to-r from-purple-500 to-blue-500 rounded-full opacity-75 group-hover:opacity-100 transition duration-200 blur-sm"></div>
          <Image
            src={user.picture}
            alt={user.name}
            fill
            className="rounded-full object-cover border-2 border-neutral-900"
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
      </div>
    </div>
  );
}
