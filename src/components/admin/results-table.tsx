"use client";

import Link from "next/link";
import { useState } from "react";
import { AlertTriangle, ArrowUpDown } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";

export interface ResultsTableProps {
  results: Array<{
    id: string;
    candidateName: string;
    candidateEmail: string;
    totalScore: number | null;
    maxScore: number;
    status: string;
    submittedAt: Date | null;
    proctorFlags: number;
  }>;
}

type SortField = "candidateName" | "totalScore" | "status" | "submittedAt" | "proctorFlags";
type SortDirection = "asc" | "desc";

function getStatusBadgeVariant(status: string): "default" | "secondary" | "destructive" {
  switch (status) {
    case "submitted":
      return "default";
    case "in_progress":
      return "secondary";
    case "timed_out":
      return "destructive";
    default:
      return "secondary";
  }
}

function formatStatus(status: string): string {
  switch (status) {
    case "in_progress":
      return "In Progress";
    case "timed_out":
      return "Timed Out";
    default:
      return status.charAt(0).toUpperCase() + status.slice(1);
  }
}

export function ResultsTable({ results }: ResultsTableProps) {
  const [sortField, setSortField] = useState<SortField>("submittedAt");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const sortedResults = [...results].sort((a, b) => {
    const direction = sortDirection === "asc" ? 1 : -1;

    switch (sortField) {
      case "candidateName":
        return direction * a.candidateName.localeCompare(b.candidateName);
      case "totalScore": {
        const scoreA = a.totalScore ?? -1;
        const scoreB = b.totalScore ?? -1;
        return direction * (scoreA - scoreB);
      }
      case "status":
        return direction * a.status.localeCompare(b.status);
      case "submittedAt": {
        const dateA = a.submittedAt?.getTime() ?? 0;
        const dateB = b.submittedAt?.getTime() ?? 0;
        return direction * (dateA - dateB);
      }
      case "proctorFlags":
        return direction * (a.proctorFlags - b.proctorFlags);
      default:
        return 0;
    }
  });

  const SortableHeader = ({
    field,
    children,
  }: {
    field: SortField;
    children: React.ReactNode;
  }) => (
    <TableHead
      className="cursor-pointer select-none hover:bg-muted/50"
      onClick={() => handleSort(field)}
    >
      <div className="flex items-center gap-1">
        {children}
        <ArrowUpDown className="h-4 w-4" />
      </div>
    </TableHead>
  );

  if (results.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No results found.
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <SortableHeader field="candidateName">Name</SortableHeader>
          <TableHead>Email</TableHead>
          <SortableHeader field="totalScore">Score</SortableHeader>
          <SortableHeader field="status">Status</SortableHeader>
          <SortableHeader field="submittedAt">Submitted</SortableHeader>
          <SortableHeader field="proctorFlags">Flags</SortableHeader>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sortedResults.map((result) => (
          <TableRow key={result.id}>
            <TableCell className="font-medium">{result.candidateName}</TableCell>
            <TableCell className="text-muted-foreground">
              {result.candidateEmail}
            </TableCell>
            <TableCell>
              {result.totalScore !== null ? (
                <span>
                  {result.totalScore} / {result.maxScore}
                  <span className="ml-2 text-muted-foreground text-sm">
                    ({((result.totalScore / result.maxScore) * 100).toFixed(0)}%)
                  </span>
                </span>
              ) : (
                <span className="text-muted-foreground">-</span>
              )}
            </TableCell>
            <TableCell>
              <Badge variant={getStatusBadgeVariant(result.status)}>
                {formatStatus(result.status)}
              </Badge>
            </TableCell>
            <TableCell className="text-muted-foreground">
              {result.submittedAt ? formatDate(result.submittedAt) : "-"}
            </TableCell>
            <TableCell>
              <div className="flex items-center gap-1">
                {result.proctorFlags > 3 && (
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                )}
                <span className={result.proctorFlags > 3 ? "text-amber-500 font-medium" : ""}>
                  {result.proctorFlags}
                </span>
              </div>
            </TableCell>
            <TableCell>
              <Link
                href={`/admin/results/${result.id}`}
                className="text-sm text-primary hover:underline"
              >
                View Details
              </Link>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
