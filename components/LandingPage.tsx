import React from 'react';
import { motion } from 'framer-motion';
import { Github, ArrowRight, Sparkles, Zap, Shield, Globe, Star, ChevronRight, Play } from 'lucide-react';

interface LandingPageProps {
  onStart: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onStart }) => {
  return (
    <div className="min-h-screen bg-[#FAFAFA] text-gray-900 font-sans selection:bg-black selection:text-white overflow-x-hidden">
      
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="bg-white/70 backdrop-blur-xl rounded-2xl border border-gray-200/50 shadow-sm px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-gradient-to-br from-gray-900 to-gray-700 text-white rounded-xl flex items-center justify-center font-bold text-sm shadow-lg">
                B
              </div>
              <span className="font-bold text-lg tracking-tight">OpenBento</span>
            </div>
            <div className="flex items-center gap-3">
              <a 
                href="https://github.com/yoanbernabeu/openbento" 
                target="_blank" 
                rel="noreferrer"
                className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-gray-600 hover:text-black hover:bg-gray-100 transition-all"
              >
                <Github size={18} />
                <span>Star on GitHub</span>
              </a>
              <button 
                onClick={onStart}
                className="bg-gray-900 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-black transition-all shadow-md hover:shadow-lg flex items-center gap-2"
              >
                Get Started <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-36 pb-20 px-6 relative">
        {/* Decorative elements */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-purple-200 rounded-full blur-[120px] opacity-40" />
        <div className="absolute top-40 right-10 w-96 h-96 bg-blue-200 rounded-full blur-[120px] opacity-30" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-t from-amber-100 to-transparent rounded-full blur-[100px] opacity-30" />
        
        <div className="max-w-5xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.25, 0.8, 0.25, 1] }}
          >
            {/* Bento.me Sunset Banner */}
            <a 
              href="https://bento.me/home/bento-sunset" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 text-sm font-medium text-orange-700 mb-6 hover:shadow-md transition-all group"
            >
              <span className="text-lg">🌅</span>
              <span>Bento.me shuts down Feb 13, 2026 — <span className="underline group-hover:text-orange-900">Don't be sad, OpenBento is here!</span></span>
              <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </a>

            {/* Main Heading */}
            <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold tracking-tight leading-[1.05] mb-8">
              <span className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-600 bg-clip-text text-transparent">
                Craft your digital
              </span>
              <br />
              <span className="relative">
                identity
                <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 300 12" fill="none">
                  <path d="M2 10C50 2 150 2 298 10" stroke="url(#gradient)" strokeWidth="4" strokeLinecap="round"/>
                  <defs>
                    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#F59E0B" />
                      <stop offset="100%" stopColor="#EC4899" />
                    </linearGradient>
                  </defs>
                </svg>
              </span>
              <span className="bg-gradient-to-r from-gray-600 via-gray-800 to-gray-900 bg-clip-text text-transparent">
                {" "}in minutes.
              </span>
            </h1>

            <p className="text-xl text-gray-500 max-w-2xl mx-auto leading-relaxed mb-10">
              The open-source alternative to Bento.me. Build a stunning link-in-bio page 
              with our Bento-style editor. No coding required. Your data stays yours — forever.
            </p>
          </motion.div>

          {/* CTA Buttons */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16"
          >
            <button 
              onClick={onStart}
              className="group h-14 px-8 rounded-2xl bg-gray-900 text-white font-semibold text-lg flex items-center gap-3 hover:bg-black transition-all shadow-xl hover:shadow-2xl hover:scale-[1.02]"
            >
              Start Creating
              <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center group-hover:bg-white/30 transition-colors">
                <ArrowRight size={18} />
              </div>
            </button>
            <a 
              href="https://github.com/yoanbernabeu/openbento"
              target="_blank"
              rel="noreferrer"
              className="h-14 px-8 rounded-2xl bg-white border border-gray-200 text-gray-700 font-semibold text-lg flex items-center gap-3 hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm"
            >
              <Star size={20} className="text-amber-500" />
              Star on GitHub
            </a>
          </motion.div>

          {/* Hero Preview */}
          <motion.div 
            initial={{ opacity: 0, y: 60, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 1, delay: 0.4, ease: [0.25, 0.8, 0.25, 1] }}
            className="relative max-w-4xl mx-auto"
          >
            {/* Browser Frame */}
            <div className="bg-gradient-to-b from-gray-100 to-gray-200 rounded-[28px] p-1 shadow-2xl">
              <div className="bg-white rounded-[24px] overflow-hidden">
                {/* Browser Bar */}
                <div className="bg-gray-50 px-4 py-3 flex items-center gap-3 border-b border-gray-100">
                  <div className="flex gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-400" />
                    <div className="w-3 h-3 rounded-full bg-amber-400" />
                    <div className="w-3 h-3 rounded-full bg-green-400" />
                  </div>
                  <div className="flex-1 mx-4">
                    <div className="bg-gray-100 rounded-lg px-4 py-1.5 text-sm text-gray-500 font-mono">
                      yourname.github.io/bento
                    </div>
                  </div>
                </div>
                
                {/* Preview Content */}
                <div className="bg-[#FAFAFA] p-8 min-h-[400px] flex">
                  {/* Left Profile */}
                  <div className="w-1/3 pr-6 flex flex-col justify-center">
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 mb-4 shadow-lg" />
                    <h3 className="text-2xl font-bold text-gray-900">Alex Chen</h3>
                    <p className="text-gray-500 text-sm mt-1">Creative Developer</p>
                  </div>
                  
                  {/* Right Grid */}
                  <div className="flex-1 grid grid-cols-3 gap-3 auto-rows-[80px]">
                    <div className="col-span-2 row-span-2 bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl shadow-md flex items-center justify-center">
                      <Play size={32} className="text-white/80" />
                    </div>
                    <div className="bg-gray-900 rounded-2xl shadow-md" />
                    <div className="bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl shadow-md" />
                    <div className="col-span-2 bg-white rounded-2xl shadow-md border border-gray-100" />
                    <div className="bg-gradient-to-br from-emerald-400 to-teal-500 rounded-2xl shadow-md" />
                  </div>
                </div>
              </div>
            </div>

            {/* Floating elements */}
            <div className="absolute -right-8 top-1/4 bg-white rounded-xl p-3 shadow-lg border border-gray-100 animate-float">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
                  <Zap size={16} className="text-green-600" />
                </div>
                <span className="text-xs font-semibold text-gray-700">Deploy in 1 click</span>
              </div>
            </div>
            <div className="absolute -left-8 bottom-1/4 bg-white rounded-xl p-3 shadow-lg border border-gray-100 animate-float-delayed">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
                  <Shield size={16} className="text-purple-600" />
                </div>
                <span className="text-xs font-semibold text-gray-700">Privacy first</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Trusted By / Social Proof */}
      <section className="py-16 border-y border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <p className="text-center text-sm font-medium text-gray-400 uppercase tracking-wider mb-8">
            Trusted by creators worldwide
          </p>
          <div className="flex flex-wrap items-center justify-center gap-12 opacity-50">
            {['Developers', 'Designers', 'Creators', 'Freelancers', 'Artists'].map((text, i) => (
              <span key={i} className="text-2xl font-bold text-gray-300">{text}</span>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <span className="text-sm font-semibold text-purple-600 uppercase tracking-wider">Features</span>
              <h2 className="text-4xl font-bold tracking-tight mt-3 mb-4">Everything you need, nothing you don't</h2>
              <p className="text-gray-500 max-w-xl mx-auto">Simple, powerful tools to create your perfect link-in-bio page.</p>
            </motion.div>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { 
                icon: <div className="text-3xl">🎨</div>, 
                title: 'Visual Editor', 
                desc: 'Drag, drop, resize. Build your layout visually without touching code.',
                color: 'from-pink-50 to-rose-50',
                border: 'border-pink-100'
              },
              { 
                icon: <div className="text-3xl">📱</div>, 
                title: 'Mobile Responsive', 
                desc: 'Looks perfect on every device. Preview in real-time.',
                color: 'from-blue-50 to-indigo-50',
                border: 'border-blue-100'
              },
              { 
                icon: <div className="text-3xl">🔗</div>, 
                title: 'Rich Integrations', 
                desc: 'YouTube, Instagram, Maps, and more. Embed dynamic content easily.',
                color: 'from-violet-50 to-purple-50',
                border: 'border-violet-100'
              },
              { 
                icon: <div className="text-3xl">🚀</div>, 
                title: 'One-Click Deploy', 
                desc: 'Export to GitHub Pages or any static host in seconds.',
                color: 'from-amber-50 to-orange-50',
                border: 'border-amber-100'
              },
              { 
                icon: <div className="text-3xl">🔒</div>, 
                title: 'Privacy First', 
                desc: 'No tracking, no analytics, no cookies. Your data stays in your browser.',
                color: 'from-emerald-50 to-teal-50',
                border: 'border-emerald-100'
              },
              { 
                icon: <div className="text-3xl">💾</div>, 
                title: 'Local Storage', 
                desc: 'Save multiple bentos locally. Switch between projects instantly.',
                color: 'from-gray-50 to-slate-50',
                border: 'border-gray-200'
              },
            ].map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className={`bg-gradient-to-br ${feature.color} p-8 rounded-3xl border ${feature.border} hover:shadow-lg transition-all group`}
              >
                <div className="mb-4">{feature.icon}</div>
                <h3 className="text-xl font-bold mb-2 group-hover:text-gray-900">{feature.title}</h3>
                <p className="text-gray-500 leading-relaxed text-sm">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-24 px-6 bg-gray-900 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500 rounded-full blur-[150px]" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500 rounded-full blur-[150px]" />
        </div>
        
        <div className="max-w-5xl mx-auto relative z-10">
          <div className="text-center mb-16">
            <span className="text-sm font-semibold text-purple-400 uppercase tracking-wider">How it works</span>
            <h2 className="text-4xl font-bold tracking-tight mt-3">Ready in 3 steps</h2>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: '01', title: 'Design', desc: 'Use our visual editor to create your perfect layout' },
              { step: '02', title: 'Customize', desc: 'Add your links, colors, and personal touch' },
              { step: '03', title: 'Deploy', desc: 'Export and host anywhere for free' },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.15 }}
                className="text-center"
              >
                <div className="text-6xl font-bold text-white/10 mb-4">{item.step}</div>
                <h3 className="text-2xl font-bold mb-3">{item.title}</h3>
                <p className="text-gray-400">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-32 px-6 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-white via-purple-50/30 to-white" />
        
        <div className="max-w-3xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6 tracking-tight">
              Ready to stand out?
            </h2>
            <p className="text-xl text-gray-500 mb-10">
              Join thousands of creators who've built their digital identity with OpenBento.
            </p>
            <button 
              onClick={onStart}
              className="group h-16 px-10 rounded-2xl bg-gray-900 text-white font-semibold text-xl hover:bg-black transition-all shadow-2xl hover:shadow-3xl hover:scale-[1.02] inline-flex items-center gap-3"
            >
              Create Your Bento
              <ChevronRight size={24} className="group-hover:translate-x-1 transition-transform" />
            </button>
            <p className="mt-6 text-sm text-gray-400">Free forever. No sign-up required.</p>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-gray-100 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gray-900 text-white rounded-lg flex items-center justify-center font-bold text-sm">B</div>
              <span className="font-semibold">OpenBento</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-gray-500">
              <a href="https://github.com/yoanbernabeu/openbento" target="_blank" rel="noreferrer" className="hover:text-black transition-colors flex items-center gap-2">
                <Github size={16} /> GitHub
              </a>
              <span>&copy; {new Date().getFullYear()} OpenBento</span>
            </div>
          </div>
        </div>
      </footer>

      {/* Custom Animations */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        .animate-float {
          animation: float 4s ease-in-out infinite;
        }
        .animate-float-delayed {
          animation: float 4s ease-in-out infinite 2s;
        }
      `}</style>
    </div>
  );
};

export default LandingPage;
