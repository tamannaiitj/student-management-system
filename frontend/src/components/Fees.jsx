import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { CreditCard, Plus, CheckCircle, AlertCircle, FileText, Printer, Search } from 'lucide-react';

export function Fees() {
  const [fees, setFees] = useState([]);
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null);

  // Invoice Modal
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [invoiceForm, setInvoiceForm] = useState({
    student_id: '',
    title: 'Semester Tuition Fee',
    amount: '45000',
    due_date: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]
  });

  // Payment Receipt Modal
  const [receiptData, setReceiptData] = useState(null);

  const loadFees = async () => {
    setLoading(true);
    try {
      const data = await api.getFees(filterStatus !== 'ALL' ? { status: filterStatus } : {});
      setFees(data || []);
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFees();
  }, [filterStatus]);

  const handleCreateInvoice = async (e) => {
    e.preventDefault();
    try {
      await api.createFee({
        ...invoiceForm,
        amount: Number(invoiceForm.amount)
      });
      setMessage({ type: 'success', text: 'Fee invoice created successfully.' });
      setIsInvoiceModalOpen(false);
      loadFees();
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  const handlePay = async (fee) => {
    const payment_mode = window.prompt('Enter payment method (UPI / Card / Cash / Net Banking):', 'UPI');
    if (!payment_mode) return;

    try {
      const res = await api.payFee(fee.id, { payment_mode });
      setMessage({ type: 'success', text: `Payment recorded! Receipt No: ${res.invoice.receipt_no}` });
      setReceiptData({ ...fee, ...res.invoice });
      loadFees();
      setTimeout(() => setMessage(null), 4000);
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  const totalBilled = fees.reduce((acc, f) => acc + Number(f.amount), 0);
  const totalPaid = fees.filter((f) => f.status === 'Paid').reduce((acc, f) => acc + Number(f.amount), 0);
  const totalPending = fees.filter((f) => f.status === 'Pending').reduce((acc, f) => acc + Number(f.amount), 0);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">B.Tech Fee Management</h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Track tuition fee invoices, record payments, and generate official student fee receipts.
          </p>
        </div>
        <button
          onClick={() => setIsInvoiceModalOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm px-4 py-2.5 rounded-xl shadow-sm hover:shadow flex items-center space-x-2 transition"
        >
          <Plus className="w-4 h-4" />
          <span>Issue Fee Invoice</span>
        </button>
      </div>

      {message && (
        <div
          className={`p-4 rounded-xl text-sm flex items-center space-x-2 border ${
            message.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* Financial Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-xs font-bold uppercase text-slate-500 tracking-wider">Total Invoiced</p>
          <p className="text-2xl font-black text-slate-800 mt-1">₹{totalBilled.toLocaleString()}</p>
          <p className="text-xs text-slate-400 mt-1">Across all semesters</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-emerald-200 bg-emerald-50/20 shadow-sm">
          <p className="text-xs font-bold uppercase text-emerald-700 tracking-wider">Total Collected</p>
          <p className="text-2xl font-black text-emerald-700 mt-1">₹{totalPaid.toLocaleString()}</p>
          <p className="text-xs text-emerald-600 mt-1">Cleared payments</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-amber-200 bg-amber-50/20 shadow-sm">
          <p className="text-xs font-bold uppercase text-amber-700 tracking-wider">Outstanding Dues</p>
          <p className="text-2xl font-black text-amber-700 mt-1">₹{totalPending.toLocaleString()}</p>
          <p className="text-xs text-amber-600 mt-1">Pending student balances</p>
        </div>
      </div>

      {/* Filter and Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex justify-between items-center flex-wrap gap-3">
          <h3 className="font-bold text-sm text-slate-800">Invoices & Records</h3>
          <div className="flex gap-2">
            {['ALL', 'Pending', 'Paid'].map((st) => (
              <button
                key={st}
                onClick={() => setFilterStatus(st)}
                className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition ${
                  filterStatus === st
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-xs font-bold uppercase text-slate-500 tracking-wider">
              <tr>
                <th className="px-5 py-3.5">Invoice #</th>
                <th className="px-5 py-3.5">Roll No</th>
                <th className="px-5 py-3.5">Student</th>
                <th className="px-5 py-3.5">Title</th>
                <th className="px-5 py-3.5">Amount</th>
                <th className="px-5 py-3.5">Due Date</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="8" className="px-5 py-8 text-center text-slate-500">
                    Loading fee invoices...
                  </td>
                </tr>
              ) : fees.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-5 py-12 text-center text-slate-500">
                    No fee invoices found.
                  </td>
                </tr>
              ) : (
                fees.map((f) => (
                  <tr key={f.id} className="hover:bg-slate-50/70 transition">
                    <td className="px-5 py-3.5 font-mono text-xs font-semibold text-slate-500">
                      INV-{String(f.id).padStart(4, '0')}
                    </td>
                    <td className="px-5 py-3.5 font-mono text-xs font-bold text-indigo-700">
                      {f.student_id}
                    </td>
                    <td className="px-5 py-3.5 font-semibold text-slate-800">
                      {f.first_name ? `${f.first_name} ${f.last_name || ''}` : f.student_id}
                    </td>
                    <td className="px-5 py-3.5 text-slate-600 text-xs">{f.title}</td>
                    <td className="px-5 py-3.5 font-extrabold text-slate-900">
                      ₹{Number(f.amount).toLocaleString()}
                    </td>
                    <td className="px-5 py-3.5 text-xs text-slate-500">{f.due_date}</td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-bold border ${
                          f.status === 'Paid'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}
                      >
                        {f.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      {f.status === 'Paid' ? (
                        <button
                          onClick={() => setReceiptData(f)}
                          className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-lg transition inline-flex items-center space-x-1"
                        >
                          <FileText className="w-3.5 h-3.5 text-indigo-600" />
                          <span>Receipt</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => handlePay(f)}
                          className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-lg shadow transition"
                        >
                          Record Payment
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Issue Invoice Modal */}
      {isInvoiceModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-xl font-bold text-slate-900">Issue Fee Invoice</h3>
            <p className="text-xs text-slate-500 mt-1">Assign tuition or exam fee dues to a student.</p>

            <form onSubmit={handleCreateInvoice} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase">Student Roll No</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. BT2026CSE01"
                  value={invoiceForm.student_id}
                  onChange={(e) => setInvoiceForm({ ...invoiceForm, student_id: e.target.value })}
                  className="mt-1 w-full text-sm bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase">Invoice Title</label>
                <input
                  type="text"
                  required
                  value={invoiceForm.title}
                  onChange={(e) => setInvoiceForm({ ...invoiceForm, title: e.target.value })}
                  className="mt-1 w-full text-sm bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase">Amount (₹ INR)</label>
                <input
                  type="number"
                  required
                  min="0"
                  value={invoiceForm.amount}
                  onChange={(e) => setInvoiceForm({ ...invoiceForm, amount: e.target.value })}
                  className="mt-1 w-full text-sm bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase">Due Date</label>
                <input
                  type="date"
                  required
                  value={invoiceForm.due_date}
                  onChange={(e) => setInvoiceForm({ ...invoiceForm, due_date: e.target.value })}
                  className="mt-1 w-full text-sm bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsInvoiceModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 shadow"
                >
                  Issue Invoice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Official Receipt Modal */}
      {receiptData && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100">
            <div className="flex justify-between items-start border-b border-slate-200 pb-4">
              <div>
                <span className="text-xs uppercase font-extrabold text-emerald-600 tracking-wider">Payment Cleared</span>
                <h3 className="text-xl font-black text-slate-900 mt-1">Official Fee Receipt</h3>
                <p className="text-xs font-mono text-slate-500 mt-0.5">Receipt: {receiptData.receipt_no}</p>
              </div>
              <button
                onClick={() => window.print()}
                className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition"
                title="Print Receipt"
              >
                <Printer className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 space-y-3 text-sm">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Student Roll No:</span>
                <span className="font-mono font-bold text-slate-800">{receiptData.student_id}</span>
              </div>
              {receiptData.first_name && (
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Student Name:</span>
                  <span className="font-semibold text-slate-800">{receiptData.first_name} {receiptData.last_name}</span>
                </div>
              )}
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Fee Particulars:</span>
                <span className="font-semibold text-slate-800">{receiptData.title}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Amount Paid:</span>
                <span className="font-extrabold text-emerald-700 text-base">₹{Number(receiptData.amount).toLocaleString()}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Payment Date:</span>
                <span className="text-slate-700">{receiptData.paid_date || new Date().toISOString().split('T')[0]}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Payment Mode:</span>
                <span className="text-slate-700 font-medium">{receiptData.payment_mode || 'Cash'}</span>
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <button
                onClick={() => setReceiptData(null)}
                className="px-5 py-2 bg-slate-900 text-white font-semibold text-sm rounded-xl hover:bg-slate-800 shadow"
              >
                Close Receipt
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

