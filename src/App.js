import React, { useState } from 'react';
import { 
  BookOpen, 
  RefreshCcw, 
  Info,
  CheckCircle2,
  AlertCircle,
  Plus,
  ArrowRight,
  Calculator,
  Wallet,
  History
} from 'lucide-react';

// --- Constants & Data ---

const INITIAL_ACCOUNTS = {
  // Assets (A)
  cash: { id: 'cash', name: 'Cash', type: 'asset', clearType: 'A', balance: 0, entries: [] },
  supplies: { id: 'supplies', name: 'Supplies', type: 'asset', clearType: 'A', balance: 0, entries: [] },
  equipment: { id: 'equipment', name: 'Equipment', type: 'asset', clearType: 'A', balance: 0, entries: [] },
  accounts_receivable: { id: 'accounts_receivable', name: 'Accts Receivable', type: 'asset', clearType: 'A', balance: 0, entries: [] },
  
  // Liabilities (L)
  accounts_payable: { id: 'accounts_payable', name: 'Accts Payable', type: 'liability', clearType: 'L', balance: 0, entries: [] },
  notes_payable: { id: 'notes_payable', name: 'Notes Payable', type: 'liability', clearType: 'L', balance: 0, entries: [] },
  
  // Capital (C)
  capital: { id: 'capital', name: 'Owner\'s Capital', type: 'equity', clearType: 'C', balance: 0, entries: [] },
  
  // Revenue (R)
  revenue: { id: 'revenue', name: 'Service Revenue', type: 'equity', clearType: 'R', balance: 0, entries: [] },
  
  // Expenses (E)
  expenses: { id: 'expenses', name: 'Expenses', type: 'equity', clearType: 'E', balance: 0, entries: [] }, 
};

// Color mapping for the CLEAR blocks
const CLEAR_CONFIG = {
  C: { label: 'Capital', color: 'bg-indigo-500', border: 'border-indigo-600', shadow: 'shadow-indigo-900' },
  L: { label: 'Liabilities', color: 'bg-rose-500', border: 'border-rose-600', shadow: 'shadow-rose-900' },
  E: { label: 'Expenses', color: 'bg-amber-500', border: 'border-amber-600', shadow: 'shadow-amber-900' },
  A: { label: 'Assets', color: 'bg-emerald-500', border: 'border-emerald-600', shadow: 'shadow-emerald-900' },
  R: { label: 'Revenue', color: 'bg-blue-500', border: 'border-blue-600', shadow: 'shadow-blue-900' },
};

const ACCOUNT_TYPES = [
  { id: 'A', label: 'Asset (A)', type: 'asset', desc: 'Items of value owned (Cash, Inventory)' },
  { id: 'L', label: 'Liability (L)', type: 'liability', desc: 'Debts owed to others (Loans, Payables)' },
  { id: 'C', label: 'Capital (C)', type: 'equity', desc: 'Owner\'s investment' },
  { id: 'R', label: 'Revenue (R)', type: 'equity', desc: 'Income earned from sales/services' },
  { id: 'E', label: 'Expense (E)', type: 'equity', desc: 'Costs to operate business (Rent, Wages)' },
];

const DEFAULT_SCENARIOS = [
  {
    id: 1,
    title: "Owner Invests Cash",
    description: "Start business with $10,000 cash.",
    amount: 10000,
    dr: 'cash',
    cr: 'capital',
    explanation: "Cash (Asset) increases. Capital (Equity) increases.",
    impact: ['A', 'C']
  },
  {
    id: 2,
    title: "Buy Supplies (Cash)",
    description: "Buy $500 supplies with cash.",
    amount: 500,
    dr: 'supplies',
    cr: 'cash',
    explanation: "Asset exchange: Supplies UP, Cash DOWN.",
    impact: ['A']
  },
  {
    id: 3,
    title: "Buy Equipment (Credit)",
    description: "Buy $2,000 computer on credit.",
    amount: 2000,
    dr: 'equipment',
    cr: 'accounts_payable',
    explanation: "Equipment (Asset) UP, Accts Payable (Liability) UP.",
    impact: ['A', 'L']
  },
  {
    id: 4,
    title: "Service Revenue",
    description: "Earn $1,500 cash from service.",
    amount: 1500,
    dr: 'cash',
    cr: 'revenue',
    explanation: "Cash UP, Revenue UP (increases Equity).",
    impact: ['A', 'R']
  },
  {
    id: 5,
    title: "Pay Rent",
    description: "Pay $800 rent with cash.",
    amount: 800,
    dr: 'expenses',
    cr: 'cash',
    explanation: "Expenses UP (lowers Equity), Cash DOWN.",
    impact: ['E', 'A']
  }
];

