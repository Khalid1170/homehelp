import React from "react";

export default function FinancialOverview({ stats }) {

  const grossVol = stats?.finance?.total_gross_volume || 0;
  const platformFees = stats?.finance?.estimated_platform_fees || 0;
  const payouts = stats?.finance?.net_worker_payouts || 0;

  const chartMax = Math.max(grossVol, 1);

  const feeHeight = (platformFees / chartMax) * 120;
  const payoutHeight = (payouts / chartMax) * 120;

  return (
    <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">

      {/* LEFT SIDE */}
      <div className="lg:col-span-2 grid grid-cols-2 gap-4">

        {/* GROSS */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Gross Transaction Volume
          </p>

          <p className="text-3xl font-black text-white mt-1.5 tracking-tight">
            £{grossVol}
          </p>

          <div className="w-full bg-slate-950 h-2 rounded-full mt-4 overflow-hidden">
            <div
              className="bg-white h-full"
              style={{ width: "100%" }}
            ></div>
          </div>
        </div>

        {/* PLATFORM FEES */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
          <p className="text-xs font-bold text-blue-400 uppercase tracking-wider">
            Estimated Platform Cut (15%)
          </p>

          <p className="text-3xl font-black text-blue-400 mt-1.5 tracking-tight">
            £{platformFees}
          </p>

          <div className="w-full bg-slate-950 h-2 rounded-full mt-4 overflow-hidden">
            <div
              className="bg-blue-500 h-full"
              style={{
                width: `${(platformFees / chartMax) * 100}%`
              }}
            ></div>
          </div>
        </div>

        {/* PAYOUTS */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
          <p className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
            Net Specialist Capital Payouts
          </p>

          <p className="text-3xl font-black text-emerald-400 mt-1.5 tracking-tight">
            £{payouts}
          </p>

          <div className="w-full bg-slate-950 h-2 rounded-full mt-4 overflow-hidden">
            <div
              className="bg-emerald-400 h-full"
              style={{
                width: `${(payouts / chartMax) * 100}%`
              }}
            ></div>
          </div>
        </div>

        {/* COUNTERS */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center justify-around text-center">

          <div>
            <p className="text-xs font-bold text-slate-500 uppercase">
              Profiles
            </p>

            <p className="text-xl font-black text-white mt-1">
              {stats?.counters?.total_users}
            </p>
          </div>

          <div>
            <p className="text-xs font-bold text-slate-500 uppercase">
              Total Assignments
            </p>

            <p className="text-xl font-black text-white mt-1">
              {stats?.counters?.total_jobs}
            </p>
          </div>

        </div>
      </div>

      {/* RIGHT SVG CHART */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex flex-col justify-between">

        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
          Ecosystem Capital Architecture
        </p>

        <div className="w-full flex items-end justify-center gap-8 h-36 pt-4 border-b border-slate-800">

          {/* GROSS */}
          <div className="flex flex-col items-center gap-2 w-12">
            <div
              className="w-full bg-slate-700 rounded-t-md transition-all duration-500"
              style={{ height: "120px" }}
            ></div>

            <span className="text-[10px] font-bold text-slate-500">
              GROSS
            </span>
          </div>

          {/* FEES */}
          <div className="flex flex-col items-center gap-2 w-12">
            <div
              className="w-full bg-blue-500 rounded-t-md transition-all duration-500"
              style={{ height: `${feeHeight}px` }}
            ></div>

            <span className="text-[10px] font-bold text-blue-400">
              FEES
            </span>
          </div>

          {/* PAYOUTS */}
          <div className="flex flex-col items-center gap-2 w-12">
            <div
              className="w-full bg-emerald-400 rounded-t-md transition-all duration-500"
              style={{ height: `${payoutHeight}px` }}
            ></div>

            <span className="text-[10px] font-bold text-emerald-400">
              NET
            </span>
          </div>

        </div>
      </div>

    </section>
  );
}