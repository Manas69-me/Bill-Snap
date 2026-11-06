import { useEffect, useState } from 'react';
import CameraCapture from './components/cameraCapture';
import BillReview from './components/billReview';
import BillList from './components/billList';
import SpentChart from './components/spentChart';
import { analyzeBillImage } from './services/geminiService';
import { Receipt, Sparkles, ShieldCheck } from 'lucide-react';

const STORAGE_KEY = 'bill_snap_records';

function loadSavedBills() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    const parsed = stored ? JSON.parse(stored) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error('Could not load saved bills:', error);
    return [];
  }
}

export default function App() {
  const [bills, setBills] = useState(loadSavedBills);
  const [isLoading, setIsLoading] = useState(false);
  const [analysisError, setAnalysisError] = useState('');
  const [pendingExtraction, setPendingExtraction] = useState(null);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(bills));
    } catch (error) {
      console.error('Could not save bills locally:', error);
    }
  }, [bills]);

  const handleImageCaptured = async (imageData) => {
    setIsLoading(true);
    setAnalysisError('');
    setPendingExtraction(null);
    try {
      const result = await analyzeBillImage(imageData);
      setPendingExtraction(result);
    } catch (error) {
      console.error('Bill analysis failed:', error);
      setAnalysisError(error.message || 'Bill analysis failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveBill = (reviewedData) => {
    const newBill = {
      id: globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      merchant_name: reviewedData.merchant_name,
      date: reviewedData.date,
      total_amount: reviewedData.total_amount,
      category: reviewedData.category,
      model_used: pendingExtraction?.model_used || 'unknown',
      createdAt: new Date().toISOString(),
    };
    setBills((previous) => [newBill, ...previous]);
    setPendingExtraction(null);
    setAnalysisError('');
  };

  const handleDeleteBill = (id) => {
    setBills((previous) => previous.filter((bill) => bill.id !== id));
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      <header className="sticky top-0 z-30 border-b border-gray-100 bg-white shadow-sm">
        <div className="mx-auto flex max-w-md items-center justify-between px-4 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-100"><Receipt className="h-5 w-5" /></div>
            <div>
              <h1 className="text-lg font-bold leading-tight text-gray-900">Bill Snap</h1>
              <p className="flex items-center gap-1 text-xs text-gray-500"><span>AI Expense Assistant</span><Sparkles className="h-3 w-3 text-indigo-500" /></p>
            </div>
          </div>
          <div className="rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700">{bills.length} Bills Saved</div>
        </div>
      </header>

      <main className="px-4 pt-2">
        <CameraCapture onImageCaptured={handleImageCaptured} isLoading={isLoading} error={analysisError} />
        <SpentChart bills={bills} />
        <BillList bills={bills} onDelete={handleDeleteBill} />
        <p className="mx-auto mt-6 flex max-w-md items-center justify-center gap-1.5 px-4 text-center text-xs text-gray-400"><ShieldCheck className="h-3.5 w-3.5" /> Bills are stored in this browser on this device.</p>
      </main>

      {pendingExtraction && <BillReview extractedData={pendingExtraction} onSave={handleSaveBill} onCancel={() => setPendingExtraction(null)} />}
    </div>
  );
}
