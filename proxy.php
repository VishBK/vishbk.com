<?php
// Only allow GET requests
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    header("Content-Type: application/json");
    echo json_encode(["error" => "Method not allowed"]);
    exit;
}

// CORS: allow specific origins during development
if (isset($_SERVER['HTTP_ORIGIN'])) {
    $allowed = [
        'http://localhost:1234',
        'http://localhost:8000',
        'http://127.0.0.1:1234',
        'http://127.0.0.1:8000',
    ];
    if (in_array($_SERVER['HTTP_ORIGIN'], $allowed, true)) {
        header("Access-Control-Allow-Origin: " . $_SERVER['HTTP_ORIGIN']);
    }
}

header("Content-Type: application/json");

// Validate API key is available
$apiKey = getenv('LASTFM_API_KEY');
if (!$apiKey) {
    http_response_code(500);
    echo json_encode(["error" => "Server configuration error"]);
    error_log("proxy.php: LASTFM_API_KEY environment variable is not set");
    exit;
}

$user = "VishBK";
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
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, true);
curl_setopt($ch, CURLOPT_TIMEOUT, 10);

$response = curl_exec($ch);

if (curl_errno($ch)) {
    error_log("proxy.php: cURL error — " . curl_error($ch));
    http_response_code(502);
    echo json_encode(["error" => "Failed to contact API"]);
    curl_close($ch);
    exit;
}

$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($httpCode !== 200) {
    http_response_code(502);
    echo json_encode(["error" => "Upstream API returned HTTP $httpCode"]);
    exit;
}

echo $response;
