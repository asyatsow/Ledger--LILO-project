import type { Debt, Concept } from './types';
import { demoDebts } from './demo';
const KEY='ledger-debts-v1';
export function loadDebts():Debt[]{if(typeof window==='undefined')return demoDebts;try{const x=localStorage.getItem(KEY);return x?JSON.parse(x):demoDebts}catch{return demoDebts}}
export function saveDebts(d:Debt[]){if(typeof window!=='undefined')localStorage.setItem(KEY,JSON.stringify(d))}
export function addDebt(debt:Debt){const all=loadDebts();saveDebts([debt,...all]);return debt}
export function resolveDebt(id:string){const all=loadDebts().map(d=>d.id===id?{...d,status:'resolved' as const,resolved_at:new Date().toISOString()}:d);saveDebts(all);return all}
export function stats(debts:Debt[],concept:Concept){const rows=debts.filter(d=>d.concept===concept);const open=rows.filter(d=>d.status==='open').length;const dependency=rows.length?Math.round(open/rows.length*100):0;return {total:rows.length,open,dependency,readiness:100-dependency}}
