"use client";

import { Suspense } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { Clock, User, Activity, Filter } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingPage } from "@/components/ui/loading-spinner";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import Link from "next/link";

interface AuditLog {
  id: string;
  timestamp: string;
  user_email: string;
  action: string;
  resource_type: string;
  resource_id: string;
  details: Record<string, unknown>;
  ip_address: string;
}

const actionBadgeVariant = (action: string) => {
  if (action.includes("create")) return "success";
  if (action.includes("delete")) return "error";
  if (action.includes("update")) return "warning";
  return "default";
};

function AuditLogPageContent() {
  const searchParams = useSearchParams();
  const projectId = searchParams.get("project") || "";
  const [actionFilter, setActionFilter] = useState<string>("all");
  const [resourceFilter, setResourceFilter] = useState<string>("all");

  // TODO: Replace with actual API call
  const { data: logs, isLoading } = useQuery({
    queryKey: ["audit-logs", projectId, actionFilter, resourceFilter],
    queryFn: async () => {
      // Placeholder - replace with actual API
      return [] as AuditLog[];
    },
    enabled: !!projectId,
  });

  if (isLoading) {
    return <LoadingPage />;
  }

  if (!projectId) {
    return (
      <EmptyState
        icon={<Activity size={28} className="text-zinc-400" />}
        title="No project selected"
        description="Select a project to view audit logs."
        action={
          <Link href="/settings">
            <Button>Go to Settings</Button>
          </Link>
        }
      />
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900">Audit Log</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Track all changes and activities in this project
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Activity History</CardTitle>
              <CardDescription>
                All actions are logged for security and compliance
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Select value={actionFilter} onValueChange={setActionFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="All actions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All actions</SelectItem>
                  <SelectItem value="create">Create</SelectItem>
                  <SelectItem value="update">Update</SelectItem>
                  <SelectItem value="delete">Delete</SelectItem>
                  <SelectItem value="invite">Invite</SelectItem>
                </SelectContent>
              </Select>

              <Select value={resourceFilter} onValueChange={setResourceFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="All resources" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All resources</SelectItem>
                  <SelectItem value="project">Project</SelectItem>
                  <SelectItem value="environment">Environment</SelectItem>
                  <SelectItem value="api_key">API Key</SelectItem>
                  <SelectItem value="member">Member</SelectItem>
                  <SelectItem value="replay">Replay</SelectItem>
                  <SelectItem value="schema">Schema</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {!logs || logs.length === 0 ? (
            <EmptyState
              icon={<Activity size={28} className="text-zinc-400" />}
              title="No audit logs yet"
              description="Activity will appear here as you use TVC."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Resource</TableHead>
                  <TableHead>Details</TableHead>
                  <TableHead>IP Address</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="text-zinc-500">
                      <div className="flex items-center gap-1.5">
                        <Clock size={14} />
                        {new Date(log.timestamp).toLocaleString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <User size={14} className="text-zinc-400" />
                        <span className="font-medium">{log.user_email}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={actionBadgeVariant(log.action)}>
                        {log.action}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="capitalize">
                        {log.resource_type.replace("_", " ")}
                      </span>
                      <code className="ml-2 text-xs text-zinc-400">
                        {log.resource_id.slice(0, 8)}
                      </code>
                    </TableCell>
                    <TableCell className="max-w-xs truncate text-sm text-zinc-600">
                      {JSON.stringify(log.details)}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-zinc-400">
                      {log.ip_address}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Retention Policy</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-zinc-600">
          <p>
            Audit logs are retained for 90 days. Logs older than 90 days are
            automatically archived and can be exported upon request.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export default function AuditLogPage() {
  return (
    <Suspense fallback={<LoadingPage />}>
      <AuditLogPageContent />
    </Suspense>
  );
}
