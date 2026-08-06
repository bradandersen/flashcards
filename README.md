# Flashcards — Multi-Language Vocabulary Trainer

A single-file, offline flashcard app for learning vocabulary across several European languages. Built for **Andrioti School** (Corfu, Greece).

**Version:** 1.0.1 (06.08.2026.00)

---

## Features

- **Bidirectional study** — Choose any From / To pair (e.g. English → Greek, Greek → Spanish, French → English). Swap with one click.
- **Rich Greek ↔ English** — Full verb conjugations (present, aorist, future), nouns with gender/accusative, adjectives, adverbs, calendar terms, roots, and conversational phrases.
- **Core survival sets** for Spanish, French, Italian, German, Dutch, and Portuguese (matched via English glosses where needed).
- **Alphabet & pronunciation** for every supported language, including digraphs and sound rules.
- **3D flip cards** with romanization, filters by category/class, and predictive search limited to the active language pair.
- **UI language follows the “From” selection** — labels and prompts switch with your study direction.
- **Fully offline** — one self-contained HTML file; no server or install required after download.

### Supported languages

Greek · English · Spanish · French · Italian · German · Dutch · Portuguese

---

## Quick start

1. Download [`flashcards.html`](./flashcards.html) (or open this repo on **GitHub Pages** if enabled).
2. Open the file in a desktop browser (Chrome, Firefox, Safari, Edge).
3. Select **From** and **To** languages, pick a category (Alphabet, Verbs, Nouns, …), and flip cards.

> **iPhone / iPad:** Opening a local `.html` file in Chrome or Safari is restricted by iOS. Host the file (e.g. GitHub Pages, Netlify Drop, Cloudflare Pages) and open the HTTPS link instead.

---

## File integrity

This distribution includes a **built-in integrity check**.

When the app loads over a normal web connection (HTTPS or a local server), it verifies that the file has not been altered since it was sealed. If the check fails, the study interface is replaced with a message directing you to obtain the original from Andrioti School:

> **Andrioti School**  
> info@andrioti.com · (+30) 26610 25715

The version number is shown in the lower-left corner of the app (e.g. `Version 1.0.1 (06.08.2026.00)`).

Integrity verification requires the page to be served in a context where the browser can re-read its own source (typical when hosted). Opening as a raw `file://` link may skip the full-file check; the app still runs for study use.

---

## Usage tips

| Control | Action |
|--------|--------|
| **From / To** dropdowns | Set study direction (same language disabled on both sides) |
| **⇄** | Swap From and To |
| Category tabs | Alphabet · Verbs · Nouns · Adjectives · Adverbs · Calendar · Roots · Phrases · Other |
| Filters | Narrow by verb class, noun gender/category, etc. |
| Search | Finds entries in the **current** language pair only |
| Card flip | Click / tap the card (or Space) |
| Zoom | Upper-left control scales the UI |

For verbs, tap a tense heading where available to see an example sentence.

---

## Hosting (optional)

The app is a single static file. Suitable free hosts:

- **GitHub Pages** — enable Pages on this repository (source: branch root or `/docs`)
- **Netlify Drop** — drag `flashcards.html` (rename to `index.html` for a clean URL)
- **Cloudflare Pages** — unlimited bandwidth on the free tier

No build step is required.

---

## Credits

Developed by **Andelorean Enterprises**, Cocoa Beach, FL, for **Andrioti School**.

For the official original file or licensing questions, contact:

- **Email:** info@andrioti.com  
- **Phone:** (+30) 26610 25715  

---

## License

All rights reserved unless otherwise stated by Andrioti School / Andelorean Enterprises. Redistribution of modified copies is not supported; modified files will fail the integrity check.
