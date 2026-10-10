import { useEffect, useMemo, useState } from 'react'
import {
  ArrowLeft, BellOff, BookImage, Check, ChevronDown, ChevronRight, CircleUserRound,
  ChevronLeft, Clock3, Copy, Dices, Download, Ellipsis, Film, Heart, ImageOff, ImagePlus, Images, Languages,
  LockKeyhole, LogOut, Pause, Play, Plus, RefreshCw, RotateCw, Settings2,
  Send, Share2, ShieldCheck, Sparkles, Ticket, Trash2, Users, WandSparkles, X,
} from 'lucide-react'
import './index.css'

type Route = 'home' | 'create' | 'invite' | 'group' | 'picker' | 'ai-vlog' | 'vlogs' | 'player' | 'share' | 'memories' | 'settings'
type Language = 'zh' | 'ja' | 'ko'

interface Group {
  id: string
  name: string
  code: string
  members: string[]
  cover: string
  joined: boolean
  shared: string[]
}

const PHOTO_POOL = [
  'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?w=700&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=700&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=700&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1519671282429-b44660ead0a7?w=700&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1528605248644-14dd04022da1?w=700&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?w=700&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=700&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1527631746610-bca00a040d60?w=700&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=700&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=700&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1533105079780-92b9be482077?w=700&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=700&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=700&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1511988617509-a57c8a288659?w=700&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1506869640319-fe1a24fd76dc?w=700&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?w=700&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?w=700&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1500534623283-312aade485b7?w=700&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=700&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1527529482837-4698179dc6ce?w=700&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1541532713592-79a0317b6b77?w=700&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=700&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=700&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=700&auto=format&fit=crop&q=70',
]

const SEED_GROUP: Group = {
  id: 'sea-friends',
  name: '海邊那群人',
  code: 'KAIM24',
  members: ['你', '小葵', 'Mina', '俊'],
  cover: PHOTO_POOL[1],
  joined: true,
  shared: [],
}

/** 第二个演示群：已加入且本周已分享，默认已解锁。 */
const SEED_UNLOCKED_GROUP: Group = {
  id: 'night-table',
  name: '週五那桌人',
  code: 'NIGHT7',
  members: ['你', '阿澤', 'Yuna', '小滿', 'Ken', '晴'],
  cover: PHOTO_POOL[12],
  joined: true,
  shared: PHOTO_POOL.slice(12, 16),
}

/** 第三个演示群：已加入但本周尚未分享，保持未解锁。 */
const SEED_LOCKED_GROUP: Group = {
  id: 'rainy-flat',
  name: '雨天那間房',
  code: 'RAIN09',
  members: ['你', '阿青', 'Lea', '森'],
  cover: PHOTO_POOL[9],
  joined: true,
  shared: [],
}

const SEED_GROUPS: Group[] = [SEED_UNLOCKED_GROUP, SEED_GROUP, SEED_LOCKED_GROUP]
const LOCKED_SEED_IDS = ['sea-friends', 'rainy-flat']

/** DEMO 用：这些成员固定展示「还没上传照片」的空态。 */
const NO_UPLOAD_MEMBERS = ['Yuna']

/** 每位成员照片墙的展位数量，按成员序号轮换，避免每行长度一致。 */
const WALL_PHOTO_COUNTS = [11, 13, 9, 12, 10, 14, 9, 12]

/** 让照片墙里的展位横竖屏交替出现，模拟真实相册的比例差异。 */
function isLandscape(memberIndex: number, photoIndex: number): boolean {
  return (memberIndex + photoIndex) % 3 === 1
}

/** DEMO 用：按照片 key 生成一个稳定的初始赞数，模拟群友已经点过赞。 */
function seedLikeCount(photoKey: string): number {
  let hash = 0
  for (let index = 0; index < photoKey.length; index += 1) {
    hash = (hash * 31 + photoKey.charCodeAt(index)) >>> 0
  }
  return hash % 5
}

interface MemoryStill {
  src: string
  label: string
  iso: string
  people: string[]
  place: string
  month: string
}

/** DEMO 用：回忆照片里可能出现的人物，按序号轮换分配。 */
const MEMORY_PEOPLE = ['小葵', 'Mina', '俊', '阿澤', 'Yuna', '小滿', 'Ken', '晴']

/** DEMO 用：回忆照片的拍摄地点，按序号轮换分配。 */
const MEMORY_PLACES = ['海邊', '巷口咖啡', '後院', '河堤', '山上', '家裡', '市場', '夜路']

/** 打乱照片池，并为每张回忆生成日期、人物与地点等可筛选的元信息。 */
function buildMemoryStills(): MemoryStill[] {
  return [...PHOTO_POOL]
    .sort(() => Math.random() - 0.5)
    .map((src, index) => {
      const date = new Date(2026, 8, 10)
      date.setDate(date.getDate() - (index + 1) * 3 - (index % 5))
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      const people = ['你', MEMORY_PEOPLE[index % MEMORY_PEOPLE.length]]
      if (index % 3 === 0) people.push(MEMORY_PEOPLE[(index + 3) % MEMORY_PEOPLE.length])
      return {
        src,
        iso: `${date.getFullYear()}-${month}-${day}`,
        label: `${date.getFullYear()}.${month}.${day}`,
        people,
        place: MEMORY_PLACES[index % MEMORY_PLACES.length],
        month: `${date.getFullYear()}.${month}`,
      }
    })
}

/** 读取本地 group 数据；保证两个演示群都在列表里。 */
function loadGroups(): Group[] {
  const stored = readStore<Group[]>('memoir-groups', [])
  if (!stored.length) return SEED_GROUPS
  const extras = stored.filter(group => !SEED_GROUPS.some(seed => seed.id === group.id))
  const seeds = SEED_GROUPS.map((seed) => {
    const existing = stored.find(group => group.id === seed.id)
    if (!existing) return seed
    if (LOCKED_SEED_IDS.includes(seed.id)) return { ...existing, joined: true }
    return {
      ...existing,
      joined: true,
      shared: existing.shared.length ? existing.shared : seed.shared,
    }
  })
  return [...seeds, ...extras].sort((a, b) => Number(b.shared.length > 0) - Number(a.shared.length > 0))
}

const COPY = {
  zh: { title: '平凡的日子也在發光', sub: '這週我們都在認真生活' },
  ja: { title: '何気ない日々も輝いている', sub: '今週も、私たちらしく過ごした' },
  ko: { title: '평범한 날들도 빛나고 있어', sub: '이번 주도 우리답게 살아냈어' },
}

interface VlogCaption {
  text: string
  meta: string
}

/**
 * 「平凡的日子也在發光」逐帧配文：按画面里的人物、場景與時間書寫，
 * 模擬 AI 讀懂每張照片後自動生成的字幕。
 */
const GLOW_DAY_CAPTIONS: VlogCaption[] = [
  { text: '三杯剛好，誰都沒有遲到', meta: '15:20 · 巷口咖啡 · 你、阿澤、晴' },
  { text: '風把瀏海吹亂了，笑聲沒停', meta: '17:46 · 河堤上 · Yuna、小滿' },
  { text: '太陽掉進手心的那一秒', meta: '18:32 · 觀景丘 · 六個人都在' },
  { text: '燈串一亮，這裡就熱了起來', meta: '20:05 · 後院派對 · Ken 和大家' },
  { text: '把明天的事，先寫下來', meta: '23:11 · 回家的桌前 · 只有你' },
]

/** Vlog 页「今日」样例：封面、标题和播放片段。 */
const TODAY_VLOGS = [
  { title: COPY.zh.title, group: '週五那桌人', cover: PHOTO_POOL[12], photos: PHOTO_POOL.slice(12, 17), time: '00:45', captions: GLOW_DAY_CAPTIONS },
  { title: '今天的光剛好', group: '海邊那群人', cover: PHOTO_POOL[1], photos: PHOTO_POOL.slice(1, 6), time: '00:38' },
  { title: '把晚餐留給你', group: '週五那桌人', cover: PHOTO_POOL[11], photos: PHOTO_POOL.slice(11, 16), time: '00:41' },
  { title: '晚風把話帶走', group: '海邊那群人', cover: PHOTO_POOL[6], photos: PHOTO_POOL.slice(6, 11), time: '00:33' },
]

/** Vlog 页「本週混剪」样例。 */
const WEEK_MIXES = [
  { title: '我們都在的這一週', group: '週五那桌人', cover: PHOTO_POOL[7], photos: PHOTO_POOL.slice(6, 11), time: '00:52' },
  { title: '海邊慢下來的七天', group: '海邊那群人', cover: PHOTO_POOL[2], photos: PHOTO_POOL.slice(2, 7), time: '00:48' },
  { title: '乾杯以後還有路', group: '週五那桌人', cover: PHOTO_POOL[22], photos: PHOTO_POOL.slice(18, 23), time: '00:56' },
  { title: '雨停之前的室內', group: '雨天那間房', cover: PHOTO_POOL[9], photos: PHOTO_POOL.slice(8, 13), time: '00:44' },
]

/** 播放器可轮换的运镜数量，与 index.css 里的 .transition-* 一一对应。 */
const TRANSITION_COUNT = 6

