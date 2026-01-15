import Link from "next/link";
import { History } from "lucide-react";
import { getSpecsForProduct } from "@/lib/api";
import { actionButtonVersionsSm } from "@/components/ui/actionClasses";

export default async function ProductSpecsPage({
  params,
}: {
  params: Promise<{ productId: string }>;
}) {
  // IMPORTANT: unwrap the Promise
  const { productId } = await params;

  const specs = await getSpecsForProduct(productId);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="text-sm text-gray-600 mb-4">
        <Link href="/providers" className="text-blue-600 hover:underline">
          Providers
        </Link>{" "}
        /{" "}
        <Link href={`/products/${productId}`} className="text-blue-600 hover:underline">
          Product
        </Link>{" "}
        / <span className="text-gray-900">Specs</span>
      </div>

      <h1 className="text-2xl font-bold text-gray-900 mb-6">Specs</h1>

      {specs.length === 0 ? (
        <p className="text-gray-700">No specs found.</p>
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
              {specs.map((spec) => (
                <tr key={spec.id} className="even:bg-gray-50 hover:bg-gray-100">
                  <td className="px-4 py-3 text-gray-900 border-b border-gray-200">
                    {spec.name}
                  </td>

                  <td className="px-4 py-3 border-b border-gray-200">
                    <code className="rounded bg-gray-200 px-2 py-1 text-xs text-gray-900">
                      {spec.slug}
                    </code>
                  </td>

                  <td className="px-4 py-3 border-b border-gray-200">
                    <Link
                      href={`/specs/${spec.id}`}
                      className={actionButtonVersionsSm}
                    >
                      <History className="h-4 w-4" aria-hidden="true" />
                      View Versions
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
