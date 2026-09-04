export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-full animate-in fade-in duration-300">
      {children}
    </div>
  );
}
