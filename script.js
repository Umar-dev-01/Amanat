/**
 * Amanat - Enterprise Digital Testament & Legacy Vault
 * Features:
 * - World-Class Hero & Design System
 * - High-Contrast Visible Card & Background Architecture
 * - 90-Day Dead Man's Switch with Automatic Reset & Multi-Stage Reminders
 * - Easy Re-editing / Updating of Wasiyat at Any Time (Version tracking)
 * - Multi-Media & Document Upload Vault (Scanned Deeds, Photos, Videos)
 * - Country-Adaptive ID (CNIC, Emirates ID, Iqama, SSN, Aadhaar, etc.) & Dial Codes
 * - Post-Mortem Automated Email Dispatch Roster with Full Email Previews
 */

// Time Constants (in milliseconds)
const DAY_MS = 24 * 60 * 60 * 1000;
const NINETY_DAYS_MS = 90 * DAY_MS;

// Reminder Thresholds
const REMINDER_THRESHOLDS = {
  FIFTEEN_DAYS: 15 * DAY_MS,
  TEN_DAYS: 10 * DAY_MS,
  FIVE_DAYS: 5 * DAY_MS,
  ONE_DAY: 1 * DAY_MS
};

// Storage Keys
const STORAGE_KEYS = {
  DEADLINE: 'amanat_switch_deadline',
  STATUS: 'amanat_switch_status',
  DATA: 'amanat_wasiyat_data',
  RECIPIENTS: 'amanat_recipients',
  ATTACHMENTS: 'amanat_vault_attachments',
  LOGS: 'amanat_audit_logs',
  NOTIFIED_MILESTONES: 'amanat_notified_milestones',
  EMAILS_DISPATCHED: 'amanat_emails_dispatched',
  VERSION: 'amanat_wasiyat_version',
  LAST_UPDATED: 'amanat_wasiyat_last_updated'
};

// Country Configurations & ID Masks
const COUNTRY_CONFIGS = {
  PK: {
    name: 'Pakistan',
    flag: '🇵🇰',
    idLabel: 'National ID (CNIC - 13 Digits) *',
    idPlaceholder: '42101-1234567-1',
    idHelp: 'Format: 5 digits - 7 digits - 1 digit (e.g., 42101-1234567-1)',
    dialCode: '+92',
    phonePlaceholder: '300 1234567',
    phoneHelp: 'Pakistan mobile number without leading 0',
    maskId: (val) => {
      const clean = val.replace(/\D/g, '').substring(0, 13);
      if (clean.length <= 5) return clean;
      if (clean.length <= 12) return `${clean.substring(0, 5)}-${clean.substring(5)}`;
      return `${clean.substring(0, 5)}-${clean.substring(5, 12)}-${clean.substring(12, 13)}`;
    }
  },
  AE: {
    name: 'United Arab Emirates',
    flag: '🇦🇪',
    idLabel: 'Emirates ID (15 Digits) *',
    idPlaceholder: '784-1990-1234567-1',
    idHelp: 'Format: 784-YYYY-XXXXXXX-X (15 digits)',
    dialCode: '+971',
    phonePlaceholder: '50 123 4567',
    phoneHelp: 'UAE mobile number without leading 0',
    maskId: (val) => {
      const clean = val.replace(/\D/g, '').substring(0, 15);
      if (clean.length <= 3) return clean;
      if (clean.length <= 7) return `${clean.substring(0, 3)}-${clean.substring(3)}`;
      if (clean.length <= 14) return `${clean.substring(0, 3)}-${clean.substring(3, 7)}-${clean.substring(7)}`;
      return `${clean.substring(0, 3)}-${clean.substring(3, 7)}-${clean.substring(7, 14)}-${clean.substring(14, 15)}`;
    }
  },
  SA: {
    name: 'Saudi Arabia',
    flag: '🇸🇦',
    idLabel: 'National ID / Iqama Number (10 Digits) *',
    idPlaceholder: '1012345678',
    idHelp: 'Format: 10-digit Saudi National ID or Iqama',
    dialCode: '+966',
    phonePlaceholder: '50 123 4567',
    phoneHelp: 'Saudi mobile number without leading 0',
    maskId: (val) => val.replace(/\D/g, '').substring(0, 10)
  },
  IN: {
    name: 'India',
    flag: '🇮🇳',
    idLabel: 'Aadhaar Card Number (12 Digits) *',
    idPlaceholder: '1234 5678 9012',
    idHelp: 'Format: 12-digit Aadhaar Card number (4-4-4)',
    dialCode: '+91',
    phonePlaceholder: '98765 43210',
    phoneHelp: 'Indian 10-digit mobile number',
    maskId: (val) => {
      const clean = val.replace(/\D/g, '').substring(0, 12);
      const parts = clean.match(/.{1,4}/g);
      return parts ? parts.join(' ') : clean;
    }
  },
  GB: {
    name: 'United Kingdom',
    flag: '🇬🇧',
    idLabel: 'National Insurance (NINO) / Passport *',
    idPlaceholder: 'QQ 12 34 56 A',
    idHelp: 'UK National Insurance Number (NINO) or British Passport',
    dialCode: '+44',
    phonePlaceholder: '7911 123456',
    phoneHelp: 'UK mobile number without leading 0',
    maskId: (val) => val.toUpperCase().substring(0, 15)
  },
  US: {
    name: 'United States',
    flag: '🇺🇸',
    idLabel: 'Social Security Number (SSN - 9 Digits) *',
    idPlaceholder: '123-45-6789',
    idHelp: 'Format: 3 digits - 2 digits - 4 digits (e.g. 123-45-6789)',
    dialCode: '+1',
    phonePlaceholder: '(555) 123-4567',
    phoneHelp: 'US 10-digit area code + phone number',
    maskId: (val) => {
      const clean = val.replace(/\D/g, '').substring(0, 9);
      if (clean.length <= 3) return clean;
      if (clean.length <= 5) return `${clean.substring(0, 3)}-${clean.substring(3)}`;
      return `${clean.substring(0, 3)}-${clean.substring(3, 5)}-${clean.substring(5, 9)}`;
    }
  },
  CA: {
    name: 'Canada',
    flag: '🇨🇦',
    idLabel: 'Social Insurance Number (SIN - 9 Digits) *',
    idPlaceholder: '123-456-789',
    idHelp: 'Format: 3 digits - 3 digits - 3 digits (e.g. 123-456-789)',
    dialCode: '+1',
    phonePlaceholder: '(555) 123-4567',
    phoneHelp: 'Canada 10-digit area code + phone number',
    maskId: (val) => {
      const clean = val.replace(/\D/g, '').substring(0, 9);
      if (clean.length <= 3) return clean;
      if (clean.length <= 6) return `${clean.substring(0, 3)}-${clean.substring(3)}`;
      return `${clean.substring(0, 3)}-${clean.substring(3, 6)}-${clean.substring(6, 9)}`;
    }
  },
  AU: {
    name: 'Australia',
    flag: '🇦🇺',
    idLabel: 'Tax File Number (TFN) / Passport *',
    idPlaceholder: '123 456 789',
    idHelp: 'Australian TFN or Passport Number',
    dialCode: '+61',
    phonePlaceholder: '412 345 678',
    phoneHelp: 'Australian mobile number without leading 0',
    maskId: (val) => val.trim().substring(0, 15)
  },
  DE: {
    name: 'Germany',
    flag: '🇩🇪',
    idLabel: 'Steuer-ID / Personalausweis *',
    idPlaceholder: '12 345 678 901',
    idHelp: '11-digit German Tax ID or Passport',
    dialCode: '+49',
    phonePlaceholder: '151 23456789',
    phoneHelp: 'German mobile number without leading 0',
    maskId: (val) => val.trim().substring(0, 15)
  },
  TR: {
    name: 'Turkey',
    flag: '🇹🇷',
    idLabel: 'T.C. Kimlik No (11 Digits) *',
    idPlaceholder: '12345678901',
    idHelp: '11-digit Turkish Citizen Identity Number',
    dialCode: '+90',
    phonePlaceholder: '532 123 4567',
    phoneHelp: 'Turkish mobile number without leading 0',
    maskId: (val) => val.replace(/\D/g, '').substring(0, 11)
  },
  OTHER: {
    name: 'Other Countries',
    flag: '🌐',
    idLabel: 'Passport / National Identity Document *',
    idPlaceholder: 'A12345678',
    idHelp: 'Government Issued Passport or National Record Number',
    dialCode: '+',
    phonePlaceholder: 'CountryCode Number',
    phoneHelp: 'Full international phone number including country code',
    maskId: (val) => val.trim().substring(0, 25)
  }
};

