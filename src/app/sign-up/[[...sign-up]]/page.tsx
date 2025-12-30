import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-100 via-slate-50 to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <div className="w-full max-w-md">
        <SignUp 
          appearance={{
            elements: {
              rootBox: "mx-auto",
              card: "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl",
              headerTitle: "text-slate-900 dark:text-white",
              headerSubtitle: "text-slate-600 dark:text-slate-400",
              socialButtonsBlockButton: "border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800",
              formButtonPrimary: "bg-purple-600 hover:bg-purple-700 text-white",
              footerActionLink: "text-purple-600 hover:text-purple-700",
              identityPreviewText: "text-slate-900 dark:text-white",
              identityPreviewEditButton: "text-purple-600 hover:text-purple-700",
            }
          }}
          routing="path"
          path="/sign-up"
          signInUrl="/sign-in"
          forceRedirectUrl="/watched-apis"
        />
      </div>
    </div>
  );
}