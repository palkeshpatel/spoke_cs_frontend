<?php

namespace App\Traits;

trait AsyncEmailTrait
{
    use AsyncCurlTrait;

    public function sendEmailAsync(string $to, string $subject, string $htmlBody = '', string $textBody = ''): void
    {
        $url = env('EMAIL_WEBHOOK_URL');
        if (!$url) {
            return;
        }

        $this->fireAndForgetJson($url, [
            'to' => $to,
            'subject' => $subject,
            'html' => $htmlBody,
            'text' => $textBody,
        ]);
    }
}
