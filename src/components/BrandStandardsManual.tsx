import React, { useState } from 'react';
import { 
  BookOpen, 
  Search, 
  Sparkles, 
  CheckCircle2, 
  ShieldAlert, 
  FileText, 
  ArrowRight,
  Filter
} from 'lucide-react';
import { BRAND_STANDARDS } from '../data/mockFranchiseData';

export const BrandStandardsManual: React.FC = () => {
  const [search, setSearch] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const categories = ['All', 'Hygiene & Cleanliness', 'Uniform & Staff Standards', 'Brand Image & Signage', 'Equipment & Safety', 'Safety Compliance'];

  const filteredStandards = BRAND_STANDARDS.filter((s) => {
    const matchCat = selectedCategory === 'All' || s.category.includes(selectedCategory) || selectedCategory.includes(s.category);
    const matchSearch =
      s.title.toLowerCase().includes(search.toLowerCase()) ||
      s.code.toLowerCase().includes(search.toLowerCase()) ||
      s.mandate.toLowerCase().includes(search.toLowerCase()) ||
      s.penalty.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Brand standards and SOPs</h1>
            <span className="bg-indigo-50 text-indigo-700 border border-indigo-200 text-xs px-2.5 py-0.5 rounded-full font-bold">
              Reference
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Ground truth compliance rules ingested into FranchiseGuard AI's vector database to cross-reference multi-modal evidence with legally binding franchise agreements.
          </p>
        </div>

        <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl text-xs text-indigo-800 font-bold shadow-xs">
          {BRAND_STANDARDS.length} Core SOP Clauses Active
        </div>
      </div>

      {/* Search & Category Filter */}
      <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[260px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search SOP by clause code, keyword (e.g., grease, hairnet, cooler)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 text-xs text-slate-800 rounded-lg pl-9 pr-3 py-2 focus:outline-none focus:border-indigo-500 focus:bg-white"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Standards Clauses Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredStandards.map((std) => (
          <div key={std.code} className="p-5 bg-white border border-slate-200 rounded-xl space-y-3 flex flex-col justify-between shadow-sm hover:border-slate-300 transition-colors">
            <div className="space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-extrabold bg-indigo-50 border border-indigo-200 text-indigo-700 px-2 py-0.5 rounded">
                    {std.code}
                  </span>
                  <span className="text-[11px] text-slate-500 font-medium">{std.category}</span>
                </div>
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-red-50 text-red-700 border border-red-200">
                  Enforceable SOP
                </span>
              </div>

              <h3 className="text-sm font-bold text-slate-900">{std.title}</h3>
              <p className="text-xs text-slate-600 leading-relaxed font-normal">{std.mandate}</p>
            </div>

            <div className="space-y-2 pt-3 border-t border-slate-200">
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-[11px]">
                <span className="text-amber-800 font-bold">Non-Compliance Enforcement: </span>
                <span className="text-slate-700 font-medium">{std.penalty}</span>
              </div>

              <div className="flex items-center justify-between text-[11px] text-indigo-700">
                <span>RAG Similarity Matching: <strong className="text-slate-800">Active (0.88 Threshold)</strong></span>
                <span className="font-bold text-emerald-700">Automated CV & NLP Linking</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
