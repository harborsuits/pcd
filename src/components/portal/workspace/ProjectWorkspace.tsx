import { useState, useCallback, useRef } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import html2canvas from "html2canvas";
import { VersionsList, type Version } from "./VersionsList";
import { PreviewPanel } from "./PreviewPanel";
import { FeedbackPanel } from "./FeedbackPanel";
import { AddFeedbackModal } from "./AddFeedbackModal";
import { ScreenshotComposer } from "./ScreenshotComposer";
import { CommentComposer } from "./CommentComposer";
import { ScreenshotViewer } from "../ScreenshotViewer";
import { OperatorPanel } from "./OperatorPanel";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { MessageCircle, Settings2, Home } from "lucide-react";
import { getAdminKey } from "@/lib/adminFetch";
import type { CommentData } from "./FeedbackCard";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

interface IntakeData {
  // Core fields from new simplified wizard
  businessName?: string;
  businessType?: string;
  primaryGoal?: string;
  sellType?: string;
  timeline?: string;
  deadlineDate?: string;
  readiness?: string;
  involvement?: string;
  serviceArea?: string;
  contactEmail?: string;
  contactPhone?: string;
  // Legacy fields
  goals?: string[];
  assetsReadiness?: string;
  involvementPreference?: string;
  websiteStatus?: string;
  readinessAssets?: string[];
  notes?: string;
}

interface PhaseBData {
  logoStatus?: "uploaded" | "create" | "help" | "" | null;
  brandColors?: string | null;
  colorPreference?: "pick_for_me" | "custom" | "" | null;
  businessDescription?: string | null;
  services?: string | null;
  serviceArea?: string | null;
  differentiators?: string | null;
  faq?: string | null;
  primaryGoal?: "book" | "quote" | "call" | "portfolio" | "learn" | "visit" | "" | null;
  photosPlan?: "upload" | "generate" | "none" | "help" | "" | null;
  photosUploaded?: number | null;
  generatedPhotoSubjects?: string | null;
  generatedPhotoStyle?: "realistic" | "studio" | "lifestyle" | "minimal" | "" | null;
  generatedPhotoNotes?: string | null;
  placeholderOk?: boolean | null;
  googleReviewsLink?: string | null;
  certifications?: string | null;
  hasBeforeAfter?: "yes" | "coming_soon" | "no" | "" | null;
  vibe?: "modern" | "classic" | "luxury" | "bold" | "minimal" | "cozy" | "" | null;
  tone?: "professional" | "friendly" | "direct" | "playful" | "" | null;
  exampleSites?: string | null;
  mustInclude?: string | null;
  mustAvoid?: string | null;
  contentNeedsHelp?: boolean;
  styleNeedsHelp?: boolean;
}

interface ProjectWorkspaceProps {
  token: string;
  versions: Version[];
  comments: CommentData[];
  onRefreshComments: () => void;
  // Operator mode props
  projectId?: string;
  intakeStatus?: 'draft' | 'submitted' | 'approved' | null;
  pipelineStage?: string;
  portalStage?: string;
  intakeData?: IntakeData | null;
  phaseBStatus?: 'pending' | 'in_progress' | 'complete' | null;
  phaseBData?: PhaseBData | null;
  onRefreshProject?: () => void;
  // Force client mode - disables operator UI even if admin_key exists
  forceClientMode?: boolean;
}

type WorkspaceMode = 
  | { type: "preview" }
  | { type: "screenshot"; image: string; imageW: number; imageH: number; pin: { x: number; y: number } | null }
  | { type: "general-comment" };

