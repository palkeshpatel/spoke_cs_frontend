<?php

namespace App\Services;

use App\Models\Invoice;
use App\Models\InvoiceItem;
use App\Models\Payment;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class InvoiceService
{
    public function paginate(int $perPage = 20)
    {
        return Invoice::with(['customer', 'order', 'items', 'payments'])->orderByDesc('id')->paginate($perPage);
    }

    public function findOrFail(int $id): Invoice
    {
        return Invoice::with(['customer', 'order', 'items', 'payments'])->findOrFail($id);
    }

    public function create(array $data): Invoice
    {
        return DB::transaction(function () use ($data) {
            $items = $data['items'] ?? [];
            $computedTotal = $this->computeTotal($items);
            $discount = (float)($data['discount'] ?? 0);
            $tax = (float)($data['tax'] ?? 0);
            $grandTotal = max(0, $computedTotal - $discount + $tax);

            $invoice = Invoice::create([
                'invoice_number' => $data['invoice_number'] ?? $this->generateInvoiceNumber(),
                'customer_id' => $data['customer_id'],
                'order_id' => $data['order_id'] ?? null,
                'invoice_date' => $data['invoice_date'] ?? Carbon::now()->toDateString(),
                'total_amount' => $computedTotal,
                'discount' => $discount,
                'tax' => $tax,
                'grand_total' => $grandTotal,
                'status' => $data['status'] ?? 'pending',
            ]);

            if (is_array($items)) {
                foreach ($items as $item) {
                    if (!is_array($item)) continue;
                    $qty = (int)($item['quantity'] ?? 1);
                    $price = (float)($item['price'] ?? 0);
                    InvoiceItem::create([
                        'invoice_id' => $invoice->id,
                        'description' => $item['description'] ?? '',
                        'quantity' => $qty,
                        'price' => $price,
                        'total' => $qty * $price,
                    ]);
                }
            }

            return $this->findOrFail((int)$invoice->id);
        });
    }

    public function update(int $id, array $data): Invoice
    {
        return DB::transaction(function () use ($id, $data) {
            $invoice = Invoice::findOrFail($id);
            $invoice->fill($data);

            if (isset($data['items']) && is_array($data['items'])) {
                InvoiceItem::where('invoice_id', $invoice->id)->delete();
                $computedTotal = $this->computeTotal($data['items']);
                $discount = (float)($data['discount'] ?? $invoice->discount);
                $tax = (float)($data['tax'] ?? $invoice->tax);
                $invoice->total_amount = $computedTotal;
                $invoice->discount = $discount;
                $invoice->tax = $tax;
                $invoice->grand_total = max(0, $computedTotal - $discount + $tax);

                foreach ($data['items'] as $item) {
                    if (!is_array($item)) continue;
                    $qty = (int)($item['quantity'] ?? 1);
                    $price = (float)($item['price'] ?? 0);
                    InvoiceItem::create([
                        'invoice_id' => $invoice->id,
                        'description' => $item['description'] ?? '',
                        'quantity' => $qty,
                        'price' => $price,
                        'total' => $qty * $price,
                    ]);
                }
            }

            $invoice->save();
            return $this->findOrFail($id);
        });
    }

    public function addPayment(int $invoiceId, array $data): Payment
    {
        return DB::transaction(function () use ($invoiceId, $data) {
            $invoice = Invoice::findOrFail($invoiceId);
            $payment = Payment::create([
                'invoice_id' => $invoice->id,
                'amount' => (float)($data['amount'] ?? 0),
                'payment_method' => $data['payment_method'] ?? null,
                'paid_at' => $data['paid_at'] ?? Carbon::now(),
            ]);

            $paidTotal = (float)Payment::where('invoice_id', $invoice->id)->sum('amount');
            if ($paidTotal >= (float)$invoice->grand_total) {
                $invoice->status = 'paid';
            } elseif ($invoice->status === 'paid') {
                $invoice->status = 'pending';
            }
            $invoice->save();

            return $payment;
        });
    }

    public function delete(int $id): void
    {
        Invoice::whereKey($id)->delete();
    }

    private function computeTotal(array $items): float
    {
        $total = 0.0;
        foreach ($items as $item) {
            if (!is_array($item)) continue;
            $qty = (int)($item['quantity'] ?? 1);
            $price = (float)($item['price'] ?? 0);
            $total += $qty * $price;
        }
        return $total;
    }

    private function generateInvoiceNumber(): string
    {
        $lastId = (int)Invoice::max('id');
        $next = $lastId + 1;
        return 'INV-' . str_pad((string)$next, 3, '0', STR_PAD_LEFT) . '-' . Str::upper(Str::random(2));
    }
}
