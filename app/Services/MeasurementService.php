<?php

namespace App\Services;

use App\Models\Measurement;
use App\Models\MeasurementValue;
use Illuminate\Support\Facades\DB;

class MeasurementService
{
    public function paginate(int $perPage = 20)
    {
        return Measurement::with(['customer', 'taker', 'values.field'])->orderByDesc('id')->paginate($perPage);
    }

    public function findOrFail(int $id): Measurement
    {
        return Measurement::with(['customer', 'taker', 'values.field'])->findOrFail($id);
    }

    public function create(array $data): Measurement
    {
        return DB::transaction(function () use ($data) {
            $measurement = Measurement::create([
                'customer_id' => $data['customer_id'],
                'garment_type' => $data['garment_type'],
                'taken_by' => $data['taken_by'] ?? null,
                'notes' => $data['notes'] ?? null,
            ]);

            $values = $data['values'] ?? [];
            if (is_array($values)) {
                foreach ($values as $value) {
                    if (!is_array($value)) continue;
                    MeasurementValue::create([
                        'measurement_id' => $measurement->id,
                        'field_id' => $value['field_id'],
                        'value' => $value['value'] ?? null,
                    ]);
                }
            }

            return $this->findOrFail((int)$measurement->id);
        });
    }

    public function update(int $id, array $data): Measurement
    {
        return DB::transaction(function () use ($id, $data) {
            $measurement = Measurement::findOrFail($id);
            $measurement->fill($data);
            $measurement->save();

            if (isset($data['values']) && is_array($data['values'])) {
                MeasurementValue::where('measurement_id', $measurement->id)->delete();
                foreach ($data['values'] as $value) {
                    if (!is_array($value)) continue;
                    MeasurementValue::create([
                        'measurement_id' => $measurement->id,
                        'field_id' => $value['field_id'],
                        'value' => $value['value'] ?? null,
                    ]);
                }
            }

            return $this->findOrFail($id);
        });
    }

    public function delete(int $id): void
    {
        Measurement::whereKey($id)->delete();
    }
}
