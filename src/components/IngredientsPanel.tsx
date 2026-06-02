import type { Ingredient } from '../types/ui'

export function IngredientsPanel({
  ingredients,
  onAddIngredient,
}: {
  ingredients: Ingredient[]
  onAddIngredient?: () => void
}) {
  return (
    <section className="panel" id="ingredients" aria-labelledby="ingredients-title">
      <div className="section-heading">
        <div>
          <p className="eyebrow">在庫管理</p>
          <h2 id="ingredients-title">登録済みの食材</h2>
        </div>
        <button type="button" className="small-button" onClick={onAddIngredient}>
          登録
        </button>
      </div>

      {ingredients.length ? (
        <ul className="ingredient-list">
          {ingredients.map((ingredient) => (
            <li key={ingredient.inventoryId ?? ingredient.name}>
              <span>
                <strong>{ingredient.name}</strong>
                <small>{ingredient.amount}</small>
              </span>
              <em>{ingredient.status}</em>
            </li>
          ))}
        </ul>
      ) : (
        <p className="empty-state">
          食材がまだ登録されていません。レシート登録から食材を追加してください。
        </p>
      )}
    </section>
  )
}
