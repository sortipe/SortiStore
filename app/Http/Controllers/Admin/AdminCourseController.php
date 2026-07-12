<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\CourseModule;
use App\Models\CourseLecture;
use Illuminate\Http\Request;

class AdminCourseController extends Controller
{
    public function __construct()
    {
        $this->middleware(['auth', 'admin']);
    }

    /**
     * List all courses
     */
    public function index()
    {
        $courses = Product::where('type', 'course')->orderBy('created_at', 'desc')->paginate(15);
        return view('admin.courses.index', compact('courses'));
    }

    /**
     * Manage course modules and syllabus
     */
    public function show($id)
    {
        $course = Product::where('id', $id)->where('type', 'course')->with('modules.lectures')->firstOrFail();
        return view('admin.courses.show', compact('course'));
    }

    /**
     * Store a module
     */
    public function storeModule(Request $request, $courseId)
    {
        $request->validate([
            'title' => 'required|string|max:255',
            'sort_order' => 'required|integer'
        ]);

        CourseModule::create([
            'product_id' => $courseId,
            'title' => $request->title,
            'sort_order' => $request->sort_order
        ]);

        return redirect()->back()->with('success', 'Módulo agregado con éxito.');
    }

    /**
     * Store a lecture
     */
    public function storeLecture(Request $request, $courseId)
    {
        $request->validate([
            'module_id' => 'required|integer',
            'title' => 'required|string|max:255',
            'video_url' => 'nullable|string',
            'content' => 'nullable|string',
            'pdf_file' => 'nullable|file|max:10240',
            'resource_file' => 'nullable|file|max:10240',
            'sort_order' => 'required|integer'
        ]);

        // Handle file uploads
        $pdfPath = null;
        if ($request->hasFile('pdf_file')) {
            $pdfPath = $request->file('pdf_file')->store('course_pdfs', 'public');
        }

        $resPath = null;
        if ($request->hasFile('resource_file')) {
            $resPath = $request->file('resource_file')->store('course_resources', 'public');
        }

        CourseLecture::create([
            'module_id' => $request->module_id,
            'title' => $request->title,
            'video_url' => $request->video_url,
            'content' => $request->content,
            'pdf_file' => $pdfPath,
            'resource_file' => $resPath,
            'sort_order' => $request->sort_order
        ]);

        return redirect()->back()->with('success', 'Clase agregada al módulo.');
    }

    /**
     * Delete course module
     */
    public function destroyModule($courseId, $moduleId)
    {
        $module = CourseModule::findOrFail($moduleId);
        $module->delete();
        return redirect()->back()->with('success', 'Módulo eliminado.');
    }

    /**
     * Delete course lecture
     */
    public function destroyLecture($courseId, $lectureId)
    {
        $lecture = CourseLecture::findOrFail($lectureId);
        $lecture->delete();
        return redirect()->back()->with('success', 'Clase eliminada.');
    }
}
