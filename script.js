/**
 * Amanat - Digital Will & 90-Day Dead Man's Switch
 * Features:
 * - 90-Day Countdown Engine & Extension
 * - 15-Day, 10-Day, 5-Day, 1-Day Automated Checkpoint Reminders
 * - Country-Adaptive Dynamic ID (CNIC/SSN/Aadhaar/Emirates ID/Iqama) & Phone Format
 * - Post-Mortem Automated Email Dispatch Roster with Interactive Email Preview
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
  LOGS: 'amanat_audit_logs',
  NOTIFIED_MILESTONES: 'amanat_notified_milestones',
  EMAILS_DISPATCHED: 'amanat_emails_dispatched'
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

// App State
let state = {
  deadline: null,
  status: 'active',
  data: {},
  recipients: [],
  logs: [],
  notifiedMilestones: {},
  emailsDispatched: false,
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
const elRecipientsList = document.getElementById('recipients-list-container');
const elNoRecipientsState = document.getElementById('no-recipients-state');
const elEmailRecipientsContainer = document.getElementById('email-recipients-container');
const elNoEmailRecipientsState = document.getElementById('no-email-recipients-state');
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
        details: 'Initial 90-day dead man switch activated. Automated email dispatch queue armed.',
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
    elSystemStatusText.textContent = 'Status: EMAILS DISPATCHED (Inactive)';
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

  // Log dispatch for each recipient
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
          <div><strong>Destination Email:</strong> <span style="color: #2563eb;">${escapeHtml(rec.email)}</span></div>
          <div><strong>Country:</strong> ${recCountry.flag} ${recCountry.name}</div>
        </div>
        <div class="email-preview-snippet">
          " ${escapeHtml(rec.privateLetter ? rec.privateLetter.substring(0, 80) : 'General Wasiyat & Advice')}... "
        </div>
      </div>
      <div class="email-card-footer">
        <button class="btn btn-outline btn-sm btn-preview-email" data-id="${rec.id}">
          👁️ Preview Email
        </button>
        <button class="btn btn-ghost btn-sm btn-toggle-email" data-id="${rec.id}" style="color: #64748b;">
          ⚙️ Change Settings
        </button>
      </div>
    `;
    elEmailRecipientsContainer.appendChild(card);
  });

  // Attach event handlers for email preview
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
  previewPrivateLetterBody.textContent = rec.privateLetter ? `"${rec.privateLetter}"` : `"Follow the shared advice and instructions documented in the family wasiyat."`;

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
   WASIYAT & ADVICE FORM HANDLING
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

  localStorage.setItem(STORAGE_KEYS.DATA, JSON.stringify(state.data));

  addAuditLog(
    'Wasiyat & Advice Updated',
    `Testament record updated by user (${state.data.fullName || 'Anonymous'}). Country: ${state.data.country}.`
  );

  const statusMsg = document.getElementById('save-status-msg');
  statusMsg.textContent = '✓ Saved successfully!';
  setTimeout(() => {
    statusMsg.textContent = '';
  }, 3000);

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
          <div>📧 ${escapeHtml(rec.email)} ${rec.sendEmailNotification !== false ? '<span style="color:#059669; font-weight:700;">(Email Armed)</span>' : '<span style="color:#94a3b8;">(Email Disabled)</span>'}</div>
          ${rec.phone ? `<div>📱 ${escapeHtml(rec.phone)}</div>` : ''}
        </div>
        ${rec.privateLetter ? `
          <div class="recipient-private-preview">
            " ${escapeHtml(rec.privateLetter.substring(0, 85))}${rec.privateLetter.length > 85 ? '...' : ''} "
          </div>
        ` : ''}
      </div>
      <div class="recipient-actions">
        <button class="btn btn-outline btn-sm btn-edit-recipient" data-id="${rec.id}">✏️ Edit</button>
        <button class="btn btn-ghost btn-danger-ghost btn-sm btn-delete-recipient" data-id="${rec.id}" style="color: #ef4444;">🗑️ Remove</button>
      </div>
    `;
    elRecipientsList.appendChild(card);
  });

  // Attach handlers
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
  renderHeirsSummaryTable();
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
    if (confirm('Simulate 90 days expired immediately? This will trigger the post-mortem will transfer and email dispatch.')) {
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

  // Email Preview Modal Close
  document.getElementById('btn-close-email-preview').addEventListener('click', closeEmailPreview);
  document.getElementById('btn-close-email-preview-bottom').addEventListener('click', closeEmailPreview);
  document.getElementById('btn-preview-portal-link').addEventListener('click', () => {
    closeEmailPreview();
    document.querySelector('[data-tab="tab-transferred"]').click();
  });

  // Wasiyat Form Save
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
