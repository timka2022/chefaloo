import { DietaryPreferences } from "@/components/dietary-preferences";

export default function PreferencesPage() {
  return (
    <div className="px-6 lg:px-10 py-8 max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-[#2D2D2D]">
          Dietary Preferences
        </h1>
        <p className="text-sm text-[#8A8A8A] mt-1">
          Set your allergies and dietary preferences. AI-generated recipes will
          respect these.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-[#E8E4DF] p-6 shadow-sm">
        <DietaryPreferences />
      </div>
    </div>
  );
}
