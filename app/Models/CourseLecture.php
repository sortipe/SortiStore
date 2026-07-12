<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CourseLecture extends Model
{
    use HasFactory;

    protected $fillable = [
        'module_id',
        'title',
        'video_url',
        'content',
        'pdf_file',
        'resource_file',
        'sort_order',
    ];

    protected $casts = [
        'sort_order' => 'integer',
    ];

    public function module()
    {
        return $this->belongsTo(CourseModule::class, 'module_id');
    }

    public function tasks()
    {
        return $this->hasMany(UserTask::class, 'lecture_id');
    }

    public function exams()
    {
        return $this->hasMany(UserExam::class, 'lecture_id');
    }
}
