import { ProblemForm } from "../_components/problem-form";
import { getEnabledAIProviders } from "@/lib/ai-providers/actions";

export default async function NewProblemPage() {
  const aiProviders = await getEnabledAIProviders();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Create Problem</h1>
        <p className="text-muted-foreground">
          Add a new coding problem for exams
        </p>
      </div>

      <ProblemForm aiProviders={aiProviders} />
    </div>
  );
}
