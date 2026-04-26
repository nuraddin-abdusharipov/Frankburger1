import './Orders.css'
import { useState, useEffect, useRef } from 'react'
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

    // 🔥 TELEGRAM USER
    useEffect(() => {
        const tg = window.Telegram?.WebApp

        if (tg) {
            tg.ready()
            tg.expand()

            const user = tg.initDataUnsafe?.user
            if (user) {
                setTelegramId(user.id)
            } else {
                console.log("User topilmadi")
            }
        }
    }, [])

    // 📦 FETCH ORDERS
    const fetchOrders = async (loadMore = false) => {
        if (!telegramId) return

        setLoading(true)

        try {
            let q

            if (loadMore && lastDoc) {
                q = query(
                    ordersCollection,
                    where("telegramId", "==", telegramId),
                    orderBy("createdAt", "desc"),
                    startAfter(lastDoc),
                    limit(ORDERS_PER_PAGE)
                )
            } else {
                q = query(
                    ordersCollection,
                    where("telegramId", "==", telegramId),
                    orderBy("createdAt", "desc"),
                    limit(ORDERS_PER_PAGE)
                )
            }

            const snapshot = await getDocs(q)

            const data = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }))

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

    useEffect(() => {
        if (telegramId) {
            fetchOrders()
        }
    }, [telegramId])

    // 📥 LOAD MORE
    const loadMore = () => {
        if (!loading && hasMore) {
            fetchOrders(true)
        }
    }

    // 📊 STATUS
    const getStatus = (status) => {
        switch (status) {
            case "Yangi": return "🆕 Yangi"
            case "Tayyorlanmoqda": return "🔧 Tayyorlanmoqda"
            case "Yetkazilmoqda": return "🚚 Yetkazilmoqda"
            case "Bajarilgan": return "✅ Bajarilgan"
            default: return status
        }
    }

    if (loading && orders.length === 0) {
        return <p>Yuklanmoqda...</p>
    }

    return (
        <div className="OrdersPage">

            <div className="orders-header">
                <Link to="/">← Orqaga</Link>
                <h2>Mening zakazlarim</h2>
                <p>ID: {telegramId}</p>
            </div>

            {orders.length === 0 ? (
                <p>Zakazlar yo‘q</p>
            ) : (
                <>
                    {orders.map(order => (
                        <div key={order.id} className="order-card">

                            <div className="order-header">
                                <strong>Zakaz #{order.orderId}</strong>
                                <span>{getStatus(order.status)}</span>
                            </div>

                            <p>
                                📅 {new Date(order.createdAt).toLocaleString()}
                            </p>

                            <p>
                                📍 {(order.delivery?.address || "").substring(0, 40)}
                            </p>

                            <p>
                                💰 {order.totalAmount?.toLocaleString()} so'm
                            </p>

                            <div>
                                {order.items?.slice(0, 2).map((item, i) => (
                                    <p key={i}>
                                        {item.name} x{item.quantity}
                                    </p>
                                ))}
                            </div>

                        </div>
                    ))}

                    {hasMore && (
                        <button onClick={loadMore} disabled={loading}>
                            {loading ? "Yuklanmoqda..." : "Ko‘proq"}
                        </button>
                    )}
                </>
            )}

        </div>
    )
}

export default Orders