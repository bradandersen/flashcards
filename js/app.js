/* ========== STATE ========== */
let mainMode = 'alphabet';
let currentSet = [...alphabet];
let currentIndex = 0;
let isFlipped = false;
let verbClassFilter = 'all';
let verbTenseFilter = 'present';
let nounCatFilter = 'all';
let nounGenderFilter = 'all';
let adjCatFilter = 'all';
let calendarCatFilter = 'all';
let rootsCatFilter = 'all';
let phrasesCatFilter = 'all';

const flashcard = document.getElementById('flashcard');
const frontMain = document.getElementById('frontMain');
const frontSub = document.getElementById('frontSub');
const backContent = document.getElementById('backContent');
const currentSpan = document.getElementById('current');
const totalSpan = document.getElementById('total');

function makeConjTable(forms) {
  let html = '<table class="conj"><thead><tr><th>Person</th><th>Greek</th><th>Roman</th></tr></thead><tbody>';
  forms.forEach((f,i) => {
    html += `<tr><td>${pronouns[i]}</td><td>${f[0]}</td><td>${f[1]}</td></tr>`;
  });
  html += '</tbody></table>';
  return html;
}

function hashPick(str, n) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) | 0;
  return Math.abs(h) % n;
}

/** Derive nominative + accusative plural (with articles) from a noun card. Optional overrides: pl, plAcc, plR, plAccR */
function nounPlural(card) {
  if (card.pl) {
    return {
      nom: card.pl,
      acc: card.plAcc || card.pl,
      nomR: card.plR || '',
      accR: card.plAccR || card.plR || ''
    };
  }
  const g = card.gender || 'm';
  const full = (card.greek || '').trim();
  const parts = full.split(/\s+/);
  const art = parts.length > 1 ? parts[0] : '';
  let stem = parts.length > 1 ? parts.slice(1).join(' ') : full;
  // strip stress for ending checks but keep original stem for display base
  const low = stem.toLowerCase();
  let nomStem = stem, accStem = stem;
  // --- masculine ---
  if (g === 'm') {
    if (/ός$/.test(low) || /ος$/.test(low)) {
      nomStem = stem.replace(/[όο]ς$/i, (m) => m[0] === 'ό' || m[0] === 'Ό' ? 'οί' : 'οι');
      // better: φίλος → φίλοι
      nomStem = stem.replace(/ός$/i, 'οί').replace(/ος$/i, 'οι');
      accStem = stem.replace(/ός$/i, 'ούς').replace(/ος$/i, 'ους');
    } else if (/ής$/.test(low) || /ης$/.test(low)) {
      nomStem = stem.replace(/ής$/i, 'ές').replace(/ης$/i, 'ες');
      accStem = nomStem;
    } else if (/άς$/.test(low) || /ας$/.test(low)) {
      // άντρας → άντρες; πατέρας → πατέρες
      nomStem = stem.replace(/άς$/i, 'άδες').replace(/ας$/i, 'ες');
      // special common: άντρας/άνδρας → άντρες
      if (/άντρ?ας$/i.test(stem)) nomStem = stem.replace(/άντρ?ας$/i, 'άντρες');
      if (/πατέρας$/i.test(stem)) nomStem = 'πατέρες';
      if (/άνθρωπος$/i.test(stem)) { nomStem = 'άνθρωποι'; accStem = 'ανθρώπους'; }
      accStem = nomStem;
    } else if (/έας$/.test(low)) {
      nomStem = stem.replace(/έας$/i, 'είς');
      accStem = nomStem;
    } else if (/ος$/.test(low) === false && /ς$/.test(low)) {
      nomStem = stem.replace(/ς$/i, 'δες');
      accStem = nomStem;
    }
    return {
      nom: 'οι ' + nomStem,
      acc: 'τους ' + accStem,
      nomR: '',
      accR: ''
    };
  }
  // --- feminine ---
  if (g === 'f') {
    if (/η$/.test(low) || /ή$/.test(low)) {
      // φίλη → φίλες; πόλη / λέξη / δύναμη → -εις
      if (/[ξψσζ]η$/i.test(low) || /πόλη$|δύναμη$|κυβέρνηση$|απόφαση$|σκέψη$|γνώση$/i.test(stem)) {
        nomStem = stem.replace(/η$/i, 'εις').replace(/ή$/i, 'είς');
      } else {
        nomStem = stem.replace(/η$/i, 'ες').replace(/ή$/i, 'ές');
      }
      accStem = nomStem;
    } else if (/α$/.test(low) || /ά$/.test(low)) {
      nomStem = stem.replace(/α$/i, 'ες').replace(/ά$/i, 'ές');
      accStem = nomStem;
    } else if (/ος$/.test(low) || /ός$/.test(low)) {
      nomStem = stem.replace(/ός$/i, 'οί').replace(/ος$/i, 'οι');
      accStem = stem.replace(/ός$/i, 'ούς').replace(/ος$/i, 'ους');
    } else if (/ου$/.test(low)) {
      nomStem = stem + 'δες';
      accStem = nomStem;
    }
    return {
      nom: 'οι ' + nomStem,
      acc: 'τις ' + accStem,
      nomR: '',
      accR: ''
    };
  }
  // --- neuter ---
  if (g === 'n') {
    if (/ι$/.test(low) || /ί$/.test(low)) {
      nomStem = stem.replace(/ι$/i, 'ια').replace(/ί$/i, 'ιά');
      // παιδί → παιδιά
      if (/παιδί$/i.test(stem)) nomStem = 'παιδιά';
    } else if (/ο$/.test(low) || /ό$/.test(low)) {
      nomStem = stem.replace(/ο$/i, 'α').replace(/ό$/i, 'ά');
    } else if (/μα$/.test(low)) {
      nomStem = stem.replace(/μα$/i, 'ματα');
    } else if (/ος$/.test(low) || /ός$/.test(low)) {
      nomStem = stem.replace(/ος$/i, 'η').replace(/ός$/i, 'ή');
    } else if (/ας$/.test(low) || /ας$/.test(low)) {
      nomStem = stem.replace(/ας$/i, 'ατα');
    }
    return {
      nom: 'τα ' + nomStem,
      acc: 'τα ' + nomStem,
      nomR: '',
      accR: ''
    };
  }
  return { nom: '', acc: '', nomR: '', accR: '' };
}

const DE_WEAK_NOUNS = new Set(['Name','Mensch','Nachbar','Student','Polizist','Kollege','Hase','Bär','Herr']);

function deNomArt(g) {
  if (g === 'm') return 'der';
  if (g === 'f' || g === 'p') return 'die';
  if (g === 'n') return 'das';
  return '';
}

function deAccArt(g) {
  if (g === 'm') return 'den';
  if (g === 'f' || g === 'p') return 'die';
  if (g === 'n') return 'das';
  return '';
}

function deGenderLabel(g) {
  if (g === 'm') return 'masculine';
  if (g === 'f') return 'feminine';
  if (g === 'n') return 'neuter';
  if (g === 'p') return 'plural';
  return '';
}

function deAccNounForm(card) {
  const n = card.de || '';
  if (card.g === 'm' && (card.weak || DE_WEAK_NOUNS.has(n))) {
    if (/e$/.test(n)) return n + 'n';
    if (/n$/.test(n)) return n;
    return n + 'en';
  }
  return n;
}

function deAccPhrase(card) {
  const art = deAccArt(card.g);
  const noun = deAccNounForm(card);
  return art ? (art + ' ' + noun) : noun;
}

function deNomPhrase(card) {
  const art = deNomArt(card.g);
  const noun = card.de || '';
  return art ? (art + ' ' + noun) : noun;
}

function dePlPhrase(card) {
  if (!card.pl || card.pl === '—' || card.g === 'p') return '';
  return 'die ' + card.pl;
}

function makeDeNounExample(card) {
  if (card.exD && card.exE) return { g: card.exD, e: card.exE };
  const acc = deAccPhrase(card);
  const nom = deNomPhrase(card);
  const e = card.en || '';
  const c = card.cat || '';
  const templates = {
    food: [
      { g: `Ich kaufe ${acc} im Supermarkt.`, e: `I buy ${e} at the supermarket.` },
      { g: `Heute esse ich ${acc}.`, e: `Today I eat ${e}.` }
    ],
    kitchen: [
      { g: `Ich brauche ${acc} in der Küche.`, e: `I need ${e} in the kitchen.` },
      { g: `Wo ist ${nom}?`, e: `Where is the ${e}?` }
    ],
    family: [
      { g: `Ich rufe ${acc} an.`, e: `I call ${e}.` },
      { g: `${nom} wohnt in Berlin.`, e: `${e} lives in Berlin.` }
    ],
    places: [
      { g: `Ich suche ${acc}.`, e: `I am looking for the ${e}.` },
      { g: `${nom} ist nicht weit.`, e: `The ${e} is not far.` }
    ],
    clothing: [
      { g: `Ich trage ${acc} heute.`, e: `I am wearing ${e} today.` },
      { g: `Wo sind ${acc}?`, e: `Where is/are ${e}?` }
    ],
    household: [
      { g: `${nom} ist im Haus.`, e: `The ${e} is in the house.` },
      { g: `Ich putze ${acc}.`, e: `I clean the ${e}.` }
    ],
    garden: [
      { g: `Ich gieße ${acc} im Garten.`, e: `I water the ${e} in the garden.` }
    ],
    animals: [
      { g: `Ich sehe ${acc} im Park.`, e: `I see ${e} in the park.` }
    ],
    body: [
      { g: `${nom} tut weh.`, e: `My ${e} hurts.` },
      { g: `Ich wasche ${acc}.`, e: `I wash ${e}.` }
    ],
    work: [
      { g: `Ich brauche ${acc} für die Arbeit.`, e: `I need ${e} for work.` },
      { g: `${nom} ist wichtig.`, e: `The ${e} is important.` }
    ],
    island: [
      { g: `Ich packe ${acc} für die Reise.`, e: `I pack ${e} for the trip.` }
    ],
    nature: [
      { g: `Ich sehe ${acc} vom Fenster.`, e: `I see the ${e} from the window.` }
    ],
    things: [
      { g: `Ich suche ${acc}.`, e: `I am looking for ${e}.` },
      { g: `${nom} liegt auf dem Tisch.`, e: `The ${e} is on the table.` }
    ]
  };
  const list = templates[c] || templates.things;
  return list[hashPick(nom + e, list.length)];
}

function makeDeAdjExample(card) {
  const w = card.de, e = card.en, c = card.cat || '';
  const templates = {
    color: [{ g: `Das Auto ist ${w}.`, e: `The car is ${e}.` }],
    size: [{ g: `Das Haus ist ${w}.`, e: `The house is ${e}.` }],
    feeling: [{ g: `Ich bin heute ${w}.`, e: `I am ${e} today.` }],
    quantity: [{ g: `Das ist ${w}.`, e: `That is ${e}.` }],
    quality: [{ g: `Der Kaffee ist ${w}.`, e: `The coffee is ${e}.` }]
  };
  const list = templates[c] || templates.quality;
  return list[hashPick(w + e, list.length)];
}

function deVerbExample(card, tenseKey) {
  const bank = (typeof deVerbExamples !== 'undefined') ? deVerbExamples[card.lemma] : null;
  const hit = bank && (bank[tenseKey] || bank.present);
  if (hit && hit.g) return hit;
  return null;
}

function makeNounExample(card) {
  const g = card.greek, a = card.acc, ar = card.accR, r = card.roman, e = card.en, c = card.cat || '';
  const templates = {
    food: [
      {g:`Θέλω ${a} με ψωμί, παρακαλώ.`,r:`Thélo ${ar} me psomí, parakaló.`,e:`I want ${e} with bread, please.`},
      {g:`Αγοράζω ${a} στην αγορά κάθε Σάββατο.`,r:`Agorázo ${ar} stin agorá káthe Sávato.`,e:`I buy ${e} at the market every Saturday.`},
      {g:`Τρώω ${a} στο εστιατόριο με φίλους.`,r:`Tróo ${ar} sto estiatório me fílous.`,e:`I eat ${e} at the restaurant with friends.`}
    ],
    family: [
      {g:`Η οικογένειά μου έχει ${a} στην Ελλάδα.`,r:`I ikoyénia mou échi ${ar} stin Ellátha.`,e:`My family has ${e} in Greece.`},
      {g:`Μιλάω με ${a} κάθε βράδυ στο τηλέφωνο.`,r:`Miláo me ${ar} káthe vráthi sto tiléfono.`,e:`I talk with ${e} on the phone every night.`},
      {g:`Αγαπώ πολύ ${a}.`,r:`Agapó polí ${ar}.`,e:`I love ${e} very much.`}
    ],
    places: [
      {g:`Πάω ${a.replace(/^τον |^την |^το /,'στο ').replace(/^στους |^στις |^στα /,'στα ')} το απόγευμα.`,r:`Páo near ${ar} to apóyevma.`,e:`I go to the ${e} in the afternoon.`},
      {g:`Το ξενοδοχείο είναι κοντά ${a.replace(/^τον /,'στον ').replace(/^την /,'στην ').replace(/^το /,'στο ')}.`,r:`To xenodochío íne kodá ${ar}.`,e:`The hotel is near the ${e}.`},
      {g:`Ψάχνω ${a} στον χάρτη.`,r:`Psáchino ${ar} ston chárti.`,e:`I am looking for the ${e} on the map.`}
    ],
    clothing: [
      {g:`Φοράω ${a} όταν κάνει κρύο.`,r:`Foráo ${ar} ótan káni krío.`,e:`I wear ${e} when it is cold.`},
      {g:`Αγοράζω ${a} στο κατάστημα στο κέντρο.`,r:`Agorázo ${ar} sto katástima sto kédro.`,e:`I buy ${e} at the shop in the center.`}
    ],
    household: [
      {g:`Χρειάζομαι ${a} στο σπίτι.`,r:`Chriázome ${ar} sto spíti.`,e:`I need ${e} at home.`},
      {g:`Βάζω ${a} δίπλα στο παράθυρο.`,r:`Vázo ${ar} thípla sto paráthiro.`,e:`I put ${e} next to the window.`}
    ],
    kitchen: [
      {g:`Χρησιμοποιώ ${a} όταν μαγειρεύω.`,r:`Chrisimopió ${ar} ótan mayirévo.`,e:`I use ${e} when I cook.`},
      {g:`Πλένω ${a} μετά το φαγητό.`,r:`Pléno ${ar} metá to fayitó.`,e:`I wash ${e} after the meal.`},
      {g:`Αγοράζω ${a} στο μανάβικο.`,r:`Agorázo ${ar} sto manáviko.`,e:`I buy ${e} at the greengrocer.`}
    ],
    garden: [
      {g:`Ποτίζω ${a} κάθε πρωί στον κήπο.`,r:`Potízo ${ar} káthe proí ston kípo.`,e:`I water ${e} every morning in the garden.`},
      {g:`Φυτεύω ${a} την άνοιξη.`,r:`Fitévo ${ar} tin ánixi.`,e:`I plant ${e} in the spring.`}
    ],
    animals: [
      {g:`Βλέπω ${a} στο πάρκο.`,r:`Vlépo ${ar} sto párko.`,e:`I see ${e} in the park.`},
      {g:`Μου αρέσει ${a} πολύ.`,r:`Mou arési ${ar} polí.`,e:`I like ${e} a lot.`}
    ],
    body: [
      {g:`Πονάει ${g} μου σήμερα.`,r:`Ponái ${r} mou símera.`,e:`My ${e} hurts today.`},
      {g:`Πλένω ${a} με σαπούνι και νερό.`,r:`Pléno ${ar} me sapoúni ke neró.`,e:`I wash ${e} with soap and water.`}
    ],
    work: [
      {g:`Ο ${g.replace(/^ο |^η |^το /,'')} δουλεύει στο νοσοκομείο.`,r:`O/I ${r.replace(/^o |^i |^to /,'')} doulévi sto nosokomío.`,e:`The ${e} works at the hospital.`},
      {g:`Θέλω να γίνω ${g.replace(/^ο |^η |^το /,'')}.`,r:`Thélo na yíno ${r.replace(/^o |^i |^to /,'')}.`,e:`I want to become a ${e}.`}
    ],
    travel: [
      {g:`Χρειάζομαι ${a} για το ταξίδι.`,r:`Chriázome ${ar} ya to taxíthi.`,e:`I need ${e} for the trip.`},
      {g:`Βάζω ${a} στην τσάντα μου.`,r:`Vázo ${ar} stin tsáda mou.`,e:`I put ${e} in my bag.`}
    ],
    nature: [
      {g:`Βλέπω ${a} από το παράθυρο.`,r:`Vlépo ${ar} apó to paráthiro.`,e:`I see ${e} from the window.`},
      {g:`Μου αρέσει ${a} πολύ το καλοκαίρι.`,r:`Mou arési ${ar} polí to kalokéri.`,e:`I like ${e} a lot in the summer.`}
    ],
    things: [
      {g:`Ψάχνω ${a} στο τραπέζι.`,r:`Psáchino ${ar} sto trapézi.`,e:`I am looking for ${e} on the table.`},
      {g:`Χρειάζομαι ${a} σήμερα.`,r:`Chriázome ${ar} símera.`,e:`I need ${e} today.`},
      {g:`Αγοράζω ${a} στο κατάστημα.`,r:`Agorázo ${ar} sto katástima.`,e:`I buy ${e} at the store.`}
    ]
  };
  const list = templates[c] || templates.things;
  return list[hashPick(g, list.length)];
}

function makeAdjExample(card) {
  const m = card.m, f = card.f, n = card.n, e = card.en, cat = card.cat || '';
  const rom = (card.roman || '').split('/')[0].trim();
  const templates = {
    color: [
      {g:`Το αυτοκίνητό μου είναι ${n}.`,r:`To aftokínitó mou íne ${rom}.`,e:`My car is ${e}.`},
      {g:`Φοράω μια ${f} μπλούζα σήμερα.`,r:`Foráo mia ${f} bloúza símera.`,e:`I am wearing a ${e} top today.`}
    ],
    feeling: [
      {g:`Σήμερα είμαι πολύ ${m}.`,r:`Símera íme polí ${rom}.`,e:`Today I am very ${e}.`},
      {g:`Η φίλη μου είναι ${f} μετά τη δουλειά.`,r:`I fíli mou íne ${f} metá ti thoulia.`,e:`My friend is ${e} after work.`}
    ],
    size: [
      {g:`Το σπίτι μας είναι ${n} και όμορφο.`,r:`To spíti mas íne ${rom} ke ómorfo.`,e:`Our house is ${e} and beautiful.`},
      {g:`Θέλω ένα ${n} τραπέζι για την κουζίνα.`,r:`Thélo éna ${rom} trapézi ya tin kouzína.`,e:`I want a ${e} table for the kitchen.`}
    ],
    weather: [
      {g:`Ο καιρός είναι ${m} σήμερα στην παραλία.`,r:`O kerós íne ${rom} símera stin paralía.`,e:`The weather is ${e} today at the beach.`},
      {g:`Προτιμώ όταν ο καιρός είναι ${m}.`,r:`Protimó ótan o kerós íne ${rom}.`,e:`I prefer when the weather is ${e}.`}
    ],
    quality: [
      {g:`Αυτό το φαγητό είναι πολύ ${n}.`,r:`Aftó to fayitó íne polí ${rom}.`,e:`This food is very ${e}.`},
      {g:`Ο δάσκαλος είναι ${m} και υπομονετικός.`,r:`O tháskalos íne ${rom} ke ypomonetikós.`,e:`The teacher is ${e} and patient.`},
      {g:`Η ταινία ήταν ${f} χθες το βράδυ.`,r:`I tenía ítan ${f} chthes to vráthi.`,e:`The movie was ${e} last night.`}
    ]
  };
  const list = templates[cat] || templates.quality;
  return list[hashPick(m + e, list.length)];
}