export function ProjectWorkspace({
  token,
  versions,
  comments,
  onRefreshComments,
  projectId,
  intakeStatus,
  pipelineStage,
  portalStage,
  intakeData,
  phaseBStatus,
  phaseBData,
  onRefreshProject,
  forceClientMode = false,
}: ProjectWorkspaceProps) {
  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(
    versions[0]?.id ?? null
  );
  const [mode, setMode] = useState<WorkspaceMode>({ type: "preview" });
  const [showAddFeedbackModal, setShowAddFeedbackModal] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [viewingScreenshot, setViewingScreenshot] = useState<CommentData | null>(null);
  const [rightPanelTab, setRightPanelTab] = useState<string>("feedback");
  
  const previewContainerRef = useRef<HTMLDivElement>(null);
  
  // Check if user has operator access
  // forceClientMode overrides admin_key - used for /c/:token client-only route
  const isOperator = !forceClientMode && !!getAdminKey();

  const selectedVersion = versions.find(v => v.id === selectedVersionId) ?? versions[0];
  const versionComments = comments.filter(c => c.prototype_id === selectedVersion?.id);

  // Upload screenshot to storage and get media_id
  const uploadScreenshot = useCallback(async (file: File | Blob): Promise<{ mediaId: string; path: string }> => {
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch(
      `${SUPABASE_URL}/functions/v1/portal/${token}/media`,
      {
        method: "POST",
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: formData,
      }
    );

    if (!res.ok) {
      throw new Error("Failed to upload screenshot");
    }

    const data = await res.json();
    return { mediaId: data.media_id, path: data.path };
  }, [token]);

  // Capture screenshot from preview iframe
  const handleCaptureScreenshot = useCallback(async () => {
    setIsCapturing(true);
    try {
      // Try to capture the preview container
      const container = previewContainerRef.current;
      if (!container) {
        toast.error("Could not capture screenshot");
        return;
      }

      // Find the iframe
      const iframe = container.querySelector("iframe");
      if (iframe) {
        // Cross-origin iframe - can't capture, prompt upload instead
        toast.info("Please upload a screenshot instead");
        setIsCapturing(false);
        return;
      }

      // Capture the container (fallback for non-iframe content)
      const canvas = await html2canvas(container, {
        useCORS: true,
        allowTaint: true,
        logging: false,
      });

      const imageUrl = canvas.toDataURL("image/png");
      setMode({
        type: "screenshot",
        image: imageUrl,
        imageW: canvas.width,
        imageH: canvas.height,
        pin: null,
      });
    } catch (err) {
      console.error("Screenshot capture failed:", err);
      toast.error("Screenshot capture failed. Please upload instead.");
    } finally {
      setIsCapturing(false);
    }
  }, []);

  // Handle file upload for screenshot
  const handleUploadScreenshot = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        setMode({
          type: "screenshot",
          image: e.target?.result as string,
          imageW: img.naturalWidth,
          imageH: img.naturalHeight,
          pin: null,
        });
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  }, []);

  // Handle pin placement on screenshot
  const handlePinPlace = useCallback((x: number, y: number) => {
    setMode(prev => {
      if (prev.type !== "screenshot") return prev;
      return { ...prev, pin: { x, y } };
    });
  }, []);

  // Submit screenshot feedback
  const handleSubmitScreenshotFeedback = useCallback(async (data: {
    body: string;
    pinX: number;
    pinY: number;
    screenshotW: number;
    screenshotH: number;
    attachments?: File[];
  }) => {
    if (!selectedVersion || mode.type !== "screenshot") return;

    try {
      // Convert base64 to blob and upload
      const response = await fetch(mode.image);
      const blob = await response.blob();
      const file = new File([blob], `screenshot-${Date.now()}.png`, { type: "image/png" });
      
      const { mediaId, path } = await uploadScreenshot(file);

      // Create comment with screenshot
      const res = await fetch(
        `${SUPABASE_URL}/functions/v1/portal/${token}/comments`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: SUPABASE_ANON_KEY,
            Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            action: "create",
            prototype_id: selectedVersion.id,
            body: data.body,
            pin_x: data.pinX,
            pin_y: data.pinY,
            author_type: "client",
            screenshot_media_id: mediaId,
            screenshot_path: path,
            screenshot_w: data.screenshotW,
            screenshot_h: data.screenshotH,
          }),
        }
      );

      if (!res.ok) throw new Error("Failed to create comment");

      toast.success("Feedback submitted");
      setMode({ type: "preview" });
      onRefreshComments();
    } catch (err) {
      console.error("Submit feedback failed:", err);
      toast.error("Failed to submit feedback");
    }
  }, [mode, selectedVersion, token, uploadScreenshot, onRefreshComments]);

  // Submit general comment
  const handleSubmitGeneralComment = useCallback(async (body: string) => {
    if (!selectedVersion) return;

    try {
      const res = await fetch(
        `${SUPABASE_URL}/functions/v1/portal/${token}/comments`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: SUPABASE_ANON_KEY,
            Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            action: "create",
            prototype_id: selectedVersion.id,
            body,
            author_type: "client",
          }),
        }
      );

      if (!res.ok) throw new Error("Failed to create comment");

      toast.success("Comment added");
      setMode({ type: "preview" });
      onRefreshComments();
    } catch (err) {
      console.error("Submit comment failed:", err);
      toast.error("Failed to add comment");
    }
  }, [selectedVersion, token, onRefreshComments]);

  // Comment actions
  const handleResolve = useCallback(async (id: string) => {
    const res = await fetch(
      `${SUPABASE_URL}/functions/v1/portal/${token}/comments`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ action: "resolve", comment_id: id }),
      }
    );
    if (res.ok) {
      onRefreshComments();
      toast.success("Marked as resolved");
    }
  }, [token, onRefreshComments]);

  const handleUnresolve = useCallback(async (id: string) => {
    const res = await fetch(
      `${SUPABASE_URL}/functions/v1/portal/${token}/comments`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ action: "unresolve", comment_id: id }),
      }
    );
    if (res.ok) {
      onRefreshComments();
      toast.success("Reopened");
    }
  }, [token, onRefreshComments]);

  const handleMarkInProgress = useCallback(async (id: string) => {
    const res = await fetch(
      `${SUPABASE_URL}/functions/v1/portal/${token}/comments`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ action: "update_status", comment_id: id, status: "in_progress" }),
      }
    );
    if (res.ok) {
      onRefreshComments();
      toast.success("Marked as in progress");
    }
  }, [token, onRefreshComments]);

  const handleViewScreenshot = useCallback((comment: CommentData) => {
    setViewingScreenshot(comment);
  }, []);

  // Render bottom composer based on mode
  const renderComposer = () => {
    if (mode.type === "screenshot" && mode.pin) {
      return (
        <ScreenshotComposer
          screenshotUrl={mode.image}
          pinX={mode.pin.x}
          pinY={mode.pin.y}
          screenshotW={mode.imageW}
          screenshotH={mode.imageH}
          onSubmit={handleSubmitScreenshotFeedback}
          onCancel={() => setMode({ type: "preview" })}
          onRepin={() => setMode(prev => prev.type === "screenshot" ? { ...prev, pin: null } : prev)}
        />
      );
    }

    if (mode.type === "general-comment") {
      return (
        <div className="p-4 border-t border-border bg-background">
          <CommentComposer
            onSubmit={async (body) => {
              await handleSubmitGeneralComment(body);
            }}
            onCancel={() => setMode({ type: "preview" })}
            placeholder="What's on your mind?"
          />
        </div>
      );
    }

    return null;
  };

  return (
    <div className="h-full flex">
      {/* Left: Versions (compact) */}
      <div className="w-44 flex-shrink-0 border-r border-border bg-muted/30 flex flex-col">
        <div className="p-2 border-b border-border">
          <Link to="/">
            <Button variant="ghost" size="sm" className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground">
              <Home className="h-4 w-4" />
              Home
            </Button>
          </Link>
        </div>
        <VersionsList
          versions={versions}
          selectedId={selectedVersionId}
          onSelect={setSelectedVersionId}
        />
      </div>

      {/* Center: Preview */}
      <div className="flex-1 flex flex-col min-w-0" ref={previewContainerRef}>
        <PreviewPanel
          url={selectedVersion?.url ?? ""}
          isScreenshotMode={mode.type === "screenshot"}
          screenshotImage={mode.type === "screenshot" ? mode.image : null}
          pinPosition={mode.type === "screenshot" ? mode.pin : null}
          onCaptureScreenshot={handleCaptureScreenshot}
          onUploadScreenshot={handleUploadScreenshot}
          onPinPlace={handlePinPlace}
          onExitScreenshotMode={() => setMode({ type: "preview" })}
          isCapturing={isCapturing}
        />
        
        {/* Bottom composer */}
        {renderComposer()}
      </div>

      {/* Right: Feedback + Operator tabs */}
      <div className="w-80 flex-shrink-0 border-l border-border bg-background flex flex-col">
        {isOperator ? (
          <Tabs value={rightPanelTab} onValueChange={setRightPanelTab} className="flex-1 flex flex-col">
            <div className="border-b border-border px-2 pt-1">
              <TabsList className="h-9 w-full justify-start bg-transparent gap-0 p-0">
                <TabsTrigger
                  value="feedback"
                  className="text-xs data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-3 gap-1.5"
                >
                  <MessageCircle className="h-3 w-3" />
                  Feedback
                </TabsTrigger>
                <TabsTrigger
                  value="operator"
                  className="text-xs data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-amber-500 rounded-none px-3 gap-1.5"
                >
                  <Settings2 className="h-3 w-3" />
                  Operator
                </TabsTrigger>
              </TabsList>
            </div>
            
            <TabsContent value="feedback" className="flex-1 mt-0 min-h-0">
              <FeedbackPanel
                comments={versionComments}
                onAddFeedback={() => setShowAddFeedbackModal(true)}
                onResolve={handleResolve}
                onUnresolve={handleUnresolve}
                onMarkInProgress={handleMarkInProgress}
                onViewScreenshot={handleViewScreenshot}
                token={token}
              />
            </TabsContent>
            
            <TabsContent value="operator" className="flex-1 mt-0 min-h-0">
              <OperatorPanel
                token={token}
                projectId={projectId}
                intakeStatus={intakeStatus ?? null}
                pipelineStage={pipelineStage ?? "new"}
                portalStage={portalStage ?? "intake"}
                intakeData={intakeData}
                phaseBStatus={phaseBStatus}
                phaseBData={phaseBData}
                onRefresh={onRefreshProject ?? (() => {})}
              />
            </TabsContent>
          </Tabs>
        ) : (
          <FeedbackPanel
            comments={versionComments}
            onAddFeedback={() => setShowAddFeedbackModal(true)}
            onResolve={handleResolve}
            onUnresolve={handleUnresolve}
            onMarkInProgress={handleMarkInProgress}
            onViewScreenshot={handleViewScreenshot}
            token={token}
          />
        )}
      </div>

      {/* Add feedback modal */}
      <AddFeedbackModal
        open={showAddFeedbackModal}
        onOpenChange={setShowAddFeedbackModal}
        onSelectScreenshot={() => {
          toast.info("Upload a screenshot to pin your feedback");
        }}
        onSelectGeneral={() => setMode({ type: "general-comment" })}
      />

      {/* Screenshot viewer modal */}
      {viewingScreenshot && viewingScreenshot.screenshot_path && (
        <ScreenshotViewer
          open={!!viewingScreenshot}
          onOpenChange={(open) => !open && setViewingScreenshot(null)}
          screenshotUrl={`${SUPABASE_URL}/storage/v1/object/public/project-media/${viewingScreenshot.screenshot_path}`}
          pinX={viewingScreenshot.pin_x ?? 50}
          pinY={viewingScreenshot.pin_y ?? 50}
          commentBody={viewingScreenshot.body}
          commentIndex={versionComments.findIndex(c => c.id === viewingScreenshot.id)}
        />
      )}
    </div>
  );
}
