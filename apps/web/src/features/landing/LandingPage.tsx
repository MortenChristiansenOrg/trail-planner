import { useNavigate } from "@tanstack/react-router";
import { ArrowRight, CalendarDays, Coins, MapPin, UsersRound } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { AppShell } from "@/components/layout/AppShell";
import { formatMoney, monthNames } from "@/features/catalog/catalog";
import { defaultExploreSearch, toSearchParams } from "@/features/explore/search";
import { TrailMap } from "@/features/maps/TrailMap";

export function LandingPage() {
  const navigate = useNavigate();
  const [month, setMonth] = useState(defaultExploreSearch.month);
  const [participants, setParticipants] = useState(defaultExploreSearch.participants);
  const [days, setDays] = useState(defaultExploreSearch.days);
  const [budget, setBudget] = useState(defaultExploreSearch.budget);

  const startExploring = () => {
    void navigate({
      to: "/explore",
      search: toSearchParams({
        ...defaultExploreSearch,
        month,
        participants,
        days,
        budget,
      }),
    });
  };

  return (
    <AppShell fullHeight>
      <main className="landing-stage">
        <TrailMap className="landing-map" markers={[]} />
        <div className="landing-wash" />
        <section className="landing-copy">
          <p className="eyebrow"><MapPin /> From Aalborg to the trailhead</p>
          <h1>Find the mountains that fit the journey.</h1>
          <p>
            Set the limits of the trip. Trail Planner compares rough-terrain destinations by season,
            travel time and transport cost.
          </p>
        </section>

        <section className="planner-card" aria-labelledby="planner-title">
          <div>
            <p className="step-label">Start with the shape of the trip</p>
            <h2 id="planner-title">Where could you go?</h2>
          </div>

          <div className="planner-fields">
            <label className="field-block">
              <span><CalendarDays /> Travel month</span>
              <Select value={String(month)} onValueChange={(value) => setMonth(Number(value))}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {monthNames.map((name, index) => (
                    <SelectItem key={name} value={String(index + 1)}>{name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </label>

            <label className="field-block">
              <span><UsersRound /> Travellers</span>
              <Select value={String(participants)} onValueChange={(value) => setParticipants(Number(value))}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 8 }, (_, index) => index + 1).map((value) => (
                    <SelectItem key={value} value={String(value)}>{value} {value === 1 ? "person" : "people"}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </label>

            <label className="range-field">
              <span><span><CalendarDays /> Maximum trip length</span><strong>{days} days</strong></span>
              <Slider aria-label="Maximum trip length" min={2} max={14} step={1} value={[days]} onValueChange={([value]) => setDays(value)} />
            </label>

            <label className="range-field">
              <span><span><Coins /> Transport budget</span><strong>{formatMoney(budget)}</strong></span>
              <Slider aria-label="Transport budget" min={3_000} max={40_000} step={1_000} value={[budget]} onValueChange={([value]) => setBudget(value)} />
            </label>
          </div>

          <Button className="explore-button" onClick={startExploring} size="lg">
            Explore destinations <ArrowRight />
          </Button>
          <p className="planner-note">Planning estimates, not live prices · you can refine every limit next</p>
        </section>
      </main>
    </AppShell>
  );
}
