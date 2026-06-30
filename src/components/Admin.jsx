import './Admin.css'
import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { db, ordersCollection, getDocs, getDoc, updateDoc, doc, orderBy, query } from '../firebase'
import { showTelegramAlert, hapticFeedback } from '../utils/telegram'

function Admin() {
    const navigate = useNavigate()
    const { orderId } = useParams()
    const [orders, setOrders] = useState([])
    const [selectedOrder, setSelectedOrder] = useState(null)
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState('all')
    const [isAdmin, setIsAdmin] = useState(false)
    const [telegramId, setTelegramId] = useState(null)
    const [leafletLoaded, setLeafletLoaded] = useState(false)
    const mapRef = useRef(null)
    const mapInstanceRef = useRef(null)

    const ADMIN_IDS = [7164122768, 7787131118]
    const TELEGRAM_BOT_TOKEN = "8771407234:AAEzpKX2-nm59dbZ-8vjNYy2JZlelQMsRtM"

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

    useEffect(() => {
        if (window.Telegram && window.Telegram.WebApp) {
            const webApp = window.Telegram.WebApp;
            const initData = webApp.initDataUnsafe;
            if (initData && initData.user) {
                const userId = initData.user.id;
                setTelegramId(userId);
                setIsAdmin(ADMIN_IDS.includes(userId));
                
                if (!ADMIN_IDS.includes(userId)) {
                    showTelegramAlert("❌ Siz admin emassiz!");
                    navigate('/');
                }
            }
            webApp.expand();
        } else {
            const testId = parseInt(localStorage.getItem('test_tg_id'));
            setTelegramId(testId);
            setIsAdmin(ADMIN_IDS.includes(testId));
        }
    }, [navigate]);

    useEffect(() => {
        if (isAdmin) {
            fetchOrders();
        }
    }, [isAdmin]);

    useEffect(() => {
        if (orderId && isAdmin) {
            fetchOrderDetail(orderId);
        } else {
            setSelectedOrder(null);
        }
    }, [orderId, isAdmin]);

    useEffect(() => {
        if (selectedOrder && selectedOrder.delivery?.coordinates && mapRef.current && !mapInstanceRef.current && leafletLoaded && window.L) {
            const L = window.L;
            const { lat, lng } = selectedOrder.delivery.coordinates;
            
            const map = L.map(mapRef.current).setView([lat, lng], 15);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap contributors'
            }).addTo(map);
            
            // Kafe joylashuvi (Frank Burger)
            const cafeLocation = selectedOrder.delivery?.cafeLocation || { lat: 41.3783, lng: 60.3639, name: "Frank Burger" };
            
            // Kafe markeri
            const cafeIcon = L.divIcon({
                className: 'cafe-marker',
                html: `
                    <div style="
                        background: #dc3545;
                        width: 40px;
                        height: 40px;
                        border-radius: 50%;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        border: 2px solid white;
                        box-shadow: 0 2px 10px rgba(0,0,0,0.3);
                    ">
                        <span style="font-size: 24px;">🍔</span>
                    </div>
                `,
                iconSize: [40, 40],
                iconAnchor: [20, 40]
            });
            
            L.marker([cafeLocation.lat, cafeLocation.lng], { icon: cafeIcon })
                .addTo(map)
                .bindPopup(`
                    <b>🍔 Frank Burger</b><br>
                    📍 Kafe manzili
                `);
            
            // Foydalanuvchi markeri
            L.marker([lat, lng]).addTo(map)
                .bindPopup(`
                    <b>${selectedOrder.customer?.fullName}</b><br>
                    📞 ${selectedOrder.customer?.phone}<br>
                    📍 ${selectedOrder.delivery?.address}
                `)
                .openPopup();
            
            // Ikki nuqta orasidagi chiziq
            L.polyline([
                [cafeLocation.lat, cafeLocation.lng],
                [lat, lng]
            ], {
                color: '#ff6b35',
                weight: 3,
                opacity: 0.7,
                dashArray: '5, 10'
            }).addTo(map);
            
            // Mapni ikkala nuqtani ko'rsatadigan qilib zoom qilish
            const bounds = L.latLngBounds([[cafeLocation.lat, cafeLocation.lng], [lat, lng]]);
            map.fitBounds(bounds, { padding: [50, 50] });
            
            mapInstanceRef.current = map;
        }
        
        return () => {
            if (mapInstanceRef.current) {
                mapInstanceRef.current.remove();
                mapInstanceRef.current = null;
            }
        };
    }, [selectedOrder, leafletLoaded]);

    const fetchOrders = async () => {
        try {
            const q = query(ordersCollection, orderBy("orderDate", "desc"));
            const querySnapshot = await getDocs(q);
            const ordersData = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setOrders(ordersData);
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
            } else {
                showTelegramAlert('Zakaz topilmadi!');
                navigate('/admin');
            }
        } catch (error) {
            console.error('Zakaz detalini olishda xatolik:', error);
            navigate('/admin');
        }
    };

    const sendStatusMessageToUser = async (orderData, newStatus) => {
        let message = `🍔 FRANK BURGER 🍔\n\n`
        message += `🆔 Buyurtma ID: ${orderData.orderId}\n`
        message += `💰 Mahsulotlar: ${orderData.productsAmount?.toLocaleString() || orderData.totalAmount?.toLocaleString()} so'm\n`
        if (orderData.delivery?.deliveryFee > 0) {
            message += `🚚 Yetkazib berish: ${orderData.delivery.deliveryFee.toLocaleString()} so'm\n`
        }
        message += `💵 Jami: ${orderData.totalAmount?.toLocaleString()} so'm\n`
        if (orderData.delivery?.distance) {
            message += `📏 Masofa: ${orderData.delivery.distance.toFixed(2)} km\n`
        }
        message += `\n`
        
        switch(newStatus) {
            case 'Tayyorlanmoqda':
                message += `👨‍🍳 Sizning buyurtmangiz TAYYORLANMOQDA!\n\n`
                message += `🔧 Oshpazlar buyurtmangizni tayyorlashga kirishdi.\n`
                message += `⏱️ Tez orada yetkazib berish xizmatiga topshiriladi.\n\n`
                message += `📦 Holati: Tayyorlanmoqda 🔧`
                break
                
            case 'Yetkazilmoqda':
                message += `🛵 Sizning buyurtmangiz YETKAZILMOQDA!\n\n`
                message += `🚚 Buyurtmangiz yo'lda! Tez orada sizga yetib boradi.\n`
                message += `📍 Yetkazib beruvchi manzilingizga yo'l oldi.\n\n`
                message += `📦 Holati: Yetkazilmoqda 🚚`
                break
                
            case 'Bajarilgan':
                message += `✅ Sizning buyurtmangiz BAJARILDI!\n\n`
                message += `🎉 Buyurtmangiz muvaffaqiyatli yakunlandi!\n`
                message += `⭐ Bizni tanlaganingiz uchun rahmat!\n`
                message += `🍽️ Yana xush kelibsiz!\n\n`
                message += `📦 Holati: Bajarilgan ✅`
                break
                
            default:
                return false
        }
        
        message += `\n\n☎️ Savollar uchun: +998 XX XXX XX XX`

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
                console.log(`✅ Foydalanuvchiga "${newStatus}" xabari yuborildi`)
                return true
            }
            console.log('Foydalanuvchi xatosi:', result.description)
            return false
        } catch (error) {
            console.error('Xabar yuborishda xatolik:', error)
            return false
        }
    }

    const updateOrderStatus = async (orderId, newStatus, orderData) => {
        try {
            const orderRef = doc(db, 'orders', orderId);
            await updateDoc(orderRef, { status: newStatus });
            
            setOrders(prev => prev.map(order => 
                order.id === orderId ? { ...order, status: newStatus } : order
            ));
            
            if (selectedOrder && selectedOrder.id === orderId) {
                setSelectedOrder(prev => ({ ...prev, status: newStatus }));
            }
            
            const userMessageSent = await sendStatusMessageToUser(orderData || selectedOrder, newStatus)
            
            let statusText = ''
            switch(newStatus) {
                case 'Tayyorlanmoqda': statusText = 'Tayyorlanmoqda 🔧'; break
                case 'Yetkazilmoqda': statusText = 'Yetkazilmoqda 🚚'; break
                case 'Bajarilgan': statusText = 'Bajarilgan ✅'; break
                default: statusText = newStatus
            }
            
            if (userMessageSent) {
                showTelegramAlert(`✅ Buyurtma statusi "${statusText}" ga o'zgartirildi va foydalanuvchiga xabar yuborildi!`)
            } else {
                showTelegramAlert(`✅ Buyurtma statusi "${statusText}" ga o'zgartirildi! (Foydalanuvchiga xabar yuborilmadi)`)
            }
            
            hapticFeedback()
        } catch (error) {
            console.error('Status yangilash xatosi:', error);
            showTelegramAlert('❌ Xatolik yuz berdi!');
        }
    };

    const goToOrderDetail = (orderId) => {
        navigate(`/admin/order/${orderId}`);
    };

    const getFilteredOrders = () => {
        if (filter === 'new') {
            return orders.filter(o => o.status === 'Yangi');
        }
        if (filter === 'preparing') {
            return orders.filter(o => o.status === 'Tayyorlanmoqda');
        }
        if (filter === 'delivering') {
            return orders.filter(o => o.status === 'Yetkazilmoqda');
        }
        if (filter === 'completed') {
            return orders.filter(o => o.status === 'Bajarilgan');
        }
        return orders;
    };

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

    if (!isAdmin) {
        return null;
    }

    if (orderId && selectedOrder) {
        return (
            <div className="AdminPage">
                <div className="admin-header">
                    <button onClick={() => navigate('/admin')} className="back-btn">
                        ← Orqaga
                    </button>
                    <h1>Buyurtma #{selectedOrder.orderId}</h1>
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
                        {/* Masofa ma'lumoti qo'shildi */}
                        {selectedOrder.delivery?.distance && (
                            <div className="detail-row">
                                <span className="detail-label">📏 Masofa:</span>
                                <span className="detail-value distance-value">
                                    {selectedOrder.delivery.distance.toFixed(2)} km
                                </span>
                            </div>
                        )}
                        {/* Yetkazib berish narxi qo'shildi */}
                        {selectedOrder.delivery?.deliveryFee !== undefined && (
                            <div className="detail-row">
                                <span className="detail-label">🚚 Yetkazib berish narxi:</span>
                                <span className={`detail-value ${selectedOrder.delivery.deliveryFee > 0 ? 'fee-amount' : 'free-delivery'}`}>
                                    {selectedOrder.delivery.deliveryFee > 0 
                                        ? `${selectedOrder.delivery.deliveryFee.toLocaleString()} so'm` 
                                        : 'Bepul'}
                                </span>
                            </div>
                        )}
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
                            <span className="detail-label">Buyurtma berilgan vaqt:</span>
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
                        {/* Mahsulotlar summasi */}
                        <div className="detail-subtotal">
                            <span>Mahsulotlar summasi:</span>
                            <span>{selectedOrder.productsAmount?.toLocaleString() || selectedOrder.totalAmount?.toLocaleString()} so'm</span>
                        </div>
                        {/* Yetkazib berish narxi (agar mavjud bo'lsa) */}
                        {selectedOrder.delivery?.deliveryFee > 0 && (
                            <div className="detail-delivery-fee">
                                <span>Yetkazib berish:</span>
                                <span>+ {selectedOrder.delivery.deliveryFee.toLocaleString()} so'm</span>
                            </div>
                        )}
                        <div className="detail-total">
                            <strong>Jami to'lov:</strong>
                            <strong>{selectedOrder.totalAmount?.toLocaleString()} so'm</strong>
                        </div>
                    </div>

                    <div className="detail-section">
                        <h3>📊 Holati</h3>
                        <div className="status-section">
                            <div className={`status-badge ${getStatusColor(selectedOrder.status)}`}>
                                {getStatusText(selectedOrder.status)}
                            </div>
                            
                            <div className="status-buttons">
                                {selectedOrder.status !== 'Tayyorlanmoqda' && selectedOrder.status !== 'Yetkazilmoqda' && selectedOrder.status !== 'Bajarilgan' && (
                                    <button 
                                        className="status-btn preparing-btn"
                                        onClick={() => updateOrderStatus(selectedOrder.id, 'Tayyorlanmoqda', selectedOrder)}
                                    >
                                        🔧 Tayyorlanmoqda
                                    </button>
                                )}
                                
                                {selectedOrder.status === 'Tayyorlanmoqda' && (
                                    <button 
                                        className="status-btn delivering-btn"
                                        onClick={() => updateOrderStatus(selectedOrder.id, 'Yetkazilmoqda', selectedOrder)}
                                    >
                                        🚚 Yetkazilmoqda
                                    </button>
                                )}
                                
                                {selectedOrder.status === 'Yetkazilmoqda' && (
                                    <button 
                                        className="status-btn complete-btn"
                                        onClick={() => updateOrderStatus(selectedOrder.id, 'Bajarilgan', selectedOrder)}
                                    >
                                        ✅ Bajarilgan
                                    </button>
                                )}
                                
                                {selectedOrder.status === 'Bajarilgan' && (
                                    <div className="completed-message">
                                        ✅ Bu buyurtma bajarilgan
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    const filteredOrders = getFilteredOrders();
    const stats = {
        total: orders.length,
        new: orders.filter(o => o.status === 'Yangi').length,
        preparing: orders.filter(o => o.status === 'Tayyorlanmoqda').length,
        delivering: orders.filter(o => o.status === 'Yetkazilmoqda').length,
        completed: orders.filter(o => o.status === 'Bajarilgan').length
    };

    return (
        <div className="AdminPage">
            <div className="admin-header">
                <Link to="/" className="back-btn">← Bosh sahifa</Link>
                <h1>👑 Admin panel</h1>
                <Link to="/profile" className="profile-link">👤 Profil</Link>
            </div>

            <div className="admin-stats">
                <div className="stat-card">
                    <div className="stat-value">{stats.total}</div>
                    <div className="stat-label">Jami buyurtmalar</div>
                </div>
                <div className="stat-card">
                    <div className="stat-value">{stats.new}</div>
                    <div className="stat-label">Yangi</div>
                </div>
                <div className="stat-card">
                    <div className="stat-value">{stats.preparing}</div>
                    <div className="stat-label">Tayyorlanmoqda</div>
                </div>
                <div className="stat-card">
                    <div className="stat-value">{stats.delivering}</div>
                    <div className="stat-label">Yetkazilmoqda</div>
                </div>
                <div className="stat-card">
                    <div className="stat-value">{stats.completed}</div>
                    <div className="stat-label">Bajarilgan</div>
                </div>
            </div>

            <div className="admin-filters">
                <button className={`filter-btn ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>Hammasi</button>
                <button className={`filter-btn ${filter === 'new' ? 'active' : ''}`} onClick={() => setFilter('new')}>🆕 Yangi</button>
                <button className={`filter-btn ${filter === 'preparing' ? 'active' : ''}`} onClick={() => setFilter('preparing')}>🔧 Tayyorlanmoqda</button>
                <button className={`filter-btn ${filter === 'delivering' ? 'active' : ''}`} onClick={() => setFilter('delivering')}>🚚 Yetkazilmoqda</button>
                <button className={`filter-btn ${filter === 'completed' ? 'active' : ''}`} onClick={() => setFilter('completed')}>✅ Bajarilgan</button>
            </div>

            <div className="admin-orders">
                {loading ? (
                    <div className="loading">Yuklanmoqda...</div>
                ) : filteredOrders.length === 0 ? (
                    <div className="empty">Buyurtmalar yo'q</div>
                ) : (
                    filteredOrders.map((order) => (
                        <div 
                            key={order.id} 
                            className="admin-order-card"
                            onClick={() => goToOrderDetail(order.id)}
                        >
                            <div className="order-header">
                                <div>
                                    <strong>Buyurtma #{order.orderId}</strong>
                                    <p className="order-date">📅 {new Date(order.orderDate).toLocaleString()}</p>
                                    <p className="order-telegram">🤖 TG ID: {order.telegramId}</p>
                                </div>
                                <div className={`order-status-badge ${getStatusColor(order.status)}`}>
                                    {getStatusText(order.status)}
                                </div>
                            </div>
                            
                            <div className="order-body">
                                <div className="order-info">
                                    <p>👤 {order.customer?.fullName || order.customer?.firstName + ' ' + order.customer?.lastName}</p>
                                    <p>📞 {order.customer?.phone}</p>
                                    <p>📍 {order.delivery?.address?.substring(0, 40)}...</p>
                                    <p>⏰ {order.delivery?.deliveryTime}</p>
                                    {/* Masofa ko'rsatilgan */}
                                    {order.delivery?.distance && (
                                        <p>📏 {order.delivery.distance.toFixed(2)} km</p>
                                    )}
                                </div>
                                
                                <div className="order-items-preview">
                                    {order.items?.slice(0, 2).map((item, idx) => (
                                        <span key={idx} className="item-tag">{item.name} x{item.quantity}</span>
                                    ))}
                                    {order.items?.length > 2 && <span className="item-tag">+{order.items.length - 2} ta</span>}
                                </div>
                                
                                <div className="order-total-preview">
                                    <div className="total-amount">
                                        <strong>{order.totalAmount?.toLocaleString()} so'm</strong>
                                    </div>
                                    {order.delivery?.deliveryFee > 0 && (
                                        <div className="delivery-fee-preview">
                                            <small>🚚 +{order.delivery.deliveryFee.toLocaleString()} so'm</small>
                                        </div>
                                    )}
                                    {order.delivery?.deliveryFee === 0 && order.delivery?.distance > 0 && (
                                        <div className="free-delivery-preview">
                                            <small>✅ Bepul yetkazib berish</small>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

export default Admin
