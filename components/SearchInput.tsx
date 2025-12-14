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
    <div className="relative flex items-center">
      <Search className="absolute left-3 w-4 h-4 text-neutral-500 pointer-events-none" />
      <input
        type="text"
        placeholder={placeholder}
        className="input w-64"
        style={{ paddingLeft: "2.5rem" }}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
      />
    </div>
  );
}
