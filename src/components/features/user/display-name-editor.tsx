"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface DisplayNameEditorProps {
  currentName: string;
  onSave: (name: string) => Promise<void>;
  onCancel: () => void;
}

export function DisplayNameEditor({
  currentName,
  onSave,
  onCancel,
}: DisplayNameEditorProps) {
  const [name, setName] = useState(currentName);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(name.trim());
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="absolute top-full right-0 mt-2 p-4 bg-white rounded-[var(--radius-bae)] shadow-bae-lg border border-bae-200 z-50 min-w-[250px]">
      <div className="space-y-3">
        <label className="block text-sm font-medium text-bae-700">
          What should I call you?
        </label>
        <Input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter your name"
          maxLength={50}
          autoFocus
        />
        <div className="flex gap-2">
          <Button
            size="sm"
            onClick={handleSave}
            disabled={isSaving}
            className="flex-1"
          >
            {isSaving ? "Saving..." : "Save"}
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={onCancel}
            disabled={isSaving}
            className="flex-1"
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}
