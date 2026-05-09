import './Orders.css'
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
    ordersCollection,
    getDocs,
    query,
    where,
    orderBy,
    limit,
    startAfter
} from '../firebase'

function Orders() {
    const [orders, setOrders] = useState([])
    const [loading, setLoading] = useState(true)
    const [telegramId, setTelegramId] = useState(null)
    const [lastDoc, setLastDoc] = useState(null)
    const [hasMore, setHasMore] = useState(true)

    const ORDERS_PER_PAGE = 10

    useEffect(() => {
        const tg = window.Telegram?.WebApp

        if (tg) {
            tg.ready()
            tg.expand()

            const user = tg.initDataUnsafe?.user

            if (user?.id) {
                setTelegramId(user.id)
            } else {
                console.log("Telegram user yo‘q, test uchun ID: 7787131118")
            }
        } else {
            console.log("Telegram yo‘q — test mode")
        }
    }, [])

    const fetchOrders = async (loadMore = false) => {
        if (!telegramId) return

        setLoading(true)

        try {
            let q
            
            if (loadMore && lastDoc) {
                q = query(
                    ordersCollection,
                    where("telegramId", "==", Number(telegramId)),
                    startAfter(lastDoc),
                    limit(ORDERS_PER_PAGE)
                )
            } else {
                q = query(
                    ordersCollection,
                    where("telegramId", "==", Number(telegramId)),
                    limit(ORDERS_PER_PAGE)
                )
            }

            const snapshot = await getDocs(q)

            let data = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }))

            data = data.sort((a, b) => {
                const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(0)
                const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(0)
                return dateB - dateA
            })

            const lastVisible = snapshot.docs[snapshot.docs.length - 1]

            setLastDoc(lastVisible)
            setHasMore(data.length === ORDERS_PER_PAGE)

            if (loadMore) {
                setOrders(prev => [...prev, ...data])
            } else {
                setOrders(data)
            }

        } catch (err) {
            console.error("🔥 Firebase xatolik:", err)
            try {
                const q = query(ordersCollection, limit(ORDERS_PER_PAGE))
                const snapshot = await getDocs(q)
                let allOrders = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }))
                allOrders = allOrders.filter(order => order.telegramId === Number(telegramId))
                allOrders = allOrders.sort((a, b) => {
                    const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(0)
                    const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(0)
                    return dateB - dateA
                })
                setOrders(allOrders)
                setHasMore(false)
            } catch (err2) {
                console.error("Yana xatolik:", err2)
            }
        }

        setLoading(false)
    }

    useEffect(() => {
        if (telegramId) {
            fetchOrders()
        }
    }, [telegramId])

    const loadMore = () => {
        if (!loading && hasMore) {
            fetchOrders(true)
        }
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

    const formatDate = (timestamp) => {
        if (!timestamp) return "Sana yo‘q"
        if (timestamp.toDate) {
            return timestamp.toDate().toLocaleString('uz-UZ')
        }
        if (timestamp.seconds) {
            return new Date(timestamp.seconds * 1000).toLocaleString('uz-UZ')
        }
        return "Sana yo‘q"
    }

    if (!telegramId) {
        return (
            <div className="OrdersPage">
                <div className="orders-header">
                    <Link style={{textDecoration: "none"}} to="/">← Orqaga</Link>
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
                    <Link to="/">← Orqaga</Link>
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
                            <div key={order.id} className="order-card">

                                <div className="order-header">
                                    <strong className="order-number">Buyurtma #{order.orderId || order.id.slice(-6)}</strong>
                                    <span className={`order-status status-${order.status?.toLowerCase() || 'yangi'}`}>
                                        {getStatus(order.status)}
                                    </span>
                                </div>

                                <div className="order-info">
                                    <p className="order-date">
                                        📅 {formatDate(order.createdAt)}
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

                                    <p className="order-total">
                                        💰Narxi <strong>{order.totalAmount?.toLocaleString() || 0} so'm</strong>
                                    </p>
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