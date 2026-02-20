import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export function CTA() {
  return (
    <section className="bg-white py-20 md:py-28">
      <div className="mx-auto max-w-[1200px] px-6">
        <div className="rounded-2xl border border-gray-200 bg-gray-50 px-8 py-14 text-center shadow-[0_1px_3px_rgba(0,0,0,0.04)] md:px-16">
          <h2 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
            Ready to stop breaking your APIs?
          </h2>
          <p className="mx-auto mt-3 max-w-md text-[14px] leading-relaxed text-gray-500">
            Get started in under five minutes. Free forever for schema diffing.
            No credit card required.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button size="lg">
              Start for free
              <ArrowRight size={15} />
            </Button>
            <Button variant="secondary" size="lg">
              View Documentation
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
