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
      <Search className="absolute left-3 w-4 h-4 text-neutral-500" />
      <input
        type="text"
        placeholder={placeholder}
        className="w-full md:w-64 py-2 pl-10 pr-3 text-sm bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder:text-neutral-500 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
      />
    </div>
  );
}
