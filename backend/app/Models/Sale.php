<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Sale extends Model
{
    protected $fillable = [
        'motorcycle_id',
        'seller_id',
        'buyer_id',
        'offer_price',
        'status',
    ];

    public function motorcycle()
    {
        return $this->belongsTo(Motorcycle::class);
    }

    public function seller()
    {
        return $this->belongsTo(User::class, 'seller_id');
    }

    public function buyer()
    {
        return $this->belongsTo(User::class, 'buyer_id');
    }
}