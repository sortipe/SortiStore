<?php

namespace App\Models;

use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'role',
        'sorti_coins_balance',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var array<int, string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'email_verified_at' => 'datetime',
        'sorti_coins_balance' => 'integer',
    ];

    // Helpers
    public function isAdmin()
    {
        return $this->role === 'admin';
    }

    public function isEmployee()
    {
        return $this->role === 'employee';
    }

    public function isCustomer()
    {
        return $this->role === 'customer';
    }

    // Relations
    public function orders()
    {
        return $this->hasMany(Order::class);
    }

    public function sortiTransactions()
    {
        return $this->hasMany(SortiTransaction::class);
    }

    public function courses()
    {
        return $this->hasMany(UserCourse::class);
    }

    public function tasks()
    {
        return $this->hasMany(UserTask::class);
    }

    public function exams()
    {
        return $this->hasMany(UserExam::class);
    }
}
