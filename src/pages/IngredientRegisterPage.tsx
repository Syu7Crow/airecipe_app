import { useState, type FormEvent } from 'react'
import { Icon } from '../components/Icon'
import { Topbar } from '../components/Topbar'
import { generateGeminiContent } from '../lib/geminiApi'
import type { AppDestination, ReceiptIngredientCandidate } from '../types/ui'

/** 登録方法: 手入力 or 画像認識（UIモック） */
type RegisterMethod = 'manual' | 'image'

type IngredientRegisterPageProps = {
  onNavigate?: (page: AppDestination) => void
  onLogout?: () => void | Promise<void>
  /** 詳細登録画面へ渡すときに App から受け取る */
  onContinue?: (names: string[]) => void
  onContinueCandidates?: (items: ReceiptIngredientCandidate[]) => void
}

const defaultNames = ''
const foodRecognitionModel = 'gemma-4-31b-it'

const foodRecognitionPrompt = `画像に写っている食品・食材だけを抽出してください。
レシート、値札、食器、調理器具、背景、人物は食材として扱わないでください。
返答はJSONのみ。Markdown、説明文、コードフェンスは禁止。

カテゴリは次から選んでください: 肉・卵・魚, 野菜, 乳製品, 加工品, その他
個数が推定できる場合は quantity、重量や容量が推定できる場合は gram に数値を入れてください。不明なら null にしてください。

形式:
{
  "items": [
    {
      "name": "食材名",
      "category": "野菜",
      "quantity": 1,
      "gram": null,
      "memo": "画像認識"
    }
  ]
}`

/** テキストエリアの改行区切りを食材名の配列に変換する */
function parseIngredientNames(value: string) {
  return value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
}

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result ?? ''))
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

function parseJsonFromModel(text: string) {
  const normalized = text
    .trim()
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/i, '')

  try {
    return JSON.parse(normalized)
  } catch {
    const start = normalized.indexOf('{')
    const end = normalized.lastIndexOf('}')

    if (start === -1 || end === -1 || end <= start) {
      throw new Error('Gemmaの返答をJSONとして読み取れませんでした')
    }

    return JSON.parse(normalized.slice(start, end + 1))
  }
}

function normalizeFoodCandidates(payload: unknown): ReceiptIngredientCandidate[] {
  const items = Array.isArray((payload as { items?: unknown }).items)
    ? ((payload as { items: unknown[] }).items)
    : []

  return items
    .map((item, index) => {
      const source = item as Record<string, unknown>
      const name = String(source.name ?? '').trim()

      if (!name) {
        return null
      }

      const quantity = Number(source.quantity)
      const gram = Number(source.gram)

      const candidate: ReceiptIngredientCandidate = {
        id: `food-image-${index + 1}`,
        name,
        category: String(source.category ?? 'その他').trim() || 'その他',
        quantity: Number.isFinite(quantity) && quantity > 0 ? quantity : null,
        gram: Number.isFinite(gram) && gram > 0 ? Math.round(gram) : null,
        expirationDate: null,
        bestBeforeDate: null,
        memo: String(source.memo ?? '画像認識').trim() || '画像認識',
        selected: true,
        sourceLine: '画像認識',
      }

      return candidate
    })
    .filter((item): item is ReceiptIngredientCandidate => Boolean(item))
}

/**
 * 食材登録（ステップ1）
 * 食材名の入力のみ。数量・期限などは詳細登録画面で扱う。
 */
