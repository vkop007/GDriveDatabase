"use client";

import { useState } from "react";
import { updateTableSchema } from "../app/actions/table";
import { Plus, Key, Type } from "lucide-react";
import GradientButton from "./GradientButton";

interface AddColumnFormProps {
  fileId: string;
  databaseId: string;
  availableTables: { id: string; name: string }[];
}

export default function AddColumnForm({
  fileId,
  databaseId,
  availableTables,
}: AddColumnFormProps) {
  const [selectedType, setSelectedType] = useState<string>("string");

  return (
    <form
      action={updateTableSchema}
      className="grid grid-cols-1 md:grid-cols-6 gap-4 items-end"
    >
      <input type="hidden" name="fileId" value={fileId} />
      <input type="hidden" name="databaseId" value={databaseId} />

      <div className="md:col-span-2 space-y-2">
        <label className="text-xs font-medium text-neutral-400 flex items-center gap-1.5">
          <Key className="w-3 h-3" />
          Key
        </label>
        <input
          type="text"
          name="key"
          placeholder="e.g. email"
          className="w-full bg-neutral-950/50 border border-neutral-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-neutral-500 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
          required
        />
      </div>

      <div className="md:col-span-1 space-y-2">
        <label className="text-xs font-medium text-neutral-400 flex items-center gap-1.5">
          <Type className="w-3 h-3" />
          Type
        </label>
        <select
          name="type"
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value)}
          className="w-full bg-neutral-950/50 border border-neutral-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all appearance-none cursor-pointer"
        >
          <option value="string">String</option>
          <option value="integer">Integer</option>
          <option value="boolean">Boolean</option>
          <option value="datetime">Datetime</option>
          <option value="relation">Relation</option>
        </select>
      </div>

      {selectedType === "relation" ? (
        <div className="md:col-span-1 space-y-2">
          <label className="text-xs font-medium text-neutral-400 flex items-center gap-1.5">
            <Type className="w-3 h-3" />
            Relation
          </label>
          <select
            name="relationTableId"
            className="w-full bg-neutral-950/50 border border-neutral-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all appearance-none cursor-pointer"
            required
          >
            <option value="">Select Table</option>
            {availableTables.map((table) => (
              <option key={table.id} value={table.id}>
                {table.name}
              </option>
            ))}
          </select>
        </div>
      ) : (
        <div className="flex flex-col justify-end md:col-span-1">
          <div className="h-5 mb-2" />
          <div className="h-[42px] flex items-center">
            <label className="flex items-center gap-3 cursor-pointer group">
              <div className="relative">
                <input
                  type="checkbox"
                  name="array"
                  id="array"
                  className="sr-only peer"
                />
                <div className="w-12 h-7 bg-neutral-800 rounded-full peer-checked:bg-linear-to-r peer-checked:from-primary-from peer-checked:to-primary-to transition-all border border-neutral-700 peer-checked:border-primary/50 shadow-inner" />
                <div className="absolute left-1 top-1 w-5 h-5 bg-neutral-400 rounded-full transition-all peer-checked:translate-x-5 peer-checked:bg-white shadow-sm" />
              </div>
              <span className="text-sm text-neutral-400 group-hover:text-white transition-colors">
                Array
              </span>
            </label>
          </div>
        </div>
      )}

      <div className="flex flex-col justify-end md:col-span-1">
        <div className="h-5 mb-2" />
        <div className="h-[42px] flex items-center">
          <label className="flex items-center gap-3 cursor-pointer group">
            <div className="relative">
              <input
                type="checkbox"
                name="required"
                id="required"
                className="sr-only peer"
              />
              <div className="w-12 h-7 bg-neutral-800 rounded-full peer-checked:bg-linear-to-r peer-checked:from-primary-from peer-checked:to-primary-to transition-all border border-neutral-700 peer-checked:border-primary/50 shadow-inner" />
              <div className="absolute left-1 top-1 w-5 h-5 bg-neutral-400 rounded-full transition-all peer-checked:translate-x-5 peer-checked:bg-white shadow-sm" />
            </div>
            <span className="text-sm text-neutral-400 group-hover:text-white transition-colors">
              Required
            </span>
          </label>
        </div>
      </div>

      <div className="flex flex-col justify-end md:col-span-1">
        <div className="h-5 mb-2" />
        <div className="h-[42px] flex items-center">
          <GradientButton type="submit" icon={<Plus className="w-4 h-4" />}>
            Add
          </GradientButton>
        </div>
      </div>
    </form>
  );
}