/** 把从零点起的分钟数格式化成 HH:MM。 */
function formatClock(minutes: number): string {
  const hour = Math.floor(minutes / 60)
  const minute = minutes % 60
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
}

/** 当天可选的具体时刻：每 30 分钟一格，共 48 个。 */
const DAY_TIME_SLOTS = Array.from({ length: 48 }, (_, index) => index * 30)

/** 从浏览器本地存储读取数据，并在异常时使用默认值。 */
function readStore<T>(key: string, fallback: T): T {
  try {
    const value = localStorage.getItem(key)
    return value ? JSON.parse(value) as T : fallback
  } catch {
    return fallback
  }
}

/** 生成六位大写字母与数字混合的邀请码。 */
function makeCode(): string {
  return Math.random().toString(36).slice(2, 8).toUpperCase()
}

interface WeekDay {
  key: string
  label: string
}

interface WeekDetails {
  title: string
  range: string
  days: WeekDay[]
}

/** 根据相对当前周的偏移量，生成周标题、日期范围和周一到周日共 7 天。 */
function getWeekDetails(offset: number): WeekDetails {
  const now = new Date()
  const day = now.getDay() || 7
  const monday = new Date(now)
  monday.setHours(12, 0, 0, 0)
  monday.setDate(now.getDate() - day + 1 + offset * 7)
  const days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(monday)
    date.setDate(monday.getDate() + index)
    return {
      key: `${date.getMonth() + 1}-${date.getDate()}`,
      label: `${date.getMonth() + 1}月${date.getDate()}日`,
    }
  })
  const sunday = days[6]
  const weekOfMonth = Math.ceil(monday.getDate() / 7)
  return {
    title: `${monday.getMonth() + 1}月第${weekOfMonth}週`,
    range: `${monday.getMonth() + 1}月${monday.getDate()}日 — ${sunday.label}`,
    days,
  }
}

/** 应用根组件：管理 DEMO 路由、本地状态和全部交互流程。 */
export default function App() {
  const [permission, setPermission] = useState(() => readStore('memoir-permission', true))
  const [askedPermission, setAskedPermission] = useState(false)
  const [route, setRoute] = useState<Route>('home')
  const [groups, setGroups] = useState<Group[]>(() => loadGroups())
  const [activeGroupId, setActiveGroupId] = useState('sea-friends')
  const [language, setLanguage] = useState<Language>(() => readStore('memoir-lang', 'zh'))
  const [toast, setToast] = useState('')
  const [playerPhotos, setPlayerPhotos] = useState<string[]>([])
  const [playerCaptions, setPlayerCaptions] = useState<VlogCaption[]>([])
  const [previousRoute, setPreviousRoute] = useState<Route>('group')

  const joinedGroups = groups.filter(group => group.joined).sort((a, b) => Number(b.shared.length > 0) - Number(a.shared.length > 0))
  const activeGroup = groups.find(group => group.id === activeGroupId) ?? groups[0]

  useEffect(() => localStorage.setItem('memoir-permission', JSON.stringify(permission)), [permission])
  useEffect(() => localStorage.setItem('memoir-groups', JSON.stringify(groups)), [groups])
  useEffect(() => localStorage.setItem('memoir-lang', JSON.stringify(language)), [language])
  useEffect(() => {
    if (!toast) return
    const timer = window.setTimeout(() => setToast(''), 2600)
    return () => window.clearTimeout(timer)
  }, [toast])

  /** 切换页面并将视图滚动回顶部。 */
  const navigate = (next: Route) => {
    setRoute(next)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  /** 打开播放器，记录返回路径，并带上该 vlog 的逐帧配文。 */
  const openPlayer = (photos: string[], from: Route = 'group', captions: VlogCaption[] = []) => {
    setPlayerPhotos(photos)
    setPlayerCaptions(captions)
    setPreviousRoute(from)
    navigate('player')
  }

  /** 更新当前 group 的本周分享照片。 */
  const sharePhotos = (photos: string[]) => {
    setGroups(list => list.map(group =>
      group.id === activeGroupId
        ? { ...group, shared: [...group.shared, ...photos].slice(0, 15) }
        : group,
    ))
  }

  return (
    <main className="phone-shell">
      <div className="grain" />
      <div className="landscape-guard"><RotateCw size={32} /><strong>請旋轉手機使用</strong></div>

      {route === 'home' && (
        <Home groups={joinedGroups} permission={permission} onPermission={() => setAskedPermission(true)}
          onCreate={() => navigate('create')} onJoin={() => navigate('invite')}
          onGroup={(id) => { setActiveGroupId(id); navigate('group') }} />
      )}
      {route === 'create' && (
        <CreateGroup onBack={() => navigate('home')} onCreated={(group) => {
          setGroups(list => [...list, group])
          setActiveGroupId(group.id)
        }} onEnter={() => navigate('group')} />
      )}
      {route === 'invite' && (
        <JoinGroup groups={groups} onBack={() => navigate('home')} onJoin={(id) => {
          setGroups(list => list.map(group => group.id === id ? { ...group, joined: true } : group))
          setActiveGroupId(id)
          setToast('歡迎加入')
          navigate('group')
        }} />
      )}
      {route === 'group' && activeGroup && (
        <GroupFeed group={activeGroup} onBack={() => navigate('home')}
          onPick={() => permission ? navigate('picker') : setAskedPermission(true)}
          onAiVlog={() => permission ? navigate('ai-vlog') : setAskedPermission(true)}
          onPlay={(photos) => openPlayer(photos, 'group')}
          onToast={setToast}
          onExit={() => {
            setGroups(list => list.map(group => group.id === activeGroup.id ? { ...group, joined: false } : group))
            setToast('已退出 group')
            navigate('home')
          }} />
      )}
      {route === 'picker' && activeGroup && (
        <Picker alreadyShared={activeGroup.shared.length} onBack={() => navigate('group')}
          onSubmit={(photos) => { sharePhotos(photos); setPlayerPhotos(photos.slice(0, 5)) }}
          onBackToGroup={() => navigate('group')}
          onWatch={(photos) => { setPlayerPhotos(photos.slice(0, 5)); setPreviousRoute('group'); navigate('player') }} />
      )}
      {route === 'ai-vlog' && activeGroup && (
        <AiVlogStudio group={activeGroup} onBack={() => navigate('group')}
          onWatch={(photos, captions) => openPlayer(photos, 'group', captions)} />
      )}
      {route === 'vlogs' && (
        <Vlogs groups={joinedGroups} onPlay={(photos, captions) => openPlayer(photos, 'vlogs', captions)}
          onToast={setToast}
          onUnlock={(id) => {
            setActiveGroupId(id)
            if (permission) navigate('picker')
            else setAskedPermission(true)
          }} />
      )}
      {route === 'player' && (
        <Player photos={playerPhotos.length ? playerPhotos : PHOTO_POOL.slice(0, 5)} copy={COPY[language]} captions={playerCaptions}
          onBack={() => navigate(previousRoute)} />
      )}
      {route === 'share' && (
        <SharePreview photo={playerPhotos[0] ?? PHOTO_POOL[0]} copy={COPY[language]}
          onBack={() => navigate('player')}
          onDone={(channel) => { setToast(`已分享到 ${channel}（DEMO 模擬）`); navigate('player') }} />
      )}
      {route === 'memories' && <Memories hasUnlocked={joinedGroups.some(group => group.shared.length > 0)} onToast={setToast} />}
      {route === 'settings' && (
        <Settings language={language} permission={permission} onLanguage={setLanguage}
          onPermission={() => setAskedPermission(true)} />
      )}

      {(['home', 'vlogs', 'memories', 'settings'] as Route[]).includes(route) && <BottomNav active={route} onChange={navigate} />}
      {askedPermission && <PermissionModal onAllow={() => { setPermission(true); setAskedPermission(false); setToast('已允許存取照片') }} onLater={() => setAskedPermission(false)} />}
      {toast && <div className="toast" role="status"><Check size={17} />{toast}</div>}
    </main>
  )
}

/** 首页：展示已加入 group、权限提醒和创建/加入入口。 */
function Home({ groups, permission, onPermission, onCreate, onJoin, onGroup }: {
  groups: Group[]; permission: boolean; onPermission: () => void; onCreate: () => void; onJoin: () => void; onGroup: (id: string) => void
}) {
  return (
    <Page>
      <header className="home-header">
        <div><p className="eyebrow">WEDNESDAY, 09 SEP</p><h1>我們的房間</h1></div>
        <div className="header-actions">
          <button className="icon-btn" aria-label="輸入邀請碼" title="輸入邀請碼" onClick={onJoin}><Ticket size={20} /></button>
          <button className="icon-btn create" aria-label="創建 group" title="創建 group" onClick={onCreate}><Plus size={22} /></button>
        </div>
      </header>
      {!permission && <button className="permission-banner" onClick={onPermission}><ImagePlus size={20} /><span><strong>允許相片存取</strong><small>開啟你的每週照片日記</small></span><ChevronRight size={18} /></button>}
      {groups.length ? (
        <section className="group-stack">
          {groups.map((group, index) => (
            <button className="group-card" key={group.id} onClick={() => onGroup(group.id)}>
              <img src={group.cover} alt={`${group.name} 封面`} /><span className="card-scrim" />
              <span className="week-index">W / {index + 36}</span>
              <span className={`status-pill ${group.shared.length ? 'unlocked' : ''}`}>{group.shared.length ? <><Check size={13} /> 已解鎖</> : <>尚未解鎖</>}</span>
              <span className="group-card-copy"><strong>{group.name}</strong><small>{group.members.length} 位成員 · {group.shared.length ? `你分享了 ${group.shared.length} 張` : '分享 1 張即可看本週'}</small></span>
              <span className="avatar-row">{group.members.slice(0, 4).map((name, i) => <i key={name} style={{ '--i': i } as React.CSSProperties}>{name.slice(0, 1)}</i>)}</span>
            </button>
          ))}
        </section>
      ) : <section className="empty"><Users size={42} /><h2>還沒有 group</h2><p>和 1–7 位最親的朋友開始吧</p><p className="demo-code">DEMO 體驗邀請碼：<strong>KAIM24</strong></p></section>}
    </Page>
  )
}

/** 创建 group 页：收集名称和可选封面并生成邀请码。 */
function CreateGroup({ onBack, onCreated, onEnter }: { onBack: () => void; onCreated: (group: Group) => void; onEnter: () => void }) {
  const [name, setName] = useState('')
  const [cover, setCover] = useState(PHOTO_POOL[5])
  const [created, setCreated] = useState<Group | null>(null)

  /** 创建 group 并切换到邀请码成功态。 */
  const create = () => {
    const group: Group = { id: crypto.randomUUID(), name: name.trim(), code: makeCode(), members: ['你'], cover, joined: true, shared: [] }
    onCreated(group)
    setCreated(group)
  }

  if (created) return (
    <Page className="success-page">
      <div className="success-seal"><Sparkles size={28} /></div><p className="eyebrow">YOUR PRIVATE ROOM IS READY</p>
      <h1>{created.name}<br />已經準備好了</h1>
      <div className="invite-ticket"><small>邀請碼</small><strong>{created.code}</strong><button onClick={() => navigator.clipboard?.writeText(created.code)}><Copy size={17} />複製邀請碼</button></div>
      <p className="muted center">把邀請碼發給朋友<br />2–8 人的小房間，只屬於你們。</p>
      <button className="primary wide bottom-cta" onClick={onEnter}>進入 group <ChevronRight size={18} /></button>
    </Page>
  )

  return (
    <Page><TopBar title="創建 group" onBack={onBack} />
      <section className="form-page"><p className="eyebrow">A ROOM FOR YOUR PEOPLE</p><h1>替這段關係取一個名字</h1>
        <label htmlFor="groupName">GROUP 名稱 <span>{name.length}/12</span></label>
        <input id="groupName" className="text-input" maxLength={12} value={name} onChange={event => setName(event.target.value)} placeholder="例如：海邊那群人" />
        <label>選擇封面 <small>可選</small></label>
        <div className="cover-picker">{PHOTO_POOL.slice(0, 6).map(photo => <button className={cover === photo ? 'selected' : ''} key={photo} onClick={() => setCover(photo)}><img src={photo} alt="可選 group 封面" />{cover === photo && <Check size={16} />}</button>)}</div>
      </section>
      <button className="primary wide bottom-cta" disabled={!name.trim()} onClick={create}>創建並生成邀請碼</button>
    </Page>
  )
}

/** 加入 group 页：支持逐位输入及整段粘贴邀请码。 */
function JoinGroup({ groups, onBack, onJoin }: { groups: Group[]; onBack: () => void; onJoin: (id: string) => void }) {
  const [code, setCode] = useState('')
  const [error, setError] = useState('')

  /** 验证邀请码是否存在及是否满员。 */
  const join = () => {
    const group = groups.find(item => item.code === code)
    if (!group) return setError('邀請碼不存在或已失效')
    if (group.members.length >= 8) return setError('group 已滿（8 人）')
    onJoin(group.id)
  }

  return (
    <Page className="invite-page"><TopBar title="加入 group" onBack={onBack} />
      <div className="invite-visual"><Users size={30} /><span /><span /></div><p className="eyebrow">BY INVITATION ONLY</p><h1>輸入朋友給你的<br />六位邀請碼</h1>
      <div className="code-boxes" onClick={() => document.getElementById('invite-code')?.focus()}>
        {[0, 1, 2, 3, 4, 5].map(index => <span className={code[index] ? 'filled' : ''} key={index}>{code[index] ?? ''}</span>)}
        <input id="invite-code" autoFocus maxLength={6} value={code} onChange={event => { setCode(event.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '')); setError('') }} />
      </div>
      {error && <p className="error center" role="alert">{error}</p>}
      <p className="demo-code">DEMO 體驗邀請碼：<button onClick={() => setCode('KAIM24')}>KAIM24</button></p>
      <button className="primary wide bottom-cta" disabled={code.length !== 6} onClick={join}>加入 group</button>
    </Page>
  )
}

