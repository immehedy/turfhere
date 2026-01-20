import NavBar from "@/components/navbar";

export default function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <NavBar />
      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
    </div>
  );
}
