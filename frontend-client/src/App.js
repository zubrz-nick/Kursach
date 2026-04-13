import React, { useState, useEffect } from 'react';
import './App.css';

const App = () => {
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')));
  const [isRegister, setIsRegister] = useState(false);
  const [authData, setAuthData] = useState({ name: '', email: '', password: '' });
  
  const [view, setView] = useState('menu'); 
  const [isCartOpen, setIsCartOpen] = useState(false); 
  const [items, setItems] = useState([]);
  const [cart, setCart] = useState([]);
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    fetch('https://kursach-h63g.onrender.com/index.php?action=get_products')
      .then(res => res.json())
      .then(data => setItems(Array.isArray(data) ? data : []));

    if (user) {
      fetch(`https://kursach-h63g.onrender.com/index.php?user_id=${user.id}`)
        .then(res => res.json())
        .then(data => setOrders(Array.isArray(data) ? data : []));
    }
  }, [user]);

  const handleAuth = async (e) => {
    e.preventDefault();
    const action = isRegister ? 'register' : 'login';
    const response = await fetch('https://kursach-h63g.onrender.com/index.php', {
      method: 'POST',
      body: JSON.stringify({ action, ...authData })
    });
    const result = await response.json();
    if (result.id) { setUser(result); localStorage.setItem('user', JSON.stringify(result)); }
    else { alert('Ошибка! Проверьте данные.'); }
  };

  const handleOrder = () => {
    fetch('https://kursach-h63g.onrender.com/index.php', {
      method: 'POST',
      body: JSON.stringify({
        user_id: user.id,
        description: cart.map(i => i.name).join(', '),
        total_amount: cart.reduce((s, i) => s + Number(i.price), 0),
        action: 'create_order'
      })
    }).then(() => {
      setCart([]);
      setIsCartOpen(false);
      alert('Заказ отправлен! ☕');
      window.location.reload();
    });
  };

  const removeFromCart = (index) => {
    const newCart = [...cart];
    newCart.splice(index, 1);
    setCart(newCart);
  };

  if (!user) return (
    <div className="auth-container">
      <div className="auth-card">
        <h1>Etika<span>.</span></h1>
        <form onSubmit={handleAuth} className="auth-form">
          {isRegister && <input type="text" placeholder="Имя" onChange={e => setAuthData({...authData, name: e.target.value})} required />}
          <input type="email" placeholder="Email" onChange={e => setAuthData({...authData, email: e.target.value})} required />
          <input type="password" placeholder="Пароль" onChange={e => setAuthData({...authData, password: e.target.value})} required />
          <button type="submit" className="add-btn">{isRegister ? 'Создать аккаунт' : 'Войти'}</button>
        </form>
        <button className="switch-btn" onClick={() => setIsRegister(!isRegister)}>
          {isRegister ? 'Уже есть аккаунт? Войти' : 'Нет аккаунта? Регистрация'}
        </button>
      </div>
    </div>
  );

  return (
    <div className="app-container">
      <header className="header">
        <h1>Etika<span style={{color: '#d4a373'}}>.</span></h1>
        <div className="user-icon">👋 {user.company_name}</div>
      </header>

      {view === 'menu' ? (
        <div className="fade-in">
          <div className="loyalty-section">
            <div className="loyalty-card">
              <h4>Бонусы 🎁</h4>
              <div className="progress-container">
                <div className="progress-bar" style={{ width: `${(orders.length % 6) / 6 * 100}%` }}></div>
              </div>
              <small>{6 - (orders.length % 6)} заказов до подарка</small>
            </div>
          </div>

          <div className="menu-grid">
            {items.map(item => (
              <div key={item.id} className="product-card">
                <span className="product-icon">{item.icon}</span>
                <span className="product-name">{item.name}</span>
                <span className="product-price">{item.price} ₽</span>
                <button className="add-btn" onClick={() => setCart([...cart, item])}>Добавить</button>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="profile-section fade-in" style={{padding: '0 20px'}}>
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px'}}>
            <h2>Заказы</h2>
            <button onClick={() => { localStorage.removeItem('user'); window.location.reload(); }} className="logout-btn">Выйти</button>
          </div>
          {orders.map(o => (
            <div key={o.id} className="order-history-card">
              <div style={{display: 'flex', justifyContent: 'space-between'}}>
                <strong>#{o.id}</strong>
                <span className="status-text">{o.status}</span>
              </div>
              <p>{o.description}</p>
              <div style={{fontWeight: '800'}}>{o.total_amount} ₽</div>
            </div>
          ))}
        </div>
      )}

      {/* НОВАЯ ПЛАВАЮЩАЯ КНОПКА КОРЗИНЫ (не перекрывает навигацию) */}
      {cart.length > 0 && (
        <button className="cart-badge-btn" onClick={() => setIsCartOpen(true)}>
          🛒 {cart.length} товара — {cart.reduce((s, i) => s + Number(i.price), 0)} ₽
        </button>
      )}

      {/* ВЫДВИЖНОЕ ОКНО КОРЗИНЫ */}
      {isCartOpen && (
        <div className="cart-overlay fade-in">
          <div className="cart-modal slide-up">
            <div className="modal-header">
              <h3>Ваш заказ</h3>
              <button onClick={() => setIsCartOpen(false)}>✕</button>
            </div>
            <div className="cart-items-list">
              {cart.map((item, index) => (
                <div key={index} className="cart-item">
                  <span>{item.icon} {item.name}</span>
                  <div>
                    <span style={{marginRight: '15px'}}>{item.price} ₽</span>
                    <button onClick={() => removeFromCart(index)} className="del-btn">✕</button>
                  </div>
                </div>
              ))}
            </div>
            <div className="modal-footer">
              <div className="total-row">
                <span>Итого:</span>
                <b>{cart.reduce((s, i) => s + Number(i.price), 0)} ₽</b>
              </div>
              <button className="add-btn" onClick={handleOrder}>Подтвердить заказ</button>
            </div>
          </div>
        </div>
      )}

      <nav className="nav-bar">
        <button className={`nav-item ${view === 'menu' ? 'active' : ''}`} onClick={() => setView('menu')}>☕ Меню</button>
        <button className={`nav-item ${view === 'profile' ? 'active' : ''}`} onClick={() => setView('profile')}>👤 Профиль</button>
      </nav>
    </div>
  );
};

export default App;
