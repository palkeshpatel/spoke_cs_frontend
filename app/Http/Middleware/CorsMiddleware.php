<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class CorsMiddleware
{
    public function handle(Request $request, Closure $next)
    {
        $origin = $request->headers->get('Origin');
        $allowedOrigin = $this->resolveAllowedOrigin($origin);

        if ($request->getMethod() === 'OPTIONS') {
            $response = response('', 204);
        } else {
            $response = $next($request);
        }

        $headers = [
            'Access-Control-Allow-Methods' => env('CORS_ALLOWED_METHODS', 'GET,POST,PUT,DELETE,OPTIONS'),
            'Access-Control-Allow-Headers' => env('CORS_ALLOWED_HEADERS', 'Content-Type, Authorization, X-Requested-With, Accept, Origin'),
            'Access-Control-Max-Age' => env('CORS_MAX_AGE', '86400'),
        ];

        if ($allowedOrigin !== null) {
            $headers['Access-Control-Allow-Origin'] = $allowedOrigin;
            $headers['Vary'] = 'Origin';
        }

        foreach ($headers as $key => $value) {
            $response->headers->set($key, $value);
        }

        return $response;
    }

    private function resolveAllowedOrigin(?string $origin): ?string
    {
        $allowed = env('CORS_ALLOWED_ORIGINS', '*');
        $allowed = array_values(array_filter(array_map('trim', explode(',', (string)$allowed))));

        if (in_array('*', $allowed, true)) {
            return $origin ?: '*';
        }

        if ($origin && in_array($origin, $allowed, true)) {
            return $origin;
        }

        return null;
    }
}

