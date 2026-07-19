import { Link, useNavigate } from "@tanstack/react-router";
import type { TravelOptionSnapshot } from "@trail-planner/domain";
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
  RotateCcw,
  Share2,
  TentTree,
  Trash2,
  UsersRound,
} from "lucide-react";
import { useRef, useState } from "react";
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
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { AppShell } from "@/components/layout/AppShell";
import { CatalogMediaFigure } from "@/features/catalog/CatalogMediaFigure";
import { TravelOptionDetails } from "@/features/catalog/TravelOptionDetails";
import { loadTravelOption } from "@/features/catalog/travelOptionLoader";
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
  applyLodgingChoice,
  applyStartDate,
  calculateTripCost,
  getCostItemAmount,
  getSelectedTravel,
  removeActivityGroup,
  removeCustomCost,
  setTripCostOverride,
  type LodgingNight,
  type LodgingApplyScope,
  type PlannedTrip,
  type TripCostItem,
} from "@/features/trips/model";
import { useTripStore } from "@/features/trips/TripStore";

export function TripDetailPage({ tripId }: { tripId: string }) {
  const store = useTripStore();
  const navigate = useNavigate();
  const [selectedMapItem, setSelectedMapItem] = useState<string>();
  const [shareUrl, setShareUrl] = useState<string>();
  const [shareCopyStatus, setShareCopyStatus] = useState<"copied" | "manual">();
  const trip = store.trips.find((item) => item.id === tripId);
  const tripRef = useRef(trip);
  const travelRequestRef = useRef(0);
  tripRef.current = trip;

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
  else if (selectedActivity && !selectedHike) selectedRouteStatus = "Saved catalog hike is no longer available";
  else if (selectedActivity) selectedRouteStatus = selectedHike?.route.length ? "Selected trail · source-backed route" : "Selected hike · route geometry being curated";

  const save = (next: PlannedTrip) => store.update(next);
  const selectTravel = async (mode: TravelMode) => {
    const requestId = ++travelRequestRef.current;
    const selectedTripId = trip.id;
    const estimate = trip.travelSnapshot.find((item) => item.mode === mode);
    let option: TravelOptionSnapshot | undefined;
    try {
      option = estimate?.optionId ? await loadTravelOption(estimate.optionId) : undefined;
    } catch {
      option = undefined;
    }
    if (requestId !== travelRequestRef.current) return;
    const latest = tripRef.current;
    if (latest?.id === selectedTripId) {
      const selectedTravelOption = option ?? (
        latest.selectedTravelMode === mode && latest.selectedTravelOption?.id === estimate?.optionId
          ? latest.selectedTravelOption
          : undefined
      );
      await save({ ...latest, selectedTravelMode: mode, selectedTravelOption });
    }
  };
  const updateNight = (night: LodgingNight, scope?: LodgingApplyScope) => save(applyLodgingChoice(trip, night, scope));
  const discardTrip = () => store.remove(trip.id);
  const returnToExplore = () => navigate({ to: "/explore", search: trip.exploreSnapshot, replace: true });
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
            <DiscardTripDialog destinationName={destination.name} onDiscard={discardTrip} onReturn={returnToExplore} tripTitle={trip.title} />
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
                  <div className="travel-choice-wrap" key={estimate.mode}>
                    <button
                      className={`travel-choice${trip.selectedTravelMode === estimate.mode ? " is-selected" : ""}`}
                      disabled={!estimate.available}
                      onClick={() => void selectTravel(estimate.mode)}
                      type="button"
                    >
                      <span className="travel-choice__icon">{modeIcon(estimate.mode)}</span>
                      <span><small>{modeLabels[estimate.mode]}{estimate.mode === "plane" ? ` · ${estimate.layovers ?? 0} layover${estimate.layovers === 1 ? "" : "s"}` : ""}</small><strong>{estimate.available ? formatHours(estimate.oneWayHours) : "Unavailable"}</strong><em>{estimate.available ? `${formatMoney(estimate.costPerPersonDkk * trip.participants)} total` : estimate.note}</em></span>
                      {trip.selectedTravelMode === estimate.mode ? <Check className="selected-check" /> : null}
                    </button>
                    {estimate.available ? <TravelOptionDetails label="Stage details" option={trip.selectedTravelMode === estimate.mode ? trip.selectedTravelOption : undefined} optionId={estimate.optionId} /> : null}
                  </div>
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
                      <NightRow
                        destinationId={destination.id}
                        night={trip.nights[index]}
                        onChange={updateNight}
                        plannedOtherNights={trip.nights.filter((night) => night.afterDay !== trip.nights[index].afterDay && night.kind !== "none").length}
                        remainingUnplannedNights={trip.nights.filter((night) => night.afterDay > trip.nights[index].afterDay && night.kind === "none").length}
                      />
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
              <div className="section-heading"><div><p className="step-label">Running estimate</p><h2>{formatMoney(costs.total)}</h2><p className="budget-per-person">{formatMoney(costs.perPerson)} per person</p></div><Badge variant={costs.total > trip.maxBudgetDkk ? "destructive" : "secondary"}>{costs.total > trip.maxBudgetDkk ? "Over limit" : `${formatMoney(trip.maxBudgetDkk - costs.total)} left`}</Badge></div>
              <div className="budget-categories">
                {costs.categories.map((category) => (
                  <section className={category.item.overrideCost !== undefined ? "budget-category is-overridden" : "budget-category"} key={category.item.id}>
                    <div className="budget-category__header">
                      <div className="budget-category__title">
                        <span><strong>{category.item.label}</strong>{category.item.overrideCost !== undefined ? <Badge variant="secondary">Overridden total</Badge> : null}</span>
                        {category.item.overrideNote ? <small>{category.item.overrideNote}</small> : null}
                      </div>
                      <span>
                        {formatMoney(category.total)}
                        {category.children.length > 1 || category.item.overrideCost !== undefined ? <CostItemEditor calculatedAmount={category.children.reduce((sum, item) => sum + item.calculatedCost.amount, 0)} item={category.item} onChange={(amount, note) => save(setTripCostOverride(trip, category.item.id, amount, note))} suggestedAmount={category.total} /> : null}
                      </span>
                    </div>
                    <div className="budget-components">
                      {category.children.map((item) => (
                        <div className={item.overrideCost !== undefined ? "budget-component is-overridden" : "budget-component"} key={item.id} style={{ paddingInlineStart: `${10 + (item.depth - 1) * 14}px` }}>
                          <div>
                            <strong>{item.label}</strong>
                            <small>{scopeLabel(item)} · {item.priceType}{item.overrideCost !== undefined ? ` · estimated ${formatMoney(item.calculatedCost.amount)}` : ""}</small>
                            {item.overrideNote ? <em>{item.overrideNote}</em> : null}
                          </div>
                          <span>
                            <Badge variant={item.overrideCost !== undefined ? "secondary" : item.priceType === "manual" ? "outline" : "secondary"}>{item.overrideCost !== undefined ? "Overridden" : item.priceType === "manual" ? "Custom" : "Calculated"}</Badge>
                            <strong>{formatMoney(getCostItemAmount(item))}</strong>
                            <CostItemEditor calculatedAmount={item.calculatedCost.amount} item={item} onChange={(amount, note) => save(setTripCostOverride(trip, item.id, amount, note))} suggestedAmount={getCostItemAmount(item)} />
                            {item.customCostId ? <Button aria-label={`Remove ${item.label}`} onClick={() => save(removeCustomCost(trip, item.customCostId!))} size="icon" variant="ghost"><Trash2 /></Button> : null}
                          </span>
                        </div>
                      ))}
                    </div>
                  </section>
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

function NightRow({
  destinationId,
  night,
  onChange,
  plannedOtherNights,
  remainingUnplannedNights,
}: {
  destinationId: string;
  night: LodgingNight;
  onChange: (night: LodgingNight, scope?: LodgingApplyScope) => void;
  plannedOtherNights: number;
  remainingUnplannedNights: number;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="night-row">
      <span className="night-line" /><span className="night-icon">{night.kind.startsWith("tent") ? <TentTree /> : <BedDouble />}</span>
      <div className="night-copy"><small>Night {night.afterDay}</small><strong>{night.name}</strong>{night.costDkk ? <span>{formatMoney(night.costDkk)}</span> : null}</div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild><Button size="sm" variant="ghost"><Pencil /> {night.kind === "none" ? "Choose" : "Edit"}</Button></DialogTrigger>
        {open ? <LodgingDialogContent
          destinationId={destinationId}
          night={night}
          onChange={onChange}
          plannedOtherNights={plannedOtherNights}
          remainingUnplannedNights={remainingUnplannedNights}
        /> : null}
      </Dialog>
    </div>
  );
}

function LodgingDialogContent({
  destinationId,
  night,
  onChange,
  plannedOtherNights,
  remainingUnplannedNights,
}: {
  destinationId: string;
  night: LodgingNight;
  onChange: (night: LodgingNight, scope?: LodgingApplyScope) => void;
  plannedOtherNights: number;
  remainingUnplannedNights: number;
}) {
  const destination = destinationById.get(destinationId)!;
  const [kind, setKind] = useState<LodgingNight["kind"]>(night.kind === "none" ? "tent-free" : night.kind);
  const [name, setName] = useState(night.name === "Not chosen" ? "Wild tent" : night.name);
  const [cost, setCost] = useState(night.costDkk);
  const [knownId, setKnownId] = useState(night.knownLodgingId ?? destination.lodgings[0]?.id ?? "");
  const [confirmOverwrite, setConfirmOverwrite] = useState(false);
  const valid = Number.isFinite(cost) && cost >= 0 && (
    kind !== "known" || destination.lodgings.some((lodging) => lodging.id === knownId)
  );
  const choice = (): LodgingNight => ({
    afterDay: night.afterDay,
    kind,
    name: name || "Other lodging",
    costDkk: Math.max(0, cost),
    knownLodgingId: kind === "known" ? knownId : undefined,
  });
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
        ] as const).map(([value, label, note]) => <button className={kind === value ? "is-active" : ""} disabled={value === "known" && destination.lodgings.length === 0} key={value} onClick={() => chooseKind(value)} type="button"><span>{value.startsWith("tent") ? <TentTree /> : <BedDouble />}</span><span><strong>{label}</strong><small>{value === "known" && destination.lodgings.length === 0 ? "No catalog lodging available" : note}</small></span>{kind === value ? <Check /> : null}</button>)}
      </div>
      <div className="dialog-form">
        {kind === "known" ? <label><span>Search known lodging</span><select value={knownId} onChange={(event) => selectKnown(event.target.value)}>{destination.lodgings.map((item) => <option key={item.id} value={item.id}>{item.name} · {formatMoney(item.nightlyCostDkk)}</option>)}</select></label> : null}
        {kind === "other" ? <label><span>Name</span><input onChange={(event) => setName(event.target.value)} placeholder="Guesthouse, cabin…" value={name} /></label> : null}
        {kind === "tent-camping" || kind === "other" ? <label><span>Group cost for this night (DKK)</span><input min={0} onChange={(event) => setCost(Number(event.target.value))} type="number" value={cost} /></label> : null}
      </div>
      {confirmOverwrite ? (
        <div className="overwrite-confirmation" role="alert">
          <strong>Replace lodging for every night?</strong>
          <p>{plannedOtherNights ? `${plannedOtherNights} already planned night${plannedOtherNights === 1 ? "" : "s"} will be replaced.` : "The same choice will be used for the complete trip."} You can still edit individual nights afterward.</p>
          <DialogFooter>
            <Button onClick={() => setConfirmOverwrite(false)} variant="outline">Keep individual nights</Button>
            <DialogClose asChild><Button disabled={!valid} onClick={() => onChange(choice(), "all")} variant="destructive">Confirm overwrite</Button></DialogClose>
          </DialogFooter>
        </div>
      ) : (
        <DialogFooter className="lodging-dialog-actions">
          <DialogClose asChild><Button disabled={!valid} onClick={() => onChange(choice())} variant="outline">Save night</Button></DialogClose>
          <DialogClose asChild><Button disabled={!valid || remainingUnplannedNights === 0} onClick={() => onChange(choice(), "remaining-unplanned")}>Apply to remaining unplanned ({remainingUnplannedNights})</Button></DialogClose>
          <Button disabled={!valid} onClick={() => setConfirmOverwrite(true)} variant="outline">Apply to every night</Button>
        </DialogFooter>
      )}
    </DialogContent>
  );
}

