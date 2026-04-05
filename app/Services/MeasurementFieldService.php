<?php

namespace App\Services;

use App\Models\MeasurementField;

class MeasurementFieldService
{
    public function all(?string $garmentType = null)
    {
        $query = MeasurementField::query()->orderBy('garment_type')->orderBy('id');
        if ($garmentType) {
            $query->where('garment_type', $garmentType);
        }
        return $query->get();
    }

    public function create(array $data): MeasurementField
    {
        return MeasurementField::create([
            'field_name' => $data['field_name'],
            'garment_type' => $data['garment_type'],
            'unit' => $data['unit'] ?? 'inch',
        ]);
    }
}
