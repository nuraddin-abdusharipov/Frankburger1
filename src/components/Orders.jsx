import './Orders.css'
import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
    ordersCollection,
    getDocs,
    getDoc,
    doc,
    query,
    where,
    orderBy,
    limit,
    startAfter
} from '../firebase'

function Orders() {
    const navigate = useNavigate()
    const { orderId } = useParams()
    const [orders, setOrders] = useState([])
    const [selectedOrder, setSelectedOrder] = useState(null)
    const [loading, setLoading] = useState(true)
    const [telegramId, setTelegramId] = useState(null)
    const [lastDoc, setLastDoc] = useState(null)
    const [hasMore, setHasMore] = useState(true)
    const [leafletLoaded, setLeafletLoaded] = useState(false)
    const mapRef = useRef(null)
    const mapInstanceRef = useRef(null)

    const ORDERS_PER_PAGE = 10

    // Leaflet ni yuklash
    useEffect(() => {
        // CSS yuklash
        const link = document.createElement('link')
        link.rel = 'stylesheet'
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
        document.head.appendChild(link)

        // JS yuklash
        const script = document.createElement('script')
        script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
        script.onload = () => {
            setLeafletLoaded(true)
        }
        script.onerror = () => {
            console.error('Leaflet yuklanmadi')
        }
        document.head.appendChild(script)

        return () => {
            if (link.parentNode) document.head.removeChild(link)
            if (script.parentNode) document.head.removeChild(script)
        }
    }, [])

    // Xaritani ko'rsatish - faqat xarita qismi
    useEffect(() => {
        if (selectedOrder && selectedOrder.delivery?.coordinates && leafletLoaded && window.L && mapRef.current) {
            // Eski xaritani tozalash
            if (mapInstanceRef.current) {
                mapInstanceRef.current.remove()
                mapInstanceRef.current = null
            }

            const L = window.L
            const { lat, lng } = selectedOrder.delivery.coordinates
            const cafeLocation = selectedOrder.delivery?.cafeLocation || { lat: 41.3783, lng: 60.3639 }
            
            // Xaritani yaratish
            const map = L.map(mapRef.current).setView([lat, lng], 13)
            
            // Xarita asosiy qatlami
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap contributors'
            }).addTo(map)
            
            // Kafe markeri
            const cafeIcon = L.icon({
                iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
                iconSize: [25, 41],
                iconAnchor: [12, 41],
                popupAnchor: [1, -34],
                shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png'
            })
            
            // Foydalanuvchi markeri (qizil rangda)
            const userIcon = L.icon({
                iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
                iconSize: [25, 41],
                iconAnchor: [12, 41],
                popupAnchor: [1, -34],
                shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png'
            })
            
            // Kafe markeri qo'shish
            L.marker([cafeLocation.lat, cafeLocation.lng], { icon: cafeIcon })
                .addTo(map)
                .bindPopup('<b>🍔 Frank Burger</b><br/>Kafe manzili')
            
            // Foydalanuvchi markeri qo'shish
            L.marker([lat, lng], { icon: userIcon })
                .addTo(map)
                .bindPopup(`
                    <b>${selectedOrder.customer?.fullName || 'Mijoz'}</b><br/>
                    📞 ${selectedOrder.customer?.phone || 'Telefon yoq'}<br/>
                    📍 ${selectedOrder.delivery?.address?.substring(0, 50) || 'Manzil'}
                `)
                .openPopup()
            
            // Ikki nuqta orasidagi chiziq
            L.polyline([
                [cafeLocation.lat, cafeLocation.lng],
                [lat, lng]
            ], {
                color: '#ff6b35',
                weight: 3,
                opacity: 0.7
            }).addTo(map)
            
            // Ikkala nuqtani ko'rsatish
            const bounds = L.latLngBounds([[cafeLocation.lat, cafeLocation.lng], [lat, lng]])
            map.fitBounds(bounds, { padding: [30, 30] })
            
            mapInstanceRef.current = map
        }
        
        return () => {
            if (mapInstanceRef.current) {
                mapInstanceRef.current.remove()
                mapInstanceRef.current = null
            }
        }
    }, [selectedOrder, leafletLoaded])

    useEffect(() => {
        const tg = window.Telegram?.WebApp

        if (tg) {
            tg.ready()
            tg.expand()

            const user = tg.initDataUnsafe?.user

            if (user?.id) {
                setTelegramId(user.id)
            } else {
                setTelegramId(7787131118)
            }
        } else {
            setTelegramId(7787131118)
        }
    }, [])

    useEffect(() => {
        if (orderId && telegramId) {
            fetchOrderDetail(orderId)
        } else if (telegramId) {
            fetchOrders()
        }
    }, [orderId, telegramId])

    const fetchOrderDetail = async (id) => {
        setLoading(true)
        try {
            const orderRef = doc(ordersCollection, id)
            const orderSnap = await getDoc(orderRef)
            if (orderSnap.exists()) {
                const orderData = { id: orderSnap.id, ...orderSnap.data() }
                if (orderData.telegramId === Number(telegramId)) {
                    setSelectedOrder(orderData)
                } else {
                    alert("❌ Siz bu buyurtmani ko'rish huquqiga ega emassiz!")
                    navigate('/orders')
                }
            } else {
                alert("Buyurtma topilmadi!")
                navigate('/orders')
            }
        } catch (error) {
            console.error('Xatolik:', error)
            navigate('/orders')
        } finally {
            setLoading(false)
        }
    }

    const fetchOrders = async (loadMore = false) => {
        if (!telegramId) return

        setLoading(true)

        try {
            let q
            
            if (loadMore && lastDoc) {
                q = query(
                    ordersCollection,
                    where("telegramId", "==", Number(telegramId)),
                    orderBy("orderDate", "desc"),
                    startAfter(lastDoc),
                    limit(ORDERS_PER_PAGE)
                )
            } else {
                q = query(
                    ordersCollection,
                    where("telegramId", "==", Number(telegramId)),
                    orderBy("orderDate", "desc"),
                    limit(ORDERS_PER_PAGE)
                )
            }

            const snapshot = await getDocs(q)
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
            const lastVisible = snapshot.docs[snapshot.docs.length - 1]

            setLastDoc(lastVisible)
            setHasMore(data.length === ORDERS_PER_PAGE)

            if (loadMore) {
                setOrders(prev => [...prev, ...data])
            } else {
                setOrders(data)
            }
        } catch (err) {
            console.error("Xatolik:", err)
        }

        setLoading(false)
    }

    const loadMore = () => {
        if (!loading && hasMore) {
            fetchOrders(true)
        }
    }

    const goToOrderDetail = (orderId) => {
        navigate(`/orders/${orderId}`)
    }

    const goBack = () => {
        navigate('/orders')
        setSelectedOrder(null)
    }

    const getStatus = (status) => {
        switch (status) {
            case "Yangi": return "🆕 Yangi"
            case "Tayyorlanmoqda": return "🔧 Tayyorlanmoqda"
            case "Yetkazilmoqda": return "🚚 Yetkazilmoqda"
            case "Bajarilgan": return "✅ Bajarilgan"
            default: return status
        }
    }

    const getStatusColor = (status) => {
        switch(status) {
            case 'Yangi': return 'status-new'
            case 'Tayyorlanmoqda': return 'status-preparing'
            case 'Yetkazilmoqda': return 'status-delivering'
            case 'Bajarilgan': return 'status-completed'
            default: return 'status-new'
        }
    }

    const formatDate = (timestamp) => {
        if (!timestamp) return "Sana yo‘q"
        if (timestamp.toDate) {
            return timestamp.toDate().toLocaleString('uz-UZ')
        }
        if (timestamp.seconds) {
            return new Date(timestamp.seconds * 1000).toLocaleString('uz-UZ')
        }
        if (typeof timestamp === 'string') {
            return new Date(timestamp).toLocaleString('uz-UZ')
        }
        return "Sana yo‘q"
    }

    // Buyurtma detali sahifasi
    if (orderId && selectedOrder) {
        return (
            <div className="OrdersPage">
                <div className="orders-header">
                    <button onClick={goBack} className="back-btn">
                        ← Orqaga
                    </button>
                    <h2>Buyurtma #{selectedOrder.orderId || selectedOrder.id.slice(-6)}</h2>
                </div>

                <div className="order-detail-page">
                    <div className="detail-section">
                        <h3>📋 Buyurtma ma'lumotlari</h3>
                        <div className="detail-row">
                            <span className="detail-label">Holati:</span>
                            <span className={`status-badge-detail ${getStatusColor(selectedOrder.status)}`}>
                                {getStatus(selectedOrder.status)}
                            </span>
                        </div>
                        <div className="detail-row">
                            <span className="detail-label">Buyurtma vaqti:</span>
                            <span className="detail-value">{formatDate(selectedOrder.createdAt || selectedOrder.orderDate)}</span>
                        </div>
                        {selectedOrder.delivery?.deliveryTime && (
                            <div className="detail-row">
                                <span className="detail-label">Yetkazib berish vaqti:</span>
                                <span className="detail-value">{selectedOrder.delivery.deliveryTime}</span>
                            </div>
                        )}
                    </div>

                    <div className="detail-section">
                        <h3>📍 Yetkazib berish manzili</h3>
                        <div className="detail-row">
                            <span className="detail-label">Manzil:</span>
                            <span className="detail-value">{selectedOrder.delivery?.address || "Manzil yo'q"}</span>
                        </div>
                        {selectedOrder.delivery?.distance && (
                            <div className="detail-row">
                                <span className="detail-label">📏 Masofa:</span>
                                <span className="detail-value distance-value">
                                    {selectedOrder.delivery.distance.toFixed(2)} km
                                </span>
                            </div>
                        )}
                        {selectedOrder.delivery?.deliveryFee !== undefined && (
                            <div className="detail-row">
                                <span className="detail-label">🚚 Yetkazib berish:</span>
                                <span className={`detail-value ${selectedOrder.delivery.deliveryFee > 0 ? 'fee-amount' : 'free-delivery'}`}>
                                    {selectedOrder.delivery.deliveryFee > 0 
                                        ? `${selectedOrder.delivery.deliveryFee.toLocaleString()} so'm` 
                                        : 'Bepul'}
                                </span>
                            </div>
                        )}
                        {selectedOrder.delivery?.notes && (
                            <div className="detail-row">
                                <span className="detail-label">Qo'shimcha izoh:</span>
                                <span className="detail-value">{selectedOrder.delivery.notes}</span>
                            </div>
                        )}
                    </div>

                    {/* Xarita qismi - TO'G'RILANGAN */}
                    {selectedOrder.delivery?.coordinates && (
                        <div className="detail-section">
                            <h3>🗺️ Manzil xaritada</h3>
                            <div className="coordinates-info">
                                <p>Latitude: {selectedOrder.delivery.coordinates.lat.toFixed(6)}</p>
                                <p>Longitude: {selectedOrder.delivery.coordinates.lng.toFixed(6)}</p>
                            </div>
                            {/* Xarita shu divga yuklanadi */}
                            <div 
                                ref={mapRef} 
                                className="order-map-container"
                                style={{ width: '100%', height: '300px', borderRadius: '12px', overflow: 'hidden', margin: '10px 0' }}
                            ></div>
                            <a 
                                href={`https://www.google.com/maps?q=${selectedOrder.delivery.coordinates.lat},${selectedOrder.delivery.coordinates.lng}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="map-link"
                                style={{ display: 'inline-block', marginTop: '10px', color: '#4285f4', textDecoration: 'none' }}
                            >
                                🗺️ Google Maps da ochish
                            </a>
                        </div>
                    )}

                    <div className="detail-section">
                        <h3>🛍️ Mahsulotlar</h3>
                        <div className="items-list-detail">
                            {selectedOrder.items?.map((item, idx) => (
                                <div key={idx} className="detail-item">
                                    <div className="item-info">
                                        <span className="item-name">{item.name}</span>
                                        <span className="item-quantity">x{item.quantity}</span>
                                    </div>
                                    <span className="item-price">{item.total.toLocaleString()} so'm</span>
                                </div>
                            ))}
                        </div>
                        
                        <div className="price-breakdown">
                            <div className="subtotal-row">
                                <span>Mahsulotlar summasi:</span>
                                <span>{selectedOrder.productsAmount?.toLocaleString() || selectedOrder.totalAmount?.toLocaleString()} so'm</span>
                            </div>
                            {selectedOrder.delivery?.deliveryFee > 0 && (
                                <div className="delivery-row-detail">
                                    <span>Yetkazib berish:</span>
                                    <span>+ {selectedOrder.delivery.deliveryFee.toLocaleString()} so'm</span>
                                </div>
                            )}
                            <div className="total-row">
                                <strong>Jami to'lov:</strong>
                                <strong className="total-amount-detail">{selectedOrder.totalAmount?.toLocaleString()} so'm</strong>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    // Buyurtmalar ro'yxati sahifasi
    if (!telegramId) {
        return (
            <div className="OrdersPage">
                <div className="orders-header">
                    <Link to="/" className="back-link">← Orqaga</Link>
                    <h2>Mening buyurtmalarim</h2>
                </div>
                <p style={{ textAlign: 'center', padding: '20px' }}>⏳ Yuklanmoqda...</p>
            </div>
        )
    }

    if (loading && orders.length === 0) {
        return (
            <div className="OrdersPage">
                <div className="orders-header">
                    <Link to="/" className="back-link">← Orqaga</Link>
                    <h2>Mening buyurtmalarim</h2>
                </div>
                <p style={{ textAlign: 'center', padding: '20px' }}>⏳ Buyurtmalar yuklanmoqda...</p>
            </div>
        )
    }

    return (
        <div className="OrdersPage">
            <div className="orders-header">
                <Link to="/" className="back-link">← Orqaga</Link>
                <h2>📦 Mening buyurtmalarim</h2>
                <p className="telegram-id-text">ID: {telegramId}</p>
            </div>

            {orders.length === 0 ? (
                <div className="no-orders">
                    <p>😕 Siz hali buyurtma bermagansiz</p>
                    <Link to="/" className="order-now-btn">Buyurtma berish</Link>
                </div>
            ) : (
                <>
                    <div className="orders-list">
                        {orders.map(order => (
                            <div 
                                key={order.id} 
                                className="order-card"
                                onClick={() => goToOrderDetail(order.id)}
                            >
                                <div className="order-header">
                                    <strong className="order-number">Buyurtma #{order.orderId || order.id.slice(-6)}</strong>
                                    <span className={`order-status status-${order.status?.toLowerCase() || 'yangi'}`}>
                                        {getStatus(order.status)}
                                    </span>
                                </div>

                                <div className="order-info">
                                    <p className="order-date">
                                        📅 {formatDate(order.createdAt || order.orderDate)}
                                    </p>

                                    <p className="order-address">
                                        📍 {order.delivery?.address ? 
                                            (order.delivery.address.length > 50 ? 
                                                order.delivery.address.substring(0, 50) + '...' : 
                                                order.delivery.address
                                            ) : 
                                            "Manzil yo‘q"
                                        }
                                    </p>

                                    {order.delivery?.distance && (
                                        <p className="order-distance">
                                            📏 {order.delivery.distance.toFixed(2)} km
                                        </p>
                                    )}

                                    <div className="order-price-info">
                                        <p className="order-total">
                                            💰 Mahsulotlar: <strong>{(order.productsAmount || order.totalAmount)?.toLocaleString() || 0} so'm</strong>
                                        </p>
                                        {order.delivery?.deliveryFee > 0 && (
                                            <p className="order-delivery-fee">
                                                🚚 Yetkazib berish: <strong>{order.delivery.deliveryFee.toLocaleString()} so'm</strong>
                                            </p>
                                        )}
                                        <p className="order-total-amount">
                                            💵 Jami: <strong>{(order.totalAmount)?.toLocaleString() || 0} so'm</strong>
                                        </p>
                                    </div>
                                </div>

                                <div className="order-items">
                                    <p className="items-title">🛍️ Mahsulotlar:</p>
                                    {order.items?.slice(0, 3).map((item, i) => (
                                        <p key={i} className="order-item">
                                            • {item.name} x{item.quantity} = {(item.price * item.quantity).toLocaleString()} so'm
                                        </p>
                                    ))}
                                    {order.items?.length > 3 && (
                                        <p className="more-items">... va {order.items.length - 3} ta mahsulot</p>
                                    )}
                                </div>

                                {order.delivery?.deliveryTime && (
                                    <div className="order-delivery-time">
                                        ⏰ Yetkazib berish: {order.delivery.deliveryTime}
                                    </div>
                                )}

                                <div className="order-detail-link">
                                    <span>Batafsil →</span>
                                </div>
                            </div>
                        ))}
                    </div>

                    {hasMore && (
                        <button 
                            onClick={loadMore} 
                            disabled={loading}
                            className="load-more-btn"
                        >
                            {loading ? "⏳ Yuklanmoqda..." : "📥 Ko‘proq yuklash"}
                        </button>
                    )}
                </>
            )}
        </div>
    )
}

export default Orders