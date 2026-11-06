import { Trash2, Receipt, Calendar, Tag } from 'lucide-react';

export default function BillList({ bills, onDelete }) {
  if (bills.length === 0) {
    return (
      <div className="text-center py-10 px-4 bg-white rounded-2xl border border-gray-100 shadow-sm max-w-md mx-auto my-4">
        <Receipt className="w-12 h-12 text-gray-300 mx-auto mb-2" />
        <p className="text-gray-500 font-medium">No saved bills yet.</p>
        <p className="text-xs text-gray-400 mt-1">Snap a bill above to get started!</p>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto my-4 space-y-3">
      <h3 className="text-lg font-bold text-gray-900 px-1">Saved Bills ({bills.length})</h3>
      {bills.map((bill) => (
        <div key={bill.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center flex-shrink-0 text-indigo-600 font-bold">
              {bill.merchant_name ? bill.merchant_name.charAt(0).toUpperCase() : 'M'}
            </div>
            <div>
              <h4 className="font-semibold text-gray-900">{bill.merchant_name || 'Unknown Merchant'}</h4>
              <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {bill.date || 'No Date'}</span>
                <span>•</span>
                <span className="flex items-center gap-1 bg-gray-100 px-2 py-0.5 rounded-md text-gray-600">
                  <Tag className="w-3 h-3" /> {bill.category || 'Other'}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="font-bold text-gray-900 text-lg">₹{bill.total_amount}</span>
            <button
              onClick={() => onDelete(bill.id)}
              className="text-gray-400 hover:text-red-500 p-1.5 transition-colors rounded-lg hover:bg-red-50"
              title="Delete Bill"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}