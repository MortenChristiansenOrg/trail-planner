import { CompassIcon, MapIcon, RouteIcon } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";

const planningModes = [
  {
    title: "Evaluate a hike",
    description: "Start from a known trail, route page, map pin, or GPX idea.",
    icon: RouteIcon,
  },
  {
    title: "Explore within limits",
    description: "Compare rough-terrain destinations by month, days, and budget.",
    icon: MapIcon,
  },
];

export function LandingPage() {
  return (
    <AppShell>
      <main className="mx-auto flex min-h-dvh w-full max-w-6xl flex-col px-6 py-8">
        <header className="flex items-center justify-between gap-4">
          <a className="flex items-center gap-2 font-semibold" href="/">
            <CompassIcon aria-hidden="true" />
            Trail Planner
          </a>
          <Button disabled variant="outline">
            Sign in
          </Button>
        </header>

        <section className="grid flex-1 items-center gap-10 py-16 md:grid-cols-[1.1fr_0.9fr]">
          <div className="flex max-w-2xl flex-col gap-6">
            <p className="text-sm font-medium text-muted-foreground">
              Planning workspace from Aalborg to mountain trails
            </p>
            <h1 className="text-4xl font-semibold tracking-tight text-balance md:text-6xl">
              Find hikes that fit the journey, not just the map.
            </h1>
            <p className="max-w-xl text-lg text-muted-foreground">
              Trail Planner will compare destinations by travel time, cost,
              season fit, hiking quality, and confidence. This first screen is
              the placeholder shell for the MVP application base.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button disabled>Explore trips</Button>
              <Button disabled variant="secondary">
                Evaluate a hike
              </Button>
            </div>
          </div>

          <div className="grid gap-4">
            {planningModes.map((mode) => {
              const Icon = mode.icon;

              return (
                <article
                  className="rounded-lg border bg-card p-5 text-card-foreground shadow-sm"
                  key={mode.title}
                >
                  <div className="mb-4 flex items-center gap-3">
                    <span className="grid size-10 place-items-center rounded-md bg-secondary">
                      <Icon aria-hidden="true" />
                    </span>
                    <h2 className="font-semibold">{mode.title}</h2>
                  </div>
                  <p className="text-sm leading-6 text-muted-foreground">
                    {mode.description}
                  </p>
                </article>
              );
            })}
          </div>
        </section>
      </main>
    </AppShell>
  );
}
