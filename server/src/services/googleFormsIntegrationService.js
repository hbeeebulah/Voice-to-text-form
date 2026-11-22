const { v4: uuidv4 } = require('uuid');

/**
 * Strict Google Form URL Sanitizer & SSRF Guard
 * Rejects non-HTTPS protocols, non-Google hosts, IP addresses, and private networks.
 */
function validateAndSanitizeGoogleFormUrl(rawUrl) {
  if (!rawUrl || typeof rawUrl !== 'string') {
    throw new Error('A valid Google Form URL is required.');
  }

  let parsed;
  try {
    parsed = new URL(rawUrl.trim());
  } catch {
    throw new Error('Invalid URL format provided.');
  }

  // 1. Enforce HTTPS strictly
  if (parsed.protocol !== 'https:') {
    throw new Error('Security Error: Only secure HTTPS Google Form URLs are permitted.');
  }

  const hostname = parsed.hostname.toLowerCase();

  // 2. Reject direct IP addresses and loopback hosts
  if (/^(\d{1,3}\.){3}\d{1,3}$/.test(hostname) || hostname === 'localhost' || hostname.includes('::')) {
    throw new Error('Security Error: Direct IP addresses and loopback hosts are forbidden.');
  }

  // 3. Whitelist allowed Google Form hostnames
  const allowedDomains = ['docs.google.com', 'forms.gle'];
  if (!allowedDomains.includes(hostname)) {
    throw new Error('Security Error: Only URLs from docs.google.com or forms.gle are permitted.');
  }

  // 4. Validate Google Forms path patterns
  if (hostname === 'docs.google.com') {
    if (!parsed.pathname.startsWith('/forms/d/') && !parsed.pathname.startsWith('/forms/u/')) {
      throw new Error('Security Error: Invalid Google Form path on docs.google.com.');
    }
  }

  if (hostname === 'forms.gle' && parsed.pathname.length <= 1) {
    throw new Error('Security Error: Invalid forms.gle short link.');
  }

  let cleanUrl = parsed.toString();
  // Auto-convert /edit to /viewform for public responder parsing
  if (cleanUrl.includes('/forms/d/')) {
    if (cleanUrl.includes('/edit')) {
      cleanUrl = cleanUrl.replace(/\/edit(\?.*)?$/, '/viewform');
    } else if (!cleanUrl.endsWith('/viewform') && !cleanUrl.endsWith('/viewform/') && !cleanUrl.includes('/viewform?')) {
      cleanUrl = cleanUrl.replace(/\/+$/, '') + '/viewform';
    }
  }

  return cleanUrl;
}

/**
 * Google Forms Integration Service
 * Supports:
 * 1. Syncing forms from the official VoxForm Google Forms Add-on (Google Apps Script)
 * 2. Importing any public Google Form URL via FB_PUBLIC_LOAD_DATA_ extraction
 * 3. Real-time forwarding of VoxForm voice responses directly into Google Forms (formResponse)
 * 4. Pull-based native FormApp response sync for the Google Forms Add-on
 */
class GoogleFormsIntegrationService {
  /**
   * Extract FB_PUBLIC_LOAD_DATA_ JSON array from a public Google Form viewform HTML page
   * Includes anti-SSRF protections, HTTPS enforcement, and hop-by-hop redirect verification.
   */
  async fetchPublicGoogleFormStructure(publicUrl) {
    let currentUrl = validateAndSanitizeGoogleFormUrl(publicUrl);
    let hops = 0;
    const maxHops = 5;
    let finalHtml = null;
    let finalUrl = currentUrl;

    while (hops < maxHops) {
      hops++;
      const response = await fetch(currentUrl, {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
        },
        redirect: 'manual'
      });

      // Handle redirects manually to validate destination domain on every single hop
      if ([301, 302, 303, 307, 308].includes(response.status)) {
        const location = response.headers.get('location');
        if (!location) {
          throw new Error('Google Form redirect response missing location header.');
        }

        const resolved = new URL(location, currentUrl);
        // Validates redirect destination strictly against Google domains (prevents open-redirect SSRF)
        currentUrl = validateAndSanitizeGoogleFormUrl(resolved.toString());
        continue;
      }

      if (!response.ok) {
        throw new Error(`Could not access Google Form URL (HTTP ${response.status}). Make sure the form is published and public.`);
      }

      finalHtml = await response.text();
      finalUrl = currentUrl;
      break;
    }

