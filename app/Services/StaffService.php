<?php

namespace App\Services;

use App\Models\Staff;

class StaffService
{
    public function all()
    {
        return Staff::query()->orderBy('name')->get();
    }

    public function create(array $data): Staff
    {
        return Staff::create([
            'name' => $data['name'],
            'email' => $data['email'],
            'phone' => $data['phone'] ?? null,
            'role' => $data['role'] ?? 'Staff',
        ]);
    }
}
