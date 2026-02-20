import { cn } from "@/lib/utils";
import { type ReactNode } from "react";

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-20",
        className,
      )}
    >
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-100">
        {icon}
      </div>
      <h2 className="text-lg font-semibold text-zinc-900">{title}</h2>
      <p className="mt-1 max-w-sm text-center text-sm text-zinc-500">
        {description}
      </p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
