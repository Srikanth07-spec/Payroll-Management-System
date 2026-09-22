import Navbar from "../components/landing/Navbar";
import Hero from "../components/landing/Hero";

function Landing() {
  return (
    <div className="min-h-screen bg-white text-slate-900">
      <Navbar />
      <main>
        <Hero />
      </main>
    </div>
  );
}

export default Landing;