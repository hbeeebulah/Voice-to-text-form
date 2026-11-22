import React, { useState, useEffect, useRef, useCallback, Suspense, lazy } from 'react';
import Navbar from './components/common/Navbar';
import LandingPage from './components/landing/LandingPage';
import FormsDashboard from './components/dashboard/FormsDashboard';

// Code-split heavy views to drastically reduce initial JS load time
const FormBuilder = lazy(() => import('./components/builder/FormBuilder'));
const FormResponder = lazy(() => import('./components/responder/FormResponder'));
const ResponseAnalytics = lazy(() => import('./components/analytics/ResponseAnalytics'));
const ThemeCustomizer = lazy(() => import('./components/theme/ThemeCustomizer'));
const ShareModal = lazy(() => import('./components/common/ShareModal'));
const AddUsersModal = lazy(() => import('./components/collaborators/AddUsersModal'));
const AdminAnalytics = lazy(() => import('./components/admin/AdminAnalytics'));
const ApiKeyModal = lazy(() => import('./components/common/ApiKeyModal'));
const AuthModal = lazy(() => import('./components/auth/AuthModal'));

import {
  fetchForms,
  fetchForm,
  fetchFormBySlug,
  createForm,
  updateForm,
  deleteForm,
  duplicateForm,
  getTranscribeStatus,
  getCurrentUser,
  getStoredUser,
  logoutUser
} from './services/api';

