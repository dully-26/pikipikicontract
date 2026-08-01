<?php

echo "START\n";

$cert = __DIR__ . '/certs/isrgrootx1.pem';

echo "CERT EXISTS: " . (file_exists($cert) ? "YES" : "NO") . "\n";

$dsn = 'mysql:host=gateway01.eu-central-1.prod.aws.tidbcloud.com;port=4000;dbname=test';

echo "CREATING PDO...\n";

$pdo = new PDO(
    $dsn,
    '3fVgeBpDm8xdYkB.mtemaa_4EgtQMEZ',
    '',
    [
        PDO::MYSQL_ATTR_SSL_CA => $cert,
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
    ]
);

echo "PDO CREATED\n";

$result = $pdo->query('SELECT 1');

echo "QUERY OK\n";

echo $result->fetchColumn() . "\n";