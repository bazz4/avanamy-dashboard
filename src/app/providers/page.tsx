import Link from "next/link";
import { getProviders } from "@/lib/api";

export default async function ProvidersPage() {
  const providers = await getProviders();

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Providers</h1>

      {providers.length === 0 ? (
        <p className="text-gray-700">No providers found.</p>
      ) : (
        <div className="overflow-hidden rounded-lg shadow border border-gray-200 bg-white">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-gray-900 border-b border-gray-200">
                  Name
                </th>
                <th className="px-4 py-3 text-left font-semibold text-gray-900 border-b border-gray-200">
                  Slug
                </th>
                <th className="px-4 py-3 text-left font-semibold text-gray-900 border-b border-gray-200">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody>
              {providers.map((p) => (
                <tr key={p.id} className="even:bg-gray-50 hover:bg-gray-100">
                  <td className="px-4 py-3 text-gray-900 border-b border-gray-200">
                    {p.name}
                  </td>

                  <td className="px-4 py-3 border-b border-gray-200">
                    <code className="rounded bg-gray-200 px-2 py-1 text-xs text-gray-900">
                      {p.slug}
                    </code>
                  </td>

                  <td className="px-4 py-3 border-b border-gray-200">
                    <Link
                      href={`/providers/${p.id}`}
                      className="text-blue-600 hover:underline font-medium"
                    >
                      View products
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
