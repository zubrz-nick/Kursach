<?php
// 1. Настройка CORS — без этого браузер заблокирует запросы от Angular
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PATCH, OPTIONS, DELETE");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

// Ответ на preflight-запросы браузера
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

// 2. Получение настроек базы данных
$databaseUrl = getenv('postgresql://etika_db_user:k3RC7YAIyqYcfpW34178RpKxKcDIWnj0@dpg-d7eip0n7f7vs738s019g-a/etika_db');

try {
    if ($databaseUrl) {
        // Настройки для Render (парсим URL из переменной окружения)
        $dbopts = parse_url($databaseUrl);
        $dsn = sprintf("pgsql:host=%s;port=%s;dbname=%s", 
            $dbopts["host"], 
            $dbopts["port"], 
            ltrim($dbopts["path"], '/')
        );
        $user = $dbopts["user"];
        $pass = $dbopts["pass"];
    } else {
        // Локальные настройки для твоего Docker на ПК
        $dsn = "pgsql:host=db;port=5432;dbname=etika_db";
        $user = "postgres";
        $pass = "password";
    }

    $pdo = new PDO($dsn, $user, $pass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
    ]);

    // 3. АВТОМАТИЧЕСКОЕ СОЗДАНИЕ ТАБЛИЦЫ (если её еще нет)
    $createTableSql = "CREATE TABLE IF NOT EXISTS orders (
        id SERIAL PRIMARY KEY,
        customer_name VARCHAR(255) NOT NULL,
        items TEXT NOT NULL,
        total_price DECIMAL(10, 2) NOT NULL,
        status VARCHAR(50) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );";
    $pdo->exec($createTableSql);

    // 4. ОБРАБОТКА ЗАПРОСОВ
    $method = $_SERVER['REQUEST_METHOD'];

    switch ($method) {
        case 'GET':
            // Получаем все заказы
            $stmt = $pdo->query("SELECT * FROM orders ORDER BY created_at DESC");
            echo json_encode($stmt->fetchAll());
            break;

        case 'POST':
            // Создание нового заказа (если понадобится)
            $data = json_decode(file_get_contents('php://input'), true);
            $sql = "INSERT INTO orders (customer_name, items, total_price) VALUES (?, ?, ?)";
            $pdo->prepare($sql)->execute([$data['customer_name'], $data['items'], $data['total_price']]);
            echo json_encode(["status" => "success"]);
            break;

        case 'PATCH':
            // Обновление статуса (то, что делает твоя админка)
            $data = json_decode(file_get_contents('php://input'), true);
            $sql = "UPDATE orders SET status = ? WHERE id = ?";
            $pdo->prepare($sql)->execute([$data['status'], $data['id']]);
            echo json_encode(["status" => "updated"]);
            break;

        default:
            echo json_encode(["message" => "Method not supported"]);
            break;
    }

} catch (PDOException $e) {
    // Вывод ошибки в формате JSON, чтобы Angular не сломался при чтении
    http_response_code(500);
    echo json_encode(["error" => $e->getMessage()]);
}
