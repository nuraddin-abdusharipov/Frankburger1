import './Profile.css'
import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { db, ordersCollection, getDocs, query, where } from '../firebase'
import { getTelegramUser, expandTelegramApp, showTelegramAlert } from '../utils/telegram'

function Profile() {
    const navigate = useNavigate()
    const [user, setUser] = useState(null)
    const [telegramId, setTelegramId] = useState(null)
    const [isAdmin, setIsAdmin] = useState(false)
    const [ordersCount, setOrdersCount] = useState(0)
    const [totalSpent, setTotalSpent] = useState(0)
    const [loading, setLoading] = useState(true)

    const ADMIN_IDS = [7164122768, 7787131118]

    useEffect(() => {
        // Telegram WebApp ni to'liq ochish
        expandTelegramApp()
        
        // Foydalanuvchi ma'lumotlarini olish
        const tgUser = getTelegramUser()
        
        if (tgUser) {
            setTelegramId(tgUser.id)
            setUser(tgUser)
            setIsAdmin(ADMIN_IDS.includes(tgUser.id))
            setLoading(false)
        } else {
            console.log("telegramda ochilamagan")
        }
    }, [])

    useEffect(() => {
        if (telegramId && !loading) {
            fetchUserStats()
        }
    }, [telegramId, loading])

    const fetchUserStats = async () => {
        try {
            const q = query(
                ordersCollection,
                where("telegramId", "==", telegramId)
            )
            const snapshot = await getDocs(q)
            const orders = snapshot.docs.map(doc => doc.data())
            
            setOrdersCount(orders.length)
            const total = orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0)
            setTotalSpent(total)
        } catch (error) {
            console.error('Statistika xatosi:', error)
        }
    }

    const goToAdminPanel = () => {
        navigate('/admin')
    }

    const formatDate = () => {
        return new Date().toLocaleDateString('uz-UZ', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        })
    }

    if (loading) {
        return (
            <div className="ProfilePage">
                <div className="loading-container">
                    <div className="loader"></div>
                    <p>Yuklanmoqda...</p>
                </div>
            </div>
        )
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
    )
}

export default Profile