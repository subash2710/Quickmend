import React, { useState } from 'react';
import { Mic, Loader2 } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface VoiceInputProps {
  onTranscript: (text: string) => void;
  className?: string;
}

export const VoiceInput: React.FC<VoiceInputProps> = ({ onTranscript, className = '' }) => {
  const { language, t } = useLanguage();
  const [isListening, setIsListening] = useState(false);

  const startListening = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert(t('voiceNotSupported', 'Voice recognition is not supported on this browser. Please type your problem description.'));
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = language === 'ta' ? 'ta-IN' : language === 'hi' ? 'hi-IN' : 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          onTranscript(transcript);
        }
        setIsListening(false);
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch (err) {
      console.error('Speech recognition failed to start:', err);
      setIsListening(false);
    }
  };

  return (
    <button
      type="button"
      onClick={startListening}
      className={`p-2.5 rounded-xl border font-medium text-xs flex items-center gap-1.5 transition-all ${
        isListening
          ? 'bg-rose-50 border-rose-400 text-rose-600 animate-pulse'
          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
      } ${className}`}
      title={t('voiceTooltip', 'Describe your problem using voice speech-to-text')}
    >
      {isListening ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin text-rose-500" />
          <span>{t('listening', 'Listening...')}</span>
        </>
      ) : (
        <>
          <Mic className="w-4 h-4 text-sky-600" />
          <span>{t('voice', 'Voice')}</span>
        </>
      )}
    </button>
  );
};
