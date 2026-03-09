import { cn } from "@/lib/utils";
import { type HTMLAttributes } from "react";

type Variant =
  | "default"
  | "success"
  | "warning"
  | "error"
  | "info"
  | "secondary";

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: Variant;
}

const variantStyles: Record<Variant, string> = {
  default: "bg-zinc-100 text-zinc-700",
  success: "bg-emerald-50 text-emerald-700",
  warning: "bg-amber-50 text-amber-700",
  error: "bg-red-50 text-red-700",
  info: "bg-blue-50 text-blue-700",
  secondary: "bg-zinc-50 text-zinc-500",
};

export function Badge({
  variant = "default",
  className,
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        variantStyles[variant],
        className,
      )}
      {...props}
    />
  );
}

// Specialized badge variants
export function MethodBadge({ method }: { method: string }) {
  const variants: Record<string, Variant> = {
    GET: "info",
    POST: "success",
    PUT: "warning",
    PATCH: "warning",
    DELETE: "error",
  };

  return (
    <Badge variant={variants[method] || "default"} className="font-mono">
      {method}
    </Badge>
  );
}

export function StatusBadge({ status }: { status: number }) {
  let variant: Variant = "default";

  if (status >= 200 && status < 300) variant = "success";
  else if (status >= 300 && status < 400) variant = "info";
  else if (status >= 400 && status < 500) variant = "warning";
  else if (status >= 500) variant = "error";

  return (
    <Badge variant={variant} className="font-mono">
      {status}
    </Badge>
  );
}

export function SeverityBadge({
  severity,
}: {
  severity: "critical" | "major" | "minor" | "none";
}) {
  const variants: Record<string, Variant> = {
    critical: "error",
    major: "warning",
    minor: "info",
    none: "success",
  };

  return (
    <Badge variant={variants[severity]} className="capitalize">
      {severity}
    </Badge>
  );
}
