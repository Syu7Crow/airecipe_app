import { useEffect, useState } from 'react'
import { Icon } from '../components/Icon'
import {
  fetchUserMessages,
  markUserMessagesRead,
  type UserMessage,
} from '../lib/contactApi'
import { useI18n } from '../lib/useI18n'
import type { AppDestination } from '../types/ui'

type MessagesPageProps = {
  onNavigate?: (page: AppDestination) => void
  onLogout?: () => void | Promise<void>
}

function formatDateTime(value: string) {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

export function MessagesPage({ onNavigate }: MessagesPageProps) {
  const { t } = useI18n()
  const [messages, setMessages] = useState<UserMessage[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    let isMounted = true

    fetchUserMessages()
      .then(async (result) => {
        const unreadIds = result.messages
          .filter((message) => !message.readAt)
          .map((message) => message.messageId)
        const nextMessages = unreadIds.length
          ? (await markUserMessagesRead(unreadIds)).messages
          : result.messages

        if (isMounted) {
          setMessages(nextMessages)
          setErrorMessage('')
          setIsLoading(false)
          window.dispatchEvent(new Event('messages-updated'))
        }
      })
      .catch((error) => {
        console.error('[vite] User messages fetch failed:', error)
        if (isMounted) {
          setErrorMessage(
            error instanceof Error ? error.message : t('message.fetchFailed'),
          )
          setIsLoading(false)
        }
      })

    return () => {
      isMounted = false
    }
  }, [t])

  return (
    <main className="settings-page messages-page">
      <div className="fridge-header">
        <div>
          <p className="eyebrow">{t('message.eyebrow')}</p>
          <h1>{t('message.title')}</h1>
          <p className="settings-lead">{t('message.subtitle')}</p>
        </div>
        <button
          type="button"
          className="secondary-button back-home-button"
          onClick={() => onNavigate?.('settings')}
        >
          <div style={{ transform: 'scaleX(-1)', display: 'inline-flex' }}>
            <Icon name="arrow" />
          </div>
          <span>{t('message.backSettings')}</span>
        </button>
      </div>

      <section className="panel settings-section messages-panel">
        <div className="section-heading">
          <div>
            <p className="eyebrow">{t('message.listEyebrow')}</p>
            <h2>{t('message.listTitle')}</h2>
          </div>
          <span className="status-pill">
            {t('message.count', { count: messages.length })}
          </span>
        </div>

        {isLoading ? (
          <p className="status-message" role="status">
            {t('message.loading')}
          </p>
        ) : null}

        {errorMessage ? (
          <p className="status-message error-message" role="alert">
            {errorMessage}
          </p>
        ) : null}

        {!isLoading && !errorMessage && messages.length === 0 ? (
          <p className="settings-note">{t('message.empty')}</p>
        ) : null}

        <div className="user-message-list">
          {messages.map((message) => (
            <article className="user-message-card" key={message.messageId}>
              <div className="admin-message-card__header">
                <div>
                  <h3>{message.title}</h3>
                  <p>{formatDateTime(message.createdAt)}</p>
                </div>
                <span className="status-pill">
                  {message.readAt ? t('message.read') : t('message.unread')}
                </span>
              </div>
              <p className="admin-message-card__body">{message.body}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  )
}
