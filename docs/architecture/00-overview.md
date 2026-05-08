# Architecture Overview

This document describes the base architecture of the SaaS template.

## System Design

- SPA frontend (React + Vite)
- Backend via Supabase (PostgreSQL + Auth + RLS)
- Serverless-first architecture
- External services via APIs or edge functions

## Core Principles

- MVP-first development
- Feature-based modularity
- Security via RLS
- Minimal custom backend logic
- Reusable across multiple SaaS products

## Key Boundaries

- Frontend: UI + client state
- Supabase: data + auth + permissions
- Edge functions: external integrations only
- No monolithic backend layer