<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class MeasurementValue extends Model
{
    use HasFactory;

    protected $fillable = [
        'measurement_id',
        'field_id',
        'value',
    ];

    protected $casts = [
        'value' => 'decimal:2',
    ];

    public function measurement()
    {
        return $this->belongsTo(Measurement::class);
    }

    public function field()
    {
        return $this->belongsTo(MeasurementField::class, 'field_id');
    }
}
