<?php

namespace App\Services;

use App\Models\Appointment;

class AppointmentManager
{
    public function paginate(int $perPage = 20)
    {
        return Appointment::with('customer')->orderByDesc('appointment_date')->orderByDesc('id')->paginate($perPage);
    }

    public function findOrFail(int $id): Appointment
    {
        return Appointment::with('customer')->findOrFail($id);
    }

    public function create(array $data): Appointment
    {
        $appointment = Appointment::create([
            'customer_id' => $data['customer_id'],
            'service_type' => $data['service_type'] ?? '',
            'appointment_date' => $data['appointment_date'],
            'appointment_time' => $data['appointment_time'] ?? null,
            'duration_minutes' => (int)($data['duration_minutes'] ?? 0),
            'priority' => $data['priority'] ?? 'normal',
            'status' => $data['status'] ?? 'pending',
            'notes' => $data['notes'] ?? null,
        ]);

        return $this->findOrFail((int)$appointment->id);
    }

    public function update(int $id, array $data): Appointment
    {
        $appointment = Appointment::findOrFail($id);
        $appointment->fill($data);
        $appointment->save();

        return $this->findOrFail($id);
    }

    public function delete(int $id): void
    {
        Appointment::whereKey($id)->delete();
    }
}
