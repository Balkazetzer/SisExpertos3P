// app.js
// Implementa la lógica de las 4 páginas, guardado en localStorage y la base mínima de cartas
document.addEventListener('DOMContentLoaded', ()=>{

  // --- Datos (expandir el mazo según necesites) ---
  const TAROT_DB = [
    { id: '0-the-fool', name: 'El Loco', suit: 'Arcana mayor', meanings: {
      'General':'Comienzo, libertad, riesgo.',
      'Amoroso':'Nueva etapa en el amor, ligereza.',
      'Laboral':'Idea nueva, proyecto incierto.',
      'Sentimental':'Inocencia emocional.',
      'Consejo de actuar':'Arriésgate con precaución.'
    }},
    { id: '1-magician', name: 'El Mago', suit: 'Arcana mayor', meanings: {
      'General':'Habilidad, recursos, poder personal.',
      'Amoroso':'Magnetismo y atracción.',
      'Laboral':'Capacidad para ejecutar proyectos.',
      'Sentimental':'Toma la iniciativa emocional.',
      'Consejo de actuar':'Usa tus recursos.'
    }},
    { id: 'espada-ace', name: 'As de Espadas', suit: 'Espadas', meanings: {
      'General':'Claridad mental, verdad.',
      'Amoroso':'Comunicación directa.',
      'Laboral':'Decisiones, claridad en el trabajo.',
      'Sentimental':'Cortar confusiones.',
      'Consejo de actuar':'Habla con franqueza.'
    }},
    { id: 'copa-ace', name: 'As de Copas', suit: 'Copas', meanings: {
      'General':'Emoción, nuevos sentimientos.',
      'Amoroso':'Nueva relación o renovación afectiva.',
      'Laboral':'Satisfacción emocional en el trabajo.',
      'Sentimental':'Conexión profunda.',
      'Consejo de actuar':'Ábrete al sentir.'
    }},
    { id: 'oro-ace', name: 'As de Oros', suit: 'Oros', meanings: {
      'General':'Prosperidad, oportunidad material.',
      'Amoroso':'Estabilidad práctica en la relación.',
      'Laboral':'Buena oportunidad económica.',
      'Sentimental':'Valor práctico al vínculo.',
      'Consejo de actuar':'Aprovecha la oferta.'
    }},
    { id: 'basto-ace', name: 'As de Bastos', suit: 'Bastos', meanings: {
      'General':'Energía, iniciativa.',
      'Amoroso':'Pasión y movimiento.',
      'Laboral':'Impulso creativo.',
      'Sentimental':'Motivación para actuar.',
      'Consejo de actuar':'Empieza ahora.'
    }},
  ];

  const AMBITOS = ['General','Amoroso','Laboral','Sentimental','Consejo de actuar'];

  // --- Elementos DOM ---
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

  // --- Estado local ---
  let state = {
    numCards: Number(selectNum.value),
    ambito: selectAmbito.value,
    chosen: [], // array de { id, orientation }
    interpretacion: ''
  };

  // Inicializar chosen con vacíos
  function resetChosen(){
    state.chosen = Array(state.numCards).fill(null).map(()=>({ id: null, orientation: 'upright' }));
  }
  resetChosen();

  // --- Navegación ---
  function showPage(p){
    pageHome.classList.add('hidden');
    pageSelect.classList.add('hidden');
    pageMeanings.classList.add('hidden');
    pageAdd.classList.add('hidden');
    if(p==='home') pageHome.classList.remove('hidden');
    if(p==='select') pageSelect.classList.remove('hidden');
    if(p==='meanings') pageMeanings.classList.remove('hidden');
    if(p==='add') pageAdd.classList.remove('hidden');
  }

  // --- Render: página de selección (page 2) ---
  function renderSelect(){
    cardsGrid.innerHTML = '';
    for(let i=0;i<state.numCards;i++){
      const slot = document.createElement('div');
      slot.className = 'card-slot';

      // preview
      const preview = document.createElement('div');
      preview.className = 'card-preview';
      if(state.chosen[i] && state.chosen[i].id){
        const img = document.createElement('img');
        img.src = `images/${state.chosen[i].id}.png`;
        img.alt = state.chosen[i].id;
        if(state.chosen[i].orientation === 'reversed'){
          img.style.transform = 'rotate(180deg)';
        }
        preview.appendChild(img);
      } else {
        preview.textContent = 'Imagen de la carta';
      }

      // orientation buttons
      const orient = document.createElement('div');
      orient.className = 'orientation-controls';
      const btnUp = document.createElement('button');
      btnUp.textContent = '↑';
      const btnDown = document.createElement('button');
      btnDown.textContent = '↓';

      btnUp.addEventListener('click', ()=> {
        state.chosen[i].orientation = 'upright';
        renderSelect();
      });
      btnDown.addEventListener('click', ()=> {
        state.chosen[i].orientation = 'reversed';
        renderSelect();
      });

      // highlight selection
      if(state.chosen[i].orientation === 'upright'){
        btnUp.style.background = '#f8eab2';
      } else {
        btnDown.style.background = '#f8eab2';
      }

      orient.appendChild(btnUp);
      orient.appendChild(btnDown);

      // dropdown
      const sel = document.createElement('select');
      sel.className = 'card-dropdown';
      const emptyOpt = document.createElement('option');
      emptyOpt.value = '';
      emptyOpt.textContent = '-- Menú de cartas --';
      sel.appendChild(emptyOpt);

      function addGroup(label, items){
        const og = document.createElement('optgroup');
        og.label = label;
        items.forEach(c=>{
          const opt = document.createElement('option');
          opt.value = c.id;
          opt.textContent = c.name;
          if(state.chosen[i] && state.chosen[i].id === c.id) opt.selected = true;
          og.appendChild(opt);
        });
        sel.appendChild(og);
      }

      addGroup('Arcana mayor', TAROT_DB.filter(c=>c.suit==='Arcana mayor'));
      addGroup('Espadas', TAROT_DB.filter(c=>c.suit==='Espadas'));
      addGroup('Oros', TAROT_DB.filter(c=>c.suit==='Oros'));
      addGroup('Bastos', TAROT_DB.filter(c=>c.suit==='Bastos'));
      addGroup('Copas', TAROT_DB.filter(c=>c.suit==='Copas'));

      sel.addEventListener('change', (e)=>{
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

  // --- Render: significados (page 3) ---
  function renderMeanings(){
    meaningsGrid.innerHTML = '';
    const computed = state.chosen.slice(0,state.numCards).map(c=>{
      if(!c || !c.id) return null;
      const card = TAROT_DB.find(x=>x.id === c.id);
      if(!card) return null;
      const meaning = card.meanings[state.ambito] || '';
      return {
        id: card.id,
        name: card.name,
        suit: card.suit,
        orientation: c.orientation,
        ambito: state.ambito,
        meaning
      };
    });

    computed.forEach(cm=>{
      const cardEl = document.createElement('div');
      cardEl.className = 'meaning-card';
      if(!cm){
        cardEl.textContent = 'Sin carta seleccionada';
      } else {
        const title = document.createElement('div');
        title.style.fontWeight = '600';
        title.textContent = cm.name;
        const meta1 = document.createElement('div'); meta1.textContent = 'Ámbito: ' + cm.ambito;
        const meta2 = document.createElement('div'); meta2.textContent = 'Orientación: ' + (cm.orientation === 'reversed' ? 'Al revés' : 'Al derecho');
        const meaning = document.createElement('div'); meaning.style.marginTop = '10px'; meaning.textContent = cm.meaning;
        cardEl.appendChild(title);
        cardEl.appendChild(meta1);
        cardEl.appendChild(meta2);
        cardEl.appendChild(meaning);
      }
      meaningsGrid.appendChild(cardEl);
    });

    interpretBox.textContent = state.interpretacion || 'Posible interpretación del conjunto';
  }

  // --- Guardar lectura ---
  function saveReading(){
    const tags = state.chosen.slice(0,state.numCards).filter(c=>c && c.id).map(c=>{
      const card = TAROT_DB.find(x=>x.id === c.id);
      return { carta: card ? card.name : c.id, ambito: state.ambito, orientacion: c.orientation };
    });
    const reading = {
      timestamp: Date.now(),
      numCards: state.numCards,
      ambito: state.ambito,
      chosen: state.chosen.slice(0,state.numCards),
      tags,
      interpretacion: state.interpretacion
    };
    const existing = JSON.parse(localStorage.getItem('focoArcano_savedReadings') || '[]');
    existing.unshift(reading);
    localStorage.setItem('focoArcano_savedReadings', JSON.stringify(existing));
  }

  // --- Eventos UI ---
  btnStart.addEventListener('click', ()=>{
    state.numCards = Number(selectNum.value);
    state.ambito = selectAmbito.value;
    resetChosen(); // ajusta number cards
    showPage('select');
    renderSelect();
  });

  btnReset.addEventListener('click', ()=>{
    // borrar estado actual y volver al inicio
    state = { numCards:3, ambito:'General', chosen:[], interpretacion: '' };
    selectNum.value = '3';
    selectAmbito.value = 'General';
    resetChosen();
    textareaInterpret.value = '';
    showPage('home');
  });

  btnInterpret.addEventListener('click', ()=>{
    // pasar a significados
    state.ambito = selectAmbito.value;
    renderMeanings();
    showPage('meanings');
  });

  btnBackHome.addEventListener('click', ()=>{
    // limpiar y volver
    state = { numCards:3, ambito:'General', chosen:[], interpretacion: '' };
    selectNum.value = '3';
    selectAmbito.value = 'General';
    resetChosen();
    textareaInterpret.value = '';
    showPage('home');
  });

  btnAddComments.addEventListener('click', ()=>{
    textareaInterpret.value = state.interpretacion || '';
    showPage('add');
  });

  btnCancelAdd.addEventListener('click', ()=>{
    // ir al inicio manteniendo lo que había (igual que "volver al inicio" en mockup)
    state = { numCards:3, ambito:'General', chosen:[], interpretacion: '' };
    selectNum.value = '3';
    selectAmbito.value = 'General';
    resetChosen();
    textareaInterpret.value = '';
    showPage('home');
  });

  btnSaveInterpret.addEventListener('click', ()=>{
    state.interpretacion = textareaInterpret.value.trim();
    // guardar lectura
    saveReading();
    // reset y volver al inicio
    state = { numCards:3, ambito:'General', chosen:[], interpretacion: '' };
    selectNum.value = '3';
    selectAmbito.value = 'General';
    resetChosen();
    textareaInterpret.value = '';
    showPage('home');
    alert('Lectura guardada en localStorage');
  });

  // Inicialmente mostrar home
  showPage('home');

});
