const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwPtpRryLYB7BLuUv9EiYYM3P1NKjiv-B-_f-7_PsC_ZFGIzuzZaz6cftkNDvCWi-KdGQ/exec';

/* ══════════════════════════════════
   DARK / LIGHT THEME
══════════════════════════════════ */
function toggleTheme() {
  const body = document.body;
  const label = document.getElementById('toggleLabel');
  body.classList.toggle('light');
  const isLight = body.classList.contains('light');
  label.textContent = isLight ? 'Mode sombre' : 'Mode clair';
  localStorage.setItem('theme', isLight ? 'light' : 'dark');
}

// Appliquer le thème sauvegardé au chargement
(function () {
  const saved = localStorage.getItem('theme');
  if (saved === 'light') {
    document.body.classList.add('light');
    const label = document.getElementById('toggleLabel');
    if (label) label.textContent = 'Mode sombre';
  }
})();

/* ══════════════════════════════════
   QUANTITÉS MUSICIENS
══════════════════════════════════ */
const quantities = { Pianiste: 0, Guitariste: 0, Bassiste: 0, Batteur: 0, Saxophoniste: 0 };

function changeQty(type, delta) {
  quantities[type] = Math.max(0, Math.min(10, quantities[type] + delta));
  document.getElementById('qty-' + type).textContent = quantities[type];
  document.getElementById('card-' + type).classList.toggle('active', quantities[type] > 0);
  updateSummary();
}

function updateSummary() {
  const parts = [];
  for (const [type, qty] of Object.entries(quantities)) {
    if (qty > 0) parts.push(qty + ' ' + type + (qty > 1 ? 's' : ''));
  }
  const box = document.getElementById('musiciansSummary');
  if (parts.length > 0) {
    box.textContent = '✦ Demande : ' + parts.join(', ');
    box.classList.add('visible');
  } else {
    box.classList.remove('visible');
  }
}

function getServiceSummary() {
  return Object.entries(quantities)
    .filter(([, q]) => q > 0)
    .map(([t, q]) => q + 'x ' + t)
    .join(', ');
}

/* ══════════════════════════════════
   MODAL
══════════════════════════════════ */
function openModal() {
  document.getElementById('modalOverlay').classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  document.getElementById('modalOverlay').classList.remove('active');
  document.body.style.overflow = '';
  setTimeout(() => {
    document.getElementById('successContent').classList.remove('active');
    document.getElementById('formContent').style.display = '';
  }, 300);
}

function handleOverlayClick(e) {
  if (e.target === document.getElementById('modalOverlay')) closeModal();
}

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeModal();
});

/* ══════════════════════════════════
   VALIDATION
══════════════════════════════════ */
const VALIDATORS = {
  nom: { re: /^[A-Za-zÀ-ÖØ-öø-ÿ][A-Za-zÀ-ÖØ-öø-ÿ\s''\-]{0,49}$/, required: true },
  prenom: { re: /^[A-Za-zÀ-ÖØ-öø-ÿ][A-Za-zÀ-ÖØ-öø-ÿ\s''\-]{0,49}$/, required: true },
  adresse: { re: /^.{5,120}$/, required: true },
  responsable: { re: /^[A-Za-zÀ-ÖØ-öø-ÿ][A-Za-zÀ-ÖØ-öø-ÿ\s''\-]{0,49}$/, required: false },
  telephone: { re: /^[+]?[\d\s().\-]{7,20}$/, required: true },
  courriel: { re: /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/, required: true },
};

function validateField(id) {
  const el = document.getElementById(id);
  if (!el) return true;
  const group = el.closest('.form-group');
  const val = el.value.trim();
  const rule = VALIDATORS[id];
  if (!rule) return true;

  const empty = val === '';
  const invalid = !empty && !rule.re.test(val);
  const missing = rule.required && empty;

  group.classList.toggle('invalid', invalid || missing);
  group.classList.toggle('valid', !invalid && !missing && !empty);
  return !invalid && !missing;
}

Object.keys(VALIDATORS).forEach(id => {
  const el = document.getElementById(id);
  if (!el) return;
  el.addEventListener('blur', () => validateField(id));
  el.addEventListener('input', () => {
    if (el.closest('.form-group').classList.contains('invalid')) validateField(id);
  });
});

/* ══════════════════════════════════
   SOUMISSION
══════════════════════════════════ */
document.getElementById('reservationForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  await submitForm();
});

async function submitForm() {
  const serviceSummary = getServiceSummary();
  const date = document.getElementById('date').value;
  const heure = document.getElementById('heure').value;
  const duree = document.getElementById('duree').value;
  const nom = document.getElementById('nom').value.trim();
  const prenom = document.getElementById('prenom').value.trim();
  const adresse = document.getElementById('adresse').value.trim();
  const responsable = document.getElementById('responsable').value.trim();
  const telephone = document.getElementById('telephone').value.trim();
  const courriel = document.getElementById('courriel').value.trim();
  const note = document.getElementById('note').value.trim();
  const accepte = document.getElementById('accepte').checked;

  const fieldsValid = Object.keys(VALIDATORS).map(validateField).every(Boolean);

  const errors = [];
  if (!serviceSummary) errors.push('Veuillez sélectionner au moins un musicien.');
  if (!date) errors.push('Veuillez sélectionner une date.');
  if (!heure) errors.push('Veuillez indiquer une heure de début.');
  if (!duree) errors.push('Veuillez sélectionner une durée.');
  if (!accepte) errors.push('Veuillez accepter les termes et conditions.');
  if (!fieldsValid) errors.push('Veuillez corriger les champs en rouge.');

  if (errors.length) { alert(errors[0]); return; }

  const btn = document.getElementById('submitBtn');
  btn.disabled = true;
  btn.querySelector('span').textContent = 'Envoi en cours...';

  const formData = {
    timestamp: new Date().toLocaleString('fr-CA'),
    service: serviceSummary,
    pianiste: quantities.Pianiste,
    guitariste: quantities.Guitariste,
    bassiste: quantities.Bassiste,
    batteur: quantities.Batteur,
    saxophoniste: quantities.Saxophoniste,
    date, heure, duree,
    nom, prenom, adresse, responsable,
    telephone, courriel, note,
    termes_acceptes: 'Oui'
  };

  try {
    // URLSearchParams évite les problèmes CORS avec Google Apps Script
    const params = new URLSearchParams(params);

    await fetch(GOOGLE_SCRIPT_URL, {
      method: 'POST',
      mode: 'no-cors',
      body: params
    });
     
    await new Promise(r => setTimeout(r, 1000));

    // Réinitialisation
    document.getElementById('reservationForm').reset();
    for (const type of Object.keys(quantities)) {
      quantities[type] = 0;
      document.getElementById('qty-' + type).textContent = '0';
      document.getElementById('card-' + type).classList.remove('active');
    }
    document.getElementById('musiciansSummary').classList.remove('visible');
    document.querySelectorAll('.form-group.valid, .form-group.invalid')
      .forEach(g => g.classList.remove('valid', 'invalid'));
    btn.disabled = false;
    btn.querySelector('span').textContent = 'Envoyer la demande';

    document.getElementById('formContent').style.display = 'none';
    document.getElementById('successContent').classList.add('active');

  } catch (error) {
    console.error('Erreur:', error);
    alert('Une erreur est survenue. Veuillez réessayer ou nous contacter directement.');
    btn.disabled = false;
    btn.querySelector('span').textContent = 'Envoyer la demande';
  }
}
