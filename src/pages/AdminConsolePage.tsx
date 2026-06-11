import { useEffect, useState, type FormEvent } from 'react'
import { Icon } from '../components/Icon'
import {
  fetchAdminContactMessages,
  sendAdminContactReply,
  type ContactMessage,
} from '../lib/contactApi'
import { useI18n } from '../lib/useI18n'
import type { AuthUser } from '../lib/authApi'
import type { AppDestination } from '../types/ui'

type AdminConsolePageProps = {
  user: AuthUser
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

export function AdminConsolePage({
  user,
  onNavigate,
}: AdminConsolePageProps) {
  const { t } = useI18n()
  const [messages, setMessages] = useState<ContactMessage[]>([])
  const [isLoading, setIsLoading] = useState(user.isAdmin)
  const [errorMessage, setErrorMessage] = useState('')
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({})
  const [replyFeedback, setReplyFeedback] = useState<Record<string, string>>({})
  const [sendingReplyId, setSendingReplyId] = useState<string | null>(null)

  useEffect(() => {
    if (!user.isAdmin) {
      return
    }

    let isMounted = true

    fetchAdminContactMessages()
      .then((result) => {
        if (isMounted) {
          setMessages(result.contactMessages)
          setIsLoading(false)
        }
      })
      .catch((error) => {
        console.error('[vite] Admin contact fetch failed:', error)
        if (isMounted) {
          setErrorMessage(
            error instanceof Error ? error.message : t('admin.fetchFailed'),
          )
          setIsLoading(false)
        }
      })

    return () => {
      isMounted = false
    }
  }, [t, user.isAdmin])

  async function handleReplySubmit(
    event: FormEvent,
    message: ContactMessage,
  ) {
    event.preventDefault()

    const body = replyDrafts[message.contactId]?.trim() ?? ''

    if (!body) {
      setReplyFeedback((current) => ({
        ...current,
        [message.contactId]: t('admin.replyRequired'),
      }))
      return
    }

    setSendingReplyId(message.contactId)
    setReplyFeedback((current) => ({
      ...current,
      [message.contactId]: '',
    }))

    try {
      await sendAdminContactReply({
        contactId: message.contactId,
        title: t('message.replyTitle', { subject: message.subject }),
        body,
      })
      setMessages((current) =>
        current.map((item) =>
          item.contactId === message.contactId
            ? { ...item, status: 'replied', updatedAt: new Date().toISOString() }
            : item,
        ),
      )
      setReplyDrafts((current) => ({ ...current, [message.contactId]: '' }))
      setReplyFeedback((current) => ({
        ...current,
        [message.contactId]: t('admin.replySuccess'),
      }))
    } catch (error) {
      console.error('[vite] Admin contact reply failed:', error)
      setReplyFeedback((current) => ({
        ...current,
        [message.contactId]:
          error instanceof Error ? error.message : t('admin.replyFailed'),
      }))
    } finally {
      setSendingReplyId(null)
    }
  }

  return (
    <>
      <main className="settings-page admin-page">
        <div className="fridge-header">
          <div>
            <p className="eyebrow">{t('admin.eyebrow')}</p>
            <h1>{t('admin.title')}</h1>
            <p className="settings-lead">{t('admin.subtitle')}</p>
          </div>
          <button
            type="button"
            className="secondary-button back-home-button"
            onClick={() => onNavigate?.('home')}
          >
            <div style={{ transform: 'scaleX(-1)', display: 'inline-flex' }}>
              <Icon name="arrow" />
            </div>
            <span>{t('common.backHome')}</span>
          </button>
        </div>

        {!user.isAdmin ? (
          <section className="panel settings-section">
            <p className="status-message error-message" role="alert">
              {t('admin.forbidden')}
            </p>
          </section>
        ) : (
          <section className="panel settings-section admin-console">
            <div className="section-heading">
              <div>
                <p className="eyebrow">{t('admin.contactEyebrow')}</p>
                <h2>{t('admin.contactTitle')}</h2>
              </div>
              <span className="status-pill">
                {t('admin.contactCount', { count: messages.length })}
              </span>
            </div>

            {isLoading ? (
              <p className="status-message" role="status">
                {t('admin.loading')}
              </p>
            ) : null}

            {errorMessage ? (
              <p className="status-message error-message" role="alert">
                {errorMessage}
              </p>
            ) : null}

            {!isLoading && !errorMessage && messages.length === 0 ? (
              <p className="settings-note">{t('admin.empty')}</p>
            ) : null}

            <div className="admin-message-list">
              {messages.map((message) => (
                <article className="admin-message-card" key={message.contactId}>
                  <div className="admin-message-card__header">
                    <div>
                      <h3>{message.subject}</h3>
                      <p>
                        {message.userEmail ?? t('admin.unknownUser')} /{' '}
                        {formatDateTime(message.createdAt)}
                      </p>
                    </div>
                    <span className="status-pill">{message.status}</span>
                  </div>
                  <p className="admin-message-card__body">{message.message}</p>
                  {message.pageUrl ? (
                    <p className="admin-message-card__meta">
                      {t('admin.pageUrl')}: {message.pageUrl}
                    </p>
                  ) : null}
                  <form
                    className="admin-reply-form"
                    onSubmit={(event) => handleReplySubmit(event, message)}
                  >
                    <label htmlFor={`reply-${message.contactId}`}>
                      {t('admin.replyLabel')}
                    </label>
                    <textarea
                      id={`reply-${message.contactId}`}
                      rows={4}
                      value={replyDrafts[message.contactId] ?? ''}
                      placeholder={t('admin.replyPlaceholder')}
                      disabled={sendingReplyId === message.contactId}
                      onChange={(event) =>
                        setReplyDrafts((current) => ({
                          ...current,
                          [message.contactId]: event.target.value,
                        }))
                      }
                    />
                    {replyFeedback[message.contactId] ? (
                      <p className="settings-note">
                        {replyFeedback[message.contactId]}
                      </p>
                    ) : null}
                    <button
                      type="submit"
                      className="primary-button settings-save-button"
                      disabled={sendingReplyId === message.contactId}
                    >
                      {sendingReplyId === message.contactId
                        ? t('admin.replySending')
                        : t('admin.replySubmit')}
                    </button>
                  </form>
                </article>
              ))}
            </div>
          </section>
        )}
      </main>
    </>
  )
}
