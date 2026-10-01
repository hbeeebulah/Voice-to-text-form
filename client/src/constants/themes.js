export const CURATED_THEMES = [
  {
    id: 'modern-minimalist',
    name: 'Modern Minimalist',
    description: 'Clean, subtle slate tones with crisp borders and focus',
    accentColor: '#2563eb', // Blue
    headerColor: '#1d4ed8',
    backgroundColor: '#f8fafc',
    cardBackground: '#ffffff',
    textColor: '#0f172a',
    mutedColor: '#64748b',
    borderColor: '#e2e8f0',
    fontHeader: 'Inter',
    fontBody: 'Inter',
    bannerGradient: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
    cardRoundness: 'rounded-xl',
    buttonStyle: 'rounded-lg'
  },
  {
    id: 'vibrant-gradient',
    name: 'Vibrant Gradient',
    description: 'Energetic indigo & violet gradients with modern glowing elements',
    accentColor: '#6366f1', // Indigo
    headerColor: '#4f46e5',
    backgroundColor: '#f5f3ff',
    cardBackground: '#ffffff',
    textColor: '#1e1b4b',
    mutedColor: '#6b7280',
    borderColor: '#e0e7ff',
    fontHeader: 'Plus-Jakarta-Sans',
    fontBody: 'Inter',
    bannerGradient: 'linear-gradient(135deg, #6366f1 0%, #a855f7 50%, #ec4899 100%)',
    cardRoundness: 'rounded-2xl',
    buttonStyle: 'rounded-xl'
  },
  {
    id: 'warm-pastel',
    name: 'Warm Pastel',
    description: 'Soft amber, rose, and cream tones for approachable, inviting forms',
    accentColor: '#f43f5e', // Rose
    headerColor: '#e11d48',
    backgroundColor: '#fffbeb', // Amber 50
    cardBackground: '#ffffff',
    textColor: '#451a03',
    mutedColor: '#78716c',
    borderColor: '#fed7aa',
    fontHeader: 'Playfair-Display',
    fontBody: 'Lora',
    bannerGradient: 'linear-gradient(135deg, #fb7185 0%, #f43f5e 50%, #fb923c 100%)',
    cardRoundness: 'rounded-3xl',
    buttonStyle: 'rounded-full'
  },
  {
    id: 'dark-executive',
    name: 'Dark Executive',
    description: 'High-contrast dark mode with emerald and cyan accents',
    accentColor: '#10b981', // Emerald
    headerColor: '#059669',
    backgroundColor: '#0f172a', // Slate 900
    cardBackground: '#1e293b', // Slate 800
    textColor: '#f8fafc',
    mutedColor: '#94a3b8',
    borderColor: '#334155',
    fontHeader: 'Space-Grotesk',
    fontBody: 'Inter',
    bannerGradient: 'linear-gradient(135deg, #0f172a 0%, #134e4a 50%, #064e3b 100%)',
    cardRoundness: 'rounded-2xl',
    buttonStyle: 'rounded-xl'
  }
];

export const ACCENT_PALETTES = [
  { name: 'Indigo', value: '#6366f1', header: '#4f46e5' },
  { name: 'Classic Blue', value: '#2563eb', header: '#1d4ed8' },
  { name: 'Purple', value: '#9333ea', header: '#7e22ce' },
  { name: 'Emerald', value: '#10b981', header: '#059669' },
  { name: 'Teal', value: '#0d9488', header: '#0f766e' },
  { name: 'Rose', value: '#f43f5e', header: '#e11d48' },
  { name: 'Amber', value: '#f59e0b', header: '#d97706' },
  { name: 'Dark Slate', value: '#334155', header: '#1e293b' },
];

