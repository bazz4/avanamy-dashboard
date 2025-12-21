import Link from "next/link";
import { getSpecVersions } from "@/lib/api";
import { RegenerateDocsButton } from "@/components/RegenerateDocsButton";
import { UploadNewVersionForm } from "@/components/UploadNewVersionForm";
import { VersionDiffDisplay } from "@/components/VersionDiffDisplay";

export default async function SpecDetailPage({
  params,
}: {
  params: Promise<{ specId: string }>;
}) {
  // REQUIRED for Next.js App Router (params is a Promise)
  const { specId } = await params;

  const versions = await getSpecVersions(specId);

  const sorted = [...versions].sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
  const current = sorted[0];

  return (
    <div className="min-h-screen bg-gray-50 p-6 space-y-6">
      <div className="text-sm text-gray-600">
        <Link href="/providers" className="text-blue-600 hover:underline">
          Providers
        </Link>{" "}
        / <span className="text-gray-900 font-medium">Spec {specId}</span>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Spec {specId}</h2>
          {current && (
            <p className="text-sm text-gray-600">
              Current version:{" "}
              <span className="font-mono text-xs text-gray-900">
                {current.label ?? `v${current.version}`}
              </span>{" "}
              (created {new Date(current.created_at).toLocaleString()})
            </p>
          )}
        </div>

        <div className="flex flex-col items-end gap-2">
          <RegenerateDocsButton specId={specId} />
          <Link
            href={`/specs/${specId}/docs`}
            className="text-sm text-blue-600 hover:underline font-medium"
          >
            View docs
          </Link>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-[2fr,1fr]">
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow">
          <h3 className="mb-3 text-sm font-semibold text-gray-900">
            Version history
          </h3>

          {sorted.length === 0 ? (
            <p className="text-sm text-gray-600">No versions found.</p>
          ) : (
            <ul className="space-y-3 text-sm">
              {sorted.map((v) => (
                <li
                  key={v.id}
                  className="rounded border border-gray-200 bg-gray-50 px-3 py-2"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-mono text-xs text-gray-900">
                        {v.label ?? `v${v.version}`}
                      </div>
                      <div className="text-xs text-gray-600">
                        {new Date(v.created_at).toLocaleString()}
                      </div>
                      {v.changelog && (
                        <div className="mt-1 text-xs text-gray-700">
                          {v.changelog}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Show diff if available */}
                  <VersionDiffDisplay 
                    diff={v.diff}
                    summary={v.summary}
                    versionLabel={v.label ?? `v${v.version}`}
                  />
                </li>
              ))}
            </ul>
          )}
        </div>

        <UploadNewVersionForm specId={specId} />
      </div>
    </div>
  );
}
