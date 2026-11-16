/**
 * VoxForm Voice-to-Text — Google Forms Creator Add-on
 *
 * Converts any Google Form into a Voice-to-Text enabled VoxForm with 1 click,
 * generates a mobile-ready voice link & QR code, and automatically syncs
 * spoken responses directly back into Google Forms & Google Sheets.
 */

const DEFAULT_VOXFORM_SERVER = 'https://voice-to-text-form.onrender.com';

function onInstall(e) {
  onOpen(e);
}

function onOpen(e) {
  FormApp.getUi()
    .createAddonMenu()
    .addItem('Open Voice-to-Text Sidebar', 'showSidebar')
    .addItem('Sync Voice Responses Now', 'syncResponsesToGoogleForm')
    .addToUi();
}

function showSidebar() {
  const html = HtmlService.createHtmlOutputFromFile('Sidebar')
    .setTitle('VoxForm Voice-to-Text');
  FormApp.getUi().showSidebar(html);
}

/**
 * Load saved state for the active Google Form
 */
function getAddonState() {
  const props = PropertiesService.getDocumentProperties();
  const form = FormApp.getActiveForm();
  const serverUrl = (props.getProperty('VOXFORM_SERVER_URL') || DEFAULT_VOXFORM_SERVER).replace(/\/$/, '');
  const voxFormId = props.getProperty('VOXFORM_ID') || '';
  const responderUrl = props.getProperty('VOXFORM_RESPONDER_URL') || '';
  const shortUrl = props.getProperty('VOXFORM_SHORT_URL') || '';
  const autoSyncEnabled = props.getProperty('VOXFORM_AUTO_SYNC') === 'true';

  let stats = null;
  if (voxFormId && serverUrl) {
    try {
      const res = UrlFetchApp.fetch(`${serverUrl}/api/forms/${encodeURIComponent(voxFormId)}/google-addon/status`, {
        method: 'get',
        muteHttpExceptions: true
      });
      if (res.getResponseCode() === 200) {
        stats = JSON.parse(res.getContentText());
      }
    } catch (err) {
      console.warn('Could not fetch VoxForm status:', err);
    }
  }

  return {
    googleFormTitle: form.getTitle() || 'Untitled Form',
    serverUrl,
    voxFormId,
    responderUrl,
    shortUrl,
    autoSyncEnabled,
    stats
  };
}

/**
 * Extract all questions from the active Google Form and sync them to VoxForm
 */
