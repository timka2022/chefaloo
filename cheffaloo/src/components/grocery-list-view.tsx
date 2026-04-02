"use client";

import { useState, useCallback } from "react";
import { toast } from "sonner";
import {
  Share2,
  Download,
  ShoppingCart,
  Leaf,
  Milk,
  Beef,
  Package,
  Snowflake,
  Flame,
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import type { GroceryList, GroceryItem } from "@/lib/types";

// ---------------------------------------------------------------------------
// Category config
// ---------------------------------------------------------------------------

interface CategoryConfig {
  color: string;
  bgColor: string;
  Icon: React.ComponentType<{ className?: string }>;
}

const CATEGORY_CONFIG: Record<string, CategoryConfig> = {
  produce: { color: "#22C55E", bgColor: "#F0FDF4", Icon: Leaf },
  dairy: { color: "#3B82F6", bgColor: "#EFF6FF", Icon: Milk },
  meat: { color: "#EF4444", bgColor: "#FEF2F2", Icon: Beef },
  pantry: { color: "#F59E0B", bgColor: "#FFFBEB", Icon: Package },
  frozen: { color: "#06B6D4", bgColor: "#ECFEFF", Icon: Snowflake },
  spices: { color: "#F97316", bgColor: "#FFF7ED", Icon: Flame },
};

const DEFAULT_CONFIG: CategoryConfig = {
  color: "#8A8A8A",
  bgColor: "#F5F3EF",
  Icon: ShoppingCart,
};

function getCategoryConfig(category: string): CategoryConfig {
  const key = category.toLowerCase();
  return CATEGORY_CONFIG[key] ?? DEFAULT_CONFIG;
}

function capitalise(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function formatItemLabel(item: GroceryItem): string {
  const qty = item.quantity > 0 ? item.quantity : null;
  const unit = item.unit?.trim() || null;

  const qtyStr = qty !== null ? (unit ? `${qty} ${unit}` : String(qty)) : null;

  const name = capitalise(item.ingredient_name);
  return qtyStr ? `${name} (${qtyStr})` : name;
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface GroceryListViewProps {
  groceryList: GroceryList;
  recipeCount: number;
  weekLabel: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function GroceryListView({
  groceryList,
  recipeCount,
  weekLabel,
}: GroceryListViewProps) {
  // Flatten all items to count totals and track checked state
  const allItems: { category: string; item: GroceryItem; key: string }[] =
    Object.entries(groceryList).flatMap(([cat, items]) =>
      items.map((item, idx) => ({
        category: cat,
        item,
        key: `${cat}__${item.ingredient_name}__${item.unit}__${idx}`,
      }))
    );

  const [checked, setChecked] = useState<Set<string>>(() => new Set());

  const totalItems = allItems.length;
  const checkedCount = checked.size;
  const progressPct = totalItems > 0 ? (checkedCount / totalItems) * 100 : 0;

  const toggleItem = useCallback((key: string) => {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }, []);

  // ---------------------------------------------------------------------------
  // Share / Export helpers
  // ---------------------------------------------------------------------------

  function buildTextList(): string {
    const lines: string[] = [`${weekLabel} — Grocery List`, ""];
    for (const [cat, items] of Object.entries(groceryList)) {
      lines.push(`## ${capitalise(cat)}`);
      for (const item of items) {
        lines.push(`  - ${formatItemLabel(item)}`);
      }
      lines.push("");
    }
    return lines.join("\n");
  }

  function handleShare() {
    const text = buildTextList();
    navigator.clipboard
      .writeText(text)
      .then(() => toast.success("List copied to clipboard!"))
      .catch(() => toast.error("Could not copy to clipboard"));
  }

  function handleExport() {
    const text = buildTextList();
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "grocery-list.txt";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Grocery list exported!");
  }

  const categories = Object.entries(groceryList);

  return (
    <div className="px-6 lg:px-10 py-8 max-w-5xl mx-auto">
      {/* Header row */}
      <div className="flex items-start justify-between gap-4 mb-1">
        <div>
          <h1 className="text-2xl font-semibold text-[#2D2D2D]">Grocery List</h1>
          <p className="text-sm text-[#8A8A8A] mt-1 flex items-center gap-1.5 flex-wrap">
            <span>{weekLabel}</span>
            <span className="text-[#D1CCC5]">·</span>
            <span>{recipeCount} {recipeCount === 1 ? "recipe" : "recipes"}</span>
            <span className="text-[#D1CCC5]">·</span>
            <span>{totalItems} items</span>
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleShare}
            className="flex items-center gap-1.5 border border-[#E8E4DF] rounded-full px-4 py-2 text-sm text-[#5A5A5A] hover:bg-[#F5F3EF] transition-colors"
          >
            <Share2 className="w-3.5 h-3.5" />
            Share List
          </button>
          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 bg-[#7C9082] text-white rounded-full px-4 py-2 text-sm font-medium hover:bg-[#6a7d70] transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            Export
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mt-5 mb-8">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs text-[#8A8A8A]">
            {checkedCount} of {totalItems} items checked
          </span>
          <span className="text-xs text-[#8A8A8A]">{Math.round(progressPct)}%</span>
        </div>
        <div className="h-1.5 rounded-full bg-[#F0EDE8] overflow-hidden">
          <div
            className="h-full rounded-full bg-[#7C9082] transition-all duration-300"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {/* Category grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {categories.map(([category, items]) => {
          const cfg = getCategoryConfig(category);
          const Icon = cfg.Icon;
          const categoryKeys = allItems
            .filter((a) => a.category === category)
            .map((a) => a.key);
          const categoryChecked = categoryKeys.filter((k) => checked.has(k)).length;

          return (
            <div
              key={category}
              className="bg-white rounded-2xl border border-[#E8E4DF] p-5"
            >
              {/* Category header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                    style={{ backgroundColor: cfg.bgColor }}
                  >
                    <span style={{ color: cfg.color }}>
                      <Icon className="w-4 h-4" />
                    </span>
                  </div>
                  <span className="font-medium text-[#2D2D2D] text-sm">
                    {capitalise(category)}
                  </span>
                </div>
                <span className="text-xs text-[#8A8A8A]">
                  {categoryChecked}/{items.length}
                </span>
              </div>

              {/* Items */}
              <ul className="space-y-2.5">
                {items.map((item, idx) => {
                  const key = `${category}__${item.ingredient_name}__${item.unit}__${idx}`;
                  const isChecked = checked.has(key);
                  const label = formatItemLabel(item);

                  return (
                    <li
                      key={key}
                      className="flex items-center gap-3 cursor-pointer group"
                    >
                      <Checkbox
                        checked={isChecked}
                        onCheckedChange={() => toggleItem(key)}
                        className="shrink-0 rounded-[4px] data-checked:bg-[#7C9082] data-checked:border-[#7C9082]"
                      />
                      <span
                        onClick={() => toggleItem(key)}
                        className={`text-sm transition-colors select-none ${
                          isChecked
                            ? "line-through text-[#B0AAA0]"
                            : "text-[#2D2D2D]"
                        }`}
                      >
                        {label}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}
