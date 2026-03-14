import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Radar, Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

export default function AuthPage() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate auth
    navigate('/');
  };

  return (
    <div className="bg-background-dark text-slate-100 min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-primary/10 blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-[400px] h-[400px] rounded-full bg-primary/10 blur-[120px] pointer-events-none"></div>

      <div className="w-full max-w-md space-y-8 z-10">
        {/* Logo and Header */}
        <div className="text-center space-y-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/20 text-primary mb-4">
            <Radar size={40} />
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight text-slate-50">
              {isLogin ? t('auth.welcome_back') : t('auth.create_account')}
            </h1>
            <p className="text-slate-400 text-base">
              {isLogin 
                ? t('auth.enter_credentials') 
                : t('auth.join_network')}
            </p>
          </div>
        </div>

        {/* Auth Card */}
        <div className="bg-primary/5 border border-primary/10 p-8 rounded-xl shadow-xl backdrop-blur-sm">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {!isLogin && (
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-300">{t('auth.full_name')}</label>
                <div className="relative group">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" size={20} />
                  <input 
                    type="text" 
                    placeholder={t('auth.enter_name')} 
                    className="w-full pl-10 pr-4 py-3 bg-background-dark border border-primary/20 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all text-slate-100 placeholder:text-slate-500"
                  />
                </div>
              </div>
            )}

            {/* Email Field */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-300">{t('auth.email')}</label>
              <div className="relative group">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" size={20} />
                <input 
                  type="email" 
                  placeholder="name@company.com" 
                  className="w-full pl-10 pr-4 py-3 bg-background-dark border border-primary/20 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all text-slate-100 placeholder:text-slate-500"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="block text-sm font-medium text-slate-300">{t('auth.password')}</label>
                {isLogin && (
                  <a href="#" className="text-sm font-medium text-primary hover:text-primary/80 transition-colors">{t('auth.forgot_password')}</a>
                )}
              </div>
              <div className="relative group">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" size={20} />
                <input 
                  type={showPassword ? 'text' : 'password'} 
                  placeholder="••••••••" 
                  className="w-full pl-10 pr-12 py-3 bg-background-dark border border-primary/20 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all text-slate-100 placeholder:text-slate-500"
                />
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {/* Sign In Button */}
            <button 
              type="submit" 
              className="w-full py-3 px-4 bg-primary hover:bg-primary/90 text-background-dark font-semibold rounded-lg transition-colors shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
            >
              {isLogin ? t('auth.sign_in') : t('auth.create_btn')}
              <ArrowRight size={20} />
            </button>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-slate-400 text-sm">
          {isLogin ? t('auth.no_account') : t('auth.have_account')}
          <button 
            onClick={() => setIsLogin(!isLogin)}
            className="font-semibold text-primary hover:text-primary/80 transition-colors"
          >
            {isLogin ? t('auth.request_access') : t('auth.sign_in')}
          </button>
        </p>
      </div>
    </div>
  );
}