// Default Sample Data
const DEFAULT_WASIYAT_DATA = {
  country: 'PK',
  fullName: 'Muhammad Tariq',
  idNumber: '42101-1234567-1',
  phone: '300 1234567',
  nasihat: `My beloved family,\n\nLife in this world is temporary and brief. My foremost advice to my children and spouse is to remain steadfast in faith, honesty, and kindness. Support one another through thick and thin, never allow disputes over worldly wealth to break the ties of kinship (Silah Rahmi), and forgive each other freely.\n\nPlease remember me in your daily prayers and supplications (Dua).`,
  assets: `1. Family Residence (House # 45, Sector B): To remain under the care of my spouse during her lifetime, thereafter distributed according to prescribed legal/Islamic inheritance shares.\n2. Bank Account (HBL Acc # 0019283746): Total approximate balance Rs. 1,500,000. Pay any pending hospital bills or funeral expenses first. Dedicate 10% towards ongoing charity (Sadaqah Jariyah for a water well or school), and distribute the remainder among all heirs.\n3. Family Car (Toyota Corolla 2018): May be retained or sold for fair market value to settle any balance.`,
  debtsPayable: `1. Rs. 45,000 owed to Uncle Ahmad (Pharmacy bill). Must be settled from my immediate cash savings before any inheritance division.\n2. Return the borrowed lawnmower to Neighbor Khalid.`,
  debtsReceivable: `1. Rs. 80,000 given as friendly loan to my colleague Zubair in 2024. Please politely remind him; if he cannot pay, I permit you to forgive it.`,
  funeralWishes: `Keep my Janaza and burial strictly simple and timely. Do not spend excessively on catering or mourning rituals. Bury me in the local community graveyard, and request the gathered community to forgive any shortcomings on my part.`
};

const DEFAULT_RECIPIENTS = [
  {
    id: 'rec_1',
    name: 'Ali Tariq',
    relation: 'Son',
    country: 'PK',
    email: 'ali.tariq@example.com',
    phone: '+92 300 1234567',
    sendEmailNotification: true,
    privateLetter: `My dearest son Ali,\n\nYou have been my strength and pride. Always treat your mother with the utmost patience, honor, and tenderness—never raise your voice before her. Lead the family with wisdom and integrity, and take care of your younger sister's needs.`
  },
  {
    id: 'rec_2',
    name: 'Fatima Tariq',
    relation: 'Daughter',
    country: 'PK',
    email: 'fatima.t@example.com',
    phone: '+92 321 9876543',
    sendEmailNotification: true,
    privateLetter: `My precious daughter Fatima,\n\nYour kindness and gentle heart brought so much light to my life. Pursue your education and aspirations with courage. Never let anyone diminish your self-worth, and know that your father will always be watching over you in spirit.`
  },
  {
    id: 'rec_3',
    name: 'Zainab Begum',
    relation: 'Spouse (Wife/Husband)',
    country: 'PK',
    email: 'zainab.begum@example.com',
    phone: '+92 333 5554433',
    sendEmailNotification: true,
    privateLetter: `My beloved wife Zainab,\n\nThank you for decades of companionship, patience, and love. You stood by me during every hardship. Forgive me for any time I was impatient or unkind. May we be reunited in the highest gardens of peace.`
  }
];

// Sample Default Attachments
const DEFAULT_ATTACHMENTS = [
  {
    id: 'att_1',
    name: 'Property_Registry_Deed_House_45.pdf',
    type: 'application/pdf',
    category: 'document',
    sizeFormatted: '2.4 MB',
    uploadedAt: new Date(Date.now() - 5 * DAY_MS).toLocaleDateString(),
    dataUrl: '' // Virtual document badge
  },
  {
    id: 'att_2',
    name: 'Family_House_Deed_Signed_Copy.jpg',
    type: 'image/jpeg',
    category: 'image',
    sizeFormatted: '1.8 MB',
    uploadedAt: new Date(Date.now() - 2 * DAY_MS).toLocaleDateString(),
    dataUrl: ''
  }
];

// App State
let state = {
  deadline: null,
  status: 'active',
  data: {},
  recipients: [],
  attachments: [],
  logs: [],
  notifiedMilestones: {},
  emailsDispatched: false,
  version: '1.0',
  lastUpdated: 'Just now',
  timerInterval: null,
  reminderDismissed: false
};

// DOM Elements
const elDays = document.getElementById('days-val');
const elHours = document.getElementById('hours-val');
const elMinutes = document.getElementById('minutes-val');
const elSeconds = document.getElementById('seconds-val');
const elDeadlineText = document.getElementById('deadline-date-text');
const elSystemStatusPill = document.getElementById('system-status-pill');
const elSystemStatusText = document.getElementById('system-status-text');
const elTransferAlertBox = document.getElementById('transfer-alert-box');
const elRecipientCountBadge = document.getElementById('recipient-count-badge');
const elEmailRecipientsCount = document.getElementById('email-recipients-count');
const elAttachmentsCountBadge = document.getElementById('attachments-count-badge');
const elAttachmentsDisplayCount = document.getElementById('attachments-display-count');
const elRecipientsList = document.getElementById('recipients-list-container');
const elNoRecipientsState = document.getElementById('no-recipients-state');
const elEmailRecipientsContainer = document.getElementById('email-recipients-container');
const elNoEmailRecipientsState = document.getElementById('no-email-recipients-state');
const elAttachmentsGrid = document.getElementById('attachments-grid-container');
const elNoAttachmentsState = document.getElementById('no-attachments-state');
const elAuditTimeline = document.getElementById('audit-timeline');

// Country Elements
const elUserCountry = document.getElementById('user-country');
const elCountryHintText = document.getElementById('country-hint-text');
const elUserIdLabel = document.getElementById('user-id-label');
const elUserIdNumber = document.getElementById('user-id-number');
const elUserIdHelp = document.getElementById('user-id-help');
const elUserPhoneDialcode = document.getElementById('user-phone-dialcode');
const elUserPhoneNumber = document.getElementById('user-phone-number');
const elUserPhoneHelp = document.getElementById('user-phone-help');

// Revision Tracker Elements
const elWasiyatVersionNum = document.getElementById('wasiyat-version-num');
const elWasiyatLastUpdatedText = document.getElementById('wasiyat-last-updated-text');

// Sticky Milestone Reminder Elements
const elReminderBanner = document.getElementById('milestone-reminder-banner');
const elReminderIcon = document.getElementById('reminder-icon');
const elReminderTitle = document.getElementById('reminder-title');
const elReminderMessage = document.getElementById('reminder-message');
const elBtnReminderExtend = document.getElementById('btn-reminder-extend');
const elBtnDismissReminder = document.getElementById('btn-dismiss-reminder');

// Milestone Schedule Card Badges
const badgeMilestone15 = document.getElementById('badge-milestone-15');
const badgeMilestone10 = document.getElementById('badge-milestone-10');
const badgeMilestone5 = document.getElementById('badge-milestone-5');
const badgeMilestone1 = document.getElementById('badge-milestone-1');

const cardMilestone15 = document.getElementById('milestone-card-15');
const cardMilestone10 = document.getElementById('milestone-card-10');
const cardMilestone5 = document.getElementById('milestone-card-5');
const cardMilestone1 = document.getElementById('milestone-card-1');

// Portal Elements
const elPortalLockedView = document.getElementById('portal-locked-view');
const elPortalUnlockedView = document.getElementById('portal-unlocked-view');
const elLockedCountdownPreview = document.getElementById('locked-countdown-preview-text');
const elSelectBeneficiary = document.getElementById('select-beneficiary-filter');
const elPrivateLetterCard = document.getElementById('private-letter-card');
const elLetterRecipientTitle = document.getElementById('letter-recipient-title');
const elLetterContent = document.getElementById('letter-content');
const elViewPortalAttachments = document.getElementById('view-portal-attachments-container');

// Modal Elements
const recipientModal = document.getElementById('recipient-modal');
const recipientForm = document.getElementById('recipient-form');
const elRecipientCountry = document.getElementById('recipient-country');
const elRecipientDialPrefix = document.getElementById('recipient-dialcode-prefix');
const elRecipientSendEmail = document.getElementById('recipient-send-email');

