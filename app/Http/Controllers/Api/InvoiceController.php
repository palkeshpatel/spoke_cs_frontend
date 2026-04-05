<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\InvoiceService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class InvoiceController extends Controller
{
    public function __construct(private readonly InvoiceService $invoiceService)
    {
    }

    public function index(Request $request)
    {
        $perPage = (int)$request->query('per_page', 20);
        return response()->json($this->invoiceService->paginate($perPage));
    }

    public function show(int $id)
    {
        return response()->json($this->invoiceService->findOrFail($id));
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'customer_id' => ['required', 'integer'],
            'order_id' => ['nullable', 'integer'],
            'invoice_date' => ['nullable', 'date'],
            'discount' => ['nullable', 'numeric'],
            'tax' => ['nullable', 'numeric'],
            'status' => ['nullable', 'in:paid,pending,overdue'],
            'items' => ['nullable', 'array'],
        ]);

        if ($validator->fails()) {
            return response()->json(['message' => 'Validation failed', 'errors' => $validator->errors()], 422);
        }

        return response()->json($this->invoiceService->create($request->all()), 201);
    }

    public function update(int $id, Request $request)
    {
        $validator = Validator::make($request->all(), [
            'customer_id' => ['sometimes', 'integer'],
            'order_id' => ['sometimes', 'nullable', 'integer'],
            'invoice_date' => ['sometimes', 'nullable', 'date'],
            'discount' => ['sometimes', 'numeric'],
            'tax' => ['sometimes', 'numeric'],
            'status' => ['sometimes', 'in:paid,pending,overdue'],
            'items' => ['sometimes', 'array'],
        ]);

        if ($validator->fails()) {
            return response()->json(['message' => 'Validation failed', 'errors' => $validator->errors()], 422);
        }

        return response()->json($this->invoiceService->update($id, $request->all()));
    }

    public function addPayment(int $id, Request $request)
    {
        $validator = Validator::make($request->all(), [
            'amount' => ['required', 'numeric'],
            'payment_method' => ['nullable', 'string', 'max:50'],
            'paid_at' => ['nullable', 'date'],
        ]);

        if ($validator->fails()) {
            return response()->json(['message' => 'Validation failed', 'errors' => $validator->errors()], 422);
        }

        return response()->json($this->invoiceService->addPayment($id, $request->all()), 201);
    }

    public function destroy(int $id)
    {
        $this->invoiceService->delete($id);
        return response()->json(['message' => 'Deleted']);
    }
}
