import { Plus, Save, Trash2 } from "lucide-react";
import { useState } from "react";

import type { Category } from "../types";

interface CategoryManagerProps {
  categories: Category[];
  onCreate: (payload: Pick<Category, "name" | "color">) => Promise<void>;
  onUpdate: (id: number, payload: Partial<Pick<Category, "name" | "color" | "is_active">>) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
}

export function CategoryManager({ categories, onCreate, onUpdate, onDelete }: CategoryManagerProps) {
  const [newCategory, setNewCategory] = useState({ name: "", color: "#2563eb" });
  const [drafts, setDrafts] = useState<Record<number, Pick<Category, "name" | "color">>>({});

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <h2 className="text-base font-semibold text-slate-950">카테고리</h2>
      <div className="mt-4 grid gap-2">
        {categories.map((category) => {
          const draft = drafts[category.id] ?? { name: category.name, color: category.color };
          return (
            <div className="grid grid-cols-[2.75rem_1fr_auto_auto] items-center gap-2" key={category.id}>
              <input
                aria-label="카테고리 색상"
                className="h-10 w-11 rounded-lg border border-slate-200 bg-white p-1"
                type="color"
                value={draft.color}
                onChange={(event) =>
                  setDrafts((prev) => ({
                    ...prev,
                    [category.id]: { ...draft, color: event.target.value },
                  }))
                }
              />
              <input
                aria-label="카테고리명"
                className="min-w-0 rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-500"
                value={draft.name}
                onChange={(event) =>
                  setDrafts((prev) => ({
                    ...prev,
                    [category.id]: { ...draft, name: event.target.value },
                  }))
                }
              />
              <button
                aria-label="카테고리 저장"
                className="rounded-lg border border-slate-200 p-2 text-slate-700 hover:bg-slate-50"
                type="button"
                onClick={() => onUpdate(category.id, draft)}
              >
                <Save aria-hidden className="h-4 w-4" />
              </button>
              <button
                aria-label="카테고리 삭제"
                className="rounded-lg border border-rose-200 p-2 text-rose-600 hover:bg-rose-50"
                type="button"
                onClick={() => onDelete(category.id)}
              >
                <Trash2 aria-hidden className="h-4 w-4" />
              </button>
            </div>
          );
        })}
      </div>
      <div className="mt-3 grid grid-cols-[2.75rem_1fr_auto] items-center gap-2 rounded-lg border border-dashed border-slate-300 p-3">
        <input
          aria-label="새 카테고리 색상"
          className="h-10 w-11 rounded-lg border border-slate-200 bg-white p-1"
          type="color"
          value={newCategory.color}
          onChange={(event) => setNewCategory((prev) => ({ ...prev, color: event.target.value }))}
        />
        <input
          aria-label="새 카테고리명"
          className="min-w-0 rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-500"
          placeholder="새 카테고리"
          value={newCategory.name}
          onChange={(event) => setNewCategory((prev) => ({ ...prev, name: event.target.value }))}
        />
        <button
          aria-label="카테고리 추가"
          className="rounded-lg bg-slate-950 p-2 text-white hover:bg-slate-800"
          type="button"
          onClick={async () => {
            if (!newCategory.name.trim()) return;
            await onCreate(newCategory);
            setNewCategory({ name: "", color: "#2563eb" });
          }}
        >
          <Plus aria-hidden className="h-5 w-5" />
        </button>
      </div>
    </section>
  );
}
