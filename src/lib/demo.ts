import type { Debt, Concept } from './types';
export const demoDebts: Debt[] = [
{id:'1',concept:'off_by_one',original_error:'IndexError: list index out of range',ai_fix_summary:'The loop went one step beyond the final valid index.',status:'resolved',created_at:'2026-09-03T10:00:00Z',resolved_at:'2026-09-04T10:00:00Z'},
{id:'2',concept:'off_by_one',original_error:'Queue crashed on final iteration',ai_fix_summary:'The boundary used <= instead of <.',status:'resolved',created_at:'2026-09-06T10:00:00Z',resolved_at:'2026-09-07T10:00:00Z'},
{id:'3',concept:'off_by_one',original_error:'IndexError',ai_fix_summary:'An extra iteration accessed an invalid index.',status:'resolved',created_at:'2026-09-08T10:00:00Z',resolved_at:'2026-09-09T10:00:00Z'},
{id:'4',concept:'off_by_one',original_error:'IndexError',ai_fix_summary:'Loop boundary exceeded the valid range.',status:'open',created_at:'2026-09-10T10:00:00Z'},
{id:'5',concept:'null_handling',original_error:'AttributeError: NoneType has no attribute name',ai_fix_summary:'The result was None and needed a guard before dereferencing.',status:'resolved',created_at:'2026-09-02T10:00:00Z',resolved_at:'2026-09-03T10:00:00Z'},
{id:'6',concept:'null_handling',original_error:'AttributeError',ai_fix_summary:'An optional object was accessed without checking for None.',status:'resolved',created_at:'2026-09-06T10:00:00Z',resolved_at:'2026-09-07T10:00:00Z'},
{id:'7',concept:'null_handling',original_error:'AttributeError',ai_fix_summary:'A missing value was not handled before use.',status:'open',created_at:'2026-09-10T10:00:00Z'},
{id:'8',concept:'scope_error',original_error:'NameError: total is not defined',ai_fix_summary:'The variable was created in a narrower scope than where it was used.',status:'resolved',created_at:'2026-09-01T10:00:00Z',resolved_at:'2026-09-03T10:00:00Z'},
{id:'9',concept:'scope_error',original_error:'UnboundLocalError',ai_fix_summary:'A local variable was referenced before assignment.',status:'open',created_at:'2026-09-09T10:00:00Z'},
{id:'10',concept:'type_mismatch',original_error:'TypeError: unsupported operand type(s)',ai_fix_summary:'Two values had incompatible runtime types.',status:'resolved',created_at:'2026-09-04T10:00:00Z',resolved_at:'2026-09-05T10:00:00Z'},
{id:'11',concept:'type_mismatch',original_error:'TypeError',ai_fix_summary:'The function received a value of the wrong type.',status:'open',created_at:'2026-09-10T10:00:00Z'},
{id:'12',concept:'logic_error',original_error:'Tests fail despite valid syntax',ai_fix_summary:'The condition implemented the opposite decision from the requirement.',status:'resolved',created_at:'2026-08-31T10:00:00Z',resolved_at:'2026-09-02T10:00:00Z'},
{id:'13',concept:'logic_error',original_error:'Search skips valid result',ai_fix_summary:'The pointer update violated the intended search invariant.',status:'open',created_at:'2026-09-11T10:00:00Z'}
];
export const conceptOrder: Concept[]=['off_by_one','null_handling','scope_error','type_mismatch','logic_error'];
