document.addEventListener('DOMContentLoaded', () => {
    updateRequiredStars();
    updateFormState();
});

const updateRequiredStars = () => {
    document.querySelectorAll('label .required-star').forEach(star => star.remove());
    document.querySelectorAll('input[required], textarea[required]').forEach(el => {
        const label = document.querySelector(`label[for="${el.id}"]`);
        if (label) {
            const star = document.createElement('span');
            star.classList.add('required-star');
            star.textContent = '*';
            label.appendChild(star);
        }
    });
};

// const url = "http://localhost:3000/api/v1/form-input";
const url = "https://cc.janpeterkoenig.com/api/v1/form-input";

const form = document.querySelector('form');

const setFieldsDisabled = (fields, disabled) => {
    fields.forEach(id => {
        const field = document.getElementById(id);
        if (field) {
            field.disabled = disabled;
        }
    });
};

const setFieldsRequired = (fields, required) => {
    fields.forEach(id => {
        const field = document.getElementById(id);
        if (field) {
            field.required = required;
        }
    });
};

const updateFormState = () => {
    const zahlungsart = document.querySelector('input[name="zahlungsart"]:checked')?.value;
    const geburtsdatum = document.getElementById('geburtsdatum').value;
    const beitragshoehe = document.querySelector('input[name="beitragshoehe"]:checked')?.value;

    // SEPA fields
    const sepaFields = ['sepa_name', 'sepa_iban', 'sepa_bic', 'sepa_ort_datum', 'sepa_unterschrift'];
    const sepaRequiredFields = ['sepa_name', 'sepa_iban', 'sepa_unterschrift', 'sepa_ort_datum'];
    const isLastschrift = zahlungsart === 'lastschrift';
    setFieldsDisabled(sepaFields, !isLastschrift);
    setFieldsRequired(sepaRequiredFields, isLastschrift);

    // Underage fields
    const underageFields = ['vertreter1_name', 'vertreter1_unterschrift', 'vertreter2_name', 'vertreter2_unterschrift'];
    let isUnderage = false;
    if (geburtsdatum) {
        const birthDate = new Date(geburtsdatum);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        isUnderage = age < 18;
    }
    setFieldsDisabled(underageFields, !isUnderage);
    setFieldsRequired(underageFields, isUnderage);

    // Membership fee fields
    document.getElementById('beitrag_hoeher_betrag').disabled = beitragshoehe !== 'hoeher';
    document.getElementById('beitrag_reduziert_betrag').disabled = beitragshoehe !== 'reduziert';
    document.getElementById('beitrag_reduziert_grund').disabled = beitragshoehe !== 'reduziert';

    // Quarterly payment
    const isQuarterlyPaymentAllowed = beitragshoehe === '10' || beitragshoehe === 'hoeher';
    document.getElementById('zahlweise_quartal').disabled = !isQuarterlyPaymentAllowed;
    if (!isQuarterlyPaymentAllowed) {
        document.getElementById('zahlweise_jaehrlich').checked = true;
    }

    updateRequiredStars();
};

form.addEventListener('change', updateFormState);

