# Fictional sample data

Everything here is invented (Fabrikam, Northwind, Contoso, Tailspin, Woodgrove; made-up people). It has the same
shape as the real UKI account export, so `make parse GTM_DATA_DIR=sample-data` works for anyone cloning the repo.

The real account data lives outside this repo (default `../../private-data/gtm-cockpit`, see the Makefile) and is
never committed. `Fabrikam` appears twice on purpose, to exercise the duplicate-record consolidation.
