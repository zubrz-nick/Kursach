import React, { useState, useEffect } from 'react';
import './App.css';

const App = () => {
  const [view, setView] = useState('menu'); // menu | profile
  const [items, setItems] = useState([]);
  const [cart, setCart] = useState([]);
  const [orders, setOrders] = useState([]);
  const user = JSON.parse(localStorage.getItem('user'));

  useEffect(() => {
    fetch('https://kursach-h63g.onrender.com/index.php?action=get_products')
      .then(res => res.json())
      .then(data => setItems(data))
      .catch(e => console.error(e));

    if (user) {
      fetch(`https://kursach-h63g.onrender.com/index.php?user_id=${user.id}`)
        .then(res => res.json())
        .then(data => setOrders(data));
    }
  }, [user?.id]);

  const handleOrder = () => {
    const orderData = {
      user_id: user.id,
      description: cart.map(i => i.name).join(', '),
      total_amount: cart.reduce((s, i) => s + Number(i.price), 0),
      action: 'create_order'
    };

    fetch('https://kursach-h63g.onrender.com/index.php', {
      method: 'POST',
      body: JSON.stringify(orderData)
    }).then(() => {
      setCart([]);
      alert('Заказ отправлен! Ждем вас в Etika ☕');
      window.location.reload();
    });
  };

  return (
    <div className="app-container">
      <header className="header">
        <h1>Etika<span style={{color: '#d4a373'}}>.</span></h1>
        <div className="user-icon">👋 {user?.company_name || 'Гость'}</div>
      </header>

      {view === 'menu' ? (
        <div className="fade-in">
          <div className="loyalty-section">
            <div className="loyalty-card">
              <h4>Ваши бонусы 🎁</h4>
              <p style={{fontSize: '14px', opacity: 0.8}}>Каждый 6-й кофе за полцены!</p>
              <div className="progress-container">
                <div className="progress-bar" style={{ width: `${(orders.length % 6) / 6 * 100}%` }}></div>
              </div>
              <small>{6 - (orders.length % 6)} заказов до бонуса</small>
            </div>
          </div>

          <div className="menu-grid">
            {items.map(item => (
              <div key={item.id} className="product-card">
                <span className="product-icon">{item.icon}</span>
                <span className="product-name">{item.name}</span>
                <span className="product-price">{item.price} ₽</span>
                <button className="add-btn" onClick={() => setCart([...cart, item])}>В корзину</button>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="profile-section" style={{padding: '20px'}}>
          <h2>Ваши заказы</h2>
          {orders.map(o => (
            <div key={o.id} style={{background: 'white', padding: '15px', borderRadius: '20px', marginBottom: '10px', border: '1px solid #eee'}}>
              <div style={{display: 'flex', justifyContent: 'space-between'}}>
                <strong>#{o.id}</strong>
                <span style={{color: '#d4a373', fontWeight: 'bold'}}>{o.status}</span>
              </div>
              <p style={{margin: '10px 0', fontSize: '14px'}}>{o.description}</p>
              <div style={{fontWeight: '800'}}>{o.total_amount} ₽</div>
            </div>
          ))}
        </div>
      )}

      {cart.length > 0 && view === 'menu' && (
        <div className="cart-float">
          <div>
            <div style={{fontSize: '12px', opacity: 0.6}}>Сумма</div>
            <div style={{fontSize: '20px', fontWeight: '800'}}>{cart.reduce((s, i) => s + Number(i.price), 0)} ₽</div>
          </div>
          <button className="add-btn" style={{width: 'auto', padding: '15px 30px'}} onClick={handleOrder}>Заказать</button>
        </div>
      )}

      <nav className="nav-bar">
        <button className={`nav-item ${view === 'menu' ? 'active' : ''}`} onClick={() => setView('menu')}>
          <span style={{fontSize: '20px'}}>☕</span> Меню
        </button>
        <button className={`nav-item ${view === 'profile' ? 'active' : ''}`} onClick={() => setView('profile')}>
          <span style={{fontSize: '20px'}}>👤</span> Профиль
        </button>
      </nav>
    </div>
  );
};

export default App;
