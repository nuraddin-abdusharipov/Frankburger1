import './Checkout.css'
import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { db, ordersCollection, addDoc } from '../firebase'

function Checkout() {
    const navigate = useNavigate()
    const [cart, setCart] = useState([])
    const [loading, setLoading] = useState(false)
    const [telegramId, setTelegramId] = useState(null)
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        phone: '',
        address: '',
        deliveryTime: '',
        notes: ''
    })
    const [selectedLocation, setSelectedLocation] = useState(null)
    const [mapLoaded, setMapLoaded] = useState(false)

    // ✅ O'ZINGIZNING BOT TOKEN VA CHAT ID NI QO'YING
    // BotFather dan token oling: https://t.me/BotFather
    // Chat ID olish uchun: @userinfobot ga yozing
    const TELEGRAM_BOT_TOKEN = "8687476340:AAH7A4hueNbqM49ksxSlYMHj9DY3TgQtITA"  // Tokeningizni shu yerga yozing
    const TELEGRAM_CHAT_ID = "7787131118"  // Chat ID ni shu yerga yozing

    // Telegram ID olish
    useEffect(() => {
        if (window.Telegram && window.Telegram.WebApp) {
            const webApp = window.Telegram.WebApp;
            const initData = webApp.initDataUnsafe;
            
            if (initData && initData.user) {
                const user = initData.user;
                setTelegramId(user.id);
                
                if (user.first_name) {
                    setFormData(prev => ({
                        ...prev,
                        firstName: user.first_name,
                        lastName: user.last_name || ''
                    }));
                }
            }
            webApp.expand();
        } else {
            const testId = localStorage.getItem('test_tg_id');
            setTelegramId(testId ? parseInt(testId) : 7164122768);
        }
    }, [])

    // Savatni yuklash
    useEffect(() => {
        const savedCart = localStorage.getItem('cart')
        if (!savedCart || JSON.parse(savedCart).length === 0) {
            navigate('/cart')
        }
        setCart(JSON.parse(savedCart || '[]'))
    }, [navigate])

    // Xarita
    useEffect(() => {
        const script = document.createElement('script')
        script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
        script.onload = () => {
            const link = document.createElement('link')
            link.rel = 'stylesheet'
            link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
            document.head.appendChild(link)
            setMapLoaded(true)
        }
        document.head.appendChild(script)
    }, [])

    useEffect(() => {
        if (mapLoaded && !selectedLocation) {
            const map = L.map('map').setView([41.2995, 69.2401], 13)
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap'
            }).addTo(map)

            let marker = null

            map.on('click', (e) => {
                if (marker) {
                    marker.remove()
                }
                marker = L.marker([e.latlng.lat, e.latlng.lng]).addTo(map)
                setSelectedLocation({
                    lat: e.latlng.lat,
                    lng: e.latlng.lng
                })
                setFormData(prev => ({
                    ...prev,
                    address: `${e.latlng.lat.toFixed(6)}, ${e.latlng.lng.toFixed(6)}`
                }))
            })

            return () => map.remove()
        }
    }, [mapLoaded, selectedLocation])

    const handleInputChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        })
    }

    const totalPrice = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0)

    // Telegram botga xabar yuborish (to'g'rilangan)
    const sendToTelegram = async (orderData) => {
        // Xabar matnini tayyorlash
        let message = `🆕 YANGI ZAKAZ! 🆕\n\n`
        message += `🤖 Telegram ID: ${orderData.telegramId}\n`
        message += `👤 Mijoz: ${orderData.customer.fullName}\n`
        message += `📞 Telefon: ${orderData.customer.phone}\n`
        message += `📍 Manzil: ${orderData.delivery.address}\n`
        message += `⏰ Yetkazib berish: ${orderData.delivery.deliveryTime}\n`
        message += `📝 Izoh: ${orderData.delivery.notes || "Yo'q"}\n\n`
        message += `🛍️ ZAKAZ:\n`
        
        orderData.items.forEach(item => {
            message += `• ${item.name} x${item.quantity} = ${item.total.toLocaleString()} so'm\n`
        })
        
        message += `\n💰 JAMI: ${orderData.totalAmount.toLocaleString()} so'm\n`
        message += `🆔 Zakaz ID: ${orderData.orderId}\n`
        message += `📅 Vaqt: ${new Date(orderData.orderDate).toLocaleString()}`

        const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`
        
        console.log('Telegramga yuborilmoqda...')
        console.log('URL:', url)
        console.log('Chat ID:', TELEGRAM_CHAT_ID)
        
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    chat_id: TELEGRAM_CHAT_ID,
                    text: message,
                    parse_mode: 'HTML'
                })
            })
            
            const result = await response.json()
            console.log('Telegram javobi:', result)
            
            if (result.ok) {
                console.log('✅ Telegramga muvaffaqiyatli yuborildi!')
                return true
            } else {
                console.log('❌ Telegram xatosi:', result.description)
                return false
            }
        } catch (error) {
            console.error('❌ Telegram yuborishda xatolik:', error)
            return false
        }
    }

    // Firebase ga saqlash
    const saveToFirebase = async (orderData) => {
        try {
            const docRef = await addDoc(ordersCollection, orderData);
            console.log('✅ Firebase ga saqlandi! ID:', docRef.id);
            return docRef.id;
        } catch (error) {
            console.error('Firebase xatosi:', error);
            return null;
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        
        if (!selectedLocation) {
            alert("❌ Iltimos, xaritadan manzilingizni belgilang!")
            return
        }
        
        setLoading(true)
        
        const orderData = {
            telegramId: telegramId,
            orderId: Date.now(),
            orderDate: new Date().toISOString(),
            customer: {
                firstName: formData.firstName,
                lastName: formData.lastName,
                fullName: `${formData.firstName} ${formData.lastName}`,
                phone: formData.phone
            },
            delivery: {
                address: formData.address,
                coordinates: selectedLocation,
                deliveryTime: formData.deliveryTime,
                notes: formData.notes
            },
            items: cart.map(item => ({
                id: item.id,
                name: item.name,
                price: item.price,
                quantity: item.quantity,
                total: item.price * item.quantity
            })),
            totalAmount: totalPrice,
            status: "Yangi",
            createdAt: new Date().toISOString()
        }

        console.log('Zakaz ma\'lumotlari:', orderData)

        // 1. Firebase ga saqlash
        const firebaseId = await saveToFirebase(orderData)
        
        // 2. Telegram botga xabar (xatolik bo'lsa ham zakaz qabul qilinadi)
        const telegramSent = await sendToTelegram(orderData)
        
        // 3. LocalStorage dan savatni tozalash
        localStorage.removeItem('cart')
        
        setLoading(false)
        
        // 4. Xabar
        let alertMessage = "✅ Zakaz qabul qilindi!\n\n"
        if (telegramSent) {
            alertMessage += "📨 Adminga xabar yuborildi!"
        } else {
            alertMessage += "⚠️ Xabar yuborilmadi, lekin zakaz qabul qilindi!"
        }
        
        if (window.Telegram && window.Telegram.WebApp) {
            window.Telegram.WebApp.showAlert(alertMessage);
        } else {
            alert(alertMessage);
        }
        
        // 5. Bosh sahifaga qaytish
        navigate('/')
    }

    const deliveryTimes = [
        'Hozir (30-40 daqiqa)',
        '12:00 - 13:00',
        '13:00 - 14:00',
        '14:00 - 15:00',
        '17:00 - 18:00',
        '18:00 - 19:00',
        '19:00 - 20:00'
    ]

    return (
        <div className="CheckoutPage">
            <div className="checkout-header">
                <Link to="/cart" className="back-btn">← Orqaga</Link>
                <h1>Zakazni rasmiylashtirish</h1>
                {telegramId && (
                    <div className="telegram-badge">
                        🤖 ID: {telegramId}
                    </div>
                )}
            </div>

            <div className="checkout-content">
                <form onSubmit={handleSubmit}>
                    <div className="form-section">
                        <h2>📋 Shaxsiy ma'lumotlar</h2>
                        <div className="form-row">
                            <div className="form-group">
                                <label>Ism *</label>
                                <input
                                    type="text"
                                    name="firstName"
                                    required
                                    value={formData.firstName}
                                    onChange={handleInputChange}
                                    placeholder="Ismingiz"
                                />
                            </div>
                            <div className="form-group">
                                <label>Familiya *</label>
                                <input
                                    type="text"
                                    name="lastName"
                                    required
                                    value={formData.lastName}
                                    onChange={handleInputChange}
                                    placeholder="Familiyangiz"
                                />
                            </div>
                        </div>
                        <div className="form-group">
                            <label>📞 Telefon raqam *</label>
                            <input
                                type="tel"
                                name="phone"
                                required
                                value={formData.phone}
                                onChange={handleInputChange}
                                placeholder="+998 XX XXX XX XX"
                            />
                        </div>
                    </div>

                    <div className="form-section">
                        <h2>📍 Yetkazib berish manzili</h2>
                        <div className="map-container">
                            <div id="map" className="map"></div>
                            <p className="map-hint">
                                {selectedLocation ? "✅ Manzil belgilandi" : "🗺️ Xaritani bosing va manzilingizni belgilang"}
                            </p>
                        </div>
                        <div className="form-group">
                            <label>Manzil (qo'shimcha)</label>
                            <input
                                type="text"
                                name="address"
                                value={formData.address}
                                onChange={handleInputChange}
                                placeholder="Uy, ko'cha, kirish raqami"
                            />
                        </div>
                    </div>

                    <div className="form-section">
                        <h2>⏰ Yetkazib berish vaqti</h2>
                        <div className="form-group">
                            <select
                                name="deliveryTime"
                                required
                                value={formData.deliveryTime}
                                onChange={handleInputChange}
                            >
                                <option value="">Vaqtni tanlang</option>
                                {deliveryTimes.map(time => (
                                    <option key={time} value={time}>{time}</option>
                                ))}
                            </select>
                        </div>
                        <div className="form-group">
                            <label>📝 Qo'shimcha izoh</label>
                            <textarea
                                name="notes"
                                value={formData.notes}
                                onChange={handleInputChange}
                                placeholder="Maxsus talablar..."
                                rows="3"
                            />
                        </div>
                    </div>

                    <div className="form-section">
                        <h2>🛍️ Zakaz haqida</h2>
                        <div className="order-summary">
                            {cart.map(item => (
                                <div key={item.id} className="order-item">
                                    <span>{item.name} x{item.quantity}</span>
                                    <span>{(item.price * item.quantity).toLocaleString()} so'm</span>
                                </div>
                            ))}
                            <div className="order-total">
                                <strong>Jami:</strong>
                                <strong>{totalPrice.toLocaleString()} so'm</strong>
                            </div>
                        </div>
                    </div>

                    <button type="submit" className="submit-btn" disabled={loading}>
                        {loading ? "Yuborilmoqda..." : "✅ Zakazni tasdiqlash"}
                    </button>
                </form>
            </div>
        </div>
    )
}

export default Checkout