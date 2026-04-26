import './Profile.css'
import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { db, ordersCollection, getDocs, query, where } from '../firebase'

function Profile() {
    const navigate = useNavigate()
    const [user, setUser] = useState(null)
    const [telegramId, setTelegramId] = useState(null)
    const [isAdmin, setIsAdmin] = useState(false)
    const [ordersCount, setOrdersCount] = useState(0)
    const [totalSpent, setTotalSpent] = useState(0)
    const [loading, setLoading] = useState(true)

    const ADMIN_IDS = [7164122768, 123456789] 

    useEffect(() => {
        if (window.Telegram && window.Telegram.WebApp) {
            const webApp = window.Telegram.WebApp;
            const initData = webApp.initDataUnsafe;
            
            if (initData && initData.user) {
                const userData = initData.user;
                setTelegramId(userData.id);
                setUser({
                    id: userData.id,
                    firstName: userData.first_name,
                    lastName: userData.last_name || '',
                    username: userData.username || '',
                    photoUrl: userData.photo_url || null,
                    languageCode: userData.language_code || 'uz'
                });
                
                setIsAdmin(ADMIN_IDS.includes(userData.id));
            }
            webApp.expand();
        } else {
            const testId = parseInt(localStorage.getItem('test_tg_id') || '7164122768');
            setTelegramId(testId);
            setUser({
                id: testId,
                firstName: 'Test',
                lastName: 'User',
                username: 'test_user',
                photoUrl: null,
                languageCode: 'uz'
            });
            setIsAdmin(ADMIN_IDS.includes(testId));
        }
    }, []);

    useEffect(() => {
        if (telegramId) {
            fetchUserStats();
        }
    }, [telegramId]);

    const fetchUserStats = async () => {
        try {
            const q = query(
                ordersCollection,
                where("telegramId", "==", telegramId)
            );
            const querySnapshot = await getDocs(q);
            const orders = querySnapshot.docs.map(doc => doc.data());
            
            setOrdersCount(orders.length);
            const total = orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
            setTotalSpent(total);
        } catch (error) {
            console.error('Statistika xatosi:', error);
        } finally {
            setLoading(false);
        }
    };

    const goToAdminPanel = () => {
        navigate('/admin');
    };

    const formatDate = () => {
        return new Date().toLocaleDateString('uz-UZ', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    if (loading) {
        return (
            <div className="ProfilePage">
                <div className="loading-container">
                    <div className="loader"></div>
                    <p>Yuklanmoqda...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="ProfilePage">
            <div className="profile-header">
                <Link to="/" className="back-btn">← Bosh sahifa</Link>
                <h1>Profil</h1>
            </div>

            <div className="profile-content">
                <div className="profile-avatar-section">
                    <div className="avatar">
                        {user?.photoUrl ? (
                            <img src={user.photoUrl} alt="Avatar" />
                        ) : (
                            <div className="avatar-placeholder">
                                {user?.firstName?.charAt(0) || 'U'}
                            </div>
                        )}
                    </div>
                    <h2 className="user-name">
                        {user?.firstName} {user?.lastName}
                    </h2>
                    {user?.username && (
                        <p className="user-username">@{user.username}</p>
                    )}
                    <div className="telegram-id">
                        🤖 ID: {telegramId}
                    </div>
                </div>

                {isAdmin && (
                    <div className="admin-section">
                        <button onClick={goToAdminPanel} className="admin-btn">
                            👑 Admin panelga o'tish
                        </button>
                    </div>
                )}

                <div className="stats-section">
                    <h3>Statistika</h3>
                    <div className="stats-grid">
                        <div className="stat-item">
                            <div className="stat-icon">📦</div>
                            <div className="stat-info">
                                <span className="stat-number">{ordersCount}</span>
                                <span className="stat-label">ta zakaz</span>
                            </div>
                        </div>
                        <div className="stat-item">
                            <div className="stat-icon">💰</div>
                            <div className="stat-info">
                                <span className="stat-number">{totalSpent.toLocaleString()}</span>
                                <span className="stat-label">so'm</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="info-section">
                    <h3>Ma'lumotlar</h3>
                    <div className="info-list">
                        <div className="info-row">
                            <span className="info-label">Ism:</span>
                            <span className="info-value">{user?.firstName || '-'}</span>
                        </div>
                        <div className="info-row">
                            <span className="info-label">Familiya:</span>
                            <span className="info-value">{user?.lastName || '-'}</span>
                        </div>
                        <div className="info-row">
                            <span className="info-label">Username:</span>
                            <span className="info-value">@{user?.username || '-'}</span>
                        </div>
                        <div className="info-row">
                            <span className="info-label">Telegram ID:</span>
                            <span className="info-value">{telegramId}</span>
                        </div>
                        <div className="info-row">
                            <span className="info-label">Til:</span>
                            <span className="info-value">{user?.languageCode || 'uz'}</span>
                        </div>
                        <div className="info-row">
                            <span className="info-label">A'zo bo'lgan:</span>
                            <span className="info-value">{formatDate()}</span>
                        </div>
                    </div>
                </div>

                <Link to="/orders" className="my-orders-btn">
                    📋 Mening zakazlarim
                </Link>
            </div>
        </div>
    );
}

export default Profile