// --- Helper Components ---

const Cuboid = ({ letter, value, config, isActive, maxVal }) => {
  const fillPercent = Math.min(100, Math.max(15, (value / maxVal) * 100));
  
  return (
    <div className={`flex flex-col items-center gap-2 transition-transform duration-500 ${isActive ? 'scale-110 -translate-y-2' : 'scale-100'}`}>
      <div className="relative w-16 h-24 md:w-20 md:h-32 group perspective-1000">
        <div 
          className={`absolute bottom-0 left-0 w-full transition-all duration-700 ease-out flex items-end justify-center rounded-sm overflow-hidden ${config.shadow} shadow-lg`}
          style={{ height: `${fillPercent}%` }}
        >
          <div className={`w-full h-full ${config.color} opacity-90 relative`}>
            <div className="absolute top-0 left-0 right-0 h-1/3 bg-gradient-to-b from-white/30 to-transparent"></div>
          </div>
        </div>
        <div className="absolute inset-0 border-2 border-slate-300 rounded-sm bg-slate-50/10 pointer-events-none"></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`text-3xl md:text-4xl font-black drop-shadow-md ${value > 0 ? 'text-white' : 'text-slate-300'}`}>
            {letter}
          </span>
        </div>
        {value > 0 && (
          <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-white px-2 py-0.5 rounded-md shadow-sm border border-slate-100 text-[10px] font-bold text-slate-600 whitespace-nowrap animate-in fade-in slide-in-from-bottom-2">
            ${value.toLocaleString()}
          </div>
        )}
      </div>
      <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{config.label}</div>
    </div>
  );
};

const EquationBar = ({ assets, liabilities, equity, maxVal }) => {
  // Ensure we have at least some width for visibility if values are 0
  const assetWidth = Math.max(0, (assets / maxVal) * 100);
  const liabilityWidth = Math.max(0, (liabilities / maxVal) * 100);
  const equityWidth = Math.max(0, (equity / maxVal) * 100);

  return (
    <div className="w-full space-y-2">
       <div className="flex justify-between items-end mb-1">
          <div className="text-sm font-bold text-emerald-700">ASSETS</div>
          <div className="text-xs font-mono text-slate-400">THE ACCOUNTING EQUATION</div>
          <div className="text-sm font-bold text-blue-700">LIABILITIES + EQUITY</div>
       </div>
       
       <div className="flex items-center gap-2 md:gap-4 h-14">
          {/* Assets Side */}
          <div className="flex-1 h-full bg-slate-100 rounded-lg border border-slate-200 relative overflow-hidden flex items-center justify-end pr-2">
             <div 
                className="absolute left-0 top-0 bottom-0 bg-emerald-500 transition-all duration-700 ease-out opacity-80"
                style={{ width: `${assetWidth}%` }}
             ></div>
             <span className="relative z-10 font-bold text-slate-700">${assets.toLocaleString()}</span>
          </div>

          <div className="text-xl font-black text-slate-300">=</div>

          {/* L + E Side */}
          <div className="flex-1 h-full bg-slate-100 rounded-lg border border-slate-200 relative overflow-hidden flex">
             {/* Liabilities Part */}
             <div 
                className="h-full bg-rose-500 transition-all duration-700 ease-out flex items-center justify-center opacity-80"
                style={{ width: `${liabilityWidth}%` }}
             >
                {liabilityWidth > 15 && <span className="text-white text-xs font-bold drop-shadow-md truncate px-1">L: ${liabilities.toLocaleString()}</span>}
             </div>
             {/* Equity Part */}
             <div 
                className="h-full bg-blue-500 transition-all duration-700 ease-out flex items-center justify-center opacity-80"
                style={{ width: `${equityWidth}%` }}
             >
                {equityWidth > 15 && <span className="text-white text-xs font-bold drop-shadow-md truncate px-1">E: ${equity.toLocaleString()}</span>}
             </div>
             
             {/* Total Label for Right Side */}
             <div className="ml-auto pr-2 self-center relative z-10 font-bold text-slate-700">
               ${(liabilities + equity).toLocaleString()}
             </div>
          </div>
       </div>
    </div>
  );
};

