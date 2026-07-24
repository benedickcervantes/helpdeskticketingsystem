export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-950 text-white relative overflow-x-hidden">
      <div className="absolute inset-0 pointer-events-none" aria-hidden>
        <div className="absolute inset-0 bg-gradient-to-b from-emerald-950/45 via-gray-950 to-gray-950" />
        <div
          className="absolute inset-0 opacity-[0.3]"
          style={{
            backgroundImage:
              'radial-gradient(ellipse 70% 45% at 50% -5%, rgba(16, 185, 129, 0.2), transparent 55%)',
          }}
        />
        <div
          className="absolute inset-0 opacity-[0.1]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
            maskImage: 'linear-gradient(to bottom, black 0%, transparent 70%)',
          }}
        />
      </div>
      <div className="relative z-10">{children}</div>
    </div>
  );
}
