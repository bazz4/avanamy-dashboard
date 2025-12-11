import Link from "next/link";
import { getSpecDocs } from "@/lib/api";

export default async function SpecDocsPage({
  params,
}: {
  params: Promise<{ specId: string }>;
}) {
  // Unwrap params (Next.js 15+)
  const { specId } = await params;

  // Your getSpecDocs only accepts one parameter (specId)
  const docs = await getSpecDocs(specId);

  return (
    <div className="min-h-screen bg-gray-50 p-6 space-y-6">
      <div className="text-sm text-gray-600">
        <Link href="/providers" className="text-blue-600 hover:underline">
          Providers
        </Link>{" "}
        /{" "}
        <Link href={`/specs/${specId}`} className="text-blue-600 hover:underline">
          Spec {specId}
        </Link>{" "}
        / <span className="text-gray-900 font-medium">Docs</span>
      </div>

      <h1 className="text-2xl font-bold text-gray-900 mb-4">Documentation</h1>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Markdown */}
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow">
          <h2 className="mb-3 text-lg font-semibold text-gray-900">Markdown</h2>
          {docs.markdown_url ? (
            <pre className="whitespace-pre-wrap text-sm text-gray-800 bg-gray-50 p-3 rounded border border-gray-200">
              {docs.markdown_url}
            </pre>
          ) : (
            <p className="text-gray-600 text-sm">No markdown available.</p>
          )}
        </div>

        {/* HTML */}
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow">
          <h2 className="mb-3 text-lg font-semibold text-gray-900">HTML Preview</h2>
          {docs.html_url ? (
            <div
              className="prose prose-sm max-w-none rounded border border-gray-200 bg-white p-3"
              dangerouslySetInnerHTML={{ __html: docs.html_url }}
            />
          ) : (
            <p className="text-gray-600 text-sm">No HTML available.</p>
          )}
        </div>
      </div>
    </div>
  );
}
