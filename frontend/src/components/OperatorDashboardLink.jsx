'use client';
import { useRouter } from 'next/navigation';

export default function OperatorDashboardLink() {
  const router = useRouter();

  return (
    <button
      onClick={() => router.push('/operator-dashboard')}
      className="fixed bottom-8 right-8 px-6 py-3 bg-gradient-to-r from-[#4C3BCF] to-[#6B5CE6] hover:from-[#4C3BCF]/90 hover:to-[#6B5CE6]/90 rounded-xl text-white font-semibold shadow-2xl shadow-[#4C3BCF]/50 hover:scale-105 transition-all duration-300 flex items-center gap-2 z-50"
    >
      <span className="text-xl">🤖</span>
      <span>AI Operator Dashboard</span>
    </button>
  );
}
