import NavBar from "@/components/navbar";
import Footer from "./Footer";

export default function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <NavBar />
      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
      <Footer/>
    </div>
  );
}
