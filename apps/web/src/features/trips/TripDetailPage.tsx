import { Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  BedDouble,
  BusFront,
  CalendarDays,
  CarFront,
  Check,
  ChevronRight,
  CircleDollarSign,
  Clock3,
  MapPin,
  Mountain,
  Pencil,
  Plane,
  Plus,
  Route,
  Share2,
  TentTree,
  Trash2,
  UsersRound,
} from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AppShell } from "@/components/layout/AppShell";
import { CatalogMediaFigure } from "@/features/catalog/CatalogMediaFigure";
import {
  destinationById,
  formatHours,
  formatMoney,
  monthNames,
  type Hike,
  type TravelMode,
} from "@/features/catalog/catalog";
import { modeLabels } from "@/features/explore/search";
import { TrailMap, type MapMarker, type TrailLine } from "@/features/maps/TrailMap";
import {
  addActivity,
  addCustomCost,
  applyStartDate,
  calculateTripCost,
  getSelectedTravel,
  removeActivityGroup,
  type LodgingNight,
  type PlannedTrip,
} from "@/features/trips/model";
import { useTripStore } from "@/features/trips/TripStore";

export function TripDetailPage({ tripId }: { tripId: string }) {
  const store = useTripStore();
  const [selectedMapItem, setSelectedMapItem] = useState<string>();
  const [shareUrl, setShareUrl] = useState<string>();
  const [shareCopyStatus, setShareCopyStatus] = useState<"copied" | "manual">();
  const trip = store.trips.find((item) => item.id === tripId);

  if (!trip) {
    return (
      <AppShell>
        <main className="not-found-page"><Route /><h1>Trip not found</h1><p>It may have been removed from this browser.</p><Button asChild><Link to="/trips">Back to planned trips</Link></Button></main>
      </AppShell>
    );
  }

  const destination = destinationById.get(trip.destinationId);
  if (!destination) return null;
  const costs = calculateTripCost(trip);
  const selectedTravel = getSelectedTravel(trip);
  const activityGroups = new Map(
    trip.days.flatMap((day) => day.activities).map((activity) => [activity.groupId, activity]),
  );
  const lines: TrailLine[] = Array.from(activityGroups.values()).flatMap((activity) => {
    const hike = destination.hikes.find((item) => item.id === activity.hikeId);
    return hike?.route.length ? [{ id: activity.groupId, coordinates: hike.route, label: `${activity.letter} · ${activity.name}` }] : [];
  });
  const markers: MapMarker[] = [
    { id: destination.id, label: destination.name, coordinates: destination.coordinates },
    ...Array.from(activityGroups.values()).flatMap((activity) => {
      const hike = destination.hikes.find((item) => item.id === activity.hikeId);
      return hike?.route.length ? [{ id: activity.groupId, label: `Trail ${activity.letter}: ${activity.name}`, coordinates: hike.route[0], badge: activity.letter }] : [];
    }),
  ];
  const selectedId = markers.some((marker) => marker.id === selectedMapItem) ? selectedMapItem : destination.id;
  const selectedActivity = selectedMapItem ? activityGroups.get(selectedMapItem) : undefined;
  const selectedHike = selectedActivity ? destination.hikes.find((hike) => hike.id === selectedActivity.hikeId) : undefined;
  let selectedRouteStatus: string | undefined;
  if (selectedActivity?.kind === "custom-hike") selectedRouteStatus = "Selected personal hike · no catalog geometry";
  else if (selectedActivity) selectedRouteStatus = selectedHike?.route.length ? "Selected trail · source-backed route" : "Selected hike · route geometry being curated";

  const save = (next: PlannedTrip) => store.update(next);
  const selectTravel = (mode: TravelMode) => save({ ...trip, selectedTravelMode: mode });
  const updateNight = (night: LodgingNight) => save({ ...trip, nights: trip.nights.map((item) => item.afterDay === night.afterDay ? night : item) });
  const createShare = async () => {
    const token = await store.share(trip.id);
    if (!token) return;
    const url = `${window.location.origin}/share/${token}`;
    setShareUrl(url);
    try {
      if (!navigator.clipboard) throw new Error("Clipboard API unavailable");
      await navigator.clipboard.writeText(url);
      setShareCopyStatus("copied");
    } catch {
      setShareCopyStatus("manual");
    }
  };

  return (
    <AppShell>
      <main className="trip-detail-page">
        <header className="trip-detail-heading">
          <div>
            <Link className="back-link" to="/trips"><ArrowLeft /> Planned trips</Link>
            <CatalogMediaFigure media={destination.media} sizes="180px" variant="thumbnail" />
            <p className="eyebrow"><MapPin /> {destination.region}, {destination.country}</p>
            <h1>{trip.title}</h1>
            <div className="trip-meta">
              <span><CalendarDays /> {monthNames[trip.plannedMonth - 1]} · {trip.tripDays} days</span>
              <span><UsersRound /> {trip.participants} travellers</span>
              <span><CircleDollarSign /> limit {formatMoney(trip.maxBudgetDkk)}</span>
            </div>
          </div>
          <div className="trip-share-actions">
            <Button onClick={createShare} variant="outline"><Share2 /> {shareCopyStatus === "copied" ? "Share link copied" : trip.shareToken ? "Copy share link" : "Create share link"}</Button>
            {shareCopyStatus === "manual" && shareUrl ? (
              <p role="status">Copy this link: <a href={shareUrl}>{shareUrl}</a></p>
            ) : null}
          </div>
        </header>

        <section className="trip-workspace">
          <div className="trip-plan-column">
            <section className="planning-section travel-choice-section">
              <div className="section-heading"><div><p className="step-label">Step 1</p><h2>Choose how to travel</h2></div>{selectedTravel ? <Badge variant="secondary"><Check /> Included in budget</Badge> : <span className="required-note">Required for total cost</span>}</div>
              <div className="travel-choice-grid">
                {trip.travelSnapshot.map((estimate) => (
                  <button
                    className={`travel-choice${trip.selectedTravelMode === estimate.mode ? " is-selected" : ""}`}
                    disabled={!estimate.available}
                    key={estimate.mode}
                    onClick={() => selectTravel(estimate.mode)}
                    type="button"
                  >
                    <span className="travel-choice__icon">{modeIcon(estimate.mode)}</span>
                    <span><small>{modeLabels[estimate.mode]}</small><strong>{estimate.available ? formatHours(estimate.oneWayHours) : "Unavailable"}</strong><em>{estimate.available ? `${formatMoney(estimate.costPerPersonDkk * trip.participants)} total` : estimate.note}</em></span>
                    {trip.selectedTravelMode === estimate.mode ? <Check className="selected-check" /> : null}
                  </button>
                ))}
              </div>
            </section>

            <section className="planning-section itinerary-section">
              <div className="section-heading itinerary-heading">
                <div><p className="step-label">Step 2</p><h2>Shape the days</h2><p>Hikes can share a day or continue across several days.</p></div>
                <label className="date-field">
                  <span>Start date</span>
                  <span className="date-input-shell">
                    <span aria-hidden="true">{trip.startDate ? formatDateInput(trip.startDate) : "dd/mm/yyyy"}</span>
                    <CalendarDays aria-hidden="true" />
                    <input aria-label="Trip start date" min="2026-01-01" onChange={(event) => save(applyStartDate(trip, event.target.value || undefined))} type="date" value={trip.startDate ?? ""} />
                  </span>
                </label>
              </div>

              <div className="day-plan">
                {trip.days.map((day, index) => (
                  <div className="day-and-night" key={day.day}>
                    <article className="day-card">
                      <div className="day-card__label"><strong>Day {day.day}</strong><span>{day.calendarDate ? formatDate(day.calendarDate) : "Date open"}</span></div>
                      <div className="day-card__content">
                        {day.day === 1 ? <TravelDayBlock direction="Journey to the trailhead" travel={selectedTravel} /> : null}
                        {day.activities.map((activity) => (
                          <div className={`activity-row${selectedMapItem === activity.groupId ? " is-selected" : ""}`} key={activity.id}>
                            <button className="activity-row__select" onClick={() => setSelectedMapItem(activity.groupId)} type="button">
                              <span className="trail-letter">{activity.letter}</span>
                              <span><strong>{activity.name}</strong><small>{activity.durationDays > 1 ? `Part ${activity.segment} of ${activity.durationDays}` : activity.description}</small></span>
                            </button>
                            <Button aria-label={`Remove ${activity.name}`} onClick={() => save(removeActivityGroup(trip, activity.groupId))} size="icon" variant="ghost"><Trash2 /></Button>
                          </div>
                        ))}
                        {day.day === trip.tripDays ? <TravelDayBlock direction="Journey home" travel={selectedTravel} /> : null}
                        <AddHikeDialog day={day.day} destinationHikes={destination.hikes} maxDuration={trip.tripDays - day.day + 1} onAdd={(activity) => save(addActivity(trip, day.day, activity))} />
                      </div>
                    </article>
                    {index < trip.nights.length ? (
                      <NightRow destinationId={destination.id} night={trip.nights[index]} onChange={updateNight} />
                    ) : null}
                  </div>
                ))}
              </div>
            </section>
          </div>

          <aside className="trip-side-column">
            <section className="trip-map-card">
              <TrailMap lines={lines} markers={markers} mode="detail" onSelect={setSelectedMapItem} selectedId={selectedId} />
              <div className="map-legend">
                <strong>{selectedActivity ? `${selectedActivity.letter} · ${selectedActivity.name}` : "Route map"}</strong>
                <span>{selectedRouteStatus ?? (lines.length ? `${lines.length} planned trail${lines.length === 1 ? "" : "s"} · select a letter to focus` : "Add a hike to the itinerary; verified routes appear when available")}</span>
              </div>
            </section>

            <section className="budget-card">
              <div className="section-heading"><div><p className="step-label">Running estimate</p><h2>{formatMoney(costs.total)}</h2></div><Badge variant={costs.total > trip.maxBudgetDkk ? "destructive" : "secondary"}>{costs.total > trip.maxBudgetDkk ? "Over limit" : `${formatMoney(trip.maxBudgetDkk - costs.total)} left`}</Badge></div>
              <div className="budget-lines">
                <BudgetLine label="Return travel" value={costs.travelCost} note={selectedTravel ? `${modeLabels[selectedTravel.mode]} · ${trip.participants} people` : "Choose a travel mode"} />
                <BudgetLine label="Lodging" value={costs.lodgingCost} note={`${trip.nights.filter((night) => night.kind !== "none").length} of ${trip.nights.length} nights planned`} />
                {trip.customCosts.map((item) => (
                  <div className="budget-line" key={item.id}><div><strong>{item.label}</strong><small>Custom cost</small></div><span>{formatMoney(item.amountDkk)}<Button aria-label={`Remove ${item.label}`} onClick={() => save({ ...trip, customCosts: trip.customCosts.filter((cost) => cost.id !== item.id) })} size="icon" variant="ghost"><Trash2 /></Button></span></div>
                ))}
              </div>
              <AddCostDialog onAdd={(label, amount) => save(addCustomCost(trip, label, amount))} />
            </section>

            <section className="source-note">
              <Clock3 />
              <div><strong>Planning snapshot</strong><p>Travel values are the estimates saved when this trip was created. Later catalog updates will not silently change this budget.</p></div>
            </section>
          </aside>
        </section>
      </main>
    </AppShell>
  );
}

