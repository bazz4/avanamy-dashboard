import Link from "next/link";
import { getProductsForProvider } from "@/lib/api";

export default async function ProviderProductsPage({
  params,
}: {
  params: Promise<{ providerId: string }>;
}) {
  // ⬅️ Required for Next.js 15/16
  const { providerId } = await params;

  const products = await getProductsForProvider(providerId);

  return (
    <div className="space-y-4">
      <div className="text-sm text-slate-600">
        <Link href="/providers" className="text-blue-600 hover:underline">
          Providers
        </Link>{" "}
        / <span>{providerId}</span>
      </div>

      <h2 className="text-xl font-semibold text-slate-900">
        Products for Provider
      </h2>

      {products.length === 0 ? (
        <p className="text-sm text-slate-600">No products found.</p>
      ) : (
        <table className="min-w-full border border-slate-300 bg-white text-sm">
          <thead className="bg-slate-100">
            <tr>
              <th className="border-b border-slate-300 px-3 py-2 text-left text-slate-800">
                Name
              </th>
              <th className="border-b border-slate-300 px-3 py-2 text-left text-slate-800">
                Slug
              </th>
              <th className="border-b border-slate-300 px-3 py-2 text-left text-slate-800">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {products.map((prod) => (
              <tr
                key={prod.id}
                className="even:bg-slate-50 hover:bg-slate-100"
              >
                <td className="border-b border-slate-200 px-3 py-2 text-slate-900">
                  {prod.name}
                </td>
                <td className="border-b border-slate-200 px-3 py-2">
                  <code className="rounded bg-slate-200 px-1 py-0.5 text-xs text-slate-900">
                    {prod.slug}
                  </code>
                </td>
                <td className="border-b border-slate-200 px-3 py-2">
                  <Link
                    href={`/products/${prod.id}`}
                    className="text-blue-600 hover:underline"
                  >
                    View specs
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
