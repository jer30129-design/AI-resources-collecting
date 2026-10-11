import { useEffect, useLayoutEffect, useMemo, useRef, useState, type FormEvent, type KeyboardEvent as ReactKeyboardEvent, type ReactNode } from 'react'
import { Link, NavLink, Route, Routes, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import {
  Activity, ArrowDown, ArrowLeft, ArrowRight, Check, ChevronDown, Clock3, Copy,
  FileText, Filter, Heart, Home, Menu, MessageSquareText, Search, Send, Share2, Sparkles,
  X, Zap,
} from 'lucide-react'
import { briefTopics, briefs, modules, resourceTypes, resources, type Brief, type ModuleId, type Resource } from './data'

type Visit = { id: string; at: string }
type Submission = {
  title: string; note: string; at: string; module?: ModuleId; type?: string; url?: string
  description?: string; tags?: string; useCase?: string; author?: string
}
type Feedback = { id: string; text: string; at: string }
type ToastState = { message: string; kind?: 'success' | 'error' | 'info'; action?: { label: string; run: () => void } } | null
type MotionMode = 'lively' | 'static' | 'reduced'
const readStore = <T,>(key: string, fallback: T): T => {
  try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) as T : fallback } catch { return fallback }
}
const readProfile = (key: string, fallback: string) => {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return fallback
    try { const value: unknown = JSON.parse(raw); return typeof value === 'string' ? value : fallback } catch { return raw }
  } catch { return fallback }
}
const getInitialMotion = (): MotionMode => {
  const saved = readStore<MotionMode | null>('hub-motion', null)
  if (saved === 'lively' || saved === 'static' || saved === 'reduced') return saved
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ? 'reduced' : 'lively'
}

