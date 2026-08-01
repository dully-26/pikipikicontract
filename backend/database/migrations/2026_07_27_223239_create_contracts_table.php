<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('contracts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('motorcycle_id')->constrained()->cascadeOnDelete();
            $table->foreignId('contract_request_id')->nullable()->constrained()->nullOnDelete();
            $table->date('start_date');
            $table->date('end_date')->nullable();
            $table->decimal('total_amount', 10, 2);
            $table->decimal('paid_amount', 10, 2)->default(0);
            $table->decimal('balance', 10, 2);
            $table->enum('status', ['active', 'completed', 'terminated'])->default('active');
            $table->timestamps();
        });

        Schema::create('witnesses', function (Blueprint $table) {
            $table->id();
            $table->foreignId('contract_id')->constrained()->cascadeOnDelete();
            $table->string('full_name');
            $table->string('nida_number');
            $table->string('phone');
            $table->string('address');
            $table->timestamps();
        });

        Schema::create('guarantors', function (Blueprint $table) {
            $table->id();
            $table->foreignId('contract_id')->constrained()->cascadeOnDelete();
            $table->string('full_name');
            $table->string('phone');
            $table->string('address');
            $table->string('nida_number');
            $table->timestamps();
        });
    }
    public function down(): void {
        Schema::dropIfExists('guarantors');
        Schema::dropIfExists('witnesses');
        Schema::dropIfExists('contracts');
    }
};