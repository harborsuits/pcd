import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, MessageCircle, Check, Clock, CircleDot, MinusCircle } from "lucide-react";
import { FeedbackCard, type CommentData } from "./FeedbackCard";

export type CommentStatus = "open" | "in_progress" | "resolved" | "wont_do";

interface FeedbackPanelProps {
  comments: CommentData[];
  onAddFeedback: () => void;
  onCommentClick: (comment: CommentData) => void;
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
  onCommentClick,
  token,
}: FeedbackPanelProps) {
  const [activeTab, setActiveTab] = useState<string>("open");

  // Group comments by status and thread replies under parents
  const grouped = useMemo(() => {
    const result = {
      open: [] as CommentData[],
      in_progress: [] as CommentData[],
      resolved: [] as CommentData[],
      not_relevant: [] as CommentData[],
    };

    // First, separate top-level comments from replies
    const topLevel = comments.filter(c => !c.archived_at && !c.parent_comment_id);
    const replies = comments.filter(c => !c.archived_at && c.parent_comment_id);
    
    // Build a map of thread_root_id -> replies[]
    const replyMap = new Map<string, CommentData[]>();

    replies.forEach((reply) => {
      const rootId = reply.thread_root_id ?? reply.parent_comment_id;
      if (!rootId) return;
      const list = replyMap.get(rootId) ?? [];
      list.push(reply);
      replyMap.set(rootId, list);
    });
    
    // Sort replies by created_at
    replyMap.forEach(list => list.sort((a, b) => 
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    ));

    // Group top-level comments with their replies attached
    topLevel.forEach(c => {
      const commentWithReplies: CommentData = {
        ...c,
        replies: replyMap.get(c.id) || [],
      };
      
      // Handle "not relevant" as a separate category
      if (c.is_relevant === false) {
        result.not_relevant.push(commentWithReplies);
        return;
      }
      
      const status = getEffectiveStatus(c);
      if (status === "open") result.open.push(commentWithReplies);
      else if (status === "in_progress") result.in_progress.push(commentWithReplies);
      else result.resolved.push(commentWithReplies);
    });

    return result;
  }, [comments]);

  const totalOpen = grouped.open.length;
  const totalInProgress = grouped.in_progress.length;
  const totalResolved = grouped.resolved.length;
  const totalNotRelevant = grouped.not_relevant.length;
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
            onClick={onCommentClick}
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
            {totalNotRelevant > 0 && (
              <TabsTrigger
                value="not_relevant"
                className="text-xs data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-3"
              >
                <MinusCircle className="h-3 w-3 mr-1.5 text-gray-400" />
                Not Relevant
                <span className="ml-1.5 text-muted-foreground">({totalNotRelevant})</span>
              </TabsTrigger>
            )}
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
          <TabsContent value="not_relevant" className="mt-0 h-full">
            {renderCommentList(grouped.not_relevant, "No feedback marked as not relevant")}
          </TabsContent>
        </ScrollArea>
      </Tabs>
    </div>
  );
}
