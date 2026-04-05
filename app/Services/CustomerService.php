<?php

namespace App\Services;

use App\Models\Customer;
use App\Models\BodyProfile;
use App\Models\CustomerBodyImage;
use App\Models\CustomerLoyalty;
use App\Models\CustomerPreference;
use Illuminate\Support\Str;

class CustomerService
{
    public function paginate(int $perPage = 20)
    {
        return Customer::with(['preference', 'loyalty'])->withCount('orders')->orderByDesc('id')->paginate($perPage);
    }

    public function findOrFail(int $id): Customer
    {
        return Customer::with(['preference', 'loyalty', 'bodyProfile', 'bodyImages'])->withCount('orders')->findOrFail($id);
    }

    public function create(array $data): Customer
    {
        $customer = Customer::create([
            'customer_code' => $data['customer_code'] ?? $this->generateCustomerCode(),
            'name' => $data['name'] ?? '',
            'phone' => $data['phone'] ?? null,
            'email' => $data['email'] ?? null,
            'address' => $data['address'] ?? null,
            'birthday' => $data['birthday'] ?? null,
            'profile_image' => $data['profile_image'] ?? null,
            'vip_status' => (bool)($data['vip_status'] ?? false),
        ]);

        if (isset($data['preferences']) && is_array($data['preferences'])) {
            CustomerPreference::updateOrCreate(
                ['customer_id' => $customer->id],
                [
                    'fit_preference' => $data['preferences']['fit_preference'] ?? null,
                    'favorite_colors' => $data['preferences']['favorite_colors'] ?? null,
                    'notes' => $data['preferences']['notes'] ?? null,
                ],
            );
        }

        CustomerLoyalty::firstOrCreate(
            ['customer_id' => $customer->id],
            [
                'points' => 0,
                'total_spent' => 0,
                'last_visit' => null,
            ],
        );

        return $this->findOrFail((int)$customer->id);
    }

    public function update(int $id, array $data): Customer
    {
        $customer = Customer::findOrFail($id);
        $customer->fill([
            'name' => $data['name'] ?? $customer->name,
            'phone' => $data['phone'] ?? $customer->phone,
            'email' => $data['email'] ?? $customer->email,
            'address' => $data['address'] ?? $customer->address,
            'birthday' => $data['birthday'] ?? $customer->birthday,
            'profile_image' => $data['profile_image'] ?? $customer->profile_image,
            'vip_status' => isset($data['vip_status']) ? (bool)$data['vip_status'] : $customer->vip_status,
        ]);
        $customer->save();

        if (isset($data['preferences']) && is_array($data['preferences'])) {
            CustomerPreference::updateOrCreate(
                ['customer_id' => $customer->id],
                [
                    'fit_preference' => $data['preferences']['fit_preference'] ?? null,
                    'favorite_colors' => $data['preferences']['favorite_colors'] ?? null,
                    'notes' => $data['preferences']['notes'] ?? null,
                ],
            );
        }

        return $this->findOrFail($id);
    }

    public function delete(int $id): void
    {
        Customer::whereKey($id)->delete();
    }

    public function upsertBodyProfile(int $customerId, array $data): BodyProfile
    {
        return BodyProfile::updateOrCreate(
            ['customer_id' => $customerId],
            [
                'height' => $data['height'] ?? null,
                'weight' => $data['weight'] ?? null,
                'body_type' => $data['body_type'] ?? null,
                'posture' => $data['posture'] ?? null,
            ],
        );
    }

    public function addBodyImage(int $customerId, array $data): CustomerBodyImage
    {
        return CustomerBodyImage::create([
            'customer_id' => $customerId,
            'image_type' => $data['image_type'],
            'image_path' => $data['image_path'],
            'notes' => $data['notes'] ?? null,
        ]);
    }

    public function deleteBodyImage(int $customerId, int $imageId): void
    {
        CustomerBodyImage::where('customer_id', $customerId)->whereKey($imageId)->delete();
    }

    private function generateCustomerCode(): string
    {
        $lastId = (int)Customer::max('id');
        $next = $lastId + 1;
        return 'C' . str_pad((string)$next, 3, '0', STR_PAD_LEFT) . '-' . Str::upper(Str::random(2));
    }
}