function syncDeckPosition() {
  const n = currentSet.length || 0;
  const pos = n ? Math.min(Math.max(currentIndex + 1, 1), n) : 0;
  const u = t();
  const statsEl = document.getElementById('stats');
  if (statsEl) statsEl.innerHTML = n ? u.cardOf(pos, n) : u.cardOf(0, 0);
  const slider = document.getElementById('cardSlider');
  if (slider) {
    slider.min = '1';
    slider.max = String(Math.max(n, 1));
    slider.value = String(Math.max(pos, 1));
    slider.disabled = n <= 1;
    const pct = n ? ((pos / n) * 100) : 0;
    slider.style.setProperty('--slider-pct', pct + '%');
    slider.setAttribute('aria-valuemin', '1');
    slider.setAttribute('aria-valuemax', String(Math.max(n, 1)));
    slider.setAttribute('aria-valuenow', String(Math.max(pos, 1)));
    slider.setAttribute('aria-label', n ? u.cardOf(pos, n) : (u.title || 'Cards'));
    slider.title = n ? u.cardOf(pos, n) : '';
  }
}

function jumpToCard(n) {
  const len = currentSet.length;
  if (!len) return;
  const idx = Math.min(Math.max(parseInt(n, 10) || 1, 1), len) - 1;
  if (idx === currentIndex) {
    syncDeckPosition();
    return;
  }
  currentIndex = idx;
  updateCard();
}

