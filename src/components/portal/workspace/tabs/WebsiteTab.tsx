import { useState } from "react";
import { Clock, ExternalLink, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { VersionsList, type Version } from "../VersionsList";

interface WebsiteTabProps {
  versions: Version[];
  intakeStatus: 'draft' | 'submitted' | 'approved' | null;
  hasVersions: boolean;
  selectedVersionId?: string;
  onSelectVersion?: (id: string) => void;
}

export function WebsiteTab({
  versions,
  intakeStatus,
  hasVersions,
  selectedVersionId,
  onSelectVersion,
}: WebsiteTabProps) {
  const [internalSelectedId, setInternalSelectedId] = useState<string | undefined>(
    versions[0]?.id
  );
  const [iframeKey, setIframeKey] = useState(0);
  
  const selectedId = selectedVersionId ?? internalSelectedId;
  const handleSelect = onSelectVersion ?? setInternalSelectedId;
  
  const selectedVersion = versions.find(v => v.id === selectedId);

  // No versions yet - show waiting state
  if (!hasVersions) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center px-4">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-6">
          <Clock className="h-8 w-8 text-primary" />
        </div>
        <h2 className="font-serif text-xl font-bold mb-2">
          Your first preview is being built
        </h2>
        <p className="text-muted-foreground max-w-md mb-4">
          We're working on your website. You'll see the first preview here once it's ready — usually within 24–48 hours.
        </p>
        <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-200">
          {intakeStatus === 'approved' ? 'Build in progress' : 'Under review'}
        </Badge>
      </div>
    );
  }

  // Has versions - show version selector + preview
  return (
    <div className="h-full flex">
      {/* Left: Version list */}
      <div className="w-48 border-r border-border flex-shrink-0 overflow-y-auto">
        <VersionsList
          versions={versions}
          selectedId={selectedId}
          onSelect={handleSelect}
        />
      </div>
      
      {/* Right: Preview */}
      <div className="flex-1 flex flex-col min-w-0">
        {selectedVersion && (
          <>
            {/* Preview header */}
            <div className="p-3 border-b border-border bg-muted/30 flex items-center justify-between">
              <div>
                <h3 className="font-medium text-sm">{selectedVersion.version_label || 'Preview'}</h3>
                <p className="text-xs text-muted-foreground truncate max-w-md">
                  {selectedVersion.url}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIframeKey(k => k + 1)}
                  title="Refresh preview"
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(selectedVersion.url, '_blank')}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Open in new tab
                </Button>
              </div>
            </div>
            
            {/* Preview iframe */}
            <div className="flex-1 bg-muted/20">
              <iframe
                key={iframeKey}
                src={selectedVersion.url}
                className="w-full h-full border-0"
                title="Website preview"
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
