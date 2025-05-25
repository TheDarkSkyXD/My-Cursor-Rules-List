
---
description: Segui sempre questa sequenza per generare codice in risposta a richieste di sviluppo software.
globs: ["**/*"]
---

# Regola VibeCoding-MCP-Workflow

Quando ricevi una richiesta di sviluppo o di creazione di un’applicazione, *non generare subito il codice*.

## Segui questa sequenza:

1. **PRD**: crea un documento di requisiti (Product Requirement Document) seguendo le regole contenute in `rules/001-prd.md`
2. **TODO**: genera una lista dettagliata di task come da `rules/002-todo.md`
3. **PROMPT**: crea il prompt di sviluppo finale come da `rules/003-prompts.md`
4. Applica sempre il metodo **Vibe Coding** (presente in `rules/mcp.md`) se non specificato.

## Altre regole generali:

- Usa **TypeScript** come linguaggio principale se non diversamente richiesto.
- Per i test Python, usa `pytest` e scrivi prima i test.
- Rispondi sempre in **italiano**.
- Se non viene indicata una piattaforma, scegli **web app moderna responsive**, con opzioni mobile-first.
