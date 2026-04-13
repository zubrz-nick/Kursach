// --- КОМПОНЕНТ МЕНЮ С КОРЗИНОЙ (Теперь динамический) ---
const Menu = ({ cart, onAddToCart, onRemoveFromCart, onOrder }) => {
  // Создаем состояние для хранения товаров из БД
  const [items, setItems] = useState([]);

  // Загружаем меню при открытии страницы
  useEffect(() => {
    fetch('https://kursach-h63g.onrender.com/index.php?action=get_products')
      .then(res => res.json())
      .then(data => setItems(Array.isArray(data) ? data : []))
      .catch(err => console.error("Ошибка загрузки меню:", err));
  }, []);

  // Считаем сумму (учитываем, что из БД цена может прийти как строка, поэтому Number())
  const total = cart.reduce((sum, i) => sum + Number(i.price), 0);

  return (
    <div className="page fade-in">
      <h2>Меню</h2>
      
      {/* Если меню еще не загрузилось */}
      {items.length === 0 && <p style={{textAlign: 'center'}}>Загрузка меню...</p>}

      <div className="product-grid">
        {items.map(i => (
          <div key={i.id} className="product-card">
            <span style={{fontSize: '36px'}}>{i.icon}</span>
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
export default App;
