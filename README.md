# Flashcards — Multi-Language Vocabulary Trainer

A static, offline flashcard app for learning vocabulary across several European languages.

**Version:** 1.0.5 (27.08.2026.00)

Greek ↔ English is the richest pair (conjugations, gender, roots, phrases). Spanish, French, Italian, German, Dutch, and Portuguese have core survival sets plus alphabets and pronunciation.

---

## Quick start

Serve the folder (scripts do not load from `file://` in some browsers):

```bash
python3 -m http.server 8080
```

Then open http://localhost:8080

Select **From** and **To**, pick a category, and flip cards (click / Space). ← → navigate, **S** shuffles.

> **iPhone / iPad:** Opening a local `.html` file is restricted. Host the folder (GitHub Pages, Netlify, Cloudflare Pages) and open the HTTPS URL.

---

## Project layout

The original app was a single ~600KB `index.html`. Source is now split so vocabulary and logic can grow independently:

| Path | What lives here |
|------|-----------------|
| `index.html` | Markup: header, language pair, tabs, filters, card chrome |
| `css/app.css` | Layout and card styles |
| `js/data.js` | All word lists, alphabets, digraphs, `CORE` registry |
| `js/app.js` | Filtering, rendering, search, i18n, zoom, integrity helpers |
| `tools/pack.py` | Rebuild a single-file copy under `dist/` for sealed distribution |

To add words, edit the relevant array in `js/data.js` (for example `nouns`, `esVerbs`, `frPhrases`). To change behavior, edit `js/app.js`.

Optional single-file pack:

```bash
python3 tools/pack.py
```

---

## Features

- Bidirectional study for any From / To pair; swap with ⇄
- Rich Greek ↔ English: verbs (present, aorist, future), nouns with gender, adjectives, adverbs, calendar, roots, phrases
- Core survival sets for ES / FR / IT / DE / NL / PT (matched via English glosses)
- Alphabet and digraphs for every supported language
- Filters, predictive search (current pair only), UI language follows **From**
- Zoom control; progress bar; example-sentence modal on verb tenses

### Supported languages

Greek · English · Spanish · French · Italian · German · Dutch · Portuguese

---

## File integrity

The app seals an MD5 of `index.html`, `css/app.css`, `js/data.js`, `js/app.js`, and `js/tests.js`. After you change those files, reseal:

```bash
python3 tools/seal.py
```

If a hosted copy fails the check, the UI locks and points to [github.com/bradandersen/flashcards](https://github.com/bradandersen/flashcards). Opening as `file://` skips the full check.

---

## Usage tips

| Control | Action |
|--------|--------|
| **From / To** | Study direction (same language cannot be selected on both sides) |
| **⇄** | Swap From and To |
| Category tabs | Alphabet · Verbs · Nouns · Adjectives · Adverbs · Calendar · Roots · Phrases · Other · **Tests** |
| Filters | Verb class/tense, noun gender/category, etc. |
| Search | Current language pair only |
| Card flip | Click / tap / Space |
| Progress slider | Drag under **Card X of Y** to jump (e.g. card 54 in a large pack) |
| Tests | Multiple-choice or typed quizzes; scores saved in this browser (`localStorage`) |

---

## Credits

Developed by **Andelorean Enterprises**, Cocoa Beach, FL.

## License

See [LICENSE](./LICENSE) (GNU GPL v3 in this repository).
