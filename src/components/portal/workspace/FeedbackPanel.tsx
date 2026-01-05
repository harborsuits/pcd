import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, MessageCircle, Image as ImageIcon, Check, Clock, CircleDot } from "lucide-react";
import { FeedbackCard, type CommentData } from "./FeedbackCard";

export type CommentStatus = "open" | "in_progress" | "resolved" | "wont_do";

interface FeedbackPanelProps {
  comments: CommentData[];
  onAddFeedback: () => void;
  onResolve: (id: string) => void;
  onUnresolve: (id: string) => void;
  onMarkInProgress: (id: string) => void;
  onViewScreenshot: (comment: CommentData) => void;
  token: string;
}

function getEffectiveStatus(c: CommentData): CommentStatus {
  if (c.status === "wont_do") return "wont_do";
  if (c.status === "resolved" || c.resolved_at) return "resolved";
  if (c.status === "in_progress") return "in_progress";
  return "open";
}

export function FeedbackPanel({
  comments,
  onAddFeedback,
  onResolve,
  onUnresolve,
  onMarkInProgress,
  onViewScreenshot,
  token,
}: FeedbackPanelProps) {
  const [activeTab, setActiveTab] = useState<string>("open");

  // Group comments by status
  const grouped = useMemo(() => {
    const result = {
      open: [] as CommentData[],
      in_progress: [] as CommentData[],
      resolved: [] as CommentData[],
    };

    comments
      .filter(c => !c.archived_at)
      .forEach(c => {
        const status = getEffectiveStatus(c);
        if (status === "open") result.open.push(c);
        else if (status === "in_progress") result.in_progress.push(c);
        else result.resolved.push(c);
      });

    return result;
  }, [comments]);

  const totalOpen = grouped.open.length;
  const totalInProgress = grouped.in_progress.length;
  const totalResolved = grouped.resolved.length;
  const total = totalOpen + totalInProgress + totalResolved;

  const renderCommentList = (list: CommentData[], emptyMessage: string) => {
    if (list.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <MessageCircle className="h-8 w-8 text-muted-foreground/50 mb-2" />
          <p className="text-sm text-muted-foreground">{emptyMessage}</p>
        </div>
      );
    }

    return (
      <div className="space-y-2 p-2">
        {list.map((comment, index) => (
          <FeedbackCard
            key={comment.id}
            comment={comment}
            index={index}
            token={token}
            onResolve={onResolve}
            onUnresolve={onUnresolve}
            onMarkInProgress={onMarkInProgress}
            onViewScreenshot={onViewScreenshot}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-foreground">Feedback</h3>
          {total > 0 && (
            <Badge variant="secondary" className="text-xs">
              {total}
            </Badge>
          )}
        </div>
        <Button
          onClick={onAddFeedback}
          size="sm"
          className="h-7 text-xs gap-1.5"
        >
          <Plus className="h-3 w-3" />
          Add
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
        <div className="border-b border-border px-2">
          <TabsList className="h-9 w-full justify-start bg-transparent gap-0">
            <TabsTrigger
              value="open"
              className="text-xs data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-3"
            >
              <CircleDot className="h-3 w-3 mr-1.5 text-orange-500" />
              Open
              {totalOpen > 0 && (
                <span className="ml-1.5 text-muted-foreground">({totalOpen})</span>
              )}
            </TabsTrigger>
            <TabsTrigger
              value="in_progress"
              className="text-xs data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-3"
            >
              <Clock className="h-3 w-3 mr-1.5 text-blue-500" />
              In Progress
              {totalInProgress > 0 && (
                <span className="ml-1.5 text-muted-foreground">({totalInProgress})</span>
              )}
            </TabsTrigger>
            <TabsTrigger
              value="resolved"
              className="text-xs data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-3"
            >
              <Check className="h-3 w-3 mr-1.5 text-green-500" />
              Resolved
              {totalResolved > 0 && (
                <span className="ml-1.5 text-muted-foreground">({totalResolved})</span>
              )}
            </TabsTrigger>
          </TabsList>
        </div>

        <ScrollArea className="flex-1">
          <TabsContent value="open" className="mt-0 h-full">
            {renderCommentList(grouped.open, "No open feedback")}
          </TabsContent>
          <TabsContent value="in_progress" className="mt-0 h-full">
            {renderCommentList(grouped.in_progress, "Nothing in progress")}
          </TabsContent>
          <TabsContent value="resolved" className="mt-0 h-full">
            {renderCommentList(grouped.resolved, "No resolved feedback yet")}
          </TabsContent>
        </ScrollArea>
      </Tabs>
    </div>
  );
}
