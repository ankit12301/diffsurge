import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { plans } from "@/lib/constants";
import { Button } from "@/components/ui/button";

export function Pricing() {
  return (
    <section id="pricing" className="bg-gray-50/60 py-20 md:py-28">
      <div className="mx-auto max-w-[1200px] px-6">
        {/* Header */}
        <div className="max-w-lg">
          <p className="text-[12px] font-medium uppercase tracking-widest text-teal-600">
            Pricing
          </p>
          <h2 className="mt-3 text-[1.75rem] font-bold tracking-tight text-gray-900 sm:text-3xl">
            Start free, scale when ready
          </h2>
          <p className="mt-3 text-[14px] leading-relaxed text-gray-500">
            The CLI is free forever. Add traffic capture and replay when your
            team needs it.
          </p>
        </div>

        {/* Cards */}
        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={cn(
                "relative flex flex-col rounded-xl border bg-white p-6 transition-shadow",
                plan.highlighted
                  ? "border-teal-200 shadow-[0_2px_20px_rgba(13,148,136,0.08)]"
                  : "border-gray-200 shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:shadow-[0_2px_12px_rgba(0,0,0,0.06)]"
              )}
            >
              {plan.highlighted && (
                <span className="absolute -top-2.5 left-5 rounded-full bg-teal-600 px-2.5 py-0.5 text-[11px] font-medium text-white">
                  Most popular
                </span>
              )}

              <h3 className="text-[14px] font-semibold text-gray-900">
                {plan.name}
              </h3>

              <div className="mt-3 flex items-baseline gap-1">
                {plan.price === 0 ? (
                  <span className="text-3xl font-bold tracking-tight text-gray-900">
                    Free
                  </span>
                ) : (
                  <>
                    <span className="text-3xl font-bold tracking-tight text-gray-900">
                      ${plan.price}
                    </span>
                    <span className="text-[13px] text-gray-400">/mo</span>
                  </>
                )}
              </div>

              <p className="mt-1.5 text-[13px] text-gray-500">
                {plan.description}
              </p>

              <ul className="mt-6 flex-1 space-y-2.5">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2">
                    <Check
                      size={14}
                      className={cn(
                        "mt-0.5 shrink-0",
                        plan.highlighted ? "text-teal-600" : "text-gray-300"
                      )}
                    />
                    <span className="text-[13px] text-gray-600">
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>

              <Button
                variant={plan.highlighted ? "primary" : "secondary"}
                className="mt-7 w-full"
                size="md"
              >
                {plan.cta}
              </Button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
