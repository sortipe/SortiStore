<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\CourseModule;
use App\Models\CourseLecture;
use App\Models\UserCourse;
use App\Models\UserTask;
use App\Models\UserExam;
use Illuminate\Http\Request;

class LMSController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth');
    }

    /**
     * Mis Cursos list
     */
    public function index()
    {
        $courses = UserCourse::where('user_id', auth()->user()->id)
            ->with('course.images')
            ->get();

        return view('dashboard.courses.index', compact('courses'));
    }

    /**
     * View course syllabus
     */
    public function show($id)
    {
        $user = auth()->user();
        
        $userCourse = UserCourse::where('user_id', $user->id)
            ->where('product_id', $id)
            ->firstOrFail();

        $course = Product::where('id', $id)
            ->with(['modules.lectures'])
            ->firstOrFail();

        return view('dashboard.courses.show', compact('userCourse', 'course'));
    }

    /**
     * View class lecture details
     */
    public function viewLecture($courseId, $lectureId)
    {
        $user = auth()->user();
        
        $userCourse = UserCourse::where('user_id', $user->id)
            ->where('product_id', $courseId)
            ->firstOrFail();

        $course = Product::where('id', $courseId)
            ->with(['modules.lectures'])
            ->firstOrFail();

        $lecture = CourseLecture::where('id', $lectureId)
            ->whereHas('module', function($q) use ($courseId) {
                $q->where('product_id', $courseId);
            })
            ->firstOrFail();

        // Tasks and exams
        $task = UserTask::where('user_id', $user->id)->where('lecture_id', $lectureId)->first();
        $exam = UserExam::where('user_id', $user->id)->where('lecture_id', $lectureId)->first();

        return view('dashboard.courses.lecture-viewer', compact('userCourse', 'course', 'lecture', 'task', 'exam'));
    }

    /**
     * Mark a class lecture as completed (AJAX)
     */
    public function completeLecture($courseId, $lectureId)
    {
        $user = auth()->user();
        
        $userCourse = UserCourse::where('user_id', $user->id)
            ->where('product_id', $courseId)
            ->firstOrFail();

        $lecture = CourseLecture::findOrFail($lectureId);

        // Mark as completed
        $userCourse->markLectureAsCompleted($lectureId);

        return response()->json([
            'success' => true,
            'progress_percent' => $userCourse->progress_percent,
            'completed' => $userCourse->progress_percent >= 100,
            'message' => 'Progreso actualizado.'
        ]);
    }

    /**
     * Submit task upload
     */
    public function submitTask(Request $request)
    {
        $request->validate([
            'lecture_id' => 'required|integer',
            'task_file' => 'required|file|max:10240', // 10MB limit
        ]);

        $lectureId = $request->lecture_id;
        $lecture = CourseLecture::findOrFail($lectureId);
        $user = auth()->user();

        // Store file
        $filePath = $request->file('task_file')->store('tasks', 'public');

        // Create or update task submission
        $task = UserTask::updateOrCreate([
            'user_id' => $user->id,
            'lecture_id' => $lectureId
        ], [
            'file_path' => $filePath,
            'grade' => null,
            'feedback' => null
        ]);

        return redirect()->back()->with('success', 'Tarea enviada con éxito.');
    }
}