export function IngredientRegisterPage({
  onNavigate,
  onLogout,
  onContinue,
  onContinueCandidates,
}: IngredientRegisterPageProps) {
  const [method, setMethod] = useState<RegisterMethod>('manual')
  const [namesText, setNamesText] = useState(defaultNames)
  const [statusMessage, setStatusMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [imagePreviewUrl, setImagePreviewUrl] = useState('')
  const [isRecognizing, setIsRecognizing] = useState(false)
  const [recognizedItems, setRecognizedItems] = useState<
    ReceiptIngredientCandidate[]
  >([])

  function handleContinue(names: string[]) {
    if (!names.length) {
      setStatusMessage('食材名を1件以上入力してください')
      return
    }

    setStatusMessage('')
    setErrorMessage('')

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

  async function handleFoodImageChange(file: File | null) {
    if (!file) {
      return
    }

    setImagePreviewUrl(URL.createObjectURL(file))
    setRecognizedItems([])
    setStatusMessage('Gemmaで食材を読み取っています...')
    setErrorMessage('')
    setIsRecognizing(true)

    try {
      const imageBase64 = await readFileAsDataUrl(file)
      const result = await generateGeminiContent({
        prompt: foodRecognitionPrompt,
        imageBase64,
        mimeType: file.type || 'image/jpeg',
        model: foodRecognitionModel,
      })
      const items = normalizeFoodCandidates(parseJsonFromModel(result.text))

      if (!items.length) {
        setErrorMessage('食材を認識できませんでした。別の画像で試してください。')
        setStatusMessage('')
        return
      }

      setRecognizedItems(items)
      setStatusMessage(`${items.length}件の食材候補を認識しました`)
    } catch (error) {
      console.error('[vite] Food image recognition failed:', error)
      setErrorMessage(
        error instanceof Error
          ? error.message
          : '食材画像の認識に失敗しました',
      )
      setStatusMessage('')
    } finally {
      setIsRecognizing(false)
    }
  }

  function toggleRecognizedItem(index: number, selected: boolean) {
    setRecognizedItems((current) =>
      current.map((item, itemIndex) =>
        itemIndex === index ? { ...item, selected } : item,
      ),
    )
  }

  function continueWithRecognizedItems() {
    const selectedItems = recognizedItems.filter((item) => item.selected)

    if (!selectedItems.length) {
      setErrorMessage('詳細登録に進む食材を選択してください')
      return
    }

    setErrorMessage('')

    if (onContinueCandidates) {
      onContinueCandidates(selectedItems)
      return
    }

    handleContinue(selectedItems.map((item) => item.name))
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

        {errorMessage ? (
          <p className="status-message" role="alert">
            {errorMessage}
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
                レシートは専用画面へ、食材写真はこの画面でGemmaが食材候補を読み取ります。
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
                <label className="register-upload-zone">
                  <input
                    className="register-upload-zone__input"
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={(event) =>
                      void handleFoodImageChange(
                        event.currentTarget.files?.[0] ?? null,
                      )
                    }
                  />
                  <span className="register-upload-zone__badge">食材</span>
                  <strong>食材を撮影</strong>
                  <span>Gemmaが食材名・カテゴリを推定</span>
                  <span className="register-upload-zone__note">
                    JPEG / PNG（最大 10MB）
                  </span>
                </label>
              </div>

              {imagePreviewUrl ? (
                <img
                  className="register-image-preview"
                  src={imagePreviewUrl}
                  alt="認識する食材画像"
                />
              ) : null}

              {recognizedItems.length ? (
                <div className="register-recognition-result">
                  <h3>認識した食材候補</h3>
                  <div className="register-recognition-list">
                    {recognizedItems.map((item, index) => (
                      <label
                        key={item.id ?? `${item.name}-${index}`}
                        className="register-recognition-item"
                      >
                        <input
                          type="checkbox"
                          checked={item.selected}
                          onChange={(event) =>
                            toggleRecognizedItem(
                              index,
                              event.currentTarget.checked,
                            )
                          }
                        />
                        <span>
                          <strong>{item.name}</strong>
                          <small>
                            {item.category}
                            {item.quantity ? ` / ${item.quantity}個` : ''}
                            {item.gram ? ` / ${item.gram}g/ml` : ''}
                          </small>
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              ) : null}

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
                  onClick={continueWithRecognizedItems}
                  disabled={isRecognizing || !recognizedItems.length}
                >
                  {isRecognizing ? '認識中...' : '詳細を入力する'}
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
