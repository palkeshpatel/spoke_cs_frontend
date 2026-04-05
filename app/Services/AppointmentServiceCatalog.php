<?php

namespace App\Services;

use App\Models\AppointmentService;

class AppointmentServiceCatalog
{
    public function all()
    {
        return AppointmentService::query()->orderBy('service_name')->get();
    }

    public function create(array $data): AppointmentService
    {
        return AppointmentService::create([
            'service_name' => $data['service_name'],
            'duration_minutes' => (int)($data['duration_minutes'] ?? 0),
            'price' => (float)($data['price'] ?? 0),
        ]);
    }
}
