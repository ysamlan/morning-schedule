interface ModeTabsProps {
  activeMode: "checklist" | "setup";
  onModeChange: (mode: "checklist" | "setup") => void;
}

export function ModeTabs({ activeMode, onModeChange }: ModeTabsProps) {
  return (
    <div className="flex space-x-1 rounded-lg bg-blue-100 p-1 mb-6">
      <button
        className={`flex-1 rounded-md px-3 py-2 text-sm font-medium ${
          activeMode === "checklist"
            ? "bg-white shadow text-blue-600"
            : "text-blue-500 hover:bg-white/50"
        }`}
        onClick={() => onModeChange("checklist")}
      >
        Checklist
      </button>
      <button
        className={`flex-1 rounded-md px-3 py-2 text-sm font-medium ${
          activeMode === "setup"
            ? "bg-white shadow text-blue-600"
            : "text-blue-500 hover:bg-white/50"
        }`}
        onClick={() => onModeChange("setup")}
      >
        Setup
      </button>
    </div>
  );
}
