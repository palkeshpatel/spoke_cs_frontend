import { Link, useLocation } from "react-router-dom";
import { ShieldOff, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getRequiredPermissionForPath } from "@/lib/permissions";

export default function Unauthorized() {
  const location = useLocation();
  const requiredPermission = getRequiredPermissionForPath(location.pathname);

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="max-w-md w-full text-center space-y-6 p-8">
        <div className="mx-auto w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
          <ShieldOff className="h-8 w-8 text-destructive" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-foreground">You are not authorized</h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Your role does not have permission to access this page.
            {requiredPermission ? (
              <> Required access: <span className="font-medium text-foreground">{requiredPermission.replace(/_/g, " ")}</span>.</>
            ) : null}
          </p>
        </div>
        <Button asChild className="h-11 px-8">
          <Link to="/">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Link>
        </Button>
      </div>
    </div>
  );
}