/** Group 周 Feed：根据分享状态展示锁定层或完整内容。 */
function GroupFeed({ group, onBack, onPick, onAiVlog, onPlay, onToast, onExit }: {
  group: Group; onBack: () => void; onPick: () => void; onAiVlog: () => void; onPlay: (photos: string[]) => void; onToast: (message: string) => void; onExit: () => void
}) {
  const [menu, setMenu] = useState(false)
  const [inviteOpen, setInviteOpen] = useState(false)
  const [confirmExit, setConfirmExit] = useState(false)
  const [weekOffset, setWeekOffset] = useState(0)
  const [touchStartX, setTouchStartX] = useState<number | null>(null)
  const [likedKeys, setLikedKeys] = useState<string[]>([])
  const [likeCounts, setLikeCounts] = useState<Record<string, number>>({})
  const [comments, setComments] = useState<Record<string, string[]>>({})
  const [viewer, setViewer] = useState<{ key: string; src: string; name: string } | null>(null)
  const [draft, setDraft] = useState('')
  const unlocked = group.shared.length > 0
  const friends = group.members.filter(name => name !== '你')
  const feedPhotos = [...PHOTO_POOL.slice(6, 14), ...group.shared]
  const selectedWeek = getWeekDetails(weekOffset)
  const members = ['你', ...friends]

  /** 切换周次；负数查看过去，正数查看下一周。 */
  const changeWeek = (step: number) => {
    setWeekOffset(value => Math.max(-12, Math.min(1, value + step)))
  }

  /** 根据横向滑动距离切换周次，轻触不触发切换。 */
  const finishWeekSwipe = (endX: number) => {
    if (touchStartX === null) return
    const distance = endX - touchStartX
    if (Math.abs(distance) >= 42) changeWeek(distance < 0 ? 1 : -1)
    setTouchStartX(null)
  }

  /** 读取某张照片的当前赞数：用户改过用改过的值，否则用 DEMO 种子数。 */
  const likeCountOf = (photoKey: string) => likeCounts[photoKey] ?? seedLikeCount(photoKey)

  /** 切换点赞：自己赞过则减 1，没赞过则加 1，列表和大图共用这份状态。 */
  const toggleLike = (photoKey: string) => {
    const liked = likedKeys.includes(photoKey)
    setLikedKeys(list => liked ? list.filter(item => item !== photoKey) : [...list, photoKey])
    setLikeCounts(map => {
      const current = map[photoKey] ?? seedLikeCount(photoKey)
      return { ...map, [photoKey]: Math.max(0, current + (liked ? -1 : 1)) }
    })
  }

  /** 把草稿留言追加到当前放大照片的评论列表。 */
  const sendComment = () => {
    if (!viewer || !draft.trim()) return
    setComments(map => ({ ...map, [viewer.key]: [...(map[viewer.key] ?? []), draft.trim()] }))
    setDraft('')
  }

  /** 复制当前 group 邀请码，方便用户发给朋友。 */
  const copyInviteCode = () => {
    navigator.clipboard?.writeText(group.code)
    onToast('邀請碼已複製')
  }

  /** 生成成员在选中周的照片墙内容；空态成员与未来週返回空数组。 */
  const memberPhotos = (name: string, index: number): string[] => {
    if (NO_UPLOAD_MEMBERS.includes(name) || weekOffset > 0) return []
    const own = name === '你' && weekOffset === 0 ? group.shared : []
    const count = WALL_PHOTO_COUNTS[index % WALL_PHOTO_COUNTS.length]
    const start = index * 5 + Math.abs(weekOffset) * 3
    const rotated = Array.from({ length: PHOTO_POOL.length }, (_, offset) => PHOTO_POOL[(start + offset) % PHOTO_POOL.length])
    const filler = rotated.filter(photo => !own.includes(photo)).slice(0, Math.max(0, count - own.length))
    return [...own, ...filler]
  }

  return (
    <Page>
      <header className="group-head">
        <button aria-label="返回" onClick={onBack}><ArrowLeft /></button>
        <div>
          <h1>{group.name}</h1>
          <p>{group.members.length} 位成員 · {weekOffset === 0 ? '本週' : selectedWeek.title}</p>
        </div>
        <div className="group-head-actions">
          <button aria-label="邀請朋友" title="邀請朋友" onClick={() => setInviteOpen(true)}><Ticket /></button>
          <button aria-label="Group 管理" onClick={() => setMenu(true)}><Ellipsis /></button>
        </div>
      </header>
      <section className="feed-content">
        <div className="week-switcher" onTouchStart={event => setTouchStartX(event.touches[0].clientX)}
          onTouchEnd={event => finishWeekSwipe(event.changedTouches[0].clientX)}>
          <button aria-label="查看上一週" onClick={() => changeWeek(-1)} disabled={weekOffset <= -12}><ChevronLeft size={16} /></button>
          <p aria-live="polite"><strong>{selectedWeek.title}</strong><span>{selectedWeek.range}</span></p>
          <button aria-label="查看下一週" onClick={() => changeWeek(1)} disabled={weekOffset >= 1}><ChevronRight size={16} /></button>
        </div>
        <button type="button" className="ai-vlog-entry" onClick={onAiVlog}>
          <span className="ai-entry-icon"><WandSparkles size={21} /></span>
          <span><small>MEMOIR AI DIRECTOR</small><strong>和 AI 一起做支 Vlog</strong><em>選照片，用一句話說出你想要的感覺</em></span>
          <ChevronRight size={19} />
        </button>
        <div className={`locked-wrap ${unlocked ? '' : 'is-locked'}`}>
          <section><div className="section-title"><h2>照片牆</h2><button type="button" onClick={onPick}><ImagePlus size={15} />{group.shared.length ? '再選幾張' : '分享照片'}</button></div>
            <div className="member-walls">{members.map((name, memberIndex) => {
              const uploaded = memberPhotos(name, memberIndex)
              const displayName = name === '你' ? '我' : name
              return <article className="member-wall" key={name}>
                <header><i style={{ '--member-index': memberIndex } as React.CSSProperties}>{displayName.slice(0, 1)}</i><strong>{displayName}</strong></header>
                {uploaded.length ? <div className="photo-strip">{uploaded.map((photo, photoIndex) => {
                  const photoKey = `${name}-${photoIndex}`
                  const liked = likedKeys.includes(photoKey)
                  return <figure key={photoKey} className={isLandscape(memberIndex, photoIndex) ? 'is-landscape' : ''}>
                    <button type="button" className="photo-open" onClick={() => { setViewer({ key: photoKey, src: photo, name: displayName }); setDraft('') }}>
                      <img src={photo} alt={`${displayName} 的本週照片 ${photoIndex + 1}`} />
                    </button>
                    <figcaption>
                      <LikeButton compact liked={liked} count={likeCountOf(photoKey)} onToggle={() => toggleLike(photoKey)} />
                    </figcaption>
                  </figure>
                })}</div> : <>
                  <p className="member-wall-note"><ImageOff size={14} />這個用戶還沒上傳照片</p>
                  <div className="day-slots">{selectedWeek.days.map(day => <div className="day-slot" key={day.key}><span>{day.label}</span></div>)}</div>
                </>}
              </article>
            })}</div>
          </section>
          <section><div className="section-title"><h2>本週混剪</h2><span>MEMOIR CUT</span></div>
            <button className="mix-card" onClick={() => onPlay(feedPhotos.slice(0, 5))}><img src={group.cover} alt="本週混剪封面" /><span className="card-scrim" /><span className="mix-badge"><Sparkles size={13} />本週混剪</span><span className="mix-play"><Play fill="currentColor" /></span><span className="mix-copy"><strong>我們都在的這一週</strong><small>{group.members.length} 位朋友 · 00:52</small></span></button>
          </section>
          <section><div className="section-title"><h2>朋友的 Vlog</h2><span>{friends.length} STORIES</span></div>
            <div className="vlog-row">{friends.slice(0, 3).map((name, index) => <button key={name} onClick={() => onPlay(PHOTO_POOL.slice(index + 8, index + 12))}><img src={PHOTO_POOL[index + 8]} alt={`${name} 的 vlog`} /><Play size={16} fill="currentColor" /><strong>{name}</strong><small>今日 · 00:45</small></button>)}</div>
          </section>
          {!unlocked && <div className="unlock-overlay"><span><LockKeyhole size={25} /></span><h2>分享，才看得見</h2><p>本週分享至少 1 張照片，<br />即可解鎖大家的內容。</p><button className="primary" onClick={onPick}><ImagePlus size={18} />去分享</button></div>}
        </div>
      </section>
      {viewer && <div className="photo-viewer">
        <button className="photo-viewer-close" aria-label="關閉" onClick={() => { setViewer(null); setDraft('') }}><X /></button>
        <img src={viewer.src} alt={`${viewer.name} 的放大照片`} />
        <div className="photo-viewer-bar">
          <div className="viewer-like-row">
            <LikeButton liked={likedKeys.includes(viewer.key)} count={likeCountOf(viewer.key)} onToggle={() => toggleLike(viewer.key)} />
            <span>{viewer.name} 的照片</span>
          </div>
          <div className="comment-list">{comments[viewer.key]?.length
            ? comments[viewer.key].map((text, index) => <p key={index}><strong>我</strong>{text}</p>)
            : <p className="muted">還沒有評論，說點什麼吧</p>}
          </div>
          <div className="comment-input">
            <input aria-label="評論內容" maxLength={40} value={draft} placeholder="寫下你的留言" onChange={event => setDraft(event.target.value)} />
            <button aria-label="送出評論" disabled={!draft.trim()} onClick={sendComment}><Send size={16} /></button>
          </div>
        </div>
      </div>}
      {inviteOpen && <Modal onClose={() => setInviteOpen(false)}>
        <div className="sheet-handle" />
        <h2>邀請朋友進來</h2>
        <p className="muted">把邀請碼發給朋友，2–8 人的小房間只屬於你們。</p>
        <div className="invite-ticket">
          <small>邀請碼</small>
          <strong>{group.code}</strong>
          <button type="button" onClick={copyInviteCode}><Copy size={17} />複製邀請碼</button>
        </div>
      </Modal>}
      {menu && <Modal onClose={() => setMenu(false)}><div className="sheet-handle" /><h2>{group.name}</h2><p className="muted">GROUP 管理</p><div className="setting-list">
        <div><Users /><span><strong>成員</strong><small>{group.members.join('、')}</small></span></div>
        <button className="danger-row" onClick={() => setConfirmExit(true)}><LogOut /><span><strong>退出 group</strong><small>離開這個私人房間</small></span></button>
      </div></Modal>}
      {confirmExit && <Confirm title="確定要退出嗎？" text="退出後，這個 group 將從你的列表消失。" confirm="退出 group" onCancel={() => setConfirmExit(false)} onConfirm={onExit} />}
    </Page>
  )
}

