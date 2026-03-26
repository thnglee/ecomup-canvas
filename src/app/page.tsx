import WorldClockBar from "@/components/header/WorldClockBar";
import Canvas from "@/components/canvas/Canvas";

export default function Home() {
  return (
    <main className="h-screen w-screen overflow-hidden">
      <WorldClockBar />
      <Canvas />
    </main>
  );
}