function updateCard(preserveFlip) {
  if (mainMode === 'tests') return;
  const card = currentSet[currentIndex];
  if (!card) return;

  // Pairs without data yet
  if (!hasCoreData() && mainMode !== 'alphabet') {
    const u = t();
    frontMain.className = 'greek-word';
    frontMain.textContent = LANG_NAMES[toLang]?.[fromLang] || toLang;
    frontSub.textContent = '';
    backContent.innerHTML = `<div style="padding:1.2rem;line-height:1.5;font-size:0.95rem;opacity:0.9">
      Core survival vocabulary for <b>${LANG_NAMES[fromLang]?.[fromLang] || fromLang}</b> ↔ <b>${LANG_NAMES[toLang]?.[toLang] || toLang}</b> is being added.<br><br>
      Available now: <b>Greek ↔ English</b> (full rich). Core survival for <b>Spanish, Italian, French, German, Dutch, Portuguese</b> ↔ English, and matched Greek↔those languages. Alphabets + pronunciation for all.
    </div>`;
    return;
  }



  // ===== GENERIC CORE ↔ ENGLISH rendering =====
  if (isCoreEnglishPair() && mainMode !== 'alphabet') {
    const u = t();
    const cLang = coreLangOfPair();
    const core = getCore(cLang) || {};
    const wk = core.wordKey || cLang;
    const showCore = (toLang === cLang); // front = To language
    if (mainMode === 'verbs') {
      frontMain.className = 'greek-word';
      const tenseKey = verbTenseFilter === 'aorist' ? 'past' : (verbTenseFilter === 'future' ? 'future' : 'present');
      const tenseLabel = tenseKey === 'past' ? u.aorist : (tenseKey === 'future' ? u.future : u.present);
      const forms = card[tenseKey] || card.present || [];
      frontMain.textContent = showCore ? card.lemma : card.en;
      frontSub.textContent = '';
      const persons = core.persons || ['1sg','2sg','3sg','1pl','2pl','3pl'];
      const rows = (forms || []).map((f,i) => `<tr><td style="opacity:.7;padding-right:8px">${persons[i]||''}</td><td><b>${f[0]}</b></td></tr>`).join('');
      let back = showCore
        ? `<div class="english-word">${card.en}</div><div class="class-label">${card.klass||''}</div>`
        : `<div class="greek-word">${card.lemma}</div><div class="class-label">${card.klass||''}</div>`;
      const vex = (cLang === 'de') ? deVerbExample(card, tenseKey) : null;
      back += `<div class="tense-title${vex ? ' tense-clickable' : ''}" id="tenseTitleBtn">${tenseLabel}${vex ? ' · ' + u.tapEx : ''}</div>
        <table style="margin:6px auto;font-size:.95rem;text-align:left">${rows}</table>`;
      if (vex && vex.g) {
        back += `<button type="button" class="example-btn" id="showExampleBtn">${u.example} (${tenseLabel})</button>`;
      }
      backContent.innerHTML = back;
      const openVex = () => {
        if (!vex || !vex.g) return;
        if (showCore) openExampleModal(vex.g, '', vex.e);
        else openExampleModal(vex.e, '', vex.g);
      };
      const btn = document.getElementById('showExampleBtn');
      if (btn) btn.addEventListener('click', (e) => { e.stopPropagation(); openVex(); });
      const tBtn = document.getElementById('tenseTitleBtn');
      if (tBtn && vex) tBtn.addEventListener('click', (e) => { e.stopPropagation(); openVex(); });
    } else if (mainMode === 'nouns') {
      frontMain.className = 'greek-word';
      const word = card[wk] || card.es || card.it || '';
      const richDe = cLang === 'de';
      const art = richDe ? deNomArt(card.g) : '';
      const gender = deGenderLabel(card.g);
      if (showCore) {
        frontMain.textContent = richDe ? deNomPhrase(card) : word;
        frontSub.textContent = card.g === 'm' ? 'm.' : (card.g === 'f' ? 'f.' : (card.g === 'n' ? 'n.' : (card.g === 'p' ? 'pl.' : '')));
      } else {
        frontMain.textContent = card.en;
        frontSub.textContent = art ? (art + ' · ' + (card.g || '')) : '';
      }
      if (richDe) {
        const pl = dePlPhrase(card);
        const ex = makeDeNounExample(card);
        const acc = deAccPhrase(card);
        const deHead = deNomPhrase(card);
        backContent.innerHTML = showCore
          ? `<div class="english-word">${card.en}</div>
             <div class="roman-word">${gender}</div>
             <div style="margin-top:10px;font-size:.95rem">
               <div><strong>${u.accusative}</strong> ${acc}</div>
               ${pl ? `<div style="margin-top:6px"><strong>${u.plural}</strong> ${pl}</div>` : ''}
             </div>
             <div class="example-block">
               <div class="ex-g">${ex.g}</div>
               <div class="ex-e">${ex.e}</div>
             </div>`
          : `<div class="greek-word">${deHead}</div>
             <div class="roman-word">${gender}${pl ? ' · ' + pl : ''}</div>
             <div style="margin-top:10px;font-size:.95rem">
               <div><strong>${u.accusative}</strong> ${acc}</div>
             </div>
             <div class="example-block">
               <div class="ex-e">${ex.e}</div>
               <div class="ex-g">${ex.g}</div>
             </div>`;
      } else {
        backContent.innerHTML = showCore
          ? `<div class="english-word">${card.en}</div><div class="roman-word">${gender}</div>`
          : `<div class="greek-word">${word}</div><div class="roman-word">${card.g||''}</div>`;
      }
    } else if (mainMode === 'adjectives' || mainMode === 'adverbs' || mainMode === 'calendar' || mainMode === 'phrases') {
      frontMain.className = 'greek-word';
      const word = card[wk] || card.es || card.it || '';
      if (showCore) { frontMain.textContent = word; frontSub.textContent = card.cat || ''; }
      else { frontMain.textContent = card.en; frontSub.textContent = card.cat || ''; }
      let extra = '';
      if (cLang === 'de' && mainMode === 'adjectives') {
        const ex = makeDeAdjExample(card);
        extra = showCore
          ? `<div class="example-block"><div class="ex-g">${ex.g}</div><div class="ex-e">${ex.e}</div></div>`
          : `<div class="example-block"><div class="ex-e">${ex.e}</div><div class="ex-g">${ex.g}</div></div>`;
      }
      backContent.innerHTML = showCore
        ? `<div class="english-word">${card.en}</div>${extra}`
        : `<div class="greek-word">${word}</div>${extra}`;
    } else {
      frontMain.className = 'greek-word';
      frontMain.textContent = '—';
      frontSub.textContent = '';
      backContent.innerHTML = `<div style="opacity:.85;padding:1rem">Alphabet works for all languages. Roots/Other are Greek↔English only. Use Verbs, Nouns, Adjectives, Adverbs, Calendar or Phrases for ${cLang}.</div>`;
    }
    syncDeckPosition();
    return;
  }

  // ===== GENERIC GREEK ↔ CORE (matched via English) =====
  if (isCoreGreekPair() && !isGreekSpanishPair() && !isGreekItalianPair() && mainMode !== 'alphabet') {
    const u = t();
    const cLang = coreLangOfPair();
    const core = getCore(cLang) || {};
    const wk = core.wordKey || cLang;
    const frontIsCore = (toLang === cLang);
    if (mainMode === 'verbs') {
      frontMain.className = 'greek-word';
      const g = card.greek, c = card.core;
      const tenseKeyEl = verbTenseFilter === 'aorist' ? 'aorist' : (verbTenseFilter === 'future' ? 'future' : 'present');
      const tenseKeyC = verbTenseFilter === 'aorist' ? 'past' : (verbTenseFilter === 'future' ? 'future' : 'present');
      const tenseLabel = tenseKeyEl === 'aorist' ? u.aorist : (tenseKeyEl === 'future' ? u.future : u.present);
      frontMain.textContent = frontIsCore ? (c&&c.lemma) : (g&&g.lemma);
      frontSub.textContent = '';
      const formsEl = (g && (g[tenseKeyEl] || g.present)) || [];
      const formsC = (c && (c[tenseKeyC] || c.present)) || [];
      const personsEl = ['εγώ','εσύ','αυτός','εμείς','εσείς','αυτοί'];
      const personsC = core.persons || [];
      let rows = '';
      for (let i = 0; i < 6; i++) {
        const elF = formsEl[i] ? formsEl[i][0] : '—';
        const cF = formsC[i] ? formsC[i][0] : '—';
        rows += `<tr><td style="opacity:.65;padding-right:6px;font-size:.8rem">${personsEl[i]} / ${personsC[i]||''}</td><td><b>${elF}</b></td><td style="padding-left:10px"><b>${cF}</b></td></tr>`;
      }
      const head = frontIsCore
        ? `<div class="greek-word">${g?g.lemma:''}</div><div class="roman-word">${(g&&g.en)||card.en||''}</div>`
        : `<div class="greek-word">${c?c.lemma:''}</div><div class="roman-word">${(c&&c.en)||card.en||''}</div>`;
      const vex = (cLang === 'de' && c) ? deVerbExample(c, tenseKeyC) : null;
      let vhtml = head + `<div class="tense-title${vex ? ' tense-clickable' : ''}" id="tenseTitleBtn">${tenseLabel}${vex ? ' · ' + u.tapEx : ''}</div>
        <table style="margin:6px auto;font-size:.9rem;text-align:left">${rows}</table>`;
      if (vex && vex.g) vhtml += `<button type="button" class="example-btn" id="showExampleBtn">${u.example} (${tenseLabel})</button>`;
      backContent.innerHTML = vhtml;
      const openVex = () => {
        if (!vex || !vex.g) return;
        openExampleModal(vex.g, '', vex.e);
      };
      const btn = document.getElementById('showExampleBtn');
      if (btn) btn.addEventListener('click', (e) => { e.stopPropagation(); openVex(); });
      const tBtn = document.getElementById('tenseTitleBtn');
      if (tBtn && vex) tBtn.addEventListener('click', (e) => { e.stopPropagation(); openVex(); });
    } else if (mainMode === 'nouns') {
      frontMain.className = 'greek-word';
      const richDe = cLang === 'de' && card.de;
      if (frontIsCore) {
        frontMain.textContent = richDe ? deNomPhrase(card) : (card[wk] || card.coreWord || '');
        frontSub.textContent = card.g==='m'?'m.':(card.g==='f'?'f.':(card.g==='n'?'n.':(card.g==='p'?'pl.':'')));
      } else {
        frontMain.textContent = card.greek;
        frontSub.textContent = card.roman || '';
      }
      const pl = richDe ? dePlPhrase(card) : '';
      const acc = richDe ? deAccPhrase(card) : '';
      const ex = richDe ? makeDeNounExample(card) : null;
      const deBits = richDe ? `
        <div style="margin-top:8px;font-size:.95rem">
          ${acc ? `<div><strong>${u.accusative}</strong> ${acc}</div>` : ''}
          ${pl ? `<div style="margin-top:4px"><strong>${u.plural}</strong> ${pl}</div>` : ''}
        </div>
        <div class="example-block"><div class="ex-g">${ex.g}</div><div class="ex-e">${ex.e}</div></div>` : '';
      backContent.innerHTML = frontIsCore
        ? `<div class="greek-word">${card.greek}</div><div class="roman-word">${card.roman||''}</div><div class="english-word" style="opacity:.7;font-size:.9rem">${card.en||''}</div>${deBits}`
        : `<div class="greek-word">${richDe ? deNomPhrase(card) : (card[wk]||'')}</div><div class="english-word" style="opacity:.7;font-size:.9rem">${card.en||''}</div>${deBits}`;
    } else if (mainMode === 'adjectives' || mainMode === 'adverbs' || mainMode === 'calendar' || mainMode === 'phrases') {
      frontMain.className = 'greek-word';
      if (frontIsCore) { frontMain.textContent = card[wk] || ''; frontSub.textContent = card.cat || ''; }
      else { frontMain.textContent = card.greek; frontSub.textContent = card.roman || card.cat || ''; }
      backContent.innerHTML = frontIsCore
        ? `<div class="greek-word">${card.greek||''}</div>${card.roman?`<div class="roman-word">${card.roman}</div>`:''}<div class="english-word" style="opacity:.7;font-size:.9rem">${card.en||''}</div>`
        : `<div class="greek-word">${card[wk]||''}</div><div class="english-word" style="opacity:.7;font-size:.9rem">${card.en||''}</div>`;
    } else {
      frontMain.className = 'greek-word';
      frontMain.textContent = '—';
      frontSub.textContent = '';
      backContent.innerHTML = `<div style="opacity:.85;padding:1rem">Alphabet works for all languages. Roots/Other are Greek↔English only.</div>`;
    }
    syncDeckPosition();
    return;
  }

  // ===== GREEK ↔ SPANISH matched core rendering =====
  if (isGreekSpanishPair() && mainMode !== 'alphabet') {
    const u = t();
    const showEl = isEsEl(); // From=es To=el → front Greek; From=el To=es → front Spanish? 
    // Rule: front = To language, back = From language
    // isElEs: From=el To=es → front Spanish, back Greek
    // isEsEl: From=es To=el → front Greek, back Spanish
    const frontIsEs = isElEs(); // To is Spanish
    const frontIsEl = isEsEl(); // To is Greek

    if (mainMode === 'verbs') {
      frontMain.className = 'greek-word';
      const g = card.greek, s = card.es;
      const tenseKeyEl = verbTenseFilter === 'aorist' ? 'aorist' : (verbTenseFilter === 'future' ? 'future' : 'present');
      const tenseKeyEs = verbTenseFilter === 'aorist' ? 'past' : (verbTenseFilter === 'future' ? 'future' : 'present');
      const tenseLabel = tenseKeyEl === 'aorist' ? u.aorist : (tenseKeyEl === 'future' ? u.future : u.present);
      if (frontIsEs) {
        frontMain.textContent = s.lemma;
        frontSub.textContent = '';
      } else {
        frontMain.textContent = g.lemma;
        frontSub.textContent = '';
      }
      const formsEl = g[tenseKeyEl] || g.present || [];
      const formsEs = s[tenseKeyEs] || s.present || [];
      const personsEl = ['εγώ','εσύ','αυτός','εμείς','εσείς','αυτοί'];
      const personsEs = ['yo','tú','él/ella','nosotros','vosotros','ellos'];
      let rows = '';
      for (let i = 0; i < 6; i++) {
        const elF = formsEl[i] ? formsEl[i][0] : '—';
        const esF = formsEs[i] ? formsEs[i][0] : '—';
        rows += `<tr><td style="opacity:.65;padding-right:6px;font-size:.8rem">${personsEl[i]} / ${personsEs[i]}</td><td><b>${elF}</b></td><td style="padding-left:10px"><b>${esF}</b></td></tr>`;
      }
      const head = frontIsEs
        ? `<div class="greek-word">${g.lemma}</div><div class="roman-word">${g.en || card.en || ''}</div>`
        : `<div class="greek-word">${s.lemma}</div><div class="roman-word">${s.en || card.en || ''}</div>`;
      backContent.innerHTML = head + `<div style="margin-top:8px;font-size:.85rem;opacity:.85">${tenseLabel}</div>
        <table style="margin:6px auto;font-size:.9rem;text-align:left">${rows}</table>`;
    } else if (mainMode === 'nouns') {
      frontMain.className = 'greek-word';
      if (frontIsEs) {
        frontMain.textContent = card.es;
        frontSub.textContent = card.g ? (card.g === 'm' ? 'el' : 'la') : '';
      } else {
        frontMain.textContent = card.greek;
        frontSub.textContent = card.roman || '';
      }
      backContent.innerHTML = frontIsEs
        ? `<div class="greek-word">${card.greek}</div><div class="roman-word">${card.roman || ''}</div><div class="english-word" style="opacity:.7;font-size:.9rem">${card.en || ''}</div>`
        : `<div class="greek-word">${card.es}</div><div class="roman-word">${card.g === 'm' ? 'el' : (card.g === 'f' ? 'la' : '')}</div><div class="english-word" style="opacity:.7;font-size:.9rem">${card.en || ''}</div>`;
    } else if (mainMode === 'adjectives' || mainMode === 'adverbs' || mainMode === 'calendar' || mainMode === 'phrases') {
      frontMain.className = 'greek-word';
      if (frontIsEs) {
        frontMain.textContent = card.es;
        frontSub.textContent = card.cat || '';
      } else {
        frontMain.textContent = card.greek;
        frontSub.textContent = card.roman || card.cat || '';
      }
      backContent.innerHTML = frontIsEs
        ? `<div class="greek-word">${card.greek}</div>${card.roman ? `<div class="roman-word">${card.roman}</div>` : ''}<div class="english-word" style="opacity:.7;font-size:.9rem">${card.en || ''}</div>`
        : `<div class="greek-word">${card.es}</div><div class="english-word" style="opacity:.7;font-size:.9rem">${card.en || ''}</div>`;
    } else {
      frontMain.className = 'greek-word';
      frontMain.textContent = '—';
      frontSub.textContent = '';
      backContent.innerHTML = `<div style="opacity:.85;padding:1rem">Alphabet, Roots and Other are Greek↔English only. Use Verbs, Nouns, Adjectives, Adverbs, Calendar or Phrases for Greek ↔ Spanish.</div>`;
    }
    syncDeckPosition();
    return;
  }


  // ===== ITALIAN ↔ ENGLISH core rendering =====
  if (isItalianPair() && mainMode !== 'alphabet') {
    const u = t();
    const showIt = isEnIt(); // From=en To=it → front Italian
    if (mainMode === 'verbs') {
      frontMain.className = 'greek-word';
      const tenseKey = verbTenseFilter === 'aorist' ? 'past' : (verbTenseFilter === 'future' ? 'future' : 'present');
      const tenseLabel = tenseKey === 'past' ? u.aorist : (tenseKey === 'future' ? u.future : u.present);
      const forms = card[tenseKey] || card.present;
      frontMain.textContent = showIt ? card.lemma : card.en;
      frontSub.textContent = '';
      const persons = ['io','tu','lui/lei','noi','voi','loro'];
      const rows = (forms || []).map((f,i) => `<tr><td style="opacity:.7;padding-right:8px">${persons[i]||''}</td><td><b>${f[0]}</b></td></tr>`).join('');
      let back = showIt
        ? `<div class="english-word">${card.en}</div><div class="class-label">${card.klass}</div>`
        : `<div class="greek-word">${card.lemma}</div><div class="class-label">${card.klass}</div>`;
      back += `<div style="margin-top:10px;font-size:.9rem;opacity:.85">${tenseLabel}</div>
        <table style="margin:6px auto;font-size:.95rem;text-align:left">${rows}</table>`;
      backContent.innerHTML = back;
    } else if (mainMode === 'nouns') {
      frontMain.className = 'greek-word';
      if (showIt) { frontMain.textContent = card.it; frontSub.textContent = card.g === 'm' ? 'il/un' : 'la/una'; }
      else { frontMain.textContent = card.en; frontSub.textContent = ''; }
      backContent.innerHTML = showIt
        ? `<div class="english-word">${card.en}</div><div class="roman-word">${card.g === 'm' ? 'masculine' : 'feminine'}</div>`
        : `<div class="greek-word">${card.it}</div><div class="roman-word">${card.g === 'm' ? 'il' : 'la'}</div>`;
    } else if (mainMode === 'adjectives' || mainMode === 'adverbs' || mainMode === 'calendar' || mainMode === 'phrases') {
      frontMain.className = 'greek-word';
      const word = card.it || card.es;
      if (showIt) { frontMain.textContent = word; frontSub.textContent = card.cat || ''; }
      else { frontMain.textContent = card.en; frontSub.textContent = card.cat || ''; }
      backContent.innerHTML = showIt
        ? `<div class="english-word">${card.en}</div>`
        : `<div class="greek-word">${word}</div>`;
    } else {
      frontMain.className = 'greek-word';
      frontMain.textContent = '—';
      frontSub.textContent = '';
      backContent.innerHTML = `<div style="opacity:.85;padding:1rem">Use Verbs, Nouns, Adjectives, Adverbs, Calendar or Phrases for Italian. Alphabet works for all languages.</div>`;
    }
    syncDeckPosition();
    return;
  }

  // ===== GREEK ↔ ITALIAN matched core rendering =====
  if (isGreekItalianPair() && mainMode !== 'alphabet') {
    const u = t();
    const frontIsIt = isElIt(); // From=el To=it → front Italian
    if (mainMode === 'verbs') {
      frontMain.className = 'greek-word';
      const g = card.greek, it = card.it;
      const tenseKeyEl = verbTenseFilter === 'aorist' ? 'aorist' : (verbTenseFilter === 'future' ? 'future' : 'present');
      const tenseKeyIt = verbTenseFilter === 'aorist' ? 'past' : (verbTenseFilter === 'future' ? 'future' : 'present');
      const tenseLabel = tenseKeyEl === 'aorist' ? u.aorist : (tenseKeyEl === 'future' ? u.future : u.present);
      frontMain.textContent = frontIsIt ? it.lemma : g.lemma;
      frontSub.textContent = '';
      const formsEl = g[tenseKeyEl] || g.present || [];
      const formsIt = it[tenseKeyIt] || it.present || [];
      const personsEl = ['εγώ','εσύ','αυτός','εμείς','εσείς','αυτοί'];
      const personsIt = ['io','tu','lui/lei','noi','voi','loro'];
      let rows = '';
      for (let i = 0; i < 6; i++) {
        const elF = formsEl[i] ? formsEl[i][0] : '—';
        const itF = formsIt[i] ? formsIt[i][0] : '—';
        rows += `<tr><td style="opacity:.65;padding-right:6px;font-size:.8rem">${personsEl[i]} / ${personsIt[i]}</td><td><b>${elF}</b></td><td style="padding-left:10px"><b>${itF}</b></td></tr>`;
      }
      const head = frontIsIt
        ? `<div class="greek-word">${g.lemma}</div><div class="roman-word">${g.en || card.en || ''}</div>`
        : `<div class="greek-word">${it.lemma}</div><div class="roman-word">${it.en || card.en || ''}</div>`;
      backContent.innerHTML = head + `<div style="margin-top:8px;font-size:.85rem;opacity:.85">${tenseLabel}</div>
        <table style="margin:6px auto;font-size:.9rem;text-align:left">${rows}</table>`;
    } else if (mainMode === 'nouns') {
      frontMain.className = 'greek-word';
      if (frontIsIt) { frontMain.textContent = card.it; frontSub.textContent = card.g === 'm' ? 'il' : 'la'; }
      else { frontMain.textContent = card.greek; frontSub.textContent = card.roman || ''; }
      backContent.innerHTML = frontIsIt
        ? `<div class="greek-word">${card.greek}</div><div class="roman-word">${card.roman||''}</div><div class="english-word" style="opacity:.7;font-size:.9rem">${card.en||''}</div>`
        : `<div class="greek-word">${card.it}</div><div class="roman-word">${card.g==='m'?'il':'la'}</div><div class="english-word" style="opacity:.7;font-size:.9rem">${card.en||''}</div>`;
    } else if (mainMode === 'adjectives' || mainMode === 'adverbs' || mainMode === 'calendar' || mainMode === 'phrases') {
      frontMain.className = 'greek-word';
      if (frontIsIt) { frontMain.textContent = card.it; frontSub.textContent = card.cat || ''; }
      else { frontMain.textContent = card.greek; frontSub.textContent = card.roman || card.cat || ''; }
      backContent.innerHTML = frontIsIt
        ? `<div class="greek-word">${card.greek}</div>${card.roman?`<div class="roman-word">${card.roman}</div>`:''}<div class="english-word" style="opacity:.7;font-size:.9rem">${card.en||''}</div>`
        : `<div class="greek-word">${card.it}</div><div class="english-word" style="opacity:.7;font-size:.9rem">${card.en||''}</div>`;
    } else {
      frontMain.className = 'greek-word';
      frontMain.textContent = '—';
      frontSub.textContent = '';
      backContent.innerHTML = `<div style="opacity:.85;padding:1rem">Alphabet works for all languages. Roots/Other are Greek↔English only.</div>`;
    }
    syncDeckPosition();
    return;
  }

  // ===== SPANISH ↔ ENGLISH core rendering =====
  if (isSpanishPair() && mainMode !== 'alphabet') {
    const u = t();
    const showEs = isEnEs(); // front = Spanish when From=en To=es
    if (mainMode === 'verbs') {
      frontMain.className = 'greek-word';
      const tenseKey = verbTenseFilter === 'aorist' ? 'past' : (verbTenseFilter === 'future' ? 'future' : 'present');
      const tenseLabel = tenseKey === 'past' ? u.aorist : (tenseKey === 'future' ? u.future : u.present);
      const forms = card[tenseKey] || card.present;
      if (showEs) {
        frontMain.textContent = card.lemma;
        frontSub.textContent = '';
      } else {
        frontMain.textContent = card.en;
        frontSub.textContent = '';
      }
      const rows = (forms || []).map((f,i) => {
        const person = ['yo','tú','él/ella','nosotros','vosotros','ellos'][i] || '';
        return `<tr><td style="opacity:.7;padding-right:8px">${person}</td><td><b>${f[0]}</b></td></tr>`;
      }).join('');
      let back = showEs
        ? `<div class="english-word">${card.en}</div><div class="class-label">${card.klass}</div>`
        : `<div class="greek-word">${card.lemma}</div><div class="class-label">${card.klass}</div>`;
      back += `<div style="margin-top:10px;font-size:.9rem;opacity:.85">${tenseLabel}</div>
        <table style="margin:6px auto;font-size:.95rem;text-align:left">${rows}</table>`;
      backContent.innerHTML = back;
    } else if (mainMode === 'nouns') {
      frontMain.className = 'greek-word';
      if (showEs) {
        frontMain.textContent = card.es;
        frontSub.textContent = card.g ? (card.g === 'm' ? 'el/un' : 'la/una') : '';
      } else {
        frontMain.textContent = card.en;
        frontSub.textContent = '';
      }
      backContent.innerHTML = showEs
        ? `<div class="english-word">${card.en}</div><div class="roman-word">${card.g === 'm' ? 'masculine' : 'feminine'}</div>`
        : `<div class="greek-word">${card.es}</div><div class="roman-word">${card.g === 'm' ? 'el' : 'la'}</div>`;
    } else if (mainMode === 'adjectives') {
      frontMain.className = 'greek-word';
      if (showEs) {
        frontMain.textContent = card.es;
        frontSub.textContent = '';
      } else {
        frontMain.textContent = card.en;
        frontSub.textContent = '';
      }
      backContent.innerHTML = showEs
        ? `<div class="english-word">${card.en}</div>`
        : `<div class="greek-word">${card.es}</div>`;
    } else if (mainMode === 'adverbs') {
      frontMain.className = 'greek-word';
      if (showEs) {
        frontMain.textContent = card.es;
        frontSub.textContent = '';
      } else {
        frontMain.textContent = card.en;
        frontSub.textContent = '';
      }
      backContent.innerHTML = showEs
        ? `<div class="english-word">${card.en}</div>`
        : `<div class="greek-word">${card.es}</div>`;
    } else if (mainMode === 'calendar') {
      frontMain.className = 'greek-word';
      if (showEs) {
        frontMain.textContent = card.es;
        frontSub.textContent = card.cat || '';
      } else {
        frontMain.textContent = card.en;
        frontSub.textContent = card.cat || '';
      }
      backContent.innerHTML = showEs
        ? `<div class="english-word">${card.en}</div>`
        : `<div class="greek-word">${card.es}</div>`;
    } else if (mainMode === 'phrases') {
      frontMain.className = 'greek-word';
      if (showEs) {
        frontMain.textContent = card.es;
        frontSub.textContent = '';
      } else {
        frontMain.textContent = card.en;
        frontSub.textContent = '';
      }
      backContent.innerHTML = showEs
        ? `<div class="english-word">${card.en}</div>`
        : `<div class="greek-word">${card.es}</div>`;
    } else if (mainMode === 'roots' || mainMode === 'other' || mainMode === 'alphabet') {
      frontMain.className = 'greek-word';
      frontMain.textContent = showEs ? '—' : '—';
      frontSub.textContent = '';
      backContent.innerHTML = `<div style="opacity:.8;padding:1rem">This section is available for Greek ↔ English. Switch pair or choose Verbs / Nouns / Phrases for Spanish.</div>`;
    }
    // stats
    syncDeckPosition();
    return;
  }

  if (mainMode === 'alphabet') {
    const u = t();
    frontMain.className = 'letter';
    // Front = To language letter; Back = name/sound (From language UI labels)
    const showLetterFront = true; // always show characters on front for alphabet
    // When learning direction is "from known to target", front is target letter
    frontMain.textContent = card.upper + ' ' + card.lower;
    frontSub.textContent = card.name;
    backContent.innerHTML = `
      <div class="letter" style="font-size:2.6rem">${card.upper} ${card.lower}</div>
      <div class="english-word">${card.name}</div>
      <div class="roman-word">${u.sound} ${card.sound}</div>
      <div style="margin-top:8px;font-size:.85rem;opacity:.7">${u.like} ${card.example}</div>`;
  }
  else if (mainMode === 'verbs') {
    const u = t();
    frontMain.className = 'greek-word';
    const tenseKey = verbTenseFilter === 'aorist' ? 'aorist' : (verbTenseFilter === 'future' ? 'future' : 'present');
    const tenseLabel = tenseKey === 'aorist' ? u.aorist : (tenseKey === 'future' ? u.future : u.present);
    const forms = card[tenseKey] || card.present;
    if (isElEn()) {
      frontMain.textContent = card.en;
      frontSub.textContent = '';
    } else {
      frontMain.textContent = card.lemma;
      frontSub.textContent = '';
    }
    let back = isElEn()
      ? `<div class="greek-word">${card.lemma}</div><div class="class-label">${card.klass}</div>`
      : `<div class="english-word">${card.en}</div><div class="class-label">${card.klass}</div>`;
    back += `<div class="tense-title tense-clickable" id="tenseTitleBtn">${tenseLabel} · ${u.tapEx}</div>`;
    back += makeConjTable(forms);
    const vexAll = verbExamples[card.lemma];
    const vex = vexAll ? (vexAll[tenseKey] || vexAll.present || null) : null;
    if (vex && vex.g) {
      back += `<button type="button" class="example-btn" id="showExampleBtn">${u.example} (${tenseLabel})</button>`;
    }
    backContent.innerHTML = back;
    const openVex = () => {
      if (!vex || !vex.g) return;
      if (isElEn()) openExampleModal(vex.e, '', vex.g);
      else openExampleModal(vex.g, vex.r, vex.e);
    };
    const btn = document.getElementById('showExampleBtn');
    if (btn) btn.addEventListener('click', (e) => { e.stopPropagation(); openVex(); });
    const tBtn = document.getElementById('tenseTitleBtn');
    if (tBtn) tBtn.addEventListener('click', (e) => { e.stopPropagation(); openVex(); });
  }
  else if (mainMode === 'nouns') {
    const u = t();
    frontMain.className = 'greek-word';
    const ex = card.exG ? {g:card.exG,r:card.exR,e:card.exE} : makeNounExample(card);
    const pl = nounPlural(card);
    const plBlock = (pl.nom || pl.acc) ? `
          <div style="margin-top:6px"><strong>${u.plural || 'Plural:'}</strong> ${pl.nom}${pl.acc && pl.acc !== pl.nom ? ' · ' + pl.acc : ''}</div>
          ${pl.nomR || pl.accR ? `<div class="roman-word">${[pl.nomR, pl.accR].filter(Boolean).join(' · ')}</div>` : ''}` : '';
    if (isElEn()) {
      frontMain.textContent = card.en;
      frontSub.textContent = '';
      backContent.innerHTML = `
        <div class="greek-word">${card.greek}</div>
        <div class="roman-word">${card.roman || ''}</div>
        <div style="margin-top:10px;font-size:.95rem">
          <div><strong>${u.accusative}</strong> ${card.acc}</div>
          <div class="roman-word">${card.accR || ''}</div>
          ${plBlock}
        </div>
        <div class="example-block">
          <div class="ex-e">${ex.e}</div>
          <div class="ex-g">${ex.g}</div>
        </div>`;
    } else {
      frontMain.textContent = card.greek;
      frontSub.textContent = card.roman;
      backContent.innerHTML = `
        <div class="greek-word">${card.greek}</div>
        <div class="roman-word">${card.roman}</div>
        <div class="english-word">${card.en}</div>
        <div style="margin-top:10px;font-size:.95rem">
          <div><strong>${u.accusative}</strong> ${card.acc}</div>
          <div class="roman-word">${card.accR}</div>
          ${plBlock}
        </div>
        <div class="example-block">
          <div class="ex-g">${ex.g}</div>
          <div class="ex-r">${ex.r}</div>
          <div class="ex-e">${ex.e}</div>
        </div>`;
    }
  }
  else if (mainMode === 'adjectives') {
    frontMain.className = 'greek-word';
    const ex = card.exG ? {g:card.exG,r:card.exR,e:card.exE} : makeAdjExample(card);
    if (isElEn()) {
      frontMain.textContent = card.en;
      frontSub.textContent = '';
      backContent.innerHTML = `
        <div style="margin-top:8px;font-size:1.1rem;line-height:1.5">
          <div><strong>M:</strong> ${card.m}</div>
          <div><strong>F:</strong> ${card.f}</div>
          <div><strong>N:</strong> ${card.n}</div>
        </div>
        <div class="roman-word" style="margin-top:6px">${card.roman || ''}</div>
        <div class="example-block">
          <div class="ex-e">${ex.e}</div>
          <div class="ex-g">${ex.g}</div>
        </div>`;
    } else {
      frontMain.textContent = card.m;
      frontSub.textContent = card.roman;
      backContent.innerHTML = `
        <div class="english-word">${card.en}</div>
        <div style="margin-top:8px;font-size:1.1rem;line-height:1.5">
          <div><strong>M:</strong> ${card.m}</div>
          <div><strong>F:</strong> ${card.f}</div>
          <div><strong>N:</strong> ${card.n}</div>
        </div>
        <div class="roman-word" style="margin-top:6px">${card.roman}</div>
        <div class="example-block">
          <div class="ex-g">${ex.g}</div>
          <div class="ex-r">${ex.r}</div>
          <div class="ex-e">${ex.e}</div>
        </div>`;
    }
  }
  else if (mainMode === 'roots') {
    const u = t();
    frontMain.className = 'greek-word';
    if (isElEn()) {
      frontMain.textContent = card.en;
      frontSub.textContent = '';
      backContent.innerHTML = `
        <div class="greek-word">${card.greek}</div>
        <div class="roman-word">${card.roman || ''}</div>
        <div style="margin-top:10px;font-size:.95rem;line-height:1.45;opacity:.9"><strong>${u.examples}</strong><br>${card.examples}</div>
        <div class="class-label" style="margin-top:8px">${card.cat}</div>`;
    } else {
      frontMain.textContent = card.greek;
      frontSub.textContent = card.roman;
      backContent.innerHTML = `
        <div class="greek-word">${card.greek}</div>
        <div class="roman-word">${card.roman}</div>
        <div class="english-word">${card.en}</div>
        <div style="margin-top:10px;font-size:.95rem;line-height:1.45;opacity:.9"><strong>${u.examples}</strong><br>${card.examples}</div>
        <div class="class-label" style="margin-top:8px">${card.cat}</div>`;
    }
  }
  else if (mainMode === 'phrases') {
    frontMain.className = 'greek-word';
    if (isElEn()) {
      frontMain.textContent = card.en;
      frontSub.textContent = '';
      backContent.innerHTML = `
        <div class="greek-word" style="font-size:1.55rem">${card.greek}</div>
        <div class="roman-word">${card.roman || ''}</div>
        <div class="class-label" style="margin-top:8px">${card.cat}</div>`;
    } else {
      frontMain.textContent = card.greek;
      frontSub.textContent = '';
      backContent.innerHTML = `
        <div class="greek-word" style="font-size:1.55rem">${card.greek}</div>
        <div class="roman-word">${card.roman}</div>
        <div class="english-word">${card.en}</div>
        <div class="class-label" style="margin-top:8px">${card.cat}</div>`;
    }
  }
  else { // adverbs + other + calendar
    frontMain.className = 'greek-word';
    const ex = card.exG ? {g:card.exG,r:card.exR,e:card.exE} : (card.greek && card.en ? (() => {
      const opts = [
        {g:`Στα ελληνικά λέμε «${card.greek}».`,r:card.roman?`Sta elliniká léme «${card.roman}».`:'',e:`In Greek we say “${card.en}”.`},
        {g:`Χρησιμοποιώ συχνά τη λέξη «${card.greek}».`,r:card.roman?`Chrisimopió sichná ti léxi «${card.roman}».`:'',e:`I often use the word “${card.en}”.`},
        {g:`Θυμάμαι τη λέξη «${card.greek}» — σημαίνει ${card.en}.`,r:card.roman?`Thimáme ti léxi «${card.roman}».`:'',e:`I remember the word “${card.greek}” — it means ${card.en}.`}
      ];
      return opts[hashPick(card.greek, opts.length)];
    })() : null);
    if (isElEn()) {
      frontMain.textContent = card.en || card.greek;
      frontSub.textContent = '';
      let back = `
        <div class="greek-word">${card.greek}</div>
        <div class="roman-word">${card.roman || ''}</div>`;
      if (ex) {
        back += `<div class="example-block">
          <div class="ex-e">${ex.e}</div>
          <div class="ex-g">${ex.g}</div>
        </div>`;
      }
      backContent.innerHTML = back;
    } else {
      frontMain.textContent = card.greek;
      frontSub.textContent = card.roman || '';
      let back = `
        <div class="greek-word">${card.greek}</div>
        <div class="roman-word">${card.roman || ''}</div>
        <div class="english-word">${card.en}</div>`;
      if (ex) {
        back += `<div class="example-block">
          <div class="ex-g">${ex.g}</div>
          <div class="ex-r">${ex.r}</div>
          <div class="ex-e">${ex.e}</div>
        </div>`;
      }
      backContent.innerHTML = back;
    }
  }

  syncDeckPosition();
  if (!preserveFlip && isFlipped) {
    flashcard.classList.remove('flipped');
    isFlipped = false;
  } else if (preserveFlip && isFlipped) {
    // keep back face visible after content refresh
    flashcard.classList.add('flipped');
  }
}

