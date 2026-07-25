# Catalog product conventions

`data/catalog/records/<destination-key>.json` is the canonical publication
unit. Generated Explore, detail, coverage, and Convex deployment artifacts are
derived from these records by `pnpm catalog:compile`; they must never be edited
directly.

## Identity and visibility

- `destination.key` is the stable access-hub key. Legacy region or UI keys are
  listed in the `destination-core:aliases` claim.
- `destination.visibility` is `hidden` or `visible`. A source-backed hidden
  record may remain partial. A visible record must pass every readiness rule.
- Keys and aliases are globally unique. The compiler fails on ambiguous
  ownership and writes `data/catalog/generated/reconciliation.json`.

## Visible destination claims

The compiler recognizes these schema-version 3 claims:

| Domain | Field | Value |
| --- | --- | --- |
| `destination-core` | `country`, `summary`, `character`, `aliases` | Card and identity fields |
| `destination-core` | `guide.highlights`, `guide.terrain`, `guide.expectations` | Ordered original guide paragraphs |
| `seasonality` | `recommendedMonths` | Stable authority-backed hiking months |
| `media` | `hero` | Approved destination terrain image and full attribution |
| `hikes` | `hike` | One complete hike object per unique `subjectKey` |
| `hike-geometry` | `geometry` | Optional verified line and source metadata |
| travel domains | `estimate` | Existing planning estimate for each transport mode |
| `lodging` | `lodging` | Optional planning example |

Every claim carries its own source URL, retrieval and refresh timestamps,
confidence, and source kind. Prose is an original paraphrase; source text is
never copied into the record.

## Readiness

A visible destination requires:

- three guide sections of at least 80 words and at least 260 words in total;
- one destination-specific hero with storage URL, original dimensions, alt
  text, creator, allowlisted license and license URL, attribution, Commons or
  official source page, and an ISO calendar verification date (`YYYY-MM-DD`);
- at least five hikes with unique stable keys, name, original description,
  route type, difficulty, duration, trailhead/access context, and provenance;
- at least two difficulty levels and two duration bands;
- exactly one car, transit, and flight planning estimate.

Distance, ascent, descent, and geometry are omitted when the authority does not
publish them. Missing geometry is honest coverage, not a readiness failure.
Geometry requires a verified official/maintainer download, OSM hiking relation,
or other compatible licensed line, including attribution and retrieval data.

## Publication and deployment

1. Build the candidate under `.catalog-work/<run-id>/<destination-key>.json`.
2. Run `pnpm catalog:publish -- --dry-run <candidate>`. This overlays the
   candidate onto the complete catalog and performs all readiness, identity,
   cross-reference, and deterministic compilation checks.
3. Run `pnpm catalog:publish -- <candidate>`. Publication replaces the record
   and regenerates every artifact as one operation; a compiler failure restores
   the prior record.
4. Run `pnpm catalog:check`, tests, typecheck, and the relevant browser tests.

The content-addressed version is SHA-256 over canonical visible destination
inputs. Convex synchronization stages the generated artifact in bounded
batches, validates counts and references, and changes the active pointer only
after the new version is complete. The previous version is retained for
rollback. Synchronization never updates user-owned tables.

The Explore list returns only digest fields. Guide prose, hike provenance, and
hikes load with destination details; geometry loads separately for a selected
hike. Unconfigured preview mode uses the checked-in generated snapshot with the
same version.
