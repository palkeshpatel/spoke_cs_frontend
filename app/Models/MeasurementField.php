<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class MeasurementField extends Model
{
    use HasFactory;

    protected $fillable = [
        'field_name',
        'garment_type',
        'unit',
    ];

    public function values()
    {
        return $this->hasMany(MeasurementValue::class, 'field_id');
    }
}
