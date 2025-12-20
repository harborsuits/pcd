import { useState, useEffect, useRef, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Send, Search, MessageSquare, StickyNote, Trash2, Edit2, FileText, Download, Upload } from "lucide-react";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { proxyMediaUrl, isImageType, getFileIcon } from "@/lib/media";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

interface Project {
  project_token: string;
  business_name: string;
  status: string;
  last_message: {
    content: string;
    sender_type: string;
    created_at: string;
  } | null;
  unread_count: number;
}

interface Message {
  id: string;
  content: string;
  sender_type: string;
  created_at: string;
  read_at: string | null;
}

interface Note {
  id: string;
  content: string;
  created_at: string;
  updated_at: string;
}

interface FileItem {
  id: string;
  file_name: string;
  file_type: string;
  description: string | null;
  created_at: string;
}

export default function AdminMessages() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [loadingNotes, setLoadingNotes] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [replyContent, setReplyContent] = useState("");
  const [noteContent, setNoteContent] = useState("");
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [sending, setSending] = useState(false);
  const [savingNote, setSavingNote] = useState(false);
  const [adminKey, setAdminKey] = useState("");
  const [activeTab, setActiveTab] = useState<"messages" | "notes" | "files">("messages");
  const [uploading, setUploading] = useState(false);
  const [uploadDesc, setUploadDesc] = useState("");
  const [uploadQueue, setUploadQueue] = useState<{ id: string; name: string; status: 'pending' | 'uploading' | 'done' | 'error'; error?: string }[]>([]);
  const [isDragActive, setIsDragActive] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const originalTitle = useRef(document.title);
  const markReadInFlight = useRef<Record<string, boolean>>({});
  const clearQueueTimeoutRef = useRef<number | null>(null);

  // Scroll to bottom (messages are oldest→newest, so we scroll to end)
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  // Cleanup upload queue timeout on unmount
  useEffect(() => {
    return () => {
      if (clearQueueTimeoutRef.current) {
        window.clearTimeout(clearQueueTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (adminKey) {
      fetchProjects();
    } else {
      setLoading(false);
    }
  }, [adminKey]);

  useEffect(() => {
    if (selectedProject && adminKey) {
      fetchMessages(selectedProject.project_token);
      fetchNotes(selectedProject.project_token);
      // Only mark as read if there are unread messages
      if (selectedProject.unread_count > 0) {
        markMessagesAsRead(selectedProject.project_token);
      }
    }
  }, [selectedProject, adminKey]);

  // Real-time subscription for SELECTED THREAD ONLY
  useEffect(() => {
    if (!adminKey || !selectedProject) return;

    const token = selectedProject.project_token;
    console.log("📡 Setting up realtime for thread:", token.slice(0, 8) + "...");

    const channel = supabase
      .channel(`admin-thread-${token}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `project_token=eq.${token}`,
        },
        (payload) => {
          console.log("📨 New message in thread:", payload);
          const newMsg = payload.new as {
            id: string;
            content: string;
            sender_type: string;
            created_at: string;
            read_at: string | null;
          };

          setMessages((prevMessages) => {
            // Dedupe by id
            const exists = prevMessages.some((m) => m.id === newMsg.id);
            if (exists) {
              console.log("⚠️ Duplicate message ignored");
              return prevMessages;
            }

            console.log("✅ Adding new message to thread");
            
            // Show toast for client messages
            if (newMsg.sender_type === "client") {
              toast({
                title: "New message from Client",
                description: newMsg.content.slice(0, 50) + (newMsg.content.length > 50 ? "..." : ""),
              });
              // Flash tab title with business name
              const businessName = selectedProject?.business_name || "Admin";
              document.title = `(1) New message — ${businessName}`;
              setTimeout(() => {
                document.title = originalTitle.current;
              }, 5000);
              
              // Mark as read since we're viewing
              markMessagesAsRead(token);
            }

            // Append to end (oldest→newest order)
            return [
              ...prevMessages,
              {
                id: newMsg.id,
                content: newMsg.content,
                sender_type: newMsg.sender_type,
                created_at: newMsg.created_at,
                read_at: newMsg.read_at,
              },
            ];
          });

          // Update the project in the list
          setProjects((prevProjects) =>
            prevProjects.map((p) =>
              p.project_token === token
                ? {
                    ...p,
                    last_message: {
                      content: newMsg.content,
                      sender_type: newMsg.sender_type,
                      created_at: newMsg.created_at,
                    },
                    // Don't increment unread since we're viewing
                    unread_count: 0,
                  }
                : p
            )
          );

          setTimeout(scrollToBottom, 100);
        }
      )
      .subscribe((status) => {
        console.log("📡 Thread subscription status:", status);
      });

    return () => {
      console.log("🔌 Cleaning up thread subscription");
      supabase.removeChannel(channel);
    };
  }, [adminKey, selectedProject?.project_token, scrollToBottom]);

  // Poll inbox every 15s to catch messages for OTHER projects
  useEffect(() => {
    if (!adminKey) return;

    const interval = setInterval(() => {
      console.log("🔄 Polling inbox...");
      fetchProjects();
    }, 15000);

    return () => clearInterval(interval);
  }, [adminKey]);

  async function fetchProjects() {
    if (!adminKey) return;

    try {
      setLoading(true);

      const response = await fetch(`${SUPABASE_URL}/functions/v1/admin/inbox`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "apikey": SUPABASE_ANON_KEY,
          "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
          "x-admin-key": adminKey,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          toast({
            title: "Unauthorized",
            description: "Invalid admin key",
            variant: "destructive",
          });
          setAdminKey("");
          return;
        }
        console.error("Inbox fetch error:", data.error);
        return;
      }

      // Check for new messages in other projects and show notification
      const currentSelectedToken = selectedProject?.project_token;
      for (const project of data) {
        if (project.project_token !== currentSelectedToken && project.unread_count > 0) {
          const existingProject = projects.find(p => p.project_token === project.project_token);
          if (existingProject && project.unread_count > existingProject.unread_count) {
            toast({
              title: `New message from ${project.business_name}`,
              description: project.last_message?.content?.slice(0, 50) || "New message",
            });
            // Flash tab title with business name
            document.title = `(${project.unread_count}) New message — ${project.business_name}`;
            setTimeout(() => {
              document.title = originalTitle.current;
            }, 5000);
          }
        }
      }

      setProjects(data);
    } catch (err) {
      console.error("Error fetching projects:", err);
      toast({
        title: "Error",
        description: "Failed to fetch inbox",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  async function fetchMessages(projectToken: string) {
    try {
      setLoadingMessages(true);

      const response = await fetch(
        `${SUPABASE_URL}/functions/v1/portal/${projectToken}?messages_limit=100`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "apikey": SUPABASE_ANON_KEY,
            "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok || data.error) {
        console.error("Messages fetch error:", data.error);
        return;
      }

      // Messages come in ascending order (oldest→newest), store as-is
      setMessages(data.messages || []);
      
      // Also store files from the same response
      setFiles(data.files || []);
      
      // Scroll to bottom after messages load
      setTimeout(scrollToBottom, 100);
    } catch (err) {
      console.error("Error fetching messages:", err);
    } finally {
      setLoadingMessages(false);
    }
  }

  async function fetchNotes(projectToken: string) {
    try {
      setLoadingNotes(true);

      const response = await fetch(
        `${SUPABASE_URL}/functions/v1/admin/notes/${projectToken}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "apikey": SUPABASE_ANON_KEY,
            "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
            "x-admin-key": adminKey,
          },
        }
      );

      const data = await response.json();

      if (!response.ok || data.error) {
        console.error("Notes fetch error:", data.error);
        return;
      }

      setNotes(data.notes || []);
    } catch (err) {
      console.error("Error fetching notes:", err);
    } finally {
      setLoadingNotes(false);
    }
  }

  async function markMessagesAsRead(projectToken: string) {
    // Throttle: skip if already in flight for this token
    if (markReadInFlight.current[projectToken]) return;
    markReadInFlight.current[projectToken] = true;

    try {
      const response = await fetch(
        `${SUPABASE_URL}/functions/v1/admin/messages/mark-read`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "apikey": SUPABASE_ANON_KEY,
            "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
            "x-admin-key": adminKey,
          },
          body: JSON.stringify({ project_token: projectToken }),
        }
      );

      const data = await response.json();

      if (response.ok && data.marked_count > 0) {
        console.log(`Marked ${data.marked_count} messages as read`);
        // Update local state
        setProjects((prev) =>
          prev.map((p) =>
            p.project_token === projectToken ? { ...p, unread_count: 0 } : p
          )
        );
        setSelectedProject((prev) =>
          prev?.project_token === projectToken ? { ...prev, unread_count: 0 } : prev
        );
      }
    } catch (err) {
      console.error("Error marking messages as read:", err);
    } finally {
      markReadInFlight.current[projectToken] = false;
    }
  }

  async function handleSendReply() {
    if (!selectedProject || !replyContent.trim()) return;

    if (!adminKey) {
      toast({
        title: "Admin key required",
        description: "Please enter your admin key to send messages.",
        variant: "destructive",
      });
      return;
    }

    setSending(true);

    try {
      const response = await fetch(
        `${SUPABASE_URL}/functions/v1/admin/messages/reply`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "apikey": SUPABASE_ANON_KEY,
            "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
            "x-admin-key": adminKey,
          },
          body: JSON.stringify({
            project_token: selectedProject.project_token,
            content: replyContent.trim(),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        toast({
          title: "Failed to send",
          description: data.error || "Unknown error",
          variant: "destructive",
        });
        return;
      }

      // Optimistically add message to end (oldest→newest)
      if (data.message) {
        setMessages((prev) => [
          ...prev,
          {
            id: data.message.id,
            content: data.message.content,
            sender_type: data.message.sender_type,
            created_at: data.message.created_at,
            read_at: data.message.read_at,
          },
        ]);
        setTimeout(scrollToBottom, 100);
      }

      setReplyContent("");
      toast({
        title: "Message sent",
        description: "Your reply has been sent.",
      });

      // Refresh projects to update last message
      fetchProjects();
    } catch (err) {
      console.error("Send reply error:", err);
      toast({
        title: "Failed to send",
        description: "Network error",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  }

  async function handleSaveNote() {
    if (!selectedProject || !noteContent.trim()) return;

    setSavingNote(true);

    try {
      const isEditing = !!editingNote;
      const url = isEditing
        ? `${SUPABASE_URL}/functions/v1/admin/notes/${selectedProject.project_token}/${editingNote.id}`
        : `${SUPABASE_URL}/functions/v1/admin/notes/${selectedProject.project_token}`;

      const response = await fetch(url, {
        method: isEditing ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": SUPABASE_ANON_KEY,
          "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
          "x-admin-key": adminKey,
        },
        body: JSON.stringify({ content: noteContent.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast({
          title: "Failed to save note",
          description: data.error || "Unknown error",
          variant: "destructive",
        });
        return;
      }

      if (isEditing) {
        setNotes((prev) =>
          prev.map((n) => (n.id === editingNote.id ? data.note : n))
        );
        toast({ title: "Note updated" });
      } else {
        setNotes((prev) => [data.note, ...prev]);
        toast({ title: "Note added" });
      }

      setNoteContent("");
      setEditingNote(null);
    } catch (err) {
      console.error("Save note error:", err);
      toast({
        title: "Failed to save note",
        description: "Network error",
        variant: "destructive",
      });
    } finally {
      setSavingNote(false);
    }
  }

  async function handleDeleteNote(noteId: string) {
    if (!selectedProject) return;

    try {
      const response = await fetch(
        `${SUPABASE_URL}/functions/v1/admin/notes/${selectedProject.project_token}/${noteId}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            "apikey": SUPABASE_ANON_KEY,
            "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
            "x-admin-key": adminKey,
          },
        }
      );

      if (!response.ok) {
        const data = await response.json();
        toast({
          title: "Failed to delete note",
          description: data.error || "Unknown error",
          variant: "destructive",
        });
        return;
      }

      setNotes((prev) => prev.filter((n) => n.id !== noteId));
      toast({ title: "Note deleted" });
    } catch (err) {
      console.error("Delete note error:", err);
      toast({
        title: "Failed to delete note",
        description: "Network error",
        variant: "destructive",
      });
    }
  }

  function handleAdminKeySubmit() {
    if (adminKey.trim()) {
      fetchProjects();
    }
  }

  function handleEditNote(note: Note) {
    setEditingNote(note);
    setNoteContent(note.content);
  }

  function handleCancelEdit() {
    setEditingNote(null);
    setNoteContent("");
  }

  // File upload functions
  async function uploadSingleFile(token: string, file: File, description: string): Promise<FileItem> {
    const form = new FormData();
    form.append("file", file);
    if (description?.trim()) form.append("description", description.trim());

    const res = await fetch(`${SUPABASE_URL}/functions/v1/files/${encodeURIComponent(token)}/upload`, {
      method: "POST",
      body: form,
    });

    if (!res.ok) {
      let msg = `Upload failed (${res.status})`;
      try {
        const j = await res.json();
        if (j?.error) msg = j.error;
      } catch {}
      throw new Error(msg);
    }

    const data = await res.json();
    return data.file || data;
  }

  async function handleAdminFileUpload(fileList: FileList | File[]) {
    const token = selectedProject?.project_token;
    if (!token) {
      toast({ title: "Select a project first", variant: "destructive" });
      return;
    }
    if (uploading) return;

    const fileArray = Array.from(fileList || []);
    if (fileArray.length === 0) return;

    // Seed queue
    const seeded = fileArray.map((f) => ({
      id: crypto.randomUUID(),
      name: f.name,
      status: 'pending' as const,
    }));
    setUploadQueue(seeded);
    setUploading(true);

    let successCount = 0;

    for (let i = 0; i < fileArray.length; i++) {
      const file = fileArray[i];
      const queueId = seeded[i].id;

      setUploadQueue((q) =>
        q.map((x) => (x.id === queueId ? { ...x, status: 'uploading' as const } : x))
      );

      try {
        const newFile = await uploadSingleFile(token, file, uploadDesc);
        successCount++;

        if (newFile?.id) {
          setFiles((prev) => [newFile, ...prev]);
        }

        setUploadQueue((q) =>
          q.map((x) => (x.id === queueId ? { ...x, status: 'done' as const } : x))
        );
      } catch (e: any) {
        setUploadQueue((q) =>
          q.map((x) =>
            x.id === queueId ? { ...x, status: 'error' as const, error: e?.message || 'Upload failed' } : x
          )
        );
      }
    }

    // Toast summary
    if (successCount > 0) {
      toast({
        title:
          successCount === fileArray.length
            ? `${successCount} file${successCount > 1 ? 's' : ''} uploaded`
            : `${successCount}/${fileArray.length} files uploaded`,
        description: successCount < fileArray.length ? 'Some files failed to upload' : undefined,
      });
    } else {
      toast({
        title: 'Upload failed',
        description: `All ${fileArray.length} file(s) failed to upload.`,
        variant: 'destructive',
      });
    }

    setUploadDesc('');
    setUploading(false);

    if (clearQueueTimeoutRef.current) window.clearTimeout(clearQueueTimeoutRef.current);
    clearQueueTimeoutRef.current = window.setTimeout(() => {
      setUploadQueue([]);
      clearQueueTimeoutRef.current = null;
    }, 3000);
  }

  // Drag-drop handlers for admin upload
  function onDragOver(e: React.DragEvent) {
    e.preventDefault();
    if (uploading) return;
    setIsDragActive(true);
  }

  function onDragEnter(e: React.DragEvent) {
    e.preventDefault();
    if (uploading) return;
    setIsDragActive(true);
  }

  function onDragLeave(e: React.DragEvent) {
    e.preventDefault();
    setIsDragActive(false);
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragActive(false);
    if (uploading) return;
    const files = e.dataTransfer?.files;
    if (files && files.length > 0) handleAdminFileUpload(files);
  }

  function formatDate(dateStr: string) {
    const date = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
    } else if (diffDays === 1) {
      return "Yesterday";
    } else if (diffDays < 7) {
      return date.toLocaleDateString("en-US", { weekday: "short" });
    }
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }

  function formatFullDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  }

  const filteredProjects = projects.filter((p) => {
    const matchesSearch = p.business_name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Show admin key prompt if not set
  if (!adminKey) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-foreground">Messages</h2>
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Admin Authentication</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Enter your admin key to access the messaging inbox.
            </p>
            <Input
              type="password"
              placeholder="Admin key"
              value={adminKey}
              onChange={(e) => setAdminKey(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAdminKeySubmit()}
            />
            <Button onClick={handleAdminKeySubmit} disabled={!adminKey.trim()}>
              Access Inbox
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-foreground">Messages</h2>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-green-600">
            Authenticated
          </Badge>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setAdminKey("");
              setProjects([]);
              setSelectedProject(null);
            }}
          >
            Logout
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-[calc(100vh-200px)]">
        {/* Inbox List */}
        <Card className="lg:col-span-1 flex flex-col">
          <CardHeader className="pb-3">
            <div className="space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search projects..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <div className="flex gap-1">
                {["all", "lead", "active", "delivered"].map((status) => (
                  <Button
                    key={status}
                    variant={statusFilter === status ? "default" : "outline"}
                    size="sm"
                    onClick={() => setStatusFilter(status)}
                    className="text-xs"
                  >
                    {status === "all" ? "All" : status}
                  </Button>
                ))}
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex-1 p-0">
            <ScrollArea className="h-full">
              {filteredProjects.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No projects found</p>
              ) : (
                <div className="divide-y">
                  {filteredProjects.map((project) => (
                    <button
                      key={project.project_token}
                      onClick={() => setSelectedProject(project)}
                      className={`w-full text-left p-4 hover:bg-muted/50 transition-colors ${
                        selectedProject?.project_token === project.project_token ? "bg-muted" : ""
                      }`}
                    >
                      <div className="flex items-start justify-between mb-1">
                        <span className="font-medium truncate">{project.business_name}</span>
                        {project.unread_count > 0 && (
                          <Badge variant="default" className="ml-2 text-xs">
                            {project.unread_count}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="text-xs">
                          {project.status}
                        </Badge>
                        {project.last_message && (
                          <span className="text-xs text-muted-foreground">
                            {formatDate(project.last_message.created_at)}
                          </span>
                        )}
                      </div>
                      {project.last_message && (
                        <p className="text-sm text-muted-foreground truncate">
                          {project.last_message.sender_type === "admin" ? "You: " : ""}
                          {project.last_message.content}
                        </p>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Conversation View */}
        <Card className="lg:col-span-2 flex flex-col">
          {!selectedProject ? (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Select a project to view messages</p>
              </div>
            </div>
          ) : (
            <>
              <CardHeader className="border-b">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>{selectedProject.business_name}</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Token: {selectedProject.project_token.slice(0, 12)}...
                    </p>
                  </div>
                  <Badge>{selectedProject.status}</Badge>
                </div>
              </CardHeader>

              <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "messages" | "notes" | "files")} className="flex-1 flex flex-col">
                <TabsList className="mx-4 mt-2 w-fit">
                  <TabsTrigger value="messages" className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    Messages
                  </TabsTrigger>
                  <TabsTrigger value="files" className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Files ({files.length})
                  </TabsTrigger>
                  <TabsTrigger value="notes" className="flex items-center gap-2">
                    <StickyNote className="h-4 w-4" />
                    Notes
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="messages" className="flex-1 flex flex-col m-0 p-0">
                  <CardContent className="flex-1 p-0 flex flex-col">
                    {/* Messages (oldest→newest, scroll to bottom) */}
                    <ScrollArea className="flex-1 p-4">
                      {loadingMessages ? (
                        <div className="flex justify-center py-8">
                          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        </div>
                      ) : messages.length === 0 ? (
                        <p className="text-center text-muted-foreground py-8">No messages yet</p>
                      ) : (
                        <div className="space-y-4">
                          {messages.map((msg) => (
                            <div
                              key={msg.id}
                              className={`p-4 rounded-lg ${
                                msg.sender_type === "admin"
                                  ? "bg-primary/10 border-l-4 border-primary ml-8"
                                  : "bg-muted mr-8"
                              }`}
                            >
                              <div className="flex justify-between items-start mb-2">
                                <Badge variant="outline" className="text-xs">
                                  {msg.sender_type === "admin" ? "You" : "Client"}
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                  {formatFullDate(msg.created_at)}
                                </span>
                              </div>
                              <p className="text-sm">{msg.content}</p>
                            </div>
                          ))}
                          <div ref={messagesEndRef} />
                        </div>
                      )}
                    </ScrollArea>

                    {/* Composer */}
                    <div className="border-t p-4 space-y-2">
                      <Textarea
                        placeholder="Type your reply..."
                        value={replyContent}
                        onChange={(e) => setReplyContent(e.target.value)}
                        disabled={sending}
                        className="min-h-[80px]"
                      />
                      <div className="flex justify-end">
                        <Button
                          onClick={handleSendReply}
                          disabled={sending || !replyContent.trim()}
                        >
                          {sending ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          ) : (
                            <Send className="h-4 w-4 mr-2" />
                          )}
                          Send Reply
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </TabsContent>

                <TabsContent value="notes" className="flex-1 flex flex-col m-0 p-0">
                  <CardContent className="flex-1 p-0 flex flex-col">
                    {/* Notes Composer */}
                    <div className="border-b p-4 space-y-2">
                      <Textarea
                        placeholder={editingNote ? "Edit your note..." : "Add an internal note..."}
                        value={noteContent}
                        onChange={(e) => setNoteContent(e.target.value)}
                        disabled={savingNote}
                        className="min-h-[80px]"
                      />
                      <div className="flex justify-end gap-2">
                        {editingNote && (
                          <Button variant="outline" onClick={handleCancelEdit}>
                            Cancel
                          </Button>
                        )}
                        <Button
                          onClick={handleSaveNote}
                          disabled={savingNote || !noteContent.trim()}
                        >
                          {savingNote ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          ) : (
                            <StickyNote className="h-4 w-4 mr-2" />
                          )}
                          {editingNote ? "Update Note" : "Add Note"}
                        </Button>
                      </div>
                    </div>

                    {/* Notes List */}
                    <ScrollArea className="flex-1 p-4">
                      {loadingNotes ? (
                        <div className="flex justify-center py-8">
                          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        </div>
                      ) : notes.length === 0 ? (
                        <p className="text-center text-muted-foreground py-8">
                          No internal notes yet. Notes are private and never shown to clients.
                        </p>
                      ) : (
                        <div className="space-y-4">
                          {notes.map((note) => (
                            <div
                              key={note.id}
                              className="p-4 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800"
                            >
                              <div className="flex justify-between items-start mb-2">
                                <span className="text-xs text-muted-foreground">
                                  {formatFullDate(note.created_at)}
                                  {note.updated_at !== note.created_at && " (edited)"}
                                </span>
                                <div className="flex gap-1">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleEditNote(note)}
                                    className="h-6 w-6 p-0"
                                  >
                                    <Edit2 className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDeleteNote(note.id)}
                                    className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                              <p className="text-sm whitespace-pre-wrap">{note.content}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </ScrollArea>
                  </CardContent>
                </TabsContent>

                <TabsContent value="files" className="flex-1 flex flex-col m-0 p-0">
                  <CardContent className="flex-1 p-0 flex flex-col">
                    {/* Upload Form with Drop Zone */}
                    <div
                      onDragOver={onDragOver}
                      onDragEnter={onDragEnter}
                      onDragLeave={onDragLeave}
                      onDrop={onDrop}
                      className={[
                        "border-b p-4 space-y-3 transition-colors",
                        uploading ? "opacity-60" : "",
                        isDragActive ? "bg-accent/20 border-accent" : "",
                      ].join(" ")}
                    >
                      <div className="flex items-center gap-2">
                        <Upload className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium text-sm">
                          {isDragActive ? "Drop files here..." : "Upload files to share with client"}
                        </span>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="admin-file-desc" className="text-sm">Description (optional)</Label>
                        <Input
                          id="admin-file-desc"
                          value={uploadDesc}
                          onChange={(e) => setUploadDesc(e.target.value)}
                          placeholder="e.g., Design mockup, contract..."
                          disabled={uploading}
                          className="text-sm"
                        />
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Label htmlFor="admin-file-upload" className="sr-only">Choose files</Label>
                        <Input
                          id="admin-file-upload"
                          type="file"
                          accept="image/*,application/pdf"
                          multiple
                          onChange={(e) => {
                            if (e.target.files && e.target.files.length > 0) {
                              handleAdminFileUpload(e.target.files);
                            }
                            e.currentTarget.value = "";
                          }}
                          disabled={uploading}
                          className="cursor-pointer text-sm"
                        />
                      </div>
                      
                      {/* Upload Queue Status */}
                      {uploadQueue.length > 0 && (
                        <div className="space-y-1">
                          {uploadQueue.map((item) => (
                            <div key={item.id} className="flex items-center gap-2 text-sm">
                              {item.status === 'uploading' && <Loader2 className="h-3 w-3 animate-spin" />}
                              {item.status === 'done' && <span className="text-green-500">✓</span>}
                              {item.status === 'error' && <span className="text-destructive">✗</span>}
                              {item.status === 'pending' && <span className="text-muted-foreground">○</span>}
                              <span className={item.status === 'error' ? 'text-destructive' : 'text-muted-foreground'}>
                                {item.name}
                                {item.error && ` - ${item.error}`}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      <p className="text-xs text-muted-foreground">
                        Drag & drop or click • Images + PDF • Max 10MB each
                      </p>
                    </div>

                    {/* Files List */}
                    <ScrollArea className="flex-1 p-4">
                      {files.length === 0 ? (
                        <p className="text-center text-muted-foreground py-8">
                          No files uploaded for this project yet.
                        </p>
                      ) : (
                        <div className="space-y-3">
                          {files.map((file) => {
                            const fileUrl = proxyMediaUrl(file.id, selectedProject?.project_token);
                            const isImage = isImageType(file.file_type);
                            
                            return (
                              <div key={file.id} className="p-3 bg-muted rounded-lg space-y-2">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <span className="text-lg">{getFileIcon(file.file_type)}</span>
                                    <div>
                                      <p className="font-medium">{file.file_name}</p>
                                      {file.description && (
                                        <p className="text-sm text-muted-foreground">{file.description}</p>
                                      )}
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Badge variant="outline">{file.file_type}</Badge>
                                    <a
                                      href={fileUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center justify-center h-8 w-8 rounded-md hover:bg-background transition-colors"
                                      title="Download"
                                    >
                                      <Download className="h-4 w-4" />
                                    </a>
                                  </div>
                                </div>
                                
                                {/* Image preview */}
                                {isImage && (
                                  <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="block">
                                    <img
                                      src={fileUrl}
                                      alt={file.file_name}
                                      className="max-h-48 rounded-md border border-border object-contain"
                                      loading="lazy"
                                    />
                                  </a>
                                )}
                                
                                <p className="text-xs text-muted-foreground">
                                  {formatFullDate(file.created_at)}
                                </p>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </ScrollArea>
                  </CardContent>
                </TabsContent>
              </Tabs>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
