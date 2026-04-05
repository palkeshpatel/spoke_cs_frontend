<?php

namespace App\Services;

use App\Models\EmailOtp;
use App\Models\User;
use App\Traits\AsyncEmailTrait;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class AuthService
{
    use AsyncEmailTrait;

    public function loginWithPassword(string $email, string $password): array
    {
        $user = User::where('email', $email)->first();
        if (!$user || !Hash::check($password, (string)$user->password)) {
            return ['ok' => false, 'message' => 'Invalid credentials'];
        }

        $token = $this->issueToken($user);
        return ['ok' => true, 'token' => $token, 'user' => $user];
    }

    public function requestEmailOtp(string $email): array
    {
        $user = User::where('email', $email)->first();
        if (!$user) {
            return ['ok' => false, 'message' => 'User not found'];
        }

        $code = (string)random_int(100000, 999999);
        $expiresAt = Carbon::now()->addMinutes(10);

        DB::transaction(function () use ($email, $code, $expiresAt) {
            EmailOtp::where('email', $email)->whereNull('consumed_at')->update(['consumed_at' => Carbon::now()]);
            EmailOtp::create([
                'email' => $email,
                'code' => $code,
                'expires_at' => $expiresAt,
                'consumed_at' => null,
            ]);
        });

        $this->sendEmailAsync(
            $email,
            'Your Login OTP',
            '<p>Your OTP is <strong>' . e($code) . '</strong></p><p>Valid for 10 minutes.</p>',
            'Your OTP is ' . $code . ' (valid for 10 minutes).',
        );

        $payload = ['ok' => true, 'message' => 'OTP sent'];
        if (env('APP_DEBUG')) {
            $payload['debug_otp'] = $code;
        }
        return $payload;
    }

    public function verifyEmailOtp(string $email, string $code): array
    {
        $user = User::where('email', $email)->first();
        if (!$user) {
            return ['ok' => false, 'message' => 'User not found'];
        }

        $otp = EmailOtp::where('email', $email)
            ->whereNull('consumed_at')
            ->orderByDesc('id')
            ->first();

        if (!$otp) {
            return ['ok' => false, 'message' => 'OTP not found'];
        }

        if (Carbon::now()->greaterThan($otp->expires_at)) {
            $otp->consumed_at = Carbon::now();
            $otp->save();
            return ['ok' => false, 'message' => 'OTP expired'];
        }

        if ((string)$otp->code !== (string)$code) {
            return ['ok' => false, 'message' => 'Invalid OTP'];
        }

        $otp->consumed_at = Carbon::now();
        $otp->save();

        $token = $this->issueToken($user);
        return ['ok' => true, 'token' => $token, 'user' => $user];
    }

    public function logout(User $user): void
    {
        $user->api_token = null;
        $user->save();
    }

    private function issueToken(User $user): string
    {
        $token = Str::random(60);
        $user->api_token = $token;
        $user->save();
        return $token;
    }
}