function TravelDayBlock({ direction, travel }: { direction: string; travel?: PlannedTrip["travelSnapshot"][number] }) {
  return (
    <div className="travel-day-block">
      <span>{travel ? modeIcon(travel.mode) : <ChevronRight />}</span>
      <div><strong>{direction}</strong><small>{travel ? `${modeLabels[travel.mode]} · approximately ${formatHours(travel.oneWayHours)} each way` : "Choose a travel mode above to fill this slot"}</small></div>
    </div>
  );
}

function AddHikeDialog({
  day,
  destinationHikes,
  maxDuration,
  onAdd,
}: {
  day: number;
  destinationHikes: Hike[];
  maxDuration: number;
  onAdd: (activity: { kind: "catalog-hike" | "custom-hike"; hikeId?: string; name: string; description: string; durationDays: number }) => void;
}) {
  const [hikeId, setHikeId] = useState(destinationHikes[0]?.id ?? "");
  const [duration, setDuration] = useState(destinationHikes[0]?.durationDays ?? 1);
  const [customName, setCustomName] = useState("");
  const [customDescription, setCustomDescription] = useState("");
  const [customDuration, setCustomDuration] = useState(1);
  const selected = destinationHikes.find((hike) => hike.id === hikeId);

  return (
    <Dialog>
      <DialogTrigger asChild><Button className="add-day-button" size="sm" variant="ghost"><Plus /> Add hike to day {day}</Button></DialogTrigger>
      <DialogContent className="hike-dialog">
        <DialogHeader><DialogTitle>Add a hike</DialogTitle><DialogDescription>{destinationHikes.length ? "Choose an area route or add a simple personal route name. Multi-day hikes fill consecutive day slots." : "No catalog routes are published for this hub yet. Add a personal route name to continue planning."}</DialogDescription></DialogHeader>
        <Tabs defaultValue={destinationHikes.length ? "known" : "custom"}>
          <TabsList className="w-full"><TabsTrigger disabled={!destinationHikes.length} value="known">{destinationHikes.length ? "Area routes" : "Routes being curated"}</TabsTrigger><TabsTrigger value="custom">Your own hike</TabsTrigger></TabsList>
          <TabsContent className="dialog-form" value="known">
            <label><span>Hike</span><select value={hikeId} onChange={(event) => { const next = destinationHikes.find((item) => item.id === event.target.value); setHikeId(event.target.value); setDuration(Math.min(next?.durationDays ?? 1, maxDuration)); }}>{destinationHikes.map((hike) => <option key={hike.id} value={hike.id}>{hike.name}</option>)}</select></label>
            {selected ? <div className="hike-choice-summary"><Mountain /><div><strong>{selected.distanceKm} km · {selected.ascentM} m ascent · {selected.difficulty}</strong><p>{selected.description}</p>{!selected.route.length ? <small>Route geometry is still being curated; this adds the hike details without drawing an invented map line.</small> : null}</div></div> : null}
            <label><span>Use duration</span><select value={duration} onChange={(event) => setDuration(Number(event.target.value))}>{Array.from({ length: maxDuration }, (_, index) => index + 1).map((value) => <option key={value} value={value}>{value} day{value === 1 ? "" : "s"}</option>)}</select><small>Overrides the catalog duration for this plan.</small></label>
            <DialogFooter><DialogClose asChild><Button disabled={!selected} onClick={() => selected && onAdd({ kind: "catalog-hike", hikeId: selected.id, name: selected.name, description: selected.description, durationDays: duration })}>Add to itinerary</Button></DialogClose></DialogFooter>
          </TabsContent>
          <TabsContent className="dialog-form" value="custom">
            <label><span>Hike name</span><input maxLength={80} onChange={(event) => setCustomName(event.target.value)} placeholder="e.g. Local ridge exploration" value={customName} /></label>
            <label><span>Short description</span><textarea maxLength={220} onChange={(event) => setCustomDescription(event.target.value)} placeholder="Route idea and anything you want to remember" rows={3} value={customDescription} /></label>
            <label><span>Duration</span><select value={customDuration} onChange={(event) => setCustomDuration(Number(event.target.value))}>{Array.from({ length: maxDuration }, (_, index) => index + 1).map((value) => <option key={value} value={value}>{value} day{value === 1 ? "" : "s"}</option>)}</select></label>
            <DialogFooter><DialogClose asChild><Button disabled={!customName.trim()} onClick={() => onAdd({ kind: "custom-hike", name: customName.trim(), description: customDescription.trim() || "Personal route", durationDays: customDuration })}>Add custom hike</Button></DialogClose></DialogFooter>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

function NightRow({ destinationId, night, onChange }: { destinationId: string; night: LodgingNight; onChange: (night: LodgingNight) => void }) {
  return (
    <div className="night-row">
      <span className="night-line" /><span className="night-icon">{night.kind.startsWith("tent") ? <TentTree /> : <BedDouble />}</span>
      <div className="night-copy"><small>Night {night.afterDay}</small><strong>{night.name}</strong>{night.costDkk ? <span>{formatMoney(night.costDkk)}</span> : null}</div>
      <Dialog>
        <DialogTrigger asChild><Button size="sm" variant="ghost"><Pencil /> {night.kind === "none" ? "Choose" : "Edit"}</Button></DialogTrigger>
        <LodgingDialogContent destinationId={destinationId} night={night} onChange={onChange} />
      </Dialog>
    </div>
  );
}

function LodgingDialogContent({ destinationId, night, onChange }: { destinationId: string; night: LodgingNight; onChange: (night: LodgingNight) => void }) {
  const destination = destinationById.get(destinationId)!;
  const [kind, setKind] = useState<LodgingNight["kind"]>(night.kind === "none" ? "tent-free" : night.kind);
  const [name, setName] = useState(night.name === "Not chosen" ? "Wild tent" : night.name);
  const [cost, setCost] = useState(night.costDkk);
  const [knownId, setKnownId] = useState(night.knownLodgingId ?? destination.lodgings[0]?.id ?? "");
  const chooseKind = (next: LodgingNight["kind"]) => {
    setKind(next);
    if (next === "tent-free") { setName("Wild tent"); setCost(0); }
    if (next === "tent-camping") { setName("Camping site"); setCost(250); }
    if (next === "known") {
      const known = destination.lodgings.find((item) => item.id === knownId) ?? destination.lodgings[0];
      if (known) { setName(known.name); setCost(known.nightlyCostDkk); setKnownId(known.id); }
    }
    if (next === "other") { setName(""); setCost(0); }
  };
  const selectKnown = (id: string) => {
    const known = destination.lodgings.find((item) => item.id === id);
    setKnownId(id);
    if (known) { setName(known.name); setCost(known.nightlyCostDkk); }
  };
  return (
    <DialogContent>
      <DialogHeader><DialogTitle>Night {night.afterDay}</DialogTitle><DialogDescription>Choose where the group expects to sleep. The amount is for the whole group.</DialogDescription></DialogHeader>
      <div className="lodging-options">
        {([
          ["tent-free", "Tent · free", "Outside a paid site"],
          ["tent-camping", "Tent · campsite", "Enter the site cost"],
          ["known", "Known lodging", "Cabins and camps in this area"],
          ["other", "Other", "Name and price it yourself"],
        ] as const).map(([value, label, note]) => <button className={kind === value ? "is-active" : ""} key={value} onClick={() => chooseKind(value)} type="button"><span>{value.startsWith("tent") ? <TentTree /> : <BedDouble />}</span><span><strong>{label}</strong><small>{note}</small></span>{kind === value ? <Check /> : null}</button>)}
      </div>
      <div className="dialog-form">
        {kind === "known" ? <label><span>Search known lodging</span><select value={knownId} onChange={(event) => selectKnown(event.target.value)}>{destination.lodgings.map((item) => <option key={item.id} value={item.id}>{item.name} · {formatMoney(item.nightlyCostDkk)}</option>)}</select></label> : null}
        {kind === "other" ? <label><span>Name</span><input onChange={(event) => setName(event.target.value)} placeholder="Guesthouse, cabin…" value={name} /></label> : null}
        {kind === "tent-camping" || kind === "other" ? <label><span>Group cost for this night (DKK)</span><input min={0} onChange={(event) => setCost(Number(event.target.value))} type="number" value={cost} /></label> : null}
      </div>
      <DialogFooter><DialogClose asChild><Button disabled={!Number.isFinite(cost) || cost < 0} onClick={() => onChange({ afterDay: night.afterDay, kind, name: name || "Other lodging", costDkk: Math.max(0, cost), knownLodgingId: kind === "known" ? knownId : undefined })}>Save night</Button></DialogClose></DialogFooter>
    </DialogContent>
  );
}

function AddCostDialog({ onAdd }: { onAdd: (label: string, amount: number) => void }) {
  const [label, setLabel] = useState("");
  const [amount, setAmount] = useState(0);
  return (
    <Dialog>
      <DialogTrigger asChild><Button className="w-full" variant="outline"><Plus /> Add custom cost</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Add a budget item</DialogTitle><DialogDescription>Use this for food, permits, equipment or any other whole-trip estimate.</DialogDescription></DialogHeader>
        <div className="dialog-form"><label><span>Label</span><input onChange={(event) => setLabel(event.target.value)} placeholder="Food and trail snacks" value={label} /></label><label><span>Amount (DKK)</span><input min={0} onChange={(event) => setAmount(Number(event.target.value))} type="number" value={amount} /></label></div>
        <DialogFooter><DialogClose asChild><Button disabled={!label.trim() || amount <= 0} onClick={() => onAdd(label.trim(), amount)}>Add cost</Button></DialogClose></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function BudgetLine({ label, value, note }: { label: string; value: number; note: string }) {
  return <div className="budget-line"><div><strong>{label}</strong><small>{note}</small></div><span>{formatMoney(value)}</span></div>;
}

function modeIcon(mode: TravelMode) {
  return mode === "car" ? <CarFront /> : mode === "train" ? <BusFront /> : <Plane />;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", { weekday: "short", month: "short", day: "numeric" }).format(new Date(`${value}T12:00:00`));
}

function formatDateInput(value: string) {
  const [year, month, day] = value.split("-");
  return `${day}/${month}/${year}`;
}
