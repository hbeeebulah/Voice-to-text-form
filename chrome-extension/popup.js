document.addEventListener('DOMContentLoaded', () => {
  const serverUrlInput = document.getElementById('serverUrl');
  const enabledToggle = document.getElementById('enabledToggle');
  const langSelect = document.getElementById('langSelect');
  const dictationCountEl = document.getElementById('dictationCount');
  const saveBtn = document.getElementById('saveBtn');
  const savedMsg = document.getElementById('savedMsg');

  chrome.storage.sync.get(
    ['voxformServerUrl', 'voxformEnabled', 'voxformLang', 'voxformCount'],
    (res) => {
      serverUrlInput.value = res.voxformServerUrl || 'https://voice-to-text-form.onrender.com';
      enabledToggle.checked = res.voxformEnabled !== false;
      langSelect.value = res.voxformLang || '';
      dictationCountEl.textContent = res.voxformCount || 0;
    }
  );

  saveBtn.addEventListener('click', () => {
    chrome.storage.sync.set(
      {
        voxformServerUrl: serverUrlInput.value.trim() || 'https://voice-to-text-form.onrender.com',
        voxformEnabled: enabledToggle.checked,
        voxformLang: langSelect.value
      },
      () => {
        savedMsg.style.display = 'block';
        setTimeout(() => {
          savedMsg.style.display = 'none';
        }, 2000);
      }
    );
  });
});
