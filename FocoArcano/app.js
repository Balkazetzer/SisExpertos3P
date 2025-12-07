// app.js - integración con tarot_db.json, UI dinámica y motor de inferencia humanizado
document.addEventListener('DOMContentLoaded', async () => {

  // ============================================================
  // CARGA DE BASE DE DATOS
  // ============================================================
  let TAROT_DB = [];
  try {
    const resp = await fetch('tarot_db.json');
    if (!resp.ok) throw new Error('tarot_db.json no disponible (' + resp.status + ')');
    TAROT_DB = await resp.json();
  } catch (err) {
    console.error('Error cargando tarot_db.json:', err);
    alert('No se pudo cargar la base de datos de cartas. Revisa la consola.');
    TAROT_DB = [];
  }

  // Índices por ID y por palo
  const BY_ID = {};
  const BY_SUIT = {};
  TAROT_DB.forEach(card => {
    BY_ID[card.id] = card;
    const suit = card.suit || 'Sin palo';
    if (!BY_SUIT[suit]) BY_SUIT[suit] = [];
    BY_SUIT[suit].push(card);
  });

  // ============================================================
  // ELEMENTOS DEL DOM
  // ============================================================
  const pageHome = document.getElementById('page-home');
  const pageSelect = document.getElementById('page-select');
  const pageMeanings = document.getElementById('page-meanings');
  const pageAdd = document.getElementById('page-add');

  const selectNum = document.getElementById('select-numcards');
  const selectAmbito = document.getElementById('select-ambito');
  const btnStart = document.getElementById('btn-start');

  const cardsGrid = document.getElementById('cards-grid');
  const btnReset = document.getElementById('btn-reset');
  const btnInterpret = document.getElementById('btn-interpret');

  const meaningsGrid = document.getElementById('meanings-grid');
  const interpretBox = document.getElementById('interpret-box');
  const btnBackHome = document.getElementById('btn-back-home');
  const btnAddComments = document.getElementById('btn-add-comments');

  const textareaInterpret = document.getElementById('textarea-interpret');
  const btnCancelAdd = document.getElementById('btn-cancel-add');
  const btnSaveInterpret = document.getElementById('btn-save-interpret');

  // ============================================================
  // ESTADO
  // ============================================================
  let state = {
    numCards: Number(selectNum.value) || 3,
    ambito: selectAmbito.value || 'General',
    chosen: [],
    interpretacion: ''
  };

  function resetChosen() {
    state.chosen = Array(state.numCards).fill(null).map(()=>({ id: null, orientation: 'upright' }));
  }
  resetChosen();

  // ============================================================
  // NAVEGACIÓN
  // ============================================================
  function showPage(p) {
    [pageHome, pageSelect, pageMeanings, pageAdd].forEach(el => el.classList.add('hidden'));
    if (p === 'home') pageHome.classList.remove('hidden');
    if (p === 'select') pageSelect.classList.remove('hidden');
    if (p === 'meanings') pageMeanings.classList.remove('hidden');
    if (p === 'add') pageAdd.classList.remove('hidden');
  }

  // ============================================================
  // UTILIDAD PARA IMAGEN PLACEHOLDER
  // ============================================================
  function placeholderDataUrl(text) {
    const w = 420, h = 580;
    const bg = '#fff8df';
    const fg = '#0b2b4c';
    const escaped = text.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='${w}' height='${h}'>
      <rect width='100%' height='100%' fill='${bg}' rx='8' />
      <text x='50%' y='50%' font-family='Georgia, serif' font-size='22' fill='${fg}' text-anchor='middle' dominant-baseline='middle'>${escaped}</text>
    </svg>`;
    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  }

  // ============================================================
  // SELECTORES DE CARTA POR PALOS
  // ============================================================
  function makeCardSelect(selectedId) {
    const sel = document.createElement('select');
    sel.className = 'card-dropdown';

    const empty = document.createElement('option');
    empty.value = '';
    empty.textContent = '-- Menú de cartas --';
    sel.appendChild(empty);

    const ordered = [];
    if (BY_SUIT['Arcana mayor']) ordered.push('Arcana mayor');
    ['Bastos','Espadas','Oros','Copas'].forEach(s => { if (BY_SUIT[s]) ordered.push(s); });
    Object.keys(BY_SUIT).forEach(s => { if (!ordered.includes(s)) ordered.push(s); });

    ordered.forEach(suit => {
      const og = document.createElement('optgroup');
      og.label = suit;
      (BY_SUIT[suit]||[])
        .slice()
        .sort((a,b)=>a.name.localeCompare(b.name))
        .forEach(card => {
          const opt = document.createElement('option');
          opt.value = card.id;
          opt.textContent = card.name;
          if (card.id === selectedId) opt.selected = true;
          og.appendChild(opt);
        });
      sel.appendChild(og);
    });

    return sel;
  }

  // ============================================================
  // PÁGINA DE SELECCIÓN
  // ============================================================
  function renderSelect() {
    cardsGrid.innerHTML = '';
    for (let i=0; i<state.numCards; i++) {

      const slot = document.createElement('div');
      slot.className = 'card-slot';

      const chosen = state.chosen[i];

      // PREVIEW
      const preview = document.createElement('div');
      preview.className = 'card-preview';
      if (chosen && chosen.orientation === 'reversed') {
        preview.classList.add('inverted');
      }

      if (chosen && chosen.id) {
        const card = BY_ID[chosen.id];
        if (card) {
          const img = document.createElement('img');
          img.className = 'card-img';
          img.src = card.image ? card.image : `images/${card.id}.png`;
          img.alt = card.name;
          img.onerror = () => { img.src = placeholderDataUrl(card.name); };
          preview.appendChild(img);
        } else {
          preview.textContent = 'Carta no encontrada';
        }
      } else {
        preview.textContent = 'Imagen de la carta';
      }

      // ORIENTACIÓN
      const orient = document.createElement('div');
      orient.className = 'orientation-controls';

      const btnUp = document.createElement('button');
      btnUp.type='button';
      btnUp.textContent = '↑';

      const btnDown = document.createElement('button');
      btnDown.type='button';
      btnDown.textContent = '↓';

      btnUp.addEventListener('click', () => {
        state.chosen[i].orientation = 'upright';
        renderSelect();
      });

      btnDown.addEventListener('click', () => {
        state.chosen[i].orientation = 'reversed';
        renderSelect();
      });

      if (chosen && chosen.orientation === 'upright') btnUp.classList.add('active-orient');
      if (chosen && chosen.orientation === 'reversed') btnDown.classList.add('active-orient');

      orient.appendChild(btnUp);
      orient.appendChild(btnDown);

      // SELECTOR DE CARTAS
      const sel = makeCardSelect(chosen ? chosen.id : null);
      sel.addEventListener('change', e => {
        const val = e.target.value || null;
        state.chosen[i].id = val;
        renderSelect();
      });

      slot.appendChild(preview);
      slot.appendChild(orient);
      slot.appendChild(sel);
      cardsGrid.appendChild(slot);
    }
  }

  // ============================================================
  // MOTOR DE INFERENCIA HUMANIZADO (CON APRENDIZAJE MEJORADO)
  // ============================================================

function generateFriendlyInference(cardsData, feedbackWeights = {}, customWeights = {}) {
  const parts = [];

  // ================================
  // 1. Significados individuales
  // ================================
  const indiv = cardsData
    .map(c => `• ${c.name}: ${c.meaning}`)
    .join('\n');

  parts.push(`Significados de cada carta:\n${indiv}`);

  // ================================
  // 2. Análisis general
  // ================================

  const rulePatterns = {
    bloqueos:      ['bloqueo', 'resistencia', 'estancamiento', 'traba', 'límite'],
    impulsos:      ['impulso', 'impaciencia', 'prisa', 'arrebatado', 'acelerado'],
    chismes:       ['chisme', 'rumor', 'comentarios', 'ruido externo'],
    emociones:     ['emocional', 'sensibilidad', 'intenso', 'vulnerable', 'desborde'],
    introspeccion: ['reflexión', 'interior', 'introspección', 'buscar dentro'],
    inestabilidad: ['inestable', 'duda', 'cambio brusco', 'caos', 'volatilidad'],
    comienzos:     ['nuevo inicio', 'nacimiento', 'semilla', 'comenzar', 'arranque'],
    cierres:       ['fin', 'cierre', 'conclusión', 'culminación', 'ruptura'],
    crecimiento:   ['crecimiento', 'expansión', 'progreso', 'avance', 'oportunidad'],
    cautela:       ['cautela', 'advertencia', 'precaución', 'riesgo', 'alerta']
  };

  const ruleScores = {};

  for (const rule in rulePatterns) {
    ruleScores[rule] = (feedbackWeights[rule] ?? 1);

    const patterns = rulePatterns[rule];
    const present = cardsData.some(c =>
      patterns.some(p => c.meaning.toLowerCase().includes(p))
    );

    if (present) ruleScores[rule] += 1;
  }

  // ================================
  // Mapeo personalizado
  // ================================
  const customMap = {
    paciencia:     ['bloqueos', 'cautela'],
    calma:         ['bloqueos', 'emociones'],
    accion:        ['impulsos', 'crecimiento'],
    decision:      ['cautela', 'introspeccion'],
    cambio:        ['inestabilidad', 'crecimiento', 'comienzos'],
    cerrar:        ['cierres'],
    comenzar:      ['comienzos'],
    reflexion:     ['introspeccion']
  };

  for (const key in (customWeights || {})) {
    if (customMap[key]) {
      customMap[key].forEach(rule => {
        if (!ruleScores[rule]) ruleScores[rule] = 0;
        ruleScores[rule] += (customWeights[key] || 0) * 0.5;
      });
    }
  }

  // ================================
  // Generación análisis
  // ================================
  const analysis = [];

  if (ruleScores.bloqueos > 1)
    analysis.push('Se notan algunas resistencias o factores que podrían estar frenando tu avance.');

  if (ruleScores.impulsos > 1)
    analysis.push('Hay una tendencia a actuar con prisa o dejarse llevar por impulsos.');

  if (ruleScores.chismes > 1)
    analysis.push('Parece haber ruido externo o comentarios que podrían influir de más.');

  if (ruleScores.emociones > 1)
    analysis.push('Las emociones están jugando un papel importante y podrían estar más intensas de lo habitual.');

  if (ruleScores.introspeccion > 1)
    analysis.push('Se sugiere hacer una pausa y mirar hacia dentro para aclarar tu perspectiva.');

  if (ruleScores.inestabilidad > 1)
    analysis.push('La lectura muestra cierta inestabilidad o cambios bruscos en tu entorno.');

  if (ruleScores.comienzos > 1)
    analysis.push('Se percibe una energía de nuevos comienzos o aperturas importantes.');

  if (ruleScores.cierres > 1)
    analysis.push('Hay señales de cierre o culminación de una etapa.');

  if (ruleScores.crecimiento > 1)
    analysis.push('La lectura señala oportunidades de crecimiento y expansión.');

  if (ruleScores.cautela > 1)
    analysis.push('Conviene actuar con cuidado y evaluar bien los próximos pasos.');

  const analysisText = analysis.length
    ? analysis.join(' ')
    : 'La lectura no muestra tensiones fuertes. El panorama es estable.';

  parts.push(`Lo que muestran las cartas:\n${analysisText}`);

  // ================================
  // 3. Consejo final (corregido)
  // ================================
  let consejo = 'Tómate un momento para observar la situación antes de actuar. Avanza solo cuando sientas claridad.';

  const bloqueos = ruleScores.bloqueos || 0;
  const impulsos = ruleScores.impulsos || 0;
  const chismes  = ruleScores.chismes || 0;

  if (bloqueos > impulsos)
    consejo = 'Antes de tomar decisiones importantes, detente un momento y evalúa qué te está presionando. No tienes que resolver todo de inmediato.';

  if (bloqueos > 0 && chismes > 0)
    consejo = 'No tomes decisiones basadas en opiniones externas. Revisa tus propios límites y decide desde tu estabilidad.';

  if (impulsos > bloqueos)
    consejo = 'Tu energía es alta, pero asegúrate de no correr sin dirección. Un poco de calma te ayudará a elegir mejor.';

  if ((customWeights?.paciencia || 0) > 2) consejo += ' Recuerda que la paciencia es clave aquí.';
  if ((customWeights?.accion || 0) > 2)    consejo += ' Es momento de actuar con determinación.';

  parts.push(`Consejo:\n${consejo}`);

  return parts.join('\n\n');
}

  // ============================================================
  // GENERACIÓN DE INTERPRETACIÓN AUTOMÁTICA
  // ============================================================
  function generateAutoInterpretation() {
    const cards = state.chosen
      .slice(0, state.numCards)
      .filter(c => c && c.id)
      .map(c => ({...c, meta: BY_ID[c.id]}));

    if (!cards.length) return 'No hay cartas seleccionadas para generar interpretación.';

    const amb = state.ambito || 'General';

    const data = cards.map(c => {
      const orient = c.orientation === 'reversed' ? 'reversed' : 'upright';
      const card = c.meta;

      let meaningText = '';
      if (card.meanings && card.meanings[amb]) {
        const val = card.meanings[amb];
        meaningText = (typeof val === 'string') ? val : (val[orient] || '');
      }

      return {
        name: card.name,
        meaning: meaningText || 'Sin significado disponible'
      };
    });

    // Obtener pesos aprendidos (feedback histórico + comentarios)
    const feedbackWeights = JSON.parse(localStorage.getItem('feedbackHistory') || '{}');
    const customWeights = JSON.parse(localStorage.getItem('customKeywords') || '{}');
    const weights = {};
    Object.keys(feedbackWeights).forEach(rule => {
      const total = feedbackWeights[rule].useful + feedbackWeights[rule]['not-useful'];
      weights[rule] = total > 0 ? feedbackWeights[rule].useful / total : 1;
    });

    return generateFriendlyInference(data, weights, customWeights);
  }

  // ============================================================
  // PÁGINA DE SIGNIFICADOS
  // ============================================================
  function renderMeanings() {
    meaningsGrid.innerHTML = '';
    const ambito = state.ambito || 'General';

    const computed = state.chosen.slice(0, state.numCards).map(c => {
      if (!c || !c.id) return null;
      const card = BY_ID[c.id];
      if (!card) return null;

      let meaningText = '';
      if (card.meanings && card.meanings[ambito]) {
        const val = card.meanings[ambito];
        meaningText = (typeof val === 'string') ? val : (val[c.orientation === 'reversed' ? 'reversed' : 'upright'] || '');
      }

      return {
        id: card.id,
        name: card.name,
        suit: card.suit,
        orientation: c.orientation,
        ambito,
        meaning: meaningText,
        image: card.image || `images/${card.id}.png`
      };
    });

    computed.forEach(cm => {
      const el = document.createElement('div');
      el.className = 'meaning-card';

      if (!cm) {
        el.textContent = 'Sin carta seleccionada';
      } else {

        const imgWrap = document.createElement('div');
        imgWrap.className = 'meaning-card-preview';
        if (cm.orientation === 'reversed') {
          imgWrap.classList.add('inverted');
        }

        const img = document.createElement('img');
        img.src = cm.image;
        img.alt = cm.name;
        img.onerror = () => { img.src = placeholderDataUrl(cm.name); };
        imgWrap.appendChild(img);

        const title = document.createElement('div');
        title.style.fontWeight = '600';
        title.textContent = cm.name;

        const meta1 = document.createElement('div');
        meta1.textContent = 'Ámbito: ' + cm.ambito;

        const meta2 = document.createElement('div');
        meta2.textContent = 'Orientación: ' + (cm.orientation === 'reversed' ? 'Al revés' : 'Al derecho');

        const meaning = document.createElement('div');
        meaning.style.marginTop = '10px';
        meaning.textContent = cm.meaning;

        el.appendChild(imgWrap);
        el.appendChild(title);
        el.appendChild(meta1);
        el.appendChild(meta2);
        el.appendChild(meaning);
      }

      meaningsGrid.appendChild(el);
    });

    interpretBox.textContent =
      state.interpretacion && state.interpretacion.trim().length
        ? state.interpretacion
        : generateAutoInterpretation();

    // Agregar botones de feedback
    const feedbackDiv = document.createElement('div');
    feedbackDiv.className = 'feedback-buttons';
    feedbackDiv.innerHTML = `
      <button id="btn-useful" class="btn-feedback">Útil</button>
      <button id="btn-not-useful" class="btn-feedback">No útil</button>
    `;
    interpretBox.parentNode.insertBefore(feedbackDiv, interpretBox.nextSibling);

    // Eventos para feedback
    document.getElementById('btn-useful').addEventListener('click', () => addFeedback('useful'));
    document.getElementById('btn-not-useful').addEventListener('click', () => addFeedback('not-useful'));
  }

  // Nueva función para feedback (mejorada)
  function addFeedback(rating) {
    const history = JSON.parse(localStorage.getItem('feedbackHistory') || '{}');
    const customKeywords = JSON.parse(localStorage.getItem('customKeywords') || '{}');

    // Actualizar contadores por regla
    const rules = ['bloqueos', 'impulsos', 'chismes'];
    rules.forEach(rule => {
      if (!history[rule]) history[rule] = { useful: 0, 'not-useful': 0 };
      history[rule][rating]++;
    });

    // Integrar análisis de la interpretación actual (si es personalizada)
    const currentInterpret = state.interpretacion || generateAutoInterpretation();
    if (state.interpretacion && state.interpretacion.trim()) { // Solo si es personalizada
      const keywords = currentInterpret.toLowerCase().match(/\b(paciencia|calma|acción|espera|decisión)\b/g) || [];
      keywords.forEach(k => {
        if (!customKeywords[k]) customKeywords[k] = { useful: 0, 'not-useful': 0 };
        customKeywords[k][rating]++;
      });
    }

    localStorage.setItem('feedbackHistory', JSON.stringify(history));
    localStorage.setItem('customKeywords', JSON.stringify(customKeywords));
    alert('Gracias por tu feedback. El sistema aprenderá de esto.');
  }

  // ============================================================
  // GUARDAR LECTURA (mejorado)
  // ============================================================
  function saveReading() {
    const tags = state.chosen.slice(0, state.numCards).filter(c => c && c.id).map(c => {
      const card = BY_ID[c.id];
      return { carta: card ? card.name : c.id, ambito: state.ambito, orientacion: c.orientation };
    });

    const reading = {
      timestamp: Date.now(),
      numCards: state.numCards,
      ambito: state.ambito,
      chosen: state.chosen.slice(0,state.numCards),
      tags,
      interpretacion: state.interpretacion || generateAutoInterpretation()
    };

    const existing = JSON.parse(localStorage.getItem('focoArcano_savedReadings') || '[]');
    existing.unshift(reading);
    localStorage.setItem('focoArcano_savedReadings', JSON.stringify(existing));

    // Aprender de interpretaciones personalizadas (mantener y refinar)
    const customText = state.interpretacion || '';
    const keywords = customText.toLowerCase().match(/\b(paciencia|calma|acción|espera|decisión)\b/g) || [];
    const customKeywords = JSON.parse(localStorage.getItem('customKeywords') || '{}');
    keywords.forEach(k => {
      if (!customKeywords[k]) customKeywords[k] = { useful: 0, 'not-useful': 0 };
      customKeywords[k].useful++; // Asumir útil por defecto al guardar, pero se ajusta con feedback
    });
    localStorage.setItem('customKeywords', JSON.stringify(customKeywords));
  }

  // ============================================================
  // EVENTOS DE UI
  // ============================================================
  btnStart.addEventListener('click', () => {
    state.numCards = Number(selectNum.value) || 3;
    state.ambito = selectAmbito.value || 'General';
    resetChosen();
    renderSelect();
    showPage('select');
  });

  btnReset.addEventListener('click', () => {
    state = { numCards: 3, ambito: 'General', chosen: [], interpretacion: '' };
    selectNum.value = '3';
    selectAmbito.value = 'General';
    resetChosen();
    textareaInterpret.value = '';
    showPage('home');
  });

  btnInterpret.addEventListener('click', () => {
    state.ambito = selectAmbito.value || 'General';
    renderMeanings();
    showPage('meanings');
  });

  btnBackHome.addEventListener('click', () => {
    state = { numCards: 3, ambito: 'General', chosen: [], interpretacion: '' };
    selectNum.value = '3';
    selectAmbito.value = 'General';
    resetChosen();
    textareaInterpret.value = '';
    showPage('home');
  });

  btnAddComments.addEventListener('click', () => {
    textareaInterpret.value = state.interpretacion || '';
    showPage('add');
  });

  btnCancelAdd.addEventListener('click', () => {
    state = { numCards: 3, ambito: 'General', chosen: [], interpretacion: '' };
    selectNum.value = '3';
    selectAmbito.value = 'General';
    resetChosen();
    textareaInterpret.value = '';
    showPage('home');
  });

  btnSaveInterpret.addEventListener('click', () => {
    state.interpretacion = textareaInterpret.value.trim();
    saveReading();
    state = { numCards: 3, ambito: 'General', chosen: [], interpretacion: '' };
    selectNum.value = '3';
    selectAmbito.value = 'General';
    resetChosen();
    textareaInterpret.value = '';
    showPage('home');
    alert('Lectura guardada en localStorage');
  });

  // Inicial
  showPage('home');
});