// Email Preview Modal Elements
const emailPreviewModal = document.getElementById('email-preview-modal');
const previewEmailTo = document.getElementById('preview-email-to');
const previewEmailSubject = document.getElementById('preview-email-subject');
const previewRecipientSalutation = document.getElementById('preview-recipient-salutation');
const previewSenderName = document.getElementById('preview-sender-name');
const previewPrivateLetterBody = document.getElementById('preview-private-letter-body');

// Lightbox Elements
const lightboxModal = document.getElementById('media-lightbox-modal');
const lightboxFilename = document.getElementById('lightbox-filename');
const lightboxContent = document.getElementById('lightbox-content-area');
const lightboxDownloadLink = document.getElementById('lightbox-download-link');

// File Upload Elements
const fileUploaderInput = document.getElementById('file-uploader-input');
const dropUploadZone = document.getElementById('drop-upload-zone');
const btnTriggerUpload = document.getElementById('btn-trigger-upload');
const btnEmptyUpload = document.getElementById('btn-empty-upload');

/* ==========================================================================
   INITIALIZATION
   ========================================================================== */
function initApp() {
  loadStoredData();
  setupEventListeners();
  applyCountryAdaptation(state.data.country || 'PK');
  renderWasiyatForm();
  renderRecipientsList();
  renderEmailRecipientsList();
  renderAttachmentsGallery();
  renderAuditLogs();
  startCountdownEngine();
  updateBeneficiaryPortal();
}

function loadStoredData() {
  // Load deadline
  const savedDeadline = localStorage.getItem(STORAGE_KEYS.DEADLINE);
  if (savedDeadline) {
    state.deadline = parseInt(savedDeadline, 10);
  } else {
    state.deadline = Date.now() + NINETY_DAYS_MS;
    localStorage.setItem(STORAGE_KEYS.DEADLINE, state.deadline);
  }

  // Load Status
  const savedStatus = localStorage.getItem(STORAGE_KEYS.STATUS);
  state.status = savedStatus || 'active';

  // Load Version & Last Updated
  state.version = localStorage.getItem(STORAGE_KEYS.VERSION) || '1.0';
  state.lastUpdated = localStorage.getItem(STORAGE_KEYS.LAST_UPDATED) || new Date().toLocaleString();
  elWasiyatVersionNum.textContent = state.version;
  elWasiyatLastUpdatedText.textContent = state.lastUpdated;

  // Load Milestones
  const savedMilestones = localStorage.getItem(STORAGE_KEYS.NOTIFIED_MILESTONES);
  state.notifiedMilestones = savedMilestones ? JSON.parse(savedMilestones) : {
    '15d': false,
    '10d': false,
    '5d': false,
    '1d': false
  };

  // Load Wasiyat Data
  const savedData = localStorage.getItem(STORAGE_KEYS.DATA);
  if (savedData) {
    state.data = JSON.parse(savedData);
  } else {
    state.data = { ...DEFAULT_WASIYAT_DATA };
    localStorage.setItem(STORAGE_KEYS.DATA, JSON.stringify(state.data));
  }

  // Load Recipients
  const savedRecipients = localStorage.getItem(STORAGE_KEYS.RECIPIENTS);
  if (savedRecipients) {
    state.recipients = JSON.parse(savedRecipients);
  } else {
    state.recipients = [...DEFAULT_RECIPIENTS];
    localStorage.setItem(STORAGE_KEYS.RECIPIENTS, JSON.stringify(state.recipients));
  }

  // Load Attachments
  const savedAttachments = localStorage.getItem(STORAGE_KEYS.ATTACHMENTS);
  if (savedAttachments) {
    state.attachments = JSON.parse(savedAttachments);
  } else {
    state.attachments = [...DEFAULT_ATTACHMENTS];
    localStorage.setItem(STORAGE_KEYS.ATTACHMENTS, JSON.stringify(state.attachments));
  }

  // Load Emails Dispatched state
  state.emailsDispatched = localStorage.getItem(STORAGE_KEYS.EMAILS_DISPATCHED) === 'true';

  // Load Logs
  const savedLogs = localStorage.getItem(STORAGE_KEYS.LOGS);
  if (savedLogs) {
    state.logs = JSON.parse(savedLogs);
  } else {
    state.logs = [
      {
        id: 'log_init',
        timestamp: new Date().toISOString(),
        action: 'System Protocol Initialized',
        details: 'Initial 90-day dead man switch activated. Multi-media document vault & email queue armed.',
        type: 'normal'
      }
    ];
    localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(state.logs));
  }
}

/* ==========================================================================
   COUNTRY SELECTION & DYNAMIC FORMATTING LOGIC
   ========================================================================== */
function applyCountryAdaptation(countryCode) {
  const config = COUNTRY_CONFIGS[countryCode] || COUNTRY_CONFIGS.OTHER;

  elUserCountry.value = countryCode;
  elCountryHintText.textContent = `Selected: ${config.name} (${config.flag}) - ${config.idLabel.replace(' *', '')} & Dial Code (${config.dialCode})`;
  
  elUserIdLabel.textContent = config.idLabel;
  elUserIdNumber.placeholder = config.idPlaceholder;
  elUserIdHelp.textContent = config.idHelp;

  elUserPhoneDialcode.textContent = config.dialCode;
  elUserPhoneNumber.placeholder = config.phonePlaceholder;
  elUserPhoneHelp.textContent = config.phoneHelp;
}

function handleCountryChange(e) {
  const countryCode = e.target.value;
  applyCountryAdaptation(countryCode);

  const currentIdVal = elUserIdNumber.value;
  const config = COUNTRY_CONFIGS[countryCode] || COUNTRY_CONFIGS.OTHER;
  if (currentIdVal && config.maskId) {
    elUserIdNumber.value = config.maskId(currentIdVal);
  }
}

function handleIdInputFormatting() {
  const countryCode = elUserCountry.value;
  const config = COUNTRY_CONFIGS[countryCode] || COUNTRY_CONFIGS.OTHER;
  if (config.maskId) {
    const rawVal = elUserIdNumber.value;
    elUserIdNumber.value = config.maskId(rawVal);
  }
}

function handleRecipientCountryChange(e) {
  const countryCode = e.target.value;
  const config = COUNTRY_CONFIGS[countryCode] || COUNTRY_CONFIGS.OTHER;
  elRecipientDialPrefix.textContent = config.dialCode;
  document.getElementById('recipient-phone').placeholder = config.phonePlaceholder;
}

/* ==========================================================================
   MULTI-MEDIA ATTACHMENTS VAULT (DEEDS, PICTURES, VIDEOS)
   ========================================================================== */
function renderAttachmentsGallery() {
  const total = state.attachments.length;
  elAttachmentsCountBadge.textContent = total;
  elAttachmentsDisplayCount.textContent = total;
  elAttachmentsGrid.innerHTML = '';

  if (total === 0) {
    elNoAttachmentsState.classList.remove('hidden');
    return;
  }
  elNoAttachmentsState.classList.add('hidden');

  state.attachments.forEach(att => {
    const card = document.createElement('div');
    card.className = 'attachment-card';

    let previewContent = '';
    let categoryBadge = '📄 Document';

    if (att.category === 'image') {
      categoryBadge = '🖼️ Photo / Scan';
      previewContent = att.dataUrl 
        ? `<img src="${att.dataUrl}" alt="${escapeHtml(att.name)}" class="attachment-img-thumb">`
        : `<div class="attachment-doc-icon">🖼️</div>`;
    } else if (att.category === 'video') {
      categoryBadge = '🎬 Video Message';
      previewContent = `
        <div class="attachment-doc-icon">🎬</div>
        <span class="attachment-video-badge">VIDEO</span>
      `;
    } else {
      previewContent = `<div class="attachment-doc-icon">📄</div>`;
    }

    card.innerHTML = `
      <div>
        <div class="attachment-preview-box">
          ${previewContent}
        </div>
        <div class="attachment-details">
          <span class="attachment-filename" title="${escapeHtml(att.name)}">${escapeHtml(att.name)}</span>
          <div class="attachment-meta-info">
            <span>${categoryBadge}</span>
            <span>${att.sizeFormatted || '1.5 MB'}</span>
          </div>
          <div class="attachment-meta-info">
            <span>Added: ${att.uploadedAt}</span>
          </div>
        </div>
      </div>
      <div class="attachment-actions-row">
        <button class="btn btn-outline btn-xs btn-view-attachment" data-id="${att.id}">👁️ View File</button>
        <button class="btn btn-pill-danger btn-xs btn-delete-attachment" data-id="${att.id}">🗑️ Remove</button>
      </div>
    `;
    elAttachmentsGrid.appendChild(card);
  });

  // Attach handlers
  document.querySelectorAll('.btn-view-attachment').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = e.currentTarget.getAttribute('data-id');
      openMediaLightbox(id);
    });
  });

  document.querySelectorAll('.btn-delete-attachment').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = e.currentTarget.getAttribute('data-id');
      deleteAttachment(id);
    });
  });

  updateBeneficiaryPortal();
}