/** 相册选择页：处理多选、取消、顺序编号与每周 15 张上限。 */
function Picker({ alreadyShared, onBack, onSubmit, onBackToGroup, onWatch }: {
  alreadyShared: number; onBack: () => void; onSubmit: (photos: string[]) => void; onBackToGroup: () => void; onWatch: (photos: string[]) => void
}) {
  const [selected, setSelected] = useState<string[]>([])
  const [processing, setProcessing] = useState(false)
  const [step, setStep] = useState(0)
  const max = 15 - alreadyShared
  const steps = ['剔除相簿裡的截圖', '找出重複的畫面', '略過模糊的照片', '加入轉場與運鏡']

  useEffect(() => {
    if (!processing || step >= steps.length) return
    const timer = window.setTimeout(() => setStep(value => value + 1), 850)
    return () => window.clearTimeout(timer)
  }, [processing, step, steps.length])

  /** 切换照片选择状态并维护选择顺序。 */
  const toggle = (photo: string) => {
    if (selected.includes(photo)) return setSelected(list => list.filter(item => item !== photo))
    if (selected.length >= max) return
    setSelected(list => [...list, photo])
  }

  /** 提交本次照片并启动 AI 处理仪式。 */
  const submit = () => {
    onSubmit(selected)
    setProcessing(true)
  }

  if (processing) return (
    <div className="processing-screen"><div className={`ai-orbit ${step >= steps.length ? 'done' : ''}`}><Sparkles size={34} /></div>
      {step < steps.length ? <><p className="eyebrow">MEMOIR AI EDITOR</p><h1>AI 正在為你剪輯…</h1>
        <div className="process-list">{steps.map((label, index) => <div className={index < step ? 'complete' : index === step ? 'active' : ''} key={label}><span>{index < step ? <Check /> : index + 1}</span>{label}</div>)}</div>
      </> : <><p className="eyebrow">YOUR MEMORY IS READY</p><h1>今天，也值得<br />被好好記住。</h1><p className="muted center">已解鎖 group 本週全部內容</p>
        <div className="finish-actions"><button className="primary wide" onClick={() => onWatch(selected)}>看我的今日 Vlog</button><button className="secondary wide" onClick={onBackToGroup}>回到 group</button></div>
      </>}
    </div>
  )

  return (
    <Page className="picker-page"><TopBar title="本週照片" onBack={onBack} right={<span>{alreadyShared + selected.length}/15</span>} />
      <div className="picker-intro"><p className="eyebrow">WEEKLY DROP</p><h1>這週，想留下<br />哪些畫面？</h1><p>選 1–{max} 張。你只負責生活，剪輯交給 Memoir。</p></div>
      {selected.length > 0 && <div className="selected-strip">{selected.map((photo, index) => <button key={photo} onClick={() => toggle(photo)}><img src={photo} alt={`已選照片 ${index + 1}`} /><i><X size={12} /></i></button>)}</div>}
      <div className="album-grid">{PHOTO_POOL.map((photo, index) => {
        const order = selected.indexOf(photo)
        return <button key={`${photo}-${index}`} className={order >= 0 ? 'selected' : ''} onClick={() => toggle(photo)}><img src={photo} alt={`模擬相冊照片 ${index + 1}`} />{order >= 0 && <span>{order + 1}</span>}</button>
      })}</div>
      <div className="sticky-submit"><button className="primary wide" disabled={!selected.length} onClick={submit}>{selected.length ? `分享這 ${selected.length} 張` : '請選擇照片'}</button></div>
    </Page>
  )
}

