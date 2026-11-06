import { PieChart } from 'lucide-react';

function parseBillDate(value) {
  if (!value) return null;
  const text = String(value).trim();
  let match = text.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (match) return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  match = text.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/);
  if (match) return new Date(Number(match[3]), Number(match[2]) - 1, Number(match[1]));
  const parsed = new Date(text);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export default function SpentChart({ bills }) {
  const now = new Date();
  const thisMonthBills = bills.filter((bill) => {
    const date = parseBillDate(bill.date);
    return date && date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();
  });

  const categoryTotals = thisMonthBills.reduce((totals, bill) => {
    const category = bill.category || 'Other';
    const amount = Number(String(bill.total_amount ?? '').replace(/[₹,\s]/g, '')) || 0;
    totals[category] = (totals[category] || 0) + amount;
    return totals;
  }, {});
  const totalSpent = Object.values(categoryTotals).reduce((sum, amount) => sum + amount, 0);
  const monthLabel = now.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });

  if (bills.length === 0) return null;

  return (
    <section className="my-4 mx-auto max-w-md rounded-2xl border border-gray-100 bg-white p-5 shadow-sm" aria-label="Monthly spending breakdown">
      <div className="mb-4 flex items-center gap-2">
        <PieChart className="h-5 w-5 text-indigo-600" />
        <div><h3 className="font-bold text-gray-900">Monthly Spending</h3><p className="text-xs text-gray-500">{monthLabel}</p></div>
      </div>
      <div className="mb-4">
        <p className="text-xs font-semibold uppercase text-gray-500">Total tracked this month</p>
        <p className="text-2xl font-black text-indigo-600">₹{totalSpent.toFixed(2)}</p>
      </div>
      {Object.keys(categoryTotals).length === 0 ? (
        <p className="rounded-xl bg-gray-50 p-3 text-sm text-gray-500">No bills dated in {monthLabel} yet. Saved bills from other months are not included.</p>
      ) : (
        <div className="space-y-3">
          {Object.entries(categoryTotals).sort((a, b) => b[1] - a[1]).map(([category, amount]) => {
            const percentage = totalSpent > 0 ? (amount / totalSpent) * 100 : 0;
            return (
              <div key={category} className="text-sm">
                <div className="mb-1 flex justify-between gap-3 font-medium text-gray-700"><span>{category}</span><span>₹{amount.toFixed(2)} ({percentage.toFixed(0)}%)</span></div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100"><div className="h-full rounded-full bg-indigo-600 transition-all duration-500" style={{ width: `${percentage}%` }} /></div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
