/**
 * Record-a-decision modal. Writes back to the governed `decisions` table
 * (audited, attributed to the signed-in user via X-Forwarded-Email). Reused
 * from every view that lets a lead take an action on an account.
 */
import { useState } from 'react';
import { X, Check } from 'lucide-react';
import { postJSON } from '../lib/api';

export interface DecisionSeed {
  account: string;
  action?: string;
  value?: string;
}

const ACTIONS: { key: string; label: string }[] = [
  { key: 'assign_sa', label: 'Assign / nominate an SA' },
  { key: 'set_priority', label: 'Set territory priority' },
  { key: 'next_step', label: 'Log next step' },
  { key: 'assign_demo', label: 'Assign a demo to run' },
  { key: 'flag_risk', label: 'Flag renewal / account risk' },
  { key: 'claim_whitespace', label: 'Claim a whitespace target' },
  { key: 'dq_flag', label: 'Flag a data-quality issue' },
  { key: 'endorse_play', label: 'Endorse a play for scale' },
  { key: 'designate_strategic', label: 'Designate strategic account' },
  { key: 'engagement_status', label: 'Set engagement status' },
  { key: 'persona_reached', label: 'Log persona reached' },
  { key: 'note', label: 'Note' },
];

export default function DecisionModal({ seed, onClose, onSaved }: {
  seed: DecisionSeed; onClose: () => void; onSaved?: () => void;
}) {
  const [action, setAction] = useState(seed.action ?? 'assign_sa');
  const [value, setValue] = useState(seed.value ?? '');
  const [detail, setDetail] = useState('');
  const [owner, setOwner] = useState('');
  const [due, setDue] = useState('');
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState('');

  async function save() {
    setSaving(true); setErr('');
    try {
      await postJSON('/api/decisions', {
        account: seed.account, action, value, detail, owner, due_date: due, status: 'open',
      });
      setDone(true);
      onSaved?.();
      setTimeout(onClose, 850);
    } catch (e) {
      setErr(String(e));
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200">
          <div>
            <h3 className="font-bold text-gray-900">Record a decision</h3>
            <p className="text-xs text-gray-500">{seed.account}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700"><X className="w-5 h-5" /></button>
        </div>

        {done ? (
          <div className="p-8 text-center">
            <div className="inline-flex w-12 h-12 rounded-full bg-emerald-100 items-center justify-center mb-2">
              <Check className="w-6 h-6 text-emerald-600" />
            </div>
            <p className="text-sm text-gray-700">Recorded to the governed decisions log.</p>
          </div>
        ) : (
          <div className="p-5 space-y-3">
            <label className="block">
              <span className="text-xs font-semibold text-gray-600">Action</span>
              <select value={action} onChange={(e) => setAction(e.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
                {ACTIONS.map((a) => <option key={a.key} value={a.key}>{a.label}</option>)}
              </select>
            </label>
            <label className="block">
              <span className="text-xs font-semibold text-gray-600">Value</span>
              <input value={value} onChange={(e) => setValue(e.target.value)}
                placeholder="e.g. SA name, priority tier, demo, status…"
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
            </label>
            <label className="block">
              <span className="text-xs font-semibold text-gray-600">Detail / rationale</span>
              <textarea value={detail} onChange={(e) => setDetail(e.target.value)} rows={2}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="text-xs font-semibold text-gray-600">Owner</span>
                <input value={owner} onChange={(e) => setOwner(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
              </label>
              <label className="block">
                <span className="text-xs font-semibold text-gray-600">Due date</span>
                <input type="date" value={due} onChange={(e) => setDue(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
              </label>
            </div>
            {err && <p className="text-xs text-rose-600">{err}</p>}
            <div className="flex justify-end gap-2 pt-1">
              <button onClick={onClose} className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900">Cancel</button>
              <button onClick={save} disabled={saving}
                className="px-4 py-2 text-sm font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50">
                {saving ? 'Saving…' : 'Record decision'}
              </button>
            </div>
            <p className="text-[10px] text-gray-400">
              Written to <code>gtm_cockpit.decisions</code> with your identity + timestamp, mirrored to an append-only audit table.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