    if (!finalHtml) {
      throw new Error('Too many redirects while accessing Google Form URL.');
    }

    const html = finalHtml;

    // Extract FB_PUBLIC_LOAD_DATA_ = [...];
    let match = html.match(/(?:var\s+|window\.)?FB_PUBLIC_LOAD_DATA_\s*=\s*(\[[\s\S]*?\]);\s*<\/script>/);
    if (!match || !match[1]) {
      match = html.match(/FB_PUBLIC_LOAD_DATA_\s*=\s*(\[[\s\S]*?\]);/);
    }
    if (!match || !match[1]) {
      throw new Error('Could not read questions from this Google Form URL. Make sure you paste the public responder link (ending in /viewform) and that "Sign in required" is turned off.');
    }

    let loadData;
    try {
      loadData = JSON.parse(match[1]);
    } catch (err) {
      throw new Error('Failed to parse Google Form data structure.');
    }

    const formData = loadData[1];
    if (!formData) {
      throw new Error('Google Form structure is empty or unsupported.');
    }

    const description = formData[0] || '';
    const rawItems = Array.isArray(formData[1]) ? formData[1] : [];
    const title = formData[8] || loadData[3] || 'Imported Voice Form';

    // Determine formResponse endpoint from finalUrl
    let formResponseUrl = finalUrl.split('?')[0];
    if (formResponseUrl.endsWith('/viewform')) {
      formResponseUrl = formResponseUrl.replace(/\/viewform$/, '/formResponse');
    } else if (!formResponseUrl.endsWith('/formResponse')) {
      formResponseUrl = formResponseUrl.replace(/\/$/, '') + '/formResponse';
    }

    const questions = [];
    for (const item of rawItems) {
      if (!Array.isArray(item)) continue;
      const itemId = item[0];
      const itemTitle = item[1] || 'Untitled Question';
      const itemDesc = item[2] || '';
      const itemTypeCode = item[3];
      const answerMeta = Array.isArray(item[4]) && Array.isArray(item[4][0]) ? item[4][0] : null;

      // Skip section headers / images / videos that don't take answers
      if (!answerMeta) continue;

      const entryId = answerMeta[0]; // The numeric ID for entry.<entryId>
      const rawOptions = Array.isArray(answerMeta[1]) ? answerMeta[1] : [];
      const isRequired = Boolean(answerMeta[2] === 1);

      let voxType = 'short_answer';
      let voiceEnabled = false;
      let options = undefined;
      let scaleConfig = undefined;

      // Google Forms internal type codes:
      // 0 = Short answer, 1 = Paragraph, 2 = Multiple choice, 3 = Dropdown, 4 = Checkboxes, 5 = Linear scale
      switch (itemTypeCode) {
        case 0:
          voxType = 'short_answer';
          voiceEnabled = true;
          break;
        case 1:
          voxType = 'paragraph';
          voiceEnabled = true;
          break;
        case 2:
          voxType = 'multiple_choice';
          options = rawOptions.map(o => (Array.isArray(o) ? o[0] : '')).filter(Boolean);
          break;
        case 3:
          voxType = 'dropdown';
          options = rawOptions.map(o => (Array.isArray(o) ? o[0] : '')).filter(Boolean);
          break;
        case 4:
          voxType = 'checkboxes';
          options = rawOptions.map(o => (Array.isArray(o) ? o[0] : '')).filter(Boolean);
          break;
        case 5: {
          voxType = 'linear_scale';
          const nums = rawOptions.map(o => Number(Array.isArray(o) ? o[0] : NaN)).filter(n => !isNaN(n));
          const min = nums.length > 0 ? Math.min(...nums) : 1;
          const max = nums.length > 0 ? Math.max(...nums) : 5;
          const labels = Array.isArray(answerMeta[3]) ? answerMeta[3] : [];
          scaleConfig = {
            min,
            max,
            minLabel: labels[0] || 'Low',
            maxLabel: labels[1] || 'High'
          };
          break;
        }
        default:
          voxType = 'short_answer';
          voiceEnabled = true;
          break;
      }

      questions.push({
        id: `gf-${itemId || uuidv4().slice(0, 8)}`,
        googleItemId: String(itemId),
        googleEntryId: entryId ? `entry.${entryId}` : null,
        title: itemTitle,
        description: itemDesc,
        type: voxType,
        required: isRequired,
        voiceEnabled,
        ...(options && options.length > 0 ? { options } : {}),
        ...(scaleConfig ? { scaleConfig } : {})
      });
    }

