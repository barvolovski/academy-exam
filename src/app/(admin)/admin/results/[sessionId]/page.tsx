import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Clock, AlertTriangle } from "lucide-react";
import { getSessionDetail } from "@/lib/results/queries";
import { CodeViewer, ProctorTimeline } from "@/components/admin";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatDate } from "@/lib/utils";

interface SessionDetailPageProps {
  params: Promise<{ sessionId: string }>;
}

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

function calculateTimeTaken(startedAt: Date, submittedAt: Date | null): string {
  if (!submittedAt) {
    return "In progress";
  }
  const diffMs = submittedAt.getTime() - startedAt.getTime();
  const minutes = Math.floor(diffMs / 60000);
  const seconds = Math.floor((diffMs % 60000) / 1000);
  return `${minutes}m ${seconds}s`;
}

export default async function SessionDetailPage({ params }: SessionDetailPageProps) {
  const { sessionId } = await params;
  const session = await getSessionDetail(sessionId);

  if (!session) {
    notFound();
  }

  const maxScore = session.submissions.reduce((sum, s) => sum + s.points, 0);
  const timeTaken = calculateTimeTaken(session.startedAt, session.submittedAt);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href={`/admin/results?examId=${session.exam.id}`}
          className="text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold">{session.candidateName}</h1>
          <p className="text-muted-foreground">{session.candidateEmail}</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {session.totalScore ?? "-"} / {maxScore}
            </div>
            {session.totalScore !== null && maxScore > 0 && (
              <p className="text-sm text-muted-foreground">
                {((session.totalScore / maxScore) * 100).toFixed(0)}%
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant={getStatusBadgeVariant(session.status)}>
              {formatStatus(session.status)}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Time Taken
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-lg font-medium">{timeTaken}</span>
            </div>
            <p className="text-sm text-muted-foreground">
              of {session.exam.durationMinutes}m allowed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Proctor Flags
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              {session.proctorEvents.length > 3 && (
                <AlertTriangle className="h-4 w-4 text-amber-500" />
              )}
              <span
                className={`text-2xl font-bold ${
                  session.proctorEvents.length > 3 ? "text-amber-500" : ""
                }`}
              >
                {session.proctorEvents.length}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">events recorded</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Exam: {session.exam.title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground space-y-1">
            <p>Started: {formatDate(session.startedAt)}</p>
            {session.submittedAt && (
              <p>Submitted: {formatDate(session.submittedAt)}</p>
            )}
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="submissions" className="space-y-4">
        <TabsList>
          <TabsTrigger value="submissions">
            Submissions ({session.submissions.length})
          </TabsTrigger>
          <TabsTrigger value="proctor">
            Proctor Events ({session.proctorEvents.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="submissions" className="space-y-4">
          {session.submissions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No submissions recorded.
            </div>
          ) : (
            session.submissions.map((submission) => (
              <Card key={submission.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">
                      {submission.problemTitle}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={
                          submission.status === "passed"
                            ? "default"
                            : submission.status === "failed"
                            ? "destructive"
                            : "secondary"
                        }
                      >
                        {submission.status}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {submission.points} pts
                      </span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <CodeViewer
                    code={submission.code}
                    language={submission.language}
                    testResults={submission.testResults}
                  />
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="proctor">
          <Card>
            <CardHeader>
              <CardTitle>Proctor Event Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <ProctorTimeline events={session.proctorEvents} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
