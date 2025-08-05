<?php
require 'db.php';
$stmt = $db->query("SELECT * FROM messages ORDER BY timestamp DESC LIMIT 50");
$messages = array_reverse($stmt->fetchAll(PDO::FETCH_ASSOC));
foreach ($messages as $msg) {
  $time = date("H:i", strtotime($msg['timestamp']));
  echo "<p><strong>{$msg['user']}</strong> [{$time}]: {$msg['message']}</p>";
}
?>
