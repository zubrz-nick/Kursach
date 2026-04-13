import React, { useState, useEffect } from 'react';
import './App.css';

const App = () => {
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')));
  const [isRegister, setIsRegister] = useState(false);
  const [authData, setAuthData] = useState({ name: '', email: '', password: '' });
  
  const [view, setView] = useState('menu');
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
    
    if (result.id) {
      localStorage.setItem('user', JSON.stringify(result));
      setUser(result);
    } else {
      alert('Ошибка доступа. Проверьте данные.');
    }
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
      alert('Заказ принят! ☕');
      window.location.reload();
    });
  };

  // ЭКРАН ЛОГИНА / РЕГИСТРАЦИИ
  if (!user) {
    return (
      <div className="auth-container fade-in">
        <div className="auth-card">
          <div className="auth-header">
            <span style={{fontSize: '40px'}}>☕</span>
            <h1>Etika<span style={{color: '#d4a373'}}>.</span></h1>
            <p>{isRegister ? 'Создайте аккаунт' : 'С возвращением!'}</p>
          </div>
          
          <form onSubmit={handleAuth} className="auth-form">
            {isRegister && (
              <input 
                type="text" placeholder="Имя / Компания" required
                onChange={e => setAuthData({...authData, name: e.target.value})} 
              />
            )}
            <input 
              type="email" placeholder="Email" required
              onChange={e => setAuthData({...authData, email: e.target.value})} 
            />
            <input 
              type="password" placeholder="Пароль" required
              onChange={e => setAuthData({...authData, password: e.target.value})} 
            />
            <button type="submit" className="add-btn" style={{marginTop: '10px'}}>
              {isRegister ? 'Зарегистрироваться' : 'Войти'}
            </button>
          </form>
          
          <button className="switch-btn" onClick={() => setIsRegister(!isRegister)}>
            {isRegister ? 'Уже есть аккаунт? Войти' : 'Нет аккаунта? Регистрация'}
          </button>
        </div>
      </div>
    );
  }

  // ОСНОВНОЙ КОНТЕНТ (тот же, что и раньше)
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
              <h4>Ваши бонусы 🎁</h4>
              <p style={{fontSize: '13px', opacity: 0.8, margin: '5px 0'}}>Каждый 6-й заказ со скидкой 50%!</p>
              <div className="progress-container">
                <div className="progress-bar" style={{ width: `${(orders.length % 6) / 6 * 100}%` }}></div>
              </div>
              <small>{6 - (orders.length % 6)} заказов до бонуса</small>
            </div>
          </div>

          <div className="menu-grid">
            {items.map(item => (
              <div key={item.id} className="product-card">
                <span className="product-icon">{item.icon || '☕'}</span>
                <span className="product-name">{item.name}</span>
                <span className="product-price">{item.price} ₽</span>
                <button className="add-btn" onClick={() => setCart([...cart, item])}>В корзину</button>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="profile-section fade-in" style={{padding: '0 20px'}}>
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px'}}>
            <h2>История заказов</h2>
            <button onClick={() => { localStorage.removeItem('user'); window.location.reload(); }} className="logout-btn">Выйти 🚪</button>
          </div>
          {orders.map(o => (
            <div key={o.id} className="order-history-card">
              <div style={{display: 'flex', justifyContent: 'space-between'}}>
                <strong>#{o.id}</strong>
                <span className="status-text">{o.status}</span>
              </div>
              <p style={{margin: '10px 0', fontSize: '14px', color: '#666'}}>{o.description}</p>
              <div style={{fontWeight: '800'}}>{o.total_amount} ₽</div>
            </div>
          ))}
        </div>
      )}

      {cart.length > 0 && view === 'menu' && (
        <div className="cart-float">
          <div>
            <div style={{fontSize: '11px', opacity: 0.5}}>Итого</div>
            <div style={{fontSize: '22px', fontWeight: '800'}}>{cart.reduce((s, i) => s + Number(i.price), 0)} ₽</div>
          </div>
          <button className="add-btn" style={{width: 'auto', padding: '15px 40px'}} onClick={handleOrder}>Заказать</button>
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
