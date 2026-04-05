<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\MeasurementFieldService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class MeasurementFieldController extends Controller
{
    public function __construct(private readonly MeasurementFieldService $measurementFieldService)
    {
    }

    public function index(Request $request)
    {
        $garmentType = $request->query('garment_type');
        return response()->json($this->measurementFieldService->all($garmentType));
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'field_name' => ['required', 'string', 'max:100'],
            'garment_type' => ['required', 'string', 'max:50'],
            'unit' => ['nullable', 'string', 'max:10'],
        ]);

        if ($validator->fails()) {
            return response()->json(['message' => 'Validation failed', 'errors' => $validator->errors()], 422);
        }

        return response()->json($this->measurementFieldService->create($request->all()), 201);
    }
}
