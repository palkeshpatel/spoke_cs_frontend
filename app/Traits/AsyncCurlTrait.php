<?php

namespace App\Traits;

trait AsyncCurlTrait
{
    public function fireAndForgetJson(string $url, array $payload, array $headers = [], string $method = 'POST'): void
    {
        $method = strtoupper($method);
        $json = json_encode($payload, JSON_UNESCAPED_UNICODE);
        if ($json === false) {
            $json = '{}';
        }

        $headerArgs = array_merge(['Content-Type: application/json'], $headers);
        $headerParts = [];
        foreach ($headerArgs as $header) {
            $headerParts[] = '-H ' . escapeshellarg($header);
        }

        $cmd = 'curl -s -X ' . escapeshellarg($method) . ' ' . implode(' ', $headerParts) . ' --data ' . escapeshellarg($json) . ' ' . escapeshellarg($url);

        if (PHP_OS_FAMILY === 'Windows') {
            $full = 'start /B "" cmd /C ' . $cmd . ' >NUL 2>&1';
            pclose(popen($full, 'r'));
            return;
        }

        exec($cmd . ' >/dev/null 2>&1 &');
    }
}
