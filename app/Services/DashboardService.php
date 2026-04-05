<?php

namespace App\Services;

use App\Models\Appointment;
use App\Models\Customer;
use App\Models\Invoice;
use App\Models\Order;
use App\Models\Payment;
use App\Models\User;
use Illuminate\Support\Carbon;

class DashboardService
{
    public function get(User $user): array
    {
        $today = Carbon::today();
        $monthStart = Carbon::now()->startOfMonth();
        $monthEnd = Carbon::now()->endOfMonth();

        $role = (string)($user->role ?? 'Staff');
        $isAdmin = strcasecmp($role, 'Admin') === 0;

        $todaysAppointments = Appointment::with('customer')
            ->whereDate('appointment_date', $today->toDateString())
            ->orderBy('appointment_time')
            ->limit(10)
            ->get();

        $activeOrdersCount = Order::whereIn('status', ['pending', 'in_progress', 'trial'])->count();
        $pendingPaymentsCount = Invoice::whereIn('status', ['pending', 'overdue'])->count();

        $data = [
            'role' => $role,
            'todays_appointments' => $todaysAppointments,
            'stats' => [
                'total_customers' => Customer::count(),
                'total_orders' => Order::count(),
                'pending_orders' => $activeOrdersCount,
                'completed_orders' => Order::whereIn('status', ['completed', 'delivered'])->count(),
                'pending_payments' => $pendingPaymentsCount,
            ],
            'recent_orders' => Order::with('customer')->orderByDesc('id')->limit(5)->get(),
            'order_status' => [
                'pending' => Order::where('status', 'pending')->count(),
                'in_progress' => Order::where('status', 'in_progress')->count(),
                'trial' => Order::where('status', 'trial')->count(),
                'completed' => Order::where('status', 'completed')->count(),
                'delivered' => Order::where('status', 'delivered')->count(),
            ],
        ];

        if ($isAdmin) {
            $revenueThisMonth = (float)Invoice::where('status', 'paid')
                ->whereBetween('invoice_date', [$monthStart->toDateString(), $monthEnd->toDateString()])
                ->sum('grand_total');

            $pendingRevenue = (float)Invoice::whereIn('status', ['pending', 'overdue'])->sum('grand_total');

            $revenueToday = (float)Payment::whereDate('paid_at', $today->toDateString())->sum('amount');

            $data['stats']['revenue_this_month'] = $revenueThisMonth;
            $data['stats']['pending_revenue'] = $pendingRevenue;
            $data['stats']['revenue_today'] = $revenueToday;

            $monthly = [];
            for ($i = 5; $i >= 0; $i--) {
                $start = Carbon::now()->startOfMonth()->subMonths($i);
                $end = (clone $start)->endOfMonth();
                $monthly[] = [
                    'month' => $start->format('M'),
                    'revenue' => (float)Invoice::where('status', 'paid')
                        ->whereBetween('invoice_date', [$start->toDateString(), $end->toDateString()])
                        ->sum('grand_total'),
                ];
            }
            $data['monthly_revenue'] = $monthly;
        }

        return $data;
    }
}