export default function App() {
  const [favorites, setFavorites] = useState<string[]>(() => readStore('hub-favorites', []))
  const [history, setHistory] = useState<Visit[]>(() => readStore('hub-history', []))
  const [followed, setFollowed] = useState<string[]>(() => readStore('hub-followed', ['科研进展', 'AI 工具']))
  const [submissions, setSubmissions] = useState<Submission[]>(() => readStore('hub-submissions', []))
  const [feedback, setFeedback] = useState<Feedback[]>(() => readStore('hub-feedback', []))
  const [motion, setMotion] = useState<MotionMode>(getInitialMotion)
  const [toast, setToast] = useState<ToastState>(null)
  const [modal, setModal] = useState<'submit' | 'feedback' | null>(null)
  const [feedbackResource, setFeedbackResource] = useState('')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const submittingRef = useRef(false)
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const modalTrigger = useRef<HTMLElement | null>(null)
  const dialogRef = useRef<HTMLElement | null>(null)
  const submitTimer = useRef<number | null>(null)
  submittingRef.current = submitting
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    try {
      localStorage.setItem('hub-favorites', JSON.stringify(favorites))
      localStorage.setItem('hub-history', JSON.stringify(history))
      localStorage.setItem('hub-followed', JSON.stringify(followed))
      localStorage.setItem('hub-submissions', JSON.stringify(submissions))
      localStorage.setItem('hub-feedback', JSON.stringify(feedback))
      localStorage.setItem('hub-motion', JSON.stringify(motion))
      document.documentElement.dataset.motion = motion
    } catch {
      setToast({ message: '本地保存失败，请检查浏览器存储空间或隐私设置。', kind: 'error' })
    }
  }, [favorites, history, followed, submissions, feedback, motion])
  useEffect(() => {
    if (!toast) return
    const timer = window.setTimeout(() => setToast(null), toast.action ? 6500 : 3200)
    return () => window.clearTimeout(timer)
  }, [toast])
  useEffect(() => {
    const handleShortcut = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        navigate('/search')
      }
    }
    window.addEventListener('keydown', handleShortcut)
    return () => window.removeEventListener('keydown', handleShortcut)
  }, [navigate])
  useEffect(() => {
    if (!modal) {
      modalTrigger.current?.focus()
      modalTrigger.current = null
      return
    }
    const firstFocusable = dialogRef.current?.querySelector<HTMLElement>('input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), a[href]')
    firstFocusable?.focus()
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !submittingRef.current) { event.preventDefault(); setModal(null) }
      if (event.key === 'Tab' && dialogRef.current) {
        const focusable = [...dialogRef.current.querySelectorAll<HTMLElement>('input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), a[href]')]
        if (!focusable.length) return
        const first = focusable[0]
        const last = focusable[focusable.length - 1]
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus() }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
      }
    }
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', closeOnEscape)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', closeOnEscape)
    }
  }, [modal])
  useEffect(() => () => { if (submitTimer.current !== null) window.clearTimeout(submitTimer.current) }, [])
  useEffect(() => {
    const updateVisibility = () => document.documentElement.classList.toggle('page-hidden', document.visibilityState === 'hidden')
    document.addEventListener('visibilitychange', updateVisibility)
    updateVisibility()
    return () => document.removeEventListener('visibilitychange', updateVisibility)
  }, [])
  useEffect(() => { setSidebarOpen(false) }, [location.pathname])

  const toggleFavorite = (id: string) => {
    const removing = favorites.includes(id)
    const next = removing ? favorites.filter((item) => item !== id) : [id, ...favorites]
    try {
      localStorage.setItem('hub-favorites', JSON.stringify(next))
      setFavorites(next)
      setToast({ message: removing ? '已取消收藏' : '已加入收藏', kind: 'success' })
    } catch { setToast({ message: '收藏未完成，请稍后再试。', kind: 'error' }) }
  }
  const visit = (id: string) => setHistory((items) => [{ id, at: new Date().toISOString() }, ...items.filter((item) => item.id !== id)].slice(0, 100))
  const toggleFollow = (topic: string) => setFollowed((items) => items.includes(topic) ? items.filter((item) => item !== topic) : [...items, topic])

  const openDialog = (kind: 'submit' | 'feedback', trigger?: HTMLElement | null) => {
    modalTrigger.current = trigger ?? (document.activeElement instanceof HTMLElement ? document.activeElement : null)
    setFormErrors({})
    setSubmitting(false)
    setModal(kind)
  }
  const openSubmit = () => openDialog('submit')
  const openFeedback = (id: string) => { setFeedbackResource(id); openDialog('feedback') }
  const submitForm = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = event.currentTarget
    const data = new FormData(form)
    if (modal === 'submit') {
      const url = String(data.get('url') ?? '').trim()
      const errors: Record<string, string> = {}
      try {
        const parsed = new URL(url)
        if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error('invalid protocol')
      } catch { errors.url = '请输入有效的 http 或 https 链接。' }
      for (const field of ['title', 'description', 'useCase', 'author']) {
        if (!String(data.get(field) ?? '').trim()) errors[field] = '请填写这一项。'
      }
      setFormErrors(errors)
      if (Object.keys(errors).length) {
        dialogRef.current?.querySelector<HTMLElement>(`[name="${Object.keys(errors)[0]}"]`)?.focus()
        return
      }
      setSubmitting(true)
      submitTimer.current = window.setTimeout(() => {
        const submission: Submission = {
          title: String(data.get('title')).trim(), module: String(data.get('module')) as ModuleId,
          type: String(data.get('type')), url, description: String(data.get('description')).trim(),
          note: String(data.get('description')).trim(), tags: String(data.get('tags')).trim(),
          useCase: String(data.get('useCase')).trim(), author: String(data.get('author')).trim(),
          at: new Date().toISOString(),
        }
        try {
          const savedSubmissions = readStore<Submission[]>('hub-submissions', [])
          localStorage.setItem('hub-submissions', JSON.stringify([submission, ...savedSubmissions]))
        } catch {
          setSubmitting(false)
          setFormErrors({ storage: '本地保存失败，请清理浏览器空间或检查隐私设置后重试。' })
          submitTimer.current = null
          return
        }
        setSubmissions((items) => [submission, ...items])
        setSubmitting(false)
        setModal(null)
        setToast({ message: '资源提交成功，已保存在本地', kind: 'success' })
        submitTimer.current = null
      }, 450)
    } else {
      const item = { id: feedbackResource, text: String(data.get('note')).trim(), at: new Date().toISOString() }
      if (!item.text) {
        setFormErrors({ note: '请描述需要补充或修正的内容。' })
        dialogRef.current?.querySelector<HTMLElement>('#feedback-note')?.focus()
        return
      }
      try {
        localStorage.setItem('hub-feedback', JSON.stringify([item, ...readStore<Feedback[]>('hub-feedback', [])]))
        setFeedback((items) => [item, ...items])
        setModal(null)
        setToast({ message: '反馈已记录，感谢补充', kind: 'success' })
      } catch {
        setFormErrors({ storage: '反馈保存失败，请检查浏览器存储空间后重试。' })
      }
    }
  }
  const cycleMotion = () => setMotion((mode) => mode === 'lively' ? 'static' : mode === 'static' ? 'reduced' : 'lively')
  const shellProps = { favorites, history, followed, submissions, feedback, motion, setMotion, cycleMotion, toggleFavorite, visit, toggleFollow, setHistory, setToast, openSubmit, openFeedback }

  return (
    <div className="app-shell">
      <button className="mobile-menu icon-button" aria-label={sidebarOpen ? '关闭导航' : '打开导航'} onClick={() => setSidebarOpen(!sidebarOpen)}>
        {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
      </button>
      <aside className={`sidebar ${sidebarOpen ? 'sidebar-open' : ''}`}>
        <Link to="/" className="brand-lockup" aria-label="AI 资源站首页">
          <span className="brand-glyph"><Activity size={17} strokeWidth={2.2} /></span>
          <span><strong>AI 资源站</strong><small>AI RESOURCE HUB</small></span>
        </Link>
        <div className="nav-caption">探索</div>
        <nav aria-label="主导航" className="main-nav">
          <NavLink to="/" end className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}><Home size={17} />首页</NavLink>
          <NavLink to="/briefs" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}><FileText size={17} />每日简报</NavLink>
          <div className="nav-caption nav-module-label">资源模块</div>
          {modules.map((module) => <NavLink key={module.id} to={`/resources/${module.id}`} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}><span className={`nav-mark mark-${module.id}`}>{module.mark}</span>{module.name}</NavLink>)}
          <NavLink to="/search" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}><Search size={17} />全局搜索</NavLink>
        </nav>
        <div className="sidebar-bottom">
          <div className="signal-note"><span className="signal-dot" />本地演示模式 <span className="signal-state">已就绪</span></div>
          <NavLink to="/me" className="user-mini"><span className="avatar">林</span><span><strong>林知远</strong><small>个人工作台</small></span><ArrowRight size={15} /></NavLink>
          <button className="mode-switch" onClick={cycleMotion} aria-label={`当前${motionLabel(motion)}，点击切换显示模式`}>
            {motion === 'lively' ? <Sparkles size={16} /> : motion === 'static' ? <Zap size={16} /> : <Activity size={16} />}
            <span>{motionLabel(motion)}</span>
            <span className={`switch-track ${motion === 'lively' ? 'switch-on' : ''}`}><i /></span>
          </button>
        </div>
      </aside>
      {sidebarOpen && <button className="sidebar-scrim" aria-label="关闭导航" onClick={() => setSidebarOpen(false)} />}
      <div className="main-column">
        <header className="topbar">
          <div className="breadcrumbs"><span>AI 资源站</span><span className="crumb-slash">/</span><span>{routeLabel(location.pathname)}</span></div>
          <div className="top-actions">
            <button className="top-search" onClick={() => navigate('/search')} aria-label="打开全局搜索"><Search size={16} /><span>搜索资源、工具与灵感</span><kbd>⌘ K</kbd></button>
            <button className="button button-small button-outline submit-top" onClick={openSubmit}><Send size={15} />提交资源</button>
            <Link to="/me" className="top-avatar" aria-label="用户中心">林</Link>
          </div>
        </header>
        <main key={location.pathname} className="page-enter">
          <Routes>
            <Route path="/" element={<HomePage {...shellProps} />} />
            <Route path="/briefs" element={<BriefsPage />} />
            <Route path="/resources/:module" element={<ModulePage {...shellProps} />} />
            <Route path="/resource/:id" element={<DetailPage {...shellProps} />} />
            <Route path="/search" element={<SearchPage {...shellProps} />} />
            <Route path="/me" element={<MePage {...shellProps} />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
        <footer className="site-footer"><span>AI 资源站 / AI Resource Hub</span><span>让 AI 资源，进入真实工作。</span><button onClick={openSubmit}>分享一个好资源 <ArrowRight size={14} /></button></footer>
      </div>
      {toast && <Toast toast={toast} onClose={() => setToast(null)} />}
      {modal && <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (!submitting && event.target === event.currentTarget) setModal(null) }}>
        <section ref={dialogRef} className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title" tabIndex={-1}>
          <button className="modal-close icon-button" aria-label="关闭弹窗" disabled={submitting} onClick={() => setModal(null)}><X size={19} /></button>
          <div className="modal-icon">{modal === 'submit' ? <Send size={19} /> : <MessageSquareText size={19} />}</div>
          <h2 id="modal-title">{modal === 'submit' ? '提交一个资源' : '反馈资源问题'}</h2>
          <p>{modal === 'submit' ? '提交内容仅保存在当前浏览器，不会发布到线上。' : '告诉我们哪里需要补充或修正，反馈会保存在本地。'}</p>
          <form onSubmit={submitForm} noValidate aria-busy={submitting}>
            {formErrors.storage && <p className="form-storage-error" role="alert">{formErrors.storage}</p>}
            {modal === 'submit' ? <>
              <div className="form-grid">
                <label htmlFor="submission-title">资源名称 <span className="required-mark">必填</span><input id="submission-title" name="title" required maxLength={90} aria-invalid={!!formErrors.title} aria-describedby={formErrors.title ? 'error-title' : undefined} placeholder="例如：论文图表检查清单" onChange={() => setFormErrors((errors) => ({ ...errors, title: '' }))} />{formErrors.title && <small id="error-title" className="field-error">{formErrors.title}</small>}</label>
                <label htmlFor="submission-module">所属模块 <span className="required-mark">必填</span><select id="submission-module" name="module" defaultValue="research" required>{modules.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
                <label htmlFor="submission-type">资源类型 <span className="required-mark">必填</span><select id="submission-type" name="type" defaultValue="Prompt" required>{resourceTypes.map((item) => <option key={item}>{item}</option>)}</select></label>
                <label htmlFor="submission-url">资源链接 <span className="required-mark">必填</span><input id="submission-url" name="url" type="url" inputMode="url" autoComplete="url" required aria-invalid={!!formErrors.url} aria-describedby={formErrors.url ? 'error-url' : 'hint-url'} placeholder="https://…" onChange={() => setFormErrors((errors) => ({ ...errors, url: '' }))} />{formErrors.url ? <small id="error-url" className="field-error">{formErrors.url}</small> : <small id="hint-url" className="field-hint">请填写 http 或 https 开头的链接。</small>}</label>
                <label htmlFor="submission-description">资源描述 <span className="required-mark">必填</span><textarea id="submission-description" name="description" required rows={3} maxLength={400} aria-invalid={!!formErrors.description} aria-describedby={formErrors.description ? 'error-description' : undefined} placeholder="它可以解决什么问题？" onChange={() => setFormErrors((errors) => ({ ...errors, description: '' }))} />{formErrors.description && <small id="error-description" className="field-error">{formErrors.description}</small>}</label>
                <label htmlFor="submission-tags">主题 / 标签<input id="submission-tags" name="tags" maxLength={120} placeholder="文献检索、论文写作" /></label>
                <label htmlFor="submission-usecase">使用场景 <span className="required-mark">必填</span><textarea id="submission-usecase" name="useCase" required rows={2} maxLength={240} aria-invalid={!!formErrors.useCase} aria-describedby={formErrors.useCase ? 'error-usecase' : undefined} placeholder="适合在什么情况下使用？" onChange={() => setFormErrors((errors) => ({ ...errors, useCase: '' }))} />{formErrors.useCase && <small id="error-usecase" className="field-error">{formErrors.useCase}</small>}</label>
                <label htmlFor="submission-author">作者 / 联系方式 <span className="required-mark">必填</span><input id="submission-author" name="author" required maxLength={80} aria-invalid={!!formErrors.author} aria-describedby={formErrors.author ? 'error-author' : undefined} placeholder="署名或便于联系的方式" onChange={() => setFormErrors((errors) => ({ ...errors, author: '' }))} />{formErrors.author && <small id="error-author" className="field-error">{formErrors.author}</small>}</label>
              </div>
            </> : <label htmlFor="feedback-note">问题或建议 <span className="required-mark">必填</span><textarea id="feedback-note" name="note" required rows={4} maxLength={600} aria-invalid={!!formErrors.note} aria-describedby={formErrors.note ? 'error-note' : undefined} placeholder="描述你遇到的情况…" onChange={() => setFormErrors((errors) => ({ ...errors, note: '' }))} />{formErrors.note && <small id="error-note" className="field-error">{formErrors.note}</small>}</label>}
            <button className="button button-primary form-submit" type="submit" disabled={submitting}>{submitting ? <><span className="button-spinner" />正在保存…</> : modal === 'submit' ? <>提交资源 <Send size={15} /></> : <>提交反馈 <ArrowRight size={16} /></>}</button>
          </form>
        </section>
      </div>}
    </div>
  )
}

