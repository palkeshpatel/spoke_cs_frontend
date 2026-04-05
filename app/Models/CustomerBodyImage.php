<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CustomerBodyImage extends Model
{
    use HasFactory;

    protected $table = 'customer_body_images';

    protected $fillable = [
        'customer_id',
        'image_type',
        'image_path',
        'notes',
    ];

    public function customer()
    {
        return $this->belongsTo(Customer::class);
    }
}