function filterVerbs() {
  if (isGreekSpanishPair()) {
    currentSet = getElEsVerbs().filter(v => verbClassFilter === 'all' || (v.klass || v.greek?.klass) === verbClassFilter);
    currentIndex = 0; updateCard(); return;
  }
  if (isGreekItalianPair()) {
    currentSet = getElItVerbs().filter(v => verbClassFilter === 'all' || (v.klass || v.greek?.klass) === verbClassFilter);
    currentIndex = 0; updateCard(); return;
  }
  const cLang = coreLangOfPair();
  if (cLang && isCoreEnglishPair()) {
    const src = (getCore(cLang)||{}).verbs || [];
    currentSet = src.filter(v => verbClassFilter === 'all' || v.klass === verbClassFilter);
    currentIndex = 0; updateCard(); return;
  }
  if (cLang && isCoreGreekPair()) {
    currentSet = getElCoreVerbs(cLang).filter(v => verbClassFilter === 'all' || (v.klass || v.greek?.klass) === verbClassFilter);
    currentIndex = 0; updateCard(); return;
  }
  currentSet = verbs.filter(v => verbClassFilter === 'all' || v.klass === verbClassFilter);
  currentIndex = 0;
  updateCard();
}

function filterNouns() {
  if (isGreekSpanishPair()) {
    currentSet = getElEsNouns().filter(n => (nounCatFilter === 'all' || n.cat === nounCatFilter) && (nounGenderFilter === 'all' || !n.g || n.g === nounGenderFilter));
    currentIndex = 0; updateCard(); return;
  }
  if (isGreekItalianPair()) {
    currentSet = getElItNouns().filter(n => (nounCatFilter === 'all' || n.cat === nounCatFilter) && (nounGenderFilter === 'all' || !n.g || n.g === nounGenderFilter));
    currentIndex = 0; updateCard(); return;
  }
  const cLang = coreLangOfPair();
  if (cLang && isCoreEnglishPair()) {
    const src = (getCore(cLang)||{}).nouns || [];
    currentSet = src.filter(n => (nounCatFilter === 'all' || n.cat === nounCatFilter) && (nounGenderFilter === 'all' || !n.g || n.g === nounGenderFilter));
    currentIndex = 0; updateCard(); return;
  }
  if (cLang && isCoreGreekPair()) {
    currentSet = getElCoreNouns(cLang).filter(n => (nounCatFilter === 'all' || n.cat === nounCatFilter) && (nounGenderFilter === 'all' || !n.g || n.g === nounGenderFilter));
    currentIndex = 0; updateCard(); return;
  }
  currentSet = nouns.filter(n => {
    const catOk = nounCatFilter === 'all' || n.cat === nounCatFilter;
    const genOk = nounGenderFilter === 'all' || n.gender === nounGenderFilter;
    return catOk && genOk;
  });
  currentIndex = 0;
  updateCard();
}

function filterAdjectives() {
  if (isGreekSpanishPair()) {
    const src = getElEsAdjectives();
    currentSet = adjCatFilter === 'all' ? [...src] : src.filter(a => a.cat === adjCatFilter);
    currentIndex = 0; updateCard(); return;
  }
  if (isGreekItalianPair()) {
    const src = getElItAdjectives();
    currentSet = adjCatFilter === 'all' ? [...src] : src.filter(a => a.cat === adjCatFilter);
    currentIndex = 0; updateCard(); return;
  }
  const cLang = coreLangOfPair();
  if (cLang && isCoreEnglishPair()) {
    const src = (getCore(cLang)||{}).adjectives || [];
    currentSet = adjCatFilter === 'all' ? [...src] : src.filter(a => a.cat === adjCatFilter);
    currentIndex = 0; updateCard(); return;
  }
  if (cLang && isCoreGreekPair()) {
    const src = getElCoreAdjectives(cLang);
    currentSet = adjCatFilter === 'all' ? [...src] : src.filter(a => a.cat === adjCatFilter);
    currentIndex = 0; updateCard(); return;
  }
  currentSet = adjCatFilter === 'all' ? [...adjectives] : adjectives.filter(a => a.cat === adjCatFilter);
  currentIndex = 0;
  updateCard();
}
function filterCalendar() {
  if (isGreekSpanishPair()) {
    const src = getElEsCalendar();
    currentSet = calendarCatFilter === 'all' ? [...src] : src.filter(t => t.cat === calendarCatFilter);
    currentIndex = 0; updateCard(); return;
  }
  if (isGreekItalianPair()) {
    const src = getElItCalendar();
    currentSet = calendarCatFilter === 'all' ? [...src] : src.filter(t => t.cat === calendarCatFilter);
    currentIndex = 0; updateCard(); return;
  }
  const cLang = coreLangOfPair();
  if (cLang && isCoreEnglishPair()) {
    const src = (getCore(cLang)||{}).calendar || [];
    currentSet = calendarCatFilter === 'all' ? [...src] : src.filter(t => t.cat === calendarCatFilter);
    currentIndex = 0; updateCard(); return;
  }
  if (cLang && isCoreGreekPair()) {
    const src = getElCoreCalendar(cLang);
    currentSet = calendarCatFilter === 'all' ? [...src] : src.filter(t => t.cat === calendarCatFilter);
    currentIndex = 0; updateCard(); return;
  }
  currentSet = calendarCatFilter === 'all' ? [...timeItems] : timeItems.filter(t => t.cat === calendarCatFilter);
  currentIndex = 0;
  updateCard();
}
function filterRoots() {
  currentSet = rootsCatFilter === 'all' ? [...roots] : roots.filter(r => r.cat === rootsCatFilter);
  currentIndex = 0;
  updateCard();
}
function filterPhrases() {
  if (isGreekSpanishPair()) {
    const src = getElEsPhrases();
    currentSet = phrasesCatFilter === 'all' ? [...src] : src.filter(p => p.cat === phrasesCatFilter);
    currentIndex = 0; updateCard(); return;
  }
  if (isGreekItalianPair()) {
    const src = getElItPhrases();
    currentSet = phrasesCatFilter === 'all' ? [...src] : src.filter(p => p.cat === phrasesCatFilter);
    currentIndex = 0; updateCard(); return;
  }
  const cLang = coreLangOfPair();
  if (cLang && isCoreEnglishPair()) {
    const src = (getCore(cLang)||{}).phrases || [];
    currentSet = phrasesCatFilter === 'all' ? [...src] : src.filter(p => p.cat === phrasesCatFilter);
    currentIndex = 0; updateCard(); return;
  }
  if (cLang && isCoreGreekPair()) {
    const src = getElCorePhrases(cLang);
    currentSet = phrasesCatFilter === 'all' ? [...src] : src.filter(p => p.cat === phrasesCatFilter);
    currentIndex = 0; updateCard(); return;
  }
  currentSet = phrasesCatFilter === 'all' ? [...phrases] : phrases.filter(p => p.cat === phrasesCatFilter);
  currentIndex = 0;
  updateCard();
}

function cardsForMode(mode) {
  if (mode === 'kitchen') {
    return cardsForMode('nouns').filter(n => n.cat === 'kitchen');
  }
  if (mode === 'mixed') {
    return ['verbs', 'nouns', 'adjectives', 'adverbs', 'calendar', 'phrases']
      .flatMap(m => cardsForMode(m));
  }
  if (mode === 'alphabet') return [...(typeof getAlphabetFor === 'function' ? getAlphabetFor(toLang) : alphabet)];
  if (mode === 'adverbs') {
    if (isGreekSpanishPair()) return [...getElEsAdverbs()];
    if (isGreekItalianPair()) return [...getElItAdverbs()];
    if (isCoreEnglishPair()) return [...(((getCore(coreLangOfPair()) || {}).adverbs) || [])];
    if (isCoreGreekPair()) return [...getElCoreAdverbs(coreLangOfPair())];
    return [...adverbs];
  }
  if (mode === 'other') return [...other];
  if (mode === 'roots') return [...roots];

  if (isGreekSpanishPair()) {
    if (mode === 'verbs') return [...getElEsVerbs()];
    if (mode === 'nouns') return [...getElEsNouns()];
    if (mode === 'adjectives') return [...getElEsAdjectives()];
    if (mode === 'calendar') return [...getElEsCalendar()];
    if (mode === 'phrases') return [...getElEsPhrases()];
  }
  if (isGreekItalianPair()) {
    if (mode === 'verbs') return [...getElItVerbs()];
    if (mode === 'nouns') return [...getElItNouns()];
    if (mode === 'adjectives') return [...getElItAdjectives()];
    if (mode === 'calendar') return [...getElItCalendar()];
    if (mode === 'phrases') return [...getElItPhrases()];
  }
  const cLang = coreLangOfPair();
  if (cLang && isCoreEnglishPair()) {
    const core = getCore(cLang) || {};
    if (mode === 'verbs') return [...(core.verbs || [])];
    if (mode === 'nouns') return [...(core.nouns || [])];
    if (mode === 'adjectives') return [...(core.adjectives || [])];
    if (mode === 'calendar') return [...(core.calendar || [])];
    if (mode === 'phrases') return [...(core.phrases || [])];
  }
  if (cLang && isCoreGreekPair()) {
    if (mode === 'verbs') return [...getElCoreVerbs(cLang)];
    if (mode === 'nouns') return [...getElCoreNouns(cLang)];
    if (mode === 'adjectives') return [...getElCoreAdjectives(cLang)];
    if (mode === 'calendar') return [...getElCoreCalendar(cLang)];
    if (mode === 'phrases') return [...getElCorePhrases(cLang)];
  }
  if (mode === 'verbs') return [...verbs];
  if (mode === 'nouns') return [...nouns];
  if (mode === 'adjectives') return [...adjectives];
  if (mode === 'calendar') return [...timeItems];
  if (mode === 'phrases') return [...phrases];
  return [];
}

function setStudyChrome(on) {
  ['searchWrap', 'stats', 'progressWrap', 'cardContainer', 'cardControls', 'keyboardHint'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.toggle('hidden', !on);
  });
  const panel = document.getElementById('testPanel');
  if (panel) panel.classList.toggle('hidden', on);
}

function setMainMode(mode) {
  mainMode = mode;
  document.querySelectorAll('.main-tab').forEach(t => t.classList.remove('active'));
  const tab = document.querySelector(`[data-main="${mode}"]`);
  if (tab) tab.classList.add('active');

  // hide all filters
  ['alphabetFilters','verbClassFilters','verbTenseFilters','nounFilters','nounGenderFilters','adjFilters','calendarFilters','rootsFilters','phrasesFilters'].forEach(id => {
    document.getElementById(id).classList.add('hidden');
  });
  document.getElementById('digraphsSection').classList.add('hidden');

  if (mode === 'tests') {
    setStudyChrome(false);
    if (typeof showTestHub === 'function') showTestHub();
    return;
  }
  setStudyChrome(true);

  if (mode === 'alphabet') {
    document.getElementById('alphabetFilters').classList.remove('hidden');
    renderDigraphs(toLang);
    currentSet = [...getAlphabetFor(toLang)];
  } else if (mode === 'verbs') {
    document.getElementById('verbClassFilters').classList.remove('hidden');
    document.getElementById('verbTenseFilters').classList.remove('hidden');
    filterVerbs();
    return;
  } else if (mode === 'nouns') {
    document.getElementById('nounFilters').classList.remove('hidden');
    document.getElementById('nounGenderFilters').classList.remove('hidden');
    filterNouns();
    return;
  } else if (mode === 'adjectives') {
    document.getElementById('adjFilters').classList.remove('hidden');
    filterAdjectives();
    return;
  } else if (mode === 'adverbs') {
    if (isGreekSpanishPair()) currentSet = [...getElEsAdverbs()];
    else if (isGreekItalianPair()) currentSet = [...getElItAdverbs()];
    else if (isCoreEnglishPair()) {
      const c = getCore(coreLangOfPair());
      currentSet = [...((c&&c.adverbs)||[])];
    } else if (isCoreGreekPair()) {
      currentSet = [...getElCoreAdverbs(coreLangOfPair())];
    } else currentSet = [...adverbs];
  } else if (mode === 'calendar') {
    document.getElementById('calendarFilters').classList.remove('hidden');
    filterCalendar();
    return;
  } else if (mode === 'roots') {
    document.getElementById('rootsFilters').classList.remove('hidden');
    filterRoots();
    return;
  } else if (mode === 'phrases') {
    document.getElementById('phrasesFilters').classList.remove('hidden');
    filterPhrases();
    return;
  } else {
    currentSet = [...other];
  }
  currentIndex = 0;
  updateCard();
}

function flip() {
  flashcard.classList.toggle('flipped');
  isFlipped = !isFlipped;
}
function next() {
  if (!currentSet.length) return;
  currentIndex = (currentIndex + 1) % currentSet.length;
  updateCard();
}
function prev() {
  if (!currentSet.length) return;
  currentIndex = (currentIndex - 1 + currentSet.length) % currentSet.length;
  updateCard();
}
function shuffle() {
  currentSet = [...currentSet].sort(() => Math.random() - 0.5);
  currentIndex = 0;
  updateCard();
}

/* Events */
flashcard.addEventListener('click', flip);
document.getElementById('nextBtn').addEventListener('click', next);
document.getElementById('prevBtn').addEventListener('click', prev);
document.getElementById('shuffleBtn').addEventListener('click', shuffle);
const cardSlider = document.getElementById('cardSlider');
if (cardSlider) {
  cardSlider.addEventListener('input', () => jumpToCard(cardSlider.value));
}

document.querySelectorAll('.main-tab').forEach(tab => {
  tab.addEventListener('click', () => setMainMode(tab.dataset.main));
});

document.querySelectorAll('#alphabetFilters .filter-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('#alphabetFilters .filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const m = btn.dataset.mode;
    const ab = getAlphabetFor(toLang);
    if (m === 'vowels') currentSet = ab.filter(l => l.type === 'vowel');
    else if (m === 'consonants') currentSet = ab.filter(l => l.type === 'consonant');
    else if (m === 'tricky') currentSet = ab.filter(l => l.tricky);
    else currentSet = [...getAlphabetFor(toLang)];
    currentIndex = 0;
    updateCard();
  });
});

document.querySelectorAll('#verbClassFilters .filter-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('#verbClassFilters .filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    verbClassFilter = btn.dataset.vclass;
    filterVerbs();
  });
});

document.querySelectorAll('#verbTenseFilters .filter-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('#verbTenseFilters .filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    verbTenseFilter = btn.dataset.vtense;
    // re-render current card; keep front/back as the user left it
    updateCard(true);
  });
});

document.querySelectorAll('#nounFilters .filter-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('#nounFilters .filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    nounCatFilter = btn.dataset.ncat;
    filterNouns();
  });
});
document.querySelectorAll('#nounGenderFilters .filter-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('#nounGenderFilters .filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    nounGenderFilter = btn.dataset.ngender;
    filterNouns();
  });
});