const TAccount = ({ account, highlight }) => {
  return (
    <div className={`
      relative bg-white rounded-lg shadow-sm border transition-all duration-300
      ${highlight ? 'border-blue-400 ring-2 ring-blue-100 z-10' : 'border-slate-200'}
    `}>
      <div className={`p-1.5 text-center border-b border-slate-100 ${highlight ? 'bg-blue-50' : 'bg-slate-50'}`}>
        <h3 className="font-bold text-slate-800 text-xs truncate">{account.name}</h3>
        <div className="text-[9px] text-slate-400 uppercase">{account.clearType}</div>
      </div>
      <div className="relative p-1 min-h-[100px] text-xs">
        <div className="absolute top-0 bottom-0 left-1/2 w-px bg-slate-200"></div>
        <div className="flex h-full">
          <div className="flex-1 px-1">
            {account.entries.filter(e => e.side === 'dr').map((entry, idx) => (
              <div key={idx} className="flex justify-between text-slate-600">
                <span className="font-mono text-[10px] text-emerald-600">${entry.amount}</span>
              </div>
            ))}
          </div>
          <div className="flex-1 px-1">
            {account.entries.filter(e => e.side === 'cr').map((entry, idx) => (
              <div key={idx} className="flex justify-between text-slate-600 justify-end">
                <span className="font-mono text-[10px] text-rose-600">${entry.amount}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 bg-slate-50/90 border-t border-slate-100 flex justify-between px-2 py-1 font-bold">
          <span className="text-[10px]">BAL</span>
          <span className={account.balance < 0 ? 'text-rose-500' : 'text-emerald-600'}>
            ${account.balance.toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  );
};

// --- Main App ---

const App = () => {
  // Initialize state with a deep copy so we never mutate the constant INITIAL_ACCOUNTS
  const [accounts, setAccounts] = useState(() => JSON.parse(JSON.stringify(INITIAL_ACCOUNTS)));
  const [history, setHistory] = useState([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [lastAction, setLastAction] = useState(null);
  const [mode, setMode] = useState('scenarios'); // 'scenarios', 'custom', 'accounts', 'history'
  
  // Custom Transaction Form State
  const [customTx, setCustomTx] = useState({
    description: '',
    amount: '',
    dr: 'cash',
    cr: 'revenue'
  });

  // Add Account Form State
  const [newAccount, setNewAccount] = useState({
    name: '',
    clearType: 'A'
  });

  // Calculations
  const totals = {
    C: accounts.capital.balance,
    L: accounts.accounts_payable.balance + accounts.notes_payable.balance,
    E: accounts.expenses.balance,
    A: Object.values(accounts).filter(a => a.clearType === 'A').reduce((sum, a) => sum + a.balance, 0),
    R: accounts.revenue.balance,
  };

  // Recalculate L + E totals dynamically based on all accounts
  Object.keys(totals).forEach(key => {
    totals[key] = Object.values(accounts)
      .filter(a => a.clearType === key)
      .reduce((sum, a) => sum + a.balance, 0);
  });

  // Equation: Assets = Liabilities + Equity (Where Equity = Capital + Revenue - Expenses)
  const totalEquity = totals.C + totals.R - totals.E;
  const isBalanced = totals.A === (totals.L + totalEquity);
  const maxTotal = Math.max(totals.A, totals.L + totalEquity, 20000);

  const handleTransaction = (scenario) => {
    // Deep copy the accounts state before modifying it
    const newAccounts = JSON.parse(JSON.stringify(accounts));
    
    const step = currentStep + 1;
    const amount = parseFloat(scenario.amount);

    // Update DR
    const drAccount = newAccounts[scenario.dr];
    drAccount.entries.push({ step, amount, side: 'dr' });
    if (['A', 'E'].includes(drAccount.clearType)) drAccount.balance += amount;
    else drAccount.balance -= amount;

    // Update CR
    const crAccount = newAccounts[scenario.cr];
    crAccount.entries.push({ step, amount, side: 'cr' });
    if (['A', 'E'].includes(crAccount.clearType)) crAccount.balance -= amount;
    else crAccount.balance += amount;

    setAccounts(newAccounts);
    setHistory([...history, { ...scenario, step }]); // Ensure step is included in history
    setCurrentStep(step);
    
    // Determine CLEAR letters impacted for animation
    const impact = [drAccount.clearType, crAccount.clearType];
    
    setLastAction({
      ...scenario,
      drName: drAccount.name,
      crName: crAccount.name,
      impact
    });
  };

  const handleCustomSubmit = (e) => {
    e.preventDefault();
    if (!customTx.amount || !customTx.description) return;
    
    handleTransaction({
      id: Date.now(),
      title: "Custom Entry",
      description: customTx.description,
      amount: customTx.amount,
      dr: customTx.dr,
      cr: customTx.cr,
      explanation: "User generated custom transaction.",
    });
    
    setCustomTx(prev => ({ ...prev, amount: '', description: '' }));
  };

  const handleCreateAccount = (e) => {
    e.preventDefault();
    if (!newAccount.name) return;

    const id = newAccount.name.toLowerCase().replace(/[^a-z0-9]/g, '_');
    
    if (accounts[id]) {
      alert("Account ID already exists!");
      return;
    }

    const typeConfig = ACCOUNT_TYPES.find(t => t.id === newAccount.clearType);

    const newAcc = {
      id,
      name: newAccount.name,
      type: typeConfig.type,
      clearType: newAccount.clearType,
      balance: 0,
      entries: []
    };

    setAccounts(prev => ({ ...prev, [id]: newAcc }));
    setNewAccount({ name: '', clearType: 'A' });
    setMode('custom'); // Switch back to custom transaction mode
  };

  const reset = () => {
    setAccounts(JSON.parse(JSON.stringify(INITIAL_ACCOUNTS)));
    setHistory([]);
    setCurrentStep(0);
    setLastAction(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-20">
      
      {/* Header */}
      <header className="bg-slate-900 text-white p-4 sticky top-0 z-50 shadow-md">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-500 p-2 rounded-lg">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold tracking-tight hidden sm:block">Visual Accounting Tutor</h1>
          </div>
          <button 
            onClick={reset}
            className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs font-medium transition-colors border border-slate-700"
          >
            <RefreshCcw className="w-3 h-3" /> Reset
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 md:p-6 space-y-8">

        {/* SECTION 1: VISUALIZATION AREA */}
        <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          
          {/* 1A. CLEAR Cuboids */}
          <div className="flex flex-col items-center mb-8">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">CLEAR Model Visualization</h2>
            <div className="flex flex-wrap justify-center items-end gap-3 md:gap-8 min-h-[140px]">
              {['C', 'L', 'E', 'A', 'R'].map((letter) => (
                <Cuboid 
                  key={letter}
                  letter={letter}
                  value={totals[letter]}
                  config={CLEAR_CONFIG[letter]}
                  maxVal={maxTotal}
                  isActive={lastAction && lastAction.impact.includes(letter)}
                />
              ))}
            </div>
          </div>

          {/* 1B. Accounting Equation Bar */}
          <div className="pt-6 border-t border-slate-100">
             <EquationBar 
                assets={totals.A} 
                liabilities={totals.L} 
                equity={totalEquity}
                maxVal={maxTotal}
             />
             <div className="mt-4 flex justify-center">
                <div className={`px-4 py-1.5 rounded-full text-xs font-bold flex items-center gap-2 transition-colors duration-500 ${isBalanced ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                  {isBalanced ? <CheckCircle2 className="w-4 h-4"/> : <AlertCircle className="w-4 h-4"/>}
                  {isBalanced ? 'EQUATION BALANCED' : 'EQUATION UNBALANCED'}
                </div>
             </div>
          </div>
        </section>

        {/* SECTION 2: CONTROLS & LEDGER */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* LEFT: CONTROLS (4 Cols) */}
          <div className="lg:col-span-4 space-y-4">
            
            {/* Control Tabs */}
            <div className="flex p-1 bg-slate-200 rounded-lg">
              <button 
                onClick={() => setMode('scenarios')}
                className={`flex-1 py-2 text-[10px] sm:text-xs font-bold rounded-md transition-all ${mode === 'scenarios' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
              >
                SCENARIOS
              </button>
              <button 
                onClick={() => setMode('custom')}
                className={`flex-1 py-2 text-[10px] sm:text-xs font-bold rounded-md transition-all ${mode === 'custom' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
              >
                BUILDER
              </button>
              <button 
                onClick={() => setMode('accounts')}
                className={`flex-1 py-2 text-[10px] sm:text-xs font-bold rounded-md transition-all ${mode === 'accounts' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
              >
                ACCOUNTS
              </button>
              <button 
                onClick={() => setMode('history')}
                className={`flex-1 py-2 text-[10px] sm:text-xs font-bold rounded-md transition-all ${mode === 'history' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
              >
                HISTORY
              </button>
            </div>

            {mode === 'scenarios' && (
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="max-h-[400px] overflow-y-auto p-2 space-y-2">
                  {DEFAULT_SCENARIOS.map((scenario) => (
                    <button
                      key={scenario.id}
                      onClick={() => handleTransaction(scenario)}
                      className="w-full text-left p-3 rounded-lg border border-transparent hover:border-indigo-100 hover:bg-indigo-50 transition-all group relative"
                    >
                      <div className="flex justify-between items-start mb-1">
                        <span className="font-semibold text-slate-700 text-sm">{scenario.title}</span>
                        <span className="bg-slate-100 text-slate-600 text-[10px] font-mono py-0.5 px-1.5 rounded border border-slate-200">
                          ${scenario.amount.toLocaleString()}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500">{scenario.description}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {mode === 'custom' && (
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 animate-in fade-in slide-in-from-left-4">
                <div className="flex items-center gap-2 mb-4 text-indigo-600">
                  <Calculator className="w-4 h-4" />
                  <h3 className="font-bold text-sm">Create Transaction</h3>
                </div>
                <form onSubmit={handleCustomSubmit} className="space-y-3">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Description</label>
                    <input 
                      type="text" 
                      required
                      placeholder="e.g. Paid Advertising"
                      className="w-full text-sm p-2 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      value={customTx.description}
                      onChange={e => setCustomTx({...customTx, description: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Amount ($)</label>
                    <input 
                      type="number" 
                      required
                      min="1"
                      placeholder="0.00"
                      className="w-full text-sm p-2 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      value={customTx.amount}
                      onChange={e => setCustomTx({...customTx, amount: e.target.value})}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-bold text-emerald-600 uppercase">Debit Account</label>
                      <select 
                        className="w-full text-xs p-2 border border-emerald-200 bg-emerald-50 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        value={customTx.dr}
                        onChange={e => setCustomTx({...customTx, dr: e.target.value})}
                      >
                        {Object.values(accounts).map(acc => (
                          <option key={acc.id} value={acc.id}>{acc.name} ({acc.clearType})</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-rose-600 uppercase">Credit Account</label>
                      <select 
                        className="w-full text-xs p-2 border border-rose-200 bg-rose-50 rounded-md focus:outline-none focus:ring-2 focus:ring-rose-500"
                        value={customTx.cr}
                        onChange={e => setCustomTx({...customTx, cr: e.target.value})}
                      >
                         {Object.values(accounts).map(acc => (
                          <option key={acc.id} value={acc.id}>{acc.name} ({acc.clearType})</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <button 
                    type="submit" 
                    className="w-full mt-2 bg-indigo-600 text-white py-2 rounded-lg text-sm font-bold hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <Plus className="w-4 h-4" /> Add Transaction
                  </button>
                </form>
              </div>
            )}

            {mode === 'accounts' && (
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 animate-in fade-in slide-in-from-right-4">
                <div className="flex items-center gap-2 mb-4 text-emerald-600">
                  <Wallet className="w-4 h-4" />
                  <h3 className="font-bold text-sm">Add New Account</h3>
                </div>
                <form onSubmit={handleCreateAccount} className="space-y-4">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Account Name</label>
                    <input 
                      type="text" 
                      required
                      placeholder="e.g. Bank Loan, Advertising Exp"
                      className="w-full text-sm p-2 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      value={newAccount.name}
                      onChange={e => setNewAccount({...newAccount, name: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Account Type (CLEAR)</label>
                    <div className="space-y-2 mt-1">
                      {ACCOUNT_TYPES.map(type => (
                        <label 
                          key={type.id} 
                          className={`flex items-center p-2 rounded-lg border cursor-pointer transition-all ${newAccount.clearType === type.id ? 'border-emerald-500 bg-emerald-50' : 'border-slate-100 hover:border-emerald-200'}`}
                        >
                          <input 
                            type="radio" 
                            name="accountType"
                            className="text-emerald-500 focus:ring-emerald-500"
                            checked={newAccount.clearType === type.id}
                            onChange={() => setNewAccount({...newAccount, clearType: type.id})}
                          />
                          <div className="ml-3">
                            <div className="text-xs font-bold text-slate-700">{type.label}</div>
                            <div className="text-[9px] text-slate-500">{type.desc}</div>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                  <button 
                    type="submit" 
                    className="w-full bg-emerald-600 text-white py-2 rounded-lg text-sm font-bold hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <Plus className="w-4 h-4" /> Create Account
                  </button>
                </form>
              </div>
            )}

            {mode === 'history' && (
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden animate-in fade-in slide-in-from-right-4">
                 <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center gap-2 text-indigo-600">
                    <History className="w-4 h-4" />
                    <h3 className="font-bold text-sm">Transaction History</h3>
                 </div>
                 {history.length === 0 ? (
                    <div className="p-8 text-center text-slate-400 text-xs italic">
                       No transactions recorded yet.
                    </div>
                 ) : (
                    <div className="max-h-[400px] overflow-y-auto p-0">
                       <table className="w-full text-left text-xs">
                          <thead className="bg-slate-50 sticky top-0 z-10 text-[10px] text-slate-400 uppercase font-bold border-b border-slate-100">
                             <tr>
                                <th className="px-3 py-2">#</th>
                                <th className="px-3 py-2">Details</th>
                                <th className="px-3 py-2 text-right">Amount</th>
                             </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-50">
                             {history.slice().reverse().map((item, index) => (
                                <tr key={index} className="hover:bg-indigo-50/50 transition-colors">
                                   <td className="px-3 py-3 font-mono text-slate-400">{item.step}</td>
                                   <td className="px-3 py-3">
                                      <div className="font-bold text-slate-700 mb-1">{item.title || "Transaction"}</div>
                                      <div className="text-[10px] text-slate-500 mb-1">{item.description}</div>
                                      <div className="flex gap-1 flex-wrap">
                                         <span className="bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded text-[9px] font-mono whitespace-nowrap">
                                            DR: {accounts[item.dr]?.name || item.dr}
                                         </span>
                                         <span className="bg-rose-100 text-rose-700 px-1.5 py-0.5 rounded text-[9px] font-mono whitespace-nowrap">
                                            CR: {accounts[item.cr]?.name || item.cr}
                                         </span>
                                      </div>
                                   </td>
                                   <td className="px-3 py-3 text-right font-bold text-slate-800">
                                      ${parseFloat(item.amount).toLocaleString()}
                                   </td>
                                </tr>
                             ))}
                          </tbody>
                       </table>
                    </div>
                 )}
              </div>
            )}

            {/* Analysis Box */}
            <div className="bg-slate-800 text-white rounded-xl p-4 shadow-lg min-h-[120px]">
               <div className="flex items-center gap-2 mb-2">
                 <Info className="w-4 h-4 text-indigo-400" />
                 <span className="font-bold uppercase text-xs tracking-wider">Analysis</span>
               </div>
               {lastAction ? (
                 <div className="animate-in fade-in slide-in-from-bottom-2">
                   <p className="text-sm font-medium mb-3 leading-snug opacity-90">"{lastAction.explanation}"</p>
                   <div className="flex gap-2 text-[10px]">
                     <span className="bg-emerald-500/20 text-emerald-300 px-2 py-1 rounded font-mono border border-emerald-500/30">
                       DR: {lastAction.drName}
                     </span>
                     <span className="bg-rose-500/20 text-rose-300 px-2 py-1 rounded font-mono border border-rose-500/30">
                       CR: {lastAction.crName}
                     </span>
                   </div>
                 </div>
               ) : (
                 <p className="text-slate-400 text-xs italic">Select or create a transaction to see analysis...</p>
               )}
            </div>
          </div>

          {/* RIGHT: T-ACCOUNTS (8 Cols) */}
          <div className="lg:col-span-8">
             <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 h-full">
               <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">General Ledger</h3>
               <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
                 {/* Sort by CLEAR order */}
                 {['C', 'L', 'E', 'A', 'R'].map(type => 
                    Object.values(accounts)
                      .filter(acc => acc.clearType === type)
                      .map(account => (
                        <TAccount 
                          key={account.id} 
                          account={account} 
                          highlight={lastAction && (lastAction.dr === account.id || lastAction.cr === account.id)}
                        />
                      ))
                 )}
               </div>
             </div>
          </div>

        </div>
      </main>
    </div>
  );
};

export default App;
