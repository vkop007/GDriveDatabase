"use client";

import { Search } from "lucide-react";

interface SearchInputProps {
  placeholder: string;
  value?: string;
  onChange?: (value: string) => void;
}

export default function SearchInput({
  placeholder,
  value,
  onChange,
}: SearchInputProps) {
  return (
    <div className="relative flex items-center w-full md:w-auto">
      <Search className="absolute left-3 h-4 w-4 text-slate-400 dark:text-neutral-500" />
      <input
        type="text"
        placeholder={placeholder}
        className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-10 pr-3 text-sm text-slate-950 shadow-sm placeholder:text-slate-400 transition-all focus:border-primary/60 focus:outline-none focus:ring-2 focus:ring-primary/15 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white dark:placeholder:text-neutral-500 md:w-64"
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
      />
    </div>
  );
}
