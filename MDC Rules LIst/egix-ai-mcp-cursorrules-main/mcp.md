# 🧠 MCP - Vibe Coding Assistant Protocol (egix-ai)

## 🌟 SCOPO
Fornire all'agente AI (es. Cursor, TRAE, VSCode) una guida intelligente per seguire le regole contenute nella repository `awesome-cursorrules`, decidere quando e come applicarle, e generare codice o documentazione secondo i principi del Vibe Coding.

---

## 📛 Mappa delle Regole da Applicare

| Codice | Descrizione                         | Quando usarla                          |
|--------|-------------------------------------|----------------------------------------|
| 000    | Introduzione                        | All'avvio, per orientare l'utente      |
| 001    | Product Requirement Document (PRD)  | Inizio di una nuova funzionalità       |
| 002    | ToDo List                           | Dopo PRD, per scomporre i task         |
| 003    | Prompt Generation                   | Per generare prompt intelligenti       |
| 004    | Diff & Refactoring                  | Dopo modifiche o miglioramenti         |
| 005    | Pull Request                        | Quando si crea o gestisce una PR       |
| 006    | Regole generali                     | Sempre valide                          |

---

## 🧠 Stack Detection (automatica)

Quando l'utente **non specifica uno stack**, l'agente AI deve:

1. **Analizzare il tipo di progetto** (es. app web, app mobile, CLI, API, sistema desktop...)
2. Applicare queste euristiche:
   
   | Tipo progetto | Stack consigliato                          |
   |---------------|---------------------------------------------|
   | Web App       | React / Next.js + Express o Flask + DB     |
   | API           | FastAPI / Express / Flask + PostgreSQL     |
   | Mobile        | React Native / Expo / Flutter              |
   | CLI Tool      | Python o Node.js CLI                       |
   | Desktop       | Electron / Tauri + SQLite / FS             |

3. **Chiedere conferma** all’utente prima di procedere.
4. In caso di dubbio, **proporre 2-3 opzioni intelligenti** con pro/contro.

---

## 🔁 Flusso Logico dell’Agente AI

```txt
1. Utente fa richiesta generica
2. L’agente legge mcp.md
3. Determina se serve PRD (001) → lo genera
4. Passa a ToDo (002)
5. Per ogni task → genera prompt (003)
6. Genera codice e applica regole (006)
7. Se modifiche → applica refactor (004)
8. Se apertura PR → applica regole (005)
```

---

## 📅 Esempi di utilizzo

### ✉️ Input utente:
"Voglio fare un'app che consenta di votare dei prodotti"

### 🤠 AI:
- Suggerisce stack: React + FastAPI + PostgreSQL
- Genera PRD (001)
- Estrae ToDo (002)
- Scrive prompt (003)
- Codice e miglioramenti (004 + 006)

---

## ⚠️ Regole costanti da rispettare

- Applicare sempre 006 (modularità, chiarezza, clean code)
- Se non è sicuro di quale regola usare, l'agente deve **chiedere**
- Tutto ciò che viene generato deve citare **quale regola ha guidato il processo**

---

## 🌐 Estendibilità

Questo file è pensato per essere la guida principale dell’agente AI, ma può essere esteso con:
- Regole personalizzate (es. `007-database.md`, `008-tests.md`)
- Prompt specializzati per stack custom (ex: Solidity, Blockchain, AI, ecc.)
- File `stack-chooser.md` con benchmark di stack alternativi

---
✨ *Versione Egix-AI | 2025*
