<?php
// backend/cleanup.php

try {
    $pdo = new PDO("pgsql:host=db;dbname=etika_db", "postgres", "password");
    
    // Удаляем заказы старше 24 часов
    // Если нужно удалять ВООБЩЕ все заказы в полночь, используйте: DELETE FROM orders
    $stmt = $pdo->prepare("DELETE FROM orders WHERE created_at < NOW() - INTERVAL '1 day'");
    $stmt->execute();
    
    $count = $stmt->rowCount();
    echo "[" . date('Y-m-d H:i:s') . "] Очистка завершена. Удалено записей: $count\n";

} catch (Exception $e) {
    echo "[" . date('Y-m-d H:i:s') . "] Ошибка при очистке: " . $e->getMessage() . "\n";
}