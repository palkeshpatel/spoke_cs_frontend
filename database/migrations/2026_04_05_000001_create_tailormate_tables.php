<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {

        Schema::create('customers', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->string('customer_code', 20)->unique();
            $table->string('name', 150);
            $table->string('phone', 20)->nullable();
            $table->string('email', 150)->nullable();
            $table->text('address')->nullable();
            $table->date('birthday')->nullable();
            $table->string('profile_image', 255)->nullable();
            $table->boolean('vip_status')->default(false);
            $table->timestamps();
        });

        Schema::create('customer_preferences', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('customer_id');
            $table->string('fit_preference', 100)->nullable();
            $table->string('favorite_colors', 255)->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->foreign('customer_id')->references('id')->on('customers')->onDelete('cascade');
        });

        Schema::create('customer_loyalty', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('customer_id');
            $table->integer('points')->default(0);
            $table->decimal('total_spent', 10, 2)->default(0);
            $table->date('last_visit')->nullable();
            $table->timestamps();

            $table->foreign('customer_id')->references('id')->on('customers')->onDelete('cascade');
        });

        Schema::create('body_profiles', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('customer_id');
            $table->string('height', 20)->nullable();
            $table->string('weight', 20)->nullable();
            $table->string('body_type', 50)->nullable();
            $table->string('posture', 50)->nullable();
            $table->timestamps();

            $table->foreign('customer_id')->references('id')->on('customers')->onDelete('cascade');
        });

        Schema::create('customer_body_images', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('customer_id');
            $table->string('image_type', 50);
            $table->string('image_path', 255);
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->foreign('customer_id')->references('id')->on('customers')->onDelete('cascade');
        });

        Schema::create('appointment_services', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->string('service_name', 150);
            $table->integer('duration_minutes')->default(0);
            $table->decimal('price', 10, 2)->default(0);
            $table->timestamps();
        });

        Schema::create('appointments', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('customer_id');
            $table->string('service_type', 100);
            $table->date('appointment_date');
            $table->time('appointment_time')->nullable();
            $table->integer('duration_minutes')->default(0);
            $table->enum('priority', ['low', 'normal', 'high'])->default('normal');
            $table->enum('status', ['pending', 'confirmed', 'completed', 'cancelled'])->default('pending');
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->foreign('customer_id')->references('id')->on('customers')->onDelete('cascade');
        });

        Schema::create('staff', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->string('name', 150);
            $table->string('email', 150)->unique();
            $table->string('phone', 20)->nullable();
            $table->string('role', 50)->default('Staff');
            $table->timestamps();
        });

        Schema::create('users', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->string('name', 150);
            $table->string('email', 150)->unique();
            $table->string('password', 255);
            $table->string('role', 50)->default('Admin');
            $table->timestamps();
        });

        Schema::create('measurements', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('customer_id');
            $table->string('garment_type', 50);
            $table->unsignedBigInteger('taken_by')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->foreign('customer_id')->references('id')->on('customers')->onDelete('cascade');
            $table->foreign('taken_by')->references('id')->on('staff')->nullOnDelete();
        });

        Schema::create('measurement_fields', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->string('field_name', 100);
            $table->string('garment_type', 50);
            $table->string('unit', 10)->default('inch');
            $table->timestamps();
        });

        Schema::create('measurement_values', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('measurement_id');
            $table->unsignedBigInteger('field_id');
            $table->decimal('value', 10, 2)->nullable();
            $table->timestamps();

            $table->foreign('measurement_id')->references('id')->on('measurements')->onDelete('cascade');
            $table->foreign('field_id')->references('id')->on('measurement_fields')->onDelete('cascade');
        });

        Schema::create('orders', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->string('order_number', 50)->unique();
            $table->unsignedBigInteger('customer_id');
            $table->string('order_type', 100)->nullable();
            $table->string('fabric', 100)->nullable();
            $table->date('trial_date')->nullable();
            $table->date('delivery_date')->nullable();
            $table->text('notes')->nullable();
            $table->enum('status', ['pending', 'in_progress', 'trial', 'completed', 'delivered'])->default('pending');
            $table->timestamps();

            $table->foreign('customer_id')->references('id')->on('customers')->onDelete('cascade');
        });

        Schema::create('order_items', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('order_id');
            $table->string('garment_type', 50)->nullable();
            $table->unsignedBigInteger('measurement_id')->nullable();
            $table->integer('quantity')->default(1);
            $table->decimal('price', 10, 2)->default(0);
            $table->timestamps();

            $table->foreign('order_id')->references('id')->on('orders')->onDelete('cascade');
            $table->foreign('measurement_id')->references('id')->on('measurements')->nullOnDelete();
        });

        Schema::create('order_status_history', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('order_id');
            $table->string('status', 50);
            $table->timestamp('changed_at')->useCurrent();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->foreign('order_id')->references('id')->on('orders')->onDelete('cascade');
        });

        Schema::create('invoices', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->string('invoice_number', 50)->unique();
            $table->unsignedBigInteger('customer_id');
            $table->unsignedBigInteger('order_id')->nullable();
            $table->date('invoice_date')->nullable();
            $table->decimal('total_amount', 10, 2)->default(0);
            $table->decimal('discount', 10, 2)->default(0);
            $table->decimal('tax', 10, 2)->default(0);
            $table->decimal('grand_total', 10, 2)->default(0);
            $table->enum('status', ['paid', 'pending', 'overdue'])->default('pending');
            $table->timestamps();

            $table->foreign('customer_id')->references('id')->on('customers')->onDelete('cascade');
            $table->foreign('order_id')->references('id')->on('orders')->nullOnDelete();
        });

        Schema::create('invoice_items', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('invoice_id');
            $table->string('description', 255);
            $table->integer('quantity')->default(1);
            $table->decimal('price', 10, 2)->default(0);
            $table->decimal('total', 10, 2)->default(0);
            $table->timestamps();

            $table->foreign('invoice_id')->references('id')->on('invoices')->onDelete('cascade');
        });

        Schema::create('payments', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('invoice_id');
            $table->decimal('amount', 10, 2)->default(0);
            $table->string('payment_method', 50)->nullable();
            $table->dateTime('paid_at')->nullable();
            $table->timestamps();

            $table->foreign('invoice_id')->references('id')->on('invoices')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payments');
        Schema::dropIfExists('invoice_items');
        Schema::dropIfExists('invoices');
        Schema::dropIfExists('order_status_history');
        Schema::dropIfExists('order_items');
        Schema::dropIfExists('orders');
        Schema::dropIfExists('measurement_values');
        Schema::dropIfExists('measurement_fields');
        Schema::dropIfExists('measurements');
        Schema::dropIfExists('users');
        Schema::dropIfExists('staff');
        Schema::dropIfExists('appointments');
        Schema::dropIfExists('appointment_services');
        Schema::dropIfExists('customer_body_images');
        Schema::dropIfExists('body_profiles');
        Schema::dropIfExists('customer_loyalty');
        Schema::dropIfExists('customer_preferences');
        Schema::dropIfExists('customers');
    }
};