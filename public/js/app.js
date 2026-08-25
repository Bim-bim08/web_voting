/**
 * E-Election OSIS - Frontend Application
 * Single Page Application (SPA) with vanilla JS
 */

// ============================================
// State
// ============================================
const state = {
  currentPage: 'token',    // 'token' | 'booth'
  identifier: null,        // NISN / ID Pemilih yang valid
  voterData: null,         // data pemilih dari API (full_name, role, identifier)
  candidates: [],          // data kandidat dari API
  selectedCandidate: null  // kandidat yang dipilih (untuk konfirmasi)
};

// ============================================
// DOM Elements
// ============================================
const elements = {
  // Pages
  tokenPage: document.getElementById('tokenPage'),
  boothPage: document.getElementById('boothPage'),

  // Token form
  tokenForm: document.getElementById('tokenForm'),
  tokenInput: document.getElementById('tokenInput'),
  tokenSubmitBtn: document.getElementById('tokenSubmitBtn'),
  tokenBtnText: document.getElementById('tokenBtnText'),
  tokenBtnSpinner: document.getElementById('tokenBtnSpinner'),

  // Booth
  candidatesGrid: document.getElementById('candidatesGrid'),
  headerBadge: document.getElementById('headerBadge'),

  // Modals
  confirmModal: document.getElementById('confirmModal'),
  confirmCandidate: document.getElementById('confirmCandidate'),
  confirmVoteBtn: document.getElementById('confirmVoteBtn'),
  confirmBtnText: document.getElementById('confirmBtnText'),
  confirmBtnSpinner: document.getElementById('confirmBtnSpinner'),

  visiModal: document.getElementById('visiModal'),
  visiCandidateName: document.getElementById('visiCandidateName'),
  visiContent: document.getElementById('visiContent'),

  // Toast
  toastContainer: document.getElementById('toastContainer')
};

// ============================================
// Navigation
// ============================================
function showPage(pageName) {
  state.currentPage = pageName;

  // Hide all pages
  elements.tokenPage.classList.remove('active');
  elements.boothPage.classList.remove('active');

  // Show target page
  if (pageName === 'token') {
    elements.tokenPage.classList.add('active');
    elements.headerBadge.textContent = 'Verifikasi Pemilih';
    const voterGreeting = document.getElementById('voterGreeting');
    if (voterGreeting) {
      voterGreeting.textContent = 'Pilih pasangan calon ketua dan wakil ketua OSIS pilihan Anda.';
    }
  } else if (pageName === 'booth') {
    elements.boothPage.classList.add('active');
    elements.headerBadge.textContent = 'Bilik Suara';
  }
}

function goToTokenPage() {
  state.identifier = null;
  state.voterData = null;
  state.candidates = [];
  state.selectedCandidate = null;
  elements.tokenInput.value = '';
  showPage('token');
}

function goToBoothPage() {
  showPage('booth');
}

// ============================================
// Token Validation
// ============================================
async function handleTokenSubmit(e) {
  e.preventDefault();

  const identifier = elements.tokenInput.value.trim();

  if (!identifier) {
    showToast('error', 'Gagal', 'Masukkan NISN atau ID Pemilih terlebih dahulu.');
    return;
  }

  // Set loading
  setTokenLoading(true);

  try {
    const response = await fetch('/api/tokens/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Verifikasi gagal');
    }

    // Pemilih valid → simpan data dan lanjut
    state.identifier = identifier;
    state.voterData = data.data;
    showToast('success', 'Verifikasi Berhasil', `Selamat datang, ${data.data.full_name}!`);

    // Delay sebentar lalu pindah halaman
    setTimeout(async () => {
      await loadCandidates();
      // Tampilkan nama pemilih di header Bilik Suara
      const voterGreeting = document.getElementById('voterGreeting');
      if (voterGreeting) {
        voterGreeting.textContent = `Selamat Datang, ${data.data.full_name}`;
      }
      goToBoothPage();
    }, 800);

  } catch (error) {
    showToast('error', 'Verifikasi Gagal', error.message);
  } finally {
    setTokenLoading(false);
  }
}

function setTokenLoading(isLoading) {
  elements.tokenSubmitBtn.disabled = isLoading;
  elements.tokenBtnText.style.display = isLoading ? 'none' : 'inline';
  elements.tokenBtnSpinner.style.display = isLoading ? 'block' : 'none';
}

// ============================================
// Load Candidates
// ============================================
async function loadCandidates() {
  try {
    const response = await fetch('/api/candidates');
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Gagal memuat data kandidat');
    }

    state.candidates = data.data;
    renderCandidates(state.candidates);

  } catch (error) {
    showToast('error', 'Gagal Memuat', error.message);
  }
}

function renderCandidates(candidates) {
  elements.candidatesGrid.innerHTML = candidates.map(candidate => `
    <div class="candidate-card">
      <div class="candidate-photo-wrapper">
        <img
          class="candidate-photo"
          src="${candidate.photo_url || 'https://via.placeholder.com/400x300/E5E7EB/9CA3AF?text=Foto+Paslon'}"
          alt="Foto ${candidate.chairman_name}"
          onerror="this.src='https://via.placeholder.com/400x300/E5E7EB/9CA3AF?text=Foto+Paslon'"
        >
        <div class="candidate-number">${candidate.candidate_number}</div>
      </div>

      <div class="candidate-body">
        <div class="candidate-label">Pasangan Calon</div>
        <div class="candidate-names">
          <div class="candidate-chairman">${candidate.chairman_name}</div>
          <div class="candidate-vice">& ${candidate.vice_chairman_name}</div>
        </div>

        <div class="candidate-actions">
          <button class="btn-visi" onclick='showVisiMisi(${JSON.stringify(candidate).replace(/'/g, "&#39;")})'>
            Lihat Visi & Misi
          </button>
          <button class="btn-vote" onclick='openConfirmModal(${JSON.stringify(candidate).replace(/'/g, "&#39;")})'>
            Pilih Paslon
          </button>
        </div>
      </div>
    </div>
  `).join('');
}

// ============================================
// Visi & Misi Modal
// ============================================
function showVisiMisi(candidate) {
  elements.visiCandidateName.textContent = `${candidate.chairman_name} & ${candidate.vice_chairman_name}`;
  elements.visiContent.textContent = candidate.vision_mission || 'Visi & Misi belum tersedia.';
  openModal('visiModal');
}

// ============================================
// Confirmation Modal
// ============================================
function openConfirmModal(candidate) {
  state.selectedCandidate = candidate;

  elements.confirmCandidate.innerHTML = `
    <img
      class="confirm-photo"
      src="${candidate.photo_url || 'https://via.placeholder.com/72x72/E5E7EB/9CA3AF?text=P${candidate.candidate_number}'}"
      alt="Foto ${candidate.chairman_name}"
      onerror="this.src='https://via.placeholder.com/72x72/E5E7EB/9CA3AF?text=P${candidate.candidate_number}'"
    >
    <div class="confirm-info">
      <h4>Paslon ${candidate.candidate_number}</h4>
      <p>${candidate.chairman_name} & ${candidate.vice_chairman_name}</p>
    </div>
  `;

  openModal('confirmModal');
}

async function executeVote() {
  if (!state.selectedCandidate || !state.identifier) return;

  // Set loading
  setConfirmLoading(true);

  try {
    const response = await fetch('/api/vote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identifier: state.identifier,
        candidate_id: state.selectedCandidate.id
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Gagal menyimpan voting');
    }

    // Tutup modal dulu
    closeModal('confirmModal');

    // Tampilkan confetti
    fireConfetti();

    // Tampilkan toast sukses
    showToast(
      'success',
      'Voting Berhasil! 🎉',
      `Suara Anda untuk Paslon ${state.selectedCandidate.candidate_number} telah tercatat.`
    );

    // Kembali ke halaman token setelah 3 detik
    setTimeout(() => {
      goToTokenPage();
      showToast('success', 'Selesai', 'Anda akan dikembalikan ke halaman utama.');
    }, 3000);

  } catch (error) {
    showToast('error', 'Voting Gagal', error.message);
  } finally {
    setConfirmLoading(false);
  }
}

function setConfirmLoading(isLoading) {
  elements.confirmVoteBtn.disabled = isLoading;
  elements.confirmBtnText.style.display = isLoading ? 'none' : 'inline';
  elements.confirmBtnSpinner.style.display = isLoading ? 'block' : 'none';
}

// ============================================
// Logout
// ============================================
function handleLogout() {
  goToTokenPage();
}

// ============================================
// Modal Helpers
// ============================================
function openModal(modalId) {
  document.getElementById(modalId).classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeModal(modalId) {
  document.getElementById(modalId).classList.remove('active');
  document.body.style.overflow = '';
}

function closeModalOutside(e, modalId) {
  if (e.target === e.currentTarget) {
    closeModal(modalId);
  }
}

// Close modal with Escape key
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    if (elements.visiModal.classList.contains('active')) {
      closeModal('visiModal');
    } else if (elements.confirmModal.classList.contains('active')) {
      closeModal('confirmModal');
    }
  }
});

// ============================================
// Toast Notification
// ============================================
function showToast(type, title, message) {
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <span class="toast-icon">${type === 'success' ? '✅' : '❌'}</span>
    <div class="toast-content">
      <div class="toast-title">${title}</div>
      <div class="toast-message">${message}</div>
    </div>
    <button class="toast-close" onclick="this.parentElement.remove()">×</button>
  `;

  elements.toastContainer.appendChild(toast);

  // Auto remove setelah 4 detik
  setTimeout(() => {
    if (toast.parentElement) {
      toast.style.animation = 'toastOut 0.3s ease forwards';
      setTimeout(() => toast.remove(), 300);
    }
  }, 4000);
}

// ============================================
// Confetti Effect
// ============================================
function fireConfetti() {
  // Confetti burst dari tengah
  const duration = 2000;
  const end = Date.now() + duration;

  const colors = ['#1E3A5F', '#D97706', '#059669', '#DC2626', '#7C3AED'];

  (function frame() {
    confetti({
      particleCount: 3,
      angle: 60,
      spread: 55,
      origin: { x: 0, y: 0.7 },
      colors: colors
    });
    confetti({
      particleCount: 3,
      angle: 120,
      spread: 55,
      origin: { x: 1, y: 0.7 },
      colors: colors
    });

    if (Date.now() < end) {
      requestAnimationFrame(frame);
    }
  }());

  // Big center burst
  setTimeout(() => {
    confetti({
      particleCount: 100,
      spread: 100,
      origin: { y: 0.6 },
      colors: colors
    });
  }, 200);
}

// ============================================
// Input Formatting
// ============================================
elements.tokenInput.addEventListener('input', (e) => {
  // Auto uppercase untuk NISN/ID
  e.target.value = e.target.value.toUpperCase();
});

// ============================================
// Init
// ============================================
document.addEventListener('DOMContentLoaded', () => {
  showPage('token');
});
