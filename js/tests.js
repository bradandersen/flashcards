/* ========== TESTS + LOCAL PROGRESS ========== */
const TEST_STORE_KEY = 'fc-progress-v1';
const TEST_HISTORY_MAX = 40;
const TEST_TOPICS = ['mixed', 'verbs', 'nouns', 'kitchen', 'adjectives', 'adverbs', 'calendar', 'phrases', 'alphabet', 'roots', 'other'];

let testState = null;

function quizCopy() {
  return (t().quiz) || UI.en.quiz;
}

function topicLabel(id) {
  const q = quizCopy();
  if (id === 'mixed') return q.mixed;
  if (id === 'kitchen') return q.kitchen;
  return (t().tabs && t().tabs[id]) || id;
}

function loadProgress() {
  try {
    const raw = localStorage.getItem(TEST_STORE_KEY);
    const data = raw ? JSON.parse(raw) : null;
    if (data && Array.isArray(data.history)) return data;
  } catch (e) { /* ignore */ }
  return { history: [] };
}

function saveProgress(data) {
  localStorage.setItem(TEST_STORE_KEY, JSON.stringify(data));
}

function recordTest(entry) {
  const data = loadProgress();
  data.history.unshift(entry);
  data.history = data.history.slice(0, TEST_HISTORY_MAX);
  saveProgress(data);
}

function shuffleArr(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function cardPair(card, mode) {
  if (!card) return null;
  if (mode === 'alphabet') {
    const target = ((card.upper || '') + ' ' + (card.lower || '')).trim();
    const meaning = [card.name, card.sound].filter(Boolean).join(' · ');
    if (!target || !meaning) return null;
    return { target, meaning };
  }
  if (card.lemma && card.en) return { target: card.lemma, meaning: card.en };
  if (typeof card.greek === 'string' && card.en) return { target: card.greek, meaning: card.en };
  if (card.m && card.en) return { target: card.m, meaning: card.en };
  const L = (typeof coreLangOfPair === 'function' && coreLangOfPair()) || null;
  const wk = L && ((getCore(L) || {}).wordKey || L);
  if (wk && card[wk] && card.en) return { target: String(card[wk]), meaning: card.en };
  if (card.greek && typeof card.greek === 'object') {
    const g = card.greek.lemma || card.greek.greek || '';
    const c = card.core || card.es || card.it || {};
    const cw = c.lemma || (wk && c[wk]) || '';
    const en = card.en || card.greek.en || c.en || '';
    if (g && (cw || en)) return { target: g, meaning: cw || en };
  }
  return null;
}

function orientedPair(pair) {
  if (toLang === 'en') return { prompt: pair.meaning, answer: pair.target };
  if (fromLang === 'en') return { prompt: pair.target, answer: pair.meaning };
  if (toLang === 'el') return { prompt: pair.target, answer: pair.meaning };
  return { prompt: pair.meaning, answer: pair.target };
}

function buildQuestions(topic, count, style) {
  const cards = (typeof cardsForMode === 'function' ? cardsForMode(topic) : []).filter(Boolean);
  const items = [];
  const seen = new Set();
  cards.forEach(card => {
    const pair = cardPair(card, topic === 'kitchen' ? 'nouns' : topic);
    if (!pair) return;
    const q = orientedPair(pair);
    const key = q.prompt + '|' + q.answer;
    if (seen.has(key) || !q.prompt || !q.answer || q.prompt === q.answer) return;
    seen.add(key);
    items.push(q);
  });
  const minNeeded = style === 'choice' ? 4 : 1;
  if (items.length < minNeeded) return [];
  const picked = shuffleArr(items).slice(0, Math.min(count, items.length));
  return picked.map(item => {
    let choices = null;
    if (style === 'choice') {
      const pool = shuffleArr(items.filter(o => o.answer !== item.answer)).slice(0, 3)
        .map(o => o.answer);
      choices = shuffleArr([item.answer, ...pool]);
    }
    return { prompt: item.prompt, answer: item.answer, choices, chosen: null, typed: '', marked: false, ok: null };
  });
}

function normGuess(s) {
  return String(s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();
}

function answersMatch(guess, expected) {
  const g = normGuess(guess);
  if (!g) return false;
  const parts = String(expected).split(/[\/,;]/).map(p => normGuess(p)).filter(Boolean);
  parts.push(normGuess(expected));
  return parts.some(p => p === g || p.startsWith(g) || g.startsWith(p));
}

function showTestHub() {
  testState = null;
  const panel = document.getElementById('testPanel');
  if (!panel) return;
  const q = quizCopy();
  const data = loadProgress();
  const hist = data.history || [];
  const totalQ = hist.reduce((s, h) => s + (h.total || 0), 0);
  const totalC = hist.reduce((s, h) => s + (h.correct || 0), 0);
  const overall = totalQ ? Math.round((totalC / totalQ) * 100) : 0;
  const byTopic = {};
  hist.forEach(h => {
    const k = h.topic || 'mixed';
    if (!byTopic[k]) byTopic[k] = { correct: 0, total: 0 };
    byTopic[k].correct += h.correct || 0;
    byTopic[k].total += h.total || 0;
  });
  const topicOpts = TEST_TOPICS.map(id => `<option value="${id}">${escapeHtml(topicLabel(id))}</option>`).join('');
  const topicBars = Object.keys(byTopic).length
    ? Object.keys(byTopic).map(id => {
        const pct = Math.round((byTopic[id].correct / byTopic[id].total) * 100);
        return `<div class="test-bar-row"><span>${escapeHtml(topicLabel(id))}</span><div class="test-bar"><i style="width:${pct}%"></i></div><b>${pct}%</b></div>`;
      }).join('')
    : `<p class="test-muted">${escapeHtml(q.noHistory)}</p>`;
  const recent = hist.slice(0, 8).map(h => {
    const when = new Date(h.ts).toLocaleString();
    const pct = h.total ? Math.round((h.correct / h.total) * 100) : 0;
    return `<li><span>${escapeHtml(topicLabel(h.topic))} · ${h.style === 'typed' ? escapeHtml(q.typed) : escapeHtml(q.choice)}</span><span>${h.correct}/${h.total} (${pct}%) · ${escapeHtml(when)}</span></li>`;
  }).join('');
  panel.innerHTML = `
    <div class="test-card">
      <p class="test-intro">${escapeHtml(q.intro)}</p>
      <div class="test-setup">
        <label>${escapeHtml(q.topic)}
          <select id="testTopic">${topicOpts}</select>
        </label>
        <label>${escapeHtml(q.length)}
          <select id="testLength">
            <option value="10">10</option>
            <option value="20">20</option>
            <option value="30">30</option>
          </select>
        </label>
        <label>${escapeHtml(q.style)}
          <select id="testStyle">
            <option value="choice">${escapeHtml(q.choice)}</option>
            <option value="typed">${escapeHtml(q.typed)}</option>
          </select>
        </label>
      </div>
      <button type="button" class="btn btn-prev" id="testStart">${escapeHtml(q.start)}</button>
    </div>
    <div class="test-card">
      <h2>${escapeHtml(q.progress)}</h2>
      <div class="test-stats-row">
        <div><div class="test-stat">${hist.length}</div><div class="test-muted">${escapeHtml(q.testsTaken)}</div></div>
        <div><div class="test-stat">${overall}%</div><div class="test-muted">${escapeHtml(q.overall)}</div></div>
      </div>
      <h3>${escapeHtml(q.byTopic)}</h3>
      ${topicBars}
      ${recent ? `<ul class="test-history">${recent}</ul>` : ''}
      ${hist.length ? `<button type="button" class="btn btn-shuffle" id="testClear">${escapeHtml(q.clear)}</button>` : ''}
    </div>`;
  document.getElementById('testStart').addEventListener('click', startTest);
  const clearBtn = document.getElementById('testClear');
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      if (!confirm(q.clear + '?')) return;
      saveProgress({ history: [] });
      showTestHub();
    });
  }
}

