<?php

namespace App\Services;

use App\Models\Order;
use App\Models\OrderItem;
use App\Models\OrderStatusHistory;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class OrderService
{
    public function paginate(int $perPage = 20)
    {
        return Order::with(['customer', 'items'])->orderByDesc('id')->paginate($perPage);
    }

    public function findOrFail(int $id): Order
    {
        return Order::with(['customer', 'items', 'statusHistory'])->findOrFail($id);
    }

    public function create(array $data): Order
    {
        return DB::transaction(function () use ($data) {
            $order = Order::create([
                'order_number' => $data['order_number'] ?? $this->generateOrderNumber(),
                'customer_id' => $data['customer_id'],
                'order_type' => $data['order_type'] ?? null,
                'fabric' => $data['fabric'] ?? null,
                'trial_date' => $data['trial_date'] ?? null,
                'delivery_date' => $data['delivery_date'] ?? null,
                'notes' => $data['notes'] ?? null,
                'status' => $data['status'] ?? 'pending',
            ]);

            $items = $data['items'] ?? [];
            if (is_array($items)) {
                foreach ($items as $item) {
                    if (!is_array($item)) continue;
                    OrderItem::create([
                        'order_id' => $order->id,
                        'garment_type' => $item['garment_type'] ?? null,
                        'measurement_id' => $item['measurement_id'] ?? null,
                        'quantity' => (int)($item['quantity'] ?? 1),
                        'price' => (float)($item['price'] ?? 0),
                    ]);
                }
            }

            OrderStatusHistory::create([
                'order_id' => $order->id,
                'status' => $order->status,
                'notes' => $data['status_note'] ?? null,
            ]);

            return $this->findOrFail((int)$order->id);
        });
    }

    public function update(int $id, array $data): Order
    {
        return DB::transaction(function () use ($id, $data) {
            $order = Order::findOrFail($id);
            $oldStatus = $order->status;
            $order->fill($data);
            $order->save();

            if (isset($data['items']) && is_array($data['items'])) {
                OrderItem::where('order_id', $order->id)->delete();
                foreach ($data['items'] as $item) {
                    if (!is_array($item)) continue;
                    OrderItem::create([
                        'order_id' => $order->id,
                        'garment_type' => $item['garment_type'] ?? null,
                        'measurement_id' => $item['measurement_id'] ?? null,
                        'quantity' => (int)($item['quantity'] ?? 1),
                        'price' => (float)($item['price'] ?? 0),
                    ]);
                }
            }

            if (isset($data['status']) && $data['status'] !== $oldStatus) {
                OrderStatusHistory::create([
                    'order_id' => $order->id,
                    'status' => $order->status,
                    'notes' => $data['status_note'] ?? null,
                ]);
            }

            return $this->findOrFail($id);
        });
    }

    public function delete(int $id): void
    {
        Order::whereKey($id)->delete();
    }

    private function generateOrderNumber(): string
    {
        $lastId = (int)Order::max('id');
        $next = $lastId + 1;
        return 'ORD-' . str_pad((string)$next, 3, '0', STR_PAD_LEFT) . '-' . Str::upper(Str::random(2));
    }
}
