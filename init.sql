-- 1. Таблица категорий (для удобного меню)
CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL
);

-- 2. Таблица товаров (чтобы не писать текст руками в заказах)
CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    category_id INTEGER REFERENCES categories(id),
    name VARCHAR(100) NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    image_url TEXT
);

-- 3. Улучшенная таблица заказов
CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,
    user_id INTEGER DEFAULT 1, -- Пока привязываем к тестовому юзеру
    description TEXT NOT NULL,
    total_amount DECIMAL(10, 2) NOT NULL,
    status VARCHAR(20) DEFAULT 'Принят', -- Возможные: Принят, Готовится, Готов, Выдан
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP, -- Дата и время сами ставятся
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Заполним начальными данными для красоты
INSERT INTO categories (name) VALUES ('Кофе'), ('Выпечка'), ('Завтраки') ON CONFLICT DO NOTHING;

INSERT INTO products (category_id, name, price) VALUES 
(1, 'Капучино', 250),
(1, 'Латте Макиато', 280),
(2, 'Круассан с миндалем', 220),
(3, 'Скрембл с авокадо', 450) ON CONFLICT DO NOTHING;