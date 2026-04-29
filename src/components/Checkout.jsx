import './Checkout.css'
import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { db, ordersCollection, Timestamp, addDoc } from '../firebase'
import { getTelegramUser, expandTelegramApp, showTelegramAlert, hapticFeedback } from '../utils/telegram'

function Checkout() {
    const navigate = useNavigate()
    const [cart, setCart] = useState([])
    const [loading, setLoading] = useState(false)
    const [telegramId, setTelegramId] = useState(null)
    const [userName, setUserName] = useState('')
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
    const mapRef = useRef(null)
    const markerRef = useRef(null)

    const TELEGRAM_BOT_TOKEN = "8771407234:AAGculoSuCYdIhsG1uzgCKTY37HP608uXzo"
    const ADMIN_CHAT_ID = "7787131118"

    useEffect(() => {
        expandTelegramApp()
        const tgUser = getTelegramUser()
        
        if (tgUser && tgUser.id) {
            setTelegramId(tgUser.id)
            setUserName(tgUser.firstName)
            setFormData(prev => ({
                ...prev,
                firstName: tgUser.firstName,
                lastName: tgUser.lastName
            }))
        }
    }, [])

    useEffect(() => {
        const savedCart = localStorage.getItem('cart')
        if (!savedCart || JSON.parse(savedCart).length === 0) {
            navigate('/cart')
        }
        setCart(JSON.parse(savedCart || '[]'))
    }, [navigate])

    // Xarita va custom marker icon yaratish
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
        if (mapLoaded && !mapRef.current && window.L) {
            // Xiva markazi
            const map = window.L.map('map').setView([41.3783, 60.3639], 14)
            window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap'
            }).addTo(map)
            mapRef.current = map

            // Chiroyli marker ikonkasi yaratish
            const customIcon = window.L.divIcon({
                className: 'custom-marker',
                html: `
                    <div style="
                        position: relative;
                        width: 40px;
                        height: 40px;
                        background: linear-gradient(135deg, #ff6b35, #ff3b00);
                        border-radius: 50%;
                        border: 3px solid white;
                        box-shadow: 0 4px 15px rgba(0,0,0,0.3);
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        cursor: pointer;
                        transition: all 0.3s ease;
                    ">
                        <div style="
                            width: 12px;
                            height: 12px;
                            background: white;
                            border-radius: 50%;
                            box-shadow: 0 0 5px rgba(0,0,0,0.2);
                        "></div>
                        <div style="
                            position: absolute;
                            bottom: -12px;
                            left: 50%;
                            transform: translateX(-50%);
                            width: 0;
                            height: 0;
                            border-left: 8px solid transparent;
                            border-right: 8px solid transparent;
                            border-top: 12px solid #ff3b00;
                        "></div>
                    </div>
                `,
                iconSize: [40, 40],
                iconAnchor: [20, 40],
                popupAnchor: [0, -40]
            })

            // Hover effektli marker (opsional)
            const pulseIcon = window.L.divIcon({
                className: 'custom-marker-pulse',
                html: `
                    <div style="position: relative;">
                        <div style="
                            position: absolute;
                            width: 40px;
                            height: 40px;
                            background: #ff3b00;
                            border-radius: 50%;
                            animation: pulse 1.5s infinite;
                        "></div>
                        <div style="
                            position: relative;
                            width: 40px;
                            height: 40px;
                            background: linear-gradient(135deg, #ff6b35, #ff3b00);
                            border-radius: 50%;
                            border: 3px solid white;
                            box-shadow: 0 4px 15px rgba(0,0,0,0.3);
                            display: flex;
                            align-items: center;
                            justify-content: center;
                        ">
                            <div style="
                                width: 12px;
                                height: 12px;
                                background: white;
                                border-radius: 50%;
                            "></div>
                        </div>
                    </div>
                `,
                iconSize: [40, 40],
                iconAnchor: [20, 40],
                popupAnchor: [0, -40]
            })

            map.on('click', (e) => {
                if (markerRef.current) {
                    markerRef.current.remove()
                }
                
                // Animatsiyali marker qo'shish
                markerRef.current = window.L.marker([e.latlng.lat, e.latlng.lng], {
                    icon: customIcon,
                    riseOnHover: true
                }).addTo(map)
                
                // Markerga popup qo'shish
                markerRef.current.bindPopup(`
                    <div style="
                        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                        padding: 5px;
                        text-align: center;
                    ">
                        <strong style="color: #ff3b00;">🍔 Frank Burger</strong><br/>
                        📍 Yetkazib berish manzili
                    </div>
                `).openPopup()
                
                // 3 sekunddan keyin popup avtomatik yopiladi
                setTimeout(() => {
                    if (markerRef.current) {
                        markerRef.current.closePopup()
                    }
                }, 3000)
                
                setSelectedLocation({
                    lat: e.latlng.lat,
                    lng: e.latlng.lng
                })
                setFormData(prev => ({
                    ...prev,
                    address: `${e.latlng.lat.toFixed(6)}, ${e.latlng.lng.toFixed(6)}`
                }))
                hapticFeedback()
            })

            // CSS animatsiyani qo'shish
            const style = document.createElement('style')
            style.textContent = `
                @keyframes pulse {
                    0% {
                        transform: scale(1);
                        opacity: 0.8;
                    }
                    70% {
                        transform: scale(1.5);
                        opacity: 0;
                    }
                    100% {
                        transform: scale(1);
                        opacity: 0;
                    }
                }
                .custom-marker {
                    transition: transform 0.2s ease;
                }
                .custom-marker:hover {
                    transform: scale(1.1);
                }
            `
            document.head.appendChild(style)

            return () => {
                if (mapRef.current) {
                    mapRef.current.remove()
                    mapRef.current = null
                }
            }
        }
    }, [mapLoaded])

    const handleInputChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        })
    }

    const totalPrice = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0)

    const sendToAdmin = async (orderData) => {
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
        
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chat_id: ADMIN_CHAT_ID,
                    text: message,
                    parse_mode: 'HTML'
                })
            })
            const result = await response.json()
            if (result.ok) {
                console.log('✅ Adminga xabar yuborildi')
                return true
            }
            return false
        } catch (error) {
            console.error('Admin xabari yuborishda xatolik:', error)
            return false
        }
    }

    const sendToUser = async (orderData) => {
        let message = `🍔 FRANK BURGER 🍔\n\n`
        message += `✅ Sizning zakazingiz qabul qilindi!\n\n`
        message += `🆔 Zakaz ID: ${orderData.orderId}\n`
        message += `💰 Jami: ${orderData.totalAmount.toLocaleString()} so'm\n`
        message += `⏰ Yetkazib berish: ${orderData.delivery.deliveryTime}\n`
        message += `📍 Manzil: ${orderData.delivery.address}\n\n`
        message += `📦 Zakaz holatini "Buyurtmalar" bo'limidan kuzatishingiz mumkin.\n\n`
        message += `☎️ Savollar uchun: +998 XX XXX XX XX`

        const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`
        
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chat_id: orderData.telegramId,
                    text: message,
                    parse_mode: 'HTML'
                })
            })
            const result = await response.json()
            if (result.ok) {
                console.log('✅ Foydalanuvchiga xabar yuborildi')
                return true
            }
            console.log('Foydalanuvchi xatosi:', result.description)
            return false
        } catch (error) {
            console.error('Foydalanuvchi xabari yuborishda xatolik:', error)
            return false
        }
    }

    const saveToFirebase = async (orderData) => {
        try {
            const docRef = await addDoc(ordersCollection, orderData)
            console.log('✅ Firebase ga saqlandi! ID:', docRef.id)
            return true
        } catch (error) {
            console.error('Firebase xatosi:', error)
            return false
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        
        if (!selectedLocation) {
            showTelegramAlert("❌ Iltimos, xaritadan manzilingizni belgilang!")
            return
        }
        
        if (!formData.deliveryTime) {
            showTelegramAlert("❌ Iltimos, yetkazib berish vaqtini tanlang!")
            return
        }
        
        if (!formData.phone) {
            showTelegramAlert("❌ Iltimos, telefon raqamingizni kiriting!")
            return
        }
        
        setLoading(true)
        hapticFeedback()
        
        const orderData = {
            telegramId: Number(telegramId),
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
            createdAt: Timestamp.now()
        }

        await saveToFirebase(orderData)
        await sendToAdmin(orderData)
        await sendToUser(orderData)
        
        localStorage.removeItem('cart')
        
        setLoading(false)
        
        const successMessage = `✅ Zakaz qabul qilindi!\n\n🆔 Zakaz ID: ${orderData.orderId}\n💰 Summa: ${totalPrice.toLocaleString()} so'm\n⏰ Yetkazib berish: ${formData.deliveryTime}\n\n📋 Zakaz holatini "Buyurtmalar" bo'limidan kuzatishingiz mumkin.`
        
        showTelegramAlert(successMessage)
        
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
                                placeholder="Koordinatalar avtomatik to'ldiriladi"
                                readOnly
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