/* eslint-disable react-refresh/only-export-components -- i18n context provider + hooks coexist by design */
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

export type Locale = 'en' | 'zh'

const STORAGE_KEY = 'iridoporth-locale'

const en = {
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
    scrollHint: 'Scroll down',
    flightLogBoard: 'flight-log notes',
    adminLists: 'Admin lists',
    raspiTelemetry: 'Raspi telemetry',
    raspiStatus: 'Raspi status: {status}',
  },
  home: {
    title: 'Iridoporth',
    flightLogCta: 'Ask / 提问',
    signalCta: 'Signal',
    primaryNavAria: 'Primary navigation',
    raspiCardKicker: 'raspi-status',
    raspiCardTitle: 'Onboard pulse',
    flightLogCardKicker: 'flight-log',
    flightLogCardTitle: 'Ask Me Anything',
    flightLogCardSubtitle: '匿名提问',
    notebookTitle: 'Coming soon.',
    heroImageAlt:
      'A hand-journal tray-table scene with a capsule aircraft window above clouds.',
    journalFragmentsAlt: 'Hand-journal fragments for the onboard pulse and private notes.',
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
  admin: {
    kicker: 'admin',
    title: 'flight-log desk',
    homeCta: 'Home',
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
    title: 'Onboard pulse',
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
    loadingNote: 'Waiting for the onboard pulse.',
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

const zh: typeof en = {
  brand: 'Iridoporth',
  nav: {
    home: '首页',
    raspiStatus: '树莓派状态',
    flightLog: '提问 / Ask',
  },
  a11y: {
    primaryNav: '主导航',
    brandHome: 'Iridoporth 首页',
    siteRoutes: '站点入口',
    scrollHint: '向下滚动',
    flightLogBoard: 'flight-log 留言',
    adminLists: '管理员列表',
    raspiTelemetry: '树莓派遥测',
    raspiStatus: '树莓派状态：{status}',
  },
  home: {
    title: 'Iridoporth',
    flightLogCta: '提问 / Ask',
    signalCta: '信号',
    primaryNavAria: '主导航',
    raspiCardKicker: 'raspi-status',
    raspiCardTitle: '机上脉搏',
    flightLogCardKicker: 'flight-log',
    flightLogCardTitle: '匿名提问',
    flightLogCardSubtitle: 'Ask Me Anything',
    notebookTitle: '即将推出。',
    heroImageAlt: '一个带胶囊舷窗的托盘桌手账场景，窗外是云层。',
    journalFragmentsAlt: '机上脉搏与私人笔记的手账碎片。',
    stampStripAlt: '舷窗邮票与航线标签。',
    signalPreview: {
      host: '主机',
      temp: '温度',
      cpu: 'CPU',
      mem: '内存',
      error: '信号缺失。后端预览：{message}',
      empty: '机上仪表尚未上报信号。',
      unavailable: '当前环境中机上仪表不可用。',
    },
    flightLogPreview: {
      error: 'flight-log 暂无内容。{message}',
      empty: '这里还没有人留言。',
    },
  },
  flightLog: {
    kicker: 'flight-log',
    title: '匿名提问',
    subtitle: 'Ask Me Anything',
    description: '留下你的问题，我会不定期回复。',
    browseCta: '看看大家问了什么',
    composerPrompt: '写下你的问题 / Leave your note…',
    composerLabel: '留言',
    composerPlaceholder: '写下你想问的问题…',
    submitIdle: '提交留言',
    submitSubmitting: '提交中',
    submitSent: '已提交',
    submitSuccess: '已发送。',
    noNotes: '还没有留言。',
    boardError: '客舱很安静。{message}',
    likeError: '点赞失败。',
    deleteError: '删除留言失败。',
    deleteConfirm: '删除？',
    anonymous: '匿名',
    replyLabel: '回复',
    likeLabel: '点赞',
    unlikeLabel: '取消点赞',
    confirmDeleteAria: '确认删除',
    cancelDeleteAria: '取消删除',
    deleteNoteAria: '删除你的留言',
    fabLabel: '提问 / Ask',
    fabAria: '留下一个问题',
  },
  login: {
    kicker: 'admin',
    title: '登录',
    emailLabel: '邮箱',
    passwordLabel: '密码',
    submitIdle: '登录',
    submitSubmitting: '登录中',
    error: '无法登录。',
    homeCta: '首页',
  },
  admin: {
    kicker: 'admin',
    title: 'flight-log 工作台',
    homeCta: '首页',
    tabs: {
      unreplied: '待回复',
      active: '已上线',
      hidden: '已隐藏',
      deleted: '已删除',
    },
    replyLabel: '回复',
    replyPlaceholder: '写一条回复。',
    replyAction: '回复',
    hideAction: '隐藏',
    displayAction: '显示',
    clearReplyAction: '清除回复',
    sendAction: '发送',
    cancelAction: '取消',
    actionFailed: '{label}失败。',
    forbidden: '此账户不是管理员。',
    boardError: '工作台很安静。{message}',
    emptyList: '这个列表为空。',
    noActions: '无可用操作。',
    clearReplyAria: '清除回复',
  },
  raspi: {
    kicker: 'raspi-status',
    title: '机上脉搏',
    homeCta: '首页',
    status: {
      listening: '监听中',
      signalLost: '信号丢失',
      online: '在线',
      unavailable: '不可用',
    },
    metricLabels: {
      temperature: '温度',
      processor: '处理器',
      memory: '内存',
    },
    loadingNote: '等待机上脉搏。',
    errorNote: '后端预览：{message}',
    unavailableNote: '当前环境未上报树莓派遥测数据。',
    lastSignal: '上次信号 {time}',
  },
  errors: {
    unauthenticated: '邮箱或密码错误。',
    forbidden: '你没有权限执行此操作。',
    invalid_request: '请求格式不正确。',
    invalid_flight_log_entry_id: '找不到这条留言。',
    flight_log_not_found: '这条留言已消失。',
    not_found: '找不到该内容。',
    user_not_found: '找不到该账户。',
    internal_error: '服务器出了点问题。',
    generic: '出了点问题。',
  },
  meta: {
    pending: '待定',
  },
}

const dictionaries = { en, zh }

function getStoredLocale(): Locale {
  if (typeof window === 'undefined') return 'en'
  const stored = window.localStorage.getItem(STORAGE_KEY)
  return stored === 'zh' ? 'zh' : 'en'
}

function setStoredLocale(locale: Locale) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(STORAGE_KEY, locale)
}

function getPathValue(dict: typeof en, path: string): string | undefined {
  const parts = path.split('.')
  let value: unknown = dict
  for (const part of parts) {
    if (value == null || typeof value !== 'object') return undefined
    value = (value as Record<string, unknown>)[part]
  }
  if (typeof value === 'string') return value
  return undefined
}

export function t(
  locale: Locale,
  key: string,
  params?: Record<string, string | number>,
): string {
  const raw = getPathValue(dictionaries[locale], key)
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

type LocaleContextValue = {
  locale: Locale
  setLocale: (locale: Locale) => void
}

const LocaleContext = createContext<LocaleContextValue>({
  locale: 'en',
  setLocale: () => {},
})

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => getStoredLocale())
  const setLocale = useCallback((next: Locale) => {
    setStoredLocale(next)
    setLocaleState(next)
  }, [])
  const value = useMemo(
    () => ({ locale, setLocale }),
    [locale, setLocale],
  )
  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
}

export function useLocale() {
  return useContext(LocaleContext)
}

export function useTranslation() {
  const { locale, setLocale } = useLocale()
  const boundT = useCallback(
    (key: string, params?: Record<string, string | number>) => t(locale, key, params),
    [locale],
  )
  return { t: boundT, locale, setLocale }
}

export function useDateFormatter(options: Intl.DateTimeFormatOptions) {
  const { locale } = useLocale()
  return useMemo(() => new Intl.DateTimeFormat(locale, options), [locale, options])
}

export function formatTimestamp(
  seconds: number,
  formatter: Intl.DateTimeFormat,
): string {
  if (seconds <= 0) return ''
  return formatter.format(new Date(seconds * 1000))
}
