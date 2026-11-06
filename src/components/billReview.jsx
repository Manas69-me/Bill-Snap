import { useState } from 'react';
import { AlertTriangle, Save, X, CheckCircle2 } from 'lucide-react';

const CATEGORIES = ['Food', 'Utilities', 'Groceries', 'Transport', 'Entertainment', 'Shopping', 'Other'];

function amountToNumber(value) {
  const cleaned = String(value ?? '').replace(/[₹,$\s]/g, '').replace(/,/g, '');
  if (!cleaned || !/^\d+(\.\d{1,2})?$/.test(cleaned)) return null;
  const amount = Number(cleaned);
  return Number.isFinite(amount) && amount > 0 ? amount : null;
}

export default function BillReview({ extractedData, onSave, onCancel }) {
  const [formData, setFormData] = useState({
    merchant_name: extractedData.merchant_name || '',
    date: extractedData.date || '',
    total_amount: extractedData.total_amount || '',
    category: CATEGORIES.includes(extractedData.category) ? extractedData.category : 'Other',
  });
  const [validationError, setValidationError] = useState('');
  const uncertainFields = extractedData.uncertain_fields || [];
  const isNotABill = extractedData.is_bill === false;

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((previous) => ({ ...previous, [name]: value }));
    setValidationError('');
  };

  const handleSave = () => {
    if (!formData.merchant_name.trim()) {
      setValidationError('Please enter the merchant name before saving.');
      return;
    }
    const amount = amountToNumber(formData.total_amount);
    if (amount === null) {
      setValidationError('Enter a valid total amount greater than zero.');
      return;
    }
    if (!formData.date.trim()) {
      setValidationError('Please enter the bill date before saving.');
      return;
    }
    onSave({ ...formData, merchant_name: formData.merchant_name.trim(), total_amount: amount.toFixed(2) });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm" role="presentation">
      <section className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-gray-100 bg-white p-6 shadow-2xl" role="dialog" aria-modal="true" aria-labelledby="review-title">
        <div className="mb-4 flex items-center justify-between">
          <h2 id="review-title" className="text-xl font-bold text-gray-900">{isNotABill ? 'Not a Bill' : 'Review & Edit Bill'}</h2>
          <button type="button" onClick={onCancel} aria-label="Close review" className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700"><X className="h-6 w-6" /></button>
        </div>

        {isNotABill ? (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <p className="mb-1 font-semibold">Image not recognized as a bill</p>
            <p>{extractedData.reason || "This image doesn't appear to be a bill, receipt, or invoice. Please try another photo."}</p>
          </div>
        ) : (
          <>
            <div className="mb-4 flex items-start gap-2 rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-800">
              <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0" />
              <span>Check the extracted details and correct anything before saving.</span>
            </div>
            {uncertainFields.length > 0 && (
              <div className="mb-4 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-600" />
                <span>AI is unsure about: <strong>{uncertainFields.join(', ')}</strong>. Please verify these fields.</span>
              </div>
            )}

            <div className="mb-6 space-y-4">
              <Field label="Merchant name" uncertain={uncertainFields.includes('merchant_name')}>
                <input name="merchant_name" value={formData.merchant_name} onChange={handleChange} autoComplete="organization" className={inputClass(uncertainFields.includes('merchant_name'))} placeholder="e.g. FreshMart" />
              </Field>
              <Field label="Total amount (₹)" uncertain={uncertainFields.includes('total_amount')}>
                <input name="total_amount" value={formData.total_amount} onChange={handleChange} inputMode="decimal" className={inputClass(uncertainFields.includes('total_amount'))} placeholder="e.g. 650.00" />
              </Field>
              <Field label="Bill date" uncertain={uncertainFields.includes('date')}>
                <input name="date" value={formData.date} onChange={handleChange} className={inputClass(uncertainFields.includes('date'))} placeholder="YYYY-MM-DD or printed date" />
              </Field>
              <Field label="Category" uncertain={uncertainFields.includes('category')}>
                <select name="category" value={formData.category} onChange={handleChange} className={inputClass(false)}>
                  {CATEGORIES.map((category) => <option key={category} value={category}>{category}</option>)}
                </select>
              </Field>
            </div>
            {validationError && <p className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700" role="alert">{validationError}</p>}
          </>
        )}

        <div className="flex gap-3">
          <button type="button" onClick={onCancel} className="flex-1 rounded-xl bg-gray-100 py-3 font-medium text-gray-700 transition hover:bg-gray-200">{isNotABill ? 'Close' : 'Cancel'}</button>
          {!isNotABill && <button type="button" onClick={handleSave} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 font-semibold text-white shadow-md transition hover:bg-indigo-700"><Save className="h-5 w-5" /> Save Bill</button>}
        </div>
      </section>
    </div>
  );
}

function Field({ label, uncertain, children }) {
  return (
    <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500">
      <span className="mb-1 block">{label} {uncertain && <span className="text-amber-600">· Please verify</span>}</span>
      {children}
    </label>
  );
}

function inputClass(uncertain) {
  return `w-full rounded-xl border px-4 py-2.5 text-base font-normal normal-case tracking-normal text-gray-900 outline-none focus:ring-2 ${uncertain ? 'border-amber-400 bg-amber-50/30 focus:ring-amber-500' : 'border-gray-200 bg-white focus:ring-indigo-500'}`;
}
