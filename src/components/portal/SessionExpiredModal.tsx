import { useNavigate } from "react-router-dom";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { LogIn } from "lucide-react";
import { storeAuthReturnPath } from "@/hooks/useSessionExpiry";

interface SessionExpiredModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SessionExpiredModal({ open, onOpenChange }: SessionExpiredModalProps) {
  const navigate = useNavigate();

  const handleSignIn = () => {
    storeAuthReturnPath();
    onOpenChange(false);
    navigate("/portal");
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="sm:max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <LogIn className="h-5 w-5" />
            Session Expired
          </AlertDialogTitle>
          <AlertDialogDescription>
            Your session has expired. Please sign in again to continue working on your project.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction onClick={handleSignIn} className="w-full sm:w-auto">
            Sign in again
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
