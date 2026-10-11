import {JOBS, freshData, money, parseRate, today, isDate, addDays, weekStart, moveMonth, monthStart, total, monthWeeks, validateData} from './core.mjs';
const KEY = 'weekly-earnings-v1';
let data = freshData(), loadFailed = false;
try {
  const saved = localStorage.getItem(KEY);
  if (saved) data = validateData(JSON.parse(saved));
  else { localStorage.setItem(KEY,JSON.stringify(data)); }
} catch (e) { loadFailed = true; }
let page = ['today','earnings','settings'].includes(location.hash.slice(1)) ? location.hash.slice(1) : 'today';
let selectedDate = today(), selectedJob = JOBS[0], quantity = 1, month = today().slice(0,7), expanded = new Set();
const main = document.querySelector('#main');
const esc = value => String(value).replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const dateLabel = (date, options={day:'numeric',month:'short'}) => new Date(`${date}T12:00:00Z`).toLocaleDateString('en-GB',{...options,timeZone:'UTC'});
const initials = job => job === 'Site investigation' ? 'SI' : job[0];
let toastTimer;
function toast(message) {
  const el = document.querySelector('#toast'); el.textContent = message; el.hidden = false;
  clearTimeout(toastTimer); toastTimer = setTimeout(()=>el.hidden=true,3500);
}
function save(next) {
  if (loadFailed) { toast('Changes are disabled to protect your saved records.'); return false; }
  try { const clean = validateData(next); localStorage.setItem(KEY,JSON.stringify(clean)); data = clean; return true; }
  catch { toast('Could not save. Your records have not changed. Free some device storage and try again.'); return false; }
}
function confirmAction(title, message, button='Confirm') {
  const dialog=document.querySelector('#confirm');
  document.querySelector('#confirm-title').textContent=title;
  document.querySelector('#confirm-text').textContent=message;
  document.querySelector('#confirm-button').textContent=button;
  dialog.returnValue='cancel'; dialog.showModal();
  return new Promise(resolve=>dialog.addEventListener('close',()=>resolve(dialog.returnValue==='confirm'),{once:true}));
}
function rateFields() {
  return JOBS.map(job=>`<div class="rate-row"><label for="rate-${JOBS.indexOf(job)}">${job}</label><div class="rate-input"><span aria-hidden="true">£</span><input id="rate-${JOBS.indexOf(job)}" name="${job}" inputmode="decimal" type="text" maxlength="8" value="${(data.rates[job]/100).toFixed(2)}" aria-label="${job} rate in pounds" required></div></div>`).join('');
}
function installCard() {
  return `<section class="card install"><h3>Keep it on your iPhone</h3><ol><li>Open this page in <strong>Safari</strong>.</li><li>Tap <strong>Share</strong> → <strong>Add to Home Screen</strong>.</li><li>Open Earnings from its new icon while online once.</li></ol><p>Once the offline indicator is ready, you can use it without a connection. Your records stay on this device.</p></section>`;
}
function bindRates() {
  const form = document.querySelector('#rates-form');
  form.addEventListener('submit', event=>{
    event.preventDefault(); const rates = {};
    for (const job of JOBS) {
      const value=parseRate(form.elements.namedItem(job).value);
      if (value === null) { document.querySelector('#rate-error').textContent='Enter a rate from £0 to £99,999.99, with up to two decimal places.'; form.elements.namedItem(job).focus(); return; }
      rates[job]=value;
    }
    if (save({...data,configured:true,rates})) { render(); toast('Your rates are saved.'); }
  });
}
function render() {
  const nav = document.querySelector('#nav'); nav.hidden = !data.configured || loadFailed;
  document.querySelectorAll('[data-page]').forEach(b=>{b.classList.toggle('active',b.dataset.page===page);b.setAttribute('aria-current',b.dataset.page===page?'page':'false');});
  if (loadFailed) {
    main.innerHTML=`<p class="eyebrow">Storage unavailable</p><h1>Your records come first.</h1><section class="card"><p class="error">We couldn’t read or access your saved data. We have not overwritten it.</p><p class="helper">Close and reopen the app. If you are using private browsing, switch to a normal Safari tab. Avoid clearing website data if you already have records here.</p><button class="secondary full" id="reload">Try again</button><button class="secondary full" id="recover" style="margin-top:10px">Download stored data</button></section>`;
    document.querySelector('#reload').onclick=()=>location.reload();
    document.querySelector('#recover').onclick=()=>{
      try { const raw=localStorage.getItem(KEY); if (!raw) return toast('No stored data is available.'); download(raw,`earnings-recovery-${today()}.json`); } catch { toast('The browser is blocking access to storage.'); }
    };
    return;
  }
  if (!data.configured) {
    main.innerHTML=`<div class="setup-mark" aria-hidden="true">£</div><p class="eyebrow">Your work. Your week.</p><h1>Make every<br>job count.</h1><p class="subtitle">Set your rates, log your work, and know what you’ve earned. No account. No connection needed.</p><form class="card" id="rates-form"><h2>Your rate per job</h2>${rateFields()}<p class="error" id="rate-error" role="alert"></p><button class="primary full" type="submit">Start tracking <span aria-hidden="true">→</span></button><p class="helper">You can update rates later. Earlier entries always keep their original rate.</p></form>${installCard()}`;
    bindRates(); return;
  }
  if (page==='today') renderDaily();
  else if (page==='earnings') renderEarnings();
  else renderSettings();
}
function renderDaily() {
  const entries=data.entries.filter(e=>e.date===selectedDate), week=weekStart(selectedDate);
  const weekTotal=total(data.entries,week,addDays(week,7));
  main.innerHTML=`<p class="eyebrow">${selectedDate===today()?'Let’s get to work':'A little catch-up'}</p><h1>Your day, added up.</h1><p class="subtitle">Every completed job brings you a little further.</p><section class="hero" aria-label="Selected day earnings"><span class="hero-label">${selectedDate===today()?'Earned today':dateLabel(selectedDate,{weekday:'long',day:'numeric',month:'long'})}</span><div class="hero-total">${money(total(entries,selectedDate,addDays(selectedDate,1)))}</div><div class="hero-bottom"><span>This week <strong>${money(weekTotal)}</strong></span><span class="tag">${entries.reduce((n,e)=>n+e.quantity,0)} jobs recorded</span></div></section><label class="field"><span>Work date</span><input id="work-date" type="date" min="1900-01-01" max="${today()}" value="${selectedDate}"></label><p class="helper">Forgot a day? Choose an earlier date to add work.</p><div class="section-title"><h2>Add completed work</h2></div><form class="card" id="work-form"><span class="field-label">Job type</span><div class="job-options" role="group" aria-label="Job type">${JOBS.map(job=>`<button type="button" class="job-choice ${selectedJob===job?'active':''}" data-job="${job}" aria-pressed="${selectedJob===job}">${job}<strong>${money(data.rates[job])}</strong></button>`).join('')}</div><div class="qty-row"><label for="quantity" class="field-label">How many?</label><div class="stepper"><button type="button" id="minus" aria-label="Decrease quantity">−</button><input id="quantity" type="number" inputmode="numeric" min="1" max="1000" step="1" value="${quantity}" aria-label="Quantity" required><button type="button" id="plus" aria-label="Increase quantity">＋</button></div></div><button class="primary full" id="add-work" type="submit">Add ${money(data.rates[selectedJob]*quantity)} <span aria-hidden="true">＋</span></button></form><div class="section-title"><h2>Recorded work</h2><span>${dateLabel(selectedDate)}</span></div><section class="card" style="padding-top:5px;padding-bottom:5px">${entries.length ? entries.slice().reverse().map(e=>`<div class="entry"><span class="entry-icon" aria-hidden="true">${initials(e.job)}</span><div class="entry-detail"><strong>${e.quantity} × ${e.job}</strong><small>${money(e.ratePence)} per job</small></div><span class="entry-amount">${money(e.quantity*e.ratePence)}</span><button class="delete" data-delete="${esc(e.id)}" aria-label="Delete ${e.quantity} ${e.job} entry">×</button></div>`).join('') : '<div class="empty">A fresh start.<br>Add your first job for this date above.</div>'}</section>`;
  document.querySelector('#work-date').onchange=e=>{
    const date=e.target.value;
    if (!isDate(date) || date>today()) { e.target.value=selectedDate; return toast('Choose today or an earlier date.'); }
    selectedDate=date; render();
  };
  document.querySelectorAll('[data-job]').forEach(b=>b.onclick=()=>{selectedJob=b.dataset.job;render();});
  const input=document.querySelector('#quantity'), button=document.querySelector('#add-work');
  function updateQuantity() {
    const n=Number(input.value); const valid=Number.isInteger(n)&&n>=1&&n<=1000;
    if (valid) quantity=n;
    button.disabled=!valid;button.innerHTML=valid?`Add ${money(data.rates[selectedJob]*n)} <span aria-hidden="true">＋</span>`:'Enter a quantity from 1 to 1,000';
  }
  input.oninput=updateQuantity;
  document.querySelector('#minus').onclick=()=>{input.value=Math.max(1,(Number(input.value)||1)-1);updateQuantity();};
  document.querySelector('#plus').onclick=()=>{input.value=Math.min(1000,(Number(input.value)||0)+1);updateQuantity();};
  document.querySelector('#work-form').onsubmit=e=>{
    e.preventDefault(); const n=Number(input.value);
    if (!Number.isInteger(n)||n<1||n>1000||selectedDate>today()) return toast('Check the quantity and work date.');
    const entry={id:crypto.randomUUID(),date:selectedDate,job:selectedJob,quantity:n,ratePence:data.rates[selectedJob]};
    if(save({...data,entries:[...data.entries,entry]})){quantity=1;render();toast(`${n} ${selectedJob} ${n===1?'job':'jobs'} added.`);}
  };
  document.querySelectorAll('[data-delete]').forEach(b=>b.onclick=async()=>{
    const entry=data.entries.find(e=>e.id===b.dataset.delete); if (!entry) return;
    if(await confirmAction('Delete this entry?',`${entry.quantity} × ${entry.job} · ${money(entry.quantity*entry.ratePence)}. This removes it from your daily, weekly and monthly totals.`,'Delete entry')) {
      if(save({...data,entries:data.entries.filter(e=>e.id!==entry.id)})){render();toast('Entry deleted.');}
    }
  });
}
function renderEarnings() {
  const start=monthStart(month), end=monthStart(moveMonth(month,1));
  const monthEntries=data.entries.filter(e=>e.date>=start&&e.date<end);
  main.innerHTML=`<p class="eyebrow">The bigger picture</p><h1>Your hard work,<br>in numbers.</h1><p class="subtitle">A clear view of every week, month after month.</p><div class="months"><button id="prev-month" aria-label="Previous month">‹</button><input id="month" type="month" min="1900-01" max="9998-12" value="${month}" aria-label="Choose month"><button id="next-month" aria-label="Next month">›</button></div><section class="hero"><span class="hero-label">${dateLabel(start,{month:'long',year:'numeric'})} earnings</span><div class="hero-total">${money(total(data.entries,start,end))}</div><div class="hero-bottom"><span>${monthEntries.reduce((n,e)=>n+e.quantity,0)} completed jobs</span><span class="tag">Calendar month total</span></div></section><div class="section-title"><h2>Week by week</h2><span>Monday → Sunday</span></div>${monthWeeks(month).map(week=>{
    const partStart=week.start>start?week.start:start, partEnd=week.end<end?week.end:end;
    return `<section class="card week-card"><button class="week-button" data-week="${week.start}" aria-expanded="${expanded.has(week.start)}"><span><span class="dates">${dateLabel(week.start)} – ${dateLabel(addDays(week.end,-1))}</span><span class="amount">${money(total(data.entries,week.start,week.end))}</span><small>In this month: ${money(total(data.entries,partStart,partEnd))}</small></span><span class="arrow" aria-hidden="true">${expanded.has(week.start)?'−':'＋'}</span></button>${expanded.has(week.start)?`<div class="week-details">${Array.from({length:7},(_,i)=>{
      const day=addDays(week.start,i), dayEntries=data.entries.filter(e=>e.date===day);
      return `<div class="day-row"><span>${day<=today()?`<button data-day="${day}" aria-label="View or add work for ${dateLabel(day,{weekday:'long',day:'numeric',month:'long'})}">${dateLabel(day,{weekday:'short',day:'numeric',month:'short'})}</button>`:dateLabel(day,{weekday:'short',day:'numeric',month:'short'})}<small style="display:block;color:var(--muted)">${dayEntries.reduce((n,e)=>n+e.quantity,0)} jobs</small></span><strong>${money(total(dayEntries,day,addDays(day,1)))}</strong></div>`;
    }).join('')}</div>`:''}</section>`;
  }).join('')}<p class="helper">Full weeks may include days from the previous or next month. The month total counts only work in ${dateLabel(start,{month:'long'})}. Tap a week to see each day.</p>`;
  document.querySelector('#prev-month').onclick=()=>{if(month<='1900-01')return;month=moveMonth(month,-1);render();};
  document.querySelector('#next-month').onclick=()=>{if(month>='9998-12')return;month=moveMonth(month,1);render();};
  document.querySelector('#month').onchange=e=>{if(/^\d{4}-\d{2}$/.test(e.target.value)&&isDate(`${e.target.value}-01`)&&e.target.value<'9999-01'){month=e.target.value;render();}};
  document.querySelectorAll('[data-week]').forEach(b=>b.onclick=()=>{expanded.has(b.dataset.week)?expanded.delete(b.dataset.week):expanded.add(b.dataset.week);render();});
  document.querySelectorAll('[data-day]').forEach(b=>b.onclick=()=>{selectedDate=b.dataset.day;navigate('today');});
}
function download(text, name) {
  const url=URL.createObjectURL(new Blob([text],{type:'application/json'}));
  const a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);
}
function renderSettings() {
  main.innerHTML=`<p class="eyebrow">Make it yours</p><h1>Your rates & records.</h1><p class="subtitle">Simple settings. Your data stays in your hands.</p><form class="card" id="rates-form"><h2>Your rate per job</h2>${rateFields()}<p class="error" id="rate-error" role="alert"></p><button class="primary full" type="submit">Save rates</button><p class="helper">New rates apply to new entries only. Your previous earnings won’t change.</p></form><section class="card"><h2>A little peace of mind</h2><p class="helper">Save a backup to Files regularly. Records live on this device, and can be lost if Safari website data is cleared or the app is removed. A backup is also how you move to another phone.</p><div class="actions"><button class="secondary" id="export">Export backup ↓</button><button class="secondary" id="import">Restore backup ↑</button></div><input id="backup-file" type="file" accept=".json,application/json" hidden><p class="backup-date">${data.entries.length} saved entries · No account or cloud sync</p></section>${installCard()}<section class="card"><h3>Already using the native app?</h3><p class="helper">This app can restore the native app’s earnings.json file as well as web backups. The native app has no export button yet; on your Mac, Xcode’s Devices and Simulators window can download its app container. Find earnings.json in Library/Application Support/WeeklyEarnings, then restore that file here.</p></section>`;
  bindRates();
  document.querySelector('#export').onclick=async()=>{
    const text=JSON.stringify(data,null,2), name=`weekly-earnings-${today()}.json`;
    const file=new File([text],name,{type:'application/json'});
    if(navigator.canShare?.({files:[file]})) {
      try { await navigator.share({files:[file],title:'Weekly Earnings backup'}); }
      catch(e) { if(e.name!=='AbortError')download(text,name); }
    } else download(text,name);
  };
  const input=document.querySelector('#backup-file');document.querySelector('#import').onclick=()=>input.click();
  input.onchange=async()=>{
    const file=input.files[0];input.value='';if(!file)return;
    try {
      if(file.size>20000000)throw new Error('That file is too large. Choose an earnings JSON backup under 20 MB.');
      const imported=validateData(JSON.parse(await file.text()));
      if(await confirmAction('Restore this backup?',`This replaces your current rates and ${data.entries.length} entries with ${imported.entries.length} entries from the backup. Export your current records first if you want to keep them.`,'Restore backup')) {
        if(save(imported)){render();toast('Backup restored.');}
      }
    } catch(e){toast(e instanceof SyntaxError?'That file is not valid JSON. Choose an earnings backup.':e.message);}
  };
}
function navigate(next) { page=next;location.hash=next;render();window.scrollTo({top:0,behavior:'instant'}); }
document.querySelectorAll('[data-page]').forEach(b=>b.onclick=()=>navigate(b.dataset.page));
window.addEventListener('hashchange',()=>{const next=location.hash.slice(1);if(['today','earnings','settings'].includes(next)&&next!==page){page=next;render();}});
window.addEventListener('storage',event=>{
  if(event.key!==KEY)return;
  try { if(event.newValue===null)throw new Error();data=validateData(JSON.parse(event.newValue));render();toast('Records updated from another tab.'); }
  catch { loadFailed=true;render(); }
});
render();
let offlineReady=false;
function connectionStatus() {
  const el=document.querySelector('#offline-state');
  el.textContent=offlineReady?(navigator.onLine?'● Offline ready':'● Working offline'):(navigator.onLine?'● Preparing offline':'● Offline not ready');
}
connectionStatus();
window.addEventListener('online',connectionStatus);window.addEventListener('offline',connectionStatus);
if('serviceWorker' in navigator && window.isSecureContext) {
  navigator.serviceWorker.register('./sw.js').then(async registration=>{
    await navigator.serviceWorker.ready;
    offlineReady=true;connectionStatus();
    if(registration.waiting)toast('A new version is ready. Close and reopen the app to update.');
  }).catch(()=>{document.querySelector('#offline-state').textContent='● Online only';toast('Offline setup failed. Reopen while online to retry.');});
} else document.querySelector('#offline-state').textContent='● HTTPS required';
