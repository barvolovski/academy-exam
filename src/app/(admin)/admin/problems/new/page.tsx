import { ProblemForm } from "../_components/problem-form";

export default function NewProblemPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Create Problem</h1>
        <p className="text-muted-foreground">
          Add a new coding problem for exams
        </p>
      </div>

      <ProblemForm />
    </div>
  );
}
