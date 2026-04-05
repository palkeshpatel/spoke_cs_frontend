<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Measurement extends Model
{
    use HasFactory;

    protected $fillable = [
        'customer_id',
        'garment_type',
        'taken_by',
        'notes',
    ];

    public function customer()
    {
        return $this->belongsTo(Customer::class);
    }

    public function taker()
    {
        return $this->belongsTo(Staff::class, 'taken_by');
    }

    public function values()
    {
        return $this->hasMany(MeasurementValue::class);
    }
}
