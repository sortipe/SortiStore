<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class UserExam extends Model
{
    use HasFactory;

    protected $fillable = [
        'lecture_id',
        'user_id',
        'score',
        'passed',
    ];

    protected $casts = [
        'score' => 'decimal:2',
        'passed' => 'boolean',
    ];

    public function lecture()
    {
        return $this->belongsTo(CourseLecture::class, 'lecture_id');
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
