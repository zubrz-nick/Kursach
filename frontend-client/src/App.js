import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import './App.css';

// --- КОМПОНЕНТ АВТОРИЗАЦИИ ---
const AuthScreen = ({ onLogin, onRegister }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [name, setName] = useState('');

  return (
    <div className="login-page">
      <div className="login-card fade-in">
        <h2>Etika Coffee</h2>
        <p className="subtitle">{isLogin ? 'С возвращением!' : 'Стать нашим гостем'}</p>
        {!isLogin && (
          <input type="text" placeholder="Ваше имя" onChange={(e) => setName(e.target.value)} />
        )}
        <input type="email" placeholder="Email" onChange={(e) => setEmail(e.target.value)} />
        <input type="password" placeholder="Пароль" onChange={(e) => setPass(e.target.value)} />
        <button 
          className="btn-main" 
          onClick={() => isLogin ? onLogin(email, pass) : onRegister(name, email, pass)}
        >
          {isLogin ? 'Войти' : 'Создать аккаунт'}
        </button>
        <p className="toggle-auth" onClick={() => setIsLogin(!isLogin)}>
          {isLogin ? 'Нет аккаунта? Создать' : 'Уже есть аккаунт? Войти'}
        </p>
      </div>
    </div>
  );
};

// --- КОМПОНЕНТ МЕНЮ С КОРЗИНОЙ (ДИНАМИЧЕСКИЙ) ---
const Menu = ({ cart, onAddToCart, onRemoveFromCart, onOrder }) => {
  const [items, setItems] = useState([]);

  useEffect(() => {
    fetch('https://kursach-h63g.onrender.com/index.php?action=get_products')
      .then(res => res.json())
      .then(data => setItems(Array.isArray(data) ? data : []))
      .catch(err => console.error("Ошибка:", err));
  }, []);

  return (
    <div style={{ padding: '20px', paddingBottom: '100px', backgroundColor: '#fdfcfb', minHeight: '100vh' }}>
      <h2 style={{ fontWeight: '800', marginBottom: '20px' }}>Меню</h2>
      
      {/* СЕТКА ТОВАРОВ */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: '1fr 1fr', 
        gap: '15px' 
      }}>
        {items.map(i => (
          <div key={i.id} style={{ 
            background: 'white', 
            padding: '15px', 
            borderRadius: '20px', 
            textAlign: 'center',
            boxShadow: '0 4px 15px rgba(0,0,0,0.05)'
          }}>
            <span style={{ fontSize: '40px' }}>{i.icon || '☕'}</span>
            <h3 style={{ fontSize: '16px', margin: '10px 0 5px' }}>{i.name}</h3>
            <p style={{ color: '#d4a373', fontWeight: 'bold', margin: '0 0 10px' }}>{i.price} ₽</p>
            <button 
              onClick={() => onAddToCart(i)}
              style={{ 
                background: '#1a1a1a', color: 'white', border: 'none', 
                borderRadius: '10px', width: '40px', height: '40px', cursor: 'pointer' 
              }}
            >+</button>
          </div>
        ))}
      </div>

      {/* КОРЗИНА */}
      {cart.length > 0 && (
        <div style={{ 
          position: 'fixed', bottom: '80px', left: '20px', right: '20px',
          background: 'white', padding: '20px', borderRadius: '20px',
          boxShadow: '0 -10px 30px rgba(0,0,0,0.1)', zIndex: 100
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
            <b>Ваш заказ ({cart.length})</b>
            <b>{cart.reduce((sum, i) => sum + Number(i.price), 0)} ₽</b>
          </div>
          <button className="btn-main" onClick={onOrder}>Оформить заказ</button>
        </div>
      )}
    </div>
  );
};

// --- КОМПОНЕНТ ПРОФИЛЯ ---
const Profile = ({ user, orders, onLogout }) => {
  const formatDate = (dateString) => {
    const options = { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString('ru-RU', options);
  };

  const isReady = (status) => status === 'Готов' || status === 'Выдан';

  return (
    <div className="page fade-in">
      <div className="user-header">
        <span className="user-name">{user?.company_name || 'Гость'}</span>
        <button onClick={onLogout} className="btn-logout">Выйти</button>
      </div>

      <h3>История заказов</h3>
      <div className="order-history">
        {orders.length === 0 ? (
          <p className="subtitle" style={{ textAlign: 'center', marginTop: '30px' }}>Заказов пока нет ☕</p>
        ) : (
          orders.map(o => (
            <div key={o.id} className="order-item">
              <div className="order-main-info">
                <div className="order-meta">
                  <span className="order-date">{formatDate(o.created_at)}</span>
                  <span className="order-total">{o.total_amount} ₽</span>
                </div>
                <div className="order-text">
                  <span className="order-number">#{o.id}</span> {o.description}
                </div>
              </div>
              <div className="order-status-side">
                <span className={`status-dot ${isReady(o.status) ? 'dot-ready' : ''}`}></span>
                <span className="status-text">{o.status}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

// --- НАВИГАЦИЯ ---
const BottomNav = () => {
  const location = useLocation();
  return (
    <nav className="bottom-nav">
      <Link to="/" className={`nav-item ${location.pathname === '/' ? 'active' : ''}`}>
        <span>🍴</span> Меню
      </Link>
      <Link to="/profile" className={`nav-item ${location.pathname === '/profile' ? 'active' : ''}`}>
        <span>👤</span> Профиль
      </Link>
    </nav>
  );
};

// --- ОСНОВНОЙ КОМПОНЕНТ ---
function App() {
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')));
  const [orders, setOrders] = useState([]);
  const [cart, setCart] = useState([]);

  useEffect(() => {
    if (!user) return;
    const fetchOrders = () => {
      fetch(`https://kursach-h63g.onrender.com/index.php?user_id=${user.id}`)
        .then(res => res.json())
        .then(data => setOrders(Array.isArray(data) ? data : []))
        .catch(err => console.error("Ошибка загрузки заказов:", err));
    };
    fetchOrders();
    const int = setInterval(fetchOrders, 4000);
    return () => clearInterval(int);
  }, [user]);

  const login = async (email, password) => {
    try {
      const res = await fetch('https://kursach-h63g.onrender.com/index.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'login', email, password })
      });
      const data = await res.json();
      if (data.id) {
        setUser(data);
        localStorage.setItem('user', JSON.stringify(data));
      } else {
        alert(data.error || "Ошибка входа");
      }
    } catch (e) { alert("Ошибка соединения с сервером"); }
  };

  const register = async (name, email, password) => {
    try {
      const res = await fetch('https://kursach-h63g.onrender.com/index.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'register', name, email, password })
      });
      const data = await res.json();
      if (data.id) {
        setUser(data);
        localStorage.setItem('user', JSON.stringify(data));
      } else {
        alert(data.error || "Ошибка регистрации");
      }
    } catch (e) { alert("Ошибка соединения с сервером"); }
  };

  const handleOrder = async () => {
    if (cart.length === 0) return;
    const desc = cart.map(i => i.name).join(', ');
    const total = cart.reduce((sum, i) => sum + Number(i.price), 0);
    
    try {
      await fetch('https://kursach-h63g.onrender.com/index.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          user_id: user.id, 
          description: desc, 
          total_amount: total,
          action: 'create_order' 
        })
      });
      setCart([]);
      alert('Заказ принят!');
    } catch (e) { alert("Ошибка при отправке заказа"); }
  };

  if (!user) return <AuthScreen onLogin={login} onRegister={register} />;

  return (
    <Router>
      <div className="paradise-app">
        <Routes>
          <Route path="/" element={
            <Menu 
              cart={cart} 
              onAddToCart={(i) => setCart([...cart, i])} 
              onRemoveFromCart={(idx) => setCart(cart.filter((_, i) => i !== idx))}
              onOrder={handleOrder}
            />
          } />
          <Route path="/profile" element={
            <Profile 
              user={user} 
              orders={orders} 
              onLogout={() => { setUser(null); localStorage.removeItem('user'); }} 
            />
          } />
        </Routes>
        <BottomNav />
      </div>
    </Router>
  );
}

export default App;
