export const supportedLanguages = [
  { code: 'ja', label: '日本語', nativeName: '日本語' },
  { code: 'en', label: 'English', nativeName: 'English' },
  { code: 'fr', label: 'Français', nativeName: 'Français' },
] as const

export type LanguageCode = (typeof supportedLanguages)[number]['code']

export type TranslationValues = Record<string, string | number>

export const defaultLanguage: LanguageCode = 'ja'

const jaMessages = {
  'app.name': 'あいくっく',
  'app.tagline': '食材管理と献立づくり',
  'common.backHome': 'ホームに戻る',
  'common.comingSoon': '準備中',
  'common.logout': 'ログアウト',
  'topbar.menuLabel': 'メインメニュー',
  'topbar.ingredients': '食材',
  'topbar.recipes': 'レシピ',
  'topbar.receipt': 'レシート',
  'topbar.history': '履歴',
  'topbar.notifications': '通知',
  'topbar.settings': '設定',
  'home.summary.ingredientsLabel': '登録食材',
  'home.summary.ingredientsNote': 'ログイン中のユーザーの在庫',
  'home.summary.ingredientsEmptyNote': 'まず食材を登録してください',
  'home.summary.nearExpirationLabel': '期限間近',
  'home.summary.nearExpirationNote': '3日以内に期限が近い食材',
  'home.summary.nearExpirationEmptyNote': '期限が近い食材はありません',
  'home.summary.recipesLabel': 'レシピ候補',
  'home.summary.recipesNote': '保存済みのレシピ',
  'home.summary.recipesEmptyNote': 'まだ生成されていません',
  'home.summary.favoritesLabel': 'お気に入り',
  'home.summary.favoritesNote': '保存済みレシピから集計',
  'home.status.inventoryFetchFailed': '食材の取得に失敗しました',
  'home.status.generateEmpty':
    '食材を登録してからレシピを生成してください。レシート登録から食材を追加できます。',
  'home.status.generateSuccess': 'レシピ候補を生成しました',
  'home.status.generateFailed': 'レシピ生成に失敗しました',
  'home.status.cookingUpdated': '{servings}人前として在庫を更新しました',
  'home.status.inventoryUpdateFailed': '在庫の更新に失敗しました',
  'home.quickAccessLabel': 'クイックアクセス',
  'home.secondaryLabel': 'アカウントとサポート',
  'home.modal.cooked': '調理済み',
  'home.modal.servingsQuestion': '何人前作りましたか',
  'home.modal.cancel': 'キャンセル',
  'home.modal.updating': '更新中...',
  'home.modal.reduceInventory': '在庫を減らす',
  'home.hero.eyebrow': '今日の献立',
  'home.hero.titleLine1': '作れるレシピを',
  'home.hero.titleLine2': '食材からすぐ提案',
  'home.hero.lead':
    '食材登録、期限管理、レシピ生成、買い物リストまでをひとつの画面から始められます。',
  'home.hero.generating': '生成中...',
  'home.hero.generate': 'レシピを生成',
  'home.hero.addIngredient': '食材確認',
  'home.hero.scanReceipt': 'レシート撮影',
  'home.hero.showRecipes': 'レシピ表示',
  'home.hero.previewAria': 'おすすめ献立のプレビュー',
  'home.hero.aiSuggestion': 'AI提案例',
  'home.hero.previewTitle': 'ハンバーグのキノコソテー添え',
  'home.hero.previewDescription':
    '期限が近い食材を優先した、25分で作れる献立です。',
  'home.ingredients.eyebrow': '在庫管理',
  'home.ingredients.title': '登録済みの食材',
  'home.ingredients.add': '登録',
  'home.ingredients.empty':
    '食材がまだ登録されていません。レシート登録から食材を追加してください。',
  'home.recipes.eyebrow': 'レシピ候補',
  'home.recipes.title': '在庫から作れる献立',
  'home.recipes.regenerate': '再生成',
  'home.recipes.cooked': '調理済み',
  'home.recipes.serving': '1人前',
  'home.recipes.empty':
    'まだ作成したレシピがありません。食材を登録してからレシピを生成してください。',
  'home.feature.generateTitle': 'レシピ生成',
  'home.feature.generateDescription':
    '在庫、好み、調理時間からAIが献立候補を作成',
  'home.feature.generateAction': '作りたい料理を探す',
  'home.feature.ingredientsTitle': '食材登録',
  'home.feature.ingredientsDescription':
    '手入力、レシート撮影、画像認識で冷蔵庫に追加',
  'home.feature.ingredientsAction': '食材を追加する',
  'home.feature.shoppingTitle': '買い物リスト',
  'home.feature.shoppingDescription':
    '足りない食材を自動でリスト化して予算で絞り込み',
  'home.feature.shoppingAction': 'リストを見る',
  'home.feature.historyTitle': '調理履歴',
  'home.feature.historyDescription':
    '作ったレシピ、お気に入り、使用量をまとめて確認',
  'home.feature.historyAction': '履歴を開く',
  'home.secondary.favoriteTitle': 'お気に入り',
  'home.secondary.favoriteDescription': 'また作りたいレシピを保存',
  'home.secondary.favoriteAction': '保存済み',
  'home.secondary.settingsTitle': 'アカウント設定',
  'home.secondary.settingsDescription': '言語、ログアウト、ユーザー管理',
  'home.secondary.settingsAction': '設定',
  'home.secondary.contactTitle': 'お問い合わせ',
  'home.secondary.contactDescription': '気になる点やエラーを送信',
  'home.secondary.contactAction': '送信',
  'settings.eyebrow': 'アカウント',
  'settings.title': '設定',
  'settings.subtitle':
    'ログイン中のユーザー情報、表示言語、今後追加する利用設定をまとめます。',
  'settings.accountTitle': 'アカウント情報',
  'settings.accountDescription': '現在ログインしているユーザーです。',
  'settings.signedIn': 'ログイン中',
  'settings.email': 'メールアドレス',
  'settings.userId': 'ユーザーID',
  'settings.authStatus': '認証状態',
  'settings.languageTitle': '言語設定',
  'settings.languageDescription':
    'UI文言の切り替えに使います。設定はブラウザに保存されます。',
  'settings.currentLanguage': '現在の言語',
  'settings.preferencesTitle': '利用設定',
  'settings.preferencesDescription':
    'レシピ生成の好みを保存する領域です。実装しやすいよう枠だけ用意しています。',
  'settings.defaultServings': '標準の人数',
  'settings.defaultServingsDescription': 'レシピ生成時の初期人数に使う予定です。',
  'settings.dietary': '苦手な食材・アレルギー',
  'settings.dietaryDescription': '生成候補から避けたい食材を保存する予定です。',
  'settings.notifications': '通知',
  'settings.notificationsDescription':
    '賞味期限や在庫不足の通知設定を追加できます。',
  'settings.dataSecurityTitle': 'データとセキュリティ',
  'settings.dataSecurityDescription':
    'ログアウトやアカウント管理の操作をここに集約します。',
  'settings.logoutTitle': 'セッション',
  'settings.logoutDescription': 'このブラウザのログイン状態を終了します。',
  'settings.logoutButton': 'ログアウトする',
  'settings.loggingOut': 'ログアウト中...',
} as const

