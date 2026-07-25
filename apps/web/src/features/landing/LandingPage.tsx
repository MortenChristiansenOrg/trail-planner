import {
  createDefaultPreferences,
  danishCities,
  getDanishCity,
} from "@trail-planner/domain";
import { useNavigate } from "@tanstack/react-router";
import { ArrowRight, CalendarDays, Coins, MapPin, UsersRound } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { AppShell } from "@/components/layout/AppShell";
import { formatMoney, monthNames } from "@/features/catalog/catalog";
import { defaultExploreSearch, toSearchParams } from "@/features/explore/search";
import { TrailMap } from "@/features/maps/TrailMap";
import { usePreferences } from "@/features/preferences/PreferencesSession";

export function LandingPage() {
  const preferences = usePreferences();
  if (!preferences.ready) {
    return <div className="route-loading" role="status">Loading your planning settings…</div>;
  }
  return <LandingPlanner />;
}

function LandingPlanner() {
  const navigate = useNavigate();
  const preferences = usePreferences();
  const [homeCityKey, setHomeCityKey] = useState(
    preferences.preferences?.homeCity.key ?? "",
  );
  const [month, setMonth] = useState(defaultExploreSearch.month);
  const [participants, setParticipants] = useState(defaultExploreSearch.participants);
  const [days, setDays] = useState(defaultExploreSearch.days);
  const [budget, setBudget] = useState(defaultExploreSearch.budget);
  const [cityMissing, setCityMissing] = useState(false);
  const homeCity = getDanishCity(homeCityKey);

  const startExploring = async () => {
    if (!homeCity) {
      setCityMissing(true);
      return;
    }
    await preferences.save(
      preferences.preferences
        ? { ...preferences.preferences, homeCity }
        : createDefaultPreferences(homeCity),
    );
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
          <p className="eyebrow"><MapPin /> From {homeCity?.name ?? "your home city"} to the trailhead</p>
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

          <FieldGroup className="planner-fields">
            <Field className="planner-city-field" data-invalid={cityMissing}>
              <FieldLabel htmlFor="landing-home-city"><MapPin /> Home city</FieldLabel>
              <Select
                value={homeCityKey}
                onValueChange={(value) => {
                  setHomeCityKey(value);
                  setCityMissing(false);
                }}
              >
                <SelectTrigger
                  aria-invalid={cityMissing}
                  className="w-full"
                  id="landing-home-city"
                >
                  <SelectValue placeholder="Choose a Danish city" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {danishCities.map((city) => (
                      <SelectItem key={city.key} value={city.key}>
                        {city.name}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
              {cityMissing ? (
                <FieldError>Choose your home city before exploring.</FieldError>
              ) : null}
            </Field>

            <Field className="field-block">
              <FieldLabel htmlFor="landing-travel-month"><CalendarDays /> Travel month</FieldLabel>
              <Select value={String(month)} onValueChange={(value) => setMonth(Number(value))}>
                <SelectTrigger className="w-full" id="landing-travel-month"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {monthNames.map((name, index) => (
                      <SelectItem key={name} value={String(index + 1)}>{name}</SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </Field>

            <Field className="field-block">
              <FieldLabel htmlFor="landing-travellers"><UsersRound /> Travellers</FieldLabel>
              <Select value={String(participants)} onValueChange={(value) => setParticipants(Number(value))}>
                <SelectTrigger className="w-full" id="landing-travellers"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {Array.from({ length: 8 }, (_, index) => index + 1).map((value) => (
                      <SelectItem key={value} value={String(value)}>{value} {value === 1 ? "person" : "people"}</SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </Field>

            <Field className="range-field">
              <FieldLabel><span><CalendarDays /> Maximum trip length</span><strong>{days} days</strong></FieldLabel>
              <Slider aria-label="Maximum trip length" min={2} max={14} step={1} value={[days]} onValueChange={([value]) => setDays(value)} />
            </Field>

            <Field className="range-field">
              <FieldLabel><span><Coins /> Transport budget</span><strong>{formatMoney(budget)}</strong></FieldLabel>
              <Slider aria-label="Transport budget" min={3_000} max={40_000} step={1_000} value={[budget]} onValueChange={([value]) => setBudget(value)} />
            </Field>
          </FieldGroup>

          <Button className="explore-button" onClick={() => void startExploring()} size="lg">
            Explore destinations <ArrowRight />
          </Button>
          <p className="planner-note">Planning estimates, not live prices · you can refine every limit next</p>
        </section>
      </main>
    </AppShell>
  );
}
