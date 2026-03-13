<?php
/**
 * proxy.example.php
 * 
 * To use this proxy:
 * 1. Rename this file to proxy.php
 * 2. Replace 'YOUR_API_KEY_HERE' with your real Last.fm API key.
 * 3. Upload to your server root.
 */

if (isset($_SERVER['HTTP_ORIGIN'])) {
    $origin = $_SERVER['HTTP_ORIGIN'];
    if (strpos($origin, 'localhost') !== false || strpos($origin, '127.0.0.1') !== false) {
        header("Access-Control-Allow-Origin: $origin");
    }
}
header("Content-Type: application/json");

$apiKey = "YOUR_API_KEY_HERE";
$user = "YOUR_LASTFM_USERNAME";
$limit = 1;

$apiUrl = "https://ws.audioscrobbler.com/2.0/?" . http_build_query([
    "method" => "user.getrecenttracks",
    "user" => $user,
    "format" => "json",
    "limit" => $limit,
    "api_key" => $apiKey
]);

$ch = curl_init($apiUrl);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);

$response = curl_exec($ch);

if (curl_errno($ch)) {
    $error_msg = curl_error($ch);
    http_response_code(500);
    echo json_encode(["error" => "Failed to contact API", "details" => $error_msg]);
    curl_close($ch);
    exit;
}

curl_close($ch);
echo $response;
?>
