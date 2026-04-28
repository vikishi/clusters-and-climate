# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A Hugo static blog at [clustersandclimate.com](https://clustersandclimate.com) — personal writing by Dr. Vivek Shilimkar covering technology (green cloud, Kubernetes), climate science, science communication, outdoor adventures, and diary entries (some in Marathi/Devanagari script).

## Commands

```bash
# Local dev server with live reload
hugo server

# Build site into public/
hugo

# Deploy (builds + copies public/* to repo root + force-pushes master)
./deploy.sh "Your commit message"
```

Hugo v0.160.1+extended is installed via snap.

## Content structure

All posts live under `content/<category>/`. Categories are: `technology`, `climate`, `science`, `outdoor`, `life`, `diary`.

**Post frontmatter** (YAML, use `---` delimiters):

```yaml
---
title: "Post Title"
date: 2026-04-23
author: Dr. Vivek Shilimkar
description: "SEO meta description (≤160 chars)"
tags: ["tag1", "tag2"]
categories: ["technology"]
image: "/images/tech/filename.png"
---
```

Images go in `assets/images/<category>/` (the `assets/` folder is mounted as Hugo static via `hugo.toml`). The `image` frontmatter field is used for the hero image and Open Graph/Twitter card — it accepts a path relative to `assets/` (e.g. `/images/tech/foo.png`) or an absolute URL.

## Theme and layouts

The theme is `pehtheme` (in `themes/pehtheme/`). Custom overrides live in `layouts/` at the repo root — these take precedence over the theme. Key overrides:

- `layouts/_default/single.html` — article page: breadcrumb, hero image (auto-resized to 750px wide), author box, reading time, Giscus comments, related posts sidebar
- `layouts/partials/head.html` — SEO meta, Open Graph + Twitter cards, Google Fonts (Noto Sans Devanagari for Marathi content), Google Analytics

When editing layouts, Hugo template syntax applies. Images referenced in layouts are processed as Hugo resources via `resources.Get`, not raw static files.

## Deployment model

There is no separate `gh-pages` branch. GitHub Pages serves from the `master` branch root. `deploy.sh` builds with `hugo`, copies `public/*` to the repo root, then force-pushes master. This means HTML files at the repo root are generated artifacts — don't edit them directly.

## Commit conventions

- **New article**: commit message = exact article title (e.g. `Why Carbon-Aware Systems Can Cost More and Still Be the Right Choice`)
- **Article update**: prefix with `update:` (e.g. `update: Why Carbon-Aware Systems...`)
- **Other changes**: short imperative description of what changed
- Never include "Co-Authored-By Claude", "Generated with Claude", or any AI attribution in commit messages

## Key config (`hugo.toml`)

- `disablePathToLower = true` — URL slugs preserve original casing
- `summaryLength = 20` — 20-word excerpts on list pages
- `mainSections` — controls what appears on the homepage feed
- Markdown renderer has `unsafe = true` — raw HTML in `.md` files is allowed
