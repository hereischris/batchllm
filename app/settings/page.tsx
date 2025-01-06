'use client';

import { useState, useEffect } from 'react';
import { getSettings, saveSettings } from '@/lib/db';

export default function SettingsPage() {
  const [apiKey, setApiKey] = useState('');
  const [provider, setProvider] = useState('openai');
  const [isSaving, setIsSaving] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');

  useEffect(() => {
    const loadSettings = async () => {
      const settings = await getSettings();
      if (settings) {
        setApiKey(settings.apiKey);
        setProvider(settings.provider);
      }
    };
    loadSettings();
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await saveSettings({
        id: 'default',
        apiKey,
        provider,
      });
      setStatus('success');
      setTimeout(() => setStatus('idle'), 2000);
    } catch (error) {
      setStatus('error');
      setTimeout(() => setStatus('idle'), 2000);
    }
    setIsSaving(false);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="space-y-12">
        <div className="border-b border-gray-900/10 pb-12">
          <h2 className="text-base font-semibold leading-7 text-gray-900">API Settings</h2>
          <p className="mt-1 text-sm leading-6 text-gray-600">
            Configure your AI provider settings. Your API key will be stored locally.
          </p>

          <div className="mt-10 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
            <div className="sm:col-span-4">
              <label htmlFor="provider" className="block text-sm font-medium leading-6 text-gray-900">
                AI Provider
              </label>
              <div className="mt-2">
                <select
                  id="provider"
                  name="provider"
                  value={provider}
                  onChange={(e) => setProvider(e.target.value)}
                  className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:max-w-xs sm:text-sm sm:leading-6"
                >
                  <option value="openai">OpenAI</option>
                  <option value="anthropic">Anthropic</option>
                  <option value="google">Google AI</option>
                </select>
              </div>
            </div>

            <div className="col-span-full">
              <label htmlFor="api-key" className="block text-sm font-medium leading-6 text-gray-900">
                API Key
              </label>
              <div className="mt-2">
                <input
                  type="password"
                  name="api-key"
                  id="api-key"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                  placeholder="sk-..."
                />
              </div>
              <p className="mt-3 text-sm leading-6 text-gray-600">
                Your API key will be stored securely in your browser&apos;s local storage.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 flex items-center justify-end gap-x-6">
        <button
          type="button"
          className="text-sm font-semibold leading-6 text-gray-900"
          onClick={() => {
            setApiKey('');
            setProvider('openai');
          }}
        >
          Reset
        </button>
        <button
          type="button"
          className={`rounded-md px-3 py-2 text-sm font-semibold text-white shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${
            status === 'success'
              ? 'bg-green-600 hover:bg-green-500 focus-visible:outline-green-600'
              : status === 'error'
              ? 'bg-red-600 hover:bg-red-500 focus-visible:outline-red-600'
              : 'bg-blue-600 hover:bg-blue-500 focus-visible:outline-blue-600'
          }`}
          onClick={handleSave}
          disabled={isSaving}
        >
          {isSaving ? 'Saving...' : status === 'success' ? 'Saved!' : status === 'error' ? 'Error!' : 'Save'}
        </button>
      </div>
    </div>
  );
} 