// Fast synchronous route resolver for instant zero-delay first paint
function getInitialRouteState() {
  if (typeof window === 'undefined') {
    return { view: 'landing', targetFormId: null, targetSlug: null, isEditing: false };
  }
  const pathname = window.location.pathname;
  const hash = window.location.hash;

  if (pathname.startsWith('/admin-analytics') || hash.startsWith('#admin-analytics') || hash.startsWith('#owner-analytics') || hash.startsWith('#secret-analytics')) {
    return { view: 'admin-analytics', targetFormId: null, targetSlug: null, isEditing: false };
  }
  if (pathname.startsWith('/s/') || pathname.startsWith('/f/')) {
    const slug = pathname.replace(/^\/(s|f)\//, '').split('?')[0];
    return { view: 'responder', targetFormId: null, targetSlug: slug, isEditing: false };
  }
  if (hash.startsWith('#s/') || hash.startsWith('#f/')) {
    const slug = hash.replace(/^#(s|f)\//, '').split('?')[0];
    return { view: 'responder', targetFormId: null, targetSlug: slug, isEditing: false };
  }
  if (hash.startsWith('#form/')) {
    const id = hash.replace('#form/', '').split('?')[0];
    return { view: 'responder', targetFormId: id, targetSlug: null, isEditing: false };
  }
  if (hash.startsWith('#edit/')) {
    const id = hash.replace('#edit/', '').split('?')[0];
    return { view: 'builder', targetFormId: id, targetSlug: null, isEditing: true };
  }
  if (hash === '#dashboard') {
    return { view: 'dashboard', targetFormId: null, targetSlug: null, isEditing: false };
  }
  if (hash === '#landing') {
    return { view: 'landing', targetFormId: null, targetSlug: null, isEditing: false };
  }
  const token = localStorage.getItem('voxform_token');
  return { view: token ? 'dashboard' : 'landing', targetFormId: null, targetSlug: null, isEditing: false };
}

export default function App() {
  const initialRoute = getInitialRouteState();
  const [view, setView] = useState(initialRoute.view); // 'landing' | 'dashboard' | 'builder' | 'responder'
  const [activeTab, setActiveTab] = useState('questions'); // 'questions' | 'responses' | 'theme'
  const [forms, setForms] = useState([]);
  const [currentForm, setCurrentForm] = useState(null);
  const [loading, setLoading] = useState(Boolean(initialRoute.targetFormId || initialRoute.targetSlug));
  const [isSaving, setIsSaving] = useState(false);
  const [isThemeOpen, setIsThemeOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isAddUsersOpen, setIsAddUsersOpen] = useState(false);
  const [isApiKeyOpen, setIsApiKeyOpen] = useState(false);
  const [hasApiKey, setHasApiKey] = useState(false);

  // Authentication State - initialize immediately from localStorage for 0ms auth delay
  const [user, setUser] = useState(getStoredUser);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState('login');

  const autosaveTimerRef = useRef(null);
  const activeFormIdRef = useRef(null);

  const canUserEditForm = (form, currentUser) => {
    if (!form) return false;
    // Unowned starter forms or templates without a creator can be edited by any user in studio
    if (!form.creatorId && !form.creatorEmail) return true;

    // If form has a creator, but no user is currently authenticated in state
    if (!currentUser) {
      // Check if user has an auth token in localStorage (session exists)
      const token = localStorage.getItem('voxform_token');
      if (!token) return false;
      return true; // Token exists, allow editor view while session loads
    }

    if (currentUser.role === 'admin') return true;
    if (form.creatorId && String(form.creatorId) === String(currentUser.id)) return true;
    if (form.creatorEmail && currentUser.email && form.creatorEmail.toLowerCase() === currentUser.email.toLowerCase()) return true;
    if (Array.isArray(form.collaborators)) {
      const coll = form.collaborators.find(
        (c) => (c.userId && String(c.userId) === String(currentUser.id)) ||
               (c.email && currentUser.email && c.email.toLowerCase() === currentUser.email.toLowerCase())
      );
      if (coll && (coll.role === 'editor' || coll.role === 'owner')) return true;
    }
    return false;
  };

  useEffect(() => {
    activeFormIdRef.current = currentForm?.id;
  }, [currentForm]);

  // Initialize and check hash routing
  useEffect(() => {
    loadInitialData();

    // Check hash changes (e.g. #form/customer-feedback-demo or #s/my-slug)
    const handleHash = () => {
      const hash = window.location.hash;
      if (hash.startsWith('#form/')) {
        const id = hash.replace('#form/', '').split('?')[0];
        openFormById(id, 'responder');
      } else if (hash.startsWith('#s/') || hash.startsWith('#f/')) {
        const slug = hash.replace(/^#(s|f)\//, '').split('?')[0];
        openFormBySlug(slug, 'responder');
      } else if (hash.startsWith('#edit/')) {
        const id = hash.replace('#edit/', '').split('?')[0];
        openFormById(id, 'builder');
      } else if (hash.startsWith('#admin-analytics') || hash.startsWith('#owner-analytics') || hash.startsWith('#secret-analytics')) {
        setView('admin-analytics');
      } else if (hash === '#dashboard') {
        setView('dashboard');
      } else if (hash === '#landing') {
        setView('landing');
      } else {
        const token = localStorage.getItem('voxform_token');
        if (token) {
          setView('dashboard');
        } else {
          setView('landing');
        }
      }
    };

    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  // Track Single Page Application (SPA) route changes in Google Analytics
  useEffect(() => {
    if (typeof window.gtag === 'function') {
      const pagePath = window.location.pathname + (window.location.hash || '');
      window.gtag('event', 'page_view', {
        page_path: pagePath,
        page_location: window.location.href,
        page_title: currentForm?.title ? `${currentForm.title} | VoxForm AI` : document.title
      });
    }
  }, [view, currentForm?.id, activeTab]);

  const handleUserLogout = useCallback(() => {
    try {
      logoutUser();
    } catch (e) {
      console.warn('Logout error:', e);
    }
    setUser(null);
    setForms([]);
    setCurrentForm(null);
    setView('landing');
    window.location.hash = '#landing';
  }, []);

  const loadInitialData = async () => {
    // 1. Immediately initiate form fetch if visiting a specific form URL
    const route = getInitialRouteState();
    if (route.targetSlug) {
      openFormBySlug(route.targetSlug, 'responder').catch(console.error);
    } else if (route.targetFormId) {
      openFormById(route.targetFormId, route.isEditing ? 'builder' : 'responder').catch(console.error);
    }

    // 2. Fetch background user session and service status without blocking page render
    try {
      const [transcribeStatus, currentUser] = await Promise.all([
        getTranscribeStatus().catch(() => ({ configured: false })),
        getCurrentUser().catch(() => null)
      ]);
      setHasApiKey(Boolean(transcribeStatus?.configured));
      if (currentUser) {
        setUser(currentUser);
        fetchForms(currentUser.id).then(setForms).catch(() => {});
      }
    } catch (err) {
      console.warn('Background initialization notice:', err);
    } finally {
      if (!route.targetSlug && !route.targetFormId) {
        setLoading(false);
      }
    }
  };

  const openFormBySlug = async (slug, targetView = 'responder') => {
    try {
      setLoading(true);
      const form = await fetchFormBySlug(slug);
      setCurrentForm(form);
      activeFormIdRef.current = form.id;
      let effectiveView = targetView;
      if (effectiveView === 'builder' && !canUserEditForm(form, user)) {
        effectiveView = 'responder';
      }
      setView(effectiveView);
      if (effectiveView === 'responder' && window.location.hash !== `#form/${form.id}`) {
        window.location.hash = `#form/${form.id}`;
      } else if (effectiveView === 'builder' && window.location.hash !== `#edit/${form.id}`) {
        window.location.hash = `#edit/${form.id}`;
      }
    } catch (err) {
      alert(`Could not open form with short link "${slug}": ${err.message}`);
      setView('landing');
    } finally {
      setLoading(false);
    }
  };

  const openFormById = async (id, targetView = 'builder', overrideUser) => {
    try {
      setLoading(true);
      let formToUse = currentForm;
      if (activeFormIdRef.current !== id || !formToUse) {
        formToUse = await fetchForm(id);
        setCurrentForm(formToUse);
        activeFormIdRef.current = formToUse.id;
      }

      const activeUser = overrideUser !== undefined ? overrideUser : user;
      let effectiveView = targetView;
      // Only bounce away from builder if target is builder, form has an explicit owner, and user is unauthorized
      if (effectiveView === 'builder' && formToUse?.creatorId && !canUserEditForm(formToUse, activeUser)) {
        effectiveView = 'responder';
      }

      setView(effectiveView);
      if (effectiveView === 'builder') {
        setActiveTab('questions');
        if (window.location.hash !== `#edit/${id}`) {
          window.location.hash = `#edit/${id}`;
        }
      } else if (effectiveView === 'responder') {
        if (window.location.hash !== `#form/${id}`) {
          window.location.hash = `#form/${id}`;
        }
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
      const created = await createForm({
        ...templateData,
        creatorId: user?.id,
        creatorName: user?.name,
        creatorEmail: user?.email
      });
      activeFormIdRef.current = created.id;
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

  if (loading && !currentForm && (view === 'responder' || view === 'builder')) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-semibold text-on-surface-variant">Loading form...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface text-on-surface flex flex-col antialiased selection:bg-primary-container selection:text-on-primary-container">
      <Suspense fallback={
        <div className="flex-1 flex items-center justify-center min-h-[300px]">
          <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      }>
      {/* Top Navbar (visible only in builder studio) */}
      {view === 'builder' && currentForm && (
        <Navbar
          formTitle={currentForm.title}
          isPublished={Boolean(currentForm.isPublished || currentForm.status === 'published')}
          acceptingResponses={currentForm.settings?.acceptingResponses !== false}
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
          onOpenAddUsers={() => setIsAddUsersOpen(true)}
          onOpenApiKey={() => setIsApiKeyOpen(true)}
          onGoToDashboard={() => {
            setView('dashboard');
            window.location.hash = '#dashboard';
            fetchForms().then(setForms).catch(() => {});
          }}
          onGoToMainPage={() => {
            setView('landing');
            window.location.hash = '#landing';
          }}
          hasApiKey={hasApiKey}
          mode={view}
          user={user}
          onUserUpdated={(updated) => setUser(updated)}
          onOpenAuth={(tab = 'login') => {
            setAuthModalTab(tab);
            setIsAuthModalOpen(true);
          }}
          onUserLoggedOut={handleUserLogout}
        />
      )}

      {/* Main Content Area */}
      <main className="flex-1 relative flex">
        {/* VIEW 0: LANDING PAGE */}
        {view === 'landing' && (
          <div className="flex-1">
            <LandingPage
              onOpenAuth={(tab = 'login') => {
                setAuthModalTab(tab);
                setIsAuthModalOpen(true);
              }}
              onOpenResponderDemo={() => {
                if (forms.length > 0) {
                  openFormById(forms[0].id, 'responder');
                } else {
                  openFormById('customer-feedback-demo', 'responder');
                }
              }}
              onExploreDashboard={() => {
                setView('dashboard');
                window.location.hash = '#dashboard';
              }}
            />
          </div>
        )}

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
              onFormImported={(importedForm) => {
                setForms(prev => [importedForm, ...prev]);
                setCurrentForm(importedForm);
                activeFormIdRef.current = importedForm.id;
                setView('builder');
                setActiveTab('questions');
                window.location.hash = `#edit/${importedForm.id}`;
              }}
              onCreateForm={handleCreateNewForm}
              onDuplicateForm={handleDuplicate}
              onDeleteForm={handleDelete}
              onOpenResponder={(id) => openFormById(id, 'responder')}
              onOpenShare={async (form) => {
                setCurrentForm(form);
                setIsShareOpen(true);
              }}
              onOpenAddUsers={async (form) => {
                setCurrentForm(form);
                setIsAddUsersOpen(true);
              }}
              user={user}
              onUserUpdated={(updated) => setUser(updated)}
              onOpenAuth={(tab = 'login') => {
                setAuthModalTab(tab);
                setIsAuthModalOpen(true);
              }}
              onUserLoggedOut={handleUserLogout}
              onGoToMainPage={() => {
                setView('landing');
                window.location.hash = '#landing';
              }}
              onOpenApiKey={() => setIsApiKeyOpen(true)}
              hasApiKey={hasApiKey}
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
                onOpenAddUsers={() => setIsAddUsersOpen(true)}
                onOpenApiKey={() => setIsApiKeyOpen(true)}
                onNavigateTab={(tab) => {
                  if (tab === 'dashboard') {
                    setView('dashboard');
                    window.location.hash = '#dashboard';
                  } else if (tab === 'responses') {
                    setActiveTab('responses');
                  } else if (tab === 'theme') {
                    setIsThemeOpen(true);
                  } else {
                    setActiveTab('questions');
                  }
                }}
              />
            )}

            {activeTab === 'responses' && (
              <ResponseAnalytics
                form={currentForm}
                onUpdateForm={handleUpdateForm}
                onOpenResponderPreview={() => {
                  setView('responder');
                  window.location.hash = `#form/${currentForm.id}`;
                }}
                onOpenTheme={() => setIsThemeOpen(true)}
                onOpenApiKey={() => setIsApiKeyOpen(true)}
                onNavigateTab={(tab) => {
                  if (tab === 'dashboard') {
                    setView('dashboard');
                    window.location.hash = '#dashboard';
                  } else if (tab === 'questions') {
                    setActiveTab('questions');
                  } else if (tab === 'theme') {
                    setIsThemeOpen(true);
                  }
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
              canEdit={canUserEditForm(currentForm, user)}
              onBackToBuilder={
                canUserEditForm(currentForm, user)
                  ? () => {
                      setView('builder');
                      setActiveTab('questions');
                      window.location.hash = `#edit/${currentForm.id}`;
                    }
                  : null
              }
            />
          </div>
        )}

        {/* VIEW 4: PRIVATE ADMIN & USER ANALYTICS */}
        {view === 'admin-analytics' && (
          <div className="flex-1">
            <AdminAnalytics
              onBackToDashboard={() => {
                setView('dashboard');
                window.location.hash = '#dashboard';
              }}
            />
          </div>
        )}

        {/* Floating Side Drawer: Theme & Design Customizer */}
        {isThemeOpen && currentForm && (
          <>
            <div
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 transition-opacity"
              onClick={() => {
                setIsThemeOpen(false);
                if (activeTab === 'theme') setActiveTab('questions');
              }}
            />
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
          </>
        )}
      </main>

      {/* Share / Publish Modal */}
      {currentForm && (
        <ShareModal
          isOpen={isShareOpen}
          onClose={() => setIsShareOpen(false)}
          formId={currentForm.id}
          formTitle={currentForm.title}
          customSlug={currentForm.customSlug}
          isPublished={Boolean(currentForm.isPublished || currentForm.status === 'published')}
          acceptingResponses={currentForm.settings?.acceptingResponses !== false}
          closedMessage={currentForm.settings?.closedMessage || ''}
          onSlugUpdated={(newSlug) => {
            handleUpdateForm({ customSlug: newSlug });
          }}
          onPublishStateChanged={(published) => {
            handleUpdateForm({ isPublished: published, status: published ? 'published' : 'draft' });
          }}
          onToggleAcceptingResponses={(accepting, closedMsg) => {
            handleUpdateForm({
              settings: {
                ...(currentForm.settings || {}),
                acceptingResponses: accepting,
                ...(closedMsg !== undefined ? { closedMessage: closedMsg } : {})
              }
            });
          }}
        />
      )}

      {/* Add Users / Collaborators Modal */}
      {currentForm && (
        <AddUsersModal
          isOpen={isAddUsersOpen}
          onClose={() => setIsAddUsersOpen(false)}
          formId={currentForm.id}
          formTitle={currentForm.title}
          currentUser={user}
          onCollaboratorsUpdated={(collaborators) => {
            handleUpdateForm({ collaborators });
            if (user?.id) {
              fetchForms(user.id).then(setForms).catch(() => {});
            }
          }}
        />
      )}

      {/* Voice AI Engine Modal */}
      <ApiKeyModal
        isOpen={isApiKeyOpen}
        onClose={() => setIsApiKeyOpen(false)}
        onKeyUpdated={() => setHasApiKey(true)}
      />

      {/* Auth Modal: Sign In / Create Account with Email for Form Creators */}
      <AuthModal
        isOpen={isAuthModalOpen}
        isModal={true}
        initialTab={authModalTab}
        onClose={() => setIsAuthModalOpen(false)}
        onGoToMainPage={() => {
          setIsAuthModalOpen(false);
          setView('landing');
          window.location.hash = '#landing';
        }}
        onAuthSuccess={(authUser) => {
          setUser(authUser);
          setIsAuthModalOpen(false);
          setView('dashboard');
          window.location.hash = '#dashboard';
          setForms([]);
          if (authUser?.id) {
            fetchForms(authUser.id)
              .then((formsData) => setForms(formsData))
              .catch(() => setForms([]));
          }
        }}
        onContinueAsGuest={() => setIsAuthModalOpen(false)}
      />
      </Suspense>
    </div>
  );
}