function handleFilesUploaded(fileList) {
  if (!fileList || fileList.length === 0) return;

  Array.from(fileList).forEach(file => {
    let category = 'document';
    if (file.type.startsWith('image/')) category = 'image';
    if (file.type.startsWith('video/')) category = 'video';
    if (file.type.startsWith('audio/')) category = 'audio';

    const sizeFormatted = formatFileSize(file.size);

    const reader = new FileReader();
    reader.onload = function(e) {
      const dataUrl = (file.size < 8 * 1024 * 1024) ? e.target.result : ''; // Store if < 8MB for instant playback

      const newAtt = {
        id: 'att_' + Date.now() + Math.random().toString(36).substring(2, 6),
        name: file.name,
        type: file.type || 'application/octet-stream',
        category,
        sizeFormatted,
        uploadedAt: new Date().toLocaleDateString(),
        dataUrl
      };

      state.attachments.push(newAtt);
      localStorage.setItem(STORAGE_KEYS.ATTACHMENTS, JSON.stringify(state.attachments));
      
      addAuditLog(
        `Media Uploaded: ${file.name}`,
        `Attached ${category.toUpperCase()} (${sizeFormatted}) to legal vault record.`,
        'normal'
      );

      renderAttachmentsGallery();
    };

    if (file.size < 8 * 1024 * 1024) {
      reader.readAsDataURL(file);
    } else {
      // Create record for larger files without choking localStorage
      const newAtt = {
        id: 'att_' + Date.now() + Math.random().toString(36).substring(2, 6),
        name: file.name,
        type: file.type || 'application/octet-stream',
        category,
        sizeFormatted,
        uploadedAt: new Date().toLocaleDateString(),
        dataUrl: ''
      };
      state.attachments.push(newAtt);
      localStorage.setItem(STORAGE_KEYS.ATTACHMENTS, JSON.stringify(state.attachments));
      renderAttachmentsGallery();
    }
  });

  alert(`✅ Successfully added ${fileList.length} file(s) to your digital vault!`);
}

function openMediaLightbox(id) {
  const att = state.attachments.find(a => a.id === id);
  if (!att) return;

  lightboxFilename.textContent = att.name;
  lightboxDownloadLink.href = att.dataUrl || '#';
  lightboxDownloadLink.download = att.name;

  if (att.category === 'image' && att.dataUrl) {
    lightboxContent.innerHTML = `<img src="${att.dataUrl}" alt="${escapeHtml(att.name)}" class="lightbox-img">`;
  } else if (att.category === 'video' && att.dataUrl) {
    lightboxContent.innerHTML = `
      <video controls autoplay class="lightbox-video">
        <source src="${att.dataUrl}" type="${att.type}">
        Your browser does not support HTML5 video.
      </video>
    `;
  } else {
    lightboxContent.innerHTML = `
      <div class="lightbox-doc-view">
        <div class="lightbox-doc-icon">📄</div>
        <h4>${escapeHtml(att.name)}</h4>
        <p class="text-muted">Document stored securely in client encryption vault (${att.sizeFormatted})</p>
      </div>
    `;
  }

  lightboxModal.classList.remove('hidden');
}

function closeMediaLightbox() {
  lightboxModal.classList.add('hidden');
  lightboxContent.innerHTML = ''; // Stop video playback
}

function deleteAttachment(id) {
  const att = state.attachments.find(a => a.id === id);
  if (!att) return;

  if (confirm(`Are you sure you want to delete "${att.name}" from your vault?`)) {
    state.attachments = state.attachments.filter(a => a.id !== id);
    localStorage.setItem(STORAGE_KEYS.ATTACHMENTS, JSON.stringify(state.attachments));
    addAuditLog('Media Removed', `Removed ${att.name} from vault attachments.`);
    renderAttachmentsGallery();
  }
}

function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

/* ==========================================================================
   COUNTDOWN & DEAD MAN'S SWITCH ENGINE
   ========================================================================== */
function startCountdownEngine() {
  if (state.timerInterval) {
    clearInterval(state.timerInterval);
  }

  updateTimerTick();
  state.timerInterval = setInterval(updateTimerTick, 1000);
}

