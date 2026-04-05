<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\MeasurementService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class MeasurementController extends Controller
{
    public function __construct(private readonly MeasurementService $measurementService)
    {
    }

    public function index(Request $request)
    {
        $perPage = (int)$request->query('per_page', 20);
        return response()->json($this->measurementService->paginate($perPage));
    }

    public function show(int $id)
    {
        return response()->json($this->measurementService->findOrFail($id));
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'customer_id' => ['required', 'integer'],
            'garment_type' => ['required', 'string', 'max:50'],
            'taken_by' => ['nullable', 'integer'],
            'notes' => ['nullable', 'string'],
            'values' => ['nullable', 'array'],
        ]);

        if ($validator->fails()) {
            return response()->json(['message' => 'Validation failed', 'errors' => $validator->errors()], 422);
        }

        return response()->json($this->measurementService->create($request->all()), 201);
    }

    public function update(int $id, Request $request)
    {
        $validator = Validator::make($request->all(), [
            'customer_id' => ['sometimes', 'integer'],
            'garment_type' => ['sometimes', 'string', 'max:50'],
            'taken_by' => ['sometimes', 'nullable', 'integer'],
            'notes' => ['sometimes', 'nullable', 'string'],
            'values' => ['sometimes', 'array'],
        ]);

        if ($validator->fails()) {
            return response()->json(['message' => 'Validation failed', 'errors' => $validator->errors()], 422);
        }

        return response()->json($this->measurementService->update($id, $request->all()));
    }

    public function destroy(int $id)
    {
        $this->measurementService->delete($id);
        return response()->json(['message' => 'Deleted']);
    }
}
