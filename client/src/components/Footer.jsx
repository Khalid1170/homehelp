import React from 'react';

export default function Footer() {
  return (
    <footer className="bg-white border-t border-slate-200/80 py-8 mt-auto">
      <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-medium text-slate-400">
        <div>
          <span className="font-bold text-slate-800">Homehelp</span> © {new Date().getFullYear()}. All Rights Reserved.
        </div>
        <div className="flex gap-6 tracking-wide">
          <a href="#privacy" className="hover:text-slate-600 transition">Privacy Policy</a>
          <a href="#terms" className="hover:text-slate-600 transition">Terms of Service</a>
          <a href="#support" className="hover:text-slate-600 transition">Support Platform</a>
        </div>
      </div>
    </footer>
  );
}