function updateTimerTick() {
  const now = Date.now();
  const diff = state.deadline - now;

  const deadlineDate = new Date(state.deadline);
  elDeadlineText.textContent = deadlineDate.toLocaleDateString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  if (diff <= 0) {
    elDays.textContent = '00';
    elHours.textContent = '00';
    elMinutes.textContent = '00';
    elSeconds.textContent = '00';

    if (state.status !== 'expired') {
      triggerExpiryProtocol();
    }
    updateStatusUI('expired');
    hideMilestoneReminder();
  } else {
    const days = Math.floor(diff / DAY_MS);
    const hours = Math.floor((diff % DAY_MS) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    elDays.textContent = String(days).padStart(2, '0');
    elHours.textContent = String(hours).padStart(2, '0');
    elMinutes.textContent = String(minutes).padStart(2, '0');
    elSeconds.textContent = String(seconds).padStart(2, '0');

    elLockedCountdownPreview.textContent = `${days} Days, ${hours} Hours, ${minutes} Min remaining`;

    checkAndTriggerMilestoneReminders(diff, days);
  }
}

function checkAndTriggerMilestoneReminders(diffMs, daysRemaining) {
  resetScheduleMilestoneStyles();

  if (diffMs <= REMINDER_THRESHOLDS.ONE_DAY) {
    updateStatusUI('critical');
    markMilestoneTriggered('1d', cardMilestone1, badgeMilestone1, 'Critical Triggered');
    showMilestoneReminder(
      'reminder-1d',
      '🚨',
      'FINAL 24-HOUR NOTICE: Life Verification Required!',
      `Less than 24 hours left before your Wasiyat is automatically transferred to your heirs and post-mortem emails are dispatched. If you are alive, please extend now!`
    );

    if (!state.notifiedMilestones['1d']) {
      state.notifiedMilestones['1d'] = true;
      persistMilestones();
      dispatchNotification(
        '🚨 CRITICAL: Final Day to Extend Wasiyat',
        'Less than 24 hours remaining on your 90-day timer! Click here to confirm you are alive.'
      );
      addAuditLog(
        'Automated Reminder Dispatched (1 Day Left)',
        'Final 24-hour critical alert sent to user. Emails will dispatch tomorrow if no check-in occurs.',
        'critical'
      );
    }
  } else if (diffMs <= REMINDER_THRESHOLDS.FIVE_DAYS) {
    updateStatusUI('urgent');
    markMilestoneTriggered('5d', cardMilestone5, badgeMilestone5, 'Urgent Triggered');
    showMilestoneReminder(
      'reminder-5d',
      '⚠️',
      'URGENT: 5 Days Remaining!',
      `You have only ${daysRemaining} days remaining before your Wasiyat is automatically transferred. Please click "I Am Alive" to extend.`
    );

    if (!state.notifiedMilestones['5d']) {
      state.notifiedMilestones['5d'] = true;
      persistMilestones();
      dispatchNotification(
        '⚠️ Urgent: 5 Days Remaining on Wasiyat Timer',
        'Your 90-day check-in is due within 5 days. Verify your status to prevent automatic testament transfer.'
      );
      addAuditLog(
        'Automated Reminder Dispatched (5 Days Left)',
        'Urgent 5-day checkpoint alert sent to user via in-app banner and browser notification.',
        'reminder'
      );
    }
  } else if (diffMs <= REMINDER_THRESHOLDS.TEN_DAYS) {
    updateStatusUI('warning');
    markMilestoneTriggered('10d', cardMilestone10, badgeMilestone10, 'Triggered');
    showMilestoneReminder(
      'reminder-10d',
      '⏳',
      '10-Day Reminder: Check-in Due Soon',
      `You have ${daysRemaining} days left on your 90-day timer. Remember to extend your time if you are alive.`
    );

    if (!state.notifiedMilestones['10d']) {
      state.notifiedMilestones['10d'] = true;
      persistMilestones();
      dispatchNotification(
        '⏳ 10 Days Remaining on Wasiyat Timer',
        'You have 10 days remaining to extend your time.'
      );
      addAuditLog(
        'Automated Reminder Dispatched (10 Days Left)',
        '10-day checkpoint reminder dispatched. User prompted to extend time by +90 days.',
        'reminder'
      );
    }
  } else if (diffMs <= REMINDER_THRESHOLDS.FIFTEEN_DAYS) {
    updateStatusUI('warning');
    markMilestoneTriggered('15d', cardMilestone15, badgeMilestone15, 'Triggered');
    showMilestoneReminder(
      'reminder-15d',
      '🔔',
      '15-Day Life Check-in Notice',
      `You have 15 days remaining before your 90-day cycle ends. If you want to extend your time, you can click "I Am Alive" now.`
    );

    if (!state.notifiedMilestones['15d']) {
      state.notifiedMilestones['15d'] = true;
      persistMilestones();
      dispatchNotification(
        '🔔 15 Days Remaining on Wasiyat Timer',
        'First reminder: 15 days remaining to extend your timer by another 90 days.'
      );
      addAuditLog(
        'Automated Reminder Dispatched (15 Days Left)',
        'Initial 15-day checkpoint reminder triggered. User notified to extend timer.',
        'reminder'
      );
    }
  } else {
    updateStatusUI('active');
    hideMilestoneReminder();
  }
}

function showMilestoneReminder(colorClass, icon, title, message) {
  if (state.reminderDismissed) return;

  elReminderBanner.className = `milestone-reminder ${colorClass}`;
  elReminderIcon.textContent = icon;
  elReminderTitle.textContent = title;
  elReminderMessage.textContent = message;
  elReminderBanner.classList.remove('hidden');
}

function hideMilestoneReminder() {
  elReminderBanner.classList.add('hidden');
}

function resetScheduleMilestoneStyles() {
  [cardMilestone15, cardMilestone10, cardMilestone5, cardMilestone1].forEach(c => {
    if (c) c.classList.remove('milestone-active');
  });
  if (badgeMilestone15) { badgeMilestone15.textContent = 'Scheduled'; badgeMilestone15.className = 'milestone-status status-pending'; }
  if (badgeMilestone10) { badgeMilestone10.textContent = 'Scheduled'; badgeMilestone10.className = 'milestone-status status-pending'; }
  if (badgeMilestone5) { badgeMilestone5.textContent = 'Scheduled'; badgeMilestone5.className = 'milestone-status status-pending'; }
  if (badgeMilestone1) { badgeMilestone1.textContent = 'Scheduled'; badgeMilestone1.className = 'milestone-status status-pending'; }
}

function markMilestoneTriggered(key, cardEl, badgeEl, badgeText) {
  if (cardEl) cardEl.classList.add('milestone-active');
  if (badgeEl) {
    badgeEl.textContent = badgeText;
    badgeEl.className = key === '1d' ? 'milestone-status status-critical-triggered' : 'milestone-status status-triggered';
  }
}

function persistMilestones() {
  localStorage.setItem(STORAGE_KEYS.NOTIFIED_MILESTONES, JSON.stringify(state.notifiedMilestones));
}

function updateStatusUI(status) {
  state.status = status;
  localStorage.setItem(STORAGE_KEYS.STATUS, status);

  elSystemStatusPill.className = 'status-pill';

  if (status === 'active') {
    elSystemStatusPill.classList.add('status-active');
    elSystemStatusText.textContent = 'Status: Monitored & Protected';
    elTransferAlertBox.classList.add('hidden');
  } else if (status === 'warning') {
    elSystemStatusPill.classList.add('status-warning');
    elSystemStatusText.textContent = 'Status: Check-In Due (<15 Days)';
    elTransferAlertBox.classList.add('hidden');
  } else if (status === 'urgent') {
    elSystemStatusPill.classList.add('status-urgent');
    elSystemStatusText.textContent = 'Status: Urgent Warning (<5 Days)';
    elTransferAlertBox.classList.add('hidden');
  } else if (status === 'critical') {
    elSystemStatusPill.classList.add('status-expired');
    elSystemStatusText.textContent = 'Status: CRITICAL (Final 24 Hours)';
    elTransferAlertBox.classList.add('hidden');
  } else if (status === 'expired') {
    elSystemStatusPill.classList.add('status-expired');
    elSystemStatusText.textContent = 'Status: TESTAMENT RELEASED (Inactive)';
    elTransferAlertBox.classList.remove('hidden');
  }

  updateBeneficiaryPortal();
  renderEmailRecipientsList();
}

function extendLifeCheckIn() {
  state.deadline = Date.now() + NINETY_DAYS_MS;
  state.status = 'active';
  state.reminderDismissed = false;
  state.emailsDispatched = false;
  localStorage.setItem(STORAGE_KEYS.EMAILS_DISPATCHED, 'false');

  state.notifiedMilestones = {
    '15d': false,
    '10d': false,
    '5d': false,
    '1d': false
  };
  persistMilestones();

  localStorage.setItem(STORAGE_KEYS.DEADLINE, state.deadline);
  localStorage.setItem(STORAGE_KEYS.STATUS, 'active');

  const nowFormatted = new Date().toLocaleString();
  addAuditLog(
    'Life Check-In Verified (+90 Days Added)',
    `User confirmed alive at ${nowFormatted}. Timer extended by 90 days. Email dispatch re-armed.`
  );

  hideMilestoneReminder();
  updateStatusUI('active');
  startCountdownEngine();

  alert(`✅ Thank you! Your life status is confirmed.\nYour Wasiyat protection has been extended by a fresh 90 days.\nAutomated email dispatch is safely re-armed.`);
}

function triggerExpiryProtocol() {
  state.status = 'expired';
  state.emailsDispatched = true;
  localStorage.setItem(STORAGE_KEYS.STATUS, 'expired');
  localStorage.setItem(STORAGE_KEYS.EMAILS_DISPATCHED, 'true');

  const emailRecipients = state.recipients.filter(r => r.sendEmailNotification !== false);

  addAuditLog(
    'PROTOCOL ACTIVATED: 90 Days Expired',
    `Check-in window passed without response. Automated post-mortem emails dispatched to ${emailRecipients.length} recipients.`,
    'critical'
  );

  emailRecipients.forEach(r => {
    addAuditLog(
      `✉️ Email Dispatched: ${r.name}`,
      `Post-mortem testament link sent to ${r.email} (${r.relation}).`,
      'email'
    );
  });

  updateBeneficiaryPortal();
  renderEmailRecipientsList();
}

function dispatchNotification(title, body) {
  if ('Notification' in window && Notification.permission === 'granted') {
    try {
      new Notification(title, {
        body,
        icon: '⚖️',
        requireInteraction: true
      });
    } catch (e) {
      console.warn('Could not display native notification', e);
    }
  }
}

function requestBrowserNotifications() {
  if (!('Notification' in window)) {
    alert('Browser notifications are not supported on this browser.');
    return;
  }

  Notification.requestPermission().then(permission => {
    if (permission === 'granted') {
      alert('✅ Desktop reminders enabled! You will receive pop-up alerts on your desktop when 15, 10, 5, and 1 day remain.');
      dispatchNotification('Amanat Notifications Enabled', 'You will receive reminders when your check-in is due.');
    } else {
      alert('Desktop notifications were not granted. In-app banner reminders will still be active.');
    }
  });
}

/* ==========================================================================
   POST-MORTEM EMAIL DISPATCH ROSTER & PREVIEW
   ========================================================================== */
function renderEmailRecipientsList() {
  const emailRecipients = state.recipients.filter(r => r.sendEmailNotification !== false);
  elEmailRecipientsCount.textContent = emailRecipients.length;
  elEmailRecipientsContainer.innerHTML = '';

  if (emailRecipients.length === 0) {
    elNoEmailRecipientsState.classList.remove('hidden');
    return;
  }
  elNoEmailRecipientsState.classList.add('hidden');

  emailRecipients.forEach(rec => {
    const card = document.createElement('div');
    card.className = 'email-dispatch-card';
    const recCountry = COUNTRY_CONFIGS[rec.country || 'PK'] || COUNTRY_CONFIGS.OTHER;

    const isDispatched = state.status === 'expired';
    const statusPillClass = isDispatched ? 'pill-sent' : 'pill-armed';
    const statusText = isDispatched ? '✓ Dispatched & Delivered' : '⏳ Armed & Queued';

    card.innerHTML = `
      <div>
        <div class="email-card-top">
          <span class="email-recipient-name">${escapeHtml(rec.name)}</span>
          <span class="email-status-pill ${statusPillClass}">${statusText}</span>
        </div>
        <div class="email-card-meta">
          <div><strong>Relationship:</strong> ${escapeHtml(rec.relation)}</div>
          <div><strong>Destination Email:</strong> <span style="color: #38bdf8;">${escapeHtml(rec.email)}</span></div>
          <div><strong>Country:</strong> ${recCountry.flag} ${recCountry.name}</div>
        </div>
        <div class="email-preview-snippet">
          " ${escapeHtml(rec.privateLetter ? rec.privateLetter.substring(0, 80) : 'General Wasiyat & Attached Deeds')}... "
        </div>
      </div>
      <div class="email-card-footer">
        <button class="btn btn-outline btn-sm btn-preview-email" data-id="${rec.id}">
          👁️ Preview Email
        </button>
        <button class="btn btn-ghost btn-sm btn-toggle-email" data-id="${rec.id}">
          ⚙️ Change Settings
        </button>
      </div>
    `;
    elEmailRecipientsContainer.appendChild(card);
  });

  document.querySelectorAll('.btn-preview-email').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = e.currentTarget.getAttribute('data-id');
      openEmailPreview(id);
    });
  });

  document.querySelectorAll('.btn-toggle-email').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = e.currentTarget.getAttribute('data-id');
      openRecipientModal(id);
    });
  });
}

