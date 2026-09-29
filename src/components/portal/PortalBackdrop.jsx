// Subtle branded backdrop for portal pages — soft gold/blue glows only.
// Purely decorative, never intercepts clicks.
export default function PortalBackdrop() {
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-secondary/[0.07] blur-3xl" />
      <div className="absolute -bottom-40 -right-32 h-[28rem] w-[28rem] rounded-full bg-blue-500/[0.06] blur-3xl" />
    </div>
  );
}