type AiVlogStage = 'select' | 'brief' | 'generating' | 'ready'

interface AiChatMessage {
  role: 'ai' | 'user'
  text: string
}

const AI_STYLE_PROMPTS = ['像一封寫給夏天的信', '輕快、有朋友感', '安靜的電影感']
const AI_GENERATION_STEPS = ['理解照片故事', '編排敘事節奏', '生成字幕與音樂', '合成最後成片']

/** AI Vlog 工作台：串起选图、自然语言沟通、模拟生成和预览成片。 */
function AiVlogStudio({ group, onBack, onWatch }: {
  group: Group; onBack: () => void; onWatch: (photos: string[], captions: VlogCaption[]) => void
}) {
  const [stage, setStage] = useState<AiVlogStage>('select')
  const [selected, setSelected] = useState<string[]>([])
  const [draft, setDraft] = useState('')
  const [messages, setMessages] = useState<AiChatMessage[]>([
    { role: 'ai', text: '照片收到。你希望大家看完這支 Vlog，心裡留下什麼感覺？' },
  ])
  const [generationStep, setGenerationStep] = useState(0)
  const [chosenStyle, setChosenStyle] = useState('')

  useEffect(() => {
    if (stage !== 'generating') return
    if (generationStep >= AI_GENERATION_STEPS.length) {
      const timer = window.setTimeout(() => setStage('ready'), 500)
      return () => window.clearTimeout(timer)
    }
    const timer = window.setTimeout(() => setGenerationStep(value => value + 1), 720)
    return () => window.clearTimeout(timer)
  }, [stage, generationStep])

  /** 切换素材选择状态，最多选择 12 张以保持 Vlog 节奏紧凑。 */
  const togglePhoto = (photo: string) => {
    if (selected.includes(photo)) {
      setSelected(list => list.filter(item => item !== photo))
      return
    }
    if (selected.length < 12) setSelected(list => [...list, photo])
  }

  /** 接收一句创作要求，并模拟 AI 根据描述给出追问与创作判断。 */
  const sendBrief = (text = draft) => {
    const brief = text.trim()
    if (!brief) return
    setChosenStyle(brief)
    setMessages(list => [
      ...list,
      { role: 'user', text: brief },
      { role: 'ai', text: `明白了。我會用「${brief}」作為主調，前半段輕快，最後停在大家最自然的一張合照。約 42 秒，可以嗎？` },
    ])
    setDraft('')
  }

  /** 开始模拟生成流程，并将进度归零以支持重新生成。 */
  const generate = () => {
    setGenerationStep(0)
    setStage('generating')
  }

  /** 根据用户选中的图片生成逐帧字幕，供现有播放器模拟最终效果。 */
  const buildCaptions = (): VlogCaption[] => selected.slice(0, 6).map((_, index) => {
    const lines = ['故事從一個普通午後開始', '風吹過來，大家剛好都在笑', '沒有安排好的瞬間，最像我們', '天色慢慢暗下來，話還沒說完', '把這一天，留給以後的我們', '下次見面，故事繼續']
    return { text: lines[index], meta: `${group.name} · AI 依照片內容生成` }
  })

  if (stage === 'generating') {
    const progress = Math.min(100, Math.round((generationStep / AI_GENERATION_STEPS.length) * 100))
    return (
      <div className="ai-generate-screen">
        <button type="button" className="ai-cancel" onClick={() => setStage('brief')}>取消</button>
        <div className="ai-generate-visual">
          {selected.slice(0, 3).map((photo, index) => <img key={photo} src={photo} alt="" style={{ '--i': index } as React.CSSProperties} />)}
          <span><WandSparkles /></span>
        </div>
        <p className="eyebrow">AI DIRECTOR IS WORKING</p>
        <h1>正在把你的想法<br />剪進故事裡</h1>
        <div className="ai-progress"><i style={{ transform: `scaleX(${progress / 100})` }} /></div>
        <strong className="ai-progress-number">{progress}%</strong>
        <div className="ai-generation-list">
          {AI_GENERATION_STEPS.map((label, index) => (
            <span className={index < generationStep ? 'done' : index === generationStep ? 'active' : ''} key={label}>
              {index < generationStep ? <Check size={14} /> : <i />}{label}
            </span>
          ))}
        </div>
      </div>
    )
  }

  if (stage === 'ready') {
    return (
      <Page className="ai-ready-page">
        <TopBar title="你的 AI Vlog" onBack={onBack} />
        <div className="ai-ready-copy"><p className="eyebrow">FIRST CUT · 00:42</p><h1>這一天，<br />剛好都是我們。</h1><p>AI 已依照「{chosenStyle || '自然、有朋友感'}」完成第一版。</p></div>
        <button type="button" className="ai-ready-cover" onClick={() => onWatch(selected.slice(0, 6), buildCaptions())}>
          <img src={selected[0]} alt="AI Vlog 成片封面" /><span className="card-scrim" />
          <span className="mix-play"><Play fill="currentColor" /></span>
          <span className="ai-ready-meta"><small>MEMOIR AI CUT</small><strong>播放第一版</strong></span>
        </button>
        <div className="ai-ready-summary">
          <span><Clock3 size={17} /><strong>42 秒</strong><small>成片長度</small></span>
          <span><Images size={17} /><strong>{selected.length} 張</strong><small>使用素材</small></span>
          <span><Sparkles size={17} /><strong>敘事感</strong><small>剪輯風格</small></span>
        </div>
        <div className="ai-ready-actions">
          <button className="secondary wide" onClick={() => setStage('brief')}>繼續和 AI 調整</button>
          <button className="primary wide" onClick={() => onWatch(selected.slice(0, 6), buildCaptions())}>查看成片</button>
        </div>
      </Page>
    )
  }

  if (stage === 'brief') {
    return (
      <Page className="ai-chat-page">
        <TopBar title="和 AI 導演聊聊" onBack={() => setStage('select')} right={<span>{selected.length} 張</span>} />
        <div className="ai-context-strip">
          {selected.slice(0, 5).map(photo => <img key={photo} src={photo} alt="已選 Vlog 素材" />)}
          {selected.length > 5 && <span>+{selected.length - 5}</span>}
        </div>
        <section className="ai-chat-thread" aria-live="polite">
          <div className="ai-director-label"><span><Sparkles size={14} /></span><div><strong>Memoir AI 導演</strong><small>正在理解你的故事</small></div></div>
          {messages.map((message, index) => <div className={`ai-message ${message.role}`} key={`${message.role}-${index}`}>{message.text}</div>)}
          {messages.length === 1 && <div className="ai-prompt-chips">{AI_STYLE_PROMPTS.map(prompt => <button key={prompt} onClick={() => sendBrief(prompt)}>{prompt}</button>)}</div>}
        </section>
        <div className="ai-chat-dock">
          <div className="ai-chat-input">
            <input aria-label="告訴 AI 你想要的 Vlog 風格" value={draft} maxLength={80}
              placeholder="例如：像夏天的公路電影…" onChange={event => setDraft(event.target.value)}
              onKeyDown={event => event.key === 'Enter' && sendBrief()} />
            <button aria-label="送出" disabled={!draft.trim()} onClick={() => sendBrief()}><Send size={17} /></button>
          </div>
          <button className="primary wide" disabled={messages.length < 2} onClick={generate}><WandSparkles size={18} />生成第一版 Vlog</button>
        </div>
      </Page>
    )
  }

  return (
    <Page className="ai-select-page">
      <TopBar title="AI 生成 Vlog" onBack={onBack} right={<span>{selected.length}/12</span>} />
      <div className="ai-select-intro"><span><WandSparkles /></span><div><p className="eyebrow">START WITH YOUR MOMENTS</p><h1>先把故事的畫面交給 AI</h1><p>勾選想放進 Vlog 的照片，稍後用一句話告訴 AI 你想要的感覺。</p></div></div>
      {selected.length > 0 && <div className="selected-strip">{selected.map((photo, index) => <button key={photo} onClick={() => togglePhoto(photo)}><img src={photo} alt={`已選素材 ${index + 1}`} /><i><X size={12} /></i></button>)}</div>}
      <div className="ai-album-label"><strong>GROUP 本週照片</strong><small>建議選擇 6–12 張</small></div>
      <div className="album-grid">{PHOTO_POOL.map((photo, index) => {
        const order = selected.indexOf(photo)
        return <button key={`${photo}-${index}`} className={order >= 0 ? 'selected' : ''} onClick={() => togglePhoto(photo)}>
          <img src={photo} alt={`可選 Vlog 素材 ${index + 1}`} />{order >= 0 && <span>{order + 1}</span>}
        </button>
      })}</div>
      <div className="sticky-submit"><button className="primary wide" disabled={selected.length < 3} onClick={() => setStage('brief')}>
        {selected.length < 3 ? `還需選 ${3 - selected.length} 張` : '下一步，和 AI 聊聊'}<ChevronRight size={18} />
      </button></div>
    </Page>
  )
}

