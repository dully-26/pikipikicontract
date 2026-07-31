<?php

use App\Http\Controllers\Api\{
    AuthController,
    MotorcycleController,
    ContractRequestController,
    ContractController,
    PaymentController,
    SaleController,
    DashboardController,
    UserController,
    PdfController,
    ReportController,
    NotificationController,
    AuditLogController,
    PasswordResetController,
    UserDashboardController
};

use App\Http\Controllers\Api\ProfileController;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Route;


/*
|--------------------------------------------------------------------------
| PUBLIC ROUTES
|--------------------------------------------------------------------------
*/


/*
|--------------------------------------------------------------------------
| Database Connection Test
|--------------------------------------------------------------------------
|
| TEMPORARY ROUTE
|
| Used to test whether Laravel can connect to TiDB Cloud from Render.
| Remove this route after confirming the database connection works.
|
*/

Route::get('/db-test', function () {

    try {

        DB::connection()->getPdo();

        return response()->json([
            'success' => true,
            'message' => 'Database connection successful.',
            'database' => DB::connection()->getDatabaseName(),
            'driver' => DB::connection()->getDriverName(),
        ]);

    } catch (\Throwable $e) {

        return response()->json([
            'success' => false,
            'message' => 'Database connection failed.',
            'error' => $e->getMessage(),
        ], 500);
    }
});


/*
|--------------------------------------------------------------------------
| Authentication
|--------------------------------------------------------------------------
*/

Route::post('/register', [
    AuthController::class,
    'register'
]);

Route::post('/login', [
    AuthController::class,
    'login'
]);

Route::post('/forgot-password', [
    PasswordResetController::class,
    'sendResetLink'
]);

Route::post('/reset-password', [
    PasswordResetController::class,
    'reset'
]);


/*
|--------------------------------------------------------------------------
| Flutterwave Webhook
|--------------------------------------------------------------------------
*/

Route::post('/webhooks/flutterwave', [
    PaymentController::class,
    'webhook'
]);


/*
|--------------------------------------------------------------------------
| AUTHENTICATED ROUTES
|--------------------------------------------------------------------------
*/

