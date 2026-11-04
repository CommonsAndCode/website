// The shortcode owns the questionnaire UI and draft storage. This controller
// handles submission, retry receipts and messages without external dependencies.
window.createSurveySubmission = function ({ form, saveDraft, clearDraft, messages }) {
  const status = document.getElementById('sc-submit-status');
  const submitButton = form.querySelector('button[type="submit"]');
  const enabled = form.dataset.submissionEnabled === 'true';
  const revision = form.elements.survey_revision.value;

  // A receipt pairs an attempt ID with the exact payload that may have reached
  // the server. Persist it with the draft so a reload can retry the same attempt.
  let receipt = null;
  // These flags have different lifetimes: busy ends with the request, complete
  // prevents resending an acknowledged assessment, and outdated prevents using a
  // saved draft with different question definitions. Only an explicit reset
  // clears complete/outdated; the reset control is disabled while busy.
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
    // Compare content independently of the ID assigned to it. Including the
    // hidden ID would make assigning an ID itself look like a content change.
    fields.delete('submission_id');
    return fields.toString();
  }

  function contentChanged() {
    if (!enabled || busy || complete || outdated) return;

    // An ID identifies one immutable attempt. After an edit, the respondent is
    // making a new attempt; reusing the old ID would conflict with an assessment
    // the server may already have committed before a network failure.
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
    // Capture fields before disabling controls: FormData omits disabled inputs.
    // Freeze editing as well as the submit button so the acknowledgement always
    // refers to the same visible answers that were sent.
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
        // A browser timeout is not proof that the server rolled back. The catch
        // path retains both the draft and attempt ID for an unchanged retry.
        signal: AbortSignal.timeout(20000),
      });
      // A proxy may enforce its own limit and return an HTML error page. Check
      // the status before decoding JSON so this never becomes a retry prompt.
      if (response.status === 413) {
        announce('tooLarge');
        return;
      }
      const result = await response.json();
      const saved = response.status === 200 || response.status === 201;

      // A successful status alone could be a proxy or unrelated response.
      // Require this attempt's receipt before deleting the only local draft.
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
      // Only re-enable controls that were enabled before this request; preserve
      // any independent disabled state in the rest of the questionnaire.
      controls.forEach(control => { control.disabled = false; });
      submitButton.disabled = complete || outdated || !enabled;
    }
  }

  // The shortcode attaches its autosave listeners after creating this
  // controller. Invalidate an edited attempt before autosave reads state().
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

    // Navigation also triggers autosave. Do not recreate an acknowledged
    // draft or overwrite an outdated draft merely because the user navigates.
    canSave() {
      return !complete && !outdated;
    },

    restore(savedReceipt) {
      if (savedReceipt && typeof savedReceipt.id === 'string' && typeof savedReceipt.payload === 'string') {
        receipt = savedReceipt;
      }
    },

    // Do not apply old answers to a changed catalogue: a reused question number
    // or option label could now mean something else. Offer the untouched saved
    // JSON for recovery instead, and leave localStorage intact until reset.
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

    // Called after the respondent confirms the shortcode's reset prompt.
    // Starting a new assessment is the only way to leave the completed state.
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