export const BACKGROUND_STYLES = [
  { id: 'slate', name: 'Cool Slate', color: '#f8fafc' },
  { id: 'white', name: 'Crisp White', color: '#ffffff' },
  { id: 'warm', name: 'Warm Cream', color: '#fffbeb' },
  { id: 'lavender', name: 'Soft Lavender', color: '#faf5ff' },
  { id: 'mint', name: 'Fresh Mint', color: '#f0fdf4' },
  { id: 'dark', name: 'Midnight Slate', color: '#0f172a' },
];

export const HEADER_FONTS = [
  { id: 'Inter', name: 'Inter (Modern Sans)' },
  { id: 'Plus-Jakarta-Sans', name: 'Plus Jakarta Sans (Tech)' },
  { id: 'Playfair-Display', name: 'Playfair Display (Editorial Serif)' },
  { id: 'Montserrat', name: 'Montserrat (Geometric)' },
  { id: 'Space-Grotesk', name: 'Space Grotesk (Neo-Grotesque)' },
  { id: 'Roboto', name: 'Roboto (Clean Geometric Sans)' },
];

export const BODY_FONTS = [
  { id: 'Inter', name: 'Inter (Clean & Legible)' },
  { id: 'Roboto', name: 'Roboto (Neutral)' },
  { id: 'Lora', name: 'Lora (Literary Serif)' },
  { id: 'Plus-Jakarta-Sans', name: 'Plus Jakarta Sans' },
];

export const HEADER_BANNER_PRESETS = [
  {
    id: 'modern-corporate',
    title: 'Modern Corporate Office',
    category: 'Company',
    url: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80'
  },
  {
    id: 'tech-architecture',
    title: 'Modern Headquarters & Architecture',
    category: 'Company',
    url: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=80'
  },
  {
    id: 'fluid-gradient',
    title: 'Vibrant Digital Flow',
    category: 'Abstract',
    url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80'
  },
  {
    id: 'creative-workspace',
    title: 'Clean Minimal Workspace',
    category: 'Work',
    url: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&w=1200&q=80'
  },
  {
    id: 'geometry-design',
    title: 'Geometric Modern Art',
    category: 'Design',
    url: 'https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?auto=format&fit=crop&w=1200&q=80'
  },
  {
    id: 'botanical-nature',
    title: 'Calm Botanical Leaves',
    category: 'Nature',
    url: 'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?auto=format&fit=crop&w=1200&q=80'
  },
  {
    id: 'warm-horizon',
    title: 'Warm Sunset Glow',
    category: 'Atmosphere',
    url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80'
  },
  {
    id: 'education-library',
    title: 'Academic & Research',
    category: 'Education',
    url: 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&w=1200&q=80'
  }
];

export const QUESTION_TYPES = [
  {
    type: 'short_answer',
    label: 'Short Answer',
    icon: 'AlignLeft',
    voiceEnabled: true,
    description: 'Single-line text response with voice-to-text dictation'
  },
  {
    type: 'paragraph',
    label: 'Paragraph',
    icon: 'AlignJustify',
    voiceEnabled: true,
    description: 'Multi-line detailed text with AI voice dictation'
  },
  {
    type: 'multiple_choice',
    label: 'Multiple Choice',
    icon: 'CircleDot',
    voiceEnabled: false,
    description: 'Respondents pick one option from a list'
  },
  {
    type: 'checkboxes',
    label: 'Checkboxes',
    icon: 'CheckSquare',
    voiceEnabled: false,
    description: 'Respondents can select multiple options'
  },
  {
    type: 'dropdown',
    label: 'Dropdown',
    icon: 'ChevronDownCircle',
    voiceEnabled: false,
    description: 'Compact dropdown menu to choose one option'
  },
  {
    type: 'linear_scale',
    label: 'Linear Scale',
    icon: 'SlidersHorizontal',
    voiceEnabled: false,
    description: 'Numerical rating scale with custom minimum and maximum labels'
  },
  {
    type: 'file_upload',
    label: 'Attach File / Document',
    icon: 'Paperclip',
    voiceEnabled: false,
    description: 'Allow respondents to attach documents, PDFs, images, or spreadsheets'
  }
];