document.querySelectorAll('#adjFilters .filter-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('#adjFilters .filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    adjCatFilter = btn.dataset.acat;
    filterAdjectives();
  });
});
document.querySelectorAll('#calendarFilters .filter-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('#calendarFilters .filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    calendarCatFilter = btn.dataset.ccat;
    filterCalendar();
  });
});
document.querySelectorAll('#rootsFilters .filter-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('#rootsFilters .filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    rootsCatFilter = btn.dataset.rcat;
    filterRoots();
  });
});
document.querySelectorAll('#phrasesFilters .filter-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('#phrasesFilters .filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    phrasesCatFilter = btn.dataset.pcat;
    filterPhrases();
  });
});

document.addEventListener('keydown', e => {
  if (mainMode === 'tests') return;
  if (e.target && /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)) return;
  if (e.code === 'Space') { e.preventDefault(); flip(); }
  if (e.code === 'ArrowRight') next();
  if (e.code === 'ArrowLeft') prev();
  if (e.code === 'KeyS') shuffle();
  if (e.code === 'Escape') closeExampleModal();
});

/* ===== Example modal ===== */
function openExampleModal(g, r, e) {
  document.getElementById('modalExG').textContent = g || '';
  document.getElementById('modalExR').textContent = r || '';
  document.getElementById('modalExE').textContent = e || '';
  document.getElementById('exampleModal').classList.remove('hidden');
}
function closeExampleModal() {
  document.getElementById('exampleModal').classList.add('hidden');
}
document.getElementById('modalClose').addEventListener('click', closeExampleModal);
document.getElementById('exampleModal').addEventListener('click', (ev) => {
  if (ev.target.id === 'exampleModal') closeExampleModal();
});

/* ===== Zoom ===== */
let uiScale = 1;
const ZOOM_MIN = 0.85, ZOOM_MAX = 1.5, ZOOM_STEP = 0.1;
function applyZoom() {
  document.documentElement.style.setProperty('--ui-scale', String(uiScale));
  document.getElementById('zoomLabel').textContent = Math.round(uiScale * 100) + '%';
}
document.getElementById('zoomIn').addEventListener('click', () => {
  uiScale = Math.min(ZOOM_MAX, Math.round((uiScale + ZOOM_STEP) * 100) / 100);
  applyZoom();
});
document.getElementById('zoomOut').addEventListener('click', () => {
  uiScale = Math.max(ZOOM_MIN, Math.round((uiScale - ZOOM_STEP) * 100) / 100);
  applyZoom();
});

/* ===== Search ===== */
function buildSearchIndex() {
  const idx = [];
  const pairLangs = [fromLang, toLang];
  // Alphabets only for the two selected languages
  pairLangs.forEach(lang => {
    const ab = getAlphabetFor(lang);
    (ab || []).forEach((c, i) => {
      idx.push({
        mode: 'alphabet', idx: i, lang: lang,
        primary: c.upper + ' ' + c.lower,
        secondary: (c.name || '') + ' · ' + (c.sound || ''),
        hay: (c.upper + ' ' + c.lower + ' ' + (c.name||'') + ' ' + (c.sound||'') + ' ' + lang).toLowerCase()
      });
    });
  });

  // Full Greek↔English rich data
  if (typeof richPair === 'function' && richPair()) {
    verbs.forEach((v, i) => {
      idx.push({ mode:'verbs', idx:i, primary:v.lemma, secondary:v.en+' · '+v.klass,
        hay:(v.lemma+' '+v.en+' '+v.klass).toLowerCase() });
    });
    nouns.forEach((n, i) => {
      idx.push({ mode:'nouns', idx:i, primary:n.greek, secondary:(n.roman||'')+' · '+n.en,
        hay:(n.greek+' '+(n.roman||'')+' '+n.en+' '+(n.acc||'')+' '+(n.cat||'')).toLowerCase() });
    });
    adjectives.forEach((a, i) => {
      idx.push({ mode:'adjectives', idx:i, primary:a.m+' / '+a.f, secondary:(a.roman||'')+' · '+a.en,
        hay:(a.m+' '+a.f+' '+a.n+' '+(a.roman||'')+' '+a.en+' '+(a.cat||'')).toLowerCase() });
    });
    adverbs.forEach((a, i) => {
      idx.push({ mode:'adverbs', idx:i, primary:a.greek, secondary:(a.roman||'')+' · '+a.en,
        hay:(a.greek+' '+(a.roman||'')+' '+a.en).toLowerCase() });
    });
    timeItems.forEach((t, i) => {
      idx.push({ mode:'calendar', idx:i, primary:t.greek, secondary:(t.roman||'')+' · '+t.en,
        hay:(t.greek+' '+(t.roman||'')+' '+t.en+' '+(t.cat||'')).toLowerCase() });
    });
    roots.forEach((r, i) => {
      idx.push({ mode:'roots', idx:i, primary:r.greek, secondary:(r.roman||'')+' · '+r.en,
        hay:(r.greek+' '+(r.roman||'')+' '+r.en+' '+(r.examples||'')+' '+(r.cat||'')).toLowerCase() });
    });
    phrases.forEach((p, i) => {
      idx.push({ mode:'phrases', idx:i, primary:p.greek, secondary:(p.roman||'')+' · '+p.en,
        hay:(p.greek+' '+(p.roman||'')+' '+p.en+' '+(p.cat||'')).toLowerCase() });
    });
    other.forEach((o, i) => {
      idx.push({ mode:'other', idx:i, primary:o.greek, secondary:(o.roman||'')+' · '+o.en,
        hay:(o.greek+' '+(o.roman||'')+' '+o.en).toLowerCase() });
    });
    return idx;
  }

  // Greek ↔ core language (matched)
  const _isGkCore = (typeof isCoreGreekPair === 'function' && isCoreGreekPair())
    || (typeof isGreekSpanishPair === 'function' && isGreekSpanishPair())
    || (typeof isGreekItalianPair === 'function' && isGreekItalianPair());
  if (_isGkCore) {
    const cLang = (typeof coreLangOfPair === 'function' && coreLangOfPair())
      || ((typeof isGreekSpanishPair === 'function' && isGreekSpanishPair()) ? 'es'
        : ((typeof isGreekItalianPair === 'function' && isGreekItalianPair()) ? 'it' : null));
    if (cLang) {
      const wk = (getCore(cLang) || {}).wordKey || cLang;
      let vlist = [];
      try {
        if (cLang === 'es' && typeof getElEsVerbs === 'function') vlist = getElEsVerbs();
        else if (cLang === 'it' && typeof getElItVerbs === 'function') vlist = getElItVerbs();
        else if (typeof getElCoreVerbs === 'function') vlist = getElCoreVerbs(cLang);
      } catch(e) { vlist = []; }
      vlist.forEach((v, i) => {
        const g = v.greek || {}, c = v.core || v.es || v.it || {};
        const lemmaC = c.lemma || '';
        const lemmaG = g.lemma || '';
        idx.push({ mode:'verbs', idx:i, primary:lemmaG || lemmaC, secondary:(lemmaC||lemmaG)+' · '+(v.en||g.en||c.en||''),
          hay:(lemmaG+' '+lemmaC+' '+(v.en||'')+' '+(g.en||'')+' '+(c.en||'')).toLowerCase() });
      });
      let nlist = [];
      try {
        if (cLang === 'es' && typeof getElEsNouns === 'function') nlist = getElEsNouns();
        else if (cLang === 'it' && typeof getElItNouns === 'function') nlist = getElItNouns();
        else if (typeof getElCoreNouns === 'function') nlist = getElCoreNouns(cLang);
      } catch(e) { nlist = []; }
      nlist.forEach((n, i) => {
        const w = n[wk] || n.es || n.it || n.coreWord || '';
        idx.push({ mode:'nouns', idx:i, primary:n.greek || w, secondary:(n.roman||'')+' · '+(n.en||'')+' · '+w,
          hay:((n.greek||'')+' '+(n.roman||'')+' '+(n.en||'')+' '+w).toLowerCase() });
      });
      // adjectives / adverbs / calendar / phrases via generic or pair-specific
      const pushSimple = (list, mode, getPrimary) => {
        (list || []).forEach((item, i) => {
          const prim = getPrimary(item);
          const en = item.en || '';
          const w = item[wk] || item.es || item.it || '';
          idx.push({ mode, idx:i, primary:prim, secondary:(item.roman||'')+' · '+en+(w?' · '+w:''),
            hay:(prim+' '+(item.roman||'')+' '+en+' '+w).toLowerCase() });
        });
      };
      try {
        if (cLang === 'es') {
          if (typeof getElEsAdjectives === 'function') pushSimple(getElEsAdjectives(), 'adjectives', a => a.greek || a.es || '');
          if (typeof getElEsAdverbs === 'function') pushSimple(getElEsAdverbs(), 'adverbs', a => a.greek || a.es || '');
          if (typeof getElEsCalendar === 'function') pushSimple(getElEsCalendar(), 'calendar', a => a.greek || a.es || '');
          if (typeof getElEsPhrases === 'function') pushSimple(getElEsPhrases(), 'phrases', a => a.greek || a.es || '');
        } else if (cLang === 'it') {
          if (typeof getElItAdjectives === 'function') pushSimple(getElItAdjectives(), 'adjectives', a => a.greek || a.it || '');
          if (typeof getElItAdverbs === 'function') pushSimple(getElItAdverbs(), 'adverbs', a => a.greek || a.it || '');
          if (typeof getElItCalendar === 'function') pushSimple(getElItCalendar(), 'calendar', a => a.greek || a.it || '');
          if (typeof getElItPhrases === 'function') pushSimple(getElItPhrases(), 'phrases', a => a.greek || a.it || '');
        } else {
          if (typeof getElCoreAdjectives === 'function') pushSimple(getElCoreAdjectives(cLang), 'adjectives', a => a.greek || a[wk] || '');
          if (typeof getElCoreAdverbs === 'function') pushSimple(getElCoreAdverbs(cLang), 'adverbs', a => a.greek || a[wk] || '');
          if (typeof getElCoreCalendar === 'function') pushSimple(getElCoreCalendar(cLang), 'calendar', a => a.greek || a[wk] || '');
          if (typeof getElCorePhrases === 'function') pushSimple(getElCorePhrases(cLang), 'phrases', a => a.greek || a[wk] || '');
        }
      } catch(e) {}
    }
    return idx;
  }

  // Core language ↔ English
  const _isCoreEn = (typeof isCoreEnglishPair === 'function' && isCoreEnglishPair())
    || (typeof isSpanishPair === 'function' && isSpanishPair())
    || (typeof isItalianPair === 'function' && isItalianPair());
  if (_isCoreEn) {
    const cLang = (typeof coreLangOfPair === 'function' && coreLangOfPair())
      || ((typeof isSpanishPair === 'function' && isSpanishPair()) ? 'es'
        : ((typeof isItalianPair === 'function' && isItalianPair()) ? 'it' : null));
    const core = (typeof getCore === 'function') ? getCore(cLang) : null;
    if (core) {
      const wk = core.wordKey || cLang;
      (core.verbs || []).forEach((v, i) => {
        idx.push({ mode:'verbs', idx:i, primary:v.lemma, secondary:v.en+' · '+(v.klass||''),
          hay:(v.lemma+' '+v.en+' '+(v.klass||'')).toLowerCase() });
      });
      (core.nouns || []).forEach((n, i) => {
        const w = n[wk] || '';
        idx.push({ mode:'nouns', idx:i, primary:w, secondary:n.en+(n.cat?' · '+n.cat:''),
          hay:(w+' '+n.en+' '+(n.cat||'')).toLowerCase() });
      });
      (core.adjectives || []).forEach((a, i) => {
        const w = a[wk] || '';
        idx.push({ mode:'adjectives', idx:i, primary:w, secondary:a.en+(a.cat?' · '+a.cat:''),
          hay:(w+' '+a.en+' '+(a.cat||'')).toLowerCase() });
      });
      (core.adverbs || []).forEach((a, i) => {
        const w = a[wk] || '';
        idx.push({ mode:'adverbs', idx:i, primary:w, secondary:a.en,
          hay:(w+' '+a.en).toLowerCase() });
      });
      (core.calendar || []).forEach((t, i) => {
        const w = t[wk] || '';
        idx.push({ mode:'calendar', idx:i, primary:w, secondary:t.en+(t.cat?' · '+t.cat:''),
          hay:(w+' '+t.en+' '+(t.cat||'')).toLowerCase() });
      });
      (core.phrases || []).forEach((p, i) => {
        const w = p[wk] || '';
        idx.push({ mode:'phrases', idx:i, primary:w, secondary:p.en+(p.cat?' · '+p.cat:''),
          hay:(w+' '+p.en+' '+(p.cat||'')).toLowerCase() });
      });
    }
    return idx;
  }

  return idx;
}

let searchIndex = [];
function rebuildSearchIndex() {
  try {
    searchIndex = buildSearchIndex();
  } catch (e) {
    console.warn('search index rebuild failed', e);
    searchIndex = [];
  }
}
const searchInput = document.getElementById('searchInput');
const searchResults = document.getElementById('searchResults');
let searchActive = -1;
let searchHits = [];

function scoreMatch(hay, q) {
  if (hay.startsWith(q)) return 100;
  const words = hay.split(/\s+/);
  if (words.some(w => w.startsWith(q))) return 80;
  if (hay.includes(q)) return 50;
  // simple fuzzy: all query chars in order
  let j = 0;
  for (let i = 0; i < hay.length && j < q.length; i++) {
    if (hay[i] === q[j]) j++;
  }
  if (j === q.length) return 20;
  return 0;
}

function runSearch(q) {
  q = q.trim().toLowerCase();
  searchActive = -1;
  if (q.length < 1) {
    searchResults.classList.remove('open');
    searchResults.innerHTML = '';
    searchHits = [];
    return;
  }
  const scored = [];
  for (const item of searchIndex) {
    const s = scoreMatch(item.hay, q);
    if (s > 0) scored.push({ ...item, score: s });
  }
  scored.sort((a, b) => b.score - a.score || a.primary.localeCompare(b.primary));
  searchHits = scored.slice(0, 12);
  if (!searchHits.length) {
    searchResults.innerHTML = '<div class="search-empty">' + t().noMatch + '</div>';
    searchResults.classList.add('open');
    return;
  }
  searchResults.innerHTML = searchHits.map((h, i) =>
    `<div class="search-item" data-i="${i}" role="option">
      <div class="si-main">${escapeHtml(h.primary)} <span class="si-mode">${h.mode}</span></div>
      <div class="si-sub">${escapeHtml(h.secondary)}</div>
    </div>`
  ).join('');
  searchResults.classList.add('open');
}

function escapeHtml(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function goToSearchHit(hit) {
  searchResults.classList.remove('open');
  searchInput.value = '';
  searchHits = [];
  searchActive = -1;

  // Reset filters so the item is visible in its section
  verbClassFilter = 'all';
  nounCatFilter = 'all';
  nounGenderFilter = 'all';
  adjCatFilter = 'all';
  calendarCatFilter = 'all';
  rootsCatFilter = 'all';
  phrasesCatFilter = 'all';

  // Sync filter button UI to "all"
  document.querySelectorAll('#verbClassFilters .filter-btn, #nounFilters .filter-btn, #nounGenderFilters .filter-btn, #adjFilters .filter-btn, #calendarFilters .filter-btn, #rootsFilters .filter-btn, #phrasesFilters .filter-btn, #alphabetFilters .filter-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.vclass === 'all' || b.dataset.ncat === 'all' || b.dataset.ngender === 'all' || b.dataset.acat === 'all' || b.dataset.ccat === 'all' || b.dataset.rcat === 'all' || b.dataset.pcat === 'all' || b.dataset.mode === 'all');
  });

  setMainMode(hit.mode);

  // After mode switch, locate the exact card in currentSet
  let found = -1;
  if (hit.mode === 'verbs') {
    found = currentSet.findIndex(v => v.lemma === verbs[hit.idx].lemma);
  } else if (hit.mode === 'alphabet') {
    // Prefer the alphabet of the hit's language; fall back to current toLang
    const abLang = hit.lang || toLang;
    if (abLang !== toLang && abLang !== fromLang) {
      // Keep current pair; just show that language's alphabet as target
      toLang = abLang;
      if (fromLang === toLang) fromLang = (abLang === 'en' ? 'el' : 'en');
      updateLangSelects();
    }
    currentSet = [...getAlphabetFor(toLang)];
    found = hit.idx < currentSet.length ? hit.idx : 0;
  } else if (hit.mode === 'nouns') {
    const target = nouns[hit.idx];
    found = currentSet.findIndex(n => n.greek === target.greek && n.en === target.en);
  } else if (hit.mode === 'adjectives') {
    const target = adjectives[hit.idx];
    found = currentSet.findIndex(a => a.m === target.m && a.en === target.en);
  } else if (hit.mode === 'adverbs') {
    found = hit.idx;
    currentSet = [...adverbs];
  } else if (hit.mode === 'calendar') {
    const target = timeItems[hit.idx];
    found = currentSet.findIndex(t => t.greek === target.greek && t.en === target.en);
  } else if (hit.mode === 'roots') {
    const target = roots[hit.idx];
    found = currentSet.findIndex(r => r.greek === target.greek && r.en === target.en);
  } else if (hit.mode === 'phrases') {
    const target = phrases[hit.idx];
    found = currentSet.findIndex(p => p.greek === target.greek && p.en === target.en);
  } else if (hit.mode === 'other') {
    found = hit.idx;
    currentSet = [...other];
  }

  if (found < 0) found = 0;
  currentIndex = found;
  updateCard();
  // briefly highlight by flipping front-only (ensure not flipped)
  if (isFlipped) { flashcard.classList.remove('flipped'); isFlipped = false; }
  searchInput.blur();
}

searchInput.addEventListener('input', () => runSearch(searchInput.value));
searchInput.addEventListener('focus', () => {
  if (searchInput.value.trim()) runSearch(searchInput.value);
});
searchInput.addEventListener('keydown', (e) => {
  if (!searchResults.classList.contains('open') || !searchHits.length) {
    if (e.code === 'Escape') { searchInput.value = ''; searchResults.classList.remove('open'); }
    return;
  }
  if (e.code === 'ArrowDown') {
    e.preventDefault();
    searchActive = Math.min(searchHits.length - 1, searchActive + 1);
    highlightSearchItem();
  } else if (e.code === 'ArrowUp') {
    e.preventDefault();
    searchActive = Math.max(0, searchActive - 1);
    highlightSearchItem();
  } else if (e.code === 'Enter') {
    e.preventDefault();
    const i = searchActive >= 0 ? searchActive : 0;
    if (searchHits[i]) goToSearchHit(searchHits[i]);
  } else if (e.code === 'Escape') {
    searchResults.classList.remove('open');
    searchInput.blur();
  }
});

