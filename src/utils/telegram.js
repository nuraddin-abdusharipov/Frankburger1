export const getTelegramUser = () => {
  try {
    if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
      const webApp = window.Telegram.WebApp
      const user = webApp.initDataUnsafe?.user

      if (user) {
        return {
          id: user.id,
          firstName: user.first_name || '',
          lastName: user.last_name || '',
          username: user.username || '',
          photoUrl: user.photo_url || null,
          languageCode: user.language_code || 'uz'
        }
      }
    }
  } catch (e) {
    console.warn('getTelegramUser xatosi:', e)
  }
  return null
}

export const expandTelegramApp = () => {
  try {
    if (typeof window !== 'undefined' && window.Telegram?.WebApp?.expand) {
      window.Telegram.WebApp.expand()
    }
  } catch (e) {
    console.warn('expandTelegramApp xatosi:', e)
  }
}

export const showTelegramAlert = (message) => {
  try {
    const webApp = window.Telegram?.WebApp
    // Faqat versiya 6.2 yoki undan yuqori bo'lsa showAlert ishlaydi
    if (webApp?.isVersionAtLeast && webApp.isVersionAtLeast('6.2') && typeof webApp.showAlert === 'function') {
      webApp.showAlert(String(message))
    } else {
      alert(String(message))
    }
  } catch (e) {
    alert(String(message))
  }
}

export const showTelegramConfirm = (message, callback) => {
  try {
    const webApp = window.Telegram?.WebApp
    if (webApp?.isVersionAtLeast && webApp.isVersionAtLeast('6.2') && typeof webApp.showConfirm === 'function') {
      webApp.showConfirm(String(message), callback)
    } else {
      callback(confirm(String(message)))
    }
  } catch (e) {
    callback(confirm(String(message)))
  }
}

export const hapticFeedback = () => {
  try {
    const webApp = window.Telegram?.WebApp
    // Haptic faqat 6.1+ versiyada mavjud
    if (webApp?.isVersionAtLeast && webApp.isVersionAtLeast('6.1')) {
      if (webApp.HapticFeedback && typeof webApp.HapticFeedback.impactOccurred === 'function') {
        webApp.HapticFeedback.impactOccurred('light')
      }
    }
  } catch (e) {
    // Agar eski versiya bo'lsa, kod to'xtab qolmasligi uchun xatoni shunchaki yutib yuboramiz
  }
}
