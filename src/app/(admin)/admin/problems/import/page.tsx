import Link from "next/link";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { loadLeetCodeProblems } from "@/lib/leetcode/loader";
import { LeetCodeBrowser } from "./_components/leetcode-browser";
import { UrlImport } from "./_components/url-import";

export default async function ImportPage() {
  const problems = await loadLeetCodeProblems();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Import from LeetCode</h1>
          <p className="text-muted-foreground mt-1">
            Import problems from LeetCode with test cases
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/admin/problems">Back to Problems</Link>
        </Button>
      </div>

      <Tabs defaultValue="browse">
        <TabsList>
          <TabsTrigger value="browse">Browse Catalog</TabsTrigger>
          <TabsTrigger value="url">Import by URL</TabsTrigger>
        </TabsList>

        <TabsContent value="browse" className="mt-4">
          <LeetCodeBrowser initialProblems={problems} />
        </TabsContent>

        <TabsContent value="url" className="mt-4">
          <UrlImport />
        </TabsContent>
      </Tabs>
    </div>
  );
}
