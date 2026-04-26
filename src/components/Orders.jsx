import './Orders.css'
import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { db, ordersCollection, getDocs, getDoc, query, where, orderBy, limit, startAfter, doc } from '../firebase'

function Orders() {
    const navigate = useNavigate()
    const [orders, setOrders] = useState([])
    const [selectedOrder, setSelectedOrder] = useState(null)
    const [loading, setLoading] = useState(true)
    const [telegramId, setTelegramId] = useState(null)
    const [lastDoc, setLastDoc] = useState(null)
    const [hasMore, setHasMore] = useState(true)
    const [page, setPage] = useState(1)
    const [totalOrders, setTotalOrders] = useState(0)
    const [leafletLoaded, setLeafletLoaded] = useState(false)
    const mapRef = useRef(null)
    const mapInstanceRef = useRef(null)

    const ORDERS_PER_PAGE = 20

    // Leaflet ni CDN dan yuklash
    useEffect(() => {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(link);
        
        const script = document.createElement('script');
        script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
        script.onload = () => {
            setLeafletLoaded(true);
        };
        document.head.appendChild(script);
        
        return () => {
            if (link.parentNode) document.head.removeChild(link);
            if (script.parentNode) document.head.removeChild(script);
        };
    }, []);

    // Telegram ID olish
    useEffect(() => {
        if (window.Telegram && window.Telegram.WebApp) {
            const webApp = window.Telegram.WebApp;
            const initData = webApp.initDataUnsafe;
            if (initData && initData.user) {
                setTelegramId(initData.user.id);
            }
            webApp.expand();
        } else {
            const testId = localStorage.getItem('test_tg_id');
            setTelegramId(testId ? parseInt(testId) : 7164122768);
        }
    }, [])

    // Xarita yaratish (zakaz detalida)
    useEffect(() => {
        if (selectedOrder && selectedOrder.delivery?.coordinates && mapRef.current && !mapInstanceRef.current && leafletLoaded && window.L) {
            const L = window.L;
            const { lat, lng } = selectedOrder.delivery.coordinates;
            
            const map = L.map(mapRef.current).setView([lat, lng], 15);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap contributors'
            }).addTo(map);
            
            L.marker([lat, lng]).addTo(map)
                .bindPopup(`
                    <b>${selectedOrder.customer?.fullName}</b><br>
                    📞 ${selectedOrder.customer?.phone}<br>
                    📍 ${selectedOrder.delivery?.address}
                `)
                .openPopup();
            
            mapInstanceRef.current = map;
        }
        
        return () => {
            if (mapInstanceRef.current) {
                mapInstanceRef.current.remove();
                mapInstanceRef.current = null;
            }
        };
    }, [selectedOrder, leafletLoaded]);

    const fetchOrders = async (isLoadMore = false) => {
        if (!telegramId) return;
        
        setLoading(true);
        
        try {
            let q;
            
            if (isLoadMore && lastDoc) {
                q = query(
                    ordersCollection,
                    where("telegramId", "==", telegramId),
                    orderBy("orderDate", "desc"),
                    startAfter(lastDoc),
                    limit(ORDERS_PER_PAGE)
                );
            } else {
                q = query(
                    ordersCollection,
                    where("telegramId", "==", telegramId),
                    orderBy("orderDate", "desc"),
                    limit(ORDERS_PER_PAGE)
                );
            }
            
            const querySnapshot = await getDocs(q);
            const ordersData = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            
            const lastVisible = querySnapshot.docs[querySnapshot.docs.length - 1];
            setLastDoc(lastVisible);
            
            setHasMore(ordersData.length === ORDERS_PER_PAGE);
            
            if (isLoadMore) {
                setOrders(prev => [...prev, ...ordersData]);
            } else {
                setOrders(ordersData);
                setPage(1);
            }
            
            const countQuery = query(
                ordersCollection,
                where("telegramId", "==", telegramId)
            );
            const countSnapshot = await getDocs(countQuery);
            setTotalOrders(countSnapshot.size);
            
        } catch (error) {
            console.error('Xatolik:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchOrderDetail = async (id) => {
        try {
            const orderRef = doc(db, 'orders', id);
            const orderSnap = await getDoc(orderRef);
            if (orderSnap.exists()) {
                setSelectedOrder({ id: orderSnap.id, ...orderSnap.data() });
            }
        } catch (error) {
            console.error('Zakaz detalini olishda xatolik:', error);
        }
    };

    const goToOrderDetail = (orderId) => {
        fetchOrderDetail(orderId);
    };

    const closeDetail = () => {
        setSelectedOrder(null);
    };

    useEffect(() => {
        if (telegramId) {
            fetchOrders();
        }
    }, [telegramId]);

    const loadMore = () => {
        if (!loading && hasMore) {
            setPage(prev => prev + 1);
            fetchOrders(true);
        }
    };

    const pendingOrders = orders.filter(o => o.status === "Yangi").length;
    const completedOrders = orders.filter(o => o.status === "Bajarilgan").length;
    const totalAmount = orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);

    const getStatusColor = (status) => {
        switch(status) {
            case 'Yangi': return 'status-new';
            case 'Tayyorlanmoqda': return 'status-preparing';
            case 'Yetkazilmoqda': return 'status-delivering';
            case 'Bajarilgan': return 'status-completed';
            default: return 'status-new';
        }
    };

    const getStatusText = (status) => {
        switch(status) {
            case 'Yangi': return '🆕 Yangi';
            case 'Tayyorlanmoqda': return '🔧 Tayyorlanmoqda';
            case 'Yetkazilmoqda': return '🚚 Yetkazilmoqda';
            case 'Bajarilgan': return '✅ Bajarilgan';
            default: return '🆕 Yangi';
        }
    };

    if (loading && orders.length === 0) {
        return (
            <div className="OrdersPage">
                <div className="loading-container">
                    <div className="loader"></div>
                    <p>Zakazlar yuklanmoqda...</p>
                </div>
            </div>
        )
    }

    // Zakaz detalini ko'rsatish
    if (selectedOrder) {
        return (
            <div className="OrdersPage">
                <div className="orders-header">
                    <button onClick={closeDetail} className="back-btn">
                        ← Orqaga
                    </button>
                    <h1>Zakaz #{selectedOrder.orderId}</h1>
                    <div className="telegram-id-badge">
                        ID: {telegramId}
                    </div>
                </div>

                <div className="order-detail">
                    <div className="detail-section">
                        <h3>👤 Mijoz ma'lumotlari</h3>
                        <div className="detail-row">
                            <span className="detail-label">Ism:</span>
                            <span className="detail-value">{selectedOrder.customer?.firstName} {selectedOrder.customer?.lastName}</span>
                        </div>
                        <div className="detail-row">
                            <span className="detail-label">Telefon:</span>
                            <span className="detail-value">{selectedOrder.customer?.phone}</span>
                        </div>
                        <div className="detail-row">
                            <span className="detail-label">Telegram ID:</span>
                            <span className="detail-value">{selectedOrder.telegramId}</span>
                        </div>
                    </div>

                    <div className="detail-section">
                        <h3>📍 Yetkazib berish ma'lumotlari</h3>
                        <div className="detail-row">
                            <span className="detail-label">Manzil:</span>
                            <span className="detail-value">{selectedOrder.delivery?.address}</span>
                        </div>
                        {selectedOrder.delivery?.coordinates && (
                            <>
                                <div className="detail-row">
                                    <span className="detail-label">Koordinatalar:</span>
                                    <span className="detail-value">
                                        {selectedOrder.delivery.coordinates.lat.toFixed(6)}, {selectedOrder.delivery.coordinates.lng.toFixed(6)}
                                    </span>
                                </div>
                                <div className="detail-row">
                                    <span className="detail-label">Xarita:</span>
                                    <div className="map-container">
                                        <div ref={mapRef} className="order-map"></div>
                                    </div>
                                </div>
                            </>
                        )}
                        <div className="detail-row">
                            <span className="detail-label">Yetkazib berish vaqti:</span>
                            <span className="detail-value">{selectedOrder.delivery?.deliveryTime}</span>
                        </div>
                        <div className="detail-row">
                            <span className="detail-label">Zakaz berilgan vaqt:</span>
                            <span className="detail-value">{new Date(selectedOrder.orderDate).toLocaleString()}</span>
                        </div>
                        <div className="detail-row">
                            <span className="detail-label">Qo'shimcha izoh:</span>
                            <span className="detail-value">{selectedOrder.delivery?.notes || "Yo'q"}</span>
                        </div>
                    </div>

                    <div className="detail-section">
                        <h3>🛍️ Mahsulotlar</h3>
                        <div className="items-list">
                            {selectedOrder.items?.map((item, idx) => (
                                <div key={idx} className="detail-item">
                                    <span>{item.name}</span>
                                    <span>x{item.quantity}</span>
                                    <span>{item.total.toLocaleString()} so'm</span>
                                </div>
                            ))}
                        </div>
                        <div className="detail-total">
                            <strong>Jami:</strong>
                            <strong>{selectedOrder.totalAmount?.toLocaleString()} so'm</strong>
                        </div>
                    </div>

                    <div className="detail-section">
                        <h3>📊 Holati</h3>
                        <div className={`status-badge ${getStatusColor(selectedOrder.status)}`}>
                            {getStatusText(selectedOrder.status)}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Zakazlar ro'yxati
    return (
        <div className="OrdersPage">
            <div className="orders-header">
                <Link to="/" className="back-btn">← Bosh sahifa</Link>
                <h1>Mening zakazlarim</h1>
                <div className="telegram-id-badge">
                    ID: {telegramId}
                </div>
            </div>

            <div className="stats-cards">
                <div className="stat-card">
                    <div className="stat-value">{totalOrders}</div>
                    <div className="stat-label">Jami zakazlar</div>
                </div>
                <div className="stat-card">
                    <div className="stat-value">{totalAmount.toLocaleString()} so'm</div>
                    <div className="stat-label">Jami summa</div>
                </div>
                <div className="stat-card">
                    <div className="stat-value">{pendingOrders}</div>
                    <div className="stat-label">Yangi zakazlar</div>
                </div>
                <div className="stat-card">
                    <div className="stat-value">{completedOrders}</div>
                    <div className="stat-label">Bajarilgan</div>
                </div>
            </div>

            <div className="orders-content">
                {orders.length === 0 ? (
                    <div className="empty-orders">
                        <p>Hech qanday zakaz yo'q</p>
                        <span>📦</span>
                        <Link to="/" className="shop-btn">Mahsulotlar</Link>
                    </div>
                ) : (
                    <>
                        <div className="orders-info">
                            <span>{orders.length} / {totalOrders} ta zakaz</span>
                            <span>Sahifa: {page}</span>
                        </div>

                        {orders.map((order) => (
                            <div 
                                key={order.id} 
                                className="order-card"
                                onClick={() => goToOrderDetail(order.id)}
                                style={{ cursor: 'pointer' }}
                            >
                                <div className="order-header">
                                    <div>
                                        <strong>Zakaz #{order.orderId}</strong>
                                        <p className="order-date">
                                            {new Date(order.orderDate).toLocaleString()}
                                        </p>
                                    </div>
                                    <span className={`order-status ${getStatusColor(order.status)}`}>
                                        {getStatusText(order.status)}
                                    </span>
                                </div>
                                
                                <div className="order-body">
                                    <div className="order-info">
                                        <div className="info-row">
                                            <span className="info-icon">👤</span>
                                            <span>{order.customer?.fullName || order.customer?.firstName + ' ' + order.customer?.lastName}</span>
                                        </div>
                                        <div className="info-row">
                                            <span className="info-icon">📞</span>
                                            <span>{order.customer?.phone}</span>
                                        </div>
                                        <div className="info-row">
                                            <span className="info-icon">📍</span>
                                            <span className="address-text">{order.delivery?.address?.substring(0, 40)}...</span>
                                        </div>
                                        <div className="info-row">
                                            <span className="info-icon">⏰</span>
                                            <span>{order.delivery?.deliveryTime}</span>
                                        </div>
                                        {order.delivery?.notes && (
                                            <div className="info-row">
                                                <span className="info-icon">📝</span>
                                                <span className="order-notes">{order.delivery.notes.substring(0, 30)}...</span>
                                            </div>
                                        )}
                                    </div>
                                    
                                    <div className="order-items">
                                        <div className="items-header">🛍️ Mahsulotlar ({order.items?.length})</div>
                                        {order.items?.slice(0, 2).map((item, idx) => (
                                            <div key={idx} className="order-item">
                                                <span>{item.name} x{item.quantity}</span>
                                                <span>{item.total.toLocaleString()} so'm</span>
                                            </div>
                                        ))}
                                        {order.items?.length > 2 && (
                                            <div className="more-items">
                                                +{order.items.length - 2} ta mahsulot...
                                            </div>
                                        )}
                                    </div>
                                    
                                    <div className="order-total">
                                        <strong>Jami:</strong>
                                        <strong>{order.totalAmount.toLocaleString()} so'm</strong>
                                    </div>
                                </div>
                            </div>
                        ))}

                        {hasMore && (
                            <button 
                                className="load-more-btn" 
                                onClick={loadMore}
                                disabled={loading}
                            >
                                {loading ? "Yuklanmoqda..." : "Ko'proq yuklash ↓"}
                            </button>
                        )}

                        {!hasMore && orders.length > 0 && (
                            <div className="end-message">
                                Barcha zakazlar ko'rsatildi
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    )
}

export default Orders