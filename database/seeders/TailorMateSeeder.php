<?php

namespace Database\Seeders;

use App\Models\Appointment;
use App\Models\AppointmentService;
use App\Models\BodyProfile;
use App\Models\Customer;
use App\Models\CustomerBodyImage;
use App\Models\CustomerLoyalty;
use App\Models\CustomerPreference;
use App\Models\Invoice;
use App\Models\InvoiceItem;
use App\Models\Measurement;
use App\Models\MeasurementField;
use App\Models\MeasurementValue;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\OrderStatusHistory;
use App\Models\Payment;
use App\Models\Staff;
use App\Models\User;
use Faker\Factory;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class TailorMateSeeder extends Seeder
{
    public function run(): void
    {
        DB::transaction(function () {
            $faker = Factory::create();

            $staff = collect([
                Staff::create(['name' => 'Michael T.', 'email' => 'michael.t@tailormate.local', 'phone' => '9990001111', 'role' => 'Tailor']),
                Staff::create(['name' => 'Sarah K.', 'email' => 'sarah.k@tailormate.local', 'phone' => '9990002222', 'role' => 'Tailor']),
                Staff::create(['name' => 'Admin', 'email' => 'admin.staff@tailormate.local', 'phone' => '9990003333', 'role' => 'Admin']),
            ]);

            User::updateOrCreate(
                ['email' => 'admin@spoke.local'],
                ['name' => 'Admin', 'password' => Hash::make('admin@123'), 'role' => 'Admin'],
            );

            foreach (
                [
                    ['service_name' => 'Suit Fitting', 'duration_minutes' => 45, 'price' => 850],
                    ['service_name' => 'Shirt Measurement', 'duration_minutes' => 30, 'price' => 320],
                    ['service_name' => 'Pants Alteration', 'duration_minutes' => 20, 'price' => 180],
                    ['service_name' => 'Wedding Suit Consultation', 'duration_minutes' => 60, 'price' => 1200],
                    ['service_name' => 'Suit Pickup', 'duration_minutes' => 15, 'price' => 0],
                ] as $svc
            ) {
                AppointmentService::firstOrCreate(['service_name' => $svc['service_name']], $svc);
            }

            $measurementFields = [
                'Suit' => [
                    'chest',
                    'waist',
                    'shoulderWidth',
                    'sleeveLength',
                    'neck',
                    'bicep',
                    'wrist',
                    'armhole',
                    'frontLength',
                    'jacketLength',
                    'lapelWidth',
                ],
                'Shirt' => [
                    'chest',
                    'waist',
                    'shoulderWidth',
                    'sleeveLength',
                    'neck',
                    'bicep',
                    'wrist',
                    'shirtLength',
                ],
                'Pants' => [
                    'waist',
                    'hip',
                    'inseam',
                    'outseam',
                    'thigh',
                    'knee',
                    'legOpening',
                    'rise',
                ],
            ];

            foreach ($measurementFields as $garment => $fields) {
                foreach ($fields as $fieldName) {
                    MeasurementField::firstOrCreate(
                        ['field_name' => $fieldName, 'garment_type' => $garment],
                        ['unit' => 'inch'],
                    );
                }
            }

            for ($i = 1; $i <= 10; $i++) {
                $customer = Customer::create([
                    'customer_code' => 'C' . str_pad((string)$i, 3, '0', STR_PAD_LEFT),
                    'name' => $faker->name(),
                    'phone' => $faker->numerify('##########'),
                    'email' => $faker->unique()->safeEmail(),
                    'address' => $faker->address(),
                    'birthday' => $faker->dateTimeBetween('-60 years', '-18 years')->format('Y-m-d'),
                    'vip_status' => $faker->boolean(20),
                ]);

                CustomerPreference::create([
                    'customer_id' => $customer->id,
                    'fit_preference' => $faker->randomElement(['Slim Fit', 'Regular Fit', 'Classic Fit', 'Modern Fit']),
                    'favorite_colors' => $faker->randomElement(['Navy, Charcoal', 'Black', 'Blue, Grey', 'White, Beige']),
                    'notes' => $faker->boolean(50) ? $faker->sentence() : null,
                ]);

                CustomerLoyalty::create([
                    'customer_id' => $customer->id,
                    'points' => $faker->numberBetween(0, 500),
                    'total_spent' => $faker->randomFloat(2, 0, 5000),
                    'last_visit' => $faker->dateTimeBetween('-30 days', 'now')->format('Y-m-d'),
                ]);

                BodyProfile::create([
                    'customer_id' => $customer->id,
                    'height' => $faker->randomElement(["5'4\"", "5'6\"", "5'8\"", "5'10\"", "6'0\""]),
                    'weight' => $faker->randomElement(['120 lbs', '140 lbs', '160 lbs', '180 lbs']),
                    'body_type' => $faker->randomElement(['Athletic', 'Average', 'Slim', 'Normal']),
                    'posture' => $faker->randomElement(['Normal', 'Forward', 'Swayback']),
                ]);

                foreach (['front_body', 'side_body', 'shoulder', 'back'] as $type) {
                    if (!$faker->boolean(40)) continue;
                    CustomerBodyImage::create([
                        'customer_id' => $customer->id,
                        'image_type' => $type,
                        'image_path' => '/uploads/customers/' . $customer->id . '/' . $type . '.jpg',
                        'notes' => null,
                    ]);
                }
            }

            $customers = Customer::all();
            $serviceNames = AppointmentService::query()->pluck('service_name')->all();

            foreach ($customers->take(8) as $customer) {
                Appointment::create([
                    'customer_id' => $customer->id,
                    'service_type' => $faker->randomElement($serviceNames),
                    'appointment_date' => $faker->dateTimeBetween('-3 days', '+7 days')->format('Y-m-d'),
                    'appointment_time' => $faker->dateTimeBetween('09:00', '18:00')->format('H:i:s'),
                    'duration_minutes' => $faker->randomElement([15, 20, 30, 45, 60]),
                    'priority' => $faker->randomElement(['low', 'normal', 'high']),
                    'status' => $faker->randomElement(['pending', 'confirmed', 'completed', 'cancelled']),
                    'notes' => $faker->boolean(60) ? $faker->sentence() : null,
                ]);
            }

            $fieldMap = MeasurementField::all()->groupBy('garment_type');
            foreach ($customers->take(6) as $customer) {
                foreach (['Suit', 'Shirt', 'Pants'] as $garment) {
                    if (!$faker->boolean(70)) continue;
                    $measurement = Measurement::create([
                        'customer_id' => $customer->id,
                        'garment_type' => $garment,
                        'taken_by' => $staff->random()->id,
                        'notes' => $faker->boolean(50) ? $faker->sentence() : null,
                    ]);

                    foreach (($fieldMap[$garment] ?? collect()) as $field) {
                        MeasurementValue::create([
                            'measurement_id' => $measurement->id,
                            'field_id' => $field->id,
                            'value' => $faker->randomFloat(2, 10, 50),
                        ]);
                    }
                }
            }

            foreach ($customers->take(6) as $customer) {
                $order = Order::create([
                    'order_number' => 'ORD-' . str_pad((string)$customer->id, 3, '0', STR_PAD_LEFT),
                    'customer_id' => $customer->id,
                    'order_type' => $faker->randomElement(['Custom Suit', 'Wedding Suit Package', 'Dress Shirt', 'Pants Alteration']),
                    'fabric' => $faker->randomElement(['Italian Wool - Navy Blue', 'Egyptian Cotton - White', 'Wool Blend - Gray', 'Premium Cashmere - Black']),
                    'trial_date' => $faker->dateTimeBetween('now', '+10 days')->format('Y-m-d'),
                    'delivery_date' => $faker->dateTimeBetween('+5 days', '+30 days')->format('Y-m-d'),
                    'notes' => $faker->boolean(50) ? $faker->sentence() : null,
                    'status' => $faker->randomElement(['pending', 'in_progress', 'trial', 'completed', 'delivered']),
                ]);

                OrderStatusHistory::create([
                    'order_id' => $order->id,
                    'status' => $order->status,
                    'notes' => null,
                ]);

                $items = $faker->numberBetween(1, 3);
                $orderTotal = 0.0;
                for ($k = 0; $k < $items; $k++) {
                    $qty = $faker->numberBetween(1, 2);
                    $price = $faker->randomFloat(2, 50, 700);
                    $orderTotal += $qty * $price;
                    OrderItem::create([
                        'order_id' => $order->id,
                        'garment_type' => $faker->randomElement(['Suit', 'Shirt', 'Pants']),
                        'measurement_id' => Measurement::query()->where('customer_id', $customer->id)->value('id'),
                        'quantity' => $qty,
                        'price' => $price,
                    ]);
                }

                $invoice = Invoice::create([
                    'invoice_number' => 'INV-' . str_pad((string)$order->id, 3, '0', STR_PAD_LEFT),
                    'customer_id' => $customer->id,
                    'order_id' => $order->id,
                    'invoice_date' => $faker->dateTimeBetween('-10 days', 'now')->format('Y-m-d'),
                    'total_amount' => $orderTotal,
                    'discount' => 0,
                    'tax' => 0,
                    'grand_total' => $orderTotal,
                    'status' => $faker->randomElement(['paid', 'pending', 'overdue']),
                ]);

                foreach ($order->items as $item) {
                    $lineTotal = $item->quantity * (float)$item->price;
                    InvoiceItem::create([
                        'invoice_id' => $invoice->id,
                        'description' => $item->garment_type ?? 'Item',
                        'quantity' => $item->quantity,
                        'price' => $item->price,
                        'total' => $lineTotal,
                    ]);
                }

                if ($invoice->status === 'paid') {
                    Payment::create([
                        'invoice_id' => $invoice->id,
                        'amount' => $invoice->grand_total,
                        'payment_method' => $faker->randomElement(['Cash', 'UPI', 'Card', 'Bank Transfer']),
                        'paid_at' => Carbon::now(),
                    ]);
                }
            }
        });
    }
}
