"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useTheme } from 'next-themes';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowRight,
  BookOpen,
  Wallet,
  ShieldCheck,
  Sun,
  Moon,
  BarChart3,
  X,
  Sparkles,
  CheckCircle2,
  Users,
  ClipboardList,
  Layers,
} from 'lucide-react';

// Animation Constants
const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } };
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };
const initialForm = { name: '', email: '', organization: '', role: 'Student', message: '' };

export default function Home() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [showDemoModal, setShowDemoModal] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [formState, setFormState] = useState('idle');
  const [formError, setFormError] = useState('');

  useEffect(() => setMounted(true), []);

  const handleInput = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setFormState('idle');
    setFormError('');
  };

  const saveRequest = (request) => {
    if (typeof window === 'undefined') return;
    const existing = JSON.parse(window.localStorage.getItem('academy_demo_requests') || '[]');
    window.localStorage.setItem('academy_demo_requests', JSON.stringify([request, ...existing]));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!form.name || !form.email || !form.organization || !form.message) {
      setFormState('error');
      setFormError('Please complete every field so we can respond accurately.');
      return;
    }
    if (!form.email.includes('@') || !form.email.includes('.')) {
      setFormState('error');
      setFormError('Please enter a valid email address.');
      return;
    }

    const request = {
      id: Date.now().toString(),
      ...form,
      createdAt: new Date().toISOString(),
    };

    saveRequest(request);
    setFormState('success');
    setForm(initialForm);
    setTimeout(() => setShowDemoModal(false), 1400);
  };

  return (
    <div className="min-h-screen overflow-hidden bg-slate-50 text-slate-900 selection:bg-indigo-500/30 dark:bg-slate-950 dark:text-white">
      <nav className="fixed inset-x-0 top-0 z-50 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl px-6 py-5 shadow-sm shadow-slate-900/5 dark:border-slate-800/80 dark:bg-slate-950/90 sm:px-10">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-3 text-xl font-semibold tracking-tight text-slate-900 dark:text-white">
            <div className="grid h-11 w-11 place-items-center rounded-3xl bg-gradient-to-br from-indigo-500 to-violet-500 shadow-lg shadow-violet-500/20">A</div>
            <span>Academia</span>
          </Link>
          <div className="flex items-center gap-4">
            <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="rounded-full border border-slate-200/70 bg-white p-2 text-slate-900 transition hover:border-slate-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800">
              {mounted && (theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />)}
            </button>
            <Link href="/login" className="rounded-full px-4 py-2 text-sm font-medium text-slate-900 transition hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800">
              Login
            </Link>
            <button onClick={() => setShowDemoModal(true)} className="rounded-md bg-gradient-to-r from-indigo-500 to-violet-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 transition hover:scale-[1.02]">
              Book a Demo
            </button>
          </div>
        </div>
      </nav>

      <main className="relative pt-28">
        <section className="relative mx-auto grid max-w-7xl gap-12 px-6 pb-24 lg:grid-cols-[1.15fr_0.85fr] lg:items-center lg:px-10">
          <motion.div variants={container} initial="hidden" animate="show" className="space-y-8">
            <motion.span variants={item} className="inline-flex rounded-full bg-slate-100/80 px-5 py-2 text-xs font-semibold uppercase tracking-[0.32em] text-slate-700 ring-1 ring-slate-200 dark:bg-slate-900/80 dark:text-slate-200 dark:ring-white/10">
              Transform learning with a smarter LMS
            </motion.span>

            <motion.div variants={item} className="space-y-6">
              <h1 className="text-5xl font-semibold leading-tight tracking-[-0.04em] text-slate-950 sm:text-6xl dark:text-white">
                The modern school platform that makes administration feel effortless.
              </h1>
              <p className="max-w-xl text-lg text-slate-600 sm:text-xl dark:text-slate-300">
                Build a unified learning experience for students, teachers, coordinators, and administrators with polished workflows, secure access, and instant reporting.
              </p>
            </motion.div>

            <motion.div variants={item} className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <button onClick={() => setShowDemoModal(true)} className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 px-7 py-4 text-sm font-semibold text-white shadow-xl shadow-indigo-500/20 transition hover:scale-[1.02]">
                Book a live demo <ArrowRight size={18} />
              </button>
              <Link href="/signup" className="inline-flex items-center justify-center rounded-full border border-white/10 bg-white/5 px-7 py-4 text-sm font-semibold text-slate-100 transition hover:border-indigo-300/60 hover:text-white">
                Start free trial
              </Link>
            </motion.div>

            <motion.div variants={item} className="grid gap-4 sm:grid-cols-3">
              {[
                { label: 'Fast setup', icon: Sparkles },
                { label: 'Secure data', icon: ShieldCheck },
                { label: 'Role-based access', icon: Users },
              ].map((feature) => {
                const Icon = feature.icon;
                return (
                  <div key={feature.label} className="rounded-3xl border border-slate-200/70 bg-white/80 p-5 text-sm text-slate-700 shadow-sm shadow-slate-900/5 dark:border-slate-800/80 dark:bg-slate-900/90 dark:text-slate-200 dark:shadow-none">
                    <div className="mb-3 inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-300">
                      <Icon size={20} />
                    </div>
                    <p className="font-semibold">{feature.label}</p>
                    <p className="mt-2 text-slate-500 dark:text-slate-400">Premium-grade workflow for modern campuses.</p>
                  </div>
                );
              })}
            </motion.div>
          </motion.div>

          <motion.div variants={item} className="relative overflow-hidden rounded-[2.5rem] border border-white/10 bg-slate-900/70 p-4 shadow-2xl shadow-slate-950/40">
            <div className="relative overflow-hidden rounded-[2rem] bg-slate-950">
              <Image src="/hero.jpg" alt="Academia hero" width={980} height={760} className="h-full w-full object-cover" />
            </div>
            <div className="mt-6 rounded-[1.75rem] border border-white/10 bg-slate-950/95 p-6 text-slate-300 shadow-inner shadow-slate-950/10">
              <p className="text-xs uppercase tracking-[0.35em] text-indigo-300">Built for modern education</p>
              <p className="mt-3 text-xl font-semibold text-white">A clean campus experience with less noise and more action.</p>
              <p className="mt-2 text-sm leading-7 text-slate-400">Easy onboarding, secure role access, and polished workflows for every learner, teacher, and campus leader.</p>
            </div>
          </motion.div>
        </section>

        <section className="mx-auto max-w-7xl px-6 pb-24 lg:px-10">
          <div className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
            <div className="rounded-[2rem] border border-white/10 bg-slate-900/80 p-8 shadow-2xl shadow-slate-950/30">
              <h2 className="text-3xl font-semibold text-white">Everything your school needs</h2>
              <p className="mt-4 max-w-xl text-slate-400">From attendance and fee workflows to classroom resources and leadership visibility, every feature is built for student success and better teacher time.</p>
              <div className="mt-8 space-y-4 text-sm text-slate-300">
                <div className="flex gap-3"><CheckCircle2 className="mt-1 text-indigo-400" size={18} /><span>Students get one place for classes, assignments, attendance, and progress.</span></div>
                <div className="flex gap-3"><CheckCircle2 className="mt-1 text-indigo-400" size={18} /><span>Teachers manage lessons, gradebooks, and communication with ease.</span></div>
                <div className="flex gap-3"><CheckCircle2 className="mt-1 text-indigo-400" size={18} /><span>School leaders track performance, fees, and compliance from clear dashboards.</span></div>
              </div>
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              {[
                { label: 'Student engagement', icon: BookOpen, description: 'Interactive learning tools and clear progress tracking for every classroom.' },
                { label: 'Teacher workflow', icon: ClipboardList, description: 'Simplified planning, grading, and communication in one portal.' },
                { label: 'School operations', icon: Wallet, description: 'Attendance, fees, and reports that keep every campus running smoothly.' },
                { label: 'Secure learning', icon: ShieldCheck, description: 'Safe access controls and privacy across students, staff, and records.' },
              ].map((feature) => {
                const Icon = feature.icon;
                return (
                  <div key={feature.label} className="rounded-[2rem] border border-white/10 bg-slate-900/80 p-6 text-slate-100 shadow-lg shadow-slate-950/20">
                    <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-3xl bg-white/5 text-indigo-300">
                      <Icon size={24} />
                    </div>
                    <h3 className="text-xl font-semibold text-white">{feature.label}</h3>
                    <p className="mt-3 text-sm text-slate-400">{feature.description}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/10 bg-slate-950/90 py-10 text-center text-sm text-slate-500 shadow-inner shadow-slate-950/20">
        Developed by Taha Sarfaraz · LMS Version 1.0.0
      </footer>

      <AnimatePresence>
        {showDemoModal && (
          <motion.div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 px-4 py-10" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className="w-full max-w-2xl overflow-hidden rounded-[2rem] border border-white/10 bg-slate-950/95 p-8 shadow-2xl shadow-slate-950/40" initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 30, opacity: 0 }}>
              <button onClick={() => setShowDemoModal(false)} className="absolute right-6 top-6 inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-slate-900/90 text-slate-200 transition hover:bg-white/10">
                <X size={20} />
              </button>
              <div className="space-y-4 rounded-[1.75rem] bg-slate-900/90 p-6">
                <p className="text-xs uppercase tracking-[0.35em] text-indigo-300">Book a demo</p>
                <h2 className="text-3xl font-semibold text-white">Tell us how Academia can help your school</h2>
                <p className="text-sm leading-7 text-slate-400">Share your priorities and we’ll match you with the right plan for students, teachers, and school leaders.</p>
              </div>
              <form onSubmit={handleSubmit} className="mt-8 grid gap-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="space-y-2 text-sm text-slate-200">
                    <span>Name</span>
                    <input
                      type="text"
                      value={form.name}
                      onChange={(e) => handleInput('name', e.target.value)}
                      className="w-full rounded-3xl border border-white/10 bg-slate-900/90 px-4 py-3 text-sm text-white outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20"
                      placeholder="Your name"
                    />
                  </label>
                  <label className="space-y-2 text-sm text-slate-200">
                    <span>Email</span>
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) => handleInput('email', e.target.value)}
                      className="w-full rounded-3xl border border-white/10 bg-slate-900/90 px-4 py-3 text-sm text-white outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20"
                      placeholder="name@school.com"
                    />
                  </label>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="space-y-2 text-sm text-slate-200">
                    <span>Organization</span>
                    <input
                      type="text"
                      value={form.organization}
                      onChange={(e) => handleInput('organization', e.target.value)}
                      className="w-full rounded-3xl border border-white/10 bg-slate-900/90 px-4 py-3 text-sm text-white outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20"
                      placeholder="School or institution"
                    />
                  </label>
                  <label className="space-y-2 text-sm text-slate-200">
                    <span>Your Role</span>
                    <select
                      value={form.role}
                      onChange={(e) => handleInput('role', e.target.value)}
                      className="w-full rounded-3xl border border-white/10 bg-slate-900/90 px-4 py-3 text-sm text-white outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20"
                    >
                      {['Student', 'Teacher', 'Coordinator', 'Finance', 'Principal'].map((role) => (
                        <option key={role} value={role} className="bg-slate-900 text-white">
                          {role}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
                <label className="space-y-2 text-sm text-slate-200">
                  <span>What are you looking for?</span>
                  <textarea
                    value={form.message}
                    onChange={(e) => handleInput('message', e.target.value)}
                    rows={4}
                    className="w-full rounded-3xl border border-white/10 bg-slate-900/90 px-4 py-3 text-sm text-white outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20"
                    placeholder="Tell us your goals, challenges, or required modules."
                  />
                </label>
                {formState === 'error' && <p className="text-sm text-rose-300">{formError}</p>}
                {formState === 'success' && (
                  <div className="rounded-3xl bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200 ring-1 ring-emerald-500/20">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 size={18} />
                      Request submitted successfully. We will follow up with a personalized demo soon.
                    </div>
                  </div>
                )}
                <button type="submit" className="inline-flex items-center justify-center gap-2 rounded-full bg-indigo-500 px-6 py-4 text-sm font-semibold text-white transition hover:bg-indigo-400">
                  Send request <ArrowRight size={18} />
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