type SharedProps = {
  favorites: string[]; history: Visit[]; followed: string[]; submissions: Submission[]; feedback: Feedback[]
  motion: MotionMode; setMotion: (value: MotionMode | ((mode: MotionMode) => MotionMode)) => void; cycleMotion: () => void
  toggleFavorite: (id: string) => void; visit: (id: string) => void; toggleFollow: (topic: string) => void
  setHistory: (value: Visit[] | ((items: Visit[]) => Visit[])) => void
  setToast: (value: ToastState) => void; openSubmit: () => void; openFeedback: (id: string) => void
}

function motionLabel(mode: MotionMode) {
  return mode === 'lively' ? '灵动模式' : mode === 'static' ? '静态模式' : '减少动画'
}
function Toast({ toast, onClose }: { toast: Exclude<ToastState, null>; onClose: () => void }) {
  return <div role={toast.kind === 'error' ? 'alert' : 'status'} aria-live={toast.kind === 'error' ? 'assertive' : 'polite'} aria-atomic="true" className={`toast ${toast.kind ?? ''}`}>
    <span className="toast-icon" aria-hidden="true">{toast.kind === 'error' ? <X size={15} /> : toast.kind === 'info' ? <Activity size={15} /> : <Check size={15} />}</span>
    <span>{toast.message}</span>
    {toast.action && <button className="toast-action" onClick={() => toast.action?.run()}>{toast.action.label}</button>}
    <button className="toast-close" aria-label="关闭提示" onClick={onClose}><X size={15} /></button>
  </div>
}

function routeLabel(path: string) {
  if (path === '/') return '首页'
  if (path === '/briefs') return '每日 AI 简报'
  if (path === '/search') return '全局搜索'
  if (path === '/me') return '用户中心'
  if (path.startsWith('/resource/')) return '资源详情'
  if (path.startsWith('/resources/')) return modules.find((item) => item.id === path.split('/')[2])?.name ?? '资源浏览'
  return '探索'
}
function PageTitle({ eyebrow, title, subtitle, trailing }: { eyebrow?: string; title: string; subtitle?: string; trailing?: ReactNode }) {
  return <div className="page-title"><div>{eyebrow && <p className="eyebrow">{eyebrow}</p>}<h1>{title}</h1>{subtitle && <p className="page-subtitle">{subtitle}</p>}</div>{trailing}</div>
}
function SectionLabel({ children, aside }: { children: ReactNode; aside?: ReactNode }) {
  return <div className="section-label"><h2>{children}</h2>{aside && <span>{aside}</span>}</div>
}
function ModuleName({ id }: { id: ModuleId }) { return <>{modules.find((item) => item.id === id)?.name}</> }
function ResourceTypeTag({ type }: { type: string }) { return <span className={`type-tag type-${typeClass(type)}`}>{type}</span> }
function typeClass(type: string) { return type === 'Skill / 插件' ? 'skill' : type === 'AI 工具' ? 'tool' : type === '软件教程' ? 'guide' : type === 'PPT / Excel / Word 模板' ? 'template' : type === '数据处理工具' ? 'data' : type === '开源项目' ? 'open' : type === '使用案例' ? 'case' : 'prompt' }

function ChoiceBar({ items, value, onChange, label, className, asTabs = false, panelId }: {
  items: string[]; value: string; onChange: (value: string) => void; label: string
  className?: string; asTabs?: boolean; panelId?: string
}) {
  const barRef = useRef<HTMLDivElement>(null)
  const [indicator, setIndicator] = useState({ x: 0, width: 0 })
  const baseId = `choice-${label.replace(/[^\p{L}\p{N}]+/gu, '-')}`
  useLayoutEffect(() => {
    const bar = barRef.current
    if (!bar) return
    const update = () => {
      const active = bar.querySelector<HTMLElement>('[data-active="true"]')
      if (active) setIndicator({ x: active.offsetLeft, width: active.offsetWidth })
    }
    update()
    const observer = new ResizeObserver(update)
    observer.observe(bar)
    window.addEventListener('resize', update)
    return () => { observer.disconnect(); window.removeEventListener('resize', update) }
  }, [value, items.length])
  const handleKeys = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (!asTabs || !['ArrowRight', 'ArrowLeft', 'Home', 'End'].includes(event.key)) return
    event.preventDefault()
    const index = items.indexOf(value)
    const nextIndex = event.key === 'Home' ? 0 : event.key === 'End' ? items.length - 1
      : (index + (event.key === 'ArrowRight' ? 1 : items.length - 1)) % items.length
    onChange(items[nextIndex])
    requestAnimationFrame(() => barRef.current?.querySelectorAll<HTMLButtonElement>('button')[nextIndex]?.focus())
  }
  return <div ref={barRef} className={`choice-bar ${className ?? ''}`} role={asTabs ? 'tablist' : 'group'} aria-label={label} onKeyDown={handleKeys}>
    <span className="choice-indicator" aria-hidden="true" style={{ width: indicator.width, transform: `translateX(${indicator.x}px)` }} />
    {items.map((item) => {
      const active = value === item
      return <button type="button" key={item} id={`${baseId}-${items.indexOf(item)}`} data-active={active} className={active ? 'active' : ''} onClick={() => onChange(item)}
        role={asTabs ? 'tab' : undefined} aria-selected={asTabs ? active : undefined} aria-pressed={!asTabs ? active : undefined}
        aria-controls={asTabs ? panelId : undefined} tabIndex={asTabs && !active ? -1 : 0}>{item}</button>
    })}
  </div>
}