function startTest() {
  const q = quizCopy();
  const topic = document.getElementById('testTopic').value;
  const length = parseInt(document.getElementById('testLength').value, 10) || 10;
  const style = document.getElementById('testStyle').value;
  const questions = buildQuestions(topic, length, style);
  if (!questions.length) {
    alert(q.empty);
    return;
  }
  testState = { topic, style, questions, index: 0 };
  renderQuestion();
}

function renderQuestion() {
  const q = quizCopy();
  const panel = document.getElementById('testPanel');
  const st = testState;
  const item = st.questions[st.index];
  const n = st.questions.length;
  const i = st.index + 1;
  const pct = Math.round((st.index / n) * 100);
  let body;
  if (st.style === 'choice') {
    body = `<div class="test-choices">${item.choices.map((c, idx) =>
      `<button type="button" class="test-choice" data-idx="${idx}"><span class="test-key">${idx + 1}</span>${escapeHtml(c)}</button>`
    ).join('')}</div>`;
  } else {
    body = `<form id="testTypeForm" class="test-type-form">
      <input type="text" id="testTyped" class="search-input" autocomplete="off" spellcheck="false" placeholder="${escapeHtml(q.typedPh)}">
      <button type="submit" class="btn btn-prev">${escapeHtml(q.check)}</button>
    </form>`;
  }
  panel.innerHTML = `
    <div class="test-card">
      <div class="test-qmeta">${escapeHtml(q.question(i, n))} · ${escapeHtml(topicLabel(st.topic))}</div>
      <div class="test-bar"><i style="width:${pct}%"></i></div>
      <div class="test-prompt">${escapeHtml(item.prompt)}</div>
      ${body}
      <div id="testFeedback" class="test-feedback hidden"></div>
      <div class="test-run-nav">
        <button type="button" class="btn btn-shuffle" id="testAbort">${escapeHtml(q.hub)}</button>
      </div>
    </div>`;
  document.getElementById('testAbort').addEventListener('click', showTestHub);
  if (st.style === 'choice') {
    panel.querySelectorAll('.test-choice').forEach(btn => {
      btn.addEventListener('click', () => gradeChoice(parseInt(btn.dataset.idx, 10)));
    });
  } else {
    const form = document.getElementById('testTypeForm');
    const input = document.getElementById('testTyped');
    form.addEventListener('submit', ev => {
      ev.preventDefault();
      gradeTyped(input.value);
    });
    setTimeout(() => input.focus(), 0);
  }
}

