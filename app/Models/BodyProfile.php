<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class BodyProfile extends Model
{
    use HasFactory;

    protected $fillable = [
        'customer_id',
        'height',
        'weight',
        'body_type',
        'posture',
    ];

    public function customer()
    {
        return $this->belongsTo(Customer::class);
    }
}