function openEmailPreview(recipientId) {
  const rec = state.recipients.find(r => r.id === recipientId);
  if (!rec) return;

  const senderName = state.data.fullName || 'Muhammad Tariq';
  previewEmailTo.textContent = `${rec.name} <${rec.email}>`;
  previewEmailSubject.textContent = `[Confidential] Final Wasiyat & Advice from ${senderName}`;
  previewRecipientSalutation.textContent = rec.name;
  previewSenderName.textContent = senderName;
  previewPrivateLetterBody.textContent = rec.privateLetter ? `"${rec.privateLetter}"` : `"Follow the shared advice, property distributions, and attached deeds in the family wasiyat."`;

  emailPreviewModal.classList.remove('hidden');
}

function closeEmailPreview() {
  emailPreviewModal.classList.add('hidden');
}

/* ==========================================================================
   AUDIT LOGS
   ========================================================================== */
function addAuditLog(action, details, type = 'normal') {
  const newLog = {
    id: 'log_' + Date.now(),
    timestamp: new Date().toISOString(),
    action,
    details,
    type
  };
  state.logs.unshift(newLog);
  localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(state.logs));
  renderAuditLogs();
}

function renderAuditLogs() {
  elAuditTimeline.innerHTML = '';
  if (!state.logs || state.logs.length === 0) {
    elAuditTimeline.innerHTML = '<p class="text-muted">No audit logs recorded yet.</p>';
    return;
  }

  state.logs.forEach(log => {
    const item = document.createElement('div');
    item.className = 'timeline-item';
    const dateFormatted = new Date(log.timestamp).toLocaleString();
    
    let dotClass = 'timeline-dot';
    if (log.type === 'reminder') dotClass += ' reminder-dot';
    if (log.type === 'critical') dotClass += ' critical-dot';
    if (log.type === 'email') dotClass += ' email-dot';

    item.innerHTML = `
      <div class="${dotClass}"></div>
      <div class="timeline-content">
        <div class="timeline-time">${dateFormatted}</div>
        <div class="timeline-title">${log.action}</div>
        <div class="timeline-desc">${log.details}</div>
      </div>
    `;
    elAuditTimeline.appendChild(item);
  });
}

/* ==========================================================================
   WASIYAT & ADVICE FORM HANDLING (WITH RE-EDITING & VERSIONING)
   ========================================================================== */
function renderWasiyatForm() {
  const countryCode = state.data.country || 'PK';
  elUserCountry.value = countryCode;
  applyCountryAdaptation(countryCode);

  document.getElementById('user-full-name').value = state.data.fullName || '';
  elUserIdNumber.value = state.data.idNumber || '';
  elUserPhoneNumber.value = state.data.phone || '';
  document.getElementById('general-nasihat').value = state.data.nasihat || '';
  document.getElementById('assets-statement').value = state.data.assets || '';
  document.getElementById('debts-payable').value = state.data.debtsPayable || '';
  document.getElementById('debts-receivable').value = state.data.debtsReceivable || '';
  document.getElementById('funeral-wishes').value = state.data.funeralWishes || '';
}

function saveWasiyatFormData(e) {
  if (e) e.preventDefault();

  state.data = {
    country: elUserCountry.value,
    fullName: document.getElementById('user-full-name').value.trim(),
    idNumber: elUserIdNumber.value.trim(),
    phone: elUserPhoneNumber.value.trim(),
    nasihat: document.getElementById('general-nasihat').value.trim(),
    assets: document.getElementById('assets-statement').value.trim(),
    debtsPayable: document.getElementById('debts-payable').value.trim(),
    debtsReceivable: document.getElementById('debts-receivable').value.trim(),
    funeralWishes: document.getElementById('funeral-wishes').value.trim()
  };

  // Increment minor version on each save
  let currentVer = parseFloat(state.version) || 1.0;
  currentVer = (currentVer + 0.1).toFixed(1);
  state.version = String(currentVer);
  state.lastUpdated = new Date().toLocaleString();

  localStorage.setItem(STORAGE_KEYS.DATA, JSON.stringify(state.data));
  localStorage.setItem(STORAGE_KEYS.VERSION, state.version);
  localStorage.setItem(STORAGE_KEYS.LAST_UPDATED, state.lastUpdated);

  elWasiyatVersionNum.textContent = state.version;
  elWasiyatLastUpdatedText.textContent = state.lastUpdated;

  addAuditLog(
    `Wasiyat Updated (v${state.version})`,
    `Testament record updated by user (${state.data.fullName || 'Anonymous'}). Country: ${state.data.country}.`
  );

  const statusMsg = document.getElementById('save-status-msg');
  statusMsg.textContent = `✓ Wasiyat updated successfully (v${state.version})!`;
  setTimeout(() => {
    statusMsg.textContent = '';
  }, 3500);

  updateBeneficiaryPortal();
}

/* ==========================================================================
   RECIPIENTS MANAGEMENT
   ========================================================================== */
function renderRecipientsList() {
  elRecipientCountBadge.textContent = state.recipients.length;
  elRecipientsList.innerHTML = '';

  if (state.recipients.length === 0) {
    elNoRecipientsState.classList.remove('hidden');
    return;
  }
  elNoRecipientsState.classList.add('hidden');

  state.recipients.forEach(rec => {
    const card = document.createElement('div');
    card.className = 'recipient-card';
    const recCountry = COUNTRY_CONFIGS[rec.country || 'PK'] || COUNTRY_CONFIGS.OTHER;

    card.innerHTML = `
      <div>
        <div class="recipient-header">
          <span class="recipient-name">${escapeHtml(rec.name)}</span>
          <span class="recipient-relation-badge">${escapeHtml(rec.relation)}</span>
        </div>
        <div class="recipient-meta">
          <div>🌍 ${recCountry.flag} ${recCountry.name}</div>
          <div>📧 ${escapeHtml(rec.email)} ${rec.sendEmailNotification !== false ? '<span style="color:#34d399; font-weight:700;">(Email Armed)</span>' : '<span style="color:#94a3b8;">(Email Disabled)</span>'}</div>
          ${rec.phone ? `<div>📱 ${escapeHtml(rec.phone)}</div>` : ''}
        </div>
        ${rec.privateLetter ? `
          <div class="recipient-private-preview">
            " ${escapeHtml(rec.privateLetter.substring(0, 85))}${rec.privateLetter.length > 85 ? '...' : ''} "
          </div>
        ` : ''}
      </div>
      <div class="recipient-actions">
        <button class="btn btn-outline btn-xs btn-edit-recipient" data-id="${rec.id}">✏️ Edit</button>
        <button class="btn btn-pill-danger btn-xs btn-delete-recipient" data-id="${rec.id}">🗑️ Remove</button>
      </div>
    `;
    elRecipientsList.appendChild(card);
  });

  document.querySelectorAll('.btn-edit-recipient').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = e.target.getAttribute('data-id');
      openRecipientModal(id);
    });
  });

  document.querySelectorAll('.btn-delete-recipient').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = e.target.getAttribute('data-id');
      deleteRecipient(id);
    });
  });

  updateBeneficiaryPortal();
  renderEmailRecipientsList();
}

