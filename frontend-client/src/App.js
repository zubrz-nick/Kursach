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
      .catch(err => console.error("Ошибка загрузки меню:", err));
  }, []);

  const total = cart.reduce((sum, i) => sum + Number(i.price), 0);

  return (
    <div className="page fade-in">
      <h2>Меню</h2>
      <div className="product-grid">
        {items.map(i => (
          <div key={i.id} className="product-card">
            <span style={{ fontSize: '36px' }}>{i.icon || '☕'}</span>
            <div className="product-info">
              <h3>{i.name}</h3>
              <p>{i.price} ₽</p>
            </div>
            <button className="btn-add" onClick={() => onAddToCart(i)}>+</button>
          </div>
        ))}
      </div>

      {cart.length > 0 && (
        <div className="cart-panel fade-in">
          <div className="cart-header">
            <h3>Ваш заказ</h3>
            <span className="cart-count">{cart.length}</span>
          </div>
          <div className="cart-items">
            {cart.map((item, index) => (
              <div key={index} className="cart-item">
                <span>{item.name}</span>
                <button onClick={() => onRemoveFromCart(index)}>✕</button>
              </div>
            ))}
          </div>
          <button className="btn-main" onClick={onOrder}>
            Заказать за {total} ₽
          </button>
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