export type MessageKey = keyof typeof jaMessages

const enMessages: Record<MessageKey, string> = {
  'app.name': 'Aicook',
  'app.tagline': 'Ingredient management and meal planning',
  'common.backHome': 'Back home',
  'common.comingSoon': 'Coming soon',
  'common.logout': 'Log out',
  'topbar.menuLabel': 'Main menu',
  'topbar.ingredients': 'Ingredients',
  'topbar.recipes': 'Recipes',
  'topbar.receipt': 'Receipt',
  'topbar.history': 'History',
  'topbar.notifications': 'Notifications',
  'topbar.settings': 'Settings',
  'home.summary.ingredientsLabel': 'Ingredients',
  'home.summary.ingredientsNote': 'Inventory for the signed-in user',
  'home.summary.ingredientsEmptyNote': 'Add ingredients first',
  'home.summary.nearExpirationLabel': 'Expiring soon',
  'home.summary.nearExpirationNote': 'Ingredients expiring within 3 days',
  'home.summary.nearExpirationEmptyNote': 'No ingredients are expiring soon',
  'home.summary.recipesLabel': 'Recipe ideas',
  'home.summary.recipesNote': 'Saved recipes',
  'home.summary.recipesEmptyNote': 'No recipes generated yet',
  'home.summary.favoritesLabel': 'Favorites',
  'home.summary.favoritesNote': 'Calculated from saved recipes',
  'home.status.inventoryFetchFailed': 'Failed to load ingredients',
  'home.status.generateEmpty':
    'Add ingredients before generating recipes. You can add them from receipt registration.',
  'home.status.generateSuccess': 'Generated recipe ideas',
  'home.status.generateFailed': 'Failed to generate recipes',
  'home.status.cookingUpdated':
    'Updated inventory for {servings} serving(s)',
  'home.status.inventoryUpdateFailed': 'Failed to update inventory',
  'home.quickAccessLabel': 'Quick access',
  'home.secondaryLabel': 'Account and support',
  'home.modal.cooked': 'Cooked',
  'home.modal.servingsQuestion': 'How many servings did you make?',
  'home.modal.cancel': 'Cancel',
  'home.modal.updating': 'Updating...',
  'home.modal.reduceInventory': 'Reduce inventory',
  'home.hero.eyebrow': "Today's menu",
  'home.hero.titleLine1': 'Get recipes you can cook',
  'home.hero.titleLine2': 'from your ingredients',
  'home.hero.lead':
    'Start ingredient registration, expiration tracking, recipe generation, and shopping lists from one screen.',
  'home.hero.generating': 'Generating...',
  'home.hero.generate': 'Generate recipes',
  'home.hero.addIngredient': 'Check ingredients',
  'home.hero.scanReceipt': 'Scan receipt',
  'home.hero.showRecipes': 'Show recipes',
  'home.hero.previewAria': 'Recommended meal preview',
  'home.hero.aiSuggestion': 'AI suggestion',
  'home.hero.previewTitle': 'Japanese-style salmon and komatsuna cream stew',
  'home.hero.previewDescription':
    'A 25-minute meal that prioritizes ingredients expiring soon.',
  'home.ingredients.eyebrow': 'Inventory',
  'home.ingredients.title': 'Registered ingredients',
  'home.ingredients.add': 'Add',
  'home.ingredients.empty':
    'No ingredients have been registered yet. Add ingredients from receipt registration.',
  'home.recipes.eyebrow': 'Recipe ideas',
  'home.recipes.title': 'Meals you can cook from inventory',
  'home.recipes.regenerate': 'Regenerate',
  'home.recipes.cooked': 'Cooked',
  'home.recipes.serving': '1 serving',
  'home.recipes.empty':
    'No recipes have been created yet. Add ingredients before generating recipes.',
  'home.feature.generateTitle': 'Generate recipes',
  'home.feature.generateDescription':
    'AI creates meal ideas from inventory, preferences, and cooking time',
  'home.feature.generateAction': 'Find something to cook',
  'home.feature.ingredientsTitle': 'Add ingredients',
  'home.feature.ingredientsDescription':
    'Add to your fridge by typing, receipt photos, or image recognition',
  'home.feature.ingredientsAction': 'Add ingredients',
  'home.feature.shoppingTitle': 'Shopping list',
  'home.feature.shoppingDescription':
    'Automatically list missing ingredients and filter by budget',
  'home.feature.shoppingAction': 'View list',
  'home.feature.historyTitle': 'Cooking history',
  'home.feature.historyDescription':
    'Review cooked recipes, favorites, and ingredient usage',
  'home.feature.historyAction': 'Open history',
  'home.secondary.favoriteTitle': 'Favorites',
  'home.secondary.favoriteDescription': 'Save recipes you want to cook again',
  'home.secondary.favoriteAction': 'Saved',
  'home.secondary.settingsTitle': 'Account settings',
  'home.secondary.settingsDescription': 'Language, logout, and user settings',
  'home.secondary.settingsAction': 'Settings',
  'home.secondary.contactTitle': 'Contact',
  'home.secondary.contactDescription': 'Send questions or error reports',
  'home.secondary.contactAction': 'Send',
  'settings.eyebrow': 'Account',
  'settings.title': 'Settings',
  'settings.subtitle':
    'Manage the signed-in user, display language, and future preferences.',
  'settings.accountTitle': 'Account information',
  'settings.accountDescription': 'This is the currently signed-in user.',
  'settings.signedIn': 'Signed in',
  'settings.email': 'Email address',
  'settings.userId': 'User ID',
  'settings.authStatus': 'Authentication',
  'settings.languageTitle': 'Language',
  'settings.languageDescription':
    'Used for switching UI copy. The setting is saved in this browser.',
  'settings.currentLanguage': 'Current language',
  'settings.preferencesTitle': 'Preferences',
  'settings.preferencesDescription':
    'A home for recipe-generation preferences. The structure is ready for future fields.',
  'settings.defaultServings': 'Default servings',
  'settings.defaultServingsDescription':
    'Planned for the initial serving count when generating recipes.',
  'settings.dietary': 'Disliked ingredients and allergies',
  'settings.dietaryDescription':
    'Planned for ingredients to avoid in recipe suggestions.',
  'settings.notifications': 'Notifications',
  'settings.notificationsDescription':
    'Expiration and low-stock notifications can be added here.',
  'settings.dataSecurityTitle': 'Data and security',
  'settings.dataSecurityDescription':
    'Logout and account management actions live here.',
  'settings.logoutTitle': 'Session',
  'settings.logoutDescription': 'End the login session in this browser.',
  'settings.logoutButton': 'Log out',
  'settings.loggingOut': 'Logging out...',
}

