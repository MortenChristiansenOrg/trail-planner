import { Link } from "@tanstack/react-router";
import { ArrowRight, CalendarDays, Map, Plus, Route, Trash2, UsersRound, WalletCards } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { AppShell } from "@/components/layout/AppShell";
import { destinationById, formatMoney, monthNames } from "@/features/catalog/catalog";
import { TrailMap } from "@/features/maps/TrailMap";
import { calculateTripCost } from "@/features/trips/model";
import { useTripStore } from "@/features/trips/TripStore";
import { defaultExploreSearch } from "@/features/explore/search";

export function TripsPage() {
  const { trips, remove } = useTripStore();
  const sorted = trips.toSorted((a, b) => a.plannedMonth - b.plannedMonth || b.updatedAt - a.updatedAt);
  const markers = sorted.flatMap((trip) => {
    const destination = destinationById.get(trip.destinationId);
    return destination
      ? [{ id: trip.id, label: trip.title, coordinates: destination.coordinates, badge: String(trip.plannedMonth) }]
      : [];
  });

  return (
    <AppShell>
      <main className="trips-page">
        <header className="page-heading">
          <div>
            <p className="eyebrow"><Route /> Your planning desk</p>
            <h1>Planned trips</h1>
            <p>Saved destinations keep the travel assumptions and limits that led you there.</p>
          </div>
          <Button asChild><Link to="/explore" search={defaultExploreSearch}><Plus /> Explore another trip</Link></Button>
        </header>

        {sorted.length ? (
          <div className="trips-layout">
            <section className="trip-card-list" aria-label="Saved trips">
              {sorted.map((trip) => {
                const destination = destinationById.get(trip.destinationId);
                const cost = calculateTripCost(trip);
                return (
                  <article className="trip-card" key={trip.id}>
                    <div className="trip-card__month"><span>{monthNames[trip.plannedMonth - 1].slice(0, 3)}</span><strong>{trip.tripDays}</strong><small>days</small></div>
                    <div className="trip-card__copy">
                      <p>{destination?.country ?? "Destination"}</p>
                      <h2>{trip.title}</h2>
                      <div>
                        <span><UsersRound /> {trip.participants}</span>
                        <span><WalletCards /> {cost.total ? formatMoney(cost.total) : "Travel not chosen"}</span>
                        <span><CalendarDays /> {trip.startDate ?? "Dates open"}</span>
                      </div>
                    </div>
                    <div className="trip-card__actions">
                      <Button asChild><Link params={{ tripId: trip.id }} to="/trips/$tripId">Open plan <ArrowRight /></Link></Button>
                      <Dialog>
                        <DialogTrigger asChild><Button aria-label={`Remove ${trip.title}`} size="icon" variant="ghost"><Trash2 /></Button></DialogTrigger>
                        <DialogContent>
                          <DialogHeader><DialogTitle>Remove this planned trip?</DialogTitle><DialogDescription>{trip.title} and its itinerary will be removed from this browser.</DialogDescription></DialogHeader>
                          <DialogFooter>
                            <DialogClose asChild><Button variant="outline">Keep trip</Button></DialogClose>
                            <DialogClose asChild><Button onClick={() => remove(trip.id)} variant="default">Remove trip</Button></DialogClose>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </article>
                );
              })}
            </section>
            <aside className="trips-map">
              <TrailMap markers={markers} />
              <div className="trips-map__note"><Map /><span><strong>{markers.length} trailheads</strong> saved on your planning map</span></div>
            </aside>
          </div>
        ) : (
          <section className="empty-trips">
            <div className="empty-trips__map"><TrailMap markers={[]} /></div>
            <div>
              <span className="empty-icon"><Route /></span>
              <h2>No trips on the map yet</h2>
              <p>Explore destinations within your time and transport budget, then save one to start building the day plan.</p>
              <Button asChild><Link to="/explore" search={defaultExploreSearch}>Explore destinations <ArrowRight /></Link></Button>
            </div>
          </section>
        )}
      </main>
    </AppShell>
  );
}
