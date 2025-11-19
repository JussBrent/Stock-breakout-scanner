import { Button } from "@/components/ui/button"

export default function App() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="space-y-4 text-center">
        <h1 className="text-3xl font-bold tracking-tight">
          shadcn + Tailwind v4 ✅
        </h1>

        <p className="text-sm text-muted-foreground">
          If this button looks nice, everything is wired up correctly.
        </p>

        <div className="flex justify-center gap-3">
          <Button>Default</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="destructive">Destructive</Button>
        </div>
      </div>
    </div>
  )
}
