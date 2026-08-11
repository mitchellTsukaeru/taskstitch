import { ArrowLeft, Bug, Check, ChevronRight, EyeOff, Globe, Shield, Sparkles, Star, Timer } from 'lucide-react';
import { useEffect, useState } from 'react';
import { i18n } from '#imports';
import { PRESET_LABELS, type PresetKey } from '@/core/blur/regexes';
import { AI_PROVIDERS, type AIProviderKey, CUSTOM_MODEL_ID, isPresetModel } from '@/core/capture/ai/models';
import { AI_LANGUAGES, type AILanguageCode } from '@/core/capture/ai/prompts';
import { DEFAULT_SCREENSHOT_TIMING, SCREENSHOT_TIMINGS, type ScreenshotTiming } from '@/core/capture/screenshot-timing';
import { localStorage } from '@/lib/browser-api';
import { UI_LANGUAGES, type UILanguageCode } from '@/lib/ui-language';
import { Button } from '@/ui/components/ui/button';
import { Input } from '@/ui/components/ui/input';
import MascotIcon from '@/ui/fullview/components/MascotIcon';

interface SettingsViewProps {
  onBack?: () => void;
}

export default function SettingsView({ onBack }: SettingsViewProps) {
  const [provider, setProvider] = useState<AIProviderKey>('openai');
  const [model, setModel] = useState(AI_PROVIDERS.openai.defaultModel);
  const [apiKey, setApiKey] = useState('');
  const [baseUrl, setBaseUrl] = useState('');
  const [saved, setSaved] = useState(false);
  const [aiLanguage, setAiLanguage] = useState<AILanguageCode>('en');
  const [uiLanguage, setUiLanguage] = useState<UILanguageCode>('browser');
  const [aiIncludeScreenshots, setAiIncludeScreenshots] = useState(false);
  const [screenshotTiming, setScreenshotTiming] = useState<ScreenshotTiming>(DEFAULT_SCREENSHOT_TIMING);
  const [blurPresets, setBlurPresets] = useState<Record<PresetKey, boolean>>({
    email: true,
    phone: true,
    ssn: false,
    creditCard: false,
    ipAddress: false,
    macAddress: false,
  });

  useEffect(() => {
    localStorage
      .get([
        'aiApiKey',
        'aiProvider',
        'aiModel',
        'aiBaseUrl',
        'aiLanguage',
        'uiLanguage',
        'aiIncludeScreenshots',
        'blurPresets',
        'screenshotTiming',
      ])
      .then((result) => {
        const p = (result.aiProvider as AIProviderKey) || 'openai';
        setProvider(p);
        setModel((result.aiModel as string) || AI_PROVIDERS[p].defaultModel);
        if (result.aiApiKey) setApiKey(result.aiApiKey as string);
        if (result.aiBaseUrl) setBaseUrl(result.aiBaseUrl as string);
        if (result.aiLanguage) setAiLanguage(result.aiLanguage as AILanguageCode);
        if (UI_LANGUAGES.some((language) => language.code === result.uiLanguage)) {
          setUiLanguage(result.uiLanguage as UILanguageCode);
        }
        setAiIncludeScreenshots(result.aiIncludeScreenshots === true);
        if (result.blurPresets) setBlurPresets(result.blurPresets as Record<PresetKey, boolean>);
        const storedTiming = result.screenshotTiming as string | undefined;
        if (storedTiming && storedTiming in SCREENSHOT_TIMINGS) {
          setScreenshotTiming(storedTiming as ScreenshotTiming);
        }
      });
  }, []);

  const handleProviderChange = (newProvider: AIProviderKey) => {
    setProvider(newProvider);
    setModel(AI_PROVIDERS[newProvider].defaultModel);
  };

  const handleSave = async () => {
    await localStorage.set({
      aiApiKey: apiKey,
      aiProvider: provider,
      aiModel: model,
      aiBaseUrl: baseUrl.trim(),
      aiLanguage,
      uiLanguage,
      aiIncludeScreenshots,
      blurPresets,
      screenshotTiming,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const providerConfig = AI_PROVIDERS[provider];
  const modelSelection = isPresetModel(provider, model) ? model : CUSTOM_MODEL_ID;

  const BLUR_PRESET_I18N: Record<PresetKey, string> = {
    email: 'blurPresets.email',
    phone: 'blurPresets.phoneNumbers',
    ssn: 'blurPresets.ssn',
    creditCard: 'blurPresets.creditCard',
    ipAddress: 'blurPresets.ipAddress',
    macAddress: 'blurPresets.macAddress',
  };

  return (
    <div className="bg-card flex flex-col">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
        {onBack && (
          <button
            onClick={onBack}
            className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-secondary transition-colors"
          >
            <ArrowLeft size={16} />
          </button>
        )}
        <h1 className="text-[15px] font-bold text-foreground">{i18n.t('settings.title')}</h1>
      </div>

      <div className="flex-1 px-3 py-4 space-y-3">
        <div className="border border-border rounded-[10px] p-3.5 space-y-3">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-secondary flex items-center justify-center">
              <Globe size={14} className="text-accent" />
            </div>
            <span className="text-xs font-bold text-foreground">{i18n.t('settings.languageSettings')}</span>
          </div>

          <div>
            <label htmlFor="interface-language" className="block text-[11px] font-semibold text-foreground mb-1">
              {i18n.t('settings.interfaceLanguage')}
            </label>
            <select
              id="interface-language"
              value={uiLanguage}
              onChange={(event) => setUiLanguage(event.target.value as UILanguageCode)}
              className="w-full border border-border rounded-lg px-3 py-2 text-[13px] text-foreground bg-card font-medium outline-none focus:border-ring focus:ring-2 focus:ring-ring/10"
            >
              {UI_LANGUAGES.map((language) => (
                <option key={language.code} value={language.code}>
                  {language.code === 'browser' ? i18n.t('settings.browserLanguage') : language.label}
                </option>
              ))}
            </select>
            <p className="mt-1 text-[10px] leading-relaxed text-muted-foreground">
              {i18n.t('settings.interfaceLanguageHelp')}
            </p>
          </div>

          <div className="border-t border-secondary pt-3">
            <label htmlFor="ai-language" className="block text-[11px] font-semibold text-foreground mb-1">
              {i18n.t('settings.aiLanguage')}
            </label>
            <select
              id="ai-language"
              value={aiLanguage}
              onChange={(event) => setAiLanguage(event.target.value as AILanguageCode)}
              className="w-full border border-border rounded-lg px-3 py-2 text-[13px] text-foreground bg-card font-medium outline-none focus:border-ring focus:ring-2 focus:ring-ring/10"
            >
              {AI_LANGUAGES.map((language) => (
                <option key={language.code} value={language.code}>
                  {language.label}
                </option>
              ))}
            </select>
            <p className="mt-1 text-[10px] leading-relaxed text-muted-foreground">
              {i18n.t('settings.aiLanguageHelp')}
            </p>
          </div>
        </div>

        <div className="border border-border rounded-[10px] p-3.5 space-y-3">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-secondary flex items-center justify-center">
              <Sparkles size={14} className="text-accent" />
            </div>
            <span className="text-xs font-bold text-foreground">{i18n.t('settings.aiDescriptions')}</span>
          </div>

          <div>
            <label htmlFor="ai-provider" className="block text-[11px] font-semibold text-foreground mb-1">
              {i18n.t('settings.provider')}
            </label>
            <select
              id="ai-provider"
              value={provider}
              onChange={(e) => handleProviderChange(e.target.value as AIProviderKey)}
              className="w-full border border-border rounded-lg px-3 py-2 text-[13px] text-foreground bg-card font-medium outline-none focus:border-ring focus:ring-2 focus:ring-ring/10"
            >
              {Object.entries(AI_PROVIDERS).map(([key, cfg]) => (
                <option key={key} value={key}>
                  {cfg.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="ai-model" className="block text-[11px] font-semibold text-foreground mb-1">
              {i18n.t('settings.model')}
            </label>
            <select
              id="ai-model"
              value={modelSelection}
              onChange={(e) => setModel(e.target.value === CUSTOM_MODEL_ID ? '' : e.target.value)}
              className="w-full border border-border rounded-lg px-3 py-2 text-[13px] text-foreground bg-card font-medium outline-none focus:border-ring focus:ring-2 focus:ring-ring/10"
            >
              {providerConfig.models.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.label}
                </option>
              ))}
              <option value={CUSTOM_MODEL_ID}>{i18n.t('settings.customModel')}</option>
            </select>
          </div>

          {modelSelection === CUSTOM_MODEL_ID && (
            <div>
              <label htmlFor="ai-custom-model" className="block text-[11px] font-semibold text-foreground mb-1">
                {i18n.t('settings.customModelId')}
              </label>
              <Input
                id="ai-custom-model"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder={i18n.t('settings.customModelPlaceholder')}
              />
            </div>
          )}

          <div>
            <label htmlFor="ai-api-key" className="block text-[11px] font-semibold text-foreground mb-1">
              {i18n.t('settings.apiKey')}
            </label>
            <Input
              id="ai-api-key"
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="sk-..."
            />
          </div>

          <div>
            <label htmlFor="ai-base-url" className="block text-[11px] font-semibold text-foreground mb-1">
              {i18n.t('settings.baseUrl')}
            </label>
            <Input
              id="ai-base-url"
              type="url"
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              placeholder="https://api.example.com/v1"
            />
            <p className="mt-1 text-[10px] leading-relaxed text-muted-foreground">{i18n.t('settings.baseUrlHelp')}</p>
          </div>

          <label className="flex items-start gap-2.5 rounded-lg border border-border p-3 cursor-pointer hover:border-accent/60">
            <input
              type="checkbox"
              checked={aiIncludeScreenshots}
              onChange={(event) => setAiIncludeScreenshots(event.target.checked)}
              className="mt-0.5 accent-accent"
            />
            <span>
              <span className="block text-[11px] font-semibold text-foreground">
                Include screenshots when improving guides
              </span>
              <span className="block text-[10px] leading-relaxed text-muted-foreground mt-0.5">
                Off by default. TaskStitch asks again before sending up to eight downscaled saved screenshots.
              </span>
            </span>
          </label>
        </div>

        <div className="border border-border rounded-[10px] p-3.5 space-y-3">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-secondary flex items-center justify-center">
              <Timer size={14} className="text-accent" />
            </div>
            <span className="text-xs font-bold text-foreground">{i18n.t('settings.captureTiming')}</span>
          </div>

          <div>
            <label htmlFor="screenshot-timing" className="block text-[11px] font-semibold text-foreground mb-1">
              {i18n.t('settings.screenshotDelay')}
            </label>
            <select
              id="screenshot-timing"
              value={screenshotTiming}
              onChange={(e) => setScreenshotTiming(e.target.value as ScreenshotTiming)}
              className="w-full border border-border rounded-lg px-3 py-2 text-[13px] text-foreground bg-card font-medium outline-none focus:border-ring focus:ring-2 focus:ring-ring/10"
            >
              <option value="fast">{i18n.t('settings.captureTimingFast')}</option>
              <option value="normal">{i18n.t('settings.captureTimingNormal')}</option>
              <option value="slow">{i18n.t('settings.captureTimingSlow')}</option>
            </select>
            <p className="mt-1 text-[10px] leading-relaxed text-muted-foreground">
              {i18n.t('settings.captureTimingHelp')}
            </p>
          </div>
        </div>

        <div className="border border-border rounded-[10px] p-3.5 space-y-1">
          <div className="flex items-center gap-2.5 mb-2">
            <div className="w-7 h-7 rounded-lg bg-secondary flex items-center justify-center">
              <EyeOff size={14} className="text-accent" />
            </div>
            <span className="text-xs font-bold text-foreground">{i18n.t('settings.smartBlur')}</span>
          </div>

          {(Object.keys(PRESET_LABELS) as PresetKey[]).map((key, i, arr) => (
            <div
              key={key}
              className={`flex items-center justify-between py-2 ${i < arr.length - 1 ? 'border-b border-secondary' : ''}`}
            >
              <span className="text-xs font-medium text-foreground">{i18n.t(BLUR_PRESET_I18N[key])}</span>
              <button
                onClick={() =>
                  setBlurPresets((prev) => {
                    const next = { ...prev, [key]: !prev[key] };
                    localStorage.set({ blurPresets: next });
                    return next;
                  })
                }
                className={`w-9 h-5 rounded-full transition-colors relative ${
                  blurPresets[key] ? 'bg-accent' : 'bg-border'
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${
                    blurPresets[key] ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          ))}
        </div>

        <Button
          onClick={handleSave}
          disabled={saved}
          className="w-full transition-all duration-300"
          style={saved ? { backgroundColor: 'var(--color-success)', color: '#fff', opacity: 0.9 } : undefined}
        >
          {saved && <Check size={16} />}
          {saved ? i18n.t('settings.saved') : i18n.t('settings.saveSettings')}
        </Button>

        <div className="flex items-start gap-2 px-3 py-2.5 rounded-lg bg-secondary text-[10px] text-muted-foreground leading-relaxed">
          <Shield size={12} className="shrink-0 mt-0.5 text-accent" />
          <span>{i18n.t('settings.privacyNotice')}</span>
        </div>

        <a
          href="https://github.com/mitchellTsukaeru/taskstitch/issues"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg border border-border text-[11px] font-medium text-muted-foreground hover:text-foreground hover:border-accent transition-colors"
        >
          <Bug size={13} className="shrink-0" />
          <span>{i18n.t('settings.bugReport')}</span>
        </a>

        <div className="flex items-center gap-3.5 border border-border rounded-[10px] p-3.5">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary">
            <MascotIcon size={32} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-foreground mb-0.5">{i18n.t('settings.starCtaTitle')}</p>
            <p className="text-[10px] text-muted-foreground leading-relaxed mb-2">
              {i18n.t('settings.starCtaMessage')}
            </p>
            <a
              href="https://github.com/mitchellTsukaeru/taskstitch"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary text-[10px] font-semibold text-accent hover:bg-accent hover:text-white transition-colors"
            >
              <Star size={11} fill="#FBBF24" className="text-[#FBBF24]" />
              {i18n.t('settings.starOnGithub')}
              <ChevronRight size={11} />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