function gradeChoice(idx) {
  const st = testState;
  const item = st.questions[st.index];
  if (item.marked) return;
  item.chosen = item.choices[idx];
  item.ok = item.chosen === item.answer;
  item.marked = true;
  showFeedback(item);
}

function gradeTyped(value) {
  const st = testState;
  const item = st.questions[st.index];
  if (item.marked) return;
  item.typed = value;
  item.chosen = value;
  item.ok = answersMatch(value, item.answer);
  item.marked = true;
  showFeedback(item);
}

function showFeedback(item) {
  const q = quizCopy();
  const st = testState;
  const fb = document.getElementById('testFeedback');
  fb.classList.remove('hidden');
  fb.className = 'test-feedback ' + (item.ok ? 'ok' : 'bad');
  fb.innerHTML = item.ok
    ? `<strong>${escapeHtml(q.correct)}</strong>`
    : `<strong>${escapeHtml(q.incorrect)}</strong><div>${escapeHtml(q.expected)}: ${escapeHtml(item.answer)}</div>`;
  document.querySelectorAll('.test-choice').forEach(btn => {
    btn.disabled = true;
    if (btn.textContent.indexOf(item.answer) !== -1 && btn.querySelector('.test-key')) {
      /* mark by data */
    }
    const val = item.choices[parseInt(btn.dataset.idx, 10)];
    if (val === item.answer) btn.classList.add('is-correct');
    if (val === item.chosen && !item.ok) btn.classList.add('is-wrong');
  });
  const typed = document.getElementById('testTyped');
  if (typed) typed.disabled = true;
  const nav = document.querySelector('.test-run-nav');
  const last = st.index >= st.questions.length - 1;
  const next = document.createElement('button');
  next.type = 'button';
  next.className = 'btn btn-prev';
  next.textContent = last ? q.finish : q.nextQ;
  next.addEventListener('click', () => {
    if (last) finishTest();
    else {
      st.index += 1;
      renderQuestion();
    }
  });
  nav.appendChild(next);
  next.focus();
}

function finishTest() {
  const st = testState;
  const correct = st.questions.filter(x => x.ok).length;
  recordTest({
    ts: Date.now(),
    pair: fromLang + '-' + toLang,
    topic: st.topic,
    style: st.style,
    total: st.questions.length,
    correct
  });
  const q = quizCopy();
  const panel = document.getElementById('testPanel');
  const pct = Math.round((correct / st.questions.length) * 100);
  const misses = st.questions.filter(x => !x.ok);
  const missHtml = misses.length
    ? `<h3>${escapeHtml(q.missed)}</h3><ul class="test-misses">${misses.map(m =>
        `<li><b>${escapeHtml(m.prompt)}</b> → ${escapeHtml(m.answer)}${m.chosen ? ` <i>(${escapeHtml(String(m.chosen))})</i>` : ''}</li>`
      ).join('')}</ul>`
    : '';
  panel.innerHTML = `
    <div class="test-card test-results">
      <h2>${escapeHtml(q.results)}</h2>
      <div class="test-stat">${pct}%</div>
      <p>${escapeHtml(q.score(correct, st.questions.length))} · ${escapeHtml(topicLabel(st.topic))}</p>
      ${missHtml}
      <div class="test-run-nav">
        <button type="button" class="btn btn-prev" id="testAgain">${escapeHtml(q.again)}</button>
        <button type="button" class="btn btn-shuffle" id="testBack">${escapeHtml(q.hub)}</button>
      </div>
    </div>`;
  document.getElementById('testBack').addEventListener('click', showTestHub);
  document.getElementById('testAgain').addEventListener('click', () => {
    testState = { topic: st.topic, style: st.style, questions: buildQuestions(st.topic, st.questions.length, st.style), index: 0 };
    if (!testState.questions.length) showTestHub();
    else renderQuestion();
  });
}

document.addEventListener('keydown', e => {
  if (mainMode !== 'tests' || !testState) return;
  const item = testState.questions[testState.index];
  if (!item || item.marked) return;
  if (testState.style === 'choice' && e.key >= '1' && e.key <= '4') {
    const idx = parseInt(e.key, 10) - 1;
    if (item.choices && item.choices[idx] != null) {
      e.preventDefault();
      gradeChoice(idx);
    }
  }
});
