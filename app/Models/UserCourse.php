<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class UserCourse extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'product_id',
        'completed_lectures',
        'progress_percent',
        'completed_at',
    ];

    protected $casts = [
        'progress_percent' => 'integer',
        'completed_at' => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function course()
    {
        return $this->belongsTo(Product::class, 'product_id');
    }

    public function getCompletedLecturesArrayAttribute()
    {
        return json_decode($this->completed_lectures, true) ?? [];
    }

    public function isLectureCompleted($lectureId)
    {
        return in_array($lectureId, $this->completed_lectures_array);
    }

    public function markLectureAsCompleted($lectureId)
    {
        $completed = $this->completed_lectures_array;
        if (!in_array($lectureId, $completed)) {
            $completed[] = (int)$lectureId;
            $this->completed_lectures = json_encode($completed);
            
            // Calculate progress percent
            $totalLecturesCount = 0;
            foreach ($this->course->modules as $mod) {
                $totalLecturesCount += $mod->lectures()->count();
            }
            
            if ($totalLecturesCount > 0) {
                $this->progress_percent = min(100, round((count($completed) / $totalLecturesCount) * 100));
            } else {
                $this->progress_percent = 100;
            }

            if ($this->progress_percent >= 100 && !$this->completed_at) {
                $this->completed_at = now();
            }
            $this->save();
        }
    }
}