const frMessages: Record<MessageKey, string> = {
  'app.name': 'Aicook',
  'app.tagline': 'Gestion des ingrédients et menus',
  'common.backHome': 'Retour à l’accueil',
  'common.comingSoon': 'À venir',
  'common.logout': 'Se déconnecter',
  'topbar.menuLabel': 'Menu principal',
  'topbar.ingredients': 'Ingrédients',
  'topbar.recipes': 'Recettes',
  'topbar.receipt': 'Ticket',
  'topbar.history': 'Historique',
  'topbar.notifications': 'Notifications',
  'topbar.settings': 'Réglages',
  'home.summary.ingredientsLabel': 'Ingrédients',
  'home.summary.ingredientsNote': 'Stock de l’utilisateur connecté',
  'home.summary.ingredientsEmptyNote': 'Ajoutez d’abord des ingrédients',
  'home.summary.nearExpirationLabel': 'Bientôt périmés',
  'home.summary.nearExpirationNote':
    'Ingrédients dont la date approche sous 3 jours',
  'home.summary.nearExpirationEmptyNote': 'Aucun ingrédient bientôt périmé',
  'home.summary.recipesLabel': 'Idées de recettes',
  'home.summary.recipesNote': 'Recettes enregistrées',
  'home.summary.recipesEmptyNote': 'Aucune recette générée pour le moment',
  'home.summary.favoritesLabel': 'Favoris',
  'home.summary.favoritesNote': 'Calculé depuis les recettes enregistrées',
  'home.status.inventoryFetchFailed': 'Impossible de charger les ingrédients',
  'home.status.generateEmpty':
    'Ajoutez des ingrédients avant de générer des recettes. Vous pouvez les ajouter depuis un ticket.',
  'home.status.generateSuccess': 'Idées de recettes générées',
  'home.status.generateFailed': 'Impossible de générer les recettes',
  'home.status.cookingUpdated':
    'Stock mis à jour pour {servings} portion(s)',
  'home.status.inventoryUpdateFailed': 'Impossible de mettre à jour le stock',
  'home.quickAccessLabel': 'Accès rapide',
  'home.secondaryLabel': 'Compte et support',
  'home.modal.cooked': 'Cuisiné',
  'home.modal.servingsQuestion': 'Combien de portions avez-vous préparées ?',
  'home.modal.cancel': 'Annuler',
  'home.modal.updating': 'Mise à jour...',
  'home.modal.reduceInventory': 'Réduire le stock',
  'home.hero.eyebrow': 'Menu du jour',
  'home.hero.titleLine1': 'Des recettes faisables',
  'home.hero.titleLine2': 'à partir des ingrédients',
  'home.hero.lead':
    'Lancez l’ajout d’ingrédients, le suivi des dates, la génération de recettes et la liste de courses depuis un seul écran.',
  'home.hero.generating': 'Génération...',
  'home.hero.generate': 'Générer des recettes',
  'home.hero.addIngredient': 'Consulter les ingrédients',
  'home.hero.scanReceipt': 'Scanner un ticket',
  'home.hero.showRecipes': 'Afficher les recettes',
  'home.hero.previewAria': 'Aperçu du menu recommandé',
  'home.hero.aiSuggestion': 'Suggestion IA',
  'home.hero.previewTitle': 'Saumon et komatsuna à la crème japonaise',
  'home.hero.previewDescription':
    'Un menu prêt en 25 minutes qui priorise les ingrédients bientôt périmés.',
  'home.ingredients.eyebrow': 'Stock',
  'home.ingredients.title': 'Ingrédients enregistrés',
  'home.ingredients.add': 'Ajouter',
  'home.ingredients.empty':
    'Aucun ingrédient enregistré. Ajoutez des ingrédients depuis un ticket.',
  'home.recipes.eyebrow': 'Idées de recettes',
  'home.recipes.title': 'Menus possibles depuis le stock',
  'home.recipes.regenerate': 'Regénérer',
  'home.recipes.cooked': 'Cuisiné',
  'home.recipes.serving': '1 portion',
  'home.recipes.empty':
    'Aucune recette créée. Ajoutez des ingrédients avant de générer des recettes.',
  'home.feature.generateTitle': 'Générer des recettes',
  'home.feature.generateDescription':
    'L’IA propose des menus selon le stock, les préférences et le temps',
  'home.feature.generateAction': 'Trouver quoi cuisiner',
  'home.feature.ingredientsTitle': 'Ajouter des ingrédients',
  'home.feature.ingredientsDescription':
    'Ajoutez au frigo par saisie, photo de ticket ou reconnaissance d’image',
  'home.feature.ingredientsAction': 'Ajouter des ingrédients',
  'home.feature.shoppingTitle': 'Liste de courses',
  'home.feature.shoppingDescription':
    'Liste automatiquement les ingrédients manquants et filtre par budget',
  'home.feature.shoppingAction': 'Voir la liste',
  'home.feature.historyTitle': 'Historique de cuisine',
  'home.feature.historyDescription':
    'Consultez recettes cuisinées, favoris et quantités utilisées',
  'home.feature.historyAction': 'Ouvrir l’historique',
  'home.secondary.favoriteTitle': 'Favoris',
  'home.secondary.favoriteDescription':
    'Enregistrez les recettes à refaire',
  'home.secondary.favoriteAction': 'Enregistrées',
  'home.secondary.settingsTitle': 'Réglages du compte',
  'home.secondary.settingsDescription':
    'Langue, déconnexion et gestion utilisateur',
  'home.secondary.settingsAction': 'Réglages',
  'home.secondary.contactTitle': 'Contact',
  'home.secondary.contactDescription':
    'Envoyer une question ou signaler une erreur',
  'home.secondary.contactAction': 'Envoyer',
  'settings.eyebrow': 'Compte',
  'settings.title': 'Réglages',
  'settings.subtitle':
    'Gérez l’utilisateur connecté, la langue d’affichage et les préférences à venir.',
  'settings.accountTitle': 'Informations du compte',
  'settings.accountDescription': 'Utilisateur actuellement connecté.',
  'settings.signedIn': 'Connecté',
  'settings.email': 'Adresse e-mail',
  'settings.userId': 'ID utilisateur',
  'settings.authStatus': 'Authentification',
  'settings.languageTitle': 'Langue',
  'settings.languageDescription':
    'Utilisée pour changer les textes de l’interface. Ce réglage est enregistré dans ce navigateur.',
  'settings.currentLanguage': 'Langue actuelle',
  'settings.preferencesTitle': 'Préférences',
  'settings.preferencesDescription':
    'Espace prévu pour les préférences de génération de recettes.',
  'settings.defaultServings': 'Nombre de portions par défaut',
  'settings.defaultServingsDescription':
    'Prévu pour initialiser le nombre de portions lors de la génération.',
  'settings.dietary': 'Ingrédients à éviter et allergies',
  'settings.dietaryDescription':
    'Prévu pour éviter certains ingrédients dans les suggestions.',
  'settings.notifications': 'Notifications',
  'settings.notificationsDescription':
    'Les alertes de péremption et de stock faible pourront être ajoutées ici.',
  'settings.dataSecurityTitle': 'Données et sécurité',
  'settings.dataSecurityDescription':
    'Déconnexion et gestion du compte sont regroupées ici.',
  'settings.logoutTitle': 'Session',
  'settings.logoutDescription':
    'Termine la session de connexion dans ce navigateur.',
  'settings.logoutButton': 'Se déconnecter',
  'settings.loggingOut': 'Déconnexion...',
}

