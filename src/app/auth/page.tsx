"use client";
import React, { useState } from 'react';
import Link from 'next/link';
import { Radar, Loader2, ArrowLeft } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/lib/supabase';

const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

export default function AuthPage() {
  const { t, language } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleGoogleLogin = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/`,
        }
      });
      if (error) throw error;
    } catch (err: any) {
      setErrorMsg(err.message || "Une erreur est survenue avec Google.");
      setLoading(false); // Only set to false on error, on success redirect happens
    }
  };

  return (
    <div className="bg-[var(--color-app-bg)] text-[var(--color-app-text)] min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-primary/10 blur-[130px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-[400px] h-[400px] rounded-full bg-primary/20 blur-[130px] pointer-events-none"></div>

      <div className="w-full max-w-md space-y-8 z-10">
        {/* Logo and Header */}
        <div className="text-center space-y-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/20 text-primary mb-4">
            <Radar size={40} />
          </div>
          <div className="space-y-3">
            <h1 className="text-4xl font-black tracking-tight text-[var(--color-app-text)]">
              {t('auth.welcome_back')}
            </h1>
            <p className="text-[var(--color-app-text-muted)] text-lg font-medium">
              Connectez-vous pour rejoindre le réseau
            </p>
          </div>
        </div>

        {/* Auth Card */}
        <div className="bg-[var(--color-app-surface)] border border-[var(--color-app-border)] p-10 rounded-3xl shadow-2xl backdrop-blur-md">
          {errorMsg && (
            <div className="mb-8 p-5 bg-red-500/10 border-2 border-red-500/50 rounded-2xl text-red-500 text-sm font-bold text-center">
              {errorMsg}
            </div>
          )}

          {/* Google Sign In - Larger for drivers */}
          <button 
            type="button" 
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full py-5 px-6 bg-[var(--color-app-bg)] border-2 border-[var(--color-app-border)] hover:bg-primary/10 disabled:opacity-70 text-[var(--color-app-text)] font-black text-lg rounded-2xl transition-all flex items-center justify-center gap-4 shadow-xl active:scale-95"
          >
            <GoogleIcon />
            {language === 'en' ? 'Continue with Google' : 'Continuer avec Google'}
          </button>
        </div>
        {/* Footer Navigation */}
        <div className="flex justify-center mt-6">
          <Link 
            href="/" 
            className="flex items-center gap-3 text-lg font-black text-[var(--color-app-text-muted)] hover:text-primary transition-all bg-[var(--color-app-surface)] hover:bg-primary/10 px-8 py-4 rounded-full border-2 border-[var(--color-app-border)] active:scale-95 shadow-lg"
          >
            <ArrowLeft size={24} />
            {language === 'en' ? 'Back to Map' : 'Retour à la carte'}
          </Link>
        </div>
      </div>
    </div>
  );
}
