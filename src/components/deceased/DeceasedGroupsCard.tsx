"use client";

import { useState } from "react";
import { addDeceasedToGroup, removeDeceasedFromGroup } from "@/lib/groups/actions";

interface GroupItem {
  id: string;
  name: string;
  linked: boolean;   // is the deceased already in this group?
  isPrimary: boolean; // is this the deceased's primary group?
}

interface Props {
  deceasedId: string;
  groups: GroupItem[];
}

export function DeceasedGroupsCard({ deceasedId, groups: initialGroups }: Props) {
  const [groups, setGroups] = useState(initialGroups);
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function toggle(group: GroupItem) {
    if (group.isPrimary) return; // cannot unlink primary group
    setLoading(group.id);
    setError(null);

    if (group.linked) {
      const result = await removeDeceasedFromGroup(deceasedId, group.id);
      if (result?.error) { setError(result.error); } else {
        setGroups(gs => gs.map(g => g.id === group.id ? { ...g, linked: false } : g));
      }
    } else {
      const result = await addDeceasedToGroup(deceasedId, group.id);
      if (result?.error) { setError(result.error); } else {
        setGroups(gs => gs.map(g => g.id === group.id ? { ...g, linked: true } : g));
      }
    }
    setLoading(null);
  }

  if (groups.length <= 1) return null; // only one group — nothing to manage

  return (
    <div
      className="p-4 mb-4 rounded-2xl"
      style={{
        background: "linear-gradient(135deg, #eff6ff, #dbeafe)",
        border: "1px solid #3b82f650",
      }}
    >
      <h3 className="font-bold text-sm mb-3" style={{ color: "#1d4ed8" }}>
        שיוך לקבוצות
      </h3>
      <div className="space-y-2">
        {groups.map((group) => {
          const isLoading = loading === group.id;
          return (
            <div key={group.id} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ background: group.linked ? "#3b82f6" : "var(--border)" }}
                />
                <span className="text-sm font-medium" style={{ color: "var(--foreground)" }}>
                  {group.name}
                </span>
                {group.isPrimary && (
                  <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ background: "#dbeafe", color: "#1d4ed8", fontSize: "0.6rem" }}>
                    ראשי
                  </span>
                )}
              </div>
              {!group.isPrimary && (
                <button
                  type="button"
                  onClick={() => toggle(group)}
                  disabled={isLoading}
                  className="text-xs font-semibold px-3 py-1 rounded-lg transition-all"
                  style={
                    group.linked
                      ? { background: "#fee2e2", color: "#dc2626", border: "1px solid #fca5a540" }
                      : { background: "#dbeafe", color: "#1d4ed8", border: "1px solid #3b82f640" }
                  }
                >
                  {isLoading ? "..." : group.linked ? "הסר" : "הוסף"}
                </button>
              )}
            </div>
          );
        })}
      </div>
      {error && <p className="text-xs text-red-600 mt-2">{error}</p>}
    </div>
  );
}
