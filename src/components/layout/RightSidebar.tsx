import SidebarNewsWidget from "./SidebarNewsWidget";
import TopHiringWidget from "./TopHiringWidget";
import SourcesWidget from "./SourcesWidget";

export default function RightSidebar() {
  return (
    <aside className="w-80 flex-shrink-0 hidden xl:block h-[calc(100vh-3.5rem)] sticky top-14 overflow-y-auto border-l border-border pl-6 py-6 pr-4">
      <div className="space-y-8">
        <SidebarNewsWidget />
        <div className="h-px bg-border" />
        <SourcesWidget />
        <div className="h-px bg-border" />
        <TopHiringWidget />
      </div>
    </aside>
  );
}
