"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { submitReview } from "@/actions";
import type { Recipe } from "@/lib/types";

interface RateRecipeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recipe: Recipe;
}

export function RateRecipeDialog({
  open,
  onOpenChange,
  recipe,
}: RateRecipeDialogProps) {
  const [rating, setRating] = useState(recipe.review?.rating ?? 0);
  const [hovered, setHovered] = useState(0);
  const [notes, setNotes] = useState(recipe.review?.notes ?? "");
  const [wouldMakeAgain, setWouldMakeAgain] = useState(
    recipe.review?.would_make_again ?? false
  );
  const [saving, setSaving] = useState(false);

  const displayRating = hovered || rating;

  // Format today's date as "Cooked on Weekday, Month Day"
  const today = new Date();
  const cookedOn = today.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  async function handleSave() {
    if (rating === 0) {
      toast.error("Please select a star rating before saving.");
      return;
    }
    setSaving(true);
    const result = await submitReview(
      recipe.id,
      rating,
      notes.trim() || null,
      wouldMakeAgain
    );
    setSaving(false);

    if ("error" in result) {
      toast.error(result.error);
    } else {
      toast.success("Rating saved!");
      onOpenChange(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full border-0"
      >
        <div className="flex flex-col items-center gap-4">
          {/* Recipe image circle */}
          <div className="w-24 h-24 rounded-full overflow-hidden shrink-0 bg-gradient-to-br from-[#D4C9B8] to-[#B8A898] flex items-center justify-center">
            {recipe.image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={recipe.image_url}
                alt={recipe.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-3xl">🍽️</span>
            )}
          </div>

          {/* Heading */}
          <div className="text-center">
            <DialogTitle className="text-lg font-semibold text-[#2D2D2D] leading-snug">
              How was the {recipe.title}?
            </DialogTitle>
            <p className="text-sm text-[#8A8A8A] mt-1">Cooked on {cookedOn}</p>
          </div>

          {/* Star rating */}
          <div className="flex flex-col items-center gap-2">
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHovered(star)}
                  onMouseLeave={() => setHovered(0)}
                  className="transition-transform hover:scale-110 focus:outline-none"
                  aria-label={`Rate ${star} star${star !== 1 ? "s" : ""}`}
                >
                  <Star
                    size={32}
                    className={
                      star <= displayRating
                        ? "fill-[#F59E0B] text-[#F59E0B]"
                        : "fill-[#E8E4DF] text-[#E8E4DF]"
                    }
                  />
                </button>
              ))}
            </div>
            <p className="text-sm text-[#8A8A8A]">
              {displayRating > 0
                ? `${displayRating} out of 5 stars`
                : "Tap to rate"}
            </p>
          </div>

          {/* Notes */}
          <div className="w-full">
            <label className="block text-sm font-medium text-[#2D2D2D] mb-1.5">
              Notes (optional)
            </label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any tweaks, substitutions, or thoughts..."
              className="rounded-xl border border-[#E8E4DF] bg-white text-[#2D2D2D] placeholder:text-[#C0BAB2] focus-visible:border-[#7C9082] focus-visible:ring-[#7C9082]/20 min-h-[80px]"
            />
          </div>

          {/* Would make again toggle */}
          <div className="w-full flex items-center justify-between py-2 border-t border-[#E8E4DF]">
            <div>
              <p className="text-sm font-medium text-[#2D2D2D]">
                Make this again?
              </p>
              <p className="text-xs text-[#8A8A8A]">
                Add to your regular rotation
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={wouldMakeAgain}
              onClick={() => setWouldMakeAgain((v) => !v)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7C9082] focus-visible:ring-offset-2 ${
                wouldMakeAgain ? "bg-[#7C9082]" : "bg-[#E8E4DF]"
              }`}
            >
              <span
                className={`pointer-events-none block h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${
                  wouldMakeAgain ? "translate-x-5" : "translate-x-0.5"
                }`}
              />
            </button>
          </div>

          {/* Actions */}
          <div className="w-full flex flex-col items-center gap-2 pt-1">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="w-full bg-[#7C9082] hover:bg-[#6B7F72] disabled:opacity-60 text-white rounded-full px-6 py-2.5 text-sm font-medium transition-colors"
            >
              {saving ? "Saving…" : "Save Rating"}
            </button>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="text-sm text-[#8A8A8A] hover:text-[#5A5A5A] transition-colors py-1"
            >
              Skip for Now
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