function HomePage(props: SharedProps) {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  return <div className="home-page">
    <section className={`home-hero ${props.motion !== 'lively' ? 'hero-static' : ''}`}>
      <div className="hero-signal" aria-hidden="true"><div className="signal-grid" /><div className="signal-orbit orbit-one" /><div className="signal-orbit orbit-two" /><div className="signal-core"><span /><span /><span /></div><div className="signal-lines" /><div className="signal-readout readout-a">FIELD / 04 <i>ACTIVE</i></div><div className="signal-readout readout-b">SYNTHESIS&nbsp; 98.4</div><div className="signal-label">编辑部 · 信号场</div></div>
      <Link to="/briefs" className="brief-entry"><span className="brief-live"><i />今日简报</span><span>AI 动态已更新 <ArrowRight size={15} /></span></Link>
      <div className="hero-copy">
        <div className="wordmark"><span className="wordmark-glyph"><Activity size={20} /></span><span>AI 资源站<small>AI RESOURCE HUB</small></span></div>
        <h1>让 AI 资源，<br />进入真实工作。</h1>
        <p>从最新动态到可直接复用的工具与方法，<br className="desktop-break" />为科研、办公、开发与创作，整理值得用的 AI 资源。</p>
        <form className="hero-search" onSubmit={(event) => { event.preventDefault(); navigate(`/search?q=${encodeURIComponent(query)}`) }}>
          <Search size={19} /><input aria-label="搜索资源、Prompt 或工具" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索资源、Prompt 或工具" /><button className="button button-primary" type="submit">开始搜索 <ArrowRight size={16} /></button>
        </form>
        <button className="hero-browse" onClick={() => navigate('/resources/research')}>浏览全部资源 <span>48 条精选内容</span></button>
      </div>
      <div className="hero-bottom"><span><span className="status-point" />为真实工作而整理</span><span>CURATED FOR THE WAY YOU WORK</span></div>
    </section>
    <section className="module-entry-section">
      <div className="module-section-heading"><div><p className="eyebrow">四个方向，一处开始</p><h2>你正在做什么？</h2></div><span>01 — 04</span></div>
      <div className="module-entry-grid">{modules.map((module, index) => <Link key={module.id} to={`/resources/${module.id}`} className={`module-entry module-${module.id}`}>
        <span className="module-entry-top"><span className="module-symbol">{module.mark}</span><span>0{index + 1}</span></span>
        <strong>{module.name}</strong><p>{module.description}</p><span className="module-entry-bottom"><span>{module.count} 项资源</span><span className="module-open"><ArrowRight size={17} /></span></span>
      </Link>)}</div>
    </section>
    <section className="home-brief-strip"><span className="strip-icon"><FileText size={18} /></span><div><strong>每日 AI 简报</strong><p>精选行业动态、模型发布与值得关注的开源进展。</p></div><Link to="/briefs">查看今日简报 <ArrowRight size={16} /></Link></section>
    <section className="home-bottom-actions"><span>有一份好资源想分享？</span><button className="text-action" onClick={props.openSubmit}>提交资源 <ArrowRight size={15} /></button><button className="motion-action" onClick={props.cycleMotion}>当前：{motionLabel(props.motion)} · 切换 <Sparkles size={15} /></button></section>
  </div>
}

