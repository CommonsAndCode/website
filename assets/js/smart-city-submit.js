// The shortcode owns the questionnaire UI and draft storage. This controller
// handles submission, retry receipts and messages without external dependencies.
window.createSurveySubmission = function ({ form, saveDraft, clearDraft, messages }) {
  const status = document.getElementById('sc-submit-status');
  const submitButton = form.querySelector('button[type="submit"]');
  const enabled = form.dataset.submissionEnabled === 'true';
  const revision = form.elements.survey_revision.value;

  let receipt = null;
  let busy = false;
  let complete = false;
  let outdated = false;
  let draftDownloadURL = null;

  function announce(message) {
    status.textContent = messages[message];
    status.hidden = false;
  }

  function currentPayload() {
    const fields = new URLSearchParams(new FormData(form));
    fields.delete('submission_id');
    return fields.toString();
  }

  function contentChanged() {
    if (!enabled || busy || complete || outdated) return;

    if (receipt && receipt.payload !== currentPayload()) {
      receipt = null;
    }
    status.hidden = true;
  }

  async function submit(event) {
    event.preventDefault();
    if (!enabled || busy || complete || outdated) return;
    if (!form.reportValidity()) return;

    const payload = currentPayload();
    if (!receipt || receipt.payload !== payload) {
      receipt = { id: crypto.randomUUID(), payload };
    }
    form.elements.submission_id.value = receipt.id;

    // Save before sending: the server may commit even if the response is lost.
    saveDraft();
    const body = new URLSearchParams(new FormData(form));
    const controls = Array.from(form.elements).filter(control => !control.disabled);
    busy = true;
    controls.forEach(control => { control.disabled = true; });
    announce('sending');

    try {
      const response = await fetch(form.action, {
        method: 'POST',
        body,
        credentials: 'same-origin',
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(20000),
      });
      const result = await response.json();
      const saved = response.status === 200 || response.status === 201;

      if (saved && result.id === receipt.id) {
        complete = true;
        clearDraft();
        announce('success');
      } else if (result.code === 'unknown_revision') {
        announce('revision');
      } else if (response.status === 422) {
        announce('invalid');
      } else if (response.status === 409) {
        announce('conflict');
      } else {
        announce('error');
      }
    } catch {
      announce('error');
    } finally {
      busy = false;
      controls.forEach(control => { control.disabled = false; });
      submitButton.disabled = complete || outdated || !enabled;
    }
  }

  form.addEventListener('input', contentChanged);
  form.addEventListener('change', contentChanged);
  form.addEventListener('submit', submit);

  if (!enabled) {
    submitButton.disabled = true;
    announce('preview');
  }

  return {
    state() {
      return receipt;
    },

    canSave() {
      return !complete && !outdated;
    },

    restore(savedReceipt) {
      if (savedReceipt && typeof savedReceipt.id === 'string' && typeof savedReceipt.payload === 'string') {
        receipt = savedReceipt;
      }
    },

    markOutdated(savedDraft) {
      outdated = true;
      submitButton.disabled = true;
      announce('revision');

      const file = new Blob([savedDraft], { type: 'application/json' });
      draftDownloadURL = URL.createObjectURL(file);
      const download = document.createElement('a');
      download.href = draftDownloadURL;
      download.download = 'smart-city-saved-draft.json';
      download.textContent = messages.downloadDraft;
      status.append(' ', download);
    },

    reset() {
      receipt = null;
      complete = false;
      outdated = false;
      if (draftDownloadURL) {
        URL.revokeObjectURL(draftDownloadURL);
        draftDownloadURL = null;
      }

      submitButton.disabled = !enabled;
      status.hidden = enabled;
      if (!enabled) announce('preview');
      form.elements.submission_id.value = '';
      form.elements.survey_revision.value = revision;
    },
  };
};
