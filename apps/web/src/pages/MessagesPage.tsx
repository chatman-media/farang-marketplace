import { useRef, useState } from "react"
import { useSearchParams } from "react-router-dom"

interface Message {
  id: string
  from: "me" | "them"
  text: string
  ts: string
}

interface Conversation {
  id: string
  name: string
  avatar?: string
  listingTitle: string
  lastMessage: string
  lastTs: string
  unread: number
  messages: Message[]
}

// Demo data so the page looks functional
const DEMO: Conversation[] = [
  {
    id: "1",
    name: "Somchai W.",
    listingTitle: "Honda PCX 150 2022",
    lastMessage: "Ещё доступно?",
    lastTs: "2026-06-14T10:30:00Z",
    unread: 1,
    messages: [{ id: "m1", from: "them", text: "Здравствуйте! Ещё доступно?", ts: "2026-06-14T10:30:00Z" }],
  },
  {
    id: "2",
    name: "Nong P.",
    listingTitle: "Аренда байка Phuket",
    lastMessage: "Хорошо, договорились!",
    lastTs: "2026-06-13T18:00:00Z",
    unread: 0,
    messages: [
      {
        id: "m2",
        from: "them",
        text: "Добрый день, мотоцикл ещё доступен на следующей неделе?",
        ts: "2026-06-13T17:50:00Z",
      },
      { id: "m3", from: "me", text: "Да, с 16 по 20 число есть.", ts: "2026-06-13T17:55:00Z" },
      { id: "m4", from: "them", text: "Хорошо, договорились!", ts: "2026-06-13T18:00:00Z" },
    ],
  },
]

function timeLabel(ts: string) {
  const d = new Date(ts)
  const now = new Date()
  const isToday = d.toDateString() === now.toDateString()
  if (isToday) return d.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })
  return d.toLocaleDateString("ru-RU", { day: "numeric", month: "short" })
}

export function MessagesPage() {
  const [searchParams] = useSearchParams()
  const [convs, setConvs] = useState<Conversation[]>(DEMO)
  const [activeId, setActiveId] = useState<string | null>(convs[0]?.id ?? null)
  const [draft, setDraft] = useState("")
  const bottomRef = useRef<HTMLDivElement>(null)

  const active = convs.find((c) => c.id === activeId)

  const send = () => {
    if (!draft.trim() || !activeId) return
    const msg: Message = {
      id: Date.now().toString(),
      from: "me",
      text: draft.trim(),
      ts: new Date().toISOString(),
    }
    setConvs((prev) =>
      prev.map((c) =>
        c.id === activeId ? { ...c, messages: [...c.messages, msg], lastMessage: msg.text, lastTs: msg.ts } : c,
      ),
    )
    setDraft("")
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50)
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-5">Сообщения</h1>

      <div className="flex gap-4 h-[600px] bg-white rounded-2xl border border-gray-200 overflow-hidden">
        {/* Conversation list */}
        <div className="w-72 shrink-0 border-r border-gray-100 overflow-y-auto">
          {convs.length === 0 && <div className="p-6 text-center text-gray-400 text-sm">Нет диалогов</div>}
          {convs.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => {
                setActiveId(c.id)
                setConvs((prev) => prev.map((x) => (x.id === c.id ? { ...x, unread: 0 } : x)))
              }}
              className={[
                "w-full text-left px-4 py-3 border-b border-gray-50 hover:bg-gray-50 transition-colors",
                activeId === c.id ? "bg-primary-50" : "",
              ].join(" ")}
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-sm font-semibold shrink-0">
                  {c.name[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm text-gray-900 truncate">{c.name}</span>
                    <span className="text-xs text-gray-400 shrink-0 ml-1">{timeLabel(c.lastTs)}</span>
                  </div>
                  <p className="text-xs text-gray-400 truncate">{c.listingTitle}</p>
                  <p className="text-xs text-gray-600 truncate">{c.lastMessage}</p>
                </div>
                {c.unread > 0 && (
                  <span className="bg-primary-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center shrink-0">
                    {c.unread}
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>

        {/* Thread */}
        <div className="flex-1 flex flex-col min-w-0">
          {active ? (
            <>
              {/* Thread header */}
              <div className="px-4 py-3 border-b border-gray-100">
                <p className="font-medium text-gray-900 text-sm">{active.name}</p>
                <p className="text-xs text-gray-400">{active.listingTitle}</p>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {active.messages.map((m) => (
                  <div key={m.id} className={["flex", m.from === "me" ? "justify-end" : "justify-start"].join(" ")}>
                    <div
                      className={[
                        "max-w-[70%] rounded-2xl px-3.5 py-2 text-sm leading-relaxed",
                        m.from === "me"
                          ? "bg-primary-600 text-white rounded-br-sm"
                          : "bg-gray-100 text-gray-900 rounded-bl-sm",
                      ].join(" ")}
                    >
                      {m.text}
                      <div
                        className={[
                          "text-xs mt-0.5 text-right",
                          m.from === "me" ? "text-primary-200" : "text-gray-400",
                        ].join(" ")}
                      >
                        {timeLabel(m.ts)}
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={bottomRef} />
              </div>

              {/* Input */}
              <div className="p-3 border-t border-gray-100 flex gap-2">
                <input
                  type="text"
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send()}
                  placeholder="Написать сообщение..."
                  className="flex-1 rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
                />
                <button
                  type="button"
                  onClick={send}
                  disabled={!draft.trim()}
                  className="px-3 py-2 rounded-xl bg-primary-600 hover:bg-primary-700 text-white disabled:opacity-40 transition-colors"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                    />
                  </svg>
                </button>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">Выберите диалог</div>
          )}
        </div>
      </div>
    </div>
  )
}