function activateVoiceToText(customServerUrl) {
  const props = PropertiesService.getDocumentProperties();
  const serverUrl = (customServerUrl || props.getProperty('VOXFORM_SERVER_URL') || DEFAULT_VOXFORM_SERVER)
    .trim()
    .replace(/\/$/, '');
  props.setProperty('VOXFORM_SERVER_URL', serverUrl);

  const form = FormApp.getActiveForm();
  const googleFormId = form.getId();
  const title = form.getTitle() || 'Untitled Form';
  const description = form.getDescription() || '';
  const publishedUrl = form.getPublishedUrl() || '';
  const editUrl = form.getEditUrl() || '';

  let creatorEmail = '';
  try {
    creatorEmail = Session.getActiveUser().getEmail() || '';
  } catch (e) {}

  const items = form.getItems();
  const questions = [];

  items.forEach(item => {
    const itemType = item.getType();
    const itemId = String(item.getId());
    const itemTitle = item.getTitle() || 'Untitled Question';
    const itemHelp = item.getHelpText() || '';

    if (itemType === FormApp.ItemType.TEXT) {
      const textItem = item.asTextItem();
      questions.push({
        id: `gf-${itemId}`,
        googleItemId: itemId,
        title: itemTitle,
        description: itemHelp,
        type: 'short_answer',
        required: textItem.isRequired(),
        voiceEnabled: true
      });
    } else if (itemType === FormApp.ItemType.PARAGRAPH_TEXT) {
      const paraItem = item.asParagraphTextItem();
      questions.push({
        id: `gf-${itemId}`,
        googleItemId: itemId,
        title: itemTitle,
        description: itemHelp,
        type: 'paragraph',
        required: paraItem.isRequired(),
        voiceEnabled: true
      });
    } else if (itemType === FormApp.ItemType.MULTIPLE_CHOICE) {
      const mcItem = item.asMultipleChoiceItem();
      const choices = mcItem.getChoices().map(c => c.getValue()).filter(Boolean);
      questions.push({
        id: `gf-${itemId}`,
        googleItemId: itemId,
        title: itemTitle,
        description: itemHelp,
        type: 'multiple_choice',
        required: mcItem.isRequired(),
        voiceEnabled: false,
        options: choices
      });
    } else if (itemType === FormApp.ItemType.CHECKBOX) {
      const cbItem = item.asCheckboxItem();
      const choices = cbItem.getChoices().map(c => c.getValue()).filter(Boolean);
      questions.push({
        id: `gf-${itemId}`,
        googleItemId: itemId,
        title: itemTitle,
        description: itemHelp,
        type: 'checkboxes',
        required: cbItem.isRequired(),
        voiceEnabled: false,
        options: choices
      });
    } else if (itemType === FormApp.ItemType.LIST) {
      const listItem = item.asListItem();
      const choices = listItem.getChoices().map(c => c.getValue()).filter(Boolean);
      questions.push({
        id: `gf-${itemId}`,
        googleItemId: itemId,
        title: itemTitle,
        description: itemHelp,
        type: 'dropdown',
        required: listItem.isRequired(),
        voiceEnabled: false,
        options: choices
      });
    } else if (itemType === FormApp.ItemType.SCALE) {
      const scaleItem = item.asScaleItem();
      questions.push({
        id: `gf-${itemId}`,
        googleItemId: itemId,
        title: itemTitle,
        description: itemHelp,
        type: 'linear_scale',
        required: scaleItem.isRequired(),
        voiceEnabled: false,
        scaleConfig: {
          min: scaleItem.getLowerBound(),
          max: scaleItem.getUpperBound(),
          minLabel: scaleItem.getLeftLabel() || 'Low',
          maxLabel: scaleItem.getRightLabel() || 'High'
        }
      });
    }
  });

  if (questions.length === 0) {
    throw new Error('Add at least one question to your Google Form before activating Voice-to-Text.');
  }

  const payload = {
    googleFormId,
    title,
    description,
    publishedUrl,
    editUrl,
    creatorEmail,
    questions
  };

  const response = UrlFetchApp.fetch(`${serverUrl}/api/forms/google-addon/sync`, {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  });

  const statusCode = response.getResponseCode();
  const data = JSON.parse(response.getContentText() || '{}');

  if (statusCode < 200 || statusCode >= 300 || !data.success) {
    throw new Error(data.error || `VoxForm server returned HTTP ${statusCode}`);
  }

  const voxFormId = data.form.id;
  const fullResponderUrl = `${serverUrl}${data.responderPath}`;
  const fullShortUrl = `${serverUrl}${data.shortPath}`;

  props.setProperty('VOXFORM_ID', voxFormId);
  props.setProperty('VOXFORM_RESPONDER_URL', fullResponderUrl);
  props.setProperty('VOXFORM_SHORT_URL', fullShortUrl);

  return getAddonState();
}

/**
 * Pull any unsynced responses from VoxForm and insert them directly into this Google Form
 */
