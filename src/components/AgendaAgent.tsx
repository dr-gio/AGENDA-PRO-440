import React from 'react';
import {
  Send,
  Bot,
  User,
  Sparkles,
  Calendar,
  Clock,
  UserPlus,
  Trash2,
  CheckCircle2,
  Search,
  Loader2,
  Terminal,
  ChevronRight,
  Share2,
  Copy,
  Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { agentService } from '../services/agentService';
import { cn } from '../lib/utils';

interface Message {
  id: string;
  role: 'user' | 'agent';
  content: string;
  timestamp: Date;
}

const CommandButton = ({ icon: Icon, label, command, onClick }: { icon: any, label: string, command: string, onClick: (cmd: string) => void }) => (
  <button
    onClick={() => onClick(command)}
    className="flex items-center gap-2 px-4 py-2 bg-navy-deep border border-border-subtle rounded-xl text-xs font-bold text-text-primary hover:border-accent-blue hover:bg-accent-blue/5 transition-all group whitespace-nowrap"
  >
    <Icon size={14} className="text-text-secondary group-hover:text-accent-blue transition-colors" />
    {label}
  </button>
);

export const AgendaAgent = ({ userId = 'anonymous' }: { userId?: string }) => {
  const [messages, setMessages] = React.useState<Message[]>([
    {
      id: '1',
      role: 'agent',
      content: 'Hola, soy el Agente Inteligente de Agenda 440. ¿En qué puedo ayudarte hoy? Puedes pedirme agendar, reprogramar, cancelar o consultar citas usando lenguaje natural.',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = React.useState('');
  const [isTyping, setIsTyping] = React.useState(false);
  const scrollRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSend = async (text: string = input) => {
    if (!text.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    try {
      const response = await agentService.processMessage(text, userId);

      const agentMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'agent',
        content: response || 'No pude procesar tu solicitud. Intenta de nuevo.',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, agentMessage]);
    } catch (error) {
      console.error('Agent chat error:', error);
    } finally {
      setIsTyping(false);
    }
  };

  const handleCommand = (command: string) => {
    setInput(command + ' ');
  };

  return (
    <div className="flex flex-col max-w-4xl mx-auto bg-navy-card rounded-3xl border border-border-subtle shadow-2xl overflow-hidden transition-all h-[calc(100vh-180px)]">
      {/* Header */}
      <div className="p-4 md:p-6 border-b border-border-subtle bg-navy-deep/30 flex items-center justify-between">
        <div className="flex items-center gap-3 md:gap-4">
          <div className="w-10 h-10 md:w-12 md:h-12 bg-accent-blue rounded-2xl flex items-center justify-center text-white shadow-lg shadow-accent-blue/20 relative">
            <Bot size={20} className="md:w-6 md:h-6" />
            <div className="absolute -bottom-1 -right-1 w-3 h-3 md:w-4 md:h-4 bg-emerald-500 border-2 border-navy-deep rounded-full" />
          </div>
          <div>
            <h3 className="text-sm md:text-lg font-bold text-text-primary tracking-tight flex items-center gap-2">
              Agente de Agenda 440
              <Sparkles size={14} className="text-accent-blue hidden md:block" />
            </h3>
            <p className="text-[9px] md:text-xs font-bold text-text-secondary uppercase tracking-widest">IA Activa · Uso Interno</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 text-emerald-500 rounded-full text-[10px] font-bold uppercase tracking-widest border border-emerald-500/20">
            <CheckCircle2 size={12} />
            En Línea
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 bg-navy-deep/10"
      >
        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              className={cn(
                "flex gap-3 md:gap-4 max-w-[90%] md:max-w-[85%]",
                msg.role === 'user' ? "ml-auto flex-row-reverse" : ""
              )}
            >
              <div className={cn(
                "w-8 h-8 md:w-10 md:h-10 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm",
                msg.role === 'user' ? "bg-accent-blue text-white" : "bg-navy-deep text-text-primary border border-border-subtle"
              )}>
                {msg.role === 'user' ? <User size={16} className="md:w-5 md:h-5" /> : <Bot size={16} className="md:w-5 md:h-5" />}
              </div>
              <div className={cn(
                "p-4 md:p-5 rounded-2xl text-xs md:text-sm leading-relaxed shadow-sm",
                msg.role === 'user'
                  ? "bg-accent-blue text-white rounded-tr-none"
                  : "bg-navy-deep border border-border-subtle text-text-primary rounded-tl-none"
              )}>
                {msg.content}
                <div className={cn(
                  "mt-2 text-[8px] md:text-[9px] font-bold uppercase tracking-widest opacity-40",
                  msg.role === 'user' ? "text-white" : "text-text-primary"
                )}>
                  {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </motion.div>
          ))}
          {isTyping && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex gap-3 md:gap-4 max-w-[85%]"
            >
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-navy-deep border border-border-subtle text-text-primary flex items-center justify-center flex-shrink-0">
                <Bot size={16} />
              </div>
              <div className="bg-navy-deep border border-border-subtle text-text-primary p-4 md:p-5 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-2">
                <Loader2 size={14} className="animate-spin opacity-40" />
                <span className="text-[10px] md:text-xs font-bold uppercase tracking-widest opacity-40">Pensando...</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Quick Commands - Scrollable on mobile */}
      <div className="px-4 md:px-8 py-3 md:py-4 border-t border-border-subtle bg-navy-card overflow-x-auto no-scrollbar">
        <div className="flex gap-2 min-w-max">
          <CommandButton icon={UserPlus} label="Agendar" command="/agendar" onClick={handleCommand} />
          <CommandButton icon={Clock} label="Reprogramar" command="/reprogramar" onClick={handleCommand} />
          <CommandButton icon={Trash2} label="Cancelar" command="/cancelar" onClick={handleCommand} />
          <CommandButton icon={CheckCircle2} label="Confirmar" command="/confirmar" onClick={handleCommand} />
          <CommandButton icon={Search} label="Disponibilidad" command="/disponibilidad" onClick={handleCommand} />
        </div>
      </div>

      {/* Input Area */}
      <div className="p-4 md:p-8 pt-0 bg-navy-card">
        <div className="relative group">
          <div className="absolute left-4 md:left-5 top-1/2 -translate-y-1/2 text-text-secondary/30 group-focus-within:text-accent-blue transition-colors">
            <Terminal size={18} className="md:w-5 md:h-5" />
          </div>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Escribe una instrucción..."
            className="w-full pl-12 md:pl-14 pr-16 md:pr-20 py-4 md:py-5 bg-navy-deep border border-border-subtle rounded-2xl text-xs md:text-sm text-text-primary font-medium focus:outline-none focus:ring-2 focus:ring-accent-blue/20 focus:border-accent-blue transition-all shadow-inner"
          />
          <button
            onClick={() => handleSend()}
            disabled={!input.trim() || isTyping}
            className="absolute right-2 md:right-3 top-1/2 -translate-y-1/2 p-2 md:p-3 bg-accent-blue text-white rounded-xl hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg active:scale-95"
          >
            <Send size={18} className="md:w-5 md:h-5" />
          </button>
        </div>
        <p className="mt-2 md:mt-3 text-[8px] md:text-[10px] text-center text-text-secondary/30 font-bold uppercase tracking-widest flex items-center justify-center gap-2">
          <ChevronRight size={10} className="text-accent-blue" />
          Presiona Enter para enviar
        </p>
      </div>
    </div>
  );
};