function highlightSearchItem() {
  searchResults.querySelectorAll('.search-item').forEach((el, i) => {
    el.classList.toggle('active', i === searchActive);
    if (i === searchActive) el.scrollIntoView({ block: 'nearest' });
  });
}

searchResults.addEventListener('mousedown', (e) => {
  const item = e.target.closest('.search-item');
  if (!item) return;
  e.preventDefault();
  const i = parseInt(item.dataset.i, 10);
  if (searchHits[i]) goToSearchHit(searchHits[i]);
});

document.addEventListener('click', (e) => {
  if (!e.target.closest('.search-wrap')) {
    searchResults.classList.remove('open');
  }
});


/* ===== Learn direction + i18n ===== */
/* ========== MULTI-LANGUAGE STATE ========== */
const LANG_CODES = ['el','en','es','fr','it','de','nl','pt'];
const LANG_NAMES = {
  el: {el:'Ελληνικά', en:'Greek', es:'Griego', fr:'Grec', it:'Greco', de:'Griechisch', nl:'Grieks', pt:'Grego'},
  en: {el:'Αγγλικά', en:'English', es:'Inglés', fr:'Anglais', it:'Inglese', de:'Englisch', nl:'Engels', pt:'Inglês'},
  es: {el:'Ισπανικά', en:'Spanish', es:'Español', fr:'Espagnol', it:'Spagnolo', de:'Spanisch', nl:'Spaans', pt:'Espanhol'},
  fr: {el:'Γαλλικά', en:'French', es:'Francés', fr:'Français', it:'Francese', de:'Französisch', nl:'Frans', pt:'Francês'},
  it: {el:'Ιταλικά', en:'Italian', es:'Italiano', fr:'Italien', it:'Italiano', de:'Italienisch', nl:'Italiaans', pt:'Italiano'},
  de: {el:'Γερμανικά', en:'German', es:'Alemán', fr:'Allemand', it:'Tedesco', de:'Deutsch', nl:'Duits', pt:'Alemão'},
  nl: {el:'Ολλανδικά', en:'Dutch', es:'Neerlandés', fr:'Néerlandais', it:'Olandese', de:'Niederländisch', nl:'Nederlands', pt:'Holandês'},
  pt: {el:'Πορτογαλικά', en:'Portuguese', es:'Portugués', fr:'Portugais', it:'Portoghese', de:'Portugiesisch', nl:'Portugees', pt:'Português'}
};

let fromLang = localStorage.getItem('fromLang') || 'en';
let toLang   = localStorage.getItem('toLang')   || 'el';

// Compatibility helpers for existing Greek↔English logic
function isElEn() { return fromLang === 'el' && toLang === 'en'; }
function isEnEl() { return fromLang === 'en' && toLang === 'el'; }
function isGreekPair() { return fromLang === 'el' || toLang === 'el'; }
function richPair() { return (fromLang === 'el' && toLang === 'en') || (fromLang === 'en' && toLang === 'el'); }
function isEsEn() { return fromLang === 'es' && toLang === 'en'; }
function isEnEs() { return fromLang === 'en' && toLang === 'es'; }
function isSpanishPair() { return (fromLang === 'es' && toLang === 'en') || (fromLang === 'en' && toLang === 'es'); }
function isElEs() { return fromLang === 'el' && toLang === 'es'; }
function isEsEl() { return fromLang === 'es' && toLang === 'el'; }
function isGreekSpanishPair() { return isElEs() || isEsEl(); }
function isItEn() { return fromLang === 'it' && toLang === 'en'; }
function isEnIt() { return fromLang === 'en' && toLang === 'it'; }
function isItalianPair() { return isItEn() || isEnIt(); }
function isElIt() { return fromLang === 'el' && toLang === 'it'; }
function isItEl() { return fromLang === 'it' && toLang === 'el'; }
function isGreekItalianPair() { return isElIt() || isItEl(); }
function coreLangOfPair() {
  // Returns the non-English, non-Greek core language code if this is a core pair
  for (const L of (typeof CORE_LANGS!=='undefined'?CORE_LANGS:['es','it','fr','de','nl','pt'])) {
    if ((fromLang===L && toLang==='en') || (fromLang==='en' && toLang===L)) return L;
    if ((fromLang===L && toLang==='el') || (fromLang==='el' && toLang===L)) return L;
  }
  return null;
}
function isCoreEnglishPair() {
  return coreLangOfPair() && (fromLang==='en' || toLang==='en') && fromLang!=='el' && toLang!=='el';
}
function isCoreGreekPair() {
  return coreLangOfPair() && (fromLang==='el' || toLang==='el') && fromLang!=='en' && toLang!=='en';
}
function isAnyCorePair() {
  const c = coreLangOfPair();
  return !!c;
}
function hasCoreData() {
  return richPair() || isAnyCorePair();
}
function getCore(lang) { return (typeof CORE!=='undefined' && CORE[lang]) ? CORE[lang] : null; }


/** Normalize English gloss for cross-language matching */
function normKey(s) {
  return (s || '').toLowerCase()
    .replace(/\([^)]*\)/g, '')
    .split(/[\/,;]/)[0]
    .trim()
    .replace(/\s+/g, ' ');
}


/* Generic Greek ↔ any core language matching */
const elCoreCache = {};
function getElCoreVerbs(lang) {
  const key = 'v_'+lang;
  if (elCoreCache[key]) return elCoreCache[key];
  const coreV = (getCore(lang)||{}).verbs || [];
  const map = {};
  coreV.forEach(v => { const k = normKey(v.en); if (k) map[k] = v; });
  const out = [];
  verbs.forEach(g => {
    const k = normKey(g.en);
    if (map[k]) out.push({ greek:g, core:map[k], en:g.en, klass:g.klass||map[k].klass });
  });
  return elCoreCache[key] = out;
}
function getElCoreNouns(lang) {
  const key = 'n_'+lang;
  if (elCoreCache[key]) return elCoreCache[key];
  const coreN = (getCore(lang)||{}).nouns || [];
  const wk = (getCore(lang)||{}).wordKey || lang;
  const map = {};
  coreN.forEach(n => { const k = normKey(n.en); if (k) map[k] = n; });
  const out = [];
  nouns.forEach(g => {
    const k = normKey(g.en);
    if (map[k]) out.push({ greek:g.greek, roman:g.roman, en:g.en, cat:g.cat||map[k].cat, g:map[k].g||g.gender, [wk]:map[k][wk], coreWord:map[k][wk], pl:map[k].pl });
  });
  return elCoreCache[key] = out;
}
function getElCoreAdjectives(lang) {
  const key = 'a_'+lang;
  if (elCoreCache[key]) return elCoreCache[key];
  const coreA = (getCore(lang)||{}).adjectives || [];
  const wk = (getCore(lang)||{}).wordKey || lang;
  const map = {};
  coreA.forEach(a => { const k = normKey(a.en); if (k) map[k] = a; });
  const out = [];
  adjectives.forEach(g => {
    const k = normKey(g.en);
    if (map[k]) out.push({ greek:g.m||g.greek, roman:g.roman, en:g.en, cat:g.cat||map[k].cat, [wk]:map[k][wk] });
  });
  return elCoreCache[key] = out;
}
function getElCoreAdverbs(lang) {
  const key = 'adv_'+lang;
  if (elCoreCache[key]) return elCoreCache[key];
  const coreA = (getCore(lang)||{}).adverbs || [];
  const wk = (getCore(lang)||{}).wordKey || lang;
  const map = {};
  coreA.forEach(a => { const k = normKey(a.en); if (k) map[k] = a; });
  const out = [];
  (typeof adverbs!=='undefined'?adverbs:[]).forEach(g => {
    const k = normKey(g.en);
    if (map[k]) out.push({ greek:g.greek||g.en, roman:g.roman, en:g.en, [wk]:map[k][wk] });
  });
  // also include unmatched core-only via English as greek placeholder skip — keep matched only
  return elCoreCache[key] = out;
}
function getElCorePhrases(lang) {
  const key = 'p_'+lang;
  if (elCoreCache[key]) return elCoreCache[key];
  const coreP = (getCore(lang)||{}).phrases || [];
  const wk = (getCore(lang)||{}).wordKey || lang;
  const map = {};
  coreP.forEach(p => { const k = normKey(p.en); if (k) map[k] = p; });
  const out = [];
  (typeof phrases!=='undefined'?phrases:[]).forEach(g => {
    const k = normKey(g.en);
    if (map[k]) out.push({ greek:g.greek||g.en, roman:g.roman, en:g.en, cat:g.cat||map[k].cat, [wk]:map[k][wk] });
  });
  return elCoreCache[key] = out;
}
function getElCoreCalendar(lang) {
  const key = 'c_'+lang;
  if (elCoreCache[key]) return elCoreCache[key];
  const coreC = (getCore(lang)||{}).calendar || [];
  const wk = (getCore(lang)||{}).wordKey || lang;
  const map = {};
  coreC.forEach(c => { const k = normKey(c.en); if (k) map[k] = c; });
  const out = [];
  (typeof timeItems!=='undefined'?timeItems:[]).forEach(g => {
    const k = normKey(g.en);
    if (map[k]) out.push({ greek:g.greek, roman:g.roman, en:g.en, cat:g.cat||map[k].cat, [wk]:map[k][wk] });
  });
  return elCoreCache[key] = out;
}

/** Build matched Greek↔Spanish verb pairs by English gloss */
function buildElEsVerbs() {
  const map = {};
  esVerbs.forEach(v => {
    const k = normKey(v.en);
    if (k) map[k] = map[k] || { es: v };
  });
  // also index secondary senses
  esVerbs.forEach(v => {
    (v.en || '').toLowerCase().split(/[\/]/).forEach(part => {
      const k = normKey(part);
      if (k && !map[k]) map[k] = { es: v };
    });
  });
  const out = [];
  verbs.forEach(g => {
    const k = normKey(g.en);
    const hit = map[k];
    if (hit && hit.es) {
      out.push({ greek: g, es: hit.es, en: g.en, klass: g.klass });
    }
  });
  return out;
}

function buildElEsNouns() {
  const map = {};
  esNouns.forEach(n => {
    const k = normKey(n.en);
    if (k) map[k] = map[k] || n;
  });
  const out = [];
  nouns.forEach(g => {
    const k = normKey(g.en);
    const es = map[k];
    if (es) out.push({ greek: g.greek, roman: g.roman, es: es.es, en: g.en, cat: g.cat || es.cat, g: es.g || g.gender });
  });
  return out;
}

function buildElEsAdjectives() {
  const map = {};
  esAdjectives.forEach(a => {
    const k = normKey(a.en);
    if (k) map[k] = map[k] || a;
  });
  const out = [];
  adjectives.forEach(g => {
    const k = normKey(g.en);
    const es = map[k];
    if (es) out.push({ greek: g.m || g.greek, roman: g.roman, es: es.es, en: g.en, cat: g.cat || es.cat });
  });
  return out;
}

function buildElEsAdverbs() {
  const map = {};
  esAdverbs.forEach(a => {
    const k = normKey(a.en);
    if (k) map[k] = map[k] || a;
  });
  const out = [];
  adverbs.forEach(g => {
    const k = normKey(g.en);
    const es = map[k];
    if (es) out.push({ greek: g.greek, roman: g.roman, es: es.es, en: g.en });
  });
  return out;
}

function buildElEsPhrases() {
  const map = {};
  esPhrases.forEach(p => {
    const k = normKey(p.en);
    if (k) map[k] = map[k] || p;
  });
  const out = [];
  phrases.forEach(g => {
    const k = normKey(g.en);
    const es = map[k];
    if (es) out.push({ greek: g.greek, roman: g.roman, es: es.es, en: g.en, cat: g.cat || es.cat });
  });
  return out;
}

function buildElEsCalendar() {
  const map = {};
  esCalendar.forEach(c => {
    const k = normKey(c.en);
    if (k) map[k] = map[k] || c;
  });
  const out = [];
  timeItems.forEach(g => {
    const k = normKey(g.en);
    const es = map[k];
    if (es) out.push({ greek: g.greek, roman: g.roman, es: es.es, en: g.en, cat: g.cat || es.cat });
  });
  return out;
}

let elEsVerbsCache = null, elEsNounsCache = null, elEsAdjCache = null, elEsAdvCache = null, elEsPhrCache = null, elEsCalCache = null;
function getElEsVerbs() { return elEsVerbsCache || (elEsVerbsCache = buildElEsVerbs()); }
function getElEsNouns() { return elEsNounsCache || (elEsNounsCache = buildElEsNouns()); }
function getElEsAdjectives() { return elEsAdjCache || (elEsAdjCache = buildElEsAdjectives()); }
function getElEsAdverbs() { return elEsAdvCache || (elEsAdvCache = buildElEsAdverbs()); }
function getElEsPhrases() { return elEsPhrCache || (elEsPhrCache = buildElEsPhrases()); }
function getElEsCalendar() { return elEsCalCache || (elEsCalCache = buildElEsCalendar()); }

function buildElItVerbs() {
  const map = {};
  itVerbs.forEach(v => {
    const k = normKey(v.en);
    if (k) map[k] = map[k] || { it: v };
    (v.en || '').toLowerCase().split(/[\/]/).forEach(part => {
      const kk = normKey(part);
      if (kk && !map[kk]) map[kk] = { it: v };
    });
  });
  const out = [];
  verbs.forEach(g => {
    const k = normKey(g.en);
    if (map[k] && map[k].it) out.push({ greek: g, it: map[k].it, en: g.en, klass: g.klass });
  });
  return out;
}
function buildElItNouns() {
  const map = {};
  itNouns.forEach(n => { const k = normKey(n.en); if (k) map[k] = map[k] || n; });
  const out = [];
  nouns.forEach(g => {
    const k = normKey(g.en);
    const it = map[k];
    if (it) out.push({ greek: g.greek, roman: g.roman, it: it.it, en: g.en, cat: g.cat || it.cat, g: it.g || g.gender });
  });
  return out;
}
function buildElItAdjectives() {
  const map = {};
  itAdjectives.forEach(a => { const k = normKey(a.en); if (k) map[k] = map[k] || a; });
  const out = [];
  adjectives.forEach(g => {
    const k = normKey(g.en);
    const it = map[k];
    if (it) out.push({ greek: g.m || g.greek, roman: g.roman, it: it.it, en: g.en, cat: g.cat || it.cat });
  });
  return out;
}
function buildElItAdverbs() {
  const map = {};
  itAdverbs.forEach(a => { const k = normKey(a.en); if (k) map[k] = map[k] || a; });
  const out = [];
  adverbs.forEach(g => {
    const k = normKey(g.en);
    const it = map[k];
    if (it) out.push({ greek: g.greek, roman: g.roman, it: it.it, en: g.en });
  });
  return out;
}
function buildElItPhrases() {
  const map = {};
  itPhrases.forEach(p => { const k = normKey(p.en); if (k) map[k] = map[k] || p; });
  const out = [];
  phrases.forEach(g => {
    const k = normKey(g.en);
    const it = map[k];
    if (it) out.push({ greek: g.greek, roman: g.roman, it: it.it, en: g.en, cat: g.cat || it.cat });
  });
  return out;
}
function buildElItCalendar() {
  const map = {};
  itCalendar.forEach(c => { const k = normKey(c.en); if (k) map[k] = map[k] || c; });
  const out = [];
  timeItems.forEach(g => {
    const k = normKey(g.en);
    const it = map[k];
    if (it) out.push({ greek: g.greek, roman: g.roman, it: it.it, en: g.en, cat: g.cat || it.cat });
  });
  return out;
}
let elItVerbsCache=null, elItNounsCache=null, elItAdjCache=null, elItAdvCache=null, elItPhrCache=null, elItCalCache=null;
function getElItVerbs() { return elItVerbsCache || (elItVerbsCache = buildElItVerbs()); }
function getElItNouns() { return elItNounsCache || (elItNounsCache = buildElItNouns()); }
function getElItAdjectives() { return elItAdjCache || (elItAdjCache = buildElItAdjectives()); }
function getElItAdverbs() { return elItAdvCache || (elItAdvCache = buildElItAdverbs()); }
function getElItPhrases() { return elItPhrCache || (elItPhrCache = buildElItPhrases()); }
function getElItCalendar() { return elItCalCache || (elItCalCache = buildElItCalendar()); }