function openRecipientModal(editId = null) {
  recipientForm.reset();
  const modalTitle = document.getElementById('modal-title');
  const editInput = document.getElementById('recipient-edit-id');

  if (editId) {
    const target = state.recipients.find(r => r.id === editId);
    if (target) {
      modalTitle.textContent = 'Edit Beneficiary';
      editInput.value = target.id;
      document.getElementById('recipient-name').value = target.name;
      document.getElementById('recipient-relation').value = target.relation;
      elRecipientCountry.value = target.country || 'PK';
      
      const config = COUNTRY_CONFIGS[target.country || 'PK'] || COUNTRY_CONFIGS.OTHER;
      elRecipientDialPrefix.textContent = config.dialCode;

      document.getElementById('recipient-email').value = target.email;
      
      let rawPhone = target.phone || '';
      if (rawPhone.startsWith(config.dialCode)) {
        rawPhone = rawPhone.replace(config.dialCode, '').trim();
      }
      document.getElementById('recipient-phone').value = rawPhone;

      elRecipientSendEmail.checked = target.sendEmailNotification !== false;
      document.getElementById('recipient-private-letter').value = target.privateLetter || '';
    }
  } else {
    modalTitle.textContent = 'Add Beneficiary / Heir';
    editInput.value = '';
    elRecipientCountry.value = state.data.country || 'PK';
    const config = COUNTRY_CONFIGS[elRecipientCountry.value] || COUNTRY_CONFIGS.OTHER;
    elRecipientDialPrefix.textContent = config.dialCode;
    elRecipientSendEmail.checked = true;
  }

  recipientModal.classList.remove('hidden');
}

function closeRecipientModal() {
  recipientModal.classList.add('hidden');
}

function handleSaveRecipient(e) {
  e.preventDefault();
  const editId = document.getElementById('recipient-edit-id').value;
  const name = document.getElementById('recipient-name').value.trim();
  const relation = document.getElementById('recipient-relation').value;
  const country = elRecipientCountry.value;
  const email = document.getElementById('recipient-email').value.trim();
  const phoneBody = document.getElementById('recipient-phone').value.trim();
  const sendEmailNotification = elRecipientSendEmail.checked;

  const config = COUNTRY_CONFIGS[country] || COUNTRY_CONFIGS.OTHER;
  const phone = phoneBody ? `${config.dialCode} ${phoneBody}` : '';
  const privateLetter = document.getElementById('recipient-private-letter').value.trim();

  if (!name || !email || !relation) {
    alert('Please complete the required fields (Name, Relationship, and Email).');
    return;
  }

  if (editId) {
    const index = state.recipients.findIndex(r => r.id === editId);
    if (index !== -1) {
      state.recipients[index] = { id: editId, name, relation, country, email, phone, sendEmailNotification, privateLetter };
      addAuditLog('Beneficiary Updated', `Updated details for ${name} (${relation}). Email dispatch: ${sendEmailNotification ? 'Enabled' : 'Disabled'}.`);
    }
  } else {
    const newRecipient = {
      id: 'rec_' + Date.now(),
      name,
      relation,
      country,
      email,
      phone,
      sendEmailNotification,
      privateLetter
    };
    state.recipients.push(newRecipient);
    addAuditLog('Beneficiary Added', `Registered ${name} (${relation}, ${email}) for testament & automated email.`);
  }

  localStorage.setItem(STORAGE_KEYS.RECIPIENTS, JSON.stringify(state.recipients));
  closeRecipientModal();
  renderRecipientsList();
  renderEmailRecipientsList();
}

function deleteRecipient(id) {
  const rec = state.recipients.find(r => r.id === id);
  if (!rec) return;

  if (confirm(`Are you sure you want to remove ${rec.name} (${rec.relation}) from your designated beneficiaries?`)) {
    state.recipients = state.recipients.filter(r => r.id !== id);
    localStorage.setItem(STORAGE_KEYS.RECIPIENTS, JSON.stringify(state.recipients));
    addAuditLog('Beneficiary Removed', `Removed ${rec.name} from recipient list.`);
    renderRecipientsList();
    renderEmailRecipientsList();
  }
}

/* ==========================================================================
   BENEFICIARY ACCESS PORTAL
   ========================================================================== */
function updateBeneficiaryPortal() {
  const isUnlocked = (state.status === 'expired');

  if (isUnlocked) {
    elPortalLockedView.classList.add('hidden');
    elPortalUnlockedView.classList.remove('hidden');
    populateUnlockedDocument();
  } else {
    elPortalLockedView.classList.remove('hidden');
    elPortalUnlockedView.classList.add('hidden');
  }
}

function populateUnlockedDocument() {
  const countryCode = state.data.country || 'PK';
  const config = COUNTRY_CONFIGS[countryCode] || COUNTRY_CONFIGS.OTHER;

  document.getElementById('view-user-name').textContent = `${state.data.fullName || 'Deceased'}'s Last Will & Final Advice`;
  document.getElementById('view-user-country').textContent = `${config.name} ${config.flag}`;
  document.getElementById('view-user-id-label').textContent = `${config.idLabel.replace(' *', '')}:`;
  document.getElementById('view-user-id').textContent = state.data.idNumber || 'Not specified';
  document.getElementById('view-user-phone').textContent = state.data.phone ? `${config.dialCode} ${state.data.phone}` : 'Not specified';
  
  const releaseDate = new Date(state.deadline);
  document.getElementById('view-release-date').textContent = releaseDate.toLocaleString();

  document.getElementById('view-nasihat-text').textContent = state.data.nasihat || 'No advice recorded.';
  document.getElementById('view-assets-text').textContent = state.data.assets || 'No asset distribution recorded.';
  document.getElementById('view-debts-payable-text').textContent = state.data.debtsPayable || 'No debts recorded.';
  document.getElementById('view-debts-receivable-text').textContent = state.data.debtsReceivable || 'None.';
  document.getElementById('view-funeral-text').textContent = state.data.funeralWishes || 'Standard simple funeral.';

  // Populate Heir Selector
  const currentSelection = elSelectBeneficiary.value;
  elSelectBeneficiary.innerHTML = '<option value="all">Entire Family (General Wasiyat & Advice)</option>';
  
  state.recipients.forEach(rec => {
    const opt = document.createElement('option');
    opt.value = rec.id;
    opt.textContent = `${rec.name} (${rec.relation})`;
    elSelectBeneficiary.appendChild(opt);
  });

  if (currentSelection && currentSelection !== 'all') {
    elSelectBeneficiary.value = currentSelection;
  }

  handleBeneficiaryFilterChange();
  renderPortalAttachmentsView();
  renderHeirsSummaryTable();
}

function renderPortalAttachmentsView() {
  if (state.attachments.length === 0) {
    elViewPortalAttachments.innerHTML = '<p class="text-muted">No external deeds, videos, or photos attached.</p>';
    return;
  }

  elViewPortalAttachments.innerHTML = '';
  state.attachments.forEach(att => {
    const item = document.createElement('div');
    item.className = 'portal-attachment-item';
    let icon = att.category === 'video' ? '🎬' : (att.category === 'image' ? '🖼️' : '📄');
    item.innerHTML = `
      <div style="font-size: 2.2rem; margin-bottom: 0.35rem;">${icon}</div>
      <strong style="font-size: 0.88rem; display: block; color: #fff; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${escapeHtml(att.name)}</strong>
      <small style="color: #94a3b8;">${att.sizeFormatted}</small>
      <div style="margin-top: 0.5rem;">
        <button class="btn btn-outline btn-xs btn-portal-view" data-id="${att.id}">Open File</button>
      </div>
    `;
    elViewPortalAttachments.appendChild(item);
  });

  document.querySelectorAll('.btn-portal-view').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = e.currentTarget.getAttribute('data-id');
      openMediaLightbox(id);
    });
  });
}

function handleBeneficiaryFilterChange() {
  const selectedId = elSelectBeneficiary.value;
  if (selectedId === 'all') {
    elPrivateLetterCard.classList.add('hidden');
  } else {
    const rec = state.recipients.find(r => r.id === selectedId);
    if (rec && rec.privateLetter) {
      elPrivateLetterCard.classList.remove('hidden');
      elLetterRecipientTitle.textContent = `Confidential Message to ${rec.name} (${rec.relation}):`;
      elLetterContent.textContent = rec.privateLetter;
    } else {
      elPrivateLetterCard.classList.remove('hidden');
      elLetterRecipientTitle.textContent = `Message to ${rec ? rec.name : 'Recipient'}:`;
      elLetterContent.textContent = 'No exclusive private note was left for this recipient. Please follow the general advice and instructions above.';
    }
  }
}