/** AI 生成规则说明文案，供「今日 / 本週混剪」的问号提示复用。 */
const AI_TIPS = [
  'AI 會依據構圖、人物、場景與時間自動挑選照片。',
  '自動剔除截圖、重複照片與模糊照片。',
  '自動搭配多種轉場、運鏡與多圖拼接效果。',
  '我們不會使用你的任何照片做訓練或其他用途，成片只屬於你與你選擇的 group。',
]

/** 文案末尾的小问号：点击后在下方展开 AI 生成说明，点击外部或按 Esc 收起。 */
function ScheduleTip() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!open) return
    const close = () => setOpen(false)
    const onKey = (event: KeyboardEvent) => event.key === 'Escape' && setOpen(false)
    document.addEventListener('pointerdown', close)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', close)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return <span className="tip-wrap">
    <button type="button" className="tip-btn" aria-label="查看 AI 生成說明" aria-expanded={open}
      onPointerDown={event => event.stopPropagation()}
      onClick={() => setOpen(value => !value)}><b>?</b></button>
    {open && <span className="tip-bubble" role="tooltip" onPointerDown={event => event.stopPropagation()}>
      <strong><Sparkles size={12} />AI 自動生成說明</strong>
      {AI_TIPS.map(text => <em key={text}>{text}</em>)}
    </span>}
  </span>
}

/** 定时生成文案行：左侧文案与问号，右侧开关控制是否自动生成。 */
function ScheduleNote({ enabled, onToggle, label, children }: {
  enabled: boolean; onToggle: (value: boolean) => void; label: string; children: React.ReactNode
}) {
  return (
    <p className={`schedule-note ${enabled ? '' : 'off'}`}>
      <span className="schedule-copy">{children}</span>
      <Toggle value={enabled} onChange={onToggle} label={enabled ? `關閉${label}` : `開啟${label}`} />
    </p>
  )
}

/** Vlog 聚合页：展示今日作品、混剪及解锁入口。 */
function Vlogs({ groups, onPlay, onUnlock, onToast }: {
  groups: Group[]; onPlay: (photos: string[], captions?: VlogCaption[]) => void; onUnlock: (id: string) => void; onToast: (message: string) => void
}) {
  const [tab, setTab] = useState<'today' | 'mix' | 'past'>('today')
  const [todayAt, setTodayAt] = useState(() => readStore('memoir-today-time', 20 * 60))
  const [mixAt, setMixAt] = useState(() => readStore('memoir-mix-time', 20 * 60))
  const [todayOn, setTodayOn] = useState(() => readStore('memoir-today-on', true))
  const [mixOn, setMixOn] = useState(() => readStore('memoir-mix-on', true))
  const [picking, setPicking] = useState<'today' | 'mix' | null>(null)
  const [likedVlogs, setLikedVlogs] = useState<string[]>([])
  const unlocked = groups.find(group => group.shared.length > 0)

  useEffect(() => localStorage.setItem('memoir-today-time', JSON.stringify(todayAt)), [todayAt])
  useEffect(() => localStorage.setItem('memoir-mix-time', JSON.stringify(mixAt)), [mixAt])
  useEffect(() => localStorage.setItem('memoir-today-on', JSON.stringify(todayOn)), [todayOn])
  useEffect(() => localStorage.setItem('memoir-mix-on', JSON.stringify(mixOn)), [mixOn])

  /** 切换某条 Vlog 的点赞状态，只改样式与本地记录。 */
  const toggleVlogLike = (id: string) => {
    setLikedVlogs(list => list.includes(id) ? list.filter(item => item !== id) : [...list, id])
  }

  return (
    <Page><header className="page-header"><p className="eyebrow">STORIES MADE FOR YOU</p><h1>Vlog</h1></header>
      <div className="tabs">{[['today', '今日'], ['mix', '本週混剪'], ['past', '往期']].map(([id, label]) => <button key={id} className={tab === id ? 'active' : ''} onClick={() => setTab(id as typeof tab)}>{label}</button>)}</div>
      {tab === 'today' && <>
        <ScheduleNote enabled={todayOn} onToggle={setTodayOn} label="每日自動生成">
          每日 <button type="button" disabled={!todayOn} onClick={() => setPicking('today')}>{formatClock(todayAt)}</button> 由 AI 生成當日 Vlog<ScheduleTip />
        </ScheduleNote>
        {unlocked ? <section className="vlog-stack">{TODAY_VLOGS.map(item => (
          <article className="portrait-vlog" key={item.title}>
            <button type="button" className="vlog-cover-btn" onClick={() => onPlay(item.photos, item.captions)}>
              <img src={item.cover} alt={item.title} /><span className="card-scrim" /><i><Play fill="currentColor" /></i>
              <span><small>TODAY · {item.time}</small><strong>{item.title}</strong><em>{item.group}</em></span>
            </button>
            <VlogActions liked={likedVlogs.includes(item.title)}
              onLike={() => toggleVlogLike(item.title)}
              onShare={() => onToast('分享按鈕（DEMO 樣式）')}
              onDownload={() => onToast('下載按鈕（DEMO 樣式）')} />
          </article>
        ))}</section> : <EmptyVlog onAction={() => groups[0] && onUnlock(groups[0].id)} />}
      </>}
      {tab === 'mix' && <>
        <ScheduleNote enabled={mixOn} onToggle={setMixOn} label="每週自動生成">
          每週日 <button type="button" disabled={!mixOn} onClick={() => setPicking('mix')}>{formatClock(mixAt)}</button> 由 AI 生成本週混剪<ScheduleTip />
        </ScheduleNote>
        {unlocked ? <section className="mix-stack">{WEEK_MIXES.map(item => (
          <article className="mix-card large" key={item.title}>
            <button type="button" className="vlog-cover-btn" onClick={() => onPlay(item.photos)}>
              <img src={item.cover} alt={item.title} /><span className="card-scrim" /><span className="mix-badge"><Sparkles size={13} />本週混剪</span>
              <span className="mix-play"><Play fill="currentColor" /></span>
              <span className="mix-copy"><strong>{item.title}</strong><small>{item.group} · {item.time}</small></span>
            </button>
            <VlogActions liked={likedVlogs.includes(item.title)}
              onLike={() => toggleVlogLike(item.title)}
              onShare={() => onToast('分享按鈕（DEMO 樣式）')}
              onDownload={() => onToast('下載按鈕（DEMO 樣式）')} />
          </article>
        ))}</section> : <EmptyVlog onAction={() => groups[0] && onUnlock(groups[0].id)} />}
      </>}
      {tab === 'past' && <section className="past-grid">{PHOTO_POOL.slice(14, 18).map((photo, index) => <button key={photo} onClick={() => onPlay(PHOTO_POOL.slice(index, index + 5))}><img src={photo} alt="往期 Vlog" /><Play size={18} fill="currentColor" /><strong>{index + 2} 週前</strong><small>00:{42 + index}</small></button>)}</section>}
      {picking && <TimePicker
        title={picking === 'today' ? '選擇今日生成時間' : '選擇週日生成時間'}
        hint={picking === 'today' ? '只能選擇當天的具體時間' : '只能選擇本週日的具體時間'}
        value={picking === 'today' ? todayAt : mixAt}
        onPick={minutes => {
          if (picking === 'today') setTodayAt(minutes)
          else setMixAt(minutes)
          setPicking(null)
        }}
        onClose={() => setPicking(null)}
      />}
    </Page>
  )
}

/** 当天时刻选择器：以 30 分钟为步长，限制在同一天内。 */
function TimePicker({ title, hint, value, onPick, onClose }: {
  title: string; hint: string; value: number; onPick: (minutes: number) => void; onClose: () => void
}) {
  return <Modal onClose={onClose}><div className="sheet-handle" /><h2>{title}</h2><p className="muted">{hint}</p>
    <div className="time-grid">{DAY_TIME_SLOTS.map(slot => (
      <button key={slot} className={slot === value ? 'active' : ''} onClick={() => onPick(slot)}>{formatClock(slot)}</button>
    ))}</div>
  </Modal>
}

