import type { AgentTrace } from "./overlap";
export const demoTrace: AgentTrace = {
  query: "why is checkout failing?",
  framework: "langgraph",
  latency_ms: 2140,
  answer: "Checkout fails because the Stripe webhook handler times out after the payment intent confirms. PR #412 raised the webhook timeout and added a retry queue for payment_intent.succeeded events.",
  spans: [
    { id: "s1", name: "plan", kind: "node", start_ms: 0, end_ms: 180, status: "ok" },
    { id: "s2", name: "search_prs", kind: "retriever", parent_id: "s1", start_ms: 180, end_ms: 720, status: "ok" },
    { id: "s3", name: "search_issues", kind: "retriever", parent_id: "s1", start_ms: 720, end_ms: 1100, status: "ok" },
    { id: "s4", name: "answer", kind: "llm", start_ms: 1100, end_ms: 2140, status: "ok" },
  ],
  retrievals: [
    { span_id: "s2", query: "checkout failure", arm: "vector", items: [
      { id: "pr_101", label: "PR #101 · Redesign checkout page layout", kind: "pull_request", score: 0.91, content: "Refreshes the checkout UI with a new cart summary, button styles and responsive grid layout." },
      { id: "pr_412", label: "PR #412 · Raise Stripe webhook timeout", kind: "pull_request", score: 0.34, content: "Stripe webhook handler times out on payment_intent.succeeded. Raise timeout and add retry queue." },
      { id: "pr_233", label: "PR #233 · Bump eslint config", kind: "pull_request", score: 0.62, content: "Updates lint rules and formatting across packages." },
    ]},
    { span_id: "s3", query: "payment errors", arm: "graph", items: [
      { id: "is_88", label: "Issue #88 · Payments stuck pending", kind: "issue", score: 0.71, content: "Customers report payment pending forever; webhook logs show timeout after the payment intent confirms." },
      { id: "is_12", label: "Issue #12 · Dark mode request", kind: "issue", score: 0.55, content: "Please add a dark theme for the dashboard." },
    ]},
  ],
};
