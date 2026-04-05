<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Customer extends Model
{
    use HasFactory;

    protected $fillable = [
        'customer_code',
        'name',
        'phone',
        'email',
        'address',
        'birthday',
        'profile_image',
        'vip_status',
    ];

    protected $casts = [
        'vip_status' => 'boolean',
        'birthday' => 'date',
    ];

    public function preference()
    {
        return $this->hasOne(CustomerPreference::class);
    }

    public function loyalty()
    {
        return $this->hasOne(CustomerLoyalty::class);
    }

    public function bodyProfile()
    {
        return $this->hasOne(BodyProfile::class);
    }

    public function bodyImages()
    {
        return $this->hasMany(CustomerBodyImage::class);
    }

    public function appointments()
    {
        return $this->hasMany(Appointment::class);
    }

    public function measurements()
    {
        return $this->hasMany(Measurement::class);
    }

    public function orders()
    {
        return $this->hasMany(Order::class);
    }

    public function invoices()
    {
        return $this->hasMany(Invoice::class);
    }
}
