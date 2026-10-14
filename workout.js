(() => {
  const catalog = [
    ['agachamento','Agachamento livre','Perna'],['leg','Leg press','Perna'],['extensora','Cadeira extensora','Perna'],['flexora','Cadeira flexora','Perna'],['panturrilha','Panturrilha','Perna'],
    ['bulgaro','Búlgaro','Perna'],['stiff','Stiff','Perna'],['mesa-flexora','Mesa flexora','Perna'],['smith','Agachamento Smith','Perna'],['adutora','Cadeira adutora','Perna'],['hack','Agachamento hack','Perna'],['agachamento-45','Agachamento 45°','Perna'],['sumo','Agachamento sumô','Perna'],
    ['rosca','Rosca direta','Braço'],['martelo','Rosca martelo','Braço'],['triceps','Tríceps na polia','Braço'],
    ['rosca-45','Rosca 45°','Braço'],['scott','Rosca Scott','Braço'],['testa','Tríceps testa','Braço'],['frances','Tríceps francês','Braço'],
    ['supino','Supino reto','Peito'],['voador','Voador peito','Peito'],['inclinado','Supino inclinado','Peito'],
    ['puxada','Puxada na frente','Costas'],['remada','Remada sentada','Costas'],['unilateral','Remada serrote','Costas'],['curvada','Remada curvada','Costas'],
    ['elevacao','Elevação lateral','Ombro'],['desenvolvimento','Desenvolvimento de ombro','Ombro'],['frontal','Elevação frontal','Ombro'],['inverso','Voador inverso','Ombro']
  ].map(([id,name,group]) => ({id,name,group}));
  const icons = {Perna:'↟',Braço:'↗',Peito:'◈',Costas:'≋',Ombro:'↔'};
  const key = 'pulse-workout-v1';
  const root = document.querySelector('#workout-root');
  const title = document.querySelector('#app-title');
  let state = {phase:'builder',selected:[],weight:'',started:null,ended:null,sets:{}};
  let filter = 'Todos';
  let notice = '';
  let drag = null;
  const picker = document.createElement('dialog');
  picker.className = 'value-picker';
  picker.setAttribute('aria-labelledby','picker-title');
  document.body.append(picker);
  let pickerTrigger = null;
  function selector(name,label,value){
    return `<div class="series-field"><span>${label}</span><input type="hidden" name="${name}" value="${value}"><button type="button" class="value-trigger" data-picker="${name}" aria-haspopup="dialog" aria-label="${label}: ${value}${name==='kg'?' kg':''}"><strong>${value}${name==='kg'?' kg':''}</strong><span aria-hidden="true">⌄</span></button></div>`;
  }
  function openPicker(trigger){
    pickerTrigger=trigger;
    const name=trigger.dataset.picker,current=Number(trigger.closest('.series-field').querySelector('input').value);
    const values=Array.from({length:name==='reps'?20:101},(_,i)=>name==='reps'?i+1:i*5);
    picker.innerHTML=`<div class="picker-header"><h2 id="picker-title">${name==='reps'?'Repetições':'Peso total (kg)'}</h2><button type="button" data-picker-close aria-label="Fechar seleção">×</button></div><p>${name==='reps'?'Escolha de 1 a 20 repetições.':'De 0 a 500 kg, em passos de 5 kg.'}</p><div class="picker-options" role="group" aria-label="${name==='reps'?'Repetições':'Peso em kg'}">${values.map(value=>`<button type="button" data-value="${value}" aria-pressed="${value===current}">${value}${name==='kg'?' kg':''}</button>`).join('')}</div>`;
    picker.showModal();
    const selected=picker.querySelector(`[data-value="${current}"]`)||picker.querySelector('[data-value]');
    selected.focus();selected.scrollIntoView({block:'nearest'});
  }
  picker.addEventListener('click',event=>{
    const button=event.target.closest('button');if(!button)return;
    if(button.hasAttribute('data-picker-close'))picker.close();
    if(button.hasAttribute('data-value')){
      const value=Number(button.dataset.value),name=pickerTrigger.dataset.picker;
      pickerTrigger.closest('.series-field').querySelector('input').value=String(value);
      pickerTrigger.querySelector('strong').textContent=`${value}${name==='kg'?' kg':''}`;
      pickerTrigger.setAttribute('aria-label',`${name==='kg'?'Peso total (kg)':'Repetições'}: ${value}${name==='kg'?' kg':''}`);
      picker.close();
    }
  });
  picker.addEventListener('close',()=>pickerTrigger?.focus());
  picker.addEventListener('keydown',event=>{
    const buttons=[...picker.querySelectorAll('[data-value]')],index=buttons.indexOf(document.activeElement);
    if(index<0)return;
    const columns=getComputedStyle(picker.querySelector('.picker-options')).gridTemplateColumns.split(' ').length;
    const offset={ArrowRight:1,ArrowLeft:-1,ArrowDown:columns,ArrowUp:-columns}[event.key];
    let next=event.key==='Home'?0:event.key==='End'?buttons.length-1:offset===undefined?null:index+offset;
    if(next!==null){event.preventDefault();buttons[Math.max(0,Math.min(buttons.length-1,next))].focus();}
  });
  const escape = value => String(value).replace(/[&<>"']/g,c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  try {
    const saved = JSON.parse(localStorage.getItem(key));
    if(saved && ['builder','active','summary'].includes(saved.phase) && Array.isArray(saved.selected) && saved.sets && typeof saved.sets==='object') {
      state={...state,...saved,selected:[...new Set(saved.selected.filter(id=>catalog.some(e=>e.id===id)))]};
      for(const id of state.selected) state.sets[id] = Array.isArray(state.sets[id]) ? state.sets[id].filter(s=>Number.isInteger(s.reps)&&s.reps>0&&Number.isFinite(s.kg)&&s.kg>=0) : [];
      if(state.phase!=='builder' && (!state.selected.length || !Number.isFinite(state.started))) state.phase='builder';
      if(state.phase==='summary' && !Number.isFinite(state.ended)) state.phase='active';
    }
  } catch { notice='Não foi possível recuperar o treino salvo.'; }
  function save(){
    try {localStorage.setItem(key,JSON.stringify(state));notice='Salvo neste dispositivo.';return true;}
    catch {notice='Não foi possível salvar neste dispositivo. Mantenha esta página aberta para não perder o treino.';return false;}
  }
  function totals(){
    const sets=state.selected.flatMap(id=>state.sets[id]||[]);
    return {sets:sets.length,reps:sets.reduce((n,s)=>n+s.reps,0),volume:sets.reduce((n,s)=>n+s.kg*s.reps,0),ms:Math.max(0,(state.ended||Date.now())-state.started)};
  }
  function duration(ms){const sec=Math.floor(ms/1000);return `${Math.floor(sec/3600).toString().padStart(2,'0')}:${Math.floor(sec/60)%60 < 10?'0':''}${Math.floor(sec/60)%60}:${(sec%60).toString().padStart(2,'0')}`;}
  function number(n){return n.toLocaleString('pt-BR',{maximumFractionDigits:1});}
  function weightField(){return `<label class="body-weight">Peso corporal (kg) <span>Opcional, para estimar calorias</span><input id="body-weight" type="number" inputmode="decimal" min="1" max="500" step="0.1" value="${escape(state.weight)}" placeholder="Ex.: 70"></label>`;}
  function render(){
    title.textContent=state.phase==='builder'?'O que vai treinar hoje?':state.phase==='active'?'Seu treino':'Treino finalizado';
    if(state.phase==='builder'){
      root.innerHTML=`<p class="helper">Toque para adicionar ou arraste pelo símbolo ↕ até seu treino.</p><nav class="filters" aria-label="Grupo muscular">${['Todos','Perna','Braço','Peito','Costas','Ombro'].map(g=>`<button data-filter="${g}" aria-pressed="${filter===g}">${g}</button>`).join('')}</nav><div class="builder-grid"><section><h2 class="small-title">Exercícios</h2><div class="catalog">${catalog.filter(e=>filter==='Todos'||e.group===filter).map(e=>`<article class="exercise-card"><button class="drag-handle" data-drag="${e.id}" aria-label="Arrastar ${e.name}" title="Arrastar">↕</button><button class="exercise-add" data-add="${e.id}" ${state.selected.includes(e.id)?'disabled':''}><span class="exercise-icon" aria-hidden="true">${icons[e.group]}</span><span><strong>${e.name}</strong><small>${e.group}</small></span><span>${state.selected.includes(e.id)?'✓':'+'}</span></button></article>`).join('')}</div></section><section id="drop-zone" class="workout-selection" aria-label="Seu treino, solte exercícios aqui"><h2 class="small-title">Seu treino <span>${state.selected.length}</span></h2><p class="helper">Arraste para cá. Use as setas para mudar a ordem.</p><ol class="selected-list">${state.selected.map((id,i)=>{const e=catalog.find(e=>e.id===id);return `<li data-order="${id}"><button class="drag-handle" data-drag="${id}" aria-label="Arrastar ${e.name}">↕</button><strong>${e.name}</strong><div class="order-actions"><button data-up="${id}" aria-label="Mover ${e.name} para cima" ${i===0?'disabled':''}>↑</button><button data-down="${id}" aria-label="Mover ${e.name} para baixo" ${i===state.selected.length-1?'disabled':''}>↓</button><button data-remove="${id}" aria-label="Remover ${e.name}">×</button></div></li>`;}).join('')}</ol>${!state.selected.length?'<div class="empty-selection">Adicione os exercícios que deseja fazer.</div>':''}${weightField()}<button class="primary-button" id="start-workout" ${!state.selected.length?'disabled':''}>Iniciar treino <span>→</span></button></section></div>`;
    } else if(state.phase==='active'){
      root.innerHTML=`<div class="session-top"><span>Tempo de treino <strong id="timer">${duration(totals().ms)}</strong></span><button class="secondary-button" id="save-workout">Salvar registros</button></div><p class="helper">Registre somente séries realizadas. Informe a carga total utilizada na série; sem carga externa, use 0 kg.</p><div class="execution-list">${state.selected.map(id=>{const e=catalog.find(e=>e.id===id),sets=state.sets[id]||[];return `<section class="execution-card"><span class="group-label">${e.group}</span><h2>${e.name}</h2><ol class="set-list">${sets.map((s,i)=>`<li><span>Série ${i+1}</span><strong>${s.reps} rep. × ${number(s.kg)} kg</strong><button data-delete-set="${id}:${i}" aria-label="Excluir série ${i+1} de ${e.name}">×</button></li>`).join('')}</ol><form class="set-form" data-exercise="${id}">${selector('reps','Repetições',12)}${selector('kg','Peso total (kg)',20)}<button class="secondary-button" type="submit">Registrar série</button><p class="set-error" role="alert"></p></form></section>`;}).join('')}</div><button class="primary-button" id="finish-workout">Finalizar treino <span>✓</span></button>`;
    } else {
      const t=totals(); const weight=Number(state.weight); const calories=weight>0?3.5*weight*(t.ms/3600000):null;
      root.innerHTML=`<div class="summary-grid">${[['Séries realizadas',t.sets],['Repetições',t.reps],['Duração',duration(t.ms)],['Volume movimentado',`${number(t.volume)} kg·rep`]].map(([label,value])=>`<div class="metric"><span>${label}</span><strong>${value}</strong></div>`).join('')}</div><p class="helper">Volume = soma de peso × repetições de cada série registrada.</p><section class="calorie-card"><h2>Calorias aproximadas</h2>${weightField()}<strong class="calorie-number">${calories===null?'Informe seu peso para estimar.':`≈ ${Math.round(calories/10)*10} kcal`}</strong><p class="helper">Estimativa de gasto total, incluindo o metabolismo de repouso: 3,5 MET × peso corporal × duração em horas. Hipótese: musculação com vários exercícios, esforço moderado (8–15 repetições), durante o tempo registrado, incluindo intervalos. Pausas longas podem superestimar o resultado. Não é uma medição individual.</p><a href="https://pacompendium.com/conditioning-exercise/" target="_blank" rel="noopener noreferrer">Fonte: Compêndio de Atividades Físicas 2024, código 02054</a></section><button class="primary-button" id="new-workout">Montar outro treino <span>→</span></button>`;
    }
    root.insertAdjacentHTML('beforeend',`<p class="storage-notice" id="storage-notice" role="status">${escape(notice)}</p>`);
  }
  function add(id){if(!state.selected.includes(id)){state.selected.push(id);save();render();}}
  root.addEventListener('click',event=>{
    const b=event.target.closest('button');if(!b||b.disabled)return;
    if(b.dataset.picker){openPicker(b);return;}
    if(b.dataset.filter){filter=b.dataset.filter;render();}
    if(b.dataset.add)add(b.dataset.add);
    for(const action of ['up','down','remove']) if(b.dataset[action]){const id=b.dataset[action],i=state.selected.indexOf(id);if(action==='remove')state.selected.splice(i,1);else {const j=i+(action==='up'?-1:1);if(j>=0&&j<state.selected.length)[state.selected[i],state.selected[j]]=[state.selected[j],state.selected[i]];}save();render();}
    if(b.id==='start-workout'){state.phase='active';state.started=Date.now();state.ended=null;state.sets={};save();render();window.scrollTo(0,0);title.focus();}
    if(b.id==='save-workout'){save();document.querySelector('#storage-notice').textContent=notice;}
    if(b.dataset.deleteSet){const [id,index]=b.dataset.deleteSet.split(':');state.sets[id].splice(Number(index),1);save();render();}
    if(b.id==='finish-workout'){state.ended=Date.now();state.phase='summary';save();render();window.scrollTo(0,0);title.focus();}
    if(b.id==='new-workout'){state={phase:'builder',selected:[],weight:state.weight,started:null,ended:null,sets:{}};save();render();window.scrollTo(0,0);title.focus();}
  });
  root.addEventListener('change',event=>{
    if(event.target.id==='body-weight'){
      const value=event.target.value,n=Number(value);
      if(value!==''&&(!Number.isFinite(n)||n<=0||n>500)){event.target.setCustomValidity('Informe um peso maior que 0 e até 500 kg.');event.target.reportValidity();return;}
      event.target.setCustomValidity('');state.weight=value;save();if(state.phase==='summary')render();else document.querySelector('#storage-notice').textContent=notice;
    }
  });
  root.addEventListener('input',event=>{if(event.target.id==='body-weight')event.target.setCustomValidity('');});
  root.addEventListener('submit',event=>{
    const form=event.target.closest('.set-form');if(!form)return;event.preventDefault();
    const reps=Number(form.elements.reps.value),kg=Number(form.elements.kg.value);
    if(!Number.isInteger(reps)||reps<1||reps>20||!Number.isFinite(kg)||kg<0||kg>500||kg%5!==0){form.querySelector('.set-error').textContent='Escolha de 1 a 20 repetições e um peso de 0 a 500 kg, em passos de 5 kg.';return;}
    const id=form.dataset.exercise;(state.sets[id] ||= []).push({reps,kg});save();render();
  });
  // Pointer Events funcionam com dedo, caneta e mouse. Apenas a alça bloqueia rolagem.
  root.addEventListener('pointerdown',event=>{
    const handle=event.target.closest('[data-drag]');if(!handle||state.phase!=='builder'||event.button!==0)return;
    drag={id:handle.dataset.drag,x:event.clientX,y:event.clientY,moved:false,handle};handle.setPointerCapture(event.pointerId);
  });
  root.addEventListener('pointermove',event=>{
    if(!drag)return;if(Math.hypot(event.clientX-drag.x,event.clientY-drag.y)<8&&!drag.moved)return;
    drag.moved=true;event.preventDefault();
    if(!drag.ghost){drag.ghost=document.createElement('div');drag.ghost.className='drag-ghost';drag.ghost.textContent=catalog.find(e=>e.id===drag.id).name;document.body.append(drag.ghost);}
    drag.ghost.style.left=`${event.clientX}px`;drag.ghost.style.top=`${event.clientY}px`;
    const zone=document.querySelector('#drop-zone');zone.classList.toggle('drop-active',!!document.elementFromPoint(event.clientX,event.clientY)?.closest('#drop-zone'));
    if(event.clientY>window.innerHeight-70)window.scrollBy(0,12);if(event.clientY<70)window.scrollBy(0,-12);
  });
  function endDrag(event,cancel=false){
    if(!drag)return;const current=drag;drag=null;current.ghost?.remove();document.querySelector('#drop-zone')?.classList.remove('drop-active');
    if(cancel||!current.moved)return;const target=document.elementFromPoint(event.clientX,event.clientY);if(!target?.closest('#drop-zone'))return;
    const row=target.closest('[data-order]');const id=current.id;state.selected=state.selected.filter(x=>x!==id);
    const index=row?state.selected.indexOf(row.dataset.order):-1;if(index<0)state.selected.push(id);else state.selected.splice(index,0,id);save();render();
  }
  root.addEventListener('pointerup',event=>endDrag(event));root.addEventListener('pointercancel',event=>endDrag(event,true));
  setInterval(()=>{const timer=document.querySelector('#timer');if(timer)timer.textContent=duration(totals().ms);},1000);
  render();
})();

