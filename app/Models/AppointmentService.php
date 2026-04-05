<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AppointmentService extends Model
{
    use HasFactory;

    protected $table = 'appointment_services';

    protected $fillable = [
        'service_name',
        'duration_minutes',
        'price',
    ];

    protected $casts = [
        'price' => 'decimal:2',
    ];
}
