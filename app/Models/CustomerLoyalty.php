<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CustomerLoyalty extends Model
{
    use HasFactory;

    protected $table = 'customer_loyalty';

    protected $fillable = [
        'customer_id',
        'points',
        'total_spent',
        'last_visit',
    ];

    protected $casts = [
        'total_spent' => 'decimal:2',
        'last_visit' => 'date',
    ];

    public function customer()
    {
        return $this->belongsTo(Customer::class);
    }
}
