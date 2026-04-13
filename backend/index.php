<?php
// 1. Настройка CORS (разрешаем запросы с любого домена)
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PATCH, OPTIONS, DELETE");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

// Обработка preflight-запросов (браузеры шлют OPTIONS перед POST)
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

// 2. Подключение к БД через DATABASE_URL
$databaseUrl = getenv('DATABASE_URL');

try {
    if ($databaseUrl) {
        $dbopts = parse_url($databaseUrl);
        $port = isset($dbopts["port"]) ? $dbopts["port"] : "5432";
        $dsn = "pgsql:host={$dbopts["host"]};port={$port};dbname=" . ltrim($dbopts["path"], '/');
        $user = $dbopts["user"];
        $pass = $dbopts["pass"];
    } else {
        // Локальные настройки (для Docker)
        $dsn = "pgsql:host=db;port=5432;dbname=etika_db";
        $user = "postgres";
        $pass = "password";
    }

    $pdo = new PDO($dsn, $user, $pass, [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
    $pdo->exec("DROP TABLE IF EXISTS orders CASCADE;");

    // 3. Создание таблиц (если их нет)
    $pdo->exec("CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        company_name TEXT,
        email TEXT UNIQUE,
        password TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )");

    $pdo->exec("CREATE TABLE IF NOT EXISTS orders (
        id SERIAL PRIMARY KEY,
        user_id INTEGER,
        description TEXT,
        total_amount DECIMAL(10,2),
        status TEXT DEFAULT 'В обработке',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )");

    // 4. Получение данных запроса (из JSON-тела)
    $input = json_decode(file_get_contents('php://input'), true);
    $method = $_SERVER['REQUEST_METHOD'];

    // --- ЛОГИКА ОБРАБОТКИ ЗАПРОСОВ ---

    if ($method === 'GET') {
        // Получение заказов (если есть user_id — фильтруем для профиля)
        $userId = $_GET['user_id'] ?? null;
        if ($userId) {
            $stmt = $pdo->prepare("SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC");
            $stmt->execute([$userId]);
        } else {
            $stmt = $pdo->query("SELECT * FROM orders ORDER BY created_at DESC");
        }
        echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
    } 
    
    elseif ($method === 'POST') {
        $action = $input['action'] ?? '';

        // АВТОРИЗАЦИЯ: Регистрация
        if ($action === 'register') {
            $stmt = $pdo->prepare("INSERT INTO users (company_name, email, password) VALUES (?, ?, ?) RETURNING id, company_name, email");
            $stmt->execute([$input['name'], $input['email'], $input['password']]);
            echo json_encode($stmt->fetch(PDO::FETCH_ASSOC));
        } 
        // АВТОРИЗАЦИЯ: Вход
        elseif ($action === 'login') {
            $stmt = $pdo->prepare("SELECT id, company_name, email FROM users WHERE email = ? AND password = ?");
            $stmt->execute([$input['email'], $input['password']]);
            $user = $stmt->fetch(PDO::FETCH_ASSOC);
            echo $user ? json_encode($user) : json_encode(["error" => "Неверный логин или пароль"]);
        } 
        // СОЗДАНИЕ ЗАКАЗА
        else {
            $stmt = $pdo->prepare("INSERT INTO orders (user_id, description, total_amount) VALUES (?, ?, ?)");
            $stmt->execute([
                $input['user_id'] ?? null,
                $input['description'] ?? 'Без описания',
                $input['total_amount'] ?? 0
            ]);
            echo json_encode(["status" => "success"]);
        }
    } 
    
    elseif ($method === 'PATCH') {
        // Обновление статуса (из Админки)
        $stmt = $pdo->prepare("UPDATE orders SET status = ? WHERE id = ?");
        $stmt->execute([$input['status'], $input['id']]);
        echo json_encode(["status" => "updated"]);
    }

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["error" => $e->getMessage()]);
}
