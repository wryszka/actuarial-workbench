import { X } from 'lucide-react';

interface AboutModalProps {
  open: boolean;
  onClose: () => void;
}

export default function AboutModal({ open, onClose }: AboutModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">About this demo</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4 text-sm text-gray-700">
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Purpose</h3>
            <p>Built by Databricks Field Engineering as an <strong>internal GTM planning aid</strong> layered on top of Salesforce — not a system of record.</p>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Data</h3>
            <ul className="space-y-1 list-disc list-inside">
              <li>Consumption = trailing-12-month <strong>LIST $</strong>, a relative ranking proxy, <strong>not</strong> billed revenue</li>
              <li>Sub-industry and incumbent fields are partly name-inferred</li>
              <li>Duplicate Salesforce records split some logos' figures (see Data Quality view)</li>
              <li>All data is synthetic-safe internal GTM data</li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Decisions</h3>
            <p>Decisions written here land in <code className="bg-gray-100 px-2 py-1 rounded text-xs">gtm_cockpit.decisions</code> with audit trail (user, timestamp, rationale). They do <strong>not</strong> change Salesforce.</p>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Governance</h3>
            <p>All data is governed in Unity Catalog (<code className="bg-gray-100 px-2 py-1 rounded text-xs">lr_dev_aws_us_catalog.gtm_cockpit</code>) with role-based access control and decision audit trail.</p>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-2">EMEA Replicability</h3>
            <p>The EMEA Replicability view shows a documented <strong>estimate</strong> based on a proven UKI playbook, not a modelled book. Use as a planning signal only.</p>
          </div>

          <div className="pt-4 border-t border-gray-200">
            <p className="text-xs text-gray-500">Questions? See the <a href="https://github.com/wryszka/actuarial-workbench" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">GitHub repo</a> README or contact Field Engineering.</p>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}
