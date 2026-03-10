// OnboardingModal.tsx — first-time user walkthrough

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Terminal, FolderOpen, Bug, Sparkles, ArrowRight, X, CheckCircle } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { useAuthStore } from '../../store/authStore';

interface Props {
  onClose: () => void;
}

const STEPS = [
  {
    icon: <FolderOpen size={28} />,
    color: 'bg-indigo-50 text-indigo-600',
    title: 'Create your first project',
    desc: 'A project is your codebase. Give it a name, pick the language, and optionally link your GitHub repo.',
    action: 'Create a Project',
    route: '/projects',
  },
  {
    icon: <Bug size={28} />,
    color: 'bg-blue-50 text-blue-600',
    title: 'Log a debug session',
    desc: 'Hit a bug? Log a session. Paste the error message and stack trace. Set severity. Done.',
    action: 'Log a Session',
    route: '/sessions',
  },
  {
    icon: <Sparkles size={28} />,
    color: 'bg-green-50 text-green-600',
    title: 'Get an AI fix',
    desc: 'Open any session and click "Get AI Fix". Groq + Llama 3 analyzes your error and suggests a fix in seconds.',
    action: 'See Sessions',
    route: '/sessions',
  },
];

const OnboardingModal = ({ onClose }: Props) => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [completing, setCompleting] = useState(false);

  const markOnboarded = async () => {
    if (!user) return;
    await supabase.from('profiles').update({ onboarded: true }).eq('id', user.id);
  };

  const handleNext = async () => {
    if (step < STEPS.length - 1) {
      setStep(step + 1);
    } else {
      await handleFinish();
    }
  };

  const handleFinish = async () => {
    setCompleting(true);
    await markOnboarded();
    onClose();
    navigate(STEPS[step].route);
  };

  const handleSkip = async () => {
    await markOnboarded();
    onClose();
  };

  const handleAction = async () => {
    await markOnboarded();
    onClose();
    navigate(STEPS[step].route);
  };

  const current = STEPS[step];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md p-8 overflow-hidden">

        {/* Skip button */}
        <button
          onClick={handleSkip}
          className="absolute top-4 right-4 w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 transition"
        >
          <X size={16} />
        </button>

        {/* Logo */}
        <div className="flex items-center gap-2 mb-8">
          <div className="w-8 h-8 bg-indigo-600 rounded-xl flex items-center justify-center">
            <Terminal size={15} className="text-white" />
          </div>
          <span className="font-bold text-gray-900">DevTrace AI</span>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-8">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all ${
                i === step ? 'bg-indigo-600 w-8' :
                i < step ? 'bg-indigo-200 w-4' : 'bg-gray-200 w-4'
              }`}
            />
          ))}
          <span className="text-xs text-gray-400 ml-2">{step + 1} of {STEPS.length}</span>
        </div>

        {/* Step content */}
        <div className="text-center mb-8">
          <div className={`w-20 h-20 ${current.color} rounded-3xl flex items-center justify-center mx-auto mb-5`}>
            {current.icon}
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">{current.title}</h2>
          <p className="text-gray-400 text-sm leading-relaxed">{current.desc}</p>
        </div>

        {/* Completed steps */}
        {step > 0 && (
          <div className="mb-6 space-y-2">
            {STEPS.slice(0, step).map((s, i) => (
              <div key={i} className="flex items-center gap-2 text-xs text-green-600 bg-green-50 rounded-xl px-3 py-2">
                <CheckCircle size={13} />
                <span>{s.title}</span>
              </div>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="space-y-3">
          <button
            onClick={handleAction}
            className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-xl transition"
          >
            {current.action} <ArrowRight size={16} />
          </button>
          <button
            onClick={handleNext}
            className="w-full text-gray-400 hover:text-gray-600 text-sm py-2 transition"
          >
            {step < STEPS.length - 1 ? 'Learn about next step →' : 'Finish tour'}
          </button>
        </div>

      </div>
    </div>
  );
};

export default OnboardingModal;