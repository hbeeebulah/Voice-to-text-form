import React, { useState, useEffect, useRef, useCallback } from 'react';
import Navbar from './components/common/Navbar';
import FormBuilder from './components/builder/FormBuilder';
import FormResponder from './components/responder/FormResponder';
import ResponseAnalytics from './components/analytics/ResponseAnalytics';
import ThemeCustomizer from './components/theme/ThemeCustomizer';
import FormsDashboard from './components/dashboard/FormsDashboard';
import ApiKeyModal from './components/common/ApiKeyModal';
import ShareModal from './components/common/ShareModal';
import {
  fetchForms,
  fetchForm,
  createForm,
  updateForm,
  deleteForm,
  duplicateForm,
  getTranscribeStatus
} from './services/api';

export default function App() {
  const [view, setView] = useState('dashboard'); // 'dashboard' | 'builder' | 'responder'
  const [activeTab, setActiveTab] = useState('questions'); // 'questions' | 'responses' | 'theme'
  const [forms, setForms] = useState([]);
  const [currentForm, setCurrentForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isThemeOpen, setIsThemeOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isApiKeyOpen, setIsApiKeyOpen] = useState(false);
  const [hasApiKey, setHasApiKey] = useState(false);

  const autosaveTimerRef = useRef(null);

  // Initialize and check hash routing
  useEffect(() => {
    loadInitialData();

    // Check hash changes (e.g. #form/customer-feedback-demo)
    const handleHash = () => {
      const hash = window.location.hash;
      if (hash.startsWith('#form/')) {
        const id = hash.replace('#form/', '');
        openFormById(id, 'responder');
      } else if (hash.startsWith('#edit/')) {
        const id = hash.replace('#edit/', '');
        openFormById(id, 'builder');
      }
    };

    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      const [formsData, transcribeStatus] = await Promise.all([
        fetchForms(),
        getTranscribeStatus()
      ]);
      setForms(formsData);
      setHasApiKey(Boolean(transcribeStatus.configured));

      // Check initial hash
      const hash = window.location.hash;
      if (hash.startsWith('#form/')) {
        const id = hash.replace('#form/', '');
        await openFormById(id, 'responder');
      } else if (hash.startsWith('#edit/')) {
        const id = hash.replace('#edit/', '');
        await openFormById(id, 'builder');
      } else if (formsData.length > 0) {
        // Default to first form in builder for quick preview
        const first = await fetchForm(formsData[0].id);
        setCurrentForm(first);
        setView('builder');
      }
    } catch (err) {
      console.error('Initialization error:', err);
    } finally {
      setLoading(false);
    }
  };

  const openFormById = async (id, targetView = 'builder') => {
    try {
      setLoading(true);
      const form = await fetchForm(id);
      setCurrentForm(form);
      setView(targetView);
      if (targetView === 'builder') {
        window.location.hash = `#edit/${id}`;
      } else if (targetView === 'responder') {
        window.location.hash = `#form/${id}`;
      }
    } catch (err) {
      alert(`Could not open form: ${err.message}`);
      setView('dashboard');
    } finally {
      setLoading(false);
    }
  };

  // Autosave implementation with 750ms debounce
  const handleUpdateForm = (updates) => {
    if (!currentForm) return;

    const updated = {
      ...currentForm,
      ...updates,
      theme: updates.theme ? { ...currentForm.theme, ...updates.theme } : currentForm.theme,
      settings: updates.settings ? { ...currentForm.settings, ...updates.settings } : currentForm.settings
    };

    setCurrentForm(updated);

    if (autosaveTimerRef.current) {
      clearTimeout(autosaveTimerRef.current);
    }

    setIsSaving(true);
    autosaveTimerRef.current = setTimeout(async () => {
      try {
        await updateForm(updated.id, updated);
      } catch (err) {
        console.error('Autosave error:', err);
      } finally {
        setIsSaving(false);
      }
    }, 750);
  };

  const handleCreateNewForm = async (templateData = {}) => {
    try {
      setLoading(true);
      const created = await createForm(templateData);
      setForms(prev => [created, ...prev]);
      setCurrentForm(created);
      setView('builder');
      setActiveTab('questions');
      window.location.hash = `#edit/${created.id}`;
    } catch (err) {
      alert(`Failed to create form: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDuplicate = async (formId) => {
    try {
      const duplicated = await duplicateForm(formId);
      setForms(prev => [duplicated, ...prev]);
      await openFormById(duplicated.id, 'builder');
    } catch (err) {
      alert(`Failed to duplicate: ${err.message}`);
    }
  };

  const handleDelete = async (formId) => {
    if (!window.confirm('Are you sure you want to delete this form and all its responses?')) {
      return;
    }
    try {
      await deleteForm(formId);
      const updatedForms = forms.filter(f => f.id !== formId);
      setForms(updatedForms);
      if (currentForm?.id === formId) {
        if (updatedForms.length > 0) {
          openFormById(updatedForms[0].id, 'builder');
        } else {
          setView('dashboard');
          setCurrentForm(null);
        }
      }
    } catch (err) {
      alert(`Failed to delete: ${err.message}`);
    }
  };

  if (loading && !currentForm && forms.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-semibold text-slate-600">Loading Form Studio...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col antialiased">
      {/* Top Navbar (visible in builder and responder) */}
      {view !== 'dashboard' && currentForm && (
        <Navbar
          formTitle={currentForm.title}
          onTitleChange={(title) => handleUpdateForm({ title })}
          activeTab={activeTab}
          setActiveTab={(tab) => {
            setActiveTab(tab);
            if (tab === 'theme') setIsThemeOpen(true);
          }}
          responseCount={currentForm.responseCount || 0}
          isSaving={isSaving}
          onOpenTheme={() => setIsThemeOpen(true)}
          onOpenPreview={() => {
            if (view === 'builder') {
              setView('responder');
              window.location.hash = `#form/${currentForm.id}`;
            } else {
              setView('builder');
              window.location.hash = `#edit/${currentForm.id}`;
            }
          }}
          onOpenShare={() => setIsShareOpen(true)}
          onOpenApiKey={() => setIsApiKeyOpen(true)}
          onGoToDashboard={() => {
            setView('dashboard');
            window.location.hash = '';
            fetchForms().then(setForms).catch(() => {});
          }}
          hasApiKey={hasApiKey}
          mode={view}
        />
      )}

      {/* Main Content Area */}
      <main className="flex-1 relative flex">
        {/* VIEW 1: FORMS DASHBOARD */}
        {view === 'dashboard' && (
          <div className="flex-1">
            <FormsDashboard
              forms={forms}
              onSelectForm={(id, mode) => {
                if (mode === 'analytics') {
                  openFormById(id, 'builder').then(() => setActiveTab('responses'));
                } else {
                  openFormById(id, 'builder');
                }
              }}
              onCreateForm={handleCreateNewForm}
              onDuplicateForm={handleDuplicate}
              onDeleteForm={handleDelete}
              onOpenResponder={(id) => openFormById(id, 'responder')}
            />
          </div>
        )}

        {/* VIEW 2: FORM BUILDER */}
        {view === 'builder' && currentForm && (
          <div className="flex-1 overflow-x-hidden">
            {activeTab === 'questions' && (
              <FormBuilder
                form={currentForm}
                onUpdateForm={handleUpdateForm}
                onOpenTheme={() => setIsThemeOpen(true)}
                onOpenPreview={() => {
                  setView('responder');
                  window.location.hash = `#form/${currentForm.id}`;
                }}
                onOpenShare={() => setIsShareOpen(true)}
              />
            )}

            {activeTab === 'responses' && (
              <ResponseAnalytics
                form={currentForm}
                onOpenResponderPreview={() => {
                  setView('responder');
                  window.location.hash = `#form/${currentForm.id}`;
                }}
              />
            )}

            {activeTab === 'theme' && !isThemeOpen && (
              <div className="max-w-2xl mx-auto py-10 px-4">
                <ThemeCustomizer
                  theme={currentForm.theme}
                  onUpdateTheme={(themeUpdates) => handleUpdateForm({ theme: themeUpdates })}
                  onClose={() => setActiveTab('questions')}
                  isOpen={true}
                />
              </div>
            )}
          </div>
        )}

        {/* VIEW 3: FORM RESPONDER (Public Fill-out View) */}
        {view === 'responder' && currentForm && (
          <div className="flex-1">
            <FormResponder
              form={currentForm}
              onBackToBuilder={() => {
                setView('builder');
                window.location.hash = `#edit/${currentForm.id}`;
              }}
            />
          </div>
        )}

        {/* Floating Side Drawer: Theme & Design Customizer */}
        {isThemeOpen && currentForm && (
          <div className="fixed inset-y-0 right-0 z-50 w-full max-w-sm sm:max-w-md shadow-2xl">
            <ThemeCustomizer
              theme={currentForm.theme}
              onUpdateTheme={(themeUpdates) => handleUpdateForm({ theme: themeUpdates })}
              onClose={() => {
                setIsThemeOpen(false);
                if (activeTab === 'theme') setActiveTab('questions');
              }}
              isOpen={isThemeOpen}
            />
          </div>
        )}
      </main>

      {/* Share Modal */}
      {currentForm && (
        <ShareModal
          isOpen={isShareOpen}
          onClose={() => setIsShareOpen(false)}
          formId={currentForm.id}
          formTitle={currentForm.title}
        />
      )}

      {/* Voice AI Engine Modal */}
      <ApiKeyModal
        isOpen={isApiKeyOpen}
        onClose={() => setIsApiKeyOpen(false)}
        onKeyUpdated={() => setHasApiKey(true)}
      />
    </div>
  );
}