function syncResponsesToGoogleForm() {
  const props = PropertiesService.getDocumentProperties();
  const serverUrl = (props.getProperty('VOXFORM_SERVER_URL') || DEFAULT_VOXFORM_SERVER).replace(/\/$/, '');
  const voxFormId = props.getProperty('VOXFORM_ID');

  if (!voxFormId) {
    return { syncedCount: 0, message: 'Form is not activated yet.' };
  }

  const res = UrlFetchApp.fetch(
    `${serverUrl}/api/forms/${encodeURIComponent(voxFormId)}/google-addon/unsynced-responses`,
    { method: 'get', muteHttpExceptions: true }
  );

  if (res.getResponseCode() !== 200) {
    throw new Error('Could not fetch unsynced responses from VoxForm.');
  }

  const body = JSON.parse(res.getContentText() || '{}');
  const unsynced = body.unsynced || [];

  if (unsynced.length === 0) {
    return { syncedCount: 0, state: getAddonState() };
  }

  const form = FormApp.getActiveForm();
  const items = form.getItems();
  const itemById = {};
  const itemByTitle = {};

  items.forEach(item => {
    itemById[String(item.getId())] = item;
    if (item.getTitle()) {
      itemByTitle[item.getTitle().trim().toLowerCase()] = item;
    }
  });

  const syncedIds = [];

  unsynced.forEach(entry => {
    try {
      const formResponse = form.createResponse();
      let hasAtLeastOneAnswer = false;

      (entry.itemAnswers || []).forEach(ans => {
        const targetItem =
          (ans.googleItemId && itemById[String(ans.googleItemId)]) ||
          (ans.title && itemByTitle[ans.title.trim().toLowerCase()]);

        if (!targetItem) return;

        const iType = targetItem.getType();
        const val = ans.value;

        if (iType === FormApp.ItemType.TEXT) {
          formResponse.withItemResponse(targetItem.asTextItem().createResponse(String(val)));
          hasAtLeastOneAnswer = true;
        } else if (iType === FormApp.ItemType.PARAGRAPH_TEXT) {
          formResponse.withItemResponse(targetItem.asParagraphTextItem().createResponse(String(val)));
          hasAtLeastOneAnswer = true;
        } else if (iType === FormApp.ItemType.MULTIPLE_CHOICE) {
          formResponse.withItemResponse(targetItem.asMultipleChoiceItem().createResponse(String(val)));
          hasAtLeastOneAnswer = true;
        } else if (iType === FormApp.ItemType.LIST) {
          formResponse.withItemResponse(targetItem.asListItem().createResponse(String(val)));
          hasAtLeastOneAnswer = true;
        } else if (iType === FormApp.ItemType.CHECKBOX) {
          const arr = Array.isArray(val) ? val.map(String) : [String(val)];
          formResponse.withItemResponse(targetItem.asCheckboxItem().createResponse(arr));
          hasAtLeastOneAnswer = true;
        } else if (iType === FormApp.ItemType.SCALE) {
          const num = Number(val);
          if (!isNaN(num)) {
            formResponse.withItemResponse(targetItem.asScaleItem().createResponse(num));
            hasAtLeastOneAnswer = true;
          }
        }
      });

      if (hasAtLeastOneAnswer) {
        formResponse.submit();
      }
      syncedIds.push(entry.responseId);
    } catch (submitErr) {
      console.warn('Could not submit response item to Google Form:', submitErr);
    }
  });

  if (syncedIds.length > 0) {
    UrlFetchApp.fetch(`${serverUrl}/api/forms/${encodeURIComponent(voxFormId)}/google-addon/mark-synced`, {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify({ responseIds: syncedIds }),
      muteHttpExceptions: true
    });
  }

  return {
    syncedCount: syncedIds.length,
    state: getAddonState()
  };
}

/**
 * Enable or disable automatic 5-minute background sync into Google Forms
 */
function toggleAutoSync(enable) {
  const props = PropertiesService.getDocumentProperties();
  const triggers = ScriptApp.getProjectTriggers();

  triggers.forEach(t => {
    if (t.getHandlerFunction() === 'syncResponsesToGoogleForm') {
      ScriptApp.deleteTrigger(t);
    }
  });

  if (enable) {
    ScriptApp.newTrigger('syncResponsesToGoogleForm')
      .timeBased()
      .everyMinutes(5)
      .create();
    props.setProperty('VOXFORM_AUTO_SYNC', 'true');
  } else {
    props.setProperty('VOXFORM_AUTO_SYNC', 'false');
  }

  return getAddonState();
}
