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
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
      <input
        type="text"
        placeholder={placeholder}
        className="input pl-10 w-64"
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
      />
    </div>
  );
}
