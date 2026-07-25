import {
  createDefaultPreferences,
  defaultHomeCity,
  energyUnit,
  type Powertrain,
  type UserPreferences,
} from "@trail-planner/domain";
import { Check, MapPin, Settings2 } from "lucide-react";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { usePreferences } from "@/features/preferences/PreferencesSession";
import { CityCombobox } from "@/features/preferences/CityCombobox";

export function SettingsPage() {
  const session = usePreferences();
  const initial =
    session.preferences ??
    createDefaultPreferences(defaultHomeCity);
  const [draft, setDraft] = useState<UserPreferences>(initial);
  const [cityInvalid, setCityInvalid] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const edited = useRef(false);
  const unit = energyUnit(draft.vehicle.powertrain);

  useEffect(() => {
    if (session.ready && session.preferences && !edited.current) {
      setDraft(session.preferences);
    }
  }, [session.preferences, session.ready]);

  const updateVehicle = (
    changes: Partial<UserPreferences["vehicle"]>,
  ) => {
    edited.current = true;
    setSaved(false);
    setSaveError(false);
    setDraft((current) => ({
      ...current,
      vehicle: { ...current.vehicle, ...changes },
    }));
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (cityInvalid) return;
    setSaved(false);
    setSaveError(false);
    const next = {
      ...draft,
      vehicle: {
        ...draft.vehicle,
        version: (session.preferences?.vehicle.version ?? 0) + 1,
        chargingPlan:
          draft.vehicle.powertrain === "ev" &&
          draft.vehicle.chargingPlan?.name.trim()
            ? {
                name: draft.vehicle.chargingPlan.name.trim(),
                pricePerKwh: draft.vehicle.chargingPlan.pricePerKwh,
              }
            : undefined,
      },
    };
    try {
      await session.save(next);
      edited.current = false;
      setDraft(next);
      setSaved(true);
    } catch {
      setSaveError(true);
    }
  };

  return (
    <AppShell>
      <main className="settings-page">
        <header className="page-heading settings-heading">
          <div>
            <p className="eyebrow">
              <Settings2 /> Personal planning assumptions
            </p>
            <h1>Settings</h1>
            <p>
              Your home city shapes routes and ranking. Vehicle values shape
              itemized driving estimates without sending a private address to a
              public geocoder.
            </p>
          </div>
          <span className="settings-storage">
            {session.mergedAnonymousPreferences
              ? "Browser settings merged into your account"
              : session.storage === "account"
                ? "Saved to your account"
              : "Saved in this browser"}
          </span>
        </header>

        <form className="settings-form" onSubmit={submit}>
          <FieldSet>
            <FieldLegend>Home location</FieldLegend>
            <FieldDescription>
              Search the comprehensive official Danish city catalog. Exact
              street addresses are not collected.
            </FieldDescription>
            <FieldGroup>
              <Field data-invalid={cityInvalid}>
                <FieldLabel htmlFor="home-city">
                  <MapPin /> Home city
                </FieldLabel>
                <CityCombobox
                  id="home-city"
                  invalid={cityInvalid}
                  key={draft.homeCity.key}
                  onChange={(city) => {
                    if (city) {
                      edited.current = true;
                      setCityInvalid(false);
                      setSaved(false);
                      setSaveError(false);
                      setDraft((current) => ({
                        ...current,
                        homeCity: city,
                      }));
                    } else {
                      edited.current = true;
                      setCityInvalid(true);
                      setSaved(false);
                    }
                  }}
                  value={draft.homeCity}
                />
                {cityInvalid ? (
                  <FieldError>Select a city from the search results.</FieldError>
                ) : null}
              </Field>
            </FieldGroup>
          </FieldSet>

          <FieldSet>
            <FieldLegend>Default vehicle</FieldLegend>
            <FieldDescription>
              Estimates cover vehicle energy or fuel only. Add tolls, parking,
              and other trip-specific charges as custom trip expenses.
            </FieldDescription>
            <FieldGroup className="settings-field-grid">
              <Field>
                <FieldLabel htmlFor="powertrain">Powertrain</FieldLabel>
                <Select
                  value={draft.vehicle.powertrain}
                  onValueChange={(powertrain: Powertrain) =>
                    updateVehicle({
                      powertrain,
                      consumptionPer100Km:
                        powertrain === "ev" ? 20 : 6,
                      energyPricePerUnit:
                        powertrain === "ev"
                          ? 2.5
                          : powertrain === "petrol"
                            ? 15
                            : 14,
                      chargingPlan:
                        powertrain === "ev"
                          ? draft.vehicle.chargingPlan
                          : undefined,
                    })
                  }
                >
                  <SelectTrigger className="w-full" id="powertrain">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="petrol">Petrol</SelectItem>
                      <SelectItem value="diesel">Diesel</SelectItem>
                      <SelectItem value="ev">Electric</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </Field>

              <NumberField
                description={`Estimated ${unit} used per 100 km.`}
                id="consumption"
                label={`Consumption (${unit}/100 km)`}
                min={0.1}
                onChange={(consumptionPer100Km) =>
                  updateVehicle({ consumptionPer100Km })
                }
                step={0.1}
                value={draft.vehicle.consumptionPer100Km}
              />
              <NumberField
                description={`Default price per ${unit}.`}
                id="energy-price"
                label={`${draft.vehicle.powertrain === "ev" ? "Electricity" : "Fuel"} price (DKK/${unit})`}
                min={0}
                onChange={(energyPricePerUnit) =>
                  updateVehicle({ energyPricePerUnit })
                }
                step={0.01}
                value={draft.vehicle.energyPricePerUnit}
              />
              <OptionalNumberField
                description="Optional direct override. Leave blank to calculate it from consumption and unit price."
                id="per-km-override"
                label="Running cost override (DKK/km)"
                min={0}
                onChange={(costPerKmOverrideDkk) =>
                  updateVehicle({ costPerKmOverrideDkk })
                }
                step={0.01}
                value={draft.vehicle.costPerKmOverrideDkk}
              />

              {draft.vehicle.powertrain === "ev" ? (
                <>
                  <Field>
                    <FieldLabel htmlFor="charging-plan">
                      Charging plan name (optional)
                    </FieldLabel>
                    <Input
                      id="charging-plan"
                      onChange={(event) =>
                        updateVehicle({
                          chargingPlan: event.target.value
                            ? {
                                name: event.target.value,
                                pricePerKwh:
                                  draft.vehicle.chargingPlan?.pricePerKwh ??
                                  draft.vehicle.energyPricePerUnit,
                              }
                            : undefined,
                        })
                      }
                      placeholder="e.g. Home charging"
                      value={draft.vehicle.chargingPlan?.name ?? ""}
                    />
                    <FieldDescription>
                      When present, its kWh rate replaces the default electricity
                      price.
                    </FieldDescription>
                  </Field>
                  <OptionalNumberField
                    description="Effective subscription or charging-plan rate."
                    id="charging-price"
                    label="Charging plan price (DKK/kWh)"
                    min={0}
                    onChange={(pricePerKwh) =>
                      updateVehicle({
                        chargingPlan:
                          pricePerKwh === undefined
                            ? undefined
                            : {
                                name:
                                  draft.vehicle.chargingPlan?.name ||
                                  "Charging plan",
                                pricePerKwh,
                              },
                      })
                    }
                    step={0.01}
                    value={draft.vehicle.chargingPlan?.pricePerKwh}
                  />
                </>
              ) : null}
            </FieldGroup>
          </FieldSet>

          <div className="settings-actions">
            <Button type="submit">Save settings</Button>
            {saved ? (
              <span role="status">
                <Check /> Settings saved
              </span>
            ) : null}
            {saveError ? (
              <span role="alert">
                Settings could not be saved. Check your connection and try again.
              </span>
            ) : null}
          </div>
        </form>
      </main>
    </AppShell>
  );
}

function NumberField({
  description,
  id,
  label,
  min,
  onChange,
  step,
  value,
}: {
  description?: string;
  id: string;
  label: string;
  min: number;
  onChange: (value: number) => void;
  step: number;
  value: number;
}) {
  return (
    <Field>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <Input
        id={id}
        min={min}
        onChange={(event) => onChange(event.target.valueAsNumber)}
        required
        step={step}
        type="number"
        value={value}
      />
      {description ? <FieldDescription>{description}</FieldDescription> : null}
    </Field>
  );
}

function OptionalNumberField({
  description,
  id,
  label,
  min,
  onChange,
  step,
  value,
}: {
  description: string;
  id: string;
  label: string;
  min: number;
  onChange: (value?: number) => void;
  step: number;
  value?: number;
}) {
  return (
    <Field>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <Input
        id={id}
        min={min}
        onChange={(event) =>
          onChange(event.target.value ? event.target.valueAsNumber : undefined)
        }
        step={step}
        type="number"
        value={value ?? ""}
      />
      <FieldDescription>{description}</FieldDescription>
    </Field>
  );
}