    return {
      title,
      description,
      publishedUrl: finalUrl,
      formResponseUrl,
      questions
    };
  }

  /**
   * Enrich questions coming from the Google Apps Script Add-on with entry.<id> mappings
   * by inspecting the form's publishedUrl if available.
   */
  async enrichAddonQuestionsWithEntryIds(publishedUrl, addonQuestions = []) {
    if (!publishedUrl) return { questions: addonQuestions, formResponseUrl: null };
    try {
      const publicData = await this.fetchPublicGoogleFormStructure(publishedUrl);
      const entryByItemId = new Map();
      const entryByTitle = new Map();

      publicData.questions.forEach(q => {
        if (q.googleItemId && q.googleEntryId) {
          entryByItemId.set(String(q.googleItemId), q.googleEntryId);
        }
        if (q.title && q.googleEntryId) {
          entryByTitle.set(q.title.trim().toLowerCase(), q.googleEntryId);
        }
      });

      const enriched = addonQuestions.map(q => {
        const matchedEntry =
          (q.googleItemId && entryByItemId.get(String(q.googleItemId))) ||
          (q.title && entryByTitle.get(q.title.trim().toLowerCase())) ||
          q.googleEntryId ||
          null;
        return {
          ...q,
          googleEntryId: matchedEntry
        };
      });

      return {
        questions: enriched,
        formResponseUrl: publicData.formResponseUrl
      };
    } catch (err) {
      console.warn('[GoogleFormsIntegration] Could not auto-extract entry IDs from publishedUrl:', err.message);
      return { questions: addonQuestions, formResponseUrl: null };
    }
  }

  /**
   * Forward a submitted VoxForm response directly to the original Google Form's formResponse endpoint
   */
  async forwardResponseToGoogleForm(form, answersMap = {}) {
    const formResponseUrl = form?.googleFormConfig?.formResponseUrl;
    if (!formResponseUrl || !Array.isArray(form.questions)) {
      return { forwarded: false, reason: 'No formResponseUrl configured' };
    }

    // SSRF guard: ensure formResponseUrl strictly targets docs.google.com/forms/.../formResponse over HTTPS
    try {
      const parsedResp = new URL(formResponseUrl);
      if (
        parsedResp.protocol !== 'https:' ||
        parsedResp.hostname.toLowerCase() !== 'docs.google.com' ||
        !parsedResp.pathname.endsWith('/formResponse')
      ) {
        return { forwarded: false, reason: 'Invalid or unauthorized Google formResponse endpoint' };
      }
    } catch {
      return { forwarded: false, reason: 'Malformed formResponseUrl' };
    }

    const params = new URLSearchParams();
    let mappedCount = 0;

    for (const q of form.questions) {
      if (!q.googleEntryId) continue;
      const ans = answersMap[q.id];
      if (ans === undefined || ans === null || ans === '') continue;

      const entryKey = q.googleEntryId.startsWith('entry.')
        ? q.googleEntryId
        : `entry.${q.googleEntryId}`;

      if (Array.isArray(ans)) {
        ans.forEach(val => {
          if (val !== undefined && val !== null && val !== '') {
            params.append(entryKey, String(val));
            mappedCount++;
          }
        });
      } else if (typeof ans === 'object') {
        const strVal = ans.fileUrl || ans.fileName || JSON.stringify(ans);
        params.append(entryKey, strVal);
        mappedCount++;
      } else {
        params.append(entryKey, String(ans));
        mappedCount++;
      }
    }

    if (mappedCount === 0) {
      return { forwarded: false, reason: 'No mapped entry IDs had answers' };
    }

    try {
      const res = await fetch(formResponseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: params.toString()
      });

      const ok = res.status >= 200 && res.status < 400;
      return {
        forwarded: ok,
        status: res.status
      };
    } catch (err) {
      console.warn('[GoogleFormsIntegration] Direct formResponse forward warning:', err.message);
      return {
        forwarded: false,
        reason: err.message
      };
    }
  }
}

module.exports = new GoogleFormsIntegrationService();
