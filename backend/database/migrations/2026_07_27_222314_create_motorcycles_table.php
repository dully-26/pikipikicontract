<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('motorcycles', function (Blueprint $table) {
            $table->id();
            $table->string('brand');
            $table->string('model');
            $table->year('year');
            $table->string('plate_number')->unique()->nullable();
            $table->text('description')->nullable();
            $table->decimal('daily_price', 10, 2)->default(0);
            $table->decimal('monthly_price', 10, 2)->default(0);
            $table->decimal('total_contract_price', 10, 2)->default(0);
            $table->decimal('sale_price', 10, 2)->nullable();
            $table->enum('condition', ['new', 'used'])->default('used');
            $table->enum('status', ['available', 'rented', 'sold', 'maintenance'])->default('available');
            $table->enum('listing_type', ['contract', 'sale'])->default('contract');
            $table->json('photos')->nullable();
            $table->foreignId('owner_id')->nullable()->constrained('users')->nullOnDelete(); // for marketplace sellers
            $table->foreignId('added_by')->nullable()->constrained('users')->nullOnDelete(); // manager
            $table->timestamps();
        });
    }
    public function down(): void {
        Schema::dropIfExists('motorcycles');
    }
};