/** 未解锁 Vlog 的引导空态。 */
function EmptyVlog({ onAction }: { onAction: () => void }) {
  return <section className="empty-vlog"><LockKeyhole /><h2>本週故事還鎖著</h2><p>分享 1 張照片，就能看見<br />你和朋友的本週 Vlog。</p><button className="primary" onClick={onAction}><ImagePlus size={18} />去分享</button></section>
}

/** Vlog 卡片操作条：分享、点赞、下载，仅提供按钮样式与本地点赞态。 */
function VlogActions({ liked, onLike, onShare, onDownload }: {
  liked: boolean; onLike: () => void; onShare: () => void; onDownload: () => void
}) {
  return (
    <div className="vlog-actions">
      <button type="button" aria-label="分享" onClick={onShare}><Share2 size={16} /></button>
      <button type="button" aria-label={liked ? '取消讚' : '讚'} aria-pressed={liked} className={liked ? 'liked' : ''} onClick={onLike}>
        <Heart size={16} fill={liked ? 'currentColor' : 'none'} />
      </button>
      <button type="button" aria-label="下載" onClick={onDownload}><Download size={16} /></button>
    </div>
  )
}

/** 伪视频播放器：按照片片段自动播放、暂停和跳转，并逐帧显示 AI 配文。 */
function Player({ photos, copy, captions = [], onBack }: {
  photos: string[]; copy: { title: string; sub: string }; captions?: VlogCaption[]; onBack: () => void
}) {
  const [index, setIndex] = useState(0)
  const [playing, setPlaying] = useState(true)
  const [ended, setEnded] = useState(false)

  useEffect(() => {
    if (!playing || ended) return
    const timer = window.setTimeout(() => {
      if (index >= photos.length - 1) { setPlaying(false); setEnded(true) }
      else setIndex(value => value + 1)
    }, 1800)
    return () => window.clearTimeout(timer)
  }, [index, playing, ended, photos.length])

  /** 切换指定片段并恢复播放。 */
  const jumpTo = (next: number) => {
    setIndex(next)
    setEnded(false)
    setPlaying(true)
  }

  const caption = captions[index]
  return (
    <div className="player"><img key={`${photos[index]}-${index}`} className={`player-image transition-${index % TRANSITION_COUNT}`} src={photos[index]} alt={`Vlog 片段 ${index + 1}`} /><span className="player-scrim" />
      <div className="segment-bar">{photos.map((_, i) => <button aria-label={`跳到片段 ${i + 1}`} key={i} className={i < index ? 'done' : i === index ? 'active' : ''} onClick={() => jumpTo(i)}><i /></button>)}</div>
      <button className="player-back" aria-label="返回" onClick={onBack}><ArrowLeft /></button>
      {!caption && !ended && <div className="mood-title" key={index}>{copy.title}</div>}
      <button className="play-surface" aria-label={playing ? '暫停' : '播放'} onClick={() => setPlaying(value => !value)}>{!playing && !ended && <Pause />}</button>
      {caption && !ended && (
        <div className="vlog-caption" key={`caption-${index}`}>
          <strong>{caption.text}</strong>
          <small><Sparkles size={11} />{caption.meta}</small>
        </div>
      )}
      {ended
        ? <VlogCollage photos={photos} title={copy.title} sub={copy.sub} onReplay={() => jumpTo(0)} />
        : <div className="player-bottom"><div><small>MEMOIR · TODAY</small><p>{copy.sub}</p></div><span className="watermark">Memoir</span></div>}
    </div>
  )
}

/** 片尾拼贴海报：把本条 vlog 的照片拼成一张图，模拟 AI 自动排版的成片封面。 */
function VlogCollage({ photos, title, sub, onReplay }: {
  photos: string[]; title: string; sub: string; onReplay: () => void
}) {
  return (
    <div className="vlog-collage">
      <p className="eyebrow"><Sparkles size={12} />MEMOIR AI · 自動生成</p>
      <h2>{title}</h2>
      <div className="collage-grid">
        {photos.slice(0, 5).map((photo, index) => (
          <figure key={`${photo}-${index}`} style={{ '--i': index } as React.CSSProperties}>
            <img src={photo} alt={`成片拼貼 ${index + 1}`} />
          </figure>
        ))}
      </div>
      <p className="collage-sub">{sub}</p>
      <div className="collage-actions"><span className="watermark">Memoir</span></div>
      <button className="collage-replay" type="button" aria-label="重新播放" onClick={onReplay}><RefreshCw /></button>
    </div>
  )
}

/** 分享预览页：模拟选择外部渠道并反馈成功。 */
function SharePreview({ photo, copy, onBack, onDone }: { photo: string; copy: { title: string; sub: string }; onBack: () => void; onDone: (channel: string) => void }) {
  const [sharing, setSharing] = useState('')
  /** 模拟一秒钟的外部分享过程。 */
  const share = (channel: string) => {
    setSharing(channel)
    window.setTimeout(() => onDone(channel), 1000)
  }
  return (
    <Page className="share-page"><TopBar title="外傳分享" onBack={onBack} /><p className="eyebrow center">SHARE A LITTLE LIFE</p>
      <div className="share-preview"><img src={photo} alt="分享預覽封面" /><span className="card-scrim" /><div><small>THIS WEEK</small><strong>{copy.title}</strong><p>{copy.sub}</p></div><footer>Memoir <i /> 和朋友的照片日記</footer></div>
      <p className="center muted">選擇分享方式</p>
      <div className="share-channels"><button disabled={!!sharing} onClick={() => share('IG Story')}><Send />{sharing === 'IG Story' ? '分享中…' : 'IG Story'}</button><button disabled={!!sharing} onClick={() => share('TikTok')}><Film />{sharing === 'TikTok' ? '分享中…' : 'TikTok'}</button></div>
    </Page>
  )
}

type MemorySort = 'all' | 'time' | 'people' | 'place'

/** 回忆页排序方式：綜合為隨機播放，其餘把同一維度的照片聚在一起依序播放。 */
const MEMORY_SORTS: { id: MemorySort; label: string }[] = [
  { id: 'all', label: '綜合' },
  { id: 'time', label: '按時間' },
  { id: 'people', label: '按人物' },
  { id: 'place', label: '按地點' },
]

