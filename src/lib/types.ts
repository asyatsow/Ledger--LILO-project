export type Concept = 'off_by_one'|'null_handling'|'scope_error'|'type_mismatch'|'logic_error';
export type Debt = {id:string;concept:Concept;original_error:string;ai_fix_summary:string;status:'open'|'resolved';created_at:string;resolved_at?:string|null};
export const CONCEPT_LABELS: Record<Concept,string>={off_by_one:'Off-by-one',null_handling:'Null handling',scope_error:'Scope error',type_mismatch:'Type mismatch',logic_error:'Logic error'};
