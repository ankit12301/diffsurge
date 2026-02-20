import { siteConfig } from "@/lib/constants";

const footerLinks = {
  Product: [
    { label: "Features", href: "#features" },
    { label: "Pricing", href: "#pricing" },
    { label: "Changelog", href: "/changelog" },
    { label: "Roadmap", href: "/roadmap" },
  ],
  Developers: [
    { label: "Documentation", href: "/docs" },
    { label: "API Reference", href: "/docs/api" },
    { label: "CLI Reference", href: "/docs/cli" },
    { label: "GitHub", href: siteConfig.github },
  ],
  Company: [
    { label: "About", href: "/about" },
    { label: "Blog", href: "/blog" },
    { label: "Contact", href: "/contact" },
  ],
  Legal: [
    { label: "Privacy", href: "/privacy" },
    { label: "Terms", href: "/terms" },
    { label: "Security", href: "/security" },
  ],
};

export function Footer() {
  return (
    <footer className="border-t border-gray-100 bg-white">
      <div className="mx-auto max-w-[1200px] px-6 py-14">
        <div className="grid gap-10 sm:grid-cols-2 md:grid-cols-5">
          {/* Brand */}
          <div className="md:col-span-1">
            <a href="/" className="flex items-center gap-2">
              <svg
                width="24"
                height="24"
                viewBox="0 0 28 28"
                fill="none"
                className="text-gray-900"
              >
                <rect width="28" height="28" rx="8" fill="currentColor" />
                <path
                  d="M8 10L14 7L20 10V18L14 21L8 18V10Z"
                  stroke="white"
                  strokeWidth="1.5"
                  strokeLinejoin="round"
                />
                <path d="M14 14V21" stroke="white" strokeWidth="1.5" />
                <path d="M8 10L14 14L20 10" stroke="white" strokeWidth="1.5" />
              </svg>
              <span className="text-[14px] font-semibold tracking-tight text-gray-900">
                {siteConfig.name}
              </span>
            </a>
            <p className="mt-3 text-[13px] leading-relaxed text-gray-400">
              Guardrails for your APIs.
            </p>
          </div>

          {/* Link columns */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h4 className="text-[12px] font-semibold uppercase tracking-wider text-gray-400">
                {category}
              </h4>
              <ul className="mt-4 space-y-2.5">
                {links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-[13px] text-gray-500 transition-colors hover:text-gray-900"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom */}
        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-gray-100 pt-7 sm:flex-row">
          <p className="text-[12px] text-gray-400">
            &copy; {new Date().getFullYear()} Driftguard. All rights reserved.
          </p>
          <div className="flex gap-5">
            <a
              href={siteConfig.github}
              className="text-[12px] text-gray-400 transition-colors hover:text-gray-900"
            >
              GitHub
            </a>
            <a
              href="https://x.com/driftguard"
              className="text-[12px] text-gray-400 transition-colors hover:text-gray-900"
            >
              X / Twitter
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
