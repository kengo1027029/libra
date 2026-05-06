"use client";

export function AuthLayout({
  children,
  quote = true,
}: {
  children: React.ReactNode;
  quote?: boolean;
}) {
  return (
    <div className="min-h-dvh bg-white">
      <div className="grid min-h-dvh lg:grid-cols-2">
        <section className="flex items-center justify-center px-6 py-12 sm:px-10 lg:px-16">
          <div className="w-full max-w-md">{children}</div>
        </section>

        <section className="relative hidden overflow-hidden bg-gradient-to-b from-[#fafbff] to-[#f2f5fb] lg:block">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(88,111,255,0.12),transparent_45%),radial-gradient(circle_at_70%_70%,rgba(17,103,232,0.08),transparent_45%)]" />
          <div className="relative flex h-full flex-col justify-between p-16">
            {quote ? (
              <div className="max-w-lg pt-8">
                <p className="text-[44px] font-semibold leading-[1.15] tracking-tight text-neutral-800">
                  The future belongs to those who
                  <br />
                  <span className="text-[#2f66c3]">believe</span> in the{" "}
                  <span className="text-[#2f66c3]">beauty of their dreams.</span>
                </p>
                <p className="mt-6 text-right text-3xl font-medium text-neutral-700">- Eleanor Roosevelt</p>
              </div>
            ) : (
              <div />
            )}

            <div className="mx-auto w-full max-w-xl rounded-3xl border border-white/60 bg-white/60 p-8 shadow-[0_20px_50px_rgba(15,23,42,0.08)] backdrop-blur">
              <div className="aspect-[4/3] rounded-2xl bg-gradient-to-br from-white to-neutral-100" />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
