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

    if (!data.get('familienname')) {
        errors.push({ field: 'familienname', message: 'Familienname ist ein Pflichtfeld.' });
    }

    if (!data.get('vorname')) {
        errors.push({ field: 'vorname', message: 'Vorname ist ein Pflichtfeld.' });
    }

    if (!data.get('strasse_hausnummer')) {
        errors.push({ field: 'strasse_hausnummer', message: 'Straße & Hausnummer ist ein Pflichtfeld.' });
    }

    if (!data.get('plz_ort')) {
        errors.push({ field: 'plz_ort', message: 'PLZ & Ort ist ein Pflichtfeld.' });
    }

    if (!data.get('geburtsdatum')) {
        errors.push({ field: 'geburtsdatum', message: 'Geburtsdatum ist ein Pflichtfeld.' });
    }

    if (!data.get('email')) {
        errors.push({ field: 'email', message: 'E-Mail-Adresse ist ein Pflichtfeld.' });
    }

    if (!data.get('zahlungsart')) {
        errors.push({ field: 'zahlungsart', message: 'Zahlungsart ist ein Pflichtfeld.' });
    }

    if (data.get('zahlungsart') === 'lastschrift') {
        if (!data.get('sepa_kontoinhaber')) {
            errors.push({ field: 'sepa_name', message: 'Name des Kontoinhabers ist ein Pflichtfeld.' });
        }
        if (!data.get('sepa_iban')) {
            errors.push({ field: 'sepa_iban', message: 'IBAN ist ein Pflichtfeld.' });
        }
        if (!data.get('sepa_unterschrift')) {
            errors.push({ field: 'sepa_unterschrift', message: 'Unterschrift des Kontoinhabers ist ein Pflichtfeld.' });
        }
    }

    if (!data.get('beitragshoehe')) {
        errors.push({ field: 'beitragshoehe', message: 'Beitragshöhe ist ein Pflichtfeld.' });
    }

    if (data.get('beitragshoehe') === 'hoeher' && !data.get('beitrag_hoeher_betrag')) {
        errors.push({ field: 'beitrag_hoeher_betrag', message: 'Betrag ist ein Pflichtfeld.' });
    }

    if (data.get('beitragshoehe') === 'reduziert') {
        if (!data.get('beitrag_reduziert_betrag')) {
            errors.push({ field: 'beitrag_reduziert_betrag', message: 'Betrag ist ein Pflichtfeld.' });
        }
        if (!data.get('beitrag_reduziert_grund')) {
            errors.push({ field: 'beitrag_reduziert_grund', message: 'Grund ist ein Pflichtfeld.' });
        }
    }

    if (!data.get('zahlweise')) {
        errors.push({ field: 'zahlweise', message: 'Zahlweise ist ein Pflichtfeld.' });
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
                errors.push({ field: 'vertreter1_name', message: 'Name des 1. gesetzlichen Vertreters ist ein Pflichtfeld.' });
            }
            if (!data.get('vertreter1_unterschrift')) {
                errors.push({ field: 'vertreter1_unterschrift', message: 'Unterschrift des 1. gesetzlichen Vertreters ist ein Pflichtfeld.' });
            }
        }
    }

    if (!data.get('datenschutz_zusage')) {
        errors.push({ field: 'datenschutz', message: 'Datenschutzzusage ist ein Pflichtfeld.' });
    }

    if (!data.get('satzung_zusage')) {
        errors.push({ field: 'satzung', message: 'Satzungszusage ist ein Pflichtfeld.' });
    }

    if (!data.get('ort_datum')) {
        errors.push({ field: 'ort_datum', message: 'Ort & Datum ist ein Pflichtfeld.' });
    }

    if (!data.get('unterschrift_antrag')) {
        errors.push({ field: 'unterschrift_antrag', message: 'Unterschrift ist ein Pflichtfeld.' });
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
        errors.forEach(error => {
            const field = document.getElementById(error.field);
            if (field) {
                field.classList.add('error');
                const errorMessage = document.createElement('div');
                errorMessage.classList.add('error-message');
                errorMessage.textContent = error.message;
                field.parentNode.insertBefore(errorMessage, field.nextSibling);
            }
        });
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
