import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Check, Clock, Archive as ArchiveIcon } from "lucide-react";

export interface Version {
  id: string;
  url: string;
  version_label: string | null;
  status: string;
  created_at: string;
}

interface VersionsListProps {
  versions: Version[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

function getStatusInfo(status: string) {
  switch (status) {
    case "review":
    case "in_review":
      return { label: "In review", variant: "default" as const, icon: Clock };
    case "approved":
      return { label: "Approved", variant: "secondary" as const, icon: Check };
    case "archived":
      return { label: "Archived", variant: "outline" as const, icon: ArchiveIcon };
    default:
      return { label: status, variant: "outline" as const, icon: null };
  }
}

export function VersionsList({ versions, selectedId, onSelect }: VersionsListProps) {
  if (versions.length === 0) {
    return (
      <div className="p-4 text-center text-muted-foreground text-sm">
        No versions yet
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-shrink-0 max-h-[50%]">
      <div className="px-4 py-3 border-b border-border">
        <h3 className="text-sm font-semibold text-foreground">Versions</h3>
      </div>
      <ScrollArea className="flex-1 min-h-0">
        <div className="p-2 space-y-1">
          {versions.map((version, index) => {
            const isSelected = version.id === selectedId;
            const statusInfo = getStatusInfo(version.status);
            const versionNum = versions.length - index;
            const label = version.version_label || `v${versionNum}`;
            
            return (
              <button
                key={version.id}
                onClick={() => onSelect(version.id)}
                className={`w-full text-left px-3 py-2.5 rounded-lg transition-colors ${
                  isSelected
                    ? "bg-primary/10 border border-primary/30"
                    : "hover:bg-muted border border-transparent"
                }`}
              >
                <div className="flex items-center gap-2">
                  {isSelected && (
                    <span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                  )}
                  <span className={`text-sm font-medium ${isSelected ? "text-primary" : "text-foreground"}`}>
                    {label}
                  </span>
                </div>
                <div className="mt-1 flex items-center gap-2">
                  <Badge variant={statusInfo.variant} className="text-[10px] h-5">
                    {statusInfo.icon && <statusInfo.icon className="h-2.5 w-2.5 mr-1" />}
                    {statusInfo.label}
                  </Badge>
                </div>
              </button>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}
