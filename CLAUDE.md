# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Energy Price Navigator — fetches, caches, and visualizes Austrian and German electricity spot market prices from the aWATTar API. Deployed as a static site on GitHub Pages.

## Commands

```bash
npm install          # Install dependencies (node-fetch, luxon)
node prefetch.js     # Fetch latest price data and update cached JSON files
```

There are no test or lint commands configured. The project has no build step — the frontend is vanilla JS served directly.

## Architecture

### Data Pipeline

`prefetch.js` is the core backend script. It runs daily via GitHub Actions (14:00 UTC):
1. Fetches hourly market prices from `api.awattar.at` / `api.awattar.de`
2. Merges new data with existing `page/cached-data-austria.json` and `page/cached-data-germany.json` (deduplicates by timestamp)
3. Writes updated JSON files, commits, and deploys to GitHub Pages

`availableData.js` is a utility to probe the API for the earliest available data point using binary search.

### Frontend

`page/index.html` is a self-contained single-page application (all JS inline):
- Loads cached JSON data on page load; falls back to live API calls for missing ranges
- Renders a stacked bar chart (Chart.js via CDN) showing price breakdown per hour
- Displays a paginated data table (50 rows/page)
- Price components are stacked: market price → grid fees → provider fees → electricity tax → VAT

### Price Calculation Model

Each hourly price is composed of:
- **Market price**: from API (EUR/MWh, converted to ct/kWh by ÷10)
- **Grid fees**: fetched from `https://spotprices.github.io/gridfees/v1/all.json` (Netzebene 7 nicht gemessen), computed as `arbeitspreis + netzverlustentgelt + leistungspreis / 3500`
- **Provider fees**: aWATTar (1.5 ct/kWh + 3% markup) or SmartEnergy (1.2 ct/kWh flat)
- **Electricity tax**: 1.5 ct/kWh standard, with special reduced rates for 2022–2024
- **VAT**: calculated as total ÷ 6

Grid fees vary by Austrian region and year. The gridfees API provides tariff-period-aware rates (SHT/SNT/WHT/WNT = summer/winter × high/low tariff) and covers amendments from 2015–2026. The `spotprices/gridfees` repo is the upstream source.

### CI/CD

`.github/workflows/deploy.yml`: Scheduled daily + manual dispatch. Runs `node prefetch.js`, commits cached data, and deploys `page/` directory to GitHub Pages.

## Key Conventions

- All timestamps are Unix milliseconds; display uses Luxon with `Europe/Berlin` timezone
- Cached data JSON format: array of `{ start_timestamp, end_timestamp, marketprice }` (marketprice in EUR/MWh)
- The prefetch script fetches up to 20 years of lookback data, using the cache's latest timestamp to avoid re-fetching
- No framework or bundler — frontend changes go directly in `page/index.html`
