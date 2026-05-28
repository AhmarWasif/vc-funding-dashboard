# Venture Funnel — AI/SaaS Funding Dashboard

An interactive analytics dashboard that argues a specific thesis about venture
capital: **it's a funnel, not a ladder.** The number of rounds collapses from
Seed to Series D while the median check size explodes — a brutally concentrated
pattern that holds across sectors, geographies, and time.

**Live: [vc-funding-dashboard.vercel.app](https://vc-funding-dashboard.vercel.app/)**

This is my second AI-native project — a data tool built to demonstrate that
strategy and operations thinking can be expressed in shipped product, not just
slides.

## What it does

- Visualizes ~1,200 North American AI & SaaS funding rounds (Seed to Series D)
- Interactive filters by industry, stage, and region — every view recomputes live
- A dual-axis funnel chart showing **count collapsing while check size grows**
- Sector and geography concentration views revealing the power-law of capital
- An **AI "ask the data" layer** that lets users query the current view in plain
  English and get analyst-style answers grounded in the filtered data

## Thesis & framing

Most venture-funding dashboards default to "trends over time" — which is exactly
the wrong frame for the question that actually matters to operators and founders:
*how does this asset class actually work?* That question is **structural**, not
temporal. The funnel framing reveals a mechanism that doesn't change year over
year: a few companies absorb most of the capital, and the filtering happens
ruthlessly at every stage.

Choosing a structural thesis was also a deliberate analytical decision given the
nature of the data (see note below): a structural mechanism is true regardless
of the dataset's vintage, while a "what's hot now" framing would have quietly
undermined itself.

## How it's built

A static front end backed by a serverless function, deployed on Vercel:

- **Front end** — vanilla HTML / CSS / JS with [Chart.js](https://chartjs.org)
  for visualizations and [PapaParse](https://papaparse.com) for CSV handling.
  No build tools, no framework — the codebase is a single readable HTML file
  and a single backend function.
- **Backend** — a Vercel serverless function (`api/generate.js`) that holds the
  Claude API key as a server-side environment variable and proxies AI requests.
- **AI** — the [Claude API](https://docs.claude.com/en/api/overview) using the
  `claude-haiku-4-5` model.

### Why aggregated context (not raw rows)

The naive way to build an AI-over-data feature is to send every row to the model
with each question. That's slow, expensive, hits token limits, and is — frankly
— what most people do.

This dashboard instead computes a **compact JSON summary** of the
currently-filtered data on the front end (totals, funnel by stage, sector
totals, top metros, country split, and a sector × stage crosstab) and sends
*that* to the model alongside the question. A few hundred tokens instead of
thousands. Faster, cheaper, and the model doesn't need raw rows to answer
pattern questions — it needs the patterns.

### Filter-aware honesty

A real engineering question in AI-over-data tools is: *what happens when the
user's question doesn't fit the data scope they've selected?* Most AI features
either bullshit confidently or refuse generically. This one diagnoses,
explains, and redirects.

For example, asking *"which sector has the steepest drop-off?"* while the
filter is set to a single industry returns:

> *"I can't answer this meaningfully with the current filter scope. Since only
> Generative AI is selected, the sector breakdown shows co-tagging patterns
> rather than per-sector funnels. To compare drop-off rates across sectors,
> remove the industry filter."*

That's the bar AI features should hit: actively useful while honest about its
own limits. Getting there required treating the data-context layer as a real
engineering surface — not just a model-prompting problem.

## Note on the dataset

The data is a **representative dataset** modeling current AI & SaaS funding
patterns — invented company and investor names, real-shaped distributions
(stage counts, check-size growth, geographic concentration, power-law tails).
Real-time Crunchbase / PitchBook data is paywalled, and the dashboard's purpose
is to demonstrate analytical and engineering capability, not to make claims
about specific real companies. Anyone evaluating this should treat it as a
*build demonstration*, not a market research document.

The dashboard is architected so a real dataset with the same column structure
(Crunchbase export, etc.) drops in without code changes.

## Project structure

```
vc-funding-dashboard/
├── index.html                    # front end (UI + chart logic + summary builder)
├── ai_saas_funding_rounds.csv    # representative dataset
├── api/
│   └── generate.js               # serverless function (key + Claude call)
├── .gitignore
└── README.md
```

## Running it yourself

1. Clone this repo.
2. Get an Anthropic API key at [console.anthropic.com](https://console.anthropic.com).
3. Deploy to Vercel and add the key as an environment variable named
   `ANTHROPIC_API_KEY`. Vercel auto-detects the static site and the `api`
   folder — no build configuration needed.
4. The dashboard works against the included CSV out of the box. To use your
   own data, replace `ai_saas_funding_rounds.csv` with a file that has the
   same column structure.

## What this project taught me

- **Context engineering is the real LLM design surface.** Output quality is
  bounded by the data you provide, not the model's intelligence. Building this
  meant deciding what aggregations the AI sees, not what prompts I write.
- **Data integrity is the credibility layer.** Found and fixed a bug where the
  AI was citing numbers that didn't match the visible charts — caught by using
  my own product and asking "can the AI actually know this from the data
  context I gave it?" That epistemic question is the most underrated skill in
  AI app work.
- **Graceful failure is a feature.** An AI tool that refuses honestly when
  asked something it can't answer is more trustworthy than one that always
  responds confidently. The architecture had to make that possible.
- **Match question to data.** A structural thesis (the funnel) ages
  gracefully on any dataset; a temporal thesis would have undermined itself.
  That choice was the most important analytical decision in the project.

## Roadmap

- [x] Build the analytical layer (funnel, sector, geography)
- [x] Wire up live filtering with cross-view consistency
- [x] Add AI reasoning layer with filter-aware context
- [x] Deploy with secure backend
- [ ] Add a time-series view if/when a current real-time data source becomes available
- [ ] Investor concentration view (lead investor activity over the period)
- [ ] Export a "view" as a shareable snapshot URL
