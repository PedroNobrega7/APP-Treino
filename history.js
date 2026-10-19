(() => {
  const key = 'pulse-history-v1';
  const host = document.createElement('section');
  host.className = 'training-history';
  host.setAttribute('aria-label', 'Diário de treinos');
  document.querySelector('#workout-root').before(host);
  const today = () => {const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;};
  const esc = s => String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const num = n => n.toLocaleString('pt-BR',{maximumFractionDigits:1});
  let records=[], selected=today(), error='';
  try {const saved=JSON.parse(localStorage.getItem(key)||'[]');if(!Array.isArray(saved))throw Error(); records=saved;}
  catch {error='Não foi possível ler o histórico. Os dados existentes não serão substituídos.';}
  function commit(next){
    if(error){alert(error);return false;}
    try {localStorage.setItem(key,JSON.stringify(next));records=next;render();return true;}
    catch {alert('Não foi possível salvar o histórico. Libere espaço no navegador e tente novamente.');return false;}
  }
  window.pulseArchive = state => {
    if(state.phase!=='summary')return true;
    const sets=state.selected.flatMap(id=>state.sets[id]||[]);
    const date=new Date(state.started);
    const day=`${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
    const minutes=Math.max(0,(state.ended-state.started)/60000);
    const row={id:`session-${state.started}`,date:day,volume:sets.reduce((n,s)=>n+s.kg*s.reps,0),calories:Number(state.weight)>0?Math.round(3.5*Number(state.weight)*minutes/60/10)*10:null,estimated:true,minutes,details:state.sets};
    return commit([...records.filter(r=>r.id!==row.id),row]);
  };
  function chart(days,field,label,unit){
    const max=Math.max(1,...days.map(d=>d[field]||0));
    return `<section class="history-chart"><h3>${label}</h3><p>Últimos 14 dias até a data selecionada</p><div class="history-bars">${days.map(d=>`<div class="history-bar"><span title="${d.date}: ${d[field]===null?'Não informado':num(d[field])+' '+unit}" style="height:${d[field]>0?Math.max(3,d[field]/max*100):0}%"></span><small>${d.date.slice(8)}</small></div>`).join('')}</div><p>${unit==='kcal'?'Calorias estimadas ou informadas; valores ausentes não contam como zero.':'Volume = soma da carga × repetições de cada série.'}</p></section>`;
  }
  function render(){
    const days=Array.from({length:14},(_,i)=>{const d=new Date(selected+'T12:00:00');d.setDate(d.getDate()-13+i);const date=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;const rows=records.filter(r=>r.date===date);return {date,volume:rows.reduce((n,r)=>n+r.volume,0),calories:rows.some(r=>r.calories!==null)?rows.reduce((n,r)=>n+(r.calories||0),0):null};});
    const rows=records.filter(r=>r.date===selected);
    host.innerHTML=`<h2>Seu diário de treinos</h2><p>Registre qualquer dia e acompanhe sua evolução. Histórico salvo somente neste navegador.</p><label>Dia do treino <input id="history-date" type="date" required max="${today()}" value="${selected}"></label><div class="history-charts">${chart(days,'volume','Peso movimentado por dia','kg·rep')}${chart(days,'calories','Calorias por dia','kcal')}</div><h3>Registros de ${selected.split('-').reverse().join('/')}</h3>${error?`<p role="alert">${esc(error)}</p>`:''}<div>${rows.length?rows.map(r=>`<article class="history-record"><span><strong>${num(r.volume)} kg·rep</strong> · ${r.calories===null?'Calorias não informadas':num(r.calories)+' kcal'+(r.estimated?' (estimativa)':' (informadas)')} · ${num(r.minutes)} min</span><button type="button" data-history-edit="${esc(r.id)}">Editar</button></article>`).join(''):'<p>Nenhum treino registrado neste dia.</p>'}</div><details><summary>Preencher ou corrigir um treino</summary><form id="history-form"><input name="recordId" type="hidden"><label>Volume total (kg·rep)<input name="volume" type="number" min="0" step="any" required placeholder="Ex.: 3 séries × 10 rep. × 20 kg = 600"></label><label>Duração (minutos)<input name="minutes" type="number" min="1" max="1440" step="any" required></label><label>Calorias (opcional, informadas por você)<input name="calories" type="number" min="0" step="any"></label><button class="secondary-button" type="submit">Salvar dia</button><button type="button" id="history-cancel">Limpar edição</button><p>Você pode adicionar mais de um treino por dia. Editar substitui apenas o registro escolhido.</p></form></details>`;
  }
  host.addEventListener('change',e=>{if(e.target.id==='history-date'&&e.target.value&&e.target.value<=today()){selected=e.target.value;render();}});
  host.addEventListener('click',e=>{
    const b=e.target.closest('button');if(!b)return;
    const form=host.querySelector('form');
    if(b.id==='history-cancel')form.reset();
    if(b.dataset.historyEdit){const r=records.find(r=>r.id===b.dataset.historyEdit);host.querySelector('details').open=true;for(const name of ['volume','minutes','calories'])form.elements[name].value=r[name]??'';form.elements.recordId.value=r.id;form.elements.volume.focus();}
  });
  host.addEventListener('submit',e=>{
    e.preventDefault();const f=e.target,volume=Number(f.elements.volume.value),minutes=Number(f.elements.minutes.value),calories=f.elements.calories.value===''?null:Number(f.elements.calories.value);
    if(!Number.isFinite(volume)||volume<0||!Number.isFinite(minutes)||minutes<=0||minutes>1440||(calories!==null&&(!Number.isFinite(calories)||calories<0)))return;
    const id=f.elements.recordId.value||`manual-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    commit([...records.filter(r=>r.id!==id),{id,date:selected,volume,minutes,calories,estimated:false}]);
  });
  render();
})();
