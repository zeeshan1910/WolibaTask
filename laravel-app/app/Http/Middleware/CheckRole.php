<?php

namespace App\Http\Middleware;

use Closure;
use Exception;
// use JWTAuth;
use Tymon\JWTAuth\Facades\JWTAuth as JWTAuth;
use Tymon\JWTAuth\Token;

class CheckRole
{
    public function handle($request, Closure $next, ...$roles)
    {

        // Retrieve the JWT token from cookies
        $rawToken = $request->cookie('token');

        // Create a Token instance from the raw token string
        $token = new Token($rawToken);
        $user = JWTAuth::decode($token);

        foreach ($roles as $role) {
            if ($user['role'] == $role) {
                return $next($request);
            }
        }
        return response()->json(['error' => 'Unauthorized'], 403);
    }
}
