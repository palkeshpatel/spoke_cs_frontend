<?php

namespace App\Services;

use App\Models\CustomerBodyImage;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Str;

class ChunkUploadService
{
    public function initCustomerBodyImageUpload(int $customerId, string $imageType, string $originalName, int $totalChunks): array
    {
        $uploadId = (string)Str::uuid();
        $baseDir = $this->uploadBaseDir($uploadId);
        File::ensureDirectoryExists($baseDir . DIRECTORY_SEPARATOR . 'chunks');

        $manifest = [
            'upload_id' => $uploadId,
            'customer_id' => $customerId,
            'image_type' => $imageType,
            'original_name' => $originalName,
            'total_chunks' => $totalChunks,
            'created_at' => time(),
        ];
        File::put($baseDir . DIRECTORY_SEPARATOR . 'manifest.json', json_encode($manifest));

        return ['upload_id' => $uploadId];
    }

    public function storeChunk(string $uploadId, int $chunkIndex, UploadedFile $chunk): void
    {
        $baseDir = $this->uploadBaseDir($uploadId);
        File::ensureDirectoryExists($baseDir . DIRECTORY_SEPARATOR . 'chunks');

        $target = $baseDir . DIRECTORY_SEPARATOR . 'chunks' . DIRECTORY_SEPARATOR . $chunkIndex . '.part';
        $chunk->move(dirname($target), basename($target));
    }

    public function completeCustomerBodyImageUpload(string $uploadId): CustomerBodyImage
    {
        $baseDir = $this->uploadBaseDir($uploadId);
        $manifestPath = $baseDir . DIRECTORY_SEPARATOR . 'manifest.json';
        if (!File::exists($manifestPath)) {
            abort(404, 'Upload not found');
        }

        $manifest = json_decode((string)File::get($manifestPath), true);
        if (!is_array($manifest)) {
            abort(400, 'Invalid upload manifest');
        }

        $totalChunks = (int)($manifest['total_chunks'] ?? 0);
        if ($totalChunks <= 0) {
            abort(400, 'Invalid total chunks');
        }

        $assembledPath = $baseDir . DIRECTORY_SEPARATOR . 'assembled.bin';
        if (File::exists($assembledPath)) {
            File::delete($assembledPath);
        }

        $out = fopen($assembledPath, 'ab');
        if ($out === false) {
            abort(500, 'Unable to assemble upload');
        }

        try {
            for ($i = 0; $i < $totalChunks; $i++) {
                $partPath = $baseDir . DIRECTORY_SEPARATOR . 'chunks' . DIRECTORY_SEPARATOR . $i . '.part';
                if (!File::exists($partPath)) {
                    abort(400, 'Missing chunk ' . $i);
                }

                $in = fopen($partPath, 'rb');
                if ($in === false) {
                    abort(500, 'Unable to read chunk ' . $i);
                }
                stream_copy_to_stream($in, $out);
                fclose($in);
            }
        } finally {
            fclose($out);
        }

        $customerId = (int)$manifest['customer_id'];
        $imageType = (string)$manifest['image_type'];
        $originalName = (string)$manifest['original_name'];
        $ext = strtolower(pathinfo($originalName, PATHINFO_EXTENSION));
        if (!$ext) {
            $ext = 'jpg';
        }

        $fileName = $imageType . '_' . date('Ymd_His') . '_' . Str::lower(Str::random(6)) . '.' . $ext;
        $publicBaseDir = app()->basePath('public');
        $publicDir = $publicBaseDir . DIRECTORY_SEPARATOR . 'uploads' . DIRECTORY_SEPARATOR . 'customers' . DIRECTORY_SEPARATOR . $customerId;
        File::ensureDirectoryExists($publicDir);

        $finalPath = $publicDir . DIRECTORY_SEPARATOR . $fileName;
        File::move($assembledPath, $finalPath);

        File::deleteDirectory($baseDir);

        $publicRelative = '/uploads/customers/' . $customerId . '/' . $fileName;
        return CustomerBodyImage::create([
            'customer_id' => $customerId,
            'image_type' => $imageType,
            'image_path' => $publicRelative,
            'notes' => null,
        ]);
    }

    private function uploadBaseDir(string $uploadId): string
    {
        return storage_path('app' . DIRECTORY_SEPARATOR . 'tmp' . DIRECTORY_SEPARATOR . 'uploads' . DIRECTORY_SEPARATOR . $uploadId);
    }
}
