import React, { useState, useEffect } from 'react';
import {
  MessageSquare,
  CheckCircle2,
  HelpCircle,
  Activity,
  Heart,
  Sparkles,
  RefreshCw,
  Globe,
  Send,
  AlertCircle
} from 'lucide-react';
import contextService from '../services/contextService';
import voiceService from '../services/voiceService';

export const DynamicCommunicationModule = ({
  patientId,
  currentQuestion = '',
  initialLanguage = 'en',
  onSelectOption
}) => {
  const [language, setLanguage] = useState(initialLanguage);
  const [question, setQuestion] = useState(currentQuestion);
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [submissionStatus, setSubmissionStatus] = useState(null);
  const [activeVoiceProvider, setActiveVoiceProvider] = useState('');

  useEffect(() => {
    setQuestion(currentQuestion);
    if (currentQuestion) {
      fetchDynamicOptions(currentQuestion, language);
    } else {
      // Default prompt options if no question specified
      fetchDynamicOptions('How are you feeling today?', language);
    }
  }, [currentQuestion, language]);

  const fetchDynamicOptions = async (qText, lang) => {
    setLoading(true);
    setSelectedId(null);
    setSubmissionStatus(null);
    setActiveVoiceProvider('');
    try {
      const data = await contextService.generateOptions({
        caregiverQuestion: qText,
        language: lang
      });
      setOptions(data.options || []);
    } catch (err) {
      console.error('Error fetching dynamic options:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = async (option) => {
    setSelectedId(option.id);
    setSubmissionStatus('submitting');

    const payload = {
      patientId: patientId || 'demo_patient_id',
      semanticIntent: option.intent,
      responseText: option.text,
      language: language,
      caregiverQuestion: question,
      attemptType: 'ContextSelect'
    };

    // Save intent record to MongoDB Atlas
    const result = await contextService.submitIntent(payload);

    // Trigger Patient Voice Profile Speech Synthesis
    const speechResult = await voiceService.playSynthesizedAudio({
      patientId: patientId || 'demo_patient_id',
      text: option.text,
      language: language === 'kn' ? 'Kannada' : language === 'hi' ? 'Hindi' : 'English',
      emotion: 'neutral'
    });

    if (speechResult && speechResult.provider) {
      setActiveVoiceProvider(speechResult.provider);
    }

    setSubmissionStatus('submitted');

    if (onSelectOption) {
      onSelectOption({
        semanticIntent: option.intent,
        responseText: option.text,
        language: language,
        optionId: option.id,
        recordId: result?.data?.recordId,
        voiceProvider: speechResult?.provider
      });
    }
  };

  const getOptionIcon = (intent) => {
    const i = (intent || '').toUpperCase();
    if (i.includes('MEAL') || i.includes('EAT') || i.includes('HUNGRY')) return Sparkles;
    if (i.includes('PAIN') || i.includes('FEEL')) return Activity;
    if (i.includes('MEDICINE')) return Heart;
    if (i.includes('HELP') || i.includes('EMERGENCY')) return AlertCircle;
    return CheckCircle2;
  };

  return (
    <div className="dynamic-communication-card bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl max-w-2xl mx-auto my-4 text-white">
      {/* Header & Language Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-500/10 text-indigo-400 rounded-xl border border-indigo-500/20">
            <MessageSquare className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-100">Dynamic Response Options</h3>
            <p className="text-xs text-slate-400">Aphasia-friendly context options & semantic intent</p>
          </div>
        </div>

        {/* Language Selector Buttons */}
        <div className="flex items-center gap-1.5 bg-slate-800/80 p-1 rounded-xl border border-slate-700/50">
          <Globe className="w-4 h-4 text-slate-400 ml-2" />
          <button
            type="button"
            onClick={() => setLanguage('en')}
            className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${
              language === 'en' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            English
          </button>
          <button
            type="button"
            onClick={() => setLanguage('kn')}
            className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${
              language === 'kn' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            ಕನ್ನಡ
          </button>
          <button
            type="button"
            onClick={() => setLanguage('hi')}
            className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${
              language === 'hi' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            हिंदी
          </button>
        </div>
      </div>

      {/* Incoming Caregiver Question Banner */}
      <div className="mb-6 bg-slate-800/50 border border-slate-700/60 rounded-xl p-4">
        <span className="text-xs font-medium text-indigo-400 uppercase tracking-wider block mb-1">
          Caregiver Question
        </span>
        <p className="text-base sm:text-lg font-semibold text-slate-100 italic">
          "{question || 'How are you feeling today?'}"
        </p>
      </div>

      {/* Voice Provider Badge */}
      {activeVoiceProvider && (
        <div className="mb-4 px-3 py-2 bg-indigo-950/60 border border-indigo-500/30 rounded-lg flex items-center justify-between text-xs text-indigo-300">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-400 animate-pulse" />
            <span>Voice Profile Output: <strong>{activeVoiceProvider}</strong></span>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-900/80 text-indigo-200 border border-indigo-700/40">
            {language.toUpperCase()}
          </span>
        </div>
      )}

      {/* Loading Skeleton / Response Option Cards */}
      {loading ? (
        <div className="flex items-center justify-center py-12 gap-3 text-slate-400">
          <RefreshCw className="w-5 h-5 animate-spin text-indigo-400" />
          <span className="text-sm font-medium">Generating dynamic response options...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3.5">
          {options.map((opt) => {
            const IconComp = getOptionIcon(opt.intent);
            const isSelected = selectedId === opt.id;

            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => handleSelect(opt)}
                className={`relative w-full text-left p-4 sm:p-5 rounded-xl border transition-all duration-200 flex items-center justify-between group ${
                  isSelected
                    ? 'bg-indigo-950/70 border-indigo-500 shadow-lg shadow-indigo-500/10 ring-2 ring-indigo-500/40'
                    : 'bg-slate-800/40 border-slate-700/60 hover:bg-slate-800 hover:border-slate-600'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`p-3 rounded-xl transition-colors ${
                      isSelected
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-700/50 text-slate-300 group-hover:bg-slate-700 group-hover:text-indigo-400'
                    }`}
                  >
                    <IconComp className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="text-base sm:text-lg font-bold text-slate-100 group-hover:text-white">
                      {opt.text}
                    </div>
                    <div className="text-xs font-mono text-slate-400 mt-0.5 flex items-center gap-2">
                      <span className="inline-block w-1.5 h-1.5 rounded-full bg-indigo-400"></span>
                      Intent: <span className="text-indigo-300 font-semibold">{opt.intent}</span>
                    </div>
                  </div>
                </div>

                {isSelected && (
                  <div className="flex items-center gap-2 text-emerald-400 font-semibold text-xs sm:text-sm bg-emerald-950/60 px-3 py-1.5 rounded-lg border border-emerald-500/30">
                    <CheckCircle2 className="w-4 h-4" />
                    Selected
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Selected Intent Summary / Confirmation Footer */}
      {selectedId && submissionStatus === 'submitted' && (
        <div className="mt-6 p-4 rounded-xl bg-emerald-950/30 border border-emerald-500/30 flex items-center justify-between text-xs sm:text-sm">
          <div className="text-emerald-300 font-medium">
            Response recorded to Communication History. Ready for Phase D voice engine.
          </div>
          <div className="text-slate-400 font-mono text-xs">
            Language: <span className="uppercase text-slate-200 font-bold">{language}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default DynamicCommunicationModule;