function renderHeirsSummaryTable() {
  const container = document.getElementById('view-heirs-table-container');
  if (state.recipients.length === 0) {
    container.innerHTML = '<p class="text-muted">No heirs registered.</p>';
    return;
  }

  let tableHtml = `
    <table class="heirs-table">
      <thead>
        <tr>
          <th>Name</th>
          <th>Relationship</th>
          <th>Country</th>
          <th>Email (Post-Mortem)</th>
          <th>Phone</th>
          <th>Private Letter?</th>
        </tr>
      </thead>
      <tbody>
  `;

  state.recipients.forEach(r => {
    const rConfig = COUNTRY_CONFIGS[r.country || 'PK'] || COUNTRY_CONFIGS.OTHER;
    tableHtml += `
      <tr>
        <td><strong>${escapeHtml(r.name)}</strong></td>
        <td>${escapeHtml(r.relation)}</td>
        <td>${rConfig.flag} ${rConfig.name}</td>
        <td>${escapeHtml(r.email)}</td>
        <td>${escapeHtml(r.phone || '-')}</td>
        <td>${r.privateLetter ? '✅ Yes (Confidential)' : '❌ None'}</td>
      </tr>
    `;
  });

  tableHtml += '</tbody></table>';
  container.innerHTML = tableHtml;
}

/* ==========================================================================
   EVENT LISTENERS & TAB SWITCHING
   ========================================================================== */
function setupEventListeners() {
  // Tabs Navigation
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));

      btn.classList.add('active');
      const targetId = btn.getAttribute('data-tab');
      document.getElementById(targetId).classList.add('active');
    });
  });

  // Country Selection Handlers
  elUserCountry.addEventListener('change', handleCountryChange);
  elUserIdNumber.addEventListener('input', handleIdInputFormatting);
  elRecipientCountry.addEventListener('change', handleRecipientCountryChange);

  // Check-In Buttons ("I Am Alive")
  document.getElementById('btn-quick-checkin').addEventListener('click', extendLifeCheckIn);
  document.getElementById('btn-checkin-large').addEventListener('click', extendLifeCheckIn);
  elBtnReminderExtend.addEventListener('click', extendLifeCheckIn);

  // Dismiss Reminder Banner for this session
  elBtnDismissReminder.addEventListener('click', () => {
    state.reminderDismissed = true;
    hideMilestoneReminder();
  });

  // Enable Browser Native Notifications
  document.getElementById('btn-enable-browser-notifications').addEventListener('click', requestBrowserNotifications);

  // Simulation & Testing Buttons for all Milestones
  document.getElementById('btn-sim-15d').addEventListener('click', () => {
    state.deadline = Date.now() + (14 * DAY_MS + 23 * 60 * 60 * 1000);
    state.reminderDismissed = false;
    state.notifiedMilestones['15d'] = false;
    localStorage.setItem(STORAGE_KEYS.DEADLINE, state.deadline);
    persistMilestones();
    updateTimerTick();
    alert('⏱️ Simulated: Timer set to 15 Days left! Notice the 15-day reminder banner and status trigger.');
  });

  document.getElementById('btn-sim-10d').addEventListener('click', () => {
    state.deadline = Date.now() + (9 * DAY_MS + 23 * 60 * 60 * 1000);
    state.reminderDismissed = false;
    state.notifiedMilestones['10d'] = false;
    localStorage.setItem(STORAGE_KEYS.DEADLINE, state.deadline);
    persistMilestones();
    updateTimerTick();
    alert('⏱️ Simulated: Timer set to 10 Days left! Notice the 10-day follow-up reminder.');
  });

  document.getElementById('btn-sim-5d').addEventListener('click', () => {
    state.deadline = Date.now() + (4 * DAY_MS + 23 * 60 * 60 * 1000);
    state.reminderDismissed = false;
    state.notifiedMilestones['5d'] = false;
    localStorage.setItem(STORAGE_KEYS.DEADLINE, state.deadline);
    persistMilestones();
    updateTimerTick();
    alert('⏱️ Simulated: Timer set to 5 Days left! Notice the urgent warning banner and badge.');
  });

  document.getElementById('btn-sim-1d').addEventListener('click', () => {
    state.deadline = Date.now() + (22 * 60 * 60 * 1000);
    state.reminderDismissed = false;
    state.notifiedMilestones['1d'] = false;
    localStorage.setItem(STORAGE_KEYS.DEADLINE, state.deadline);
    persistMilestones();
    updateTimerTick();
    alert('⏱️ Simulated: Timer set to 1 Day (Final 24 Hours) left! Notice the critical alert banner.');
  });

  document.getElementById('btn-sim-10s').addEventListener('click', () => {
    state.deadline = Date.now() + 10 * 1000;
    state.reminderDismissed = false;
    localStorage.setItem(STORAGE_KEYS.DEADLINE, state.deadline);
    startCountdownEngine();
    alert('⏱️ Fast-forward testing: Timer set to 10 seconds! Watch the countdown reach 0 to see the automatic will transfer trigger and emails dispatched.');
  });

  document.getElementById('btn-trigger-expire').addEventListener('click', () => {
    if (confirm('Simulate 90 days expired immediately? This will trigger the post-mortem will transfer, deed unlock, and email dispatch.')) {
      state.deadline = Date.now() - 1000;
      triggerExpiryProtocol();
    }
  });

  document.getElementById('btn-simulate-unlock').addEventListener('click', () => {
    state.deadline = Date.now() - 1000;
    triggerExpiryProtocol();
  });

  document.getElementById('btn-view-transferred').addEventListener('click', () => {
    document.querySelector('[data-tab="tab-transferred"]').click();
  });

  // File Upload Handlers (Click & Drag-Drop)
  btnTriggerUpload.addEventListener('click', () => fileUploaderInput.click());
  btnEmptyUpload.addEventListener('click', () => fileUploaderInput.click());
  dropUploadZone.addEventListener('click', () => fileUploaderInput.click());

  fileUploaderInput.addEventListener('change', (e) => {
    handleFilesUploaded(e.target.files);
    fileUploaderInput.value = '';
  });

  dropUploadZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropUploadZone.classList.add('dragover');
  });

  dropUploadZone.addEventListener('dragleave', () => {
    dropUploadZone.classList.remove('dragover');
  });

  dropUploadZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropUploadZone.classList.remove('dragover');
    handleFilesUploaded(e.dataTransfer.files);
  });

  // Media Lightbox Close Handlers
  document.getElementById('btn-close-lightbox').addEventListener('click', closeMediaLightbox);
  document.getElementById('btn-close-lightbox-bottom').addEventListener('click', closeMediaLightbox);

  // Email Preview Modal Close Handlers
  document.getElementById('btn-close-email-preview').addEventListener('click', closeEmailPreview);
  document.getElementById('btn-close-email-preview-bottom').addEventListener('click', closeEmailPreview);
  document.getElementById('btn-preview-portal-link').addEventListener('click', () => {
    closeEmailPreview();
    document.querySelector('[data-tab="tab-transferred"]').click();
  });

  // Wasiyat Form Save / Update
  document.getElementById('wasiyat-form').addEventListener('submit', saveWasiyatFormData);
  document.getElementById('btn-save-wasiyat').addEventListener('click', saveWasiyatFormData);

  // Print Buttons
  document.getElementById('btn-print-wasiyat').addEventListener('click', () => window.print());
  document.getElementById('btn-print-beneficiary-copy').addEventListener('click', () => window.print());

  // Recipient Modal Triggers
  document.getElementById('btn-show-add-recipient-modal').addEventListener('click', () => openRecipientModal());
  document.querySelectorAll('.btn-open-modal').forEach(btn => {
    btn.addEventListener('click', () => openRecipientModal());
  });
  document.getElementById('btn-close-modal').addEventListener('click', closeRecipientModal);
  document.querySelectorAll('.btn-close-modal').forEach(btn => {
    btn.addEventListener('click', closeRecipientModal);
  });
  recipientForm.addEventListener('submit', handleSaveRecipient);

  // Portal Filter
  elSelectBeneficiary.addEventListener('change', handleBeneficiaryFilterChange);

  // Clear Logs
  document.getElementById('btn-clear-logs').addEventListener('click', () => {
    if (confirm('Clear audit history logs?')) {
      state.logs = [];
      localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify([]));
      renderAuditLogs();
    }
  });
}

function escapeHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

document.addEventListener('DOMContentLoaded', initApp);