const validateForm = (data) => {
    const errors = [];
    const errorMessages = {
        familienname: form.dataset.errorLastName,
        vorname: form.dataset.errorFirstName,
        strasse_hausnummer: form.dataset.errorStreet,
        plz_ort: form.dataset.errorPostal,
        geburtsdatum: form.dataset.errorBirthDate,
        email: form.dataset.errorEmail,
        kommunikationssprache: form.dataset.errorCommunicationLanguage,
        zahlungsart: form.dataset.errorPaymentType,
        sepa_name: form.dataset.errorSepaName,
        sepa_iban: form.dataset.errorSepaIban,
        sepa_unterschrift: form.dataset.errorSepaSignature,
        beitragshoehe: form.dataset.errorFeeAmount,
        beitrag_hoeher_betrag: form.dataset.errorFeeHigher,
        beitrag_reduziert_betrag: form.dataset.errorFeeReducedAmount,
        beitrag_reduziert_grund: form.dataset.errorFeeReducedReason,
        zahlweise: form.dataset.errorPaymentMethod,
        vertreter1_name: form.dataset.errorGuardian1Name,
        vertreter1_unterschrift: form.dataset.errorGuardian1Signature,
        datenschutz: form.dataset.errorDataProtection,
        satzung: form.dataset.errorStatutes,
        ort_datum: form.dataset.errorPlaceDate,
        unterschrift_antrag: form.dataset.errorSignature
    };

    if (!data.get('familienname')) {
        errors.push({ field: 'familienname', message: errorMessages.familienname });
    }

    if (!data.get('vorname')) {
        errors.push({ field: 'vorname', message: errorMessages.vorname });
    }

    if (!data.get('strasse_hausnummer')) {
        errors.push({ field: 'strasse', message: errorMessages.strasse_hausnummer });
    }

    if (!data.get('plz_ort')) {
        errors.push({ field: 'plz_ort', message: errorMessages.plz_ort });
    }

    if (!data.get('geburtsdatum')) {
        errors.push({ field: 'geburtsdatum', message: errorMessages.geburtsdatum });
    }

    if (!data.get('email')) {
        errors.push({ field: 'email', message: errorMessages.email });
    }

    if (!data.get('kommunikationssprache')) {
        errors.push({ field: 'kommunikationssprache', message: errorMessages.kommunikationssprache });
    }

    if (!data.get('zahlungsart')) {
        errors.push({ field: 'zahlungsart', message: errorMessages.zahlungsart });
    }

    if (data.get('zahlungsart') === 'lastschrift') {
        if (!data.get('sepa_kontoinhaber')) {
            errors.push({ field: 'sepa_name', message: errorMessages.sepa_name });
        }
        if (!data.get('sepa_iban')) {
            errors.push({ field: 'sepa_iban', message: errorMessages.sepa_iban });
        }
        if (!data.get('sepa_unterschrift')) {
            errors.push({ field: 'sepa_unterschrift', message: errorMessages.sepa_unterschrift });
        }
    }

    if (!data.get('beitragshoehe')) {
        errors.push({ field: 'beitragshoehe', message: errorMessages.beitragshoehe });
    }

    if (data.get('beitragshoehe') === 'hoeher' && !data.get('beitrag_hoeher_betrag')) {
        errors.push({ field: 'beitrag_hoeher_betrag', message: errorMessages.beitrag_hoeher_betrag });
    }

    if (data.get('beitragshoehe') === 'reduziert') {
        if (!data.get('beitrag_reduziert_betrag')) {
            errors.push({ field: 'beitrag_reduziert_betrag', message: errorMessages.beitrag_reduziert_betrag });
        }
        if (!data.get('beitrag_reduziert_grund')) {
            errors.push({ field: 'beitrag_reduziert_grund', message: errorMessages.beitrag_reduziert_grund });
        }
    }

    if (!data.get('zahlweise')) {
        errors.push({ field: 'zahlweise', message: errorMessages.zahlweise });
    }

    if (document.getElementById('geburtsdatum').value) {
        const birthDate = new Date(document.getElementById('geburtsdatum').value);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        if (age < 18) {
            if (!data.get('vertreter1_name')) {
                errors.push({ field: 'vertreter1_name', message: errorMessages.vertreter1_name });
            }
            if (!data.get('vertreter1_unterschrift')) {
                errors.push({ field: 'vertreter1_unterschrift', message: errorMessages.vertreter1_unterschrift });
            }
        }
    }

    if (!data.get('datenschutz_zusage')) {
        errors.push({ field: 'datenschutz', message: errorMessages.datenschutz });
    }

    if (!data.get('satzung_zusage')) {
        errors.push({ field: 'satzung', message: errorMessages.satzung });
    }

    if (!data.get('ort_datum')) {
        errors.push({ field: 'ort_datum', message: errorMessages.ort_datum });
    }

    if (!data.get('unterschrift_antrag')) {
        errors.push({ field: 'unterschrift_antrag', message: errorMessages.unterschrift_antrag });
    }

    return errors;
}

form.addEventListener('submit', (event) => {
    event.preventDefault();

    const formData = new FormData(form);
    const errors = validateForm(formData);

    document.querySelectorAll('.error-message').forEach(el => el.remove());
    document.querySelectorAll('.error').forEach(el => el.classList.remove('error'));

    if (errors.length > 0) {
        let firstErrorField = null;
        errors.forEach(error => {
            const field = document.getElementById(error.field);
            if (field) {
                field.classList.add('error');
                const errorMessage = document.createElement('div');
                errorMessage.classList.add('error-message');
                errorMessage.textContent = error.message;
                field.parentNode.insertBefore(errorMessage, field.nextSibling);
                
                // Track the first error field
                if (!firstErrorField) {
                    firstErrorField = field;
                }
            }
        });
        
        // Scroll to the first error field
        if (firstErrorField) {
            firstErrorField.scrollIntoView({ behavior: 'smooth', block: 'center' });
            firstErrorField.focus();
        }
        
        return;
    }

    const data = Object.fromEntries(formData.entries());

    fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    })
        .then(response => response.json())
        .then(data => {
            console.log('Success:', data);
            const successMessageContainer = document.getElementById('success-message-container');
            successMessageContainer.style.display = 'block';
            form.reset();
        })
        .catch((error) => {
            console.error('Error:', error);
            alert('Fehler bei der Übermittlung des Antrags.');
            const successMessageContainer = document.getElementById('success-message-container');
            successMessageContainer.style.display = 'none';
        });
});

form.addEventListener('input', () => {
    const successMessageContainer = document.getElementById('success-message-container');
    successMessageContainer.style.display = 'none';
});
