<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\OrderService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class OrderController extends Controller
{
    public function __construct(private readonly OrderService $orderService)
    {
    }

    public function index(Request $request)
    {
        $perPage = (int)$request->query('per_page', 20);
        return response()->json($this->orderService->paginate($perPage));
    }

    public function show(int $id)
    {
        return response()->json($this->orderService->findOrFail($id));
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'customer_id' => ['required', 'integer'],
            'order_type' => ['nullable', 'string', 'max:100'],
            'fabric' => ['nullable', 'string', 'max:100'],
            'trial_date' => ['nullable', 'date'],
            'delivery_date' => ['nullable', 'date'],
            'status' => ['nullable', 'in:pending,in_progress,trial,completed,delivered'],
            'items' => ['nullable', 'array'],
        ]);

        if ($validator->fails()) {
            return response()->json(['message' => 'Validation failed', 'errors' => $validator->errors()], 422);
        }

        return response()->json($this->orderService->create($request->all()), 201);
    }

    public function update(int $id, Request $request)
    {
        $validator = Validator::make($request->all(), [
            'customer_id' => ['sometimes', 'integer'],
            'order_type' => ['sometimes', 'nullable', 'string', 'max:100'],
            'fabric' => ['sometimes', 'nullable', 'string', 'max:100'],
            'trial_date' => ['sometimes', 'nullable', 'date'],
            'delivery_date' => ['sometimes', 'nullable', 'date'],
            'status' => ['sometimes', 'in:pending,in_progress,trial,completed,delivered'],
            'items' => ['sometimes', 'array'],
        ]);

        if ($validator->fails()) {
            return response()->json(['message' => 'Validation failed', 'errors' => $validator->errors()], 422);
        }

        return response()->json($this->orderService->update($id, $request->all()));
    }

    public function destroy(int $id)
    {
        $this->orderService->delete($id);
        return response()->json(['message' => 'Deleted']);
    }
}