Route::middleware('auth:sanctum')->group(function () {


    /*
    |--------------------------------------------------------------------------
    | Authentication
    |--------------------------------------------------------------------------
    */

    Route::post('/logout', [
        AuthController::class,
        'logout'
    ]);

    Route::get('/me', [
        AuthController::class,
        'me'
    ]);


    /*
    |--------------------------------------------------------------------------
    | Motorcycles - Browsing
    |--------------------------------------------------------------------------
    */

    Route::get('/motorcycles', [
        MotorcycleController::class,
        'index'
    ]);

    Route::get('/motorcycles/{id}', [
        MotorcycleController::class,
        'show'
    ]);

    Route::post('/motorcycles/sell', [
        MotorcycleController::class,
        'sell'
    ]);


    /*
    |--------------------------------------------------------------------------
    | Marketplace
    |--------------------------------------------------------------------------
    */

    Route::get('/marketplace', [
        SaleController::class,
        'index'
    ]);

    Route::post('/marketplace/purchase-requests', [
        SaleController::class,
        'store'
    ]);

    Route::get('/marketplace/requests', [
        SaleController::class,
        'indexRequests'
    ]);

    Route::patch('/marketplace/requests/{id}/status', [
        SaleController::class,
        'updateStatus'
    ]);


    /*
    |--------------------------------------------------------------------------
    | Contract Requests
    |--------------------------------------------------------------------------
    */

    Route::get('/contract-requests', [
        ContractRequestController::class,
        'index'
    ]);

    Route::get('/contract-requests/{id}', [
        ContractRequestController::class,
        'show'
    ]);

    Route::post('/contract-requests', [
        ContractRequestController::class,
        'store'
    ]);


    /*
    |--------------------------------------------------------------------------
    | Contracts
    |--------------------------------------------------------------------------
    */

    Route::get('/contracts', [
        ContractController::class,
        'index'
    ]);

    Route::get('/contracts/{id}', [
        ContractController::class,
        'show'
    ]);

    Route::get('/contracts/{id}/pdf', [
        PdfController::class,
        'contract'
    ]);

    Route::post('/contracts/{id}/accept', [
        ContractController::class,
        'accept'
    ]);

    Route::post('/contracts/{id}/reject', [
        ContractController::class,
        'reject'
    ]);


    /*
    |--------------------------------------------------------------------------
    | Profile
    |--------------------------------------------------------------------------
    */

    Route::post('/profile/photo', [
        ProfileController::class,
        'updatePhoto'
    ]);

    Route::put('/profile', [
        ProfileController::class,
        'updateInfo'
    ]);


    /*
    |--------------------------------------------------------------------------
    | Payments
    |--------------------------------------------------------------------------
    */

    Route::get('/payments', [
        PaymentController::class,
        'index'
    ]);

    Route::post('/payments/initiate', [
        PaymentController::class,
        'initiate'
    ]);

    Route::post('/payments/verify', [
        PaymentController::class,
        'verify'
    ]);

    Route::get('/payments/{id}/receipt', [
        PdfController::class,
        'receipt'
    ]);


    /*
    |--------------------------------------------------------------------------
    | Notifications
    |--------------------------------------------------------------------------
    */

    Route::get('/notifications', [
        NotificationController::class,
        'index'
    ]);

    Route::get('/notifications/unread-count', [
        NotificationController::class,
        'unreadCount'
    ]);

    Route::patch('/notifications/{id}/read', [
        NotificationController::class,
        'markRead'
    ]);

    Route::patch('/notifications/mark-all-read', [
        NotificationController::class,
        'markAllRead'
    ]);


    /*
    |--------------------------------------------------------------------------
    | User Dashboard
    |--------------------------------------------------------------------------
    */

    Route::get('/user/dashboard-stats', [
        UserDashboardController::class,
        'stats'
    ]);


    /*
    |--------------------------------------------------------------------------
    | MANAGER + ADMIN
    |--------------------------------------------------------------------------
    */

    Route::middleware('role:manager,admin')->group(function () {


        /*
        |--------------------------------------------------------------------------
        | Motorcycle Management
        |--------------------------------------------------------------------------
        */

        Route::post('/motorcycles', [
            MotorcycleController::class,
            'store'
        ]);

        Route::put('/motorcycles/{id}', [
            MotorcycleController::class,
            'update'
        ]);

        Route::patch('/motorcycles/{id}/status', [
            MotorcycleController::class,
            'updateStatus'
        ]);

        Route::delete('/motorcycles/{id}', [
            MotorcycleController::class,
            'destroy'
        ]);


        /*
        |--------------------------------------------------------------------------
        | Marketplace Request Management
        |--------------------------------------------------------------------------
        */

        Route::get('/manager/marketplace/requests', [
            SaleController::class,
            'indexRequests'
        ]);

        Route::patch('/manager/marketplace/requests/{id}/status', [
            SaleController::class,
            'updateStatus'
        ]);


        /*
        |--------------------------------------------------------------------------
        | Contract Request Approvals
        |--------------------------------------------------------------------------
        */

        Route::patch('/contract-requests/{id}/status', [
            ContractRequestController::class,
            'updateStatus'
        ]);


        /*
        |--------------------------------------------------------------------------
        | Contract Management
        |--------------------------------------------------------------------------
        */

        Route::post('/contracts', [
            ContractController::class,
            'store'
        ]);

        Route::put('/contracts/{id}', [
            ContractController::class,
            'update'
        ]);

        Route::patch('/contracts/{id}/terminate', [
            ContractController::class,
            'terminate'
        ]);


        /*
        |--------------------------------------------------------------------------
        | Cash Payments
        |--------------------------------------------------------------------------
        */

        Route::post('/payments/cash', [
            PaymentController::class,
            'storeCash'
        ]);


        /*
        |--------------------------------------------------------------------------
        | Dashboard
        |--------------------------------------------------------------------------
        */

        Route::get('/dashboard/overview', [
            DashboardController::class,
            'overview'
        ]);

        Route::get('/dashboard/stats', [
            DashboardController::class,
            'stats'
        ]);

        Route::get('/dashboard/revenue-trend', [
            DashboardController::class,
            'revenueTrend'
        ]);

        Route::get('/dashboard/motorcycle-distribution', [
            DashboardController::class,
            'motorcycleDistribution'
        ]);

        Route::get('/dashboard/contract-status', [
            DashboardController::class,
            'contractStatusBreakdown'
        ]);


        /*
        |--------------------------------------------------------------------------
        | Reports
        |--------------------------------------------------------------------------
        */

        Route::get('/reports/payments', [
            ReportController::class,
            'payments'
        ]);

        Route::get('/reports/contracts', [
            ReportController::class,
            'contracts'
        ]);

        Route::get('/reports/sales', [
            ReportController::class,
            'sales'
        ]);

        Route::get('/reports/overdue', [
            ReportController::class,
            'overdue'
        ]);

        Route::get('/reports/payments/export', [
            ReportController::class,
            'exportPaymentsPdf'
        ]);
    });


    /*
    |--------------------------------------------------------------------------
    | ADMIN ONLY
    |--------------------------------------------------------------------------
    */

    Route::middleware('role:admin')->group(function () {


        /*
        |--------------------------------------------------------------------------
        | Users
        |--------------------------------------------------------------------------
        */

        Route::get('/users', [
            UserController::class,
            'index'
        ]);

        Route::get('/users/{id}', [
            UserController::class,
            'show'
        ]);

        Route::post('/managers', [
            UserController::class,
            'storeManager'
        ]);

        Route::put('/users/{id}', [
            UserController::class,
            'update'
        ]);

        Route::patch('/users/{id}/toggle-active', [
            UserController::class,
            'toggleActive'
        ]);

        Route::post('/users/{id}/reset-password', [
            UserController::class,
            'resetPassword'
        ]);

        Route::delete('/users/{id}', [
            UserController::class,
            'destroy'
        ]);


        /*
        |--------------------------------------------------------------------------
        | Audit Logs
        |--------------------------------------------------------------------------
        */

        Route::get('/audit-logs', [
            AuditLogController::class,
            'index'
        ]);
    });

});

