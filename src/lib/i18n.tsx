import { useMemo } from 'react'

/**
 * Single-locale copy dictionary. The site reads as one voice with a light
 * bilingual accent (e.g. "Ask / 提问", "Ask Me Anything" + "匿名提问"), so the
 * old EN/ZH toggle was retired. Add strings here and read them with `t()`.
 */
const dict = {
  brand: 'Iridoporth',
  nav: {
    home: 'Home',
    raspiStatus: 'Raspi status',
    flightLog: 'Ask / 提问',
  },
  a11y: {
    primaryNav: 'Primary',
    brandHome: 'Iridoporth home',
    siteRoutes: 'Site routes',
    flightLogBoard: 'flight-log notes',
    adminLists: 'Admin lists',
    raspiTelemetry: 'Dashboard telemetry',
    raspiStatus: 'Dashboard status: {status}',
    composerDialog: 'Leave a question',
    closeComposer: 'Close',
    changePasswordDialog: 'Change password',
    closeChangePassword: 'Close',
    showPassword: 'Show password',
    hidePassword: 'Hide password',
  },
  home: {
    title: 'Iridoporth',
    subtitle: '舷窗',
    flightLogCta: 'Ask / 提问',
    signalCta: 'Signal',
    primaryNavAria: 'Primary navigation',
    raspiCardKicker: 'raspi-status',
    raspiCardTitle: 'Dashboard',
    flightLogCardKicker: 'flight-log',
    flightLogCardTitle: 'Ask Me Anything',
    flightLogCardSubtitle: '匿名提问',
    notebookTitle: 'Coming soon.',
    heroImageAlt:
      'A hand-journal tray-table scene with a capsule aircraft window above clouds.',
    journalFragmentsAlt: 'Hand-journal fragments for the dashboard and private notes.',
    stampStripAlt: 'Aircraft-window stamps and path labels.',
    signalPreview: {
      host: 'host',
      temp: 'temp',
      cpu: 'cpu',
      mem: 'mem',
      error: 'Signal missing. Backend preview: {message}',
      empty: 'The aircraft instrument has not reported a signal yet.',
      unavailable: 'The aircraft instrument is not available in this environment.',
    },
    flightLogPreview: {
      error: 'flight-log is empty. {message}',
      empty: 'Nothing has been left here yet.',
    },
  },
  flightLog: {
    kicker: 'flight-log',
    title: 'Ask Me Anything',
    subtitle: '匿名提问',
    description: 'Drop a question. I will reply when I can.',
    browseCta: 'Browse questions',
    composerPrompt: 'Leave your note / 写下你的问题…',
    composerTitle: 'Leave a note',
    composerSubtitle: '匿名提问',
    composerLabel: 'note',
    composerPlaceholder: 'Leave your words.',
    submitIdle: 'Leave note',
    submitSubmitting: 'Leaving',
    submitSent: 'Left',
    submitSuccess: 'Sent.',
    noNotes: 'No notes yet.',
    boardError: 'The cabin is quiet. {message}',
    likeError: 'Could not update your like.',
    deleteError: 'Could not delete this note.',
    deleteConfirm: 'Delete?',
    anonymous: 'anonymous',
    replyLabel: 'reply',
    likeLabel: 'Like this note',
    unlikeLabel: 'Unlike this note',
    confirmDeleteAria: 'Confirm delete',
    cancelDeleteAria: 'Cancel delete',
    deleteNoteAria: 'Delete your note',
    fabLabel: 'Ask / 提问',
    fabAria: 'Leave a question',
  },
  login: {
    kicker: 'admin',
    title: 'Sign in',
    emailLabel: 'email',
    passwordLabel: 'password',
    submitIdle: 'Sign in',
    submitSubmitting: 'Signing in',
    error: 'Could not sign in.',
    homeCta: 'Home',
  },
  password: {
    kicker: 'account',
    title: 'Change password',
    currentLabel: 'current password',
    newLabel: 'new password',
    confirmLabel: 'confirm new password',
    hint: '8–128 ASCII characters, no spaces.',
    submitIdle: 'Update password',
    submitSubmitting: 'Updating',
    cancelAction: 'Cancel',
    success: 'Password updated.',
    mismatch: 'New passwords do not match.',
    invalidNew: 'New password must be 8–128 ASCII characters with no spaces.',
  },
  admin: {
    kicker: 'admin',
    title: 'flight-log desk',
    homeCta: 'Home',
    changePasswordCta: 'Change password',
    passwordUpdated: 'Password updated.',
    tabs: {
      unreplied: 'Unreplied',
      active: 'Active',
      hidden: 'Hidden',
      deleted: 'Deleted',
    },
    replyLabel: 'reply',
    replyPlaceholder: 'Write a reply.',
    replyAction: 'Reply',
    hideAction: 'Hide',
    displayAction: 'Display',
    clearReplyAction: 'Clear reply',
    sendAction: 'Send',
    cancelAction: 'Cancel',
    actionFailed: '{label} failed.',
    forbidden: 'This account is not an admin.',
    boardError: 'The desk is quiet. {message}',
    emptyList: 'Nothing in this list.',
    noActions: 'No actions available.',
    clearReplyAria: 'Clear reply',
  },
  raspi: {
    kicker: 'raspi-status',
    title: 'Dashboard',
    subtitle: '仪表盘',
    homeCta: 'Home',
    status: {
      listening: 'listening',
      signalLost: 'signal lost',
      online: 'online',
      unavailable: 'unavailable',
    },
    metricLabels: {
      temperature: 'temperature',
      processor: 'processor',
      memory: 'memory',
    },
    loadingNote: 'Waiting for a signal.',
    errorNote: 'Backend preview: {message}',
    unavailableNote: 'This environment is not reporting raspi telemetry.',
    lastSignal: 'Last signal {time}',
  },
  errors: {
    unauthenticated: 'Wrong email or password.',
    forbidden: "You don't have permission to do that.",
    invalid_request: "That didn't look right.",
    invalid_flight_log_entry_id: 'That note could not be found.',
    flight_log_not_found: 'This note is gone.',
    not_found: 'Could not find that.',
    user_not_found: 'Could not find that account.',
    internal_error: 'Something went wrong on the server.',
    generic: 'Something went wrong.',
  },
  meta: {
    pending: 'pending',
  },
}

function getPathValue(path: string): string | undefined {
  const parts = path.split('.')
  let value: unknown = dict
  for (const part of parts) {
    if (value == null || typeof value !== 'object') return undefined
    value = (value as Record<string, unknown>)[part]
  }
  if (typeof value === 'string') return value
  return undefined
}

export function t(key: string, params?: Record<string, string | number>): string {
  const raw = getPathValue(key)
  let text = typeof raw === 'string' ? raw : key
  if (params) {
    text = text.replace(/\{(\w+)\}/g, (_, name) =>
      Object.prototype.hasOwnProperty.call(params, name)
        ? String(params[name])
        : `{${name}}`,
    )
  }
  return text
}

export function useTranslation() {
  return { t }
}

export function useDateFormatter(options: Intl.DateTimeFormatOptions) {
  return useMemo(() => new Intl.DateTimeFormat('en', options), [options])
}

export function formatTimestamp(
  seconds: number,
  formatter: Intl.DateTimeFormat,
): string {
  if (seconds <= 0) return ''
  return formatter.format(new Date(seconds * 1000))
}