const messages: Record<LanguageCode, Record<MessageKey, string>> = {
  ja: jaMessages,
  en: enMessages,
  fr: frMessages,
}

export type TranslateFn = (
  key: MessageKey,
  values?: TranslationValues,
) => string

export function isLanguageCode(value: string): value is LanguageCode {
  return supportedLanguages.some((language) => language.code === value)
}

export function getStoredLanguage(): LanguageCode | null {
  if (typeof window === 'undefined') {
    return null
  }

  const storedLanguage = window.localStorage.getItem('ai-recipe-language')

  return storedLanguage && isLanguageCode(storedLanguage)
    ? storedLanguage
    : null
}

export function getInitialLanguage(): LanguageCode {
  const storedLanguage = getStoredLanguage()

  if (storedLanguage) {
    return storedLanguage
  }

  if (typeof navigator === 'undefined') {
    return defaultLanguage
  }

  const browserLanguages = [
    navigator.language,
    ...(navigator.languages ?? []),
  ].filter(Boolean)

  for (const browserLanguage of browserLanguages) {
    const baseLanguage = browserLanguage.toLowerCase().split('-')[0]

    if (isLanguageCode(baseLanguage)) {
      return baseLanguage
    }
  }

  return defaultLanguage
}

export function saveLanguage(language: LanguageCode) {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.setItem('ai-recipe-language', language)
}

export function translate(
  language: LanguageCode,
  key: MessageKey,
  values?: TranslationValues,
) {
  const template = messages[language][key] ?? messages[defaultLanguage][key]

  if (!values) {
    return template
  }

  return template.replace(/\{([a-zA-Z0-9_]+)\}/g, (_, token: string) =>
    String(values[token] ?? `{${token}}`),
  )
}
