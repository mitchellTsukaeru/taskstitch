// @vitest-environment happy-dom

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import SettingsView from '../SettingsView';

const { storageGet, storageSet } = vi.hoisted(() => ({
  storageGet: vi.fn(),
  storageSet: vi.fn(),
}));

vi.mock('@/lib/browser-api', () => ({
  localStorage: {
    get: storageGet,
    set: storageSet,
  },
}));

describe('SettingsView AI configuration', () => {
  beforeEach(() => {
    storageGet.mockReset();
    storageSet.mockReset();
    storageGet.mockResolvedValue({});
    storageSet.mockResolvedValue(undefined);
  });

  it('offers Japanese descriptions', async () => {
    render(<SettingsView />);

    const language = await screen.findByLabelText('settings.aiLanguage');
    expect(language.textContent).toContain('日本語');
  });

  it('loads and saves a Japanese interface independently from the AI language', async () => {
    storageGet.mockResolvedValue({ uiLanguage: 'ja', aiLanguage: 'en' });

    render(<SettingsView />);

    const interfaceLanguage = (await screen.findByLabelText('settings.interfaceLanguage')) as HTMLSelectElement;
    expect(interfaceLanguage.value).toBe('ja');
    expect((screen.getByLabelText('settings.aiLanguage') as HTMLSelectElement).value).toBe('en');

    fireEvent.change(interfaceLanguage, { target: { value: 'en' } });
    fireEvent.click(screen.getByRole('button', { name: 'settings.saveSettings' }));

    await waitFor(() => {
      expect(storageSet).toHaveBeenCalledWith(expect.objectContaining({ uiLanguage: 'en', aiLanguage: 'en' }));
    });
  });

  it('loads and saves a custom model ID without changing the direct BYOK settings shape', async () => {
    storageGet.mockResolvedValue({
      aiApiKey: 'local-test-key',
      aiProvider: 'openai',
      aiModel: 'ft:gpt-5.6-luna:example:guide-writer',
      aiBaseUrl: 'https://api.example.test/v1',
      aiLanguage: 'ja',
    });

    render(<SettingsView />);

    const modelChoice = (await screen.findByLabelText('settings.model')) as HTMLSelectElement;
    expect(modelChoice.value).toBe('__custom__');

    const customModel = screen.getByLabelText('settings.customModelId') as HTMLInputElement;
    expect(customModel.value).toBe('ft:gpt-5.6-luna:example:guide-writer');
    fireEvent.change(customModel, { target: { value: 'gpt-5.6-custom-team-model' } });
    const baseUrl = screen.getByLabelText('settings.baseUrl') as HTMLInputElement;
    expect(baseUrl.value).toBe('https://api.example.test/v1');
    fireEvent.change(baseUrl, { target: { value: ' https://gateway.example.test/v1 ' } });
    fireEvent.click(screen.getByRole('button', { name: 'settings.saveSettings' }));

    await waitFor(() => {
      expect(storageSet).toHaveBeenCalledWith(
        expect.objectContaining({
          aiApiKey: 'local-test-key',
          aiProvider: 'openai',
          aiModel: 'gpt-5.6-custom-team-model',
          aiBaseUrl: 'https://gateway.example.test/v1',
          aiLanguage: 'ja',
        }),
      );
    });
  });

  it('defaults to Normal screenshot timing and saves the selected timing', async () => {
    render(<SettingsView />);

    const timing = (await screen.findByLabelText('settings.screenshotDelay')) as HTMLSelectElement;
    expect(timing.value).toBe('normal');

    fireEvent.change(timing, { target: { value: 'slow' } });
    fireEvent.click(screen.getByRole('button', { name: 'settings.saveSettings' }));

    await waitFor(() => {
      expect(storageSet).toHaveBeenCalledWith(expect.objectContaining({ screenshotTiming: 'slow' }));
    });
  });
});
