<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\AppointmentServiceCatalog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class AppointmentServiceController extends Controller
{
    public function __construct(private readonly AppointmentServiceCatalog $appointmentServiceCatalog)
    {
    }

    public function index()
    {
        return response()->json($this->appointmentServiceCatalog->all());
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'service_name' => ['required', 'string', 'max:150'],
            'duration_minutes' => ['nullable', 'integer'],
            'price' => ['nullable', 'numeric'],
        ]);

        if ($validator->fails()) {
            return response()->json(['message' => 'Validation failed', 'errors' => $validator->errors()], 422);
        }

        return response()->json($this->appointmentServiceCatalog->create($request->all()), 201);
    }
}
