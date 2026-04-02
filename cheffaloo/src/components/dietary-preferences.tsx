"use client";

import { useState, useEffect, useTransition } from "react";
import { X, Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  getDietaryPreferences,
  addDietaryPreference,
  removeDietaryPreference,
} from "@/actions";
import type { DietaryPreference } from "@/lib/types";

const ALLERGY_CHIPS = ["Dairy", "Gluten", "Nuts", "Shellfish", "Soy", "Eggs"];
const PREFERENCE_CHIPS = [
  "Vegetarian",
  "Vegan",
  "Low-carb",
  "Keto",
  "Halal",
  "Kosher",
];

export function DietaryPreferences() {
  const [preferences, setPreferences] = useState<DietaryPreference[]>([]);
  const [allergyInput, setAllergyInput] = useState("");
  const [preferenceInput, setPreferenceInput] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    getDietaryPreferences().then((result) => {
      if (!("error" in result)) {
        setPreferences(result);
      }
      setIsLoading(false);
    });
  }, []);

  function allergies() {
    return preferences.filter((p) => p.type === "allergy");
  }

  function prefs() {
    return preferences.filter((p) => p.type === "preference");
  }

  function handleAdd(value: string, type: "allergy" | "preference") {
    const trimmed = value.trim();
    if (!trimmed) return;
    const alreadyExists = preferences.some(
      (p) => p.preference.toLowerCase() === trimmed.toLowerCase() && p.type === type
    );
    if (alreadyExists) {
      toast.info(`"${trimmed}" is already in your list.`);
      return;
    }

    startTransition(async () => {
      const result = await addDietaryPreference(trimmed, type);
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      setPreferences((prev) => [...prev, result]);
      toast.success(`Added "${trimmed}"`);
      if (type === "allergy") setAllergyInput("");
      else setPreferenceInput("");
    });
  }

  function handleRemove(id: string, label: string) {
    startTransition(async () => {
      const result = await removeDietaryPreference(id);
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      setPreferences((prev) => prev.filter((p) => p.id !== id));
      toast.success(`Removed "${label}"`);
    });
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-5 h-5 animate-spin text-[#8A8A8A]" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Allergies section */}
      <section>
        <h2 className="text-base font-semibold text-[#2D2D2D] mb-1">Allergies</h2>
        <p className="text-xs text-[#8A8A8A] mb-4">
          Ingredients you are allergic to will be excluded from AI-generated recipes.
        </p>

        {/* Current allergy pills */}
        {allergies().length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {allergies().map((p) => (
              <span
                key={p.id}
                className="inline-flex items-center gap-1.5 rounded-full bg-[#F0EDE8] text-[#5A5A5A] px-3 py-1 text-sm"
              >
                {p.preference}
                <button
                  onClick={() => handleRemove(p.id, p.preference)}
                  disabled={isPending}
                  className="ml-0.5 text-[#8A8A8A] hover:text-[#2D2D2D] transition-colors disabled:opacity-50"
                  aria-label={`Remove ${p.preference}`}
                >
                  <X size={13} strokeWidth={2} />
                </button>
              </span>
            ))}
          </div>
        )}

        {/* Quick-add chips */}
        <div className="flex flex-wrap gap-2 mb-3">
          {ALLERGY_CHIPS.filter(
            (chip) =>
              !preferences.some(
                (p) =>
                  p.preference.toLowerCase() === chip.toLowerCase() &&
                  p.type === "allergy"
              )
          ).map((chip) => (
            <button
              key={chip}
              onClick={() => handleAdd(chip, "allergy")}
              disabled={isPending}
              className="inline-flex items-center gap-1 border border-[#E8E4DF] rounded-full px-3 py-1 text-sm text-[#5A5A5A] hover:bg-[#F5F3EF] transition-colors disabled:opacity-50"
            >
              <Plus size={12} strokeWidth={2} />
              {chip}
            </button>
          ))}
        </div>

        {/* Custom allergy input */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleAdd(allergyInput, "allergy");
          }}
          className="flex gap-2"
        >
          <input
            type="text"
            value={allergyInput}
            onChange={(e) => setAllergyInput(e.target.value)}
            placeholder="Add a custom allergy…"
            disabled={isPending}
            className="flex-1 h-9 bg-white border border-[#E8E4DF] rounded-xl px-3 text-sm text-[#2D2D2D] placeholder:text-[#B0AAA0] focus:outline-none focus:ring-2 focus:ring-[#7C9082]/30 focus:border-[#7C9082] transition-colors disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={isPending || !allergyInput.trim()}
            className="h-9 bg-[#7C9082] text-white rounded-xl px-4 text-sm font-medium hover:bg-[#6a7d70] transition-colors disabled:opacity-50"
          >
            Add
          </button>
        </form>
      </section>

      {/* Divider */}
      <div className="border-t border-[#F0EDE8]" />

      {/* Dietary Preferences section */}
      <section>
        <h2 className="text-base font-semibold text-[#2D2D2D] mb-1">
          Dietary Preferences
        </h2>
        <p className="text-xs text-[#8A8A8A] mb-4">
          AI-generated recipes will be tailored to match your dietary lifestyle.
        </p>

        {/* Current preference pills */}
        {prefs().length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {prefs().map((p) => (
              <span
                key={p.id}
                className="inline-flex items-center gap-1.5 rounded-full bg-[#F0EDE8] text-[#5A5A5A] px-3 py-1 text-sm"
              >
                {p.preference}
                <button
                  onClick={() => handleRemove(p.id, p.preference)}
                  disabled={isPending}
                  className="ml-0.5 text-[#8A8A8A] hover:text-[#2D2D2D] transition-colors disabled:opacity-50"
                  aria-label={`Remove ${p.preference}`}
                >
                  <X size={13} strokeWidth={2} />
                </button>
              </span>
            ))}
          </div>
        )}

        {/* Quick-add chips */}
        <div className="flex flex-wrap gap-2 mb-3">
          {PREFERENCE_CHIPS.filter(
            (chip) =>
              !preferences.some(
                (p) =>
                  p.preference.toLowerCase() === chip.toLowerCase() &&
                  p.type === "preference"
              )
          ).map((chip) => (
            <button
              key={chip}
              onClick={() => handleAdd(chip, "preference")}
              disabled={isPending}
              className="inline-flex items-center gap-1 border border-[#E8E4DF] rounded-full px-3 py-1 text-sm text-[#5A5A5A] hover:bg-[#F5F3EF] transition-colors disabled:opacity-50"
            >
              <Plus size={12} strokeWidth={2} />
              {chip}
            </button>
          ))}
        </div>

        {/* Custom preference input */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleAdd(preferenceInput, "preference");
          }}
          className="flex gap-2"
        >
          <input
            type="text"
            value={preferenceInput}
            onChange={(e) => setPreferenceInput(e.target.value)}
            placeholder="Add a custom preference…"
            disabled={isPending}
            className="flex-1 h-9 bg-white border border-[#E8E4DF] rounded-xl px-3 text-sm text-[#2D2D2D] placeholder:text-[#B0AAA0] focus:outline-none focus:ring-2 focus:ring-[#7C9082]/30 focus:border-[#7C9082] transition-colors disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={isPending || !preferenceInput.trim()}
            className="h-9 bg-[#7C9082] text-white rounded-xl px-4 text-sm font-medium hover:bg-[#6a7d70] transition-colors disabled:opacity-50"
          >
            Add
          </button>
        </form>
      </section>
    </div>
  );
}
