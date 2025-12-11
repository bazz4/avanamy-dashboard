import Link from "next/link";

export default function HomePage() {
  return (
    <div className="space-y-4">
      <p className="text-slate-700">
        Welcome to the Avanamy dev UI. Start by viewing your providers.
      </p>
      <Link
        href="/providers"
        className="inline-flex items-center rounded border border-slate-300 px-3 py-2 text-sm font-medium hover:bg-slate-100"
      >
        Go to Providers
      </Link>
    </div>
  );
}
