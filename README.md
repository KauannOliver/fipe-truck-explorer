# FIPE Truck Explorer

A browser interface for exploring truck reference prices, favorites and comparisons.

**HTML, CSS, JavaScript, REST APIs, SheetJS**

## What it does

- Selects make, model and model year for reference-price queries.
- Keeps favorites and compares selected references.
- Exports selected data for spreadsheet use.

## Workflow

```mermaid
flowchart LR
  N0["Make model and year"] --> N1
  N1["Reference API"] --> N2
  N2["Favorites and comparison"] --> N3
  N3["Export"]
```

## Local setup and use

Copy `config.example.js` to ignored `config.local.js` and configure a token for your authorized API account if required.
```powershell
python -m http.server 8000
```
Open `http://localhost:8000`. Browser configuration is visible to the user; use only a provider token suitable for client-side use.

## Boundaries and limitations

Reference prices depend on an external API and are not a valuation guarantee. This web explorer is separate from the Python `fipe-data-collector` bulk exporter.

This is a source snapshot, not a claim of production readiness. Business results, dates and unmeasured performance are intentionally not asserted. Application UI language is preserved.

## License

No new distribution license is granted for this corporate source edition. Public visibility does not grant reuse rights; obtain permission from the relevant rights holder. Existing third-party notices remain applicable.

## Verification record

See [snapshot checks and remaining limitations](docs/VERIFICATION.md).