function ResourceRow({ resource, favorites, toggleFavorite, compact = false }: { resource: Resource; favorites: string[]; toggleFavorite: (id: string) => void; compact?: boolean }) {
  const saved = favorites.includes(resource.id)
  return <article className={`resource-row ${compact ? 'resource-compact' : ''}`}>
    <Link to={`/resource/${resource.id}`} className="resource-row-link" aria-label={`查看详情：${resource.title}`}>
      <div className="resource-row-main"><div className="resource-meta"><ResourceTypeTag type={resource.type} /><span>{resource.topic}</span>{resource.featured && <span className="featured-mark"><Sparkles size={12} />站长精选</span>}</div>
        <span className="resource-title">{resource.title}</span><p>{resource.description}</p>
        <div className="resource-tags">{resource.tags.map((tag) => <span key={tag}>{tag}</span>)}</div>
      </div>
      <div className="resource-row-link-side"><span className="resource-date">{formatDate(resource.published)}</span><span className="row-open" aria-hidden="true"><ArrowRight size={17} /></span></div>
    </Link>
    <button className={`save-button ${saved ? 'saved' : ''}`} onClick={() => toggleFavorite(resource.id)} aria-label={saved ? '取消收藏' : '收藏资源'} aria-pressed={saved}><Heart size={16} fill={saved ? 'currentColor' : 'none'} /><span>{resource.saves + (saved ? 1 : 0)}</span></button>
  </article>
}
function formatDate(value: string) { return new Intl.DateTimeFormat('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(value)) }

function ModulePage({ favorites, toggleFavorite }: SharedProps) {
  const { module: moduleParam } = useParams()
  const module = modules.find((item) => item.id === moduleParam)
  const [query, setQuery] = useState('')
  const [topic, setTopic] = useState('全部主题')
  const [type, setType] = useState('全部类型')
  const [sort, setSort] = useState('热门')
  const [page, setPage] = useState(1)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [smallScreen, setSmallScreen] = useState(() => window.matchMedia('(max-width: 620px)').matches)
  const filterTriggerRef = useRef<HTMLButtonElement>(null)
  const filterPanelRef = useRef<HTMLElement>(null)
  const perPage = 8
  const moduleResources = resources.filter((item) => item.module === module?.id)
  const topics = ['全部主题', ...Array.from(new Set(moduleResources.flatMap((item) => [item.topic, ...item.tags])))]
  const filtered = useMemo(() => moduleResources.filter((item) => {
    const searchText = `${item.title} ${item.description} ${item.content} ${item.topic} ${item.tags.join(' ')}`
    return searchText.toLowerCase().includes(query.toLowerCase()) && (topic === '全部主题' || item.topic === topic || item.tags.includes(topic)) &&
      (type === '全部类型' || item.type === type) && (sort !== '站长精选' || item.featured)
  }).sort((a, b) => sort === '最新' ? b.published.localeCompare(a.published) : b.saves - a.saves), [moduleResources, query, topic, type, sort])
  const visible = filtered.slice(0, page * perPage)
  useEffect(() => setPage(1), [query, topic, type, sort])
  useEffect(() => {
    const media = window.matchMedia('(max-width: 620px)')
    const update = () => setSmallScreen(media.matches)
    media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
  }, [])
  useEffect(() => {
    if (!filtersOpen || !smallScreen) return
    const previousOverflow = document.body.style.overflow
    const focusable = () => [...(filterPanelRef.current?.querySelectorAll<HTMLElement>('button:not([disabled]), input:not([disabled]), select:not([disabled])') ?? [])]
    focusable()[0]?.focus()
    const close = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { event.preventDefault(); setFiltersOpen(false); return }
      if (event.key === 'Tab') {
        const items = focusable()
        if (!items.length) return
        if (event.shiftKey && document.activeElement === items[0]) { event.preventDefault(); items[items.length - 1]?.focus() }
        else if (!event.shiftKey && document.activeElement === items[items.length - 1]) { event.preventDefault(); items[0].focus() }
      }
    }
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', close)
    return () => { document.body.style.overflow = previousOverflow; window.removeEventListener('keydown', close); filterTriggerRef.current?.focus() }
  }, [filtersOpen, smallScreen])
  if (!module) return <NotFound />
  const clearFilters = () => { setTopic('全部主题'); setType('全部类型'); setQuery(''); setFiltersOpen(false) }
  return <div className="content-page module-page">
    <div className="module-page-heading"><div><Link to="/" className="back-link"><ArrowLeft size={14} />回到首页</Link><p className="eyebrow">资源模块 / {module.english}</p><h1>{module.name}<span className="heading-period">.</span></h1><p className="page-subtitle">{module.description}</p></div><div className={`module-emblem emblem-${module.id}`}>{module.mark}<span>{module.english.toUpperCase()}</span></div></div>
    <div className="module-summary-line"><span><strong>{filtered.length}</strong> 项可用资源</span><span>持续整理 · 本地演示数据</span></div>
    <div className="resource-toolbar"><label className="filter-search"><Search size={17} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={`在${module.name}中搜索资源`} aria-label={`在${module.name}中搜索资源`} />{query && <button type="button" onClick={() => setQuery('')} aria-label="清除搜索"><X size={15} /></button>}</label><button ref={filterTriggerRef} className={`filter-toggle ${filtersOpen ? 'active' : ''}`} onClick={() => setFiltersOpen(!filtersOpen)} aria-expanded={filtersOpen} aria-controls="resource-filter-panel"><Filter size={16} />筛选{topic !== '全部主题' || type !== '全部类型' ? <i aria-label="已有筛选" /> : null}<ChevronDown size={15} /></button></div>
    {(query || topic !== '全部主题' || type !== '全部类型') && <div className="active-filters" aria-label="当前筛选条件">
      {query && <button onClick={() => setQuery('')}>关键词：{query}<X size={13} aria-hidden="true" /><span className="sr-only">清除关键词</span></button>}
      {type !== '全部类型' && <button onClick={() => setType('全部类型')}>类型：{type}<X size={13} aria-hidden="true" /><span className="sr-only">清除类型筛选</span></button>}
      {topic !== '全部主题' && <button onClick={() => setTopic('全部主题')}>主题：{topic}<X size={13} aria-hidden="true" /><span className="sr-only">清除主题筛选</span></button>}
      <button className="clear-all-filters" onClick={clearFilters}>清除筛选</button>
    </div>}
    {filtersOpen && <><button className="filter-scrim" aria-label="关闭筛选" onClick={() => setFiltersOpen(false)} /><section ref={filterPanelRef} id="resource-filter-panel" className="filter-panel" role={smallScreen ? 'dialog' : 'region'} aria-modal={smallScreen || undefined} aria-labelledby="filter-panel-title" tabIndex={smallScreen ? -1 : undefined}>
      <div className="filter-panel-head"><h2 id="filter-panel-title">筛选资源</h2><button className="icon-button filter-close" aria-label="关闭筛选" onClick={() => setFiltersOpen(false)}><X size={18} /></button></div>
      <div className="filter-group"><span>资源类型</span><div>{['全部类型', ...resourceTypes].map((item) => <button key={item} aria-pressed={type === item} className={type === item ? 'selected' : ''} onClick={() => setType(item)}>{item}</button>)}</div></div>
      <div className="filter-group"><span>主题 / 标签</span><div>{topics.map((item) => <button key={item} aria-pressed={topic === item} className={topic === item ? 'selected' : ''} onClick={() => setTopic(item)}>{item}</button>)}</div></div>
      <div className="filter-panel-actions"><button className="text-action" onClick={clearFilters}>清除筛选</button><button className="button button-primary button-small" onClick={() => setFiltersOpen(false)}>查看 {filtered.length} 项资源</button></div>
    </section></>}
    <div className="list-controls"><div className="result-count">找到 <strong>{filtered.length}</strong> 项资源</div><ChoiceBar items={['热门', '最新', '站长精选']} value={sort} onChange={setSort} label="资源排序" className="sort-tabs" /></div>
    {visible.length ? <div className="resource-list">{visible.map((resource) => <ResourceRow key={resource.id} resource={resource} favorites={favorites} toggleFavorite={toggleFavorite} />)}</div> : <EmptyState title="没有找到匹配资源" body="试试更短的关键词，或移除一项筛选条件。" action={clearFilters} actionText="清除筛选" />}
    {visible.length < filtered.length && <button className="load-more" onClick={() => setPage((value) => value + 1)}>继续浏览 <ArrowDown size={15} /></button>}
  </div>
}

function BriefsPage() {
  const [topic, setTopic] = useState('全部主题')
  const [query, setQuery] = useState('')
  const [date, setDate] = useState('全部日期')
  const dates = ['全部日期', ...Array.from(new Set(briefs.map((item) => item.date)))]
  const filtered = briefs.filter((item) => (topic === '全部主题' || item.topic === topic) &&
    (date === '全部日期' || item.date === date) &&
    `${item.title} ${item.summary} ${item.topic} ${item.source}`.toLowerCase().includes(query.toLowerCase()))
  const grouped = filtered.reduce<Record<string, Brief[]>>((acc, item) => { (acc[item.date] ??= []).push(item); return acc }, {})
  return <div className="content-page briefs-page">
    <PageTitle eyebrow="AI EDITORIAL / 每日更新" title="每日 AI 简报" subtitle="不追逐噪声，只整理值得理解的变化。按主题和日期，找到你关心的行业信号。" trailing={<span className="today-stamp"><span className="status-point" />更新于 2026.10.11</span>} />
    <div className="briefs-toolbar"><label className="filter-search"><Search size={17} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索简报关键词" aria-label="搜索简报关键词" /></label><label className="date-select"><Clock3 size={16} /><select value={date} onChange={(event) => setDate(event.target.value)} aria-label="按日期浏览">{dates.map((item) => <option key={item}>{item}</option>)}</select><ChevronDown size={15} /></label></div>
    <ChoiceBar items={['全部主题', ...briefTopics]} value={topic} onChange={setTopic} label="按主题筛选简报" className="topic-tabs" />
    {(query || topic !== '全部主题' || date !== '全部日期') && <div className="active-filters" aria-label="当前简报筛选条件">
      {query && <button onClick={() => setQuery('')}>关键词：{query}<X size={13} aria-hidden="true" /><span className="sr-only">清除关键词</span></button>}
      {topic !== '全部主题' && <button onClick={() => setTopic('全部主题')}>主题：{topic}<X size={13} aria-hidden="true" /><span className="sr-only">清除主题筛选</span></button>}
      {date !== '全部日期' && <button onClick={() => setDate('全部日期')}>日期：{date}<X size={13} aria-hidden="true" /><span className="sr-only">清除日期筛选</span></button>}
      <button className="clear-all-filters" onClick={() => { setQuery(''); setTopic('全部主题'); setDate('全部日期') }}>清除筛选</button>
    </div>}
    <div className="briefs-layout"><section className="brief-feed"><div className="feed-heading"><h2>{date === '全部日期' ? '往期简报' : date.split('-').join(' / ')}</h2><span>{filtered.length} 条内容</span></div>
      {Object.keys(grouped).length ? Object.entries(grouped).map(([day, items]) => <div className="brief-day-group" key={day}><div className="date-rail"><strong>{new Intl.DateTimeFormat('zh-CN', { month: 'long', day: 'numeric' }).format(new Date(`${day}T12:00:00`))}</strong><span>{day.slice(0, 4)}</span></div><div className="brief-day-items">{items.map((item) => <article className="brief-item" key={item.id}><div className="brief-item-head"><span className="brief-topic">{item.topic}</span><span>{item.source}</span></div><h3>{item.title}</h3><p>{item.summary}</p><div className="brief-item-bottom"><Link to={`/resource/${item.resourceId}`}>相关资源 <ArrowRight size={14} /></Link><span>{day}</span></div></article>)}</div></div>) : <EmptyState title="没有找到相关简报" body="调整日期、主题或关键词试试看。" action={() => { setQuery(''); setTopic('全部主题'); setDate('全部日期') }} actionText="查看全部" />}
    </section><aside className="briefs-aside"><div className="digest-card"><span className="digest-icon"><Activity size={17} /></span><h3>编辑部手记</h3><p>简报关注的是变化背后的实际影响。涉及研究结论与产品能力时，仍建议回到原始论文和官方资料核实。</p><span className="digest-rule" /><span className="digest-foot">编辑整理 · 持续更新</span></div><div className="topic-index"><h3>本期主题</h3>{briefTopics.slice(0, 6).map((item) => <button key={item} onClick={() => setTopic(item)}>{item}<span>{briefs.filter((brief) => brief.topic === item).length.toString().padStart(2, '0')}</span></button>)}</div></aside></div>
  </div>
}

function DetailPage(props: SharedProps) {
  const { id = '' } = useParams()
  const resource = resources.find((item) => item.id === id)
  const saved = props.favorites.includes(id)
  const [copied, setCopied] = useState(false)
  const [copyFailed, setCopyFailed] = useState(false)
  const copyTimer = useRef<number | null>(null)
  const manualCopyRef = useRef<HTMLTextAreaElement>(null)
  const related = resource ? resources.filter((item) => item.module === resource.module && item.id !== resource.id && (item.topic === resource.topic || item.tags.some((tag) => resource.tags.includes(tag)))).slice(0, 3) : []
  useEffect(() => { if (resource) props.visit(resource.id) }, [resource?.id])
  useEffect(() => () => { if (copyTimer.current !== null) window.clearTimeout(copyTimer.current) }, [])
  if (!resource) return <NotFound />
  const copy = async () => {
    try {
      if (!navigator.clipboard?.writeText) throw new Error('clipboard unavailable')
      await navigator.clipboard.writeText(resource.content)
      setCopied(true)
      setCopyFailed(false)
      props.setToast({ message: '已复制到剪贴板', kind: 'success' })
      if (copyTimer.current !== null) window.clearTimeout(copyTimer.current)
      copyTimer.current = window.setTimeout(() => setCopied(false), 1800)
    } catch {
      setCopyFailed(true)
      manualCopyRef.current?.focus()
      manualCopyRef.current?.select()
      props.setToast({ message: '无法访问剪贴板，内容已选中，请按 Ctrl+C 或 ⌘C 手动复制。', kind: 'error' })
    }
  }
  const share = async () => {
    try {
      const shareUrl = new URL(`/resource/${resource.id}`, window.location.origin).toString()
      if (navigator.share) {
        await navigator.share({ title: resource.title, text: resource.description, url: shareUrl })
        props.setToast({ message: '已完成分享', kind: 'success' })
      } else {
        if (!navigator.clipboard?.writeText) throw new Error('clipboard unavailable')
        await navigator.clipboard.writeText(shareUrl)
        props.setToast({ message: '浏览器不支持直接分享，分享链接已复制', kind: 'success' })
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') { props.setToast({ message: '已取消分享', kind: 'info' }); return }
      props.setToast({ message: '复制分享链接失败，请检查剪贴板权限，或手动复制地址栏链接。', kind: 'error' })
    }
  }
  return <div className="content-page detail-page">
    <Link to={`/resources/${resource.module}`} className="back-link"><ArrowLeft size={14} /><ModuleName id={resource.module} />资源</Link>
    <div className="detail-layout"><article className="detail-article"><div className="detail-meta"><ResourceTypeTag type={resource.type} /><span>{modules.find((item) => item.id === resource.module)?.name}</span>{resource.featured && <span className="featured-mark"><Sparkles size={12} />站长精选</span>}</div>
      <h1>{resource.title}</h1><p className="detail-deck">{resource.description}</p>
      <div className="detail-byline"><span className="avatar avatar-small">{resource.author.slice(0, 1)}</span><span>由 <strong>{resource.author}</strong> 整理</span><span>{formatDate(resource.published)}</span><span>已收藏 {resource.saves} 次</span></div>
      <div className="detail-tags">{resource.tags.map((tag) => <span key={tag}>{tag}</span>)}</div>
      <div className="detail-divider" />
      <section className="detail-section"><h2>关于这个资源</h2><p>{resource.description} 它面向真实工作流程设计，适合作为起点，根据你的资料和团队规范进一步调整。</p></section>
      <section className="detail-section"><h2>适用场景</h2><p>{resource.useCase} 尤其适合在任务边界明确、材料可核验的情况下使用。</p></section>
      <section className="detail-section"><h2>如何使用</h2><p>{resource.howTo}</p><ol className="use-steps"><li>准备原始材料，标注希望解决的问题和必要约束。</li><li>使用下方内容作为初稿，按任务实际情况补齐上下文。</li><li>核查重要结论与来源，并保存你最终采用的版本。</li></ol></section>
      <section className="example-section"><div className="example-heading"><h2>示例输入与输出</h2><span>使用参考</span></div><div className="example-block"><span>输入示例</span><p>{resource.input}</p></div><div className="example-block output-block"><span>输出示例</span><p>{resource.output}</p></div></section>
      <section className="prompt-block"><div className="prompt-head"><span>可复用内容</span><span>{resource.content.length} 字符</span></div><textarea ref={manualCopyRef} className={`prompt-content ${copyFailed ? 'copy-failed' : ''}`} aria-label="可复用资源内容，可手动选择并复制" readOnly rows={5} value={resource.content} onFocus={(event) => { if (copyFailed) event.currentTarget.select() }} />{copyFailed && <p className="copy-help">内容已选中，按 Ctrl+C 或 ⌘C 完成复制。</p>}<button className={`button ${copied ? 'button-success' : 'button-primary'}`} onClick={copy}>{copied ? <Check size={15} /> : <Copy size={15} />}{copied ? '已复制' : '复制内容'}</button></section>
      {related.length > 0 && <section className="related-section"><SectionLabel aside="继续探索">相关资源</SectionLabel><div className="related-list">{related.map((item) => <Link key={item.id} to={`/resource/${item.id}`} className="related-item"><span><ResourceTypeTag type={item.type} /><strong>{item.title}</strong></span><ArrowRight size={16} /></Link>)}</div></section>}
    </article>
    <aside className="detail-aside"><div className="detail-actions"><span className="aside-label">资源操作</span><button className={`button ${saved ? 'button-saved' : 'button-primary'} action-wide`} aria-pressed={saved} onClick={() => props.toggleFavorite(resource.id)}><Heart size={16} fill={saved ? 'currentColor' : 'none'} />{saved ? '取消收藏' : '收藏资源'}</button><button className="button button-outline action-wide" onClick={share}><Share2 size={16} />分享资源</button><button className="feedback-link" onClick={() => props.openFeedback(resource.id)}><MessageSquareText size={15} />反馈资源问题</button></div><div className="detail-aside-note"><span>使用提示</span><p>AI 生成内容可能存在遗漏。请结合原始资料核对事实、数据与引用。</p></div></aside></div>
  </div>
}

function SearchPage({ favorites, toggleFavorite }: SharedProps) {
  const [params, setParams] = useSearchParams()
  const query = params.get('q') ?? ''
  const moduleFilter = params.get('module') ?? '全部模块'
  const typeFilter = params.get('type') ?? '全部类型'
  const update = (key: string, value: string) => { const next = new URLSearchParams(params); value && value !== '全部模块' && value !== '全部类型' ? next.set(key, value) : next.delete(key); setParams(next) }
  const clearSearch = () => setParams({})
  const filtered = resources.filter((item) => `${item.title} ${item.description} ${item.content} ${item.author} ${item.tags.join(' ')} ${item.topic}`.toLowerCase().includes(query.toLowerCase()) &&
    (moduleFilter === '全部模块' || item.module === moduleFilter) && (typeFilter === '全部类型' || item.type === typeFilter))
    .sort((a, b) => b.saves - a.saves)
  return <div className="content-page search-page"><PageTitle eyebrow="RESOURCE INDEX / 全站检索" title="找到你需要的资源" subtitle="搜索 Prompt、工具、教程和可复用的工作方法。" />
    <label className="global-search-field"><Search size={21} /><input autoFocus value={query} onChange={(event) => update('q', event.target.value)} placeholder="试试「文献综述」「会议纪要」或「React」" aria-label="搜索全部资源" />{query && <button aria-label="清除搜索" onClick={() => update('q', '')}><X size={17} /></button>}<kbd>⌕</kbd></label>
    <div className="search-filter-row"><div className="search-selects"><label>资源模块<select value={moduleFilter} onChange={(event) => update('module', event.target.value)}><option>全部模块</option>{modules.map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}</select><ChevronDown size={14} /></label><label>资源类型<select value={typeFilter} onChange={(event) => update('type', event.target.value)}><option>全部类型</option>{resourceTypes.map((item) => <option key={item}>{item}</option>)}</select><ChevronDown size={14} /></label></div><span aria-live="polite">共找到 <strong>{filtered.length}</strong> 项</span></div>
    {(query || moduleFilter !== '全部模块' || typeFilter !== '全部类型') && <div className="active-filters" aria-label="当前搜索条件">
      {query && <button onClick={() => update('q', '')}>关键词：{query}<X size={13} aria-hidden="true" /><span className="sr-only">清除关键词</span></button>}
      {moduleFilter !== '全部模块' && <button onClick={() => update('module', '全部模块')}>模块：{modules.find((item) => item.id === moduleFilter)?.name ?? moduleFilter}<X size={13} aria-hidden="true" /><span className="sr-only">清除模块筛选</span></button>}
      {typeFilter !== '全部类型' && <button onClick={() => update('type', '全部类型')}>类型：{typeFilter}<X size={13} aria-hidden="true" /><span className="sr-only">清除类型筛选</span></button>}
      <button className="clear-all-filters" onClick={clearSearch}>清除筛选</button>
    </div>}
    {filtered.length ? <div className="resource-list search-results">{filtered.map((item) => <ResourceRow key={item.id} resource={item} favorites={favorites} toggleFavorite={toggleFavorite} />)}</div> : <EmptyState title={query ? `没有找到「${query}」相关资源` : '资源索引已就绪'} body={query ? '换一个关键词，或调整模块与类型筛选。' : '输入关键词，搜索 48 项面向真实工作场景的资源。'} action={clearSearch} actionText="清除筛选" />}
  </div>
}

function MePage(props: SharedProps) {
  const navigate = useNavigate()
  const [tab, setTab] = useState('我的收藏')
  const [historyType, setHistoryType] = useState('全部类型')
  const [profileName, setProfileName] = useState(() => readProfile('hub-profile-name', '林知远'))
  const [profileRole, setProfileRole] = useState(() => readProfile('hub-profile-role', '科研工作者 · AI 资源探索者'))
  const favoriteItems = props.favorites.map((id) => resources.find((item) => item.id === id)).filter((item): item is Resource => !!item)
  const historyItems = props.history.map((visit) => ({ visit, resource: resources.find((item) => item.id === visit.id) })).filter((item): item is { visit: Visit; resource: Resource } => !!item.resource)
    .filter(({ resource }) => historyType === '全部类型' || resource.type === historyType)
  const tabs = ['我的收藏', '浏览记录', '我的提交', '我的反馈', '个人资料']
  const saveProfile = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    try {
      localStorage.setItem('hub-profile-name', JSON.stringify(profileName))
      localStorage.setItem('hub-profile-role', JSON.stringify(profileRole))
      props.setToast({ message: '个人资料已保存', kind: 'success' })
    } catch { props.setToast({ message: '资料保存失败，请检查浏览器存储空间。', kind: 'error' }) }
  }
  const removeVisit = (visit: Visit) => {
    props.setHistory((items) => items.filter((item) => !(item.id === visit.id && item.at === visit.at)))
    props.setToast({ message: '已删除浏览记录', kind: 'success', action: { label: '撤销', run: () => {
      props.setHistory((items) => items.some((item) => item.id === visit.id)
        ? items : [visit, ...items].sort((a, b) => b.at.localeCompare(a.at)))
      props.setToast({ message: '已恢复浏览记录', kind: 'success' })
    } } })
  }
  const clearHistory = () => {
    const previous = props.history
    props.setHistory([])
    props.setToast({ message: '浏览记录已清空', kind: 'success', action: { label: '撤销', run: () => {
      props.setHistory((items) => {
        const merged = new Map<string, Visit>()
        for (const visit of [...previous, ...items]) {
          const current = merged.get(visit.id)
          if (!current || visit.at > current.at) merged.set(visit.id, visit)
        }
        return [...merged.values()].sort((a, b) => b.at.localeCompare(a.at)).slice(0, 100)
      })
      props.setToast({ message: '已恢复全部浏览记录', kind: 'success' })
    } } })
  }
  return <div className="content-page me-page"><div className="profile-banner"><div className="profile-avatar" aria-hidden="true">{profileName.slice(0, 1) || '林'}</div><div className="profile-intro"><p className="eyebrow">MY WORKSPACE / 本地账户</p><h1>{profileName}</h1><p>{profileRole}</p></div><span className="local-badge"><span className="status-point" />本地演示账户</span></div>
    <ChoiceBar items={tabs} value={tab} onChange={setTab} label="用户中心功能" className="me-tabs" asTabs panelId="me-panel" />
    <section className="me-content" id="me-panel" role="tabpanel" tabIndex={0} aria-labelledby={`choice-用户中心功能-${tabs.indexOf(tab)}`}>
      {tab === '我的收藏' && <><div className="me-section-heading"><div><h2>我的收藏</h2><p>保存下来，留待下次工作继续。</p></div><span>{favoriteItems.length} 项</span></div>{favoriteItems.length ? <div className="resource-list">{favoriteItems.map((item) => <ResourceRow key={item.id} resource={item} favorites={props.favorites} toggleFavorite={props.toggleFavorite} />)}</div> : <EmptyState title="还没有收藏资源" body="浏览资源时，点击心形图标即可收藏到这里。" actionText="去浏览资源" action={() => navigate('/resources/research')} />}</>}
      {tab === '浏览记录' && <><div className="me-section-heading"><div><h2>浏览记录</h2><p>最近看过的资源会自动保存在当前浏览器。</p></div><div className="history-actions"><label className="compact-select"><Filter size={14} /><select value={historyType} onChange={(event) => setHistoryType(event.target.value)} aria-label="按资源类型筛选浏览记录"><option>全部类型</option>{resourceTypes.map((item) => <option key={item}>{item}</option>)}</select><ChevronDown size={13} /></label>{props.history.length > 0 && <button className="text-action danger-action" onClick={clearHistory}>清空记录</button>}</div></div>
        {historyItems.length ? <div className="history-list">{historyItems.map(({ visit, resource }) => <div className="history-row" key={visit.at + resource.id}><div className="history-time"><strong>{new Intl.DateTimeFormat('zh-CN', { month: '2-digit', day: '2-digit' }).format(new Date(visit.at))}</strong><span>{new Intl.DateTimeFormat('zh-CN', { hour: '2-digit', minute: '2-digit' }).format(new Date(visit.at))}</span></div><div className="history-resource"><div><ResourceTypeTag type={resource.type} /><span>{modules.find((item) => item.id === resource.module)?.name}</span></div><Link to={`/resource/${resource.id}`}>{resource.title}</Link></div><Link to={`/resource/${resource.id}`} className="continue-link">继续访问 <ArrowRight size={14} /></Link><button className="history-delete icon-button" aria-label={`删除${resource.title}浏览记录`} onClick={() => removeVisit(visit)}><X size={16} /></button></div>)}</div> : <EmptyState title={props.history.length ? '没有符合类型的浏览记录' : '这里还没有浏览记录'} body={props.history.length ? '换一个资源类型，或清除类型筛选。' : '打开一条资源详情后，它会自动出现在这里。'} actionText={props.history.length ? '显示全部记录' : '去浏览资源'} action={() => props.history.length ? setHistoryType('全部类型') : navigate('/resources/research')} />}</>}
      {tab === '我的提交' && <><div className="me-section-heading"><div><h2>我的提交</h2><p>保存于本地，不会发送到服务器。</p></div><button className="button button-outline button-small" onClick={props.openSubmit}><Send size={14} />提交资源</button></div>{props.submissions.length ? <div className="submission-list">{props.submissions.map((item, index) => <article key={item.at + index}><span className="submission-icon"><FileText size={17} /></span><div><strong>{item.title}</strong><p>{item.description ?? item.note}</p>{item.module && item.type && <small>{modules.find((module) => module.id === item.module)?.name} · {item.type}{item.tags ? ` · ${item.tags}` : ''}</small>}{item.url && <a className="submission-url" href={item.url} target="_blank" rel="noreferrer">{item.url}</a>}<small>已本地保存 · {formatDate(item.at)}</small></div></article>)}</div> : <EmptyState title="还没有提交记录" body="分享你在科研、办公、开发或创作中用到的好资源。" actionText="提交资源" action={props.openSubmit} />}</>}
      {tab === '我的反馈' && <><div className="me-section-heading"><div><h2>我的反馈</h2><p>查看你提交的资源问题和建议。</p></div><span>{props.feedback.length} 条</span></div>{props.feedback.length ? <div className="submission-list">{props.feedback.map((item, index) => <article key={item.at + index}><span className="submission-icon"><MessageSquareText size={17} /></span><div><strong>{resources.find((resource) => resource.id === item.id)?.title ?? '资源反馈'}</strong><p>{item.text}</p><small>已记录 · {formatDate(item.at)}</small></div></article>)}</div> : <EmptyState title="还没有反馈" body="遇到资源信息不准确时，可以在资源详情页提交反馈。" actionText="浏览资源" action={() => navigate('/resources/research')} />}</>}
      {tab === '个人资料' && <div className="profile-settings"><div className="me-section-heading"><div><h2>个人资料</h2><p>这些信息仅保存在此设备的浏览器中。</p></div></div><form onSubmit={saveProfile}><label htmlFor="profile-name">你的称呼<input id="profile-name" value={profileName} onChange={(event) => setProfileName(event.target.value)} maxLength={30} /></label><label htmlFor="profile-role">一句话介绍<input id="profile-role" value={profileRole} onChange={(event) => setProfileRole(event.target.value)} maxLength={80} /></label><button className="button button-primary" type="submit">保存修改 <Check size={15} /></button></form><div className="follow-topics"><SectionLabel aside="可随时调整">关注的主题</SectionLabel><p>简报与资源的关注偏好，用于本地展示。</p>{props.followed.length === 0 && <EmptyState title="还没有关注主题" body="选择下方主题，按兴趣整理你的本地偏好。" />}<div>{briefTopics.map((topic) => <button key={topic} className={props.followed.includes(topic) ? 'followed' : ''} aria-pressed={props.followed.includes(topic)} onClick={() => props.toggleFollow(topic)}>{props.followed.includes(topic) && <Check size={13} />}{topic}</button>)}</div></div><fieldset className="motion-settings"><legend>动态效果偏好</legend><p>选择界面动效强度，设置会保存在此浏览器。</p><div className="motion-options">{(['lively', 'static', 'reduced'] as MotionMode[]).map((mode) => <button type="button" key={mode} className={`motion-option ${props.motion === mode ? 'selected' : ''}`} aria-pressed={props.motion === mode} onClick={() => props.setMotion(mode)}><strong>{motionLabel(mode)}</strong><span>{mode === 'lively' ? '保留首页背景和轻量转场' : mode === 'static' ? '关闭持续动画，保留操作反馈' : '尊重系统偏好，减少非必要动效'}</span></button>)}</div></fieldset></div>}
    </section>
  </div>
}

function EmptyState({ title, body, action, actionText }: { title: string; body: string; action?: () => void; actionText?: string }) {
  return <div className="empty-state"><span className="empty-icon"><Search size={20} /></span><h3>{title}</h3><p>{body}</p>{action && actionText && <button className="button button-outline button-small" onClick={action}>{actionText}</button>}</div>
}
function NotFound() { return <div className="content-page not-found"><span className="not-found-code">404</span><h1>这条路径暂时没有内容</h1><p>检查地址是否正确，或回到首页继续探索资源。</p><Link to="/" className="button button-primary">回到首页 <ArrowRight size={16} /></Link></div> }
