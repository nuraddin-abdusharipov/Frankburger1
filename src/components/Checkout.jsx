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
    const [distance, setDistance] = useState(null)

    const mapRef = useRef(null)
    const markerRef = useRef(null)
    const routeLayerRef = useRef(null)
    const cafeMarkerRef = useRef(null)

    const TELEGRAM_BOT_TOKEN = "8915752062:AAGXACX_PUZpwflcQQS803hSTy9vqZ39zas"
    const ADMIN_CHAT_ID = "7787131118"

    const CAFE_LOCATION = {
        lat: 41.3776046,
        lng: 60.3724037,
        name: "Frank Burger"
    }

    // Xavfsiz xabarnoma ko'rsatish
    const notify = (msg) => {
        try {
            if (typeof showTelegramAlert === 'function') {
                showTelegramAlert(msg)
            } else {
                alert(msg)
            }
        } catch {
            alert(msg)
        }
    }

    // Telegram Web App ni ishga tushirish
    useEffect(() => {
        try {
            if (window.Telegram?.WebApp) {
                window.Telegram.WebApp.expand()
            }
            if (typeof expandTelegramApp === 'function') {
                expandTelegramApp()
            }
        } catch (e) {
            console.warn('Telegram expand error:', e)
        }

        try {
            const tgUser = typeof getTelegramUser === 'function' ? getTelegramUser() : null

            if (tgUser && tgUser.id) {
                setTelegramId(tgUser.id)
                setUserName(tgUser.firstName || '')
                setFormData(prev => ({
                    ...prev,
                    firstName: tgUser.firstName || '',
                    lastName: tgUser.lastName || ''
                }))
            }
        } catch (err) {
            console.warn('tgUser olishda xato:', err)
        }

        const enableInputs = () => {
            const inputs = document.querySelectorAll('input, textarea, select')
            inputs.forEach(input => {
                input.style.pointerEvents = 'auto'
                input.disabled = false
            })
        }

        const timer = setTimeout(enableInputs, 100)
        return () => clearTimeout(timer)
    }, [])

    const handleInputChange = (e) => {
        const { name, value } = e.target
        setFormData(prev => ({
            ...prev,
            [name]: value
        }))
    }

    const handleInputFocus = (e) => {
        e.target.focus()
    }

    const calculateRoute = async (startLat, startLng, endLat, endLng) => {
        try {
            const url = `https://router.project-osrm.org/route/v1/driving/${startLng},${startLat};${endLng},${endLat}?overview=full&geometries=geojson`
            const response = await fetch(url)
            const data = await response.json()

            if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
                const route = data.routes[0]
                const distanceInKm = route.distance / 1000
                const coordinates = route.geometry.coordinates.map(coord => [coord[1], coord[0]])

                return {
                    distance: distanceInKm,
                    duration: route.duration,
                    coordinates: coordinates
                }
            }
            return null
        } catch (error) {
            console.error('Route calculation error:', error)
            return null
        }
    }

    const drawRoute = (coordinates) => {
        if (!mapRef.current || !window.L) return

        if (routeLayerRef.current) {
            routeLayerRef.current.remove()
        }

        try {
            routeLayerRef.current = window.L.polyline(coordinates, {
                color: '#ff6b35',
                weight: 5,
                opacity: 0.9,
                lineJoin: 'round',
                lineCap: 'round'
            }).addTo(mapRef.current)

            const bounds = routeLayerRef.current.getBounds()
            if (bounds.isValid()) {
                mapRef.current.fitBounds(bounds, { padding: [50, 50] })
            }
        } catch (error) {
            console.error('Draw route error:', error)
        }
    }

    // Cart ma'lumotlarini tekshirish
    useEffect(() => {
        try {
            const savedCart = localStorage.getItem('cart')
            if (!savedCart || JSON.parse(savedCart).length === 0) {
                navigate('/cart')
            } else {
                setCart(JSON.parse(savedCart))
            }
        } catch (err) {
            console.error('Cart parse error:', err)
            navigate('/cart')
        }
    }, [navigate])

    // Leaflet kutubxonasini yuklash
    useEffect(() => {
        const link = document.createElement('link')
        link.rel = 'stylesheet'
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
        document.head.appendChild(link)

        const script = document.createElement('script')
        script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
        script.onload = () => setMapLoaded(true)
        script.onerror = () => console.error('Leaflet yuklanmadi')
        document.head.appendChild(script)

        return () => {
            if (mapRef.current) {
                mapRef.current.remove()
                mapRef.current = null
            }
        }
    }, [])

    // Map yaratish
    useEffect(() => {
        if (!mapLoaded || !window.L || mapRef.current) return

        try {
            const map = window.L.map('map').setView([CAFE_LOCATION.lat, CAFE_LOCATION.lng], 13)

            window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap contributors',
                maxZoom: 19
            }).addTo(map)

            mapRef.current = map

            // Cafe marker
            const cafeIcon = window.L.divIcon({
                className: 'cafe-marker',
                html: `
                    <div style="position: relative; width: 46px; height: 46px; background: linear-gradient(135deg, #dc3545, #c82333); border-radius: 50%; border: 3px solid white; box-shadow: 0 4px 15px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; cursor: pointer;">
                        <span style="font-size: 24px;">🍔</span>
                        <div style="position: absolute; bottom: -10px; left: 50%; transform: translateX(-50%); width: 0; height: 0; border-left: 7px solid transparent; border-right: 7px solid transparent; border-top: 10px solid #c82333;"></div>
                    </div>
                `,
                iconSize: [46, 46],
                iconAnchor: [23, 46],
                popupAnchor: [0, -46]
            })

            cafeMarkerRef.current = window.L.marker([CAFE_LOCATION.lat, CAFE_LOCATION.lng], {
                icon: cafeIcon,
                riseOnHover: true
            }).addTo(map)

            cafeMarkerRef.current.bindPopup(`
                <div style="font-family: sans-serif; padding: 6px; text-align: center;">
                    🍔 <strong>${CAFE_LOCATION.name}</strong><br/>
                    📍 Bizning manzil
                </div>
            `)

            // Foydalanuvchi belgisi
            const userIcon = window.L.divIcon({
                className: 'user-marker',
                html: `
                    <div style="position: relative; width: 38px; height: 38px; background: linear-gradient(135deg, #ff6b35, #ff3b00); border-radius: 50%; border: 3px solid white; box-shadow: 0 4px 15px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; cursor: pointer;">
                        <div style="width: 10px; height: 10px; background: white; border-radius: 50%;"></div>
                        <div style="position: absolute; bottom: -10px; left: 50%; transform: translateX(-50%); width: 0; height: 0; border-left: 7px solid transparent; border-right: 7px solid transparent; border-top: 10px solid #ff3b00;"></div>
                    </div>
                `,
                iconSize: [38, 38],
                iconAnchor: [19, 38],
                popupAnchor: [0, -38]
            })

            map.on('click', async (e) => {
                if (markerRef.current) {
                    markerRef.current.remove()
                }

                const userLat = e.latlng.lat
                const userLng = e.latlng.lng

                markerRef.current = window.L.marker([userLat, userLng], {
                    icon: userIcon,
                    riseOnHover: true
                }).addTo(map)

                markerRef.current.bindPopup(`
                    <div style="font-family: sans-serif; padding: 6px; text-align: center;">
                        📍 <strong>Sizning manzilingiz</strong>
                    </div>
                `).openPopup()

                setTimeout(() => {
                    if (markerRef.current) markerRef.current.closePopup()
                }, 2500)

                const routeData = await calculateRoute(
                    CAFE_LOCATION.lat, CAFE_LOCATION.lng,
                    userLat, userLng
                )

                if (routeData && routeData.coordinates && routeData.coordinates.length > 0) {
                    setDistance(routeData.distance)
                    drawRoute(routeData.coordinates)
                } else {
                    const R = 6371
                    const dLat = (userLat - CAFE_LOCATION.lat) * Math.PI / 180
                    const dLng = (userLng - CAFE_LOCATION.lng) * Math.PI / 180
                    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                             Math.cos(CAFE_LOCATION.lat * Math.PI / 180) * Math.cos(userLat * Math.PI / 180) *
                             Math.sin(dLng/2) * Math.sin(dLng/2)
                    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
                    const straightDistance = R * c

                    setDistance(straightDistance)
                    drawRoute([[CAFE_LOCATION.lat, CAFE_LOCATION.lng], [userLat, userLng]])
                }

                setSelectedLocation({ lat: userLat, lng: userLng })
                setFormData(prev => ({
                    ...prev,
                    address: `${userLat.toFixed(6)}, ${userLng.toFixed(6)}`
                }))

                try {
                    if (typeof hapticFeedback === 'function') hapticFeedback()
                } catch (err) {}
            })

        } catch (error) {
            console.error('Map yaratish xatosi:', error)
        }
    }, [mapLoaded])

    const productsTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0)
    const totalPrice = productsTotal

    const sendToAdmin = async (orderData) => {
        try {
            let message = `🆕 YANGI BUYURTMA! 🆕\n\n`
            message += `🤖 Telegram ID: ${orderData.telegramId || "Brauzerdan"}\n`
            message += `👤 Mijoz: ${orderData.customer.fullName}\n`
            message += `📞 Telefon: ${orderData.customer.phone}\n`
            message += `📍 Manzil: ${orderData.delivery.address}\n`
            message += `📏 Masofa: ${Number(orderData.delivery.distance || 0).toFixed(2)} km\n`
            message += `⏰ Vaqt: ${orderData.delivery.deliveryTime}\n`
            message += `📝 Izoh: ${orderData.delivery.notes || "Yo'q"}\n\n`
            message += `🛍️ BUYURTMA:\n`
            orderData.items.forEach(item => {
                message += `• ${item.name} x${item.quantity} = ${item.total.toLocaleString()} so'm\n`
            })
            message += `\n💵 JAMI: ${orderData.totalAmount.toLocaleString()} so'm\n`
            message += `🆔 Buyurtma ID: ${orderData.orderId}\n`

            const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chat_id: ADMIN_CHAT_ID,
                    text: message
                })
            })
            const result = await response.json()
            return result.ok
        } catch (error) {
            console.error('Admin xatosi:', error)
            return false
        }
    }

    const sendToUser = async (orderData) => {
        if (!orderData.telegramId) return true

        try {
            let message = `🍔 FRANK BURGER 🍔\n\n`
            message += `✅ Buyurtmangiz qabul qilindi!\n\n`
            message += `🆔 Buyurtma ID: ${orderData.orderId}\n`
            message += `💵 Jami summa: ${orderData.totalAmount.toLocaleString()} so'm\n`
            message += `📏 Masofa: ${Number(orderData.delivery.distance || 0).toFixed(2)} km\n`
            message += `⏰ Yetkazib berish: ${orderData.delivery.deliveryTime}\n`
            message += `📍 Manzil: ${orderData.delivery.address}\n\n`
            message += `📦 Holatni "Buyurtmalar" bo'limidan kuzatishingiz mumkin.`

            const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chat_id: orderData.telegramId,
                    text: message
                })
            })
            const result = await response.json()
            return result.ok
        } catch (error) {
            console.error('Foydalanuvchi xatosi:', error)
            return false
        }
    }

    const saveToFirebase = async (orderData) => {
        try {
            const docRef = await addDoc(ordersCollection, {
                ...orderData,
                createdAt: Timestamp.now()
            })
            return { success: true, id: docRef.id }
        } catch (error) {
            console.error('Firebase xatosi:', error)
            return { success: false, error: error.message }
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        console.log("1. Yuborish bosildi")

        if (!selectedLocation) {
            notify("❌ Iltimos, xaritadan manzilingizni belgilang!")
            return
        }

        if (!formData.deliveryTime) {
            notify("❌ Iltimos, yetkazib berish vaqtini tanlang!")
            return
        }

        if (!formData.phone || !formData.phone.trim()) {
            notify("❌ Iltimos, telefon raqamingizni kiriting!")
            return
        }

        setLoading(true)

        try {
            if (typeof hapticFeedback === 'function') hapticFeedback()
        } catch (err) {}

        const orderData = {
            telegramId: telegramId ? Number(telegramId) : null,
            orderId: Date.now(),
            orderDate: new Date().toISOString(),
            customer: {
                firstName: formData.firstName || '',
                lastName: formData.lastName || '',
                fullName: `${formData.firstName || ''} ${formData.lastName || ''}`.trim(),
                phone: formData.phone
            },
            delivery: {
                address: formData.address,
                coordinates: selectedLocation,
                cafeLocation: CAFE_LOCATION,
                distance: distance || 0,
                deliveryTime: formData.deliveryTime,
                notes: formData.notes || ''
            },
            items: cart.map(item => ({
                id: item.id,
                name: item.name,
                price: item.price,
                quantity: item.quantity,
                total: item.price * item.quantity
            })),
            productsAmount: productsTotal,
            totalAmount: totalPrice,
            status: "Yangi"
        }

        console.log("2. OrderData shakllantirildi:", orderData)

        try {
            const firebaseResult = await saveToFirebase(orderData)
            console.log("3. Firebase javobi:", firebaseResult)

            if (firebaseResult.success) {
                await Promise.allSettled([
                    sendToAdmin(orderData),
                    sendToUser(orderData)
                ])

                localStorage.removeItem('cart')
                notify(`✅ Buyurtma qabul qilindi!\n🆔 ID: ${orderData.orderId}\n💰 Jami: ${totalPrice.toLocaleString()} so'm`)
                navigate('/')
            } else {
                notify(`❌ Firebase xatoligi: ${firebaseResult.error}`)
            }
        } catch (err) {
            console.error('Buyurtma yuborishda umumiy xato:', err)
            notify("❌ Buyurtma yuborishda xatolik yuz berdi. Iltimos konsolni tekshiring.")
        } finally {
            setLoading(false)
        }
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
                        ID: {telegramId}
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
                                    onFocus={handleInputFocus}
                                    placeholder="Ismingiz"
                                    autoComplete="off"
                                />
                            </div>
                            <div className="form-group">
                                <label>Familiya</label>
                                <input
                                    type="text"
                                    name="lastName"
                                    value={formData.lastName}
                                    onChange={handleInputChange}
                                    onFocus={handleInputFocus}
                                    placeholder="Familiyangiz"
                                    autoComplete="off"
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
                                onFocus={handleInputFocus}
                                placeholder="+998 90 123 45 67"
                                autoComplete="off"
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
                            {distance && (
                                <div className="distance-info">
                                    <div className="distance-details">
                                        <span>📏 Masofa:</span>
                                        <strong>{distance.toFixed(2)} km</strong>
                                    </div>
                                </div>
                            )}
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
                                onFocus={handleInputFocus}
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
                                onFocus={handleInputFocus}
                                placeholder="Maxsus talablar (masalan: dom kodi, pod'ezd)..."
                                rows="3"
                            />
                        </div>
                    </div>

                    <div className="form-section">
                        <h2>🛍️ Buyurtma haqida</h2>
                        <div className="order-summary">
                            {cart.map(item => (
                                <div key={item.id} className="order-item">
                                    <span>{item.name} x{item.quantity}</span>
                                    <span>{(item.price * item.quantity).toLocaleString()} so'm</span>
                                </div>
                            ))}

                            {distance && (
                                <div className="order-delivery-info">
                                    <div className="delivery-distance-row">
                                        <span>📏 Masofa:</span>
                                        <span>{distance.toFixed(2)} km</span>
                                    </div>
                                </div>
                            )}

                            <div className="order-total">
                                <strong>Jami to'lov:</strong>
                                <strong className="total-amount">{totalPrice.toLocaleString()} so'm</strong>
                            </div>
                        </div>
                    </div>

                    <button type="submit" className="submit-btn" disabled={loading}>
                        {loading ? "Yuborilmoqda..." : "✅ Buyurtmani tasdiqlash"}
                    </button>
                </form>
            </div>
        </div>
    )
}

export default Checkout
