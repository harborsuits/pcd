import { useState } from "react";
import { CheckCircle2, Clock, Rocket, Settings2, Phone, AlertCircle, Upload, FileText, Calendar, ClipboardList, Palette, MapPin, Image, CreditCard, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import type { LucideIcon } from "lucide-react";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

interface UpdatesTabProps {
  projectStatus: 'lead' | 'contacted' | 'interested' | 'client' | 'completed' | 'archived' | null;
  intakeStatus: 'draft' | 'submitted' | 'approved' | null;
  portalStage: string;
  serviceType: 'website' | 'ai_receptionist' | 'both' | 'demo' | null;
  aiStatus: 'intake_received' | 'review' | 'setup' | 'testing' | 'live' | 'paused' | null;
  hasVersions: boolean;
  businessName: string;
  needsInfo?: boolean;
  needsInfoItems?: { key: string; label: string }[];
  needsInfoNote?: string | null;
  depositStatus?: 'pending' | 'paid' | 'skipped' | null;
  isAITrial?: boolean;
  projectToken?: string;
  onRequestChange?: () => void;
  onUploadFiles?: () => void;
}

// Icon mapping for info items
const INFO_ICONS: Record<string, LucideIcon> = {
  logo: Palette,
  photos: Image,
  services: ClipboardList,
  service_area: MapPin,
  contact: Phone,
  booking: Calendar,
  brand_colors: Palette,
};

type AIStatusKey = 'intake_received' | 'review' | 'setup' | 'testing' | 'live' | 'paused';

function getAIStatusConfig(status: string | null): { 
  label: string; 
  Icon: typeof Clock; 
  colorClass: string; 
  headline: string;
  description: string;
  progressStep: number;
} {
  const configs: Record<AIStatusKey, ReturnType<typeof getAIStatusConfig>> = {
    intake_received: {
      label: "Received",
      Icon: Clock,
      colorClass: "bg-amber-500/10 text-amber-600 border-amber-200",
      headline: "We've received your setup",
      description: "Your AI receptionist configuration is in our queue. We'll start reviewing it shortly.",
      progressStep: 1,
    },
    review: {
      label: "Under Review",
      Icon: Clock,
      colorClass: "bg-amber-500/10 text-amber-600 border-amber-200",
      headline: "We're reviewing your configuration",
      description: "We're verifying your settings and phone number to make sure everything is correct.",
      progressStep: 2,
    },
    setup: {
      label: "Setting Up",
      Icon: Settings2,
      colorClass: "bg-blue-500/10 text-blue-600 border-blue-200",
      headline: "We're configuring your AI",
      description: "We're programming the AI with your business rules, FAQs, and preferences.",
      progressStep: 3,
    },
    testing: {
      label: "Testing",
      Icon: Phone,
      colorClass: "bg-purple-500/10 text-purple-600 border-purple-200",
      headline: "Testing in progress",
      description: "We're running sample calls to ensure everything works perfectly before going live.",
      progressStep: 4,
    },
    live: {
      label: "Live",
      Icon: CheckCircle2,
      colorClass: "bg-green-500/10 text-green-600 border-green-200",
      headline: "Your AI receptionist is live!",
      description: "Calls are being answered. You'll receive leads and summaries automatically.",
      progressStep: 5,
    },
    paused: {
      label: "Paused",
      Icon: AlertCircle,
      colorClass: "bg-muted text-muted-foreground border-border",
      headline: "Service paused",
      description: "Your AI receptionist is temporarily paused. Contact us to resume.",
      progressStep: 0,
    },
  };

  const key = (status as AIStatusKey) || 'intake_received';
  return configs[key] || configs.intake_received;
}

function getWebsiteStatusConfig(intakeStatus: string | null, hasVersions: boolean) {
  if (hasVersions) {
    return {
      label: "Preview Ready",
      Icon: Rocket,
      headline: "Your first preview is ready!",
      description: "Check the Website tab to view and leave feedback.",
      progressStep: 3,
    };
  }
  
  switch (intakeStatus) {
    case "approved":
      return {
        label: "Building",
        Icon: Settings2,
        headline: "We're building your site",
        description: "Your intake is approved and we're working on your first preview.",
        progressStep: 2,
      };
    case "submitted":
    default:
      return {
        label: "Under Review",
        Icon: Clock,
        headline: "Intake received",
        description: "We're reviewing your intake and will start building soon.",
        progressStep: 1,
      };
  }
}

export function UpdatesTab({
  intakeStatus,
  serviceType,
  aiStatus,
  hasVersions,
  businessName,
  needsInfo,
  needsInfoItems = [],
  needsInfoNote,
  depositStatus,
  isAITrial = false,
  projectToken,
  onRequestChange,
  onUploadFiles,
}: UpdatesTabProps) {
  const [isLoadingDeposit, setIsLoadingDeposit] = useState(false);
  
  const includesWebsite = serviceType === 'website' || serviceType === 'both';
  const includesAI = serviceType === 'ai_receptionist' || serviceType === 'both';
  
  // Don't show deposit CTA for free demos/trials
  const isFreeDemo = isAITrial || serviceType === 'demo';
  const showDepositCta = !isFreeDemo && (depositStatus === 'pending' || depositStatus === 'skipped');
  
  const websiteConfig = getWebsiteStatusConfig(intakeStatus, hasVersions);
  const aiConfig = getAIStatusConfig(aiStatus);
  
  const handlePayDeposit = async () => {
    if (!projectToken) return;
    setIsLoadingDeposit(true);
    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/create-deposit-checkout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({
          project_token: projectToken,
          success_url: `${window.location.origin}/w/${projectToken}?tab=updates&deposit=paid`,
          cancel_url: `${window.location.origin}/w/${projectToken}?tab=updates&deposit=cancelled`,
        }),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || "Failed to create checkout");
      }
      
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      console.error("Deposit checkout error:", err);
      toast.error("Something went wrong. Please try again or contact us.");
    } finally {
      setIsLoadingDeposit(false);
    }
  };
  
  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        {/* Deposit CTA Banner */}
        {showDepositCta && (
          <div className="border border-blue-200 bg-blue-50 dark:bg-blue-950/30 rounded-xl p-5">
            <div className="flex items-start gap-3">
              <div className="h-8 w-8 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                <CreditCard className="h-4 w-4 text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-blue-800 dark:text-blue-300">Complete your deposit</h3>
                <p className="text-sm text-blue-700 dark:text-blue-400 mb-3">
                  Secure your spot and we'll start building right away. Your deposit is applied to your final balance.
                </p>
                <Button 
                  onClick={handlePayDeposit}
                  disabled={isLoadingDeposit}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                  size="sm"
                >
                  {isLoadingDeposit ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Redirecting...
                    </>
                  ) : (
                    <>
                      <CreditCard className="h-4 w-4 mr-2" />
                      Pay Deposit Now
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Project header */}
        <div className="text-center mb-8">
          <h1 className="font-serif text-2xl font-bold mb-2">{businessName}</h1>
          <p className="text-muted-foreground text-sm">
            {serviceType === 'both' ? 'Website + AI Receptionist' : 
             serviceType === 'ai_receptionist' ? 'AI Receptionist' : 'Website'}
          </p>
        </div>

        {/* Action Needed Banner */}
        {needsInfo && needsInfoItems.length > 0 && (
          <div className="border border-amber-200 bg-amber-50 dark:bg-amber-950/30 rounded-xl p-5">
            <div className="flex items-start gap-3">
              <div className="h-8 w-8 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                <AlertCircle className="h-4 w-4 text-amber-600" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-amber-800 dark:text-amber-300">Action Needed</h3>
                <p className="text-sm text-amber-700 dark:text-amber-400 mb-3">
                  {needsInfoNote || "We need a couple things before we can continue building."}
                </p>
                <div className="flex flex-wrap gap-2">
                  {needsInfoItems.map((item) => {
                    const ItemIcon = INFO_ICONS[item.key] || Upload;
                    return (
                      <div
                        key={item.key}
                        className="flex items-center gap-2 bg-white dark:bg-background border border-amber-200 dark:border-amber-800 rounded-lg px-3 py-1.5 text-sm"
                      >
                        <ItemIcon className="h-3.5 w-3.5 text-amber-600" />
                        <span>{item.label}</span>
                      </div>
                    );
                  })}
                </div>
                {onUploadFiles && (
                  <Button onClick={onUploadFiles} className="mt-4" size="sm">
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Files
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Website Progress Card */}
        {includesWebsite && (
          <div className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-start gap-4">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                hasVersions ? 'bg-green-500/10 text-green-600' : 'bg-primary/10 text-primary'
              }`}>
                <websiteConfig.Icon className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold">Website</h3>
                  <Badge variant="outline" className={hasVersions ? 'bg-green-500/10 text-green-600 border-green-200' : 'bg-amber-500/10 text-amber-600 border-amber-200'}>
                    {websiteConfig.label}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  {websiteConfig.description}
                </p>
                
                {/* Progress steps */}
                <div className="space-y-2">
                  {[
                    { step: 1, label: "Intake received" },
                    { step: 2, label: "Building your site" },
                    { step: 3, label: "Preview ready" },
                  ].map(({ step, label }) => (
                    <div key={step} className="flex items-center gap-2 text-sm">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-medium ${
                        step < websiteConfig.progressStep 
                          ? 'bg-green-500 text-white' 
                          : step === websiteConfig.progressStep 
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted-foreground/20 text-muted-foreground'
                      }`}>
                        {step < websiteConfig.progressStep ? '✓' : step}
                      </div>
                      <span className={step <= websiteConfig.progressStep ? 'text-foreground' : 'text-muted-foreground'}>
                        {label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* AI Receptionist Progress Card */}
        {includesAI && (
          <div className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-start gap-4">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                aiStatus === 'live' ? 'bg-green-500/10 text-green-600' : 'bg-primary/10 text-primary'
              }`}>
                <aiConfig.Icon className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold">AI Receptionist</h3>
                  <Badge variant="outline" className={aiConfig.colorClass}>
                    {aiConfig.label}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  {aiConfig.description}
                </p>
                
                {/* Progress steps */}
                {aiStatus !== 'live' && aiStatus !== 'paused' && (
                  <div className="space-y-2">
                    {[
                      { step: 1, label: "Intake received" },
                      { step: 2, label: "Configuration review" },
                      { step: 3, label: "AI setup" },
                      { step: 4, label: "Testing" },
                      { step: 5, label: "Live!" },
                    ].map(({ step, label }) => (
                      <div key={step} className="flex items-center gap-2 text-sm">
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-medium ${
                          step < aiConfig.progressStep 
                            ? 'bg-green-500 text-white' 
                            : step === aiConfig.progressStep 
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted-foreground/20 text-muted-foreground'
                        }`}>
                          {step < aiConfig.progressStep ? '✓' : step}
                        </div>
                        <span className={step <= aiConfig.progressStep ? 'text-foreground' : 'text-muted-foreground'}>
                          {label}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Live status */}
                {aiStatus === 'live' && (
                  <div className="bg-green-500/5 border border-green-200 dark:border-green-800 rounded-lg p-3 text-sm">
                    <p className="text-green-700 dark:text-green-400">
                      🎉 Your AI receptionist is actively answering calls!
                    </p>
                  </div>
                )}

                {onRequestChange && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-4 gap-2"
                    onClick={onRequestChange}
                  >
                    <AlertCircle className="h-4 w-4" />
                    Request a change
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Quick actions */}
        <div className="bg-muted/40 rounded-xl p-5">
          <h3 className="font-medium mb-3 flex items-center gap-2">
            <FileText className="h-4 w-4 text-muted-foreground" />
            Quick actions
          </h3>
          <div className="flex flex-wrap gap-2">
            {onUploadFiles && (
              <Button variant="outline" size="sm" onClick={onUploadFiles}>
                <Upload className="h-4 w-4 mr-2" />
                Upload files
              </Button>
            )}
            {onRequestChange && (
              <Button variant="outline" size="sm" onClick={onRequestChange}>
                <AlertCircle className="h-4 w-4 mr-2" />
                Request a change
              </Button>
            )}
          </div>
        </div>

        {/* Footer note */}
        <p className="text-center text-xs text-muted-foreground">
          Questions? Just reply to any email from us, or leave a message in the Messages tab.
        </p>
      </div>
    </div>
  );
}
