const companies = [
  "Anthropic",
  "Vercel",
  "Supabase",
  "Linear",
  "Stripe",
  "Railway",
];

export function Logos() {
  return (
    <section className="border-t border-gray-100 bg-white py-14">
      <div className="mx-auto max-w-[1200px] px-6">
        <p className="text-[13px] text-gray-400">
          Trusted by the{" "}
          <span className="font-semibold text-gray-900">
            world&apos;s leading engineering teams.
          </span>
        </p>

        <div className="mt-7 flex flex-wrap items-center gap-x-10 gap-y-5">
          {companies.map((name) => (
            <span
              key={name}
              className="font-mono text-[13px] font-medium tracking-wide text-gray-300 uppercase select-none"
            >
              {name}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
