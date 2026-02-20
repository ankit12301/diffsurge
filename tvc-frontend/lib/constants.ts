export const siteConfig = {
  name: "Driftguard",
  tagline: "Never ship a breaking API change again",
  description:
    "Driftguard captures, versions, and replays your API traffic against new deployments — catching breaking changes before your users do.",
  url: "https://driftguard.dev",
  github: "https://github.com/driftguard/driftguard",
  docs: "https://docs.driftguard.dev",
} as const;

export const navLinks = [
  { label: "Features", href: "#features" },
  { label: "How it Works", href: "#how-it-works" },
  { label: "Pricing", href: "#pricing" },
  { label: "Docs", href: "/docs" },
] as const;

export const plans = [
  {
    name: "Free",
    price: 0,
    description: "Schema governance for every team",
    features: [
      "CLI tool & schema diffing",
      "OpenAPI & GraphQL support",
      "CI/CD integration",
      "Breaking change detection",
      "Community support",
    ],
    cta: "Get Started Free",
    highlighted: false,
  },
  {
    name: "Pro",
    price: 99,
    description: "Traffic capture & replay for production",
    features: [
      "Everything in Free",
      "100K traffic logs / month",
      "50 replay sessions / month",
      "Automatic PII redaction",
      "Live traffic dashboard",
      "Email support",
    ],
    cta: "Start Pro Trial",
    highlighted: true,
  },
  {
    name: "Enterprise",
    price: 499,
    description: "Unlimited scale with dedicated support",
    features: [
      "Everything in Pro",
      "Unlimited traffic & replays",
      "Custom PII rules",
      "SSO / SAML",
      "Audit log export",
      "Priority support & SLA",
    ],
    cta: "Contact Sales",
    highlighted: false,
  },
] as const;
