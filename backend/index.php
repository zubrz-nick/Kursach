<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PATCH, OPTIONS, DELETE");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

$databaseUrl = getenv('DATABASE_URL');

try {
    if ($databaseUrl) {
        $dbopts = parse_url($databaseUrl);
        $port = isset($dbopts["port"]) ? $dbopts["port"] : "5432";
        $dsn = "pgsql:host={$dbopts["host"]};port={$port};dbname=" . ltrim($dbopts["path"], '/');
        $user = $dbopts["user"];
        $pass = $dbopts["pass"];
    } else {
        $dsn = "pgsql:host=db;port=5432;dbname=etika_db";
        $user = "postgres";
        $pass = "password";
    }

    $pdo = new PDO($dsn, $user, $pass, [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);

    // Создание таблиц
    $pdo->exec("CREATE TABLE IF NOT EXISTS users (id SERIAL PRIMARY KEY, company_name TEXT, email TEXT UNIQUE, password TEXT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)");
    $pdo->exec("CREATE TABLE IF NOT EXISTS orders (id SERIAL PRIMARY KEY, user_id INTEGER, description TEXT, total_amount DECIMAL(10,2), status TEXT DEFAULT 'Новый', created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)");
    $pdo->exec("CREATE TABLE IF NOT EXISTS products (id SERIAL PRIMARY KEY, name TEXT NOT NULL, price DECIMAL(10,2) NOT NULL, icon TEXT)");

    // Наполнение меню, если пусто
    $stmt = $pdo->query("SELECT COUNT(*) FROM products");
    if ($stmt->fetchColumn() == 0) {
        $pdo->exec("INSERT INTO products (name, price, icon) VALUES ('Капучино', 250, '☕'), ('Латте', 280, '🥛'), ('Круассан', 210, '🥐')");
    }

    $input = json_decode(file_get_contents('php://input'), true);
    $method = $_SERVER['REQUEST_METHOD'];

    if ($method === 'GET') {
        $action = $_GET['action'] ?? '';
        if ($action === 'get_products') {
            $stmt = $pdo->query("SELECT * FROM products ORDER BY id DESC");
            echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
        } else {
            $userId = $_GET['user_id'] ?? null;
            $query = $userId ? "SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC" : "SELECT * FROM orders ORDER BY created_at DESC";
            $stmt = $pdo->prepare($query);
            $userId ? $stmt->execute([$userId]) : $stmt->execute();
            echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
        }
    } 
    elseif ($method === 'POST') {
        $action = $input['action'] ?? '';
        if ($action === 'register') {
            $stmt = $pdo->prepare("INSERT INTO users (company_name, email, password) VALUES (?, ?, ?) RETURNING id, company_name, email");
            $stmt->execute([$input['name'], $input['email'], $input['password']]);
            echo json_encode($stmt->fetch(PDO::FETCH_ASSOC));
        } 
        elseif ($action === 'login') {
            $stmt = $pdo->prepare("SELECT id, company_name, email FROM users WHERE email = ? AND password = ?");
            $stmt->execute([$input['email'], $input['password']]);
            $user = $stmt->fetch(PDO::FETCH_ASSOC);
            echo $user ? json_encode($user) : json_encode(["error" => "Ошибка входа"]);
        } 
        elseif ($action === 'add_product') {
            $stmt = $pdo->prepare("INSERT INTO products (name, price, icon) VALUES (?, ?, ?)");
            $stmt->execute([$input['name'], $input['price'], $input['icon']]);
            echo json_encode(["status" => "success"]);
        }
        elseif ($action === 'delete_product') {
            $stmt = $pdo->prepare("DELETE FROM products WHERE id = ?");
            $stmt->execute([$input['id']]);
            echo json_encode(["status" => "deleted"]);
        }
        else {
            $stmt = $pdo->prepare("INSERT INTO orders (user_id, description, total_amount, status) VALUES (?, ?, ?, 'Новый')");
            $stmt->execute([$input['user_id'], $input['description'], $input['total_amount']]);
            echo json_encode(["status" => "success"]);
        }
    } 
    elseif ($method === 'PATCH') {
        $stmt = $pdo->prepare("UPDATE orders SET status = ? WHERE id = ?");
        $stmt->execute([$input['status'], $input['id']]);
        echo json_encode(["status" => "updated"]);
    }
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["error" => $e->getMessage()]);
}
