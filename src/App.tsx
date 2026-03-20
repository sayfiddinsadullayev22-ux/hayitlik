/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Timer as TimerIcon, 
  CheckCircle2, 
  XCircle, 
  ChevronRight, 
  ChevronLeft, 
  Play, 
  Trophy,
  AlertCircle,
  Menu,
  X,
  LogOut,
  Download,
  Send,
  RefreshCw,
  Award
} from 'lucide-react';
import confetti from 'canvas-confetti';
import html2canvas from 'html2canvas';
import { SECTIONS } from './constants';
import { SectionType, UserAnswer, TestState, Section } from './types';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Components ---

const Logo = ({ className }: { className?: string }) => (
  <div className={cn("w-32 h-32 rounded-full bg-white flex items-center justify-center border-4 border-blue-900 shadow-xl overflow-hidden", className)}>
    <img src="/images/logo1.jpg" alt="Logo" className="w-full h-full object-contain" referrerPolicy="no-referrer" crossOrigin="anonymous" />
  </div>
);

const Timer = ({ 
  timeLeft, 
  onTimeUp 
}: { 
  timeLeft: number; 
  onTimeUp: () => void 
}) => {
  useEffect(() => {
    if (timeLeft <= 0) {
      onTimeUp();
    }
  }, [timeLeft, onTimeUp]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  return (
    <div className={cn(
      "flex items-center gap-2 px-4 py-2 rounded-full font-mono text-lg font-bold shadow-sm",
      timeLeft < 60 ? "bg-red-100 text-red-600 animate-pulse" : "bg-blue-50 text-blue-900"
    )}>
      <TimerIcon size={20} />
      <span>{String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}</span>
    </div>
  );
};

export default function App() {
  const [state, setState] = useState<TestState>(() => {
    const saved = localStorage.getItem('lyceumverse_mock_result');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return {
          status: 'results',
          currentSection: 'iq',
          answers: parsed.answers,
          startTime: parsed.startTime,
          endTime: parsed.endTime,
        };
      } catch (e) {
        console.error("Failed to parse saved results", e);
      }
    }
    return {
      status: 'idle',
      currentSection: 'iq',
      answers: [],
      startTime: null,
      endTime: null,
    };
  });

  const [timeLeft, setTimeLeft] = useState(0);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [showFinishModal, setShowFinishModal] = useState(false);
  const [showCertificate, setShowCertificate] = useState(false);
  const [userName, setUserName] = useState('');
  const [isNameConfirmed, setIsNameConfirmed] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const certificateRef = useRef<HTMLDivElement>(null);

  // Sound effect for completion - Extended to 5 seconds with a celebratory melody
  const playSuccessSound = () => {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    const playNote = (freq: number, startTime: number, duration: number) => {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(freq, startTime);
      
      gainNode.gain.setValueAtTime(0, startTime);
      gainNode.gain.linearRampToValueAtTime(0.1, startTime + 0.05);
      gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);

      oscillator.start(startTime);
      oscillator.stop(startTime + duration);
    };

    // A simple celebratory melody (C major arpeggio/fanfare)
    const now = audioContext.currentTime;
    const melody = [
      { f: 261.63, t: 0, d: 0.5 }, // C4
      { f: 329.63, t: 0.5, d: 0.5 }, // E4
      { f: 392.00, t: 1.0, d: 0.5 }, // G4
      { f: 523.25, t: 1.5, d: 1.0 }, // C5
      { f: 392.00, t: 2.5, d: 0.5 }, // G4
      { f: 523.25, t: 3.0, d: 2.0 }, // C5 (Final long note)
    ];

    melody.forEach(note => {
      playNote(note.f, now + note.t, note.d);
    });
  };

  const startTest = () => {
    const firstSection = SECTIONS[0];
    setState(prev => ({
      ...prev,
      status: 'testing',
      currentSection: firstSection.id,
      startTime: Date.now(),
    }));
    setTimeLeft(firstSection.duration * 60);
    setActiveImageIndex(0);
  };

  const handleAnswer = (questionId: number, answer: string) => {
    setState(prev => {
      const existingIndex = prev.answers.findIndex(
        a => a.sectionId === prev.currentSection && a.questionId === questionId
      );
      
      const newAnswers = [...prev.answers];
      if (existingIndex >= 0) {
        newAnswers[existingIndex] = { sectionId: prev.currentSection, questionId, answer };
      } else {
        newAnswers.push({ sectionId: prev.currentSection, questionId, answer });
      }
      
      return { ...prev, answers: newAnswers };
    });
  };

  const nextSection = useCallback(() => {
    const currentIndex = SECTIONS.findIndex(s => s.id === state.currentSection);
    if (currentIndex < SECTIONS.length - 1) {
      const next = SECTIONS[currentIndex + 1];
      setState(prev => ({ ...prev, currentSection: next.id }));
      setTimeLeft(next.duration * 60);
      setActiveImageIndex(0);
    } else {
      finishTest();
    }
  }, [state.currentSection]);

  const finishTest = () => {
    const endTime = Date.now();
    setState(prev => {
      const newState = {
        ...prev,
        status: 'results',
        endTime,
      };
      
      // Save to localStorage to prevent retakes
      localStorage.setItem('lyceumverse_mock_result', JSON.stringify({
        answers: prev.answers,
        startTime: prev.startTime,
        endTime,
      }));
      
      return newState;
    });
    
    setShowFinishModal(false);
    
    // Fireworks
    confetti({
      particleCount: 150,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#1e3a8a', '#000000', '#ffffff']
    });
    
    playSuccessSound();
  };

  useEffect(() => {
    if (state.status === 'testing') {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            nextSection();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [state.status, nextSection]);

  const currentSectionData = SECTIONS.find(s => s.id === state.currentSection)!;

  // --- Renderers ---

  if (state.status === 'idle') {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-slate-900">
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="flex flex-col items-center gap-8"
        >
          <Logo />
          <div className="text-center">
            <h1 className="text-4xl font-black tracking-tighter text-slate-900 mb-2">LYCEUMVERSE</h1>
            <p className="text-blue-900 font-medium uppercase tracking-widest text-sm">Bonus Mock Exam</p>
          </div>
          
          <button 
            onClick={() => setState(prev => ({ ...prev, status: 'instructions' }))}
            className="group relative flex items-center gap-3 bg-slate-900 text-white px-10 py-4 rounded-full font-bold text-lg hover:bg-blue-900 transition-all shadow-xl hover:shadow-blue-200"
          >
            BOSHLASH
            <Play size={20} fill="currentColor" />
          </button>
        </motion.div>
      </div>
    );
  }

  if (state.status === 'instructions') {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="max-w-md w-full bg-white rounded-3xl p-8 shadow-2xl border border-slate-100"
        >
          <div className="flex items-center gap-3 mb-6 text-blue-900">
            <AlertCircle size={32} />
            <h2 className="text-2xl font-bold">Test Tarkibi</h2>
          </div>
          
          <div className="space-y-4 mb-8">
            {SECTIONS.map(s => (
              <div key={s.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <div>
                  <h3 className="font-bold text-slate-900">{s.title}</h3>
                  <p className="text-sm text-slate-500">{s.questions.length} ta savol</p>
                </div>
                <div className="text-blue-900 font-mono font-bold">
                  {s.duration} min
                </div>
              </div>
            ))}
          </div>
          
          <div className="bg-blue-50 p-4 rounded-2xl mb-8 text-sm text-blue-800 leading-relaxed">
            <p><strong>Eslatma:</strong> Har bir bo'lim uchun vaqt alohida hisoblanadi. Vaqt tugasa, avtomatik keyingi bo'limga o'tiladi.</p>
          </div>

          <button 
            onClick={startTest}
            className="w-full bg-blue-900 text-white py-4 rounded-2xl font-bold text-lg hover:bg-slate-900 transition-all shadow-lg"
          >
            TESTNI BOSHLASH
          </button>
        </motion.div>
      </div>
    );
  }

  if (state.status === 'testing') {
    const currentAnswers = state.answers.filter(a => a.sectionId === state.currentSection);
    
    return (
      <div className="min-h-screen bg-white flex flex-col">
        {/* Header */}
        <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-slate-100 px-4 py-3 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center text-[8px] text-white font-bold leading-none text-center">
              LYCEUM<br/>VERSE
            </div>
            <div className="hidden sm:block">
              <h1 className="font-bold text-slate-900 leading-none">{currentSectionData.title}</h1>
              <p className="text-[10px] text-slate-500 uppercase tracking-wider mt-1">
                {SECTIONS.findIndex(s => s.id === state.currentSection) + 1} / {SECTIONS.length} BO'LIM
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 sm:gap-4">
            <Timer timeLeft={timeLeft} onTimeUp={nextSection} />
            <button 
              onClick={() => setShowFinishModal(true)}
              className="p-2 text-slate-400 hover:text-red-600 transition-colors"
              title="Testni tugatish"
            >
              <LogOut size={20} />
            </button>
          </div>
        </header>

        <main className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Question Content (Images) */}
          <div className="flex-1 overflow-y-auto p-4 bg-slate-100">
            <div className="max-w-3xl mx-auto space-y-4">
              <div className="relative aspect-[3/4] bg-white rounded-2xl shadow-lg overflow-hidden border border-slate-200">
                <img 
                  src={currentSectionData.images[activeImageIndex]} 
                  alt={`Question Page ${activeImageIndex + 1}`}
                  className="w-full h-full object-contain"
                  referrerPolicy="no-referrer"
                  crossOrigin="anonymous"
                />
              </div>
              
              {/* Image Navigation */}
              <div className="flex items-center justify-center gap-2 pb-4">
                {currentSectionData.images.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImageIndex(idx)}
                    className={cn(
                      "w-10 h-10 rounded-xl font-bold transition-all",
                      activeImageIndex === idx 
                        ? "bg-blue-900 text-white shadow-md scale-110" 
                        : "bg-white text-slate-400 hover:bg-slate-50"
                    )}
                  >
                    {idx + 1}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Answer Sheet */}
          <aside className="w-full md:w-80 bg-white border-l border-slate-100 flex flex-col shadow-2xl z-10">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="font-bold text-slate-900">Javoblar Varag'i</h2>
              <span className="text-xs font-bold text-blue-900 bg-blue-50 px-2 py-1 rounded-md">
                {currentAnswers.length} / {currentSectionData.questions.length}
              </span>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 grid grid-cols-1 gap-4">
              {currentSectionData.questions.map((q) => {
                const userAnswer = currentAnswers.find(a => a.questionId === q.id)?.answer;
                return (
                  <div key={q.id} className="flex items-center gap-4 p-2 rounded-xl hover:bg-slate-50 transition-colors">
                    <span className="w-6 text-sm font-bold text-slate-400">{q.id}.</span>
                    <div className="flex-1 flex justify-between gap-1">
                      {['a', 'b', 'c', 'd'].map((opt) => (
                        <button
                          key={opt}
                          onClick={() => handleAnswer(q.id, opt)}
                          className={cn(
                            "w-10 h-10 rounded-lg font-bold uppercase transition-all border-2",
                            userAnswer === opt
                              ? "bg-blue-900 border-blue-900 text-white shadow-inner"
                              : "bg-white border-slate-100 text-slate-400 hover:border-slate-300"
                          )}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100">
              <button
                onClick={nextSection}
                className="w-full bg-slate-900 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-blue-900 transition-all shadow-lg"
              >
                {SECTIONS.findIndex(s => s.id === state.currentSection) === SECTIONS.length - 1 
                  ? "TUGATISH" 
                  : "KEYINGI BO'LIM"}
                <ChevronRight size={20} />
              </button>
            </div>
          </aside>
        </main>

        {/* Custom Finish Modal */}
        <AnimatePresence>
          {showFinishModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowFinishModal(false)}
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
              />
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="relative bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl text-center"
              >
                <div className="w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertCircle size={32} />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Testni tugatish</h3>
                <p className="text-slate-500 mb-8 leading-relaxed">Haqiqatdan ham testni muddatidan oldin tugatmoqchimisiz? Barcha javoblar saqlanadi.</p>
                <div className="flex gap-3">
                  <button 
                    onClick={() => setShowFinishModal(false)}
                    className="flex-1 py-3 rounded-xl font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 transition-all"
                  >
                    YO'Q
                  </button>
                  <button 
                    onClick={finishTest}
                    className="flex-1 py-3 rounded-xl font-bold text-white bg-red-600 hover:bg-red-700 transition-all shadow-lg shadow-red-100"
                  >
                    HA, TUGATISH
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  if (state.status === 'results') {
    const calculateResults = () => {
      const weights: Record<SectionType, number> = {
        iq: 1.1,
        math: 3.1,
        english: 3.1
      };

      const results = SECTIONS.map(section => {
        const sectionAnswers = state.answers.filter(a => a.sectionId === section.id);
        let correctCount = 0;
        const breakdown = section.questions.map(q => {
          const userAnswer = sectionAnswers.find(a => a.questionId === q.id)?.answer;
          const isCorrect = userAnswer === q.correctAnswer;
          if (isCorrect) correctCount++;
          return {
            id: q.id,
            userAnswer,
            correctAnswer: q.correctAnswer,
            isCorrect
          };
        });
        
        const weight = weights[section.id as SectionType];
        const sectionScore = Number((correctCount * weight).toFixed(1));

        return {
          id: section.id,
          title: section.title,
          correct: correctCount,
          total: section.questions.length,
          weight,
          score: sectionScore,
          maxScore: Number((section.questions.length * weight).toFixed(1)),
          breakdown
        };
      });
      
      const totalScore = Number(results.reduce((sum, r) => sum + r.score, 0).toFixed(1));
      const maxTotalScore = Number(results.reduce((sum, r) => sum + r.maxScore, 0).toFixed(1));
      const totalCorrect = results.reduce((sum, r) => sum + r.correct, 0);
      const totalQuestions = results.reduce((sum, r) => sum + r.total, 0);
      
      return { results, totalScore, maxTotalScore, totalCorrect, totalQuestions };
    };

    const { results, totalScore, maxTotalScore, totalCorrect, totalQuestions } = calculateResults();

    const downloadCertificate = async () => {
      if (!certificateRef.current || !userName) return;
      setIsGenerating(true);
      try {
        const canvas = await html2canvas(certificateRef.current, {
          scale: 3,
          useCORS: true,
          backgroundColor: '#ffffff',
          logging: false
        });
        const image = canvas.toDataURL('image/png', 1.0);
        const link = document.createElement('a');
        link.href = image;
        link.download = `${userName}_Lyceumverse_Sertifikat.png`;
        link.click();
      } catch (err) {
        console.error('Sertifikat yaratishda xatolik:', err);
      } finally {
        setIsGenerating(false);
      }
    };

    const shareToTelegram = async () => {
      if (!certificateRef.current || !userName) return;
      setIsGenerating(true);
      try {
        const canvas = await html2canvas(certificateRef.current, {
          scale: 3,
          useCORS: true,
          backgroundColor: '#ffffff',
          logging: false
        });
        const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/png', 1.0));
        if (blob && navigator.share) {
          const file = new File([blob], 'sertifikat.png', { type: 'image/png' });
          await navigator.share({
            files: [file],
            title: 'Mening Lyceumverse Sertifikatim',
            text: 'Men Lyceumverse Mock imtihonini topshirdim!'
          });
        } else {
          // Fallback to direct telegram link if sharing files not supported
          const text = encodeURIComponent(`Men Lyceumverse Mock imtihonini topshirdim! Ball: ${totalScore}/${maxTotalScore}\n\nBarchani Hayit bayrami bilan tabriklaymiz!`);
          window.open(`https://t.me/share/url?url=${window.location.href}&text=${text}`, '_blank');
        }
      } catch (err) {
        console.error('Ulashishda xatolik:', err);
      } finally {
        setIsGenerating(false);
      }
    };

    return (
      <div className="min-h-screen bg-slate-50 p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-100"
          >
            {/* Hero Result */}
            <div className="bg-slate-900 text-white p-10 text-center relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
                <div className="absolute top-[-50%] left-[-20%] w-[140%] h-[200%] bg-gradient-to-br from-blue-500 to-transparent rotate-12" />
              </div>
              
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <Trophy className="mx-auto mb-4 text-yellow-400" size={64} />
                <h2 className="text-4xl font-black tracking-tighter mb-2">NATIJA</h2>
                <div className="inline-flex items-baseline gap-2 bg-white/10 px-6 py-2 rounded-full backdrop-blur-sm">
                  <span className="text-5xl font-black">{totalScore}</span>
                  <span className="text-xl opacity-50">/ {maxTotalScore}</span>
                </div>
                <p className="mt-4 text-blue-300 font-bold uppercase tracking-widest text-sm">Umumiy Ball</p>
                <p className="text-xs opacity-40 mt-1">({totalCorrect} ta to'g'ri javob)</p>
              </motion.div>
            </div>

            <div className="p-6 md:p-10">
              {/* Action Buttons */}
              <div className="flex flex-wrap justify-center gap-4 mb-12">
                <button 
                  onClick={() => setShowCertificate(true)}
                  className="flex items-center gap-2 bg-blue-900 text-white px-8 py-4 rounded-2xl font-bold hover:bg-slate-900 transition-all shadow-lg"
                >
                  <Award size={20} />
                  SERTIFIKATNI OLISH
                </button>
              </div>

              {/* Section Summaries */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                {results.map((r, idx) => (
                  <motion.div 
                    key={r.id}
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.4 + (idx * 0.1) }}
                    className="bg-slate-50 rounded-3xl p-6 border border-slate-100 flex flex-col items-center text-center"
                  >
                    <h3 className="font-bold text-slate-500 uppercase tracking-wider text-xs mb-4">{r.title}</h3>
                    <div className="text-3xl font-black text-slate-900 mb-1">{r.score}</div>
                    <div className="text-xs text-slate-400 font-bold mb-2">MAX: {r.maxScore}</div>
                    <div className="text-sm font-medium text-slate-600 mb-2">{r.correct} ta to'g'ri</div>
                    <div className="w-full bg-slate-200 h-2 rounded-full mt-2 overflow-hidden">
                      <div 
                        className="bg-blue-900 h-full rounded-full transition-all duration-1000" 
                        style={{ width: `${(r.correct / r.total) * 100}%` }}
                      />
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Detailed Breakdown */}
              <div className="space-y-12">
                {results.map((r) => (
                  <div key={r.id}>
                    <div className="flex items-center gap-3 mb-6">
                      <div className="h-8 w-1 bg-blue-900 rounded-full" />
                      <h3 className="text-xl font-bold text-slate-900">{r.title} - Tafsilotlar</h3>
                    </div>
                    
                    <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
                      {r.breakdown.map((q) => (
                        <div 
                          key={q.id}
                          className={cn(
                            "aspect-square rounded-xl flex flex-col items-center justify-center text-xs font-bold border-2 transition-all",
                            q.isCorrect 
                              ? "bg-emerald-50 border-emerald-100 text-emerald-700" 
                              : "bg-red-50 border-red-100 text-red-700"
                          )}
                        >
                          <span className="opacity-50 mb-1">{q.id}</span>
                          <span className="uppercase text-sm">{q.userAnswer || '-'}</span>
                          {!q.isCorrect && (
                            <span className="text-[8px] mt-1 opacity-50">({q.correctAnswer})</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-16 flex flex-col items-center gap-4">
                <div className="bg-blue-50 text-blue-900 px-8 py-4 rounded-2xl font-bold flex items-center gap-3">
                  <CheckCircle2 size={24} />
                  TEST YAKUNLANDI
                </div>
                <p className="text-slate-400 text-sm">Lyceumverse Jamoasi tomonidan tayyorlandi</p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Certificate Modal */}
        <AnimatePresence>
          {showCertificate && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => !isGenerating && setShowCertificate(false)}
                className="fixed inset-0 bg-slate-900/80 backdrop-blur-md"
              />
              
              <motion.div 
                initial={{ scale: 0.9, y: 20, opacity: 0 }}
                animate={{ scale: 1, y: 0, opacity: 1 }}
                exit={{ scale: 0.9, y: 20, opacity: 0 }}
                className="relative bg-white rounded-3xl p-6 md:p-10 max-w-2xl w-full shadow-2xl"
              >
                {!isNameConfirmed ? (
                  <div className="text-center py-8">
                    <Award className="mx-auto mb-6 text-blue-900" size={64} />
                    <h3 className="text-2xl font-bold text-slate-900 mb-4">Ismingizni kiriting</h3>
                    <p className="text-slate-500 mb-8">Sertifikatda ko'rinishi uchun to'liq ism-sharifingizni yozing.</p>
                    <input 
                      type="text" 
                      value={userName}
                      onChange={(e) => setUserName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && userName.trim() && setIsNameConfirmed(true)}
                      placeholder="Masalan: Kun Fu panda"
                      className="w-full px-6 py-4 rounded-2xl border-2 border-slate-100 focus:border-blue-900 outline-none mb-6 text-lg font-bold text-center"
                      autoFocus
                    />
                    <div className="flex gap-3">
                      <button 
                        onClick={() => setShowCertificate(false)}
                        className="flex-1 py-4 rounded-2xl font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 transition-all"
                      >
                        BEKOR QILISH
                      </button>
                      <button 
                        disabled={!userName.trim()}
                        onClick={() => setIsNameConfirmed(true)}
                        className="flex-1 py-4 rounded-2xl font-bold text-white bg-blue-900 hover:bg-slate-900 transition-all disabled:opacity-50"
                      >
                        DAVOM ETISH
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center">
                    {/* The actual certificate to capture */}
                    <div 
                      ref={certificateRef}
                      className="w-full aspect-[1.414/1] p-8 flex flex-col items-center justify-between text-center relative overflow-hidden"
                      style={{ 
                        minHeight: '400px', 
                        backgroundColor: '#ffffff', 
                        border: '16px solid #1e3a8a' 
                      }}
                    >
                      {/* Decorative elements */}
                      <div 
                        className="absolute top-0 right-0 w-32 h-32 rounded-bl-full" 
                        style={{ backgroundColor: 'rgba(30, 58, 138, 0.05)' }}
                      />
                      <div 
                        className="absolute bottom-0 left-0 w-32 h-32 rounded-tr-full" 
                        style={{ backgroundColor: 'rgba(30, 58, 138, 0.05)' }}
                      />
                      
                      <div className="flex flex-col items-center gap-4">
                        <img 
                          src="/images/logo1.jpg" 
                          alt="Logo" 
                          className="w-24 h-24 object-contain rounded-full" 
                          style={{ border: '2px solid #1e3a8a' }}
                          referrerPolicy="no-referrer"
                          crossOrigin="anonymous"
                        />
                        <h1 className="text-3xl font-black tracking-tighter" style={{ color: '#0f172a' }}>
                          LYCEUMVERSE
                        </h1>
                      </div>

                      <div className="space-y-4">
                        <p className="font-bold tracking-widest uppercase text-sm" style={{ color: '#1e3a8a' }}>
                          Faxriy Sertifikat
                        </p>
                        <h2 className="text-4xl font-serif italic pb-2 px-8" style={{ color: '#1e293b', borderBottom: '2px solid #e2e8f0' }}>
                          {userName}
                        </h2>
                        <p className="max-w-md mx-auto text-sm leading-relaxed" style={{ color: '#64748b' }}>
                          Lyceumverse Mock imtihonida muvaffaqiyatli ishtirok etib, 
                          <span className="font-bold" style={{ color: '#0f172a' }}> {totalScore} ball </span> 
                          to'plagani uchun taqdirlanadi.
                        </p>
                      </div>

                      <div className="w-full flex flex-col items-center gap-4">
                        <div className="px-6 py-3 rounded-full" style={{ backgroundColor: '#eff6ff', border: '1px solid #dbeafe' }}>
                          <p className="font-bold text-lg" style={{ color: '#1e3a8a' }}>
                            🌙 Hayit ayyomingiz muborak bo'lsin!
                          </p>
                          <p className="text-xs font-medium" style={{ color: '#1d4ed8' }}>
                            Lyceumverse Jamoasi sizni chin qalbdan tabriklaydi.
                          </p>
                        </div>
                        <div className="flex justify-between w-full px-8 text-[10px] font-bold uppercase tracking-widest" style={{ color: '#94a3b8' }}>
                          <span>ID: {Math.random().toString(36).substr(2, 9).toUpperCase()}</span>
                          <span>SANA: {new Date().toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-8 flex flex-wrap justify-center gap-4 w-full">
                      <button 
                        onClick={downloadCertificate}
                        disabled={isGenerating}
                        className="flex-1 min-w-[200px] flex items-center justify-center gap-2 bg-blue-900 text-white py-4 rounded-2xl font-bold hover:bg-slate-900 transition-all disabled:opacity-50"
                      >
                        <Download size={20} />
                        {isGenerating ? 'YUKLANMOQDA...' : 'YUKLAB OLISH'}
                      </button>
                      <button 
                        onClick={shareToTelegram}
                        disabled={isGenerating}
                        className="flex-1 min-w-[200px] flex items-center justify-center gap-2 bg-[#0088cc] text-white py-4 rounded-2xl font-bold hover:bg-[#0077b5] transition-all disabled:opacity-50"
                      >
                        <Send size={20} />
                        TELEGRAMGA YUBORISH
                      </button>
                    </div>
                    
                    <button 
                      onClick={() => setIsNameConfirmed(false)}
                      className="mt-4 text-slate-400 hover:text-slate-600 text-sm font-bold"
                    >
                      Ismni o'zgartirish
                    </button>
                  </div>
                )}
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return null;
}
