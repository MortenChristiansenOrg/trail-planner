# Data Source POCs

This directory contains small, source-specific integration proofs for Trail Planner.

Each source folder should contain:

- `README.md`: what was tested and how to rerun it.
- `poc.*`: the smallest script or command wrapper that fetches or transforms data.
- `raw/`: saved responses from the provider or source.
- `normalized/`: reduced JSON showing fields Trail Planner can use.
- `analysis.md`: verdict, limitations, opportunities, access notes, and next step.

These POCs are documentation as much as code. They should be easy to rerun, but they are not production integrations.