const UI = {
  en: {
    title: 'Flashcards',
    subtitle: 'Alphabet · Verbs · Nouns · Adjectives · Adverbs · Calendar · Roots · Phrases · Other',
    searchPh: 'Search…',
    tabs: {alphabet:'Alphabet',verbs:'Verbs',nouns:'Nouns',adjectives:'Adjectives',adverbs:'Adverbs',calendar:'Calendar',roots:'Roots',phrases:'Phrases',other:'Other',tests:'Tests'},
    cardOf: (c,t) => `Card ${c} of ${t}`,
    flipHint: 'Click or Space to flip',
    prev: '← Prev', shuffle: 'Shuffle', next: 'Next →',
    keyHint: '← → navigate · Space flip · S shuffle',
    example: 'Example sentence',
    close: 'Close',
    noMatch: 'No matches',
    present: 'Present', aorist: 'Aorist (Past)', future: 'Future',
    tapEx: 'tap for example',
    examples: 'Examples:',
    accusative: 'Accusative:',
    plural: 'Plural:',
    digraphsH2: 'Common Digraphs & Pronunciation',
    sound: 'Sound:',
    like: 'Like:',
    fromLbl: 'From', toLbl: 'To', swapTitle: 'Swap languages',
    filters: {
      all:'All', vowels:'Vowels', consonants:'Consonants', tricky:'Tricky',
      allClasses:'All Classes', irregular:'Irregular', regular:'Regular -ω', contracted:'Contracted', deponent:'Deponent',
      present:'Present', aorist:'Aorist (Past)', future:'Future',
      family:'Family', places:'Places', food:'Food & Drink', body:'Body', things:'Things', nature:'Nature',
      work:'Work & School', island:'Island / Travel', clothing:'Clothing', household:'Household', animals:'Animals',
      garden:'Garden & Tools', kitchen:'Kitchen/Grocery',
      allGenders:'All Genders', m:'Masculine (ο)', f:'Feminine (η)', n:'Neuter (το)',
      quality:'Quality', size:'Size', color:'Color', feeling:'Feeling', quantity:'Quantity',
      numbers:'Numbers', days:'Days', months:'Months', seasons:'Seasons', clock:'Clock', frequency:'Frequency',
      weights:'Weights', timewords:'Time Words',
      prefix:'Prefixes', verb:'Verb roots', noun:'Noun roots', number:'Numbers', bodyNature:'Body / nature', suffix:'Suffixes',
      survival:'Survival', social:'Social', foodShop:'Food / shop', travel:'Travel', opinions:'Opinions', patterns:'Sentence patterns'
    },
    quiz: {
      intro: 'Quiz yourself on the current language pair. Scores stay on this device.',
      topic: 'Topic',
      length: 'Questions',
      style: 'Type',
      choice: 'Multiple choice',
      typed: 'Type the answer',
      start: 'Start test',
      progress: 'Your progress',
      noHistory: 'No tests yet — start one above.',
      testsTaken: 'Tests taken',
      overall: 'Overall accuracy',
      last: 'Latest',
      question: (i, n) => `Question ${i} of ${n}`,
      check: 'Check',
      nextQ: 'Next',
      finish: 'See results',
      correct: 'Correct',
      incorrect: 'Not quite',
      expected: 'Answer',
      results: 'Results',
      score: (c, tot) => `${c} / ${tot} correct`,
      missed: 'Review misses',
      again: 'Try again',
      hub: 'All tests',
      clear: 'Clear saved progress',
      empty: 'Not enough cards in this topic for a test with the current language pair.',
      mixed: 'Mixed',
      kitchen: 'Kitchen/Grocery',
      typedPh: 'Type the translation…',
      byTopic: 'By topic'
    }
  },
  el: {
    title: 'Κάρτες',
    subtitle: 'Αλφάβητο · Ρήματα · Ουσιαστικά · Επίθετα · Επιρρήματα · Ημερολόγιο · Ρίζες · Φράσεις · Άλλα',
    searchPh: 'Αναζήτηση…',
    tabs: {alphabet:'Αλφάβητο',verbs:'Ρήματα',nouns:'Ουσιαστικά',adjectives:'Επίθετα',adverbs:'Επιρρήματα',calendar:'Ημερολόγιο',roots:'Ρίζες',phrases:'Φράσεις',other:'Άλλα',tests:'Τεστ'},
    cardOf: (c,t) => `Κάρτα ${c} από ${t}`,
    flipHint: 'Κλικ ή Space για αναστροφή',
    prev: '← Προηγ.', shuffle: 'Ανακάτεμα', next: 'Επόμ. →',
    keyHint: '← → πλοήγηση · Space αναστροφή · S ανακάτεμα',
    example: 'Παράδειγμα',
    close: 'Κλείσιμο',
    noMatch: 'Κανένα αποτέλεσμα',
    present: 'Ενεστώτας', aorist: 'Αόριστος', future: 'Μέλλοντας',
    tapEx: 'πάτα για παράδειγμα',
    examples: 'Παραδείγματα:',
    accusative: 'Αιτιατική:',
    plural: 'Πληθυντικός:',
    digraphsH2: 'Δίψηφα & Προφορά',
    sound: 'Ήχος:',
    like: 'Όπως:',
    fromLbl: 'Από', toLbl: 'Προς', swapTitle: 'Αντιστροφή γλωσσών',
    filters: {
      all:'Όλα', vowels:'Φωνήεντα', consonants:'Σύμφωνα', tricky:'Δύσκολα',
      allClasses:'Όλες οι κατηγορίες', irregular:'Ανώμαλα', regular:'Κανονικά -ω', contracted:'Συστηματικά', deponent:'Αποθετικά',
      present:'Ενεστώτας', aorist:'Αόριστος', future:'Μέλλοντας',
      family:'Οικογένεια', places:'Μέρη', food:'Φαγητό & Ποτό', body:'Σώμα', things:'Πράγματα', nature:'Φύση',
      work:'Δουλειά & Σχολείο', island:'Νησί / Ταξίδι', clothing:'Ρούχα', household:'Σπίτι', animals:'Ζώα',
      garden:'Κήπος & Εργαλεία', kitchen:'Κουζίνα / Ψώνια',
      allGenders:'Όλα τα γένη', m:'Αρσενικό (ο)', f:'Θηλυκό (η)', n:'Ουδέτερο (το)',
      quality:'Ποιότητα', size:'Μέγεθος', color:'Χρώμα', feeling:'Συναίσθημα', quantity:'Ποσότητα',
      numbers:'Αριθμοί', days:'Μέρες', months:'Μήνες', seasons:'Εποχές', clock:'Ώρα', frequency:'Συχνότητα',
      weights:'Βάρη', timewords:'Χρονικές λέξεις',
      prefix:'Προθέματα', verb:'Ρίζες ρημάτων', noun:'Ρίζες ουσ.', number:'Αριθμοί', bodyNature:'Σώμα / φύση', suffix:'Επιθήματα',
      survival:'Επιβίωση', social:'Κοινωνικά', foodShop:'Φαγητό / μαγαζί', travel:'Ταξίδι', opinions:'Γνώμες', patterns:'Μοτίβα προτάσεων'
    }
  },
  es: {
    title: 'Tarjetas',
    subtitle: 'Alfabeto · Verbos · Sustantivos · Adjetivos · Adverbios · Calendario · Raíces · Frases · Otros',
    searchPh: 'Buscar…',
    tabs: {alphabet:'Alfabeto',verbs:'Verbos',nouns:'Sustantivos',adjectives:'Adjetivos',adverbs:'Adverbios',calendar:'Calendario',roots:'Raíces',phrases:'Frases',other:'Otros',tests:'Tests'},
    cardOf: (c,t) => `Tarjeta ${c} de ${t}`,
    flipHint: 'Clic o Espacio para voltear',
    prev: '← Ant.', shuffle: 'Mezclar', next: 'Sig. →',
    keyHint: '← → navegar · Espacio voltear · S mezclar',
    example: 'Ejemplo',
    close: 'Cerrar',
    noMatch: 'Sin resultados',
    present: 'Presente', aorist: 'Pasado', future: 'Futuro',
    tapEx: 'toca para ejemplo',
    examples: 'Ejemplos:',
    accusative: 'Acusativo:',
    plural: 'Plural:',
    digraphsH2: 'Dígrafos y pronunciación',
    sound: 'Sonido:',
    like: 'Como:',
    fromLbl: 'De', toLbl: 'A', swapTitle: 'Intercambiar idiomas',
    filters: {
      all:'Todos', vowels:'Vocales', consonants:'Consonantes', tricky:'Difíciles',
      allClasses:'Todas las clases', irregular:'Irregulares', regular:'Regulares', contracted:'Contractos', deponent:'Deponentes',
      present:'Presente', aorist:'Pasado', future:'Futuro',
      family:'Familia', places:'Lugares', food:'Comida y bebida', body:'Cuerpo', things:'Cosas', nature:'Naturaleza',
      work:'Trabajo y escuela', island:'Isla / Viaje', clothing:'Ropa', household:'Hogar', animals:'Animales',
      garden:'Jardín y herramientas', kitchen:'Cocina / Compras',
      allGenders:'Todos los géneros', m:'Masculino', f:'Femenino', n:'Neutro',
      quality:'Calidad', size:'Tamaño', color:'Color', feeling:'Sentimiento', quantity:'Cantidad',
      numbers:'Números', days:'Días', months:'Meses', seasons:'Estaciones', clock:'Hora', frequency:'Frecuencia',
      weights:'Pesos', timewords:'Palabras de tiempo',
      prefix:'Prefijos', verb:'Raíces verbales', noun:'Raíces nominales', number:'Números', bodyNature:'Cuerpo / naturaleza', suffix:'Sufijos',
      survival:'Supervivencia', social:'Social', foodShop:'Comida / tienda', travel:'Viaje', opinions:'Opiniones', patterns:'Patrones de frase'
    }
  },
  fr: {
    title: 'Cartes',
    subtitle: 'Alphabet · Verbes · Noms · Adjectifs · Adverbes · Calendrier · Racines · Phrases · Autres',
    searchPh: 'Rechercher…',
    tabs: {alphabet:'Alphabet',verbs:'Verbes',nouns:'Noms',adjectives:'Adjectifs',adverbs:'Adverbes',calendar:'Calendrier',roots:'Racines',phrases:'Phrases',other:'Autres',tests:'Tests'},
    cardOf: (c,t) => `Carte ${c} sur ${t}`,
    flipHint: 'Clic ou Espace pour retourner',
    prev: '← Préc.', shuffle: 'Mélanger', next: 'Suiv. →',
    keyHint: '← → naviguer · Espace retourner · S mélanger',
    example: 'Exemple',
    close: 'Fermer',
    noMatch: 'Aucun résultat',
    present: 'Présent', aorist: 'Passé', future: 'Futur',
    tapEx: 'appuyer pour exemple',
    examples: 'Exemples :',
    accusative: 'Accusatif :',
    plural: 'Pluriel :',
    digraphsH2: 'Digraphes et prononciation',
    sound: 'Son :',
    like: 'Comme :',
    fromLbl: 'De', toLbl: 'Vers', swapTitle: 'Inverser les langues',
    filters: {
      all:'Tous', vowels:'Voyelles', consonants:'Consonnes', tricky:'Difficiles',
      allClasses:'Toutes les classes', irregular:'Irréguliers', regular:'Réguliers', contracted:'Contractés', deponent:'Déponents',
      present:'Présent', aorist:'Passé', future:'Futur',
      family:'Famille', places:'Lieux', food:'Nourriture et boisson', body:'Corps', things:'Choses', nature:'Nature',
      work:'Travail et école', island:'Île / Voyage', clothing:'Vêtements', household:'Maison', animals:'Animaux',
      garden:'Jardin et outils', kitchen:'Cuisine / Épicerie',
      allGenders:'Tous les genres', m:'Masculin', f:'Féminin', n:'Neutre',
      quality:'Qualité', size:'Taille', color:'Couleur', feeling:'Sentiment', quantity:'Quantité',
      numbers:'Nombres', days:'Jours', months:'Mois', seasons:'Saisons', clock:'Heure', frequency:'Fréquence',
      weights:'Poids', timewords:'Mots de temps',
      prefix:'Préfixes', verb:'Racines verbales', noun:'Racines nominales', number:'Nombres', bodyNature:'Corps / nature', suffix:'Suffixes',
      survival:'Survie', social:'Social', foodShop:'Nourriture / magasin', travel:'Voyage', opinions:'Opinions', patterns:'Modèles de phrase'
    }
  },
  it: {
    title: 'Carte',
    subtitle: 'Alfabeto · Verbi · Sostantivi · Aggettivi · Avverbi · Calendario · Radici · Frasi · Altro',
    searchPh: 'Cerca…',
    tabs: {alphabet:'Alfabeto',verbs:'Verbi',nouns:'Sostantivi',adjectives:'Aggettivi',adverbs:'Avverbi',calendar:'Calendario',roots:'Radici',phrases:'Frasi',other:'Altro',tests:'Test'},
    cardOf: (c,t) => `Carta ${c} di ${t}`,
    flipHint: 'Clic o Spazio per girare',
    prev: '← Prec.', shuffle: 'Mescola', next: 'Succ. →',
    keyHint: '← → navigare · Spazio girare · S mescolare',
    example: 'Esempio',
    close: 'Chiudi',
    noMatch: 'Nessun risultato',
    present: 'Presente', aorist: 'Passato', future: 'Futuro',
    tapEx: 'tocca per esempio',
    examples: 'Esempi:',
    accusative: 'Accusativo:',
    plural: 'Plurale:',
    digraphsH2: 'Digrafi e pronuncia',
    sound: 'Suono:',
    like: 'Come:',
    fromLbl: 'Da', toLbl: 'A', swapTitle: 'Scambia lingue',
    filters: {
      all:'Tutti', vowels:'Vocali', consonants:'Consonanti', tricky:'Difficili',
      allClasses:'Tutte le classi', irregular:'Irregolari', regular:'Regolari', contracted:'Contratti', deponent:'Deponenti',
      present:'Presente', aorist:'Passato', future:'Futuro',
      family:'Famiglia', places:'Luoghi', food:'Cibo e bevande', body:'Corpo', things:'Cose', nature:'Natura',
      work:'Lavoro e scuola', island:'Isola / Viaggio', clothing:'Abbigliamento', household:'Casa', animals:'Animali',
      garden:'Giardino e attrezzi', kitchen:'Cucina / Spesa',
      allGenders:'Tutti i generi', m:'Maschile', f:'Femminile', n:'Neutro',
      quality:'Qualità', size:'Dimensione', color:'Colore', feeling:'Sentimento', quantity:'Quantità',
      numbers:'Numeri', days:'Giorni', months:'Mesi', seasons:'Stagioni', clock:'Ora', frequency:'Frequenza',
      weights:'Pesi', timewords:'Parole di tempo',
      prefix:'Prefissi', verb:'Radici verbali', noun:'Radici nominali', number:'Numeri', bodyNature:'Corpo / natura', suffix:'Suffissi',
      survival:'Sopravvivenza', social:'Sociale', foodShop:'Cibo / negozio', travel:'Viaggio', opinions:'Opinioni', patterns:'Modelli di frase'
    }
  },
  de: {
    title: 'Karteikarten',
    subtitle: 'Alphabet · Verben · Nomen · Adjektive · Adverbien · Kalender · Wurzeln · Phrasen · Sonstiges',
    searchPh: 'Suchen…',
    tabs: {alphabet:'Alphabet',verbs:'Verben',nouns:'Nomen',adjectives:'Adjektive',adverbs:'Adverbien',calendar:'Kalender',roots:'Wurzeln',phrases:'Phrasen',other:'Sonstiges',tests:'Tests'},
    cardOf: (c,t) => `Karte ${c} von ${t}`,
    flipHint: 'Klicken oder Leertaste zum Umdrehen',
    prev: '← Zurück', shuffle: 'Mischen', next: 'Weiter →',
    keyHint: '← → navigieren · Leertaste umdrehen · S mischen',
    example: 'Beispielsatz',
    close: 'Schließen',
    noMatch: 'Keine Treffer',
    present: 'Präsens', aorist: 'Vergangenheit', future: 'Zukunft',
    tapEx: 'tippen für Beispiel',
    examples: 'Beispiele:',
    accusative: 'Akkusativ:',
    plural: 'Plural:',
    digraphsH2: 'Digraphe & Aussprache',
    sound: 'Laut:',
    like: 'Wie:',
    fromLbl: 'Von', toLbl: 'Nach', swapTitle: 'Sprachen tauschen',
    filters: {
      all:'Alle', vowels:'Vokale', consonants:'Konsonanten', tricky:'Schwierig',
      allClasses:'Alle Klassen', irregular:'Unregelmäßig', regular:'Regelmäßig', contracted:'Kontrahiert', deponent:'Deponent',
      present:'Präsens', aorist:'Vergangenheit', future:'Zukunft',
      family:'Familie', places:'Orte', food:'Essen & Trinken', body:'Körper', things:'Dinge', nature:'Natur',
      work:'Arbeit & Schule', island:'Insel / Reisen', clothing:'Kleidung', household:'Haushalt', animals:'Tiere',
      garden:'Garten & Werkzeuge', kitchen:'Küche / Einkauf',
      allGenders:'Alle Geschlechter', m:'Maskulin', f:'Feminin', n:'Neutrum',
      quality:'Qualität', size:'Größe', color:'Farbe', feeling:'Gefühl', quantity:'Menge',
      numbers:'Zahlen', days:'Tage', months:'Monate', seasons:'Jahreszeiten', clock:'Uhrzeit', frequency:'Häufigkeit',
      weights:'Gewichte', timewords:'Zeitwörter',
      prefix:'Präfixe', verb:'Verbwurzeln', noun:'Nomenwurzeln', number:'Zahlen', bodyNature:'Körper / Natur', suffix:'Suffixe',
      survival:'Überleben', social:'Sozial', foodShop:'Essen / Laden', travel:'Reisen', opinions:'Meinungen', patterns:'Satzmuster'
    }
  },
  nl: {
    title: 'Flashcards',
    subtitle: 'Alfabet · Werkwoorden · Zelfstandige naamwoorden · Bijvoeglijke naamwoorden · Bijwoorden · Kalender · Wortels · Zinnen · Overig',
    searchPh: 'Zoeken…',
    tabs: {alphabet:'Alfabet',verbs:'Werkwoorden',nouns:'Zelfstandige nw.',adjectives:'Bijvoeglijke nw.',adverbs:'Bijwoorden',calendar:'Kalender',roots:'Wortels',phrases:'Zinnen',other:'Overig',tests:'Toetsen'},
    cardOf: (c,t) => `Kaart ${c} van ${t}`,
    flipHint: 'Klik of Spatie om te draaien',
    prev: '← Vorige', shuffle: 'Schudden', next: 'Volgende →',
    keyHint: '← → navigeren · Spatie draaien · S schudden',
    example: 'Voorbeeld',
    close: 'Sluiten',
    noMatch: 'Geen resultaten',
    present: 'Tegenwoordige tijd', aorist: 'Verleden tijd', future: 'Toekomende tijd',
    tapEx: 'tik voor voorbeeld',
    examples: 'Voorbeelden:',
    accusative: 'Accusatief:',
    plural: 'Meervoud:',
    digraphsH2: 'Digrafen en uitspraak',
    sound: 'Klank:',
    like: 'Zoals:',
    fromLbl: 'Van', toLbl: 'Naar', swapTitle: 'Talen wisselen',
    filters: {
      all:'Alles', vowels:'Klinkers', consonants:'Medeklinkers', tricky:'Moeilijk',
      allClasses:'Alle klassen', irregular:'Onregelmatig', regular:'Regelmatig', contracted:'Samentrekking', deponent:'Deponent',
      present:'Tegenwoordig', aorist:'Verleden', future:'Toekomst',
      family:'Familie', places:'Plaatsen', food:'Eten en drinken', body:'Lichaam', things:'Dingen', nature:'Natuur',
      work:'Werk en school', island:'Eiland / Reizen', clothing:'Kleding', household:'Huis', animals:'Dieren',
      garden:'Tuin en gereedschap', kitchen:'Keuken / Boodschappen',
      allGenders:'Alle geslachten', m:'Mannelijk', f:'Vrouwelijk', n:'Onzijdig',
      quality:'Kwaliteit', size:'Grootte', color:'Kleur', feeling:'Gevoel', quantity:'Hoeveelheid',
      numbers:'Getallen', days:'Dagen', months:'Maanden', seasons:'Seizoenen', clock:'Tijd', frequency:'Frequentie',
      weights:'Gewichten', timewords:'Tijdwoorden',
      prefix:'Voorvoegsels', verb:'Werkwoordwortels', noun:'Zelfstandige wortels', number:'Getallen', bodyNature:'Lichaam / natuur', suffix:'Achtervoegsels',
      survival:'Overleving', social:'Sociaal', foodShop:'Eten / winkel', travel:'Reizen', opinions:'Meningen', patterns:'Zinspatronen'
    }
  },
  pt: {
    title: 'Cartões',
    subtitle: 'Alfabeto · Verbos · Substantivos · Adjetivos · Advérbios · Calendário · Raízes · Frases · Outros',
    searchPh: 'Pesquisar…',
    tabs: {alphabet:'Alfabeto',verbs:'Verbos',nouns:'Substantivos',adjectives:'Adjetivos',adverbs:'Advérbios',calendar:'Calendário',roots:'Raízes',phrases:'Frases',other:'Outros',tests:'Testes'},
    cardOf: (c,t) => `Cartão ${c} de ${t}`,
    flipHint: 'Clique ou Espaço para virar',
    prev: '← Ant.', shuffle: 'Embaralhar', next: 'Próx. →',
    keyHint: '← → navegar · Espaço virar · S embaralhar',
    example: 'Exemplo',
    close: 'Fechar',
    noMatch: 'Nenhum resultado',
    present: 'Presente', aorist: 'Passado', future: 'Futuro',
    tapEx: 'toque para exemplo',
    examples: 'Exemplos:',
    accusative: 'Acusativo:',
    plural: 'Plural:',
    digraphsH2: 'Dígrafos e pronúncia',
    sound: 'Som:',
    like: 'Como:',
    fromLbl: 'De', toLbl: 'Para', swapTitle: 'Trocar idiomas',
    filters: {
      all:'Todos', vowels:'Vogais', consonants:'Consoantes', tricky:'Difíceis',
      allClasses:'Todas as classes', irregular:'Irregulares', regular:'Regulares', contracted:'Contraídos', deponent:'Deponentes',
      present:'Presente', aorist:'Passado', future:'Futuro',
      family:'Família', places:'Lugares', food:'Comida e bebida', body:'Corpo', things:'Coisas', nature:'Natureza',
      work:'Trabalho e escola', island:'Ilha / Viagem', clothing:'Roupas', household:'Casa', animals:'Animais',
      garden:'Jardim e ferramentas', kitchen:'Cozinha / Mercearia',
      allGenders:'Todos os géneros', m:'Masculino', f:'Feminino', n:'Neutro',
      quality:'Qualidade', size:'Tamanho', color:'Cor', feeling:'Sentimento', quantity:'Quantidade',
      numbers:'Números', days:'Dias', months:'Meses', seasons:'Estações', clock:'Hora', frequency:'Frequência',
      weights:'Pesos', timewords:'Palavras de tempo',
      prefix:'Prefixos', verb:'Raízes verbais', noun:'Raízes nominais', number:'Números', bodyNature:'Corpo / natureza', suffix:'Sufixos',
      survival:'Sobrevivência', social:'Social', foodShop:'Comida / loja', travel:'Viagem', opinions:'Opiniões', patterns:'Padrões de frase'
    }
  }
};

