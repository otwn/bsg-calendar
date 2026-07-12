# Project Design Document

> This document tracks design decisions made during conversations.
> Updated automatically by the `design-tracker` skill.

## Overview

<!-- Project overview goes here -->

## Architecture

<!-- Architecture diagram and description goes here -->

### Region Scope

- `bsg_region_cities` is the source of selectable region names and city mappings.
- `bsg_members` and `bsg_shifts` store `region_name`; calendar and contact queries always filter by the active region.
- Browser geolocation recognizes a 75-mile Greater Austin radius without sending coordinates to a third-party service. Manual dropdown selections are stored locally and take priority.

### Agent Roles

| Agent | Role | Responsibilities |
|-------|------|------------------|
| | | |

## Implementation Plan

### Patterns & Approaches

| Pattern | Purpose | Notes |
|---------|---------|-------|
| | | |

### Libraries & Roles

| Library | Role | Version | Notes |
|---------|------|---------|-------|
| | | | |

### Key Decisions

| Decision | Rationale | Alternatives Considered | Date |
|----------|-----------|------------------------|------|
| | | | |
| Region scope is an application filter, not an authorization boundary | Existing app allows unauthenticated access and no per-user region claims exist | Auth-based RLS isolation | 2026-07-12 |
| Greater Austin uses a local radius check | Avoids third-party reverse-geocoding privacy and service-limit concerns | Client-side reverse geocoding, Supabase Edge Function | 2026-07-12 |

## TODO

- [ ]

## Open Questions

- [ ]

## Changelog

| Date | Changes |
|------|---------|
| | Initial |
| 2026-07-12 | Added region selection, region-scoped members and shifts, and Austin geolocation behavior |
