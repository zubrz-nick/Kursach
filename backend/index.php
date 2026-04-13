<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS, PATCH");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { exit; }

header("Content-Type: application/json");

try {
    $pdo = new PDO("pgsql:host=db;dbname=etika_db", "postgres", "password");
    try {
    $createTableSql = "CREATE TABLE IF NOT EXISTS orders (
        id SERIAL PRIMARY KEY,
        customer_name VARCHAR(255) NOT NULL,
        items TEXT NOT NULL,
        total_price DECIMAL(10, 2) NOT NULL,
        status VARCHAR(50) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );";
    $pdo->exec($createTableSql);

    // Добавим один тестовый заказ, если таблица была пустая
    $checkSql = "SELECT COUNT(*) FROM orders";
    if ($pdo->query($checkSql)->fetchColumn() == 0) {
        $pdo->exec("INSERT INTO orders (customer_name, items, total_price, status) 
                    VALUES ('Тестовый Заказ', 'Пицца, Кола', 1200.00, 'pending')");
    }
    } catch (Exception $e) {
    echo "Ошибка базы: " . $e->getMessage();
    }
    // --- БЛОК АВТОМАТИЧЕСКОЙ ОЧИСТКИ (Раз в 24 часа) ---
    $cleanupFile = 'last_cleanup.txt';
    $lastCleanup = file_exists($cleanupFile) ? (int)file_get_contents($cleanupFile) : 0;

    // Проверяем, прошло ли 86400 секунд (24 часа) с последней чистки
    if (time() - $lastCleanup > 86400) {
        // Удаляем заказы старше 1 дня
        $pdo->exec("DELETE FROM orders WHERE created_at < NOW() - INTERVAL '1 day'");
        // Записываем текущее время в файл, чтобы не чистить при каждом запросе
        file_put_contents($cleanupFile, time());
    }
    // --------------------------------------------------

    $data = json_decode(file_get_contents("php://input"), true);
    $method = $_SERVER['REQUEST_METHOD'];

    // --- 1. АВТОРИЗАЦИЯ И РЕГИСТРАЦИЯ ---
    if ($method === 'POST' && isset($data['action'])) {
        if ($data['action'] === 'login') {
            $stmt = $pdo->prepare("SELECT id, company_name FROM users WHERE email = ? AND password = ?");
            $stmt->execute([$data['email'], $data['password']]);
            $user = $stmt->fetch(PDO::FETCH_ASSOC);
            echo json_encode($user ? $user : ["error" => "Неверный логин или пароль"]);
        }
        if ($data['action'] === 'register') {
            $check = $pdo->prepare("SELECT id FROM users WHERE email = ?");
            $check->execute([$data['email']]);
            if ($check->fetch()) {
                echo json_encode(["error" => "Email уже занят"]);
            } else {
                $stmt = $pdo->prepare("INSERT INTO users (company_name, email, password) VALUES (?, ?, ?) RETURNING id, company_name");
                $stmt->execute([$data['name'], $data['email'], $data['password']]);
                echo json_encode($stmt->fetch(PDO::FETCH_ASSOC));
            }
        }
        exit;
    }

    // --- 2. ПОЛУЧЕНИЕ ЗАКАЗОВ (GET) ---
    if ($method === 'GET') {
        if (isset($_GET['user_id'])) {
            $stmt = $pdo->prepare("SELECT * FROM orders WHERE user_id = ? ORDER BY id DESC");
            $stmt->execute([$_GET['user_id']]);
        } else {
            $stmt = $pdo->query("SELECT * FROM orders ORDER BY id DESC");
        }
        echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
        exit;
    }

    // --- 3. СОЗДАНИЕ ЗАКАЗА (POST) ---
    if ($method === 'POST') {
        $stmt = $pdo->prepare("INSERT INTO orders (user_id, description, total_amount, status) VALUES (?, ?, ?, 'Ожидает принятия') RETURNING id");
        $stmt->execute([$data['user_id'], $data['description'], $data['total_amount']]);
        echo json_encode($stmt->fetch(PDO::FETCH_ASSOC));
        exit;
    }

    // --- 4. ОБНОВЛЕНИЕ СТАТУСА (PATCH) ---
    if ($method === 'PATCH') {
        $stmt = $pdo->prepare("UPDATE orders SET status = ? WHERE id = ?");
        $stmt->execute([$data['status'], $data['id']]);
        echo json_encode(["status" => "updated"]);
        exit;
    }

} catch (Exception $e) {
    echo json_encode(["error" => $e->getMessage()]);
}
