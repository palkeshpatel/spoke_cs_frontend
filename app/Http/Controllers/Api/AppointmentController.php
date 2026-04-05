<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\AppointmentManager;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class AppointmentController extends Controller
{
    public function __construct(private readonly AppointmentManager $appointmentManager)
    {
    }

    public function index(Request $request)
    {
        $perPage = (int)$request->query('per_page', 20);
        return response()->json($this->appointmentManager->paginate($perPage));
    }

    public function show(int $id)
    {
        return response()->json($this->appointmentManager->findOrFail($id));
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'customer_id' => ['required', 'integer'],
            'service_type' => ['required', 'string', 'max:100'],
            'appointment_date' => ['required', 'date'],
            'appointment_time' => ['nullable', 'date_format:H:i:s'],
            'duration_minutes' => ['nullable', 'integer'],
            'priority' => ['nullable', 'in:low,normal,high'],
            'status' => ['nullable', 'in:pending,confirmed,completed,cancelled'],
            'notes' => ['nullable', 'string'],
        ]);

        if ($validator->fails()) {
            return response()->json(['message' => 'Validation failed', 'errors' => $validator->errors()], 422);
        }

        return response()->json($this->appointmentManager->create($request->all()), 201);
    }

    public function update(int $id, Request $request)
    {
        $validator = Validator::make($request->all(), [
            'customer_id' => ['sometimes', 'integer'],
            'service_type' => ['sometimes', 'string', 'max:100'],
            'appointment_date' => ['sometimes', 'date'],
            'appointment_time' => ['sometimes', 'nullable', 'date_format:H:i:s'],
            'duration_minutes' => ['sometimes', 'integer'],
            'priority' => ['sometimes', 'in:low,normal,high'],
            'status' => ['sometimes', 'in:pending,confirmed,completed,cancelled'],
            'notes' => ['sometimes', 'nullable', 'string'],
        ]);

        if ($validator->fails()) {
            return response()->json(['message' => 'Validation failed', 'errors' => $validator->errors()], 422);
        }

        return response()->json($this->appointmentManager->update($id, $request->all()));
    }

    public function destroy(int $id)
    {
        $this->appointmentManager->delete($id);
        return response()->json(['message' => 'Deleted']);
    }
}