function t() { return UI[fromLang] || UI.en; }

function applyUILanguage() {
  const u = t();
  const titleEl = document.getElementById('appTitle');
  if (titleEl) titleEl.textContent = u.title;
  document.title = u.title + ' · ' + (LANG_NAMES[toLang]?.[fromLang] || toLang);
  const sub = document.getElementById('appSubtitle');
  if (sub) sub.textContent = u.subtitle;
  const si = document.getElementById('searchInput');
  if (si) si.placeholder = u.searchPh;
  document.querySelectorAll('.main-tab').forEach(btn => {
    const k = btn.dataset.main;
    if (u.tabs[k]) btn.textContent = u.tabs[k];
  });
  const fh = document.getElementById('flipHint');
  if (fh) fh.textContent = u.flipHint;
  const prev = document.getElementById('prevBtn');
  const sh = document.getElementById('shuffleBtn');
  const nx = document.getElementById('nextBtn');
  if (prev) prev.textContent = u.prev;
  if (sh) sh.textContent = u.shuffle;
  if (nx) nx.textContent = u.next;
  const kh = document.getElementById('keyboardHint');
  if (kh) kh.textContent = u.keyHint;
  const mh = document.querySelector('#exampleModal h3');
  if (mh) mh.textContent = u.example;
  const mc = document.getElementById('modalClose');
  if (mc) mc.textContent = u.close;
  const dh = document.getElementById('digraphsH2');
  if (dh) dh.textContent = u.digraphsH2;
  // Re-render digraphs if alphabet tab is active so note/title stay in UI language
  if (typeof mainMode !== 'undefined' && mainMode === 'alphabet' && typeof renderDigraphs === 'function') {
    renderDigraphs(toLang);
  }

  // labels for the language pair controls
  const fromLbl = document.querySelector('label[for="fromLang"]');
  const toLbl = document.querySelector('label[for="toLang"]');
  if (fromLbl) fromLbl.textContent = u.fromLbl || 'From';
  if (toLbl) toLbl.textContent = u.toLbl || 'To';
  const swapBtn = document.getElementById('langSwap');
  if (swapBtn) swapBtn.title = u.swapTitle || 'Swap';

  // filter buttons by data attributes
  const fmap = {
    'data-mode': {all:u.filters.all, vowels:u.filters.vowels, consonants:u.filters.consonants, tricky:u.filters.tricky},
    'data-vclass': {all:u.filters.allClasses, irregular:u.filters.irregular, regular:u.filters.regular, contracted:u.filters.contracted, deponent:u.filters.deponent},
    'data-vtense': {present:u.filters.present, aorist:u.filters.aorist, future:u.filters.future},
    'data-ncat': {all:u.filters.all, family:u.filters.family, places:u.filters.places, food:u.filters.food, body:u.filters.body, things:u.filters.things, nature:u.filters.nature, work:u.filters.work, island:u.filters.island, clothing:u.filters.clothing, household:u.filters.household, animals:u.filters.animals, garden:u.filters.garden, kitchen:u.filters.kitchen},
    'data-ngender': {all:u.filters.allGenders, m:u.filters.m, f:u.filters.f, n:u.filters.n},
    'data-acat': {all:u.filters.all, quality:u.filters.quality, size:u.filters.size, color:u.filters.color, feeling:u.filters.feeling, quantity:u.filters.quantity},
    'data-ccat': {all:u.filters.all, numbers:u.filters.numbers, days:u.filters.days, months:u.filters.months, seasons:u.filters.seasons, clock:u.filters.clock, frequency:u.filters.frequency, weights:u.filters.weights, timewords:u.filters.timewords},
    'data-rcat': {all:u.filters.all, prefix:u.filters.prefix, verb:u.filters.verb, noun:u.filters.noun, number:u.filters.number, body:u.filters.bodyNature, suffix:u.filters.suffix},
    'data-pcat': {all:u.filters.all, survival:u.filters.survival, social:u.filters.social, food:u.filters.foodShop, travel:u.filters.travel, opinions:u.filters.opinions, patterns:u.filters.patterns}
  };
  Object.keys(fmap).forEach(attr => {
    document.querySelectorAll(`[${attr}]`).forEach(btn => {
      const key = btn.getAttribute(attr);
      if (fmap[attr][key]) btn.textContent = fmap[attr][key];
    });
  });

  document.documentElement.lang = fromLang;
  updateLangSelects();
  updateCard();
}

function updateLangSelects() {
  const fromSel = document.getElementById('fromLang');
  const toSel = document.getElementById('toLang');
  if (!fromSel || !toSel) return;
  fromSel.value = fromLang;
  toSel.value = toLang;
  // Disable the language already chosen on the opposite side
  Array.from(fromSel.options).forEach(opt => { opt.disabled = (opt.value === toLang); });
  Array.from(toSel.options).forEach(opt => { opt.disabled = (opt.value === fromLang); });
}

function setLangPair(from, to) {
  if (from === to) return;
  fromLang = from;
  toLang = to;
  localStorage.setItem('fromLang', fromLang);
  localStorage.setItem('toLang', toLang);
  if (typeof rebuildSearchIndex === 'function') rebuildSearchIndex();
  // clear open search when pair changes
  if (typeof searchResults !== 'undefined' && searchResults) {
    searchResults.classList.remove('open');
    searchResults.innerHTML = '';
  }
  if (typeof searchInput !== 'undefined' && searchInput) searchInput.value = '';
  applyUILanguage();
  // Rebuild deck for new pair
  if (typeof setMainMode === 'function') setMainMode(mainMode || 'alphabet');
}


document.getElementById('fromLang').addEventListener('change', function() {
  const v = this.value;
  if (v === toLang) return;
  setLangPair(v, toLang);
});
document.getElementById('toLang').addEventListener('change', function() {
  const v = this.value;
  if (v === fromLang) return;
  setLangPair(fromLang, v);
});
document.getElementById('langSwap').addEventListener('click', function() {
  setLangPair(toLang, fromLang);
});

/* ========== VERSION & INTEGRITY ========== */
/* When releasing: run `python3 tools/seal.py` (hashes index.html + css + js with this constant stubbed to zeros). */
const APP_VERSION = '1.0.5 (27.08.2026.00)';
const INTEGRITY_PLACEHOLDER = '00000000000000000000000000000000';
const INTEGRITY_MD5 = '54ecf604142f4efb286afd79a90eb378';
const INTEGRITY_ASSETS = ['css/app.css', 'js/data.js', 'js/app.js', 'js/tests.js'];

/** Minimal MD5 (public-domain style) for integrity checks */
function md5(str) {
  function cmn(q, a, b, x, s, t) {
    a = (a + q + x + t) | 0;
    return (((a << s) | (a >>> (32 - s))) + b) | 0;
  }
  function ff(a, b, c, d, x, s, t) { return cmn((b & c) | (~b & d), a, b, x, s, t); }
  function gg(a, b, c, d, x, s, t) { return cmn((b & d) | (c & ~d), a, b, x, s, t); }
  function hh(a, b, c, d, x, s, t) { return cmn(b ^ c ^ d, a, b, x, s, t); }
  function ii(a, b, c, d, x, s, t) { return cmn(c ^ (b | ~d), a, b, x, s, t); }
  function toUtf8(s) {
    const out = [];
    for (let i = 0; i < s.length; i++) {
      let c = s.charCodeAt(i);
      if (c < 0x80) out.push(c);
      else if (c < 0x800) out.push(0xc0 | (c >> 6), 0x80 | (c & 0x3f));
      else if (c < 0xd800 || c >= 0xe000) out.push(0xe0 | (c >> 12), 0x80 | ((c >> 6) & 0x3f), 0x80 | (c & 0x3f));
      else {
        i++;
        c = 0x10000 + (((c & 0x3ff) << 10) | (s.charCodeAt(i) & 0x3ff));
        out.push(0xf0 | (c >> 18), 0x80 | ((c >> 12) & 0x3f), 0x80 | ((c >> 6) & 0x3f), 0x80 | (c & 0x3f));
      }
    }
    return out;
  }
  const bytes = toUtf8(str);
  const n = bytes.length;
  const words = [];
  for (let i = 0; i < n; i++) words[i >> 2] |= bytes[i] << ((i % 4) * 8);
  words[n >> 2] |= 0x80 << ((n % 4) * 8);
  const bitLen = n * 8;
  const lenPos = (((n + 8) >> 6) << 4) + 14;
  words[lenPos] = bitLen;
  words[lenPos + 1] = Math.floor(bitLen / 0x100000000) || 0;
  let a = 1732584193, b = -271733879, c = -1732584194, d = 271733878;
  for (let i = 0; i < words.length; i += 16) {
    const oa = a, ob = b, oc = c, od = d;
    const w = [];
    for (let j = 0; j < 16; j++) w[j] = words[i + j] | 0;
    a = ff(a, b, c, d, w[0], 7, -680876936); d = ff(d, a, b, c, w[1], 12, -389564586);
    c = ff(c, d, a, b, w[2], 17, 606105819); b = ff(b, c, d, a, w[3], 22, -1044525330);
    a = ff(a, b, c, d, w[4], 7, -176418897); d = ff(d, a, b, c, w[5], 12, 1200080426);
    c = ff(c, d, a, b, w[6], 17, -1473231341); b = ff(b, c, d, a, w[7], 22, -45705983);
    a = ff(a, b, c, d, w[8], 7, 1770035416); d = ff(d, a, b, c, w[9], 12, -1958414417);
    c = ff(c, d, a, b, w[10], 17, -42063); b = ff(b, c, d, a, w[11], 22, -1990404162);
    a = ff(a, b, c, d, w[12], 7, 1804603682); d = ff(d, a, b, c, w[13], 12, -40341101);
    c = ff(c, d, a, b, w[14], 17, -1502002290); b = ff(b, c, d, a, w[15], 22, 1236535329);
    a = gg(a, b, c, d, w[1], 5, -165796510); d = gg(d, a, b, c, w[6], 9, -1069501632);
    c = gg(c, d, a, b, w[11], 14, 643717713); b = gg(b, c, d, a, w[0], 20, -373897302);
    a = gg(a, b, c, d, w[5], 5, -701558691); d = gg(d, a, b, c, w[10], 9, 38016083);
    c = gg(c, d, a, b, w[15], 14, -660478335); b = gg(b, c, d, a, w[4], 20, -405537848);
    a = gg(a, b, c, d, w[9], 5, 568446438); d = gg(d, a, b, c, w[14], 9, -1019803690);
    c = gg(c, d, a, b, w[3], 14, -187363961); b = gg(b, c, d, a, w[8], 20, 1163531501);
    a = gg(a, b, c, d, w[13], 5, -1444681467); d = gg(d, a, b, c, w[2], 9, -51403784);
    c = gg(c, d, a, b, w[7], 14, 1735328473); b = gg(b, c, d, a, w[12], 20, -1926607734);
    a = hh(a, b, c, d, w[5], 4, -378558); d = hh(d, a, b, c, w[8], 11, -2022574463);
    c = hh(c, d, a, b, w[11], 16, 1839030562); b = hh(b, c, d, a, w[14], 23, -35309556);
    a = hh(a, b, c, d, w[1], 4, -1530992060); d = hh(d, a, b, c, w[4], 11, 1272893353);
    c = hh(c, d, a, b, w[7], 16, -155497632); b = hh(b, c, d, a, w[10], 23, -1094730640);
    a = hh(a, b, c, d, w[13], 4, 681279174); d = hh(d, a, b, c, w[0], 11, -358537222);
    c = hh(c, d, a, b, w[3], 16, -722521979); b = hh(b, c, d, a, w[6], 23, 76029189);
    a = hh(a, b, c, d, w[9], 4, -640364487); d = hh(d, a, b, c, w[12], 11, -421815835);
    c = hh(c, d, a, b, w[15], 16, 530742520); b = hh(b, c, d, a, w[2], 23, -995338651);
    a = ii(a, b, c, d, w[0], 6, -198630844); d = ii(d, a, b, c, w[7], 10, 1126891415);
    c = ii(c, d, a, b, w[14], 15, -1416354905); b = ii(b, c, d, a, w[5], 21, -57434055);
    a = ii(a, b, c, d, w[12], 6, 1700485571); d = ii(d, a, b, c, w[3], 10, -1894986606);
    c = ii(c, d, a, b, w[10], 15, -1051523); b = ii(b, c, d, a, w[1], 21, -2054922799);
    a = ii(a, b, c, d, w[8], 6, 1873313359); d = ii(d, a, b, c, w[15], 10, -30611744);
    c = ii(c, d, a, b, w[6], 15, -1560198380); b = ii(b, c, d, a, w[13], 21, 1309151649);
    a = ii(a, b, c, d, w[4], 6, -145523070); d = ii(d, a, b, c, w[11], 10, -1120210379);
    c = ii(c, d, a, b, w[2], 15, 718787259); b = ii(b, c, d, a, w[9], 21, -343485551);
    a = (a + oa) | 0; b = (b + ob) | 0; c = (c + oc) | 0; d = (d + od) | 0;
  }
  function hex(n) {
    let s = '';
    for (let i = 0; i < 4; i++) s += ((n >> (i * 8)) & 0xff).toString(16).padStart(2, '0');
    return s;
  }
  return hex(a) + hex(b) + hex(c) + hex(d);
}

function showIntegrityLock() {
  const repo = 'https://github.com/bradandersen/flashcards';
  document.body.innerHTML = '<div class="integrity-lock"><div class="integrity-lock-box">This file has been modified. Get the original from <a href="' + repo + '" target="_blank" rel="noopener">' + repo + '</a>.</div></div>';
}

function normalizeNewlines(text) {
  return String(text).replace(/\r\n/g, '\n').replace(/\r/g, '\n');
}

function normalizeForIntegrity(text) {
  return normalizeNewlines(text).replace(
    /const INTEGRITY_MD5\s*=\s*'[0-9a-fA-F]{32}'/,
    "const INTEGRITY_MD5 = '" + INTEGRITY_PLACEHOLDER + "'"
  );
}

async function verifyIntegrity() {
  if (!INTEGRITY_MD5 || INTEGRITY_MD5 === INTEGRITY_PLACEHOLDER) return true;
  try {
    const htmlRes = await fetch(location.href, { cache: 'no-store' });
    if (!htmlRes.ok) throw new Error('fetch failed');
    const parts = ['FILE:index.html\n' + await htmlRes.text()];
    for (const path of INTEGRITY_ASSETS) {
      const res = await fetch(new URL(path, location.href), { cache: 'no-store' });
      if (!res.ok) throw new Error('fetch failed ' + path);
      parts.push('FILE:' + path + '\n' + await res.text());
    }
    const digest = md5(normalizeForIntegrity(parts.join('\n')));
    if (digest !== INTEGRITY_MD5.toLowerCase()) {
      showIntegrityLock();
      return false;
    }
    return true;
  } catch (e) {
    try {
      const sig = [
        APP_VERSION,
        (typeof verbs !== 'undefined' ? verbs.length : 0),
        (typeof nouns !== 'undefined' ? nouns.length : 0),
        (typeof CORE_LANGS !== 'undefined' ? CORE_LANGS.join(',') : ''),
        (typeof alphabet !== 'undefined' ? alphabet.length : 0)
      ].join('|');
      console.info('Integrity: source fetch unavailable (' + (e && e.message) + '); running offline. sig=' + md5(sig).slice(0, 8));
      return true;
    } catch (e2) {
      return true;
    }
  }
}

(function placeVersion() {
  let el = document.getElementById('appVersion');
  if (!el) {
    el = document.createElement('div');
    el.id = 'appVersion';
    el.className = 'app-version';
    document.body.appendChild(el);
  }
  el.textContent = 'Version ' + APP_VERSION;
})();

setMainMode('alphabet');
applyUILanguage();
rebuildSearchIndex();
verifyIntegrity();
