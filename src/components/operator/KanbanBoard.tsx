import * as React from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
} from "@dnd-kit/core";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { 
  ExternalLink, 
  GripVertical, 
  CheckCircle2, 
  Circle, 
  AlertCircle, 
  User,
  Building2
} from "lucide-react";
import { STAGE_CONFIG, PipelineStage, STAGE_ORDER, ServiceType, SERVICE_TYPE_CONFIG } from "@/components/operator/StageBadge";

export interface KanbanProject {
  id: string;
  token: string;
  business_name: string;
  contact_name: string | null;
  contact_email: string | null;
  pipeline_stage: PipelineStage;
  service_type: ServiceType;
  phase_b_status?: "pending" | "in_progress" | "complete" | null;
  phase_b_progress?: { completed: number; total: number };
}

interface ProjectCardProps {
  project: KanbanProject;
  isDragging?: boolean;
  onOpenWorkSurface: (token: string) => void;
  onOpenPortal: (token: string) => void;
}

function ProjectCard({ project, isDragging, onOpenWorkSurface, onOpenPortal }: ProjectCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: project.token,
  });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "bg-card border rounded-lg p-3 shadow-sm group",
        isDragging && "opacity-50 shadow-lg ring-2 ring-primary"
      )}
    >
      <div className="flex items-start gap-2">
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing p-1 -ml-1 text-muted-foreground hover:text-foreground"
        >
          <GripVertical className="h-4 w-4" />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="font-medium text-sm truncate flex items-center gap-1.5">
                <Building2 className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                {String(project.business_name || '')}
              </p>
              <div className="flex items-center gap-1.5 mt-0.5">
                {project.contact_name && (
                  <span className="text-xs text-muted-foreground truncate flex items-center gap-1">
                    <User className="h-3 w-3" />
                    {String(project.contact_name)}
                  </span>
                )}
                <span className="text-xs" title={SERVICE_TYPE_CONFIG[project.service_type]?.label}>
                  {SERVICE_TYPE_CONFIG[project.service_type]?.icon || "🌐"}
                </span>
              </div>
            </div>
          </div>

          {/* Phase B Status */}
          <div className="mt-2">
            {project.phase_b_status === "complete" ? (
              <span className="inline-flex items-center gap-1 text-xs text-green-600 bg-green-500/10 px-2 py-0.5 rounded-full">
                <CheckCircle2 className="h-3 w-3" />
                Setup Complete
              </span>
            ) : project.phase_b_status === "in_progress" || (project.phase_b_progress?.completed || 0) > 0 ? (
              <span className="inline-flex items-center gap-1 text-xs text-amber-600 bg-amber-500/10 px-2 py-0.5 rounded-full">
                <Circle className="h-3 w-3" />
                Setup: {project.phase_b_progress?.completed || 0}/4
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-full">
                <AlertCircle className="h-3 w-3" />
                Awaiting Setup
              </span>
            )}
          </div>

          {/* Actions */}
          <div className="mt-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-xs"
              onClick={(e) => {
                e.stopPropagation();
                onOpenWorkSurface(project.token);
              }}
            >
              Open
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-xs"
              onClick={(e) => {
                e.stopPropagation();
                onOpenPortal(project.token);
              }}
            >
              <ExternalLink className="h-3 w-3 mr-1" />
              Portal
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function DroppableColumn({ 
  stage, 
  projects,
  onOpenWorkSurface,
  onOpenPortal,
}: { 
  stage: PipelineStage; 
  projects: KanbanProject[];
  onOpenWorkSurface: (token: string) => void;
  onOpenPortal: (token: string) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: `col:${stage}`,
  });

  const stageConfig = STAGE_CONFIG[stage];

  return (
    <div
      className={cn(
        "flex flex-col w-64 shrink-0 bg-muted/30 rounded-lg border",
        isOver && "ring-2 ring-primary bg-primary/5"
      )}
    >
      {/* Column Header */}
      <div className="p-3 border-b flex items-center justify-between">
        <h3 className="font-medium text-sm">{stageConfig?.label || stage}</h3>
        <Badge variant="secondary" className="text-xs">
          {projects.length}
        </Badge>
      </div>

      {/* Cards */}
      <div
        ref={setNodeRef}
        className="flex-1 p-2 space-y-2 overflow-y-auto min-h-[200px] max-h-[calc(100vh-350px)]"
      >
        {projects.map((project) => (
          <ProjectCard
            key={project.token}
            project={project}
            onOpenWorkSurface={onOpenWorkSurface}
            onOpenPortal={onOpenPortal}
          />
        ))}
        {projects.length === 0 && (
          <div className="text-center py-8 text-muted-foreground text-xs">
            No projects
          </div>
        )}
      </div>
    </div>
  );
}

export interface KanbanBoardProps {
  projects: KanbanProject[];
  onStageChange: (token: string, newStage: PipelineStage) => Promise<void>;
  onOpenWorkSurface: (token: string) => void;
  onOpenPortal: (token: string) => void;
}

export function KanbanBoard({
  projects,
  onStageChange,
  onOpenWorkSurface,
  onOpenPortal,
}: KanbanBoardProps) {
  const [activeId, setActiveId] = React.useState<string | null>(null);
  
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  // Group projects by stage
  const projectsByStage = React.useMemo(() => {
    const map: Record<PipelineStage, KanbanProject[]> = {} as Record<PipelineStage, KanbanProject[]>;
    for (const stage of STAGE_ORDER) {
      map[stage] = [];
    }
    // Also add terminal stage
    map["closed"] = [];
    
    for (const project of projects) {
      const stage = project.pipeline_stage || "new";
      if (map[stage]) {
        map[stage].push(project);
      } else {
        map["new"].push(project);
      }
    }
    return map;
  }, [projects]);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveId(null);
    
    const { active, over } = event;
    if (!over) return;

    const token = active.id as string;
    const overId = over.id as string;

    // Check if dropping on a column
    if (!overId.startsWith("col:")) return;
    
    const newStage = overId.replace("col:", "") as PipelineStage;
    const project = projects.find((p) => p.token === token);
    
    if (!project) return;
    if (project.pipeline_stage === newStage) return;

    await onStageChange(token, newStage);
  };

  const activeProject = activeId ? projects.find((p) => p.token === activeId) : null;

  // Show all stages including closed
  const visibleStages: PipelineStage[] = [...STAGE_ORDER, "closed"];

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-3 overflow-x-auto pb-4 px-1">
        {visibleStages.map((stage) => (
          <DroppableColumn
            key={stage}
            stage={stage}
            projects={projectsByStage[stage] || []}
            onOpenWorkSurface={onOpenWorkSurface}
            onOpenPortal={onOpenPortal}
          />
        ))}
      </div>

      <DragOverlay>
        {activeProject && (
          <div className="bg-card border rounded-lg p-3 shadow-lg ring-2 ring-primary w-60 opacity-90">
            <p className="font-medium text-sm truncate">{activeProject.business_name}</p>
            {activeProject.contact_name && (
              <p className="text-xs text-muted-foreground truncate">{activeProject.contact_name}</p>
            )}
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}
