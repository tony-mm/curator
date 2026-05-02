import React from 'react';
import { NavLink } from 'react-router-dom';
import Sidebar from './Sidebar';

const Pricing = () => {
  const tiers = [
    {
      name: 'Free',
      price: '$0',
      period: 'month',
      features: ['1,000 links/month', 'Basic analytics', 'Community support'],
      cta: 'Get Started',
      highlighted: false,
    },
    {
      name: 'Pro',
      price: '$12',
      period: 'month',
      features: ['Unlimited links', 'Advanced analytics', 'Priority support', 'Custom domains', 'QR codes'],
      cta: 'Start Free Trial',
      highlighted: true,
    },
    {
      name: 'Enterprise',
      price: 'Custom',
      period: '',
      features: ['Everything in Pro', 'SSO & 2FA', 'Dedicated account manager', 'SLA guarantee', 'Custom integrations'],
      cta: 'Contact Sales',
      highlighted: false,
    },
  ];

  return (
    <div className="flex min-h-screen">
      <Sidebar />

      <main className="flex-1 flex flex-col min-w-0 md:ml-64">
        <header className="w-full h-16 flex justify-between items-center px-6 sticky top-0 bg-white border-b border-slate-200 z-40">
          <div className="flex items-center flex-1 max-w-xl">
            <div className="relative w-full">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">search</span>
              <input
                className="w-full border border-slate-300 rounded-full py-2 pl-10 pr-4 text-sm text-slate-900 placeholder-slate-400 focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                placeholder="Search plans..."
                type="text"
              />
            </div>
          </div>

          <div className="flex items-center gap-4 ml-6">
            <button className="relative p-2 text-slate-600 hover:text-primary rounded-md">
              <span className="material-symbols-outlined">notifications</span>
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
            </button>
            <button className="p-2 text-slate-600 hover:text-primary rounded-md">
              <span className="material-symbols-outlined">help</span>
            </button>
          </div>
        </header>

        <div className="p-8 max-w-6xl mx-auto w-full bg-white">
          <div className="text-center mb-12">
            <h1 className="text-3xl font-bold text-slate-900 mb-4">Simple, transparent pricing</h1>
            <p className="text-slate-600">Choose the plan that fits your needs. All plans include a 14-day free trial.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {tiers.map((tier) => (
              <div
                key={tier.name}
                className={`bg-white border rounded-lg p-8 ${
                  tier.highlighted ? 'border-2 border-primary shadow-md' : 'border-slate-200'
                }`}
              >
                <h2 className="text-xl font-bold text-slate-900 mb-2">{tier.name}</h2>
                <div className="mb-6">
                  <span className="text-4xl font-bold text-slate-900">{tier.price}</span>
                  {tier.period && <span className="text-slate-500">/{tier.period}</span>}
                </div>
                <ul className="space-y-3 mb-8">
                  {tier.features.map((feature, idx) => (
                    <li key={idx} className="flex items-center gap-2 text-sm text-slate-700">
                      <span className="material-symbols-outlined text-primary text-sm">check_circle</span>
                      {feature}
                    </li>
                  ))}
                </ul>
                <button
                  className={`w-full py-3 rounded-md font-medium ${
                    tier.highlighted
                      ? 'bg-primary text-white hover:bg-primary-container'
                      : 'bg-slate-100 text-slate-900 hover:bg-slate-200'
                  }`}
                >
                  {tier.cta}
                </button>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Pricing;
