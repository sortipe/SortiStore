<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class UserTask extends Model
{
    use HasFactory;

    protected $fillable = [
        'lecture_id',
        'user_id',
        'file_path',
        'grade',
        'feedback',
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
