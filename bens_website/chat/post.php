<?php
require 'db.php';
$user = strip_tags($_POST['user']);
$message = strip_tags($_POST['message']);
if ($user && $message) {
  $stmt = $db->prepare("INSERT INTO messages (user, message) VALUES (?, ?)");
  $stmt->execute([$user, $message]);
}
?>
