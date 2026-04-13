<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PATCH, OPTIONS, DELETE");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') { exit(http_response_code(200)); }

$databaseUrl = getenv('DATABASE_URL');
try {
    if ($databaseUrl) {
        $dbopts = parse_url($databaseUrl);
        $dsn = "pgsql:host={$dbopts["host"]};port=" . ($dbopts["port"] ?? "5432") . ";dbname=" . ltrim($dbopts["path"], '/');
        $pdo = new PDO($dsn, $dbopts["user"], $dbopts["pass"], [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
    } else {
        $pdo = new PDO("pgsql:host=db;dbname=etika_db", "postgres", "password", [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
    }

    // Инициализация таблиц
    $pdo->exec("CREATE TABLE IF NOT EXISTS users (id SERIAL PRIMARY KEY, company_name TEXT, email TEXT UNIQUE, password TEXT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)");
    $pdo->exec("CREATE TABLE IF NOT EXISTS orders (id SERIAL PRIMARY KEY, user_id INTEGER, description TEXT, total_amount DECIMAL(10,2), status TEXT DEFAULT 'Новый', created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)");
    $pdo->exec("CREATE TABLE IF NOT EXISTS products (id SERIAL PRIMARY KEY, name TEXT NOT NULL, price DECIMAL(10,2) NOT NULL, icon TEXT)");

    $input = json_decode(file_get_contents('php://input'), true);
    $method = $_SERVER['REQUEST_METHOD'];

    if ($method === 'GET') {
        $action = $_GET['action'] ?? '';
        if ($action === 'get_products') {
            echo json_encode($pdo->query("SELECT * FROM products ORDER BY id DESC")->fetchAll(PDO::FETCH_ASSOC));
        } elseif ($action === 'get_stats') {
            $stmt = $pdo->query("SELECT COALESCE(SUM(total_amount),0) as revenue, COUNT(*) as count FROM orders WHERE created_at >= CURRENT_DATE");
            echo json_encode($stmt->fetch(PDO::FETCH_ASSOC));
        } else {
            $userId = $_GET['user_id'] ?? null;
            $stmt = $pdo->prepare($userId ? "SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC" : "SELECT * FROM orders ORDER BY created_at DESC");
            $userId ? $stmt->execute([$userId]) : $stmt->execute();
            echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
        }
    } 
    elseif ($method === 'POST') {
        $action = $input['action'] ?? '';
        if ($action === 'register') {
            $stmt = $pdo->prepare("INSERT INTO users (company_name, email, password) VALUES (?, ?, ?) RETURNING id, company_name");
            $stmt->execute([$input['name'], $input['email'], $input['password']]);
            echo json_encode($stmt->fetch(PDO::FETCH_ASSOC));
        } elseif ($action === 'login') {
            $stmt = $pdo->prepare("SELECT id, company_name FROM users WHERE email = ? AND password = ?");
            $stmt->execute([$input['email'], $input['password']]);
            echo json_encode($stmt->fetch(PDO::FETCH_ASSOC) ?: ["error" => "Error"]);
        } elseif ($action === 'add_product') {
            $pdo->prepare("INSERT INTO products (name, price, icon) VALUES (?, ?, ?)")->execute([$input['name'], $input['price'], $input['icon']]);
            echo json_encode(["status" => "ok"]);
        } elseif ($action === 'delete_product') {
            $pdo->prepare("DELETE FROM products WHERE id = ?")->execute([$input['id']]);
            echo json_encode(["status" => "ok"]);
        } else {
            // Логика бонусов
            $uId = $input['user_id'];
            $st = $pdo->prepare("SELECT COUNT(*) FROM orders WHERE user_id = ?");
            $st->execute([$uId]);
            $count = $st->fetchColumn();
            $total = $input['total_amount'];
            $desc = $input['description'];
            if (($count + 1) % 6 == 0) { $total *= 0.5; $desc .= " (Скидка 50%!)"; }
            $pdo->prepare("INSERT INTO orders (user_id, description, total_amount) VALUES (?, ?, ?)")->execute([$uId, $desc, $total]);
            echo json_encode(["status" => "success"]);
        }
    } 
    elseif ($method === 'PATCH') {
        $pdo->prepare("UPDATE orders SET status = ? WHERE id = ?")->execute([$input['status'], $input['id']]);
        echo json_encode(["status" => "ok"]);
    }
} catch (Exception $e) { echo json_encode(["error" => $e->getMessage()]); }
