import * as Tabs from "@radix-ui/react-tabs";

interface ModeTabsProps {
  activeMode: "checklist" | "setup";
  onModeChange: (mode: "checklist" | "setup") => void;
}

export function ModeTabs({ activeMode, onModeChange }: ModeTabsProps) {
  return (
    <Tabs.Root
      value={activeMode}
      onValueChange={onModeChange}
      defaultValue="checklist"
    >
      <Tabs.List className="inline-flex h-10 items-center justify-center rounded-md bg-gray-100 p-1 mb-6">
        <Tabs.Trigger
          value="checklist"
          className="inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-white transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-white data-[state=active]:text-gray-950 data-[state=active]:shadow-sm flex-1"
        >
          Checklist
        </Tabs.Trigger>
        <Tabs.Trigger
          value="setup"
          className="inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-white transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-white data-[state=active]:text-gray-950 data-[state=active]:shadow-sm flex-1"
        >
          Setup
        </Tabs.Trigger>
      </Tabs.List>
    </Tabs.Root>
  );
}
