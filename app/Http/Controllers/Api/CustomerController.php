<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\ChunkUploadService;
use App\Services\CustomerService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class CustomerController extends Controller
{
    public function __construct(
        private readonly CustomerService $customerService,
        private readonly ChunkUploadService $chunkUploadService,
    ) {}

    public function index(Request $request)
    {
        $perPage = (int)$request->query('per_page', 20);
        $result = $this->customerService->paginate($perPage);
        return response()->json($result);
    }

    public function show(int $id)
    {
        return response()->json($this->customerService->findOrFail($id));
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => ['required', 'string', 'max:150'],
            'email' => ['nullable', 'email', 'max:150'],
            'phone' => ['nullable', 'string', 'max:20'],
            'address' => ['nullable', 'string'],
            'birthday' => ['nullable', 'date'],
        ]);

        if ($validator->fails()) {
            return response()->json(['message' => 'Validation failed', 'errors' => $validator->errors()], 422);
        }

        $customer = $this->customerService->create($request->all());
        return response()->json($customer, 201);
    }

    public function update(int $id, Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => ['sometimes', 'string', 'max:150'],
            'email' => ['sometimes', 'nullable', 'email', 'max:150'],
            'phone' => ['sometimes', 'nullable', 'string', 'max:20'],
            'address' => ['sometimes', 'nullable', 'string'],
            'birthday' => ['sometimes', 'nullable', 'date'],
        ]);

        if ($validator->fails()) {
            return response()->json(['message' => 'Validation failed', 'errors' => $validator->errors()], 422);
        }

        return response()->json($this->customerService->update($id, $request->all()));
    }

    public function destroy(int $id)
    {
        $this->customerService->delete($id);
        return response()->json(['message' => 'Deleted']);
    }

    public function upsertBodyProfile(int $id, Request $request)
    {
        $validator = Validator::make($request->all(), [
            'height' => ['nullable', 'string', 'max:20'],
            'weight' => ['nullable', 'string', 'max:20'],
            'body_type' => ['nullable', 'string', 'max:50'],
            'posture' => ['nullable', 'string', 'max:50'],
        ]);

        if ($validator->fails()) {
            return response()->json(['message' => 'Validation failed', 'errors' => $validator->errors()], 422);
        }

        return response()->json($this->customerService->upsertBodyProfile($id, $request->all()));
    }

    public function addBodyImage(int $id, Request $request)
    {
        $validator = Validator::make($request->all(), [
            'image_type' => ['required', 'string', 'max:50'],
            'image_path' => ['required', 'string', 'max:255'],
            'notes' => ['nullable', 'string'],
        ]);

        if ($validator->fails()) {
            return response()->json(['message' => 'Validation failed', 'errors' => $validator->errors()], 422);
        }

        return response()->json($this->customerService->addBodyImage($id, $request->all()), 201);
    }

    public function deleteBodyImage(int $id, int $imageId)
    {
        $this->customerService->deleteBodyImage($id, $imageId);
        return response()->json(['message' => 'Deleted']);
    }

    public function initBodyImageUpload(int $id, Request $request)
    {
        $validator = Validator::make($request->all(), [
            'image_type' => ['required', 'string', 'max:50'],
            'original_name' => ['required', 'string', 'max:255'],
            'total_chunks' => ['required', 'integer', 'min:1', 'max:10000'],
        ]);

        if ($validator->fails()) {
            return response()->json(['message' => 'Validation failed', 'errors' => $validator->errors()], 422);
        }

        return response()->json(
            $this->chunkUploadService->initCustomerBodyImageUpload(
                $id,
                (string)$request->input('image_type'),
                (string)$request->input('original_name'),
                (int)$request->input('total_chunks'),
            ),
            201,
        );
    }

    public function uploadBodyImageChunk(int $id, Request $request)
    {
        $validator = Validator::make($request->all(), [
            'upload_id' => ['required', 'string', 'max:64'],
            'chunk_index' => ['required', 'integer', 'min:0', 'max:1000000'],
        ]);

        if ($validator->fails()) {
            return response()->json(['message' => 'Validation failed', 'errors' => $validator->errors()], 422);
        }

        $chunk = $request->file('chunk');
        if (!$chunk) {
            return response()->json(['message' => 'Validation failed', 'errors' => ['chunk' => ['Chunk file is required']]], 422);
        }

        $this->chunkUploadService->storeChunk((string)$request->input('upload_id'), (int)$request->input('chunk_index'), $chunk);
        return response()->json(['ok' => true]);
    }

    public function completeBodyImageUpload(int $id, Request $request)
    {
        $validator = Validator::make($request->all(), [
            'upload_id' => ['required', 'string', 'max:64'],
        ]);

        if ($validator->fails()) {
            return response()->json(['message' => 'Validation failed', 'errors' => $validator->errors()], 422);
        }

        return response()->json($this->chunkUploadService->completeCustomerBodyImageUpload((string)$request->input('upload_id')), 201);
    }
}