/** 回忆页：进场先出示文案再淡出，随后按选定顺序全屏播放照片。 */
function Memories({ hasUnlocked, onToast }: { hasUnlocked: boolean; onToast: (message: string) => void }) {
  const [stills] = useState(buildMemoryStills)
  const [index, setIndex] = useState(0)
  const [playing, setPlaying] = useState(true)
  const [intro, setIntro] = useState(true)
  const [shareOpen, setShareOpen] = useState(false)
  const [sharing, setSharing] = useState('')
  const [sort, setSort] = useState<MemorySort>('all')
  const [sortOpen, setSortOpen] = useState(false)
  const [rolling, setRolling] = useState(false)

  /** 按当前方式排好播放顺序：綜合保持隨機打散，其餘同維度的照片相鄰、再按日期由近到遠。 */
  const ordered = useMemo(() => {
    const list = [...stills]
    if (sort === 'time') return list.sort((a, b) => b.iso.localeCompare(a.iso))
    if (sort === 'people') return list.sort((a, b) => a.people[1].localeCompare(b.people[1]) || b.iso.localeCompare(a.iso))
    if (sort === 'place') return list.sort((a, b) => a.place.localeCompare(b.place) || b.iso.localeCompare(a.iso))
    return list
  }, [stills, sort])

  useEffect(() => {
    if (!hasUnlocked) return
    const timer = window.setTimeout(() => setIntro(false), 1100)
    return () => window.clearTimeout(timer)
  }, [hasUnlocked])

  // 切换排序后顺序整个变了，回到第一张重新播
  useEffect(() => setIndex(0), [sort])

  useEffect(() => {
    if (!hasUnlocked || !playing) return
    const timer = window.setInterval(() => {
      setIndex((current) => {
        if (ordered.length < 2) return current
        if (sort !== 'all') return (current + 1) % ordered.length
        let next = current
        while (next === current) next = Math.floor(Math.random() * ordered.length)
        return next
      })
    }, 1600)
    return () => window.clearInterval(timer)
  }, [hasUnlocked, playing, sort, ordered.length])

  // 下拉展开时，点击页面其他位置或按 Esc 收起
  useEffect(() => {
    if (!sortOpen) return
    const close = () => setSortOpen(false)
    const onKey = (event: KeyboardEvent) => event.key === 'Escape' && setSortOpen(false)
    document.addEventListener('pointerdown', close)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', close)
      document.removeEventListener('keydown', onKey)
    }
  }, [sortOpen])

  /** 选择排序方式并收起下拉，同时关掉分享面板。 */
  const pickSort = (next: MemorySort) => {
    setSort(next)
    setSortOpen(false)
    setShareOpen(false)
  }

  /** 骰子：随机换一张回忆，并播放一次转动动画。 */
  const rollDice = () => {
    setShareOpen(false)
    setRolling(true)
    window.setTimeout(() => setRolling(false), 520)
    setIndex((current) => {
      if (ordered.length < 2) return current
      let next = current
      while (next === current) next = Math.floor(Math.random() * ordered.length)
      return next
    })
  }

  /** 播放中点暂停冻住当前图；从暂停恢复时收起分享面板。 */
  const togglePlayback = () => {
    setShareOpen(false)
    setPlaying(value => !value)
  }

  /** 模拟把当前回忆分享到外部渠道。 */
  const shareStill = (channel: string) => {
    setSharing(channel)
    window.setTimeout(() => {
      setSharing('')
      setShareOpen(false)
      onToast(`已分享到 ${channel}（DEMO 模擬）`)
    }, 800)
  }

  if (!hasUnlocked) {
    return (
      <Page className="memory-page">
        <header className="page-header"><p className="eyebrow">A LITTLE TIME MACHINE</p><h1>回憶</h1></header>
        <section className="empty"><BookImage size={42} /><h2>還沒有解鎖過任何一週</h2><p>分享照片後，回憶會慢慢住進這裡。</p></section>
      </Page>
    )
  }

  const still = ordered[index] ?? ordered[0]
  const sortLabel = MEMORY_SORTS.find(item => item.id === sort)?.label ?? '綜合'
  return (
    <Page className="memory-page is-theater">
      <div className="memory-stage">
        <img key={still.src} src={still.src} alt={`${still.label} 的回憶`} />
        <span className="memory-scrim" />
        <div className="memory-topbar">
          <time className="memory-date" dateTime={still.iso}>{still.label}</time>
          <div className="memory-sort" onPointerDown={event => event.stopPropagation()}>
            <button type="button" className={sort === 'all' ? '' : 'active'} aria-label="選擇回憶排列方式" aria-expanded={sortOpen}
              onClick={() => setSortOpen(value => !value)}>
              {sortLabel}<ChevronDown size={14} />
            </button>
            {sortOpen && (
              <div className="memory-sort-menu" role="listbox" aria-label="回憶排列方式">
                {MEMORY_SORTS.map(item => (
                  <button type="button" key={item.id} className={sort === item.id ? 'active' : ''} onClick={() => pickSort(item.id)}>
                    {item.label}{sort === item.id && <Check size={13} />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        {intro && (
          <div className="memory-intro">
            <h1>回憶精彩的每一個瞬間</h1>
          </div>
        )}
        <div className="memory-controls">
          {!playing && <button type="button" aria-label="分享" onClick={() => setShareOpen(true)}><Share2 /></button>}
          <button type="button" aria-label={playing ? '暫停' : '繼續播放'} onClick={togglePlayback}>
            {playing ? <Pause /> : <Play fill="currentColor" />}
          </button>
          {!playing && <button type="button" className={`memory-dice ${rolling ? 'is-rolling' : ''}`} aria-label="隨機換一張回憶" onClick={rollDice}><Dices /></button>}
        </div>
      </div>
      {shareOpen && <Modal onClose={() => !sharing && setShareOpen(false)}>
        <div className="sheet-handle" />
        <h2>分享這張回憶</h2>
        <p className="muted">把這一幀發給外面的人看。</p>
        <div className="share-channels">
          <button disabled={!!sharing} onClick={() => shareStill('IG Story')}><Send />{sharing === 'IG Story' ? '分享中…' : 'IG Story'}</button>
          <button disabled={!!sharing} onClick={() => shareStill('TikTok')}><Film />{sharing === 'TikTok' ? '分享中…' : 'TikTok'}</button>
        </div>
      </Modal>}
    </Page>
  )
}

/** 设置页：管理语言、权限与画面方向锁定。 */
function Settings({ language, permission, onLanguage, onPermission }: {
  language: Language; permission: boolean; onLanguage: (lang: Language) => void; onPermission: () => void
}) {
  const [orientation, setOrientation] = useState(true)
  return (
    <Page><header className="page-header"><p className="eyebrow">YOUR MEMOIR</p><h1>我的</h1></header>
      <section className="profile-card"><div className="profile-avatar">你</div><div><strong>Memoir 朋友</strong><small>本週也在好好生活</small></div><ChevronRight /></section>
      <div className="settings-section"><h2>偏好設定</h2><div className="setting-list">
        <div><Languages /><span><strong>語言</strong><small>情緒短句與介面語言</small></span><select aria-label="語言" value={language} onChange={event => onLanguage(event.target.value as Language)}><option value="zh">繁體中文</option><option value="ja">日本語</option><option value="ko">한국어</option></select></div>
        <button onClick={onPermission}><Images /><span><strong>相片權限</strong><small>{permission ? '已允許存取' : '尚未允許'}</small></span><em className={permission ? 'ok' : ''}>{permission ? '已開啟' : '去開啟'}</em></button>
        <div><RotateCw /><span><strong>畫面方向</strong><small>全程保持直向瀏覽</small></span><Toggle value={orientation} onChange={setOrientation} /></div>
        <div><BellOff /><span><strong>每週推送</strong><small>DEMO 暫不提供推送</small></span><em>未提供</em></div>
      </div></div>
      <div className="settings-section"><h2>關於</h2><div className="setting-list"><div><ShieldCheck /><span><strong>隱私與安全</strong><small>內容僅 group 內可見</small></span><ChevronRight /></div><div><Settings2 /><span><strong>Memoir</strong><small>H5 DEMO · v0.1</small></span></div></div></div>
    </Page>
  )
}

/** 底部主导航：在四个一级页面间切换。 */
function BottomNav({ active, onChange }: { active: Route; onChange: (route: Route) => void }) {
  const items: { id: Route; label: string; icon: typeof Images }[] = [
    { id: 'home', label: 'Group', icon: Users }, { id: 'vlogs', label: 'Vlog', icon: Film },
    { id: 'memories', label: '回憶', icon: BookImage }, { id: 'settings', label: '我的', icon: CircleUserRound },
  ]
  // 回忆页是全屏深色照片，线条图标切换到浅色
  return <nav className={`bottom-nav ${active === 'memories' ? 'on-dark' : ''}`}>{items.map(item => {
    const isActive = active === item.id
    return <button key={item.id} className={isActive ? 'active' : ''} aria-label={item.label}
      aria-current={isActive ? 'page' : undefined} onClick={() => onChange(item.id)}>
      <item.icon strokeWidth={isActive ? 2 : 1.5} />
    </button>
  })}</nav>
}

/** 点赞按钮：爱心 + 数量，照片墙缩略图和大图弹层共用。 */
function LikeButton({ liked, count, compact = false, onToggle }: {
  liked: boolean; count: number; compact?: boolean; onToggle: () => void
}) {
  return (
    <button type="button" className={`like-btn ${compact ? 'compact' : ''} ${liked ? 'liked' : ''}`}
      aria-label={liked ? `取消讚，目前 ${count} 個讚` : `讚，目前 ${count} 個讚`}
      aria-pressed={liked} onClick={(event) => { event.stopPropagation(); onToggle() }}>
      <Heart size={compact ? 12 : 18} fill={liked ? 'currentColor' : 'none'} />
      <span>{count}</span>
    </button>
  )
}

/** 通用页面容器，统一底部安全区。 */
function Page({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`page ${className}`}>{children}</div>
}

/** 二级页顶部导航栏。 */
function TopBar({ title, onBack, right }: { title: string; onBack: () => void; right?: React.ReactNode }) {
  return <header className="top-bar"><button aria-label="返回" onClick={onBack}><ArrowLeft /></button><strong>{title}</strong><span>{right}</span></header>
}

/** 权限引导弹窗：模拟 H5 的相册授权流程。 */
function PermissionModal({ onAllow, onLater }: { onAllow: () => void; onLater: () => void }) {
  return <Modal onClose={onLater}><div className="permission-icon"><Images /></div><h2>Memoir 想存取你的照片</h2><p>用來生成你的每日 vlog。照片只會分享給你選擇的 group。</p><button className="primary wide" onClick={onAllow}>允許</button><button className="ghost wide" onClick={onLater}>之後再說</button></Modal>
}

/** 通用底部弹层，支持点击遮罩关闭。 */
function Modal({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return <div className="modal-scrim" onMouseDown={event => event.target === event.currentTarget && onClose()}><section className="modal-sheet">{children}</section></div>
}

/** 破坏性操作确认弹窗。 */
function Confirm({ title, text, confirm, onCancel, onConfirm }: { title: string; text: string; confirm: string; onCancel: () => void; onConfirm: () => void }) {
  return <div className="modal-scrim"><section className="confirm-box"><Trash2 /><h2>{title}</h2><p>{text}</p><div><button className="secondary" onClick={onCancel}>取消</button><button className="danger" onClick={onConfirm}>{confirm}</button></div></section></div>
}

/** 布尔开关组件。 */
function Toggle({ value, onChange, label }: { value: boolean; onChange: (value: boolean) => void; label?: string }) {
  return <button type="button" aria-label={label ?? (value ? '關閉' : '開啟')} aria-pressed={value} className={`toggle ${value ? 'on' : ''}`} onClick={() => onChange(!value)}><i /></button>
}
