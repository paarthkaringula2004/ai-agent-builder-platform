import type { CSSProperties } from "react";
import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import {
  ArrowRight,
  ArrowUpRight,
  Bot,
  Braces,
  CirclePlay,
  GitBranch,
  Sparkles,
  Workflow,
  Zap,
} from "lucide-react";

const canvasDots: CSSProperties = {
  backgroundImage:
    "radial-gradient(circle, rgba(148,163,184,0.19) 1px, transparent 1px)",
  backgroundSize: "22px 22px",
};

export default async function Home() {
  const { userId } = await auth();

  if (userId) {
    redirect("/dashboard");
  }

  return (
    <main className="relative min-h-svh overflow-hidden bg-[#080b13] text-white selection:bg-violet-400/30">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        <div className="absolute -left-56 -top-64 h-[620px] w-[620px] rounded-full bg-violet-600/20 blur-[150px]" />
        <div className="absolute -right-48 top-24 h-[560px] w-[560px] rounded-full bg-cyan-500/10 blur-[150px]" />
        <div className="absolute bottom-[-360px] left-[32%] h-[560px] w-[560px] rounded-full bg-blue-600/10 blur-[160px]" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(8,11,19,0.15)_0%,#080b13_100%)]" />
      </div>

      <header className="relative z-10 mx-auto flex w-full max-w-[1440px] items-center justify-between px-5 py-5 sm:px-8 lg:px-12 lg:py-7">
        <Link href="/" aria-label="Alpha Agents home" className="group flex items-center gap-3">
          <span className="relative grid size-11 place-items-center overflow-hidden rounded-2xl border border-white/15 bg-white/[0.07] shadow-[0_8px_30px_rgba(124,58,237,0.22)]">
            <span className="absolute inset-1 rounded-[12px] bg-gradient-to-br from-violet-300 via-blue-300 to-cyan-200 opacity-95 transition-transform duration-300 group-hover:rotate-6 group-hover:scale-110" />
            <Sparkles aria-hidden="true" className="relative size-5 text-[#111529]" strokeWidth={2.5} />
          </span>
          <span className="text-[18px] font-semibold tracking-[-0.04em] sm:text-xl">
            Alpha <span className="text-white/55">Agents</span>
          </span>
        </Link>

        <div className="flex items-center gap-3 sm:gap-5">
          <span className="hidden text-sm text-white/55 sm:inline">Already have an account?</span>
          <Link
            href="/sign-in"
            className="rounded-full px-3 py-2 text-sm font-medium text-white/80 transition hover:bg-white/[0.07] hover:text-white sm:px-4"
          >
            Sign in
          </Link>
        </div>
      </header>

      <section className="relative z-10 mx-auto grid min-h-[calc(100svh-104px)] w-full max-w-[1440px] items-center gap-14 px-5 pb-14 pt-10 sm:px-8 lg:min-h-[calc(100svh-112px)] lg:grid-cols-[0.94fr_1.06fr] lg:gap-10 lg:px-12 lg:pb-20 lg:pt-4">
        <div className="mx-auto w-full max-w-[640px] lg:mx-0 lg:pb-8">
          <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.045] px-3.5 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-violet-100/80 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] sm:text-xs">
            <span className="relative flex size-2">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-300 opacity-60" />
              <span className="relative inline-flex size-2 rounded-full bg-emerald-300" />
            </span>
            Your ideas, set in motion
          </div>

          <h1 className="max-w-[700px] text-[clamp(3.4rem,7.1vw,6.7rem)] font-semibold leading-[0.98] tracking-[-0.075em]">
            Welcome to
            <span className="mt-2 block bg-gradient-to-r from-white via-violet-100 to-cyan-200 bg-clip-text pb-2 text-transparent">
              Alpha Agents
            </span>
          </h1>

          <p className="mt-7 max-w-[550px] text-base leading-7 text-slate-300/75 sm:text-lg sm:leading-8">
            Turn your ideas into intelligent agents. Connect the steps, shape how
            they work, and bring your own AI workflows to life.
          </p>

          <div className="mt-9 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
            <Link
              href="/sign-up"
              className="group inline-flex min-h-14 items-center justify-center gap-3 rounded-full bg-white px-7 text-base font-semibold text-[#101321] shadow-[0_12px_45px_rgba(167,139,250,0.22)] transition duration-200 hover:-translate-y-0.5 hover:bg-violet-100 hover:shadow-[0_18px_55px_rgba(167,139,250,0.34)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[#080b13]"
            >
              Enter
              <span className="grid size-8 place-items-center rounded-full bg-[#111528] text-white transition-transform duration-200 group-hover:translate-x-1">
                <ArrowRight aria-hidden="true" className="size-4" />
              </span>
            </Link>
            <span className="text-sm text-white/45">Start building in your own workspace</span>
          </div>

          <div className="mt-14 flex flex-wrap gap-x-7 gap-y-3 border-t border-white/10 pt-6 text-sm text-white/55">
            <span className="inline-flex items-center gap-2">
              <Workflow aria-hidden="true" className="size-4 text-violet-200" />
              Visual workflows
            </span>
            <span className="inline-flex items-center gap-2">
              <Braces aria-hidden="true" className="size-4 text-cyan-200" />
              Connected tools
            </span>
            <span className="inline-flex items-center gap-2">
              <Zap aria-hidden="true" className="size-4 text-amber-200" />
              Built for action
            </span>
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-[720px] lg:ml-auto">
          <div
            aria-hidden="true"
            className="absolute -inset-8 rounded-[3rem] bg-gradient-to-br from-violet-500/15 via-transparent to-cyan-400/10 blur-2xl"
          />
          <div className="relative overflow-hidden rounded-[28px] border border-white/[0.12] bg-[#0d1220]/90 p-3 shadow-[0_35px_120px_rgba(0,0,0,0.55)] backdrop-blur-xl sm:rounded-[34px] sm:p-4">
            <div className="flex items-center justify-between border-b border-white/[0.08] px-3 pb-4 pt-2 sm:px-4">
              <div className="flex items-center gap-3">
                <span className="flex gap-1.5" aria-hidden="true">
                  <span className="size-2 rounded-full bg-rose-300/80" />
                  <span className="size-2 rounded-full bg-amber-200/80" />
                  <span className="size-2 rounded-full bg-emerald-300/80" />
                </span>
                <span className="text-xs font-medium text-white/60 sm:text-sm">Agent workspace</span>
              </div>
              <span className="rounded-full border border-emerald-300/15 bg-emerald-300/[0.08] px-2.5 py-1 text-[10px] font-medium tracking-wide text-emerald-100/80 sm:text-[11px]">
                WORKFLOW CANVAS
              </span>
            </div>

            <div className="relative mt-3 min-h-[360px] overflow-hidden rounded-[22px] border border-white/[0.07] bg-[#0a0f1b] sm:min-h-[440px] sm:rounded-[26px]" style={canvasDots}>
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_45%,rgba(95,76,180,0.13),transparent_62%)]" />
              <div className="absolute left-5 top-5 flex items-center gap-2 text-[11px] font-medium text-white/40 sm:left-7 sm:top-7 sm:text-xs">
                <GitBranch aria-hidden="true" className="size-3.5" />
                Untitled workflow
              </div>

              <svg
                aria-hidden="true"
                viewBox="0 0 700 410"
                preserveAspectRatio="none"
                className="absolute inset-0 h-full w-full opacity-70"
              >
                <defs>
                  <linearGradient id="workflow-line" x1="0" x2="1" y1="0" y2="1">
                    <stop offset="0%" stopColor="#a78bfa" stopOpacity="0.65" />
                    <stop offset="100%" stopColor="#67e8f9" stopOpacity="0.65" />
                  </linearGradient>
                </defs>
                <path d="M 182 207 C 203 207, 202 146, 224 146" fill="none" stroke="url(#workflow-line)" strokeWidth="1.6" />
                <path d="M 427 146 C 448 146, 434 207, 455 207" fill="none" stroke="url(#workflow-line)" strokeWidth="1.6" />
                <path d="M 658 207 C 687 207, 687 290, 658 290" fill="none" stroke="url(#workflow-line)" strokeWidth="1.6" />
                <circle cx="182" cy="207" r="3" fill="#c4b5fd" />
                <circle cx="224" cy="146" r="3" fill="#c4b5fd" />
                <circle cx="427" cy="146" r="3" fill="#93c5fd" />
                <circle cx="455" cy="207" r="3" fill="#67e8f9" />
                <circle cx="658" cy="207" r="3" fill="#67e8f9" />
                <circle cx="658" cy="290" r="3" fill="#67e8f9" />
              </svg>

              <div className="absolute left-[3%] top-[44%] flex w-[23%] min-w-[92px] items-center gap-2 rounded-2xl border border-white/10 bg-[#111827]/95 px-2.5 py-3 shadow-[0_10px_32px_rgba(0,0,0,0.38)] sm:gap-3 sm:px-3.5 sm:py-3.5">
                <span className="grid size-8 shrink-0 place-items-center rounded-xl bg-amber-200/15 text-amber-100 sm:size-9">
                  <CirclePlay aria-hidden="true" className="size-4 sm:size-[18px]" />
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-[11px] font-semibold text-white/90 sm:text-sm">Start</span>
                  <span className="block truncate text-[9px] text-white/40 sm:text-[11px]">User input</span>
                </span>
              </div>

              <div className="absolute left-[32%] top-[28%] flex w-[29%] min-w-[125px] items-center gap-2 rounded-2xl border border-violet-300/20 bg-[#171529]/95 px-2.5 py-3 shadow-[0_10px_42px_rgba(124,58,237,0.16)] sm:gap-3 sm:px-3.5 sm:py-3.5">
                <span className="grid size-8 shrink-0 place-items-center rounded-xl bg-violet-300/15 text-violet-100 sm:size-9">
                  <Bot aria-hidden="true" className="size-4 sm:size-[18px]" />
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-[11px] font-semibold text-white/90 sm:text-sm">AI Agent</span>
                  <span className="block truncate text-[9px] text-white/40 sm:text-[11px]">Understands intent</span>
                </span>
                <Sparkles aria-hidden="true" className="ml-auto hidden size-4 shrink-0 text-violet-200/70 sm:block" />
              </div>

              <div className="absolute left-[65%] top-[43%] flex w-[29%] min-w-[110px] items-center gap-2 rounded-2xl border border-cyan-200/20 bg-[#101b25]/95 px-2.5 py-3 shadow-[0_10px_42px_rgba(34,211,238,0.12)] sm:gap-3 sm:px-3.5 sm:py-3.5">
                <span className="grid size-8 shrink-0 place-items-center rounded-xl bg-cyan-200/15 text-cyan-100 sm:size-9">
                  <Workflow aria-hidden="true" className="size-4 sm:size-[18px]" />
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-[11px] font-semibold text-white/90 sm:text-sm">Choose a tool</span>
                  <span className="block truncate text-[9px] text-white/40 sm:text-[11px]">Route the next step</span>
                </span>
              </div>

              <div className="absolute left-[65%] top-[63%] flex w-[29%] min-w-[110px] items-center gap-2 rounded-2xl border border-emerald-200/15 bg-[#111d1b]/95 px-2.5 py-3 shadow-[0_10px_32px_rgba(0,0,0,0.38)] sm:gap-3 sm:px-3.5 sm:py-3.5">
                <span className="grid size-8 shrink-0 place-items-center rounded-xl bg-emerald-200/15 text-emerald-100 sm:size-9">
                  <ArrowUpRight aria-hidden="true" className="size-4 sm:size-[18px]" />
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-[11px] font-semibold text-white/90 sm:text-sm">Take action</span>
                  <span className="block truncate text-[9px] text-white/40 sm:text-[11px]">Return a result</span>
                </span>
              </div>

              <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between rounded-2xl border border-white/[0.08] bg-[#111827]/85 px-3.5 py-3 backdrop-blur sm:bottom-5 sm:left-5 sm:right-5 sm:px-4">
                <div className="flex items-center gap-2.5">
                  <span className="grid size-8 place-items-center rounded-xl bg-white/[0.07] text-white/75">
                    <Sparkles aria-hidden="true" className="size-4" />
                  </span>
                  <div>
                    <p className="text-[11px] font-medium text-white/85 sm:text-xs">Your next idea starts here</p>
                    <p className="mt-0.5 text-[10px] text-white/40 sm:text-[11px]">Create a workflow that works your way</p>
                  </div>
                </div>
                <span className="hidden items-center gap-1.5 rounded-full border border-white/10 px-2.5 py-1 text-[10px] text-white/45 sm:inline-flex">
                  <span className="size-1.5 rounded-full bg-violet-300" />
                  Ready
                </span>
              </div>
            </div>
          </div>

          <div className="absolute -right-2 -top-5 hidden items-center gap-2.5 rounded-2xl border border-white/10 bg-[#121827]/95 px-3.5 py-3 shadow-[0_18px_60px_rgba(0,0,0,0.45)] sm:flex lg:-right-5 lg:top-10">
            <span className="grid size-9 place-items-center rounded-xl bg-violet-300/15 text-violet-100">
              <Sparkles aria-hidden="true" className="size-[18px]" />
            </span>
            <span>
              <span className="block text-xs font-semibold">Built around your ideas</span>
              <span className="mt-0.5 block text-[10px] text-white/45">No two workflows need to be alike</span>
            </span>
          </div>
        </div>
      </section>
    </main>
  );
}
