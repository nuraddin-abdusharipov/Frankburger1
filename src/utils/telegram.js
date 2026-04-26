// src/utils/telegram.js

// Telegram WebApp dan foydalanuvchi ma'lumotlarini olish
export const getTelegramUser = () => {
  if (window.Telegram && window.Telegram.WebApp) {
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
  return null
}

// Telegram WebApp ni to'liq ekran qilish
export const expandTelegramApp = () => {
  if (window.Telegram && window.Telegram.WebApp) {
    window.Telegram.WebApp.expand()
  }
}

// Telegram da alert ko'rsatish
export const showTelegramAlert = (message) => {
  if (window.Telegram && window.Telegram.WebApp) {
    window.Telegram.WebApp.showAlert(message)
  } else {
    alert(message)
  }
}

// Telegram da confirm ko'rsatish
export const showTelegramConfirm = (message, callback) => {
  if (window.Telegram && window.Telegram.WebApp) {
    window.Telegram.WebApp.showConfirm(message, callback)
  } else {
    callback(confirm(message))
  }
}

// Haptic feedback (tebranish)
export const hapticFeedback = () => {
  if (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.HapticFeedback) {
    window.Telegram.WebApp.HapticFeedback.impactOccurred('light')
  }
}