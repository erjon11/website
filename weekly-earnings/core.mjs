export const JOBS = ['Dual', 'Single', 'Site investigation'];
export const DEFAULT_RATES = {Dual: 8000, Single: 5000, 'Site investigation': 3000};
export const AREAS = ['London', 'Outside London'];
export const OUTSIDE_RATES = {Dual: 7000, Single: 4500, 'Site investigation': 3000};
export const freshData = () => ({version: 2, configured: false, rates: {...DEFAULT_RATES}, outsideRates: {...OUTSIDE_RATES}, entries: []});
export const money = pence => new Intl.NumberFormat('en-GB', {style:'currency', currency:'GBP'}).format(pence / 100);
export function parseRate(text) {
  if (!/^\d{1,5}(\.\d{1,2})?$/.test(text.trim())) return null;
  const [pounds, fraction = ''] = text.trim().split('.');
  return Number(pounds) * 100 + Number(fraction.padEnd(2, '0'));
}
export function today() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}
export function isDate(s) {
  if (typeof s !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const d = new Date(`${s}T12:00:00Z`);
  return !isNaN(d) && d.toISOString().slice(0,10) === s && s >= '1900-01-01' && s <= '9999-12-31';
}
export function addDays(date, n) {
  const d = new Date(`${date}T12:00:00Z`); d.setUTCDate(d.getUTCDate()+n);
  return d.toISOString().slice(0,10);
}
export function weekStart(date) {
  const day = new Date(`${date}T12:00:00Z`).getUTCDay();
  return addDays(date, -((day+6)%7));
}
export const monthStart = month => `${month}-01`;
export function moveMonth(month, n) {
  const d = new Date(`${month}-01T12:00:00Z`); d.setUTCMonth(d.getUTCMonth()+n);
  return d.toISOString().slice(0,7);
}
export const total = (entries, start, end) => entries.filter(e=>e.date>=start && e.date<end).reduce((sum,e)=>sum+e.quantity*e.ratePence,0);
export function monthWeeks(month) {
  const end = monthStart(moveMonth(month,1)); const result = [];
  for (let start=weekStart(monthStart(month)); start<end; start=addDays(start,7)) result.push({start,end:addDays(start,7)});
  return result;
}
export function validateData(raw) {
  if (!raw || typeof raw !== 'object' || (raw.version !== undefined && ![1,2].includes(raw.version)) || typeof raw.configured !== 'boolean' || !Array.isArray(raw.entries) || raw.entries.length > 100000) throw new Error('This is not a supported earnings backup.');
  const rates = {};
  for (const job of JOBS) {
    const rate = raw.rates?.[job];
    if (!Number.isSafeInteger(rate) || rate < 0 || rate > 9999999) throw new Error('The backup contains an invalid rate.');
    rates[job] = rate;
  }
  const outsideRates = {};
  for (const job of JOBS) {
    const rate = raw.version === 2 ? raw.outsideRates?.[job] : OUTSIDE_RATES[job];
    if (!Number.isSafeInteger(rate) || rate < 0 || rate > 9999999) throw new Error('The backup contains an invalid outside London rate.');
    outsideRates[job] = rate;
  }
  const ids = new Set();
  const entries = raw.entries.map(e=>{
    if (!e || typeof e !== 'object') throw new Error('The backup contains an invalid entry.');
    const area = raw.version === 2 ? e.area : 'London';
    if (!AREAS.includes(area)) throw new Error('The backup contains an invalid work location.');
    let date = e.date;
    // Swift JSONEncoder dates are seconds since 1 January 2001.
    if (raw.version === undefined && typeof date === 'number') {
      const d = new Date(Date.UTC(2001,0,1)+date*1000);
      if (isNaN(d)) throw new Error('The backup contains an invalid date.');
      date = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    }
    if (!e || typeof e.id !== 'string' || !e.id || e.id.length > 128 || ids.has(e.id) || !isDate(date) || !JOBS.includes(e.job) || !Number.isSafeInteger(e.quantity) || e.quantity < 1 || e.quantity > 1000 || !Number.isSafeInteger(e.ratePence) || e.ratePence < 0 || e.ratePence > 9999999) throw new Error('The backup contains an invalid or duplicate entry.');
    ids.add(e.id);
    return {id:e.id, date, area, job:e.job, quantity:e.quantity, ratePence:e.ratePence};
  });
  return {version:2, configured:raw.configured, rates, outsideRates, entries};
}

export function payment(grossPence) {
  const cisPence = Math.round(grossPence / 5);
  return {grossPence, cisPence, netPence: grossPence - cisPence};
}
