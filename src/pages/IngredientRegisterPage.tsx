import { useState, type FormEvent } from 'react'
import { Icon } from '../components/Icon'
import { Topbar } from '../components/Topbar'
import type { AppDestination } from '../types/ui'

/** 登録方法: 手入力 or 画像認識（UIモック） */
type RegisterMethod = 'manual' | 'image'

type IngredientRegisterPageProps = {
  onNavigate?: (page: AppDestination) => void
  onLogout?: () => void | Promise<void>
  /** 詳細登録画面へ渡すときに App から受け取る */
  onContinue?: (names: string[]) => void
}

const defaultNames = ''

/** テキストエリアの改行区切りを食材名の配列に変換する */
function parseIngredientNames(value: string) {
  return value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
}

/**
 * 食材登録（ステップ1）
 * 食材名の入力のみ。数量・期限などは詳細登録画面で扱う。
 */
export function IngredientRegisterPage({
  onNavigate,
  onLogout,
  onContinue,
}: IngredientRegisterPageProps) {
  const [method, setMethod] = useState<RegisterMethod>('manual')
  const [namesText, setNamesText] = useState(defaultNames)
  const [statusMessage, setStatusMessage] = useState('')

  function handleContinue(names: string[]) {
    if (!names.length) {
      setStatusMessage('食材名を1件以上入力してください')
      return
    }

    setStatusMessage('')

    if (onContinue) {
      onContinue(names)
      return
    }

    setStatusMessage('詳細登録画面は準備中です')
  }

  function handleManualSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    handleContinue(parseIngredientNames(namesText))
  }

  return (
    <div className="app-shell">
      <Topbar onNavigate={onNavigate} onLogout={onLogout} />

      <main className="ingredient-register-page">
        <div className="fridge-header">
          <div>
            <p className="eyebrow">食材登録</p>
            <h1>食材登録</h1>
            <p className="ingredient-register-page__lead">
              冷蔵庫に追加する食材名を入力してください。
            </p>
          </div>
          <button
            type="button"
            className="secondary-button back-home-button"
            onClick={() => onNavigate?.('home')}
          >
            ホームに戻る
          </button>
        </div>

        {statusMessage ? (
          <p className="status-message" role="status">
            {statusMessage}
          </p>
        ) : null}

        <section className="panel register-card" aria-labelledby="input-method-title">
          <h2 className="register-card__title" id="input-method-title">
            登録方法を選ぶ
          </h2>
          <p className="register-card__desc">
            手入力するか、レシート・食材の画像からAIで読み取って追加できます。
          </p>

          <div
            className="register-method-labels register-method-labels--two"
            role="tablist"
            aria-label="登録方法"
          >
            <button
              type="button"
              role="tab"
              aria-selected={method === 'manual'}
              aria-controls="panel-manual"
              className={`register-method-label ${
                method === 'manual' ? 'is-active' : ''
              }`}
              onClick={() => setMethod('manual')}
            >
              <span className="register-method-label__icon" aria-hidden="true">
                ✏️
              </span>
              手入力
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={method === 'image'}
              aria-controls="panel-image"
              className={`register-method-label ${
                method === 'image' ? 'is-active' : ''
              }`}
              onClick={() => setMethod('image')}
            >
              <span className="register-method-label__icon" aria-hidden="true">
                📷
              </span>
              画像認識
              <span className="register-method-label__sub">レシート・食材</span>
            </button>
          </div>

          {method === 'manual' ? (
            <div id="panel-manual" role="tabpanel" aria-labelledby="method-manual">
              <form onSubmit={handleManualSubmit}>
                <div className="register-field">
                  <label htmlFor="ingredient-names">
                    食材名（複数可） <span aria-hidden="true">*</span>
                  </label>
                  <textarea
                    id="ingredient-names"
                    name="names"
                    value={namesText}
                    onChange={(event) => setNamesText(event.target.value)}
                    placeholder={'例：鮭切り身\n小松菜\n牛乳'}
                    required
                  />
                  <span className="register-field__hint">
                    複数入力する場合は改行して入力してください。
                  </span>
                </div>

                <div className="register-form-actions">
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={() => onNavigate?.('home')}
                  >
                    キャンセル
                  </button>
                  <button type="submit" className="primary-button">
                    詳細を入力する
                    <Icon name="arrow" />
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div id="panel-image" role="tabpanel" aria-labelledby="method-image">
              <p className="register-image-lead">
                読み取りたい種類を選んで、写真を撮影またはアップロードしてください。
              </p>
              <div className="register-upload-grid">
                <button
                  type="button"
                  className="register-upload-zone"
                  onClick={() => onNavigate?.('receipt')}
                >
                  <span className="register-upload-zone__badge">レシート</span>
                  <strong>レシートを撮影</strong>
                  <span>購入した食材をまとめて読み取り</span>
                  <span className="register-upload-zone__note">
                    JPEG / PNG（最大 10MB）
                  </span>
                </button>
                <button
                  type="button"
                  className="register-upload-zone"
                  onClick={() => onNavigate?.('receipt')}
                >
                  <span className="register-upload-zone__badge">食材</span>
                  <strong>食材を撮影</strong>
                  <span>AIが食材名を推定</span>
                  <span className="register-upload-zone__note">
                    JPEG / PNG（最大 10MB）
                  </span>
                </button>
              </div>
              <p className="register-image-mock">
                ※ 画像認識はレシート撮影画面で行えます
              </p>

              <div className="register-form-actions">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => onNavigate?.('home')}
                >
                  キャンセル
                </button>
                <button
                  type="button"
                  className="primary-button"
                  onClick={() => onNavigate?.('receipt')}
                >
                  レシート撮影へ
                  <Icon name="arrow" />
                </button>
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  )
}