function DiscardTripDialog({
  destinationName,
  onDiscard,
  onReturn,
  tripTitle,
}: {
  destinationName: string;
  onDiscard: () => Promise<void>;
  onReturn: () => Promise<void>;
  tripTitle: string;
}) {
  const [open, setOpen] = useState(false);
  const [discarding, setDiscarding] = useState(false);
  const [error, setError] = useState<string>();
  const discard = async () => {
    if (discarding) return;
    setDiscarding(true);
    setError(undefined);
    try {
      await onDiscard();
    } catch {
      setError("The trip could not be discarded. Nothing was removed; please try again.");
      setDiscarding(false);
      return;
    }
    try {
      await onReturn();
    } catch {
      window.location.assign("/explore");
    }
  };

  return (
    <Dialog open={open} onOpenChange={(next) => { if (!discarding) { setOpen(next); if (!next) setError(undefined); } }}>
      <DialogTrigger asChild><Button variant="ghost"><Trash2 data-icon="inline-start" /> Discard trip</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Discard {tripTitle}?</DialogTitle>
          <DialogDescription>This permanently removes the {destinationName} plan and its share links. This action cannot be undone.</DialogDescription>
        </DialogHeader>
        {error ? <p className="dialog-error" role="alert">{error}</p> : null}
        <DialogFooter>
          <DialogClose asChild><Button disabled={discarding} variant="outline">Keep trip</Button></DialogClose>
          <Button disabled={discarding} onClick={() => void discard()} variant="destructive"><Trash2 data-icon="inline-start" /> {discarding ? "Discarding…" : "Discard trip"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
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

function CostItemEditor({
  calculatedAmount,
  item,
  onChange,
  suggestedAmount,
}: {
  calculatedAmount: number;
  item: TripCostItem;
  onChange: (amount?: number, note?: string) => void;
  suggestedAmount: number;
}) {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState(String(item.overrideCost?.amount ?? suggestedAmount));
  const [note, setNote] = useState(item.overrideNote ?? "");
  const numericAmount = Number(amount);
  const valid = amount.trim() !== "" && Number.isFinite(numericAmount) && numericAmount >= 0;
  const amountId = `${item.id}-override-amount`;
  const noteId = `${item.id}-override-note`;
  const changeOpen = (next: boolean) => {
    setOpen(next);
    if (next) {
      setAmount(String(item.overrideCost?.amount ?? suggestedAmount));
      setNote(item.overrideNote ?? "");
    }
  };

  return (
    <Dialog open={open} onOpenChange={changeOpen}>
      <DialogTrigger asChild><Button aria-label={`Edit ${item.label}`} size="icon" variant="ghost"><Pencil /></Button></DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Edit {item.label}</DialogTitle><DialogDescription>Clearing an override returns this row to its current calculated amount or itemized total.</DialogDescription></DialogHeader>
        <FieldGroup>
          <Field data-invalid={!valid}>
            <FieldLabel htmlFor={amountId}>Use amount (DKK)</FieldLabel>
            <Input aria-invalid={!valid} id={amountId} min={0} onChange={(event) => setAmount(event.target.value)} type="number" value={amount} />
            <FieldDescription>Calculated value: {formatMoney(calculatedAmount)} · {scopeLabel(item)}</FieldDescription>
            {!valid ? <FieldError>Enter zero or a positive amount.</FieldError> : null}
          </Field>
          <Field>
            <FieldLabel htmlFor={noteId}>Override note</FieldLabel>
            <Textarea id={noteId} maxLength={180} onChange={(event) => setNote(event.target.value)} placeholder="Why this amount is more useful" value={note} />
          </Field>
        </FieldGroup>
        <DialogFooter>
          {item.overrideCost !== undefined ? <Button onClick={() => { onChange(); setOpen(false); }} variant="outline"><RotateCcw data-icon="inline-start" /> Clear override</Button> : null}
          <Button disabled={!valid} onClick={() => { onChange(numericAmount, note); setOpen(false); }}>Use override</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function scopeLabel(item: TripCostItem) {
  if (item.chargingScope === "per-person") return "group total from a per-traveller rate";
  if (item.chargingScope === "per-vehicle") return `group total for ${item.quantity} vehicle${item.quantity === 1 ? "" : "s"}`;
  return item.quantity === 1 ? "whole-group cost" : `group total for ${item.quantity} units`;
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
