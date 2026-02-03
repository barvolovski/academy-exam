import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { ProblemForm } from "../_components/problem-form";
import { getEnabledAIProviders } from "@/lib/ai-providers/actions";
import type { StarterCode, TestCase } from "@/lib/problems/schemas";

interface EditProblemPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditProblemPage({ params }: EditProblemPageProps) {
  const { id } = await params;

  const [problem, aiProviders] = await Promise.all([
    db.problem.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        description: true,
        difficulty: true,
        starterCode: true,
        testCases: true,
        timeLimitMs: true,
        memoryLimitKb: true,
        aiEnabled: true,
        aiProviderId: true,
        aiSystemPrompt: true,
        aiMaxMessages: true,
      },
    }),
    getEnabledAIProviders(),
  ]);

  if (!problem) {
    notFound();
  }

  const initialData = {
    id: problem.id,
    title: problem.title,
    description: problem.description,
    difficulty: problem.difficulty,
    starterCode: problem.starterCode as StarterCode,
    testCases: problem.testCases as TestCase[],
    timeLimitMs: problem.timeLimitMs,
    memoryLimitKb: problem.memoryLimitKb,
    aiEnabled: problem.aiEnabled,
    aiProviderId: problem.aiProviderId,
    aiSystemPrompt: problem.aiSystemPrompt,
    aiMaxMessages: problem.aiMaxMessages,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Edit Problem</h1>
        <p className="text-muted-foreground">
          Update the coding problem details
        </p>
      </div>

      <ProblemForm initialData={initialData} aiProviders={aiProviders} />
    </div>
  );
}
