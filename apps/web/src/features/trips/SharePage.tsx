import { BedDouble, CalendarDays, CarFront, MapPin, Plane, Route, UsersRound, WalletCards } from "lucide-react";
import { useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { Badge } from "@/components/ui/badge";
import { AppShell } from "@/components/layout/AppShell";
import { useAuthSession } from "@/features/auth/AuthSession";
import { destinationById, formatHours, formatMoney, monthNames } from "@/features/catalog/catalog";
import { modeLabels } from "@/features/explore/search";
import { TrailMap, type TrailLine } from "@/features/maps/TrailMap";
import { calculateTripCost, getCostItemAmount, getSelectedTravel, type PlannedTrip } from "@/features/trips/model";
import { useTripStore } from "@/features/trips/TripStore";

export function SharePage({ token }: { token: string }) {
  const auth = useAuthSession();
  return auth.configured ? <ConfiguredSharePage token={token} /> : <PreviewSharePage token={token} />;
}

function ConfiguredSharePage({ token }: { token: string }) {
  const state = useQuery(api.shareLinks.read, { token });
  if (state === undefined) return <AppShell><main className="not-found-page"><Route /><h1>Opening shared plan…</h1></main></AppShell>;
  if (!state) return <UnavailableShare />;
  return <SharedTripView trip={JSON.parse(state) as PlannedTrip} />;
}

function PreviewSharePage({ token }: { token: string }) {
  const { trips } = useTripStore();
  const trip = trips.find((item) => item.shareToken === token);
  return trip ? <SharedTripView trip={trip} /> : <UnavailableShare preview />;
}

function UnavailableShare({ preview = false }: { preview?: boolean }) {
  return (
    <AppShell>
      <main className="not-found-page"><Route /><h1>This shared plan is unavailable</h1><p>{preview ? "The link may have been removed or opened in a different local-preview browser." : "The owner may have revoked this link."}</p></main>
    </AppShell>
  );
}

function SharedTripView({ trip }: { trip: PlannedTrip }) {
  const destination = destinationById.get(trip.destinationId);
  if (!destination) return <UnavailableShare />;
  const costs = calculateTripCost(trip);
  const travel = getSelectedTravel(trip);
  const activities = new Map(trip.days.flatMap((day) => day.activities).map((activity) => [activity.groupId, activity]));
  const lines: TrailLine[] = Array.from(activities.values()).flatMap((activity) => {
    const hike = destination.hikes.find((item) => item.id === activity.hikeId);
    return hike ? [{ id: activity.groupId, coordinates: hike.route }] : [];
  });

  return (
    <AppShell>
      <main className="share-page">
        <header className="share-hero">
          <div><Badge variant="secondary">Read-only plan</Badge><p className="eyebrow"><MapPin /> {destination.region}, {destination.country}</p><h1>{trip.title}</h1><p>{destination.summary}</p></div>
          <div className="share-summary">
            <span><CalendarDays /><strong>{trip.tripDays} days</strong><small>{trip.startDate ?? monthNames[trip.plannedMonth - 1]}</small></span>
            <span><UsersRound /><strong>{trip.participants}</strong><small>travellers</small></span>
            <span><WalletCards /><strong>{formatMoney(costs.total)}</strong><small>{formatMoney(costs.perPerson)} per person</small></span>
          </div>
        </header>
        <div className="share-grid">
          <section className="share-itinerary">
            <div className="section-heading"><div><p className="step-label">The plan</p><h2>Day by day</h2></div>{travel ? <Badge variant="outline">{travel.mode === "plane" ? <Plane /> : <CarFront />} {modeLabels[travel.mode]} · {formatHours(travel.oneWayHours)}</Badge> : null}</div>
            {trip.days.map((day) => (
              <article className="share-day" key={day.day}>
                <div><strong>Day {day.day}</strong><small>{day.calendarDate ?? "Date open"}</small></div>
                <div>
                  {day.day === 1 ? <p className="share-travel">Journey to {destination.name}</p> : null}
                  {day.activities.length ? day.activities.map((activity) => <p className="share-activity" key={activity.id}><span>{activity.letter}</span><strong>{activity.name}</strong><small>{activity.durationDays > 1 ? `Part ${activity.segment} of ${activity.durationDays}` : activity.description}</small></p>) : day.day !== 1 && day.day !== trip.tripDays ? <p className="share-open">Open day</p> : null}
                  {day.day === trip.tripDays ? <p className="share-travel">Journey home</p> : null}
                </div>
              </article>
            ))}
          </section>
          <aside className="share-side">
            <div className="share-map"><TrailMap lines={lines} markers={[{ id: destination.id, label: destination.name, coordinates: destination.coordinates }]} mode="detail" selectedId={destination.id} /></div>
            <section className="share-budget">
              <h2>Estimate</h2>
              {costs.categories.map((category) => (
                <div className="share-budget__category" key={category.item.id}>
                  <p><span>{category.item.label}{category.item.overrideCost !== undefined ? <Badge variant="secondary">Overridden</Badge> : null}</span><strong>{formatMoney(category.total)}</strong></p>
                  {category.children.map((item) => <p className={category.item.overrideCost !== undefined ? "share-budget__component is-excluded" : "share-budget__component"} key={item.id} style={{ paddingInlineStart: `${item.depth * 12}px` }}><span>{item.label}{category.item.overrideCost !== undefined ? <Badge variant="outline">Excluded from total</Badge> : item.overrideCost !== undefined ? <Badge variant="outline">Using override</Badge> : null}</span><strong>{formatMoney(getCostItemAmount(item))}</strong></p>)}
                </div>
              ))}
              <p className="share-budget__total"><span>Group total</span><strong>{formatMoney(costs.total)}</strong></p>
              <p className="share-budget__per-person"><span>Per person</span><strong>{formatMoney(costs.perPerson)}</strong></p>
            </section>
            {trip.nights.some((night) => night.kind !== "none") ? <section className="share-lodging"><h2><BedDouble /> Nights</h2>{trip.nights.filter((night) => night.kind !== "none").map((night) => <p key={night.afterDay}><span>After day {night.afterDay}</span><strong>{night.name}</strong></p>)}</section> : null}
          </aside>
        </div>
      </main>
    </AppShell>
  );
}
