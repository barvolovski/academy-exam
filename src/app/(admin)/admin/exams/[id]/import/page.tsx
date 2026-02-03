import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { CSVUpload } from "@/components/admin/csv-upload";
import { headers } from "next/headers";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ImportCandidatesPage({ params }: PageProps) {
  const { id } = await params;

  const exam = await db.exam.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      accessCode: true,
    },
  });

  if (!exam) {
    notFound();
  }

  // Get base URL from headers
  const headersList = await headers();
  const host = headersList.get("host") || "localhost:3000";
  const protocol = headersList.get("x-forwarded-proto") || "http";
  const baseUrl = `${protocol}://${host}`;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/admin/exams/${id}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Import Candidates</h1>
          <p className="text-muted-foreground">{exam.title}</p>
        </div>
      </div>

      <div className="max-w-2xl">
        <CSVUpload examId={exam.id} baseUrl={baseUrl} />
      </div>

      <div className="max-w-2xl">
        <div className="p-4 bg-muted rounded-lg">
          <h3 className="font-medium mb-2">CSV Format</h3>
          <p className="text-sm text-muted-foreground mb-2">
            Your CSV file should have the following columns:
          </p>
          <pre className="text-sm bg-background p-3 rounded border">
            name,email{"\n"}
            John Doe,john@example.com{"\n"}
            Jane Smith,jane@example.com
          </pre>
        </div>
      </div>
    </div>
  );
}
