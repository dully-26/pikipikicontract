<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Motorcycle;
use App\Models\Sale;
use App\Services\NotificationService;
use App\Services\AuditLogger;
use Illuminate\Http\Request;

class SaleController extends Controller
{
    /**
     * ============================================================
     * MARKETPLACE
     * ============================================================
     */
    public function index(Request $request)
    {
        $query = Motorcycle::where('listing_type', 'sale')
            ->where('status', 'available')
            ->with('owner:id,full_name,phone,email');

        if ($request->filled('search')) {

            $s = $request->search;

            $query->where(function ($q) use ($s) {

                $q->where('brand', 'like', "%{$s}%")
                    ->orWhere('model', 'like', "%{$s}%");

            });
        }

        return response()->json(
            $query->latest()->paginate(12)
        );
    }


    /**
     * ============================================================
     * USER REQUEST TO BUY MOTORCYCLE
     * ============================================================
     */
    public function store(Request $request)
    {
        $request->validate([
            'motorcycle_id' => 'required|exists:motorcycles,id',
            'offer_price' => 'nullable|numeric|min:0',
        ]);

        $user = $request->user();

        $motorcycle = Motorcycle::findOrFail(
            $request->motorcycle_id
        );

        /*
         * User cannot buy own motorcycle
         */
        if ($motorcycle->owner_id === $user->id) {

            return response()->json([
                'message' => 'You cannot buy your own listing'
            ], 422);
        }

        /*
         * Motorcycle must be available
         */
        if ($motorcycle->status !== 'available') {

            return response()->json([
                'message' => 'Motorcycle no longer available'
            ], 422);
        }

        /*
         * Prevent duplicate pending request
         */
        $existing = Sale::where(
                'motorcycle_id',
                $motorcycle->id
            )
            ->where(
                'buyer_id',
                $user->id
            )
            ->where(
                'status',
                'pending'
            )
            ->first();

        if ($existing) {

            return response()->json([
                'message' =>
                    'You already have a pending request for this motorcycle'
            ], 422);
        }

        /*
         * Create purchase request
         */
        $sale = Sale::create([

            'motorcycle_id' =>
                $motorcycle->id,

            'seller_id' =>
                $motorcycle->owner_id,

            'buyer_id' =>
                $user->id,

            'offer_price' =>
                $request->offer_price ??
                $motorcycle->sale_price,

            'status' =>
                'pending',
        ]);

        /*
         * Audit log
         */
        AuditLogger::log(
            $user->id,
            'submitted_purchase_request',
            'Sale',
            $sale->id,
            "Requested to buy {$motorcycle->brand} {$motorcycle->model}"
        );

        /*
         * Notification to seller
         */
        NotificationService::send(
            $motorcycle->owner_id,
            'New Purchase Request',
            "{$user->full_name} wants to buy your {$motorcycle->brand} {$motorcycle->model}.",
            'sale'
        );

        /*
         * Load relationships
         */
        $sale->load([
            'motorcycle',
            'buyer',
            'seller',
        ]);

        return response()->json(
            $sale,
            201
        );
    }


    /**
     * ============================================================
     * PURCHASE REQUESTS
     * ============================================================
     *
     * Manager:
     * Anaona requests zote pamoja na buyer details.
     *
     * User:
     * Anaona requests zinazomhusu.
     */
    public function indexRequests(Request $request)
    {
        $user = $request->user();

        /*
         * ========================================================
         * MANAGER
         * ========================================================
         */
        if ($user->role === 'manager') {

            $sales = Sale::with([

                'motorcycle',

                /*
                 * BUYER DETAILS
                 *
                 * Hizi ndizo fields zilizopo kwenye User.php yako.
                 */
                'buyer:id,full_name,email,phone,address',

                /*
                 * SELLER DETAILS
                 */
                'seller:id,full_name,email,phone,address',

            ])
            ->latest()
            ->get();

            return response()->json([
                'message' =>
                    'Purchase requests retrieved successfully.',

                'data' =>
                    $sales,
            ]);
        }


        /*
         * ========================================================
         * NORMAL USER
         * ========================================================
         */
        $sales = Sale::with([

            'motorcycle',

            'buyer:id,full_name,email,phone,address',

            'seller:id,full_name,email,phone,address',

        ])
        ->where(function ($query) use ($user) {

            $query->where(
                'seller_id',
                $user->id
            )
            ->orWhere(
                'buyer_id',
                $user->id
            );

        })
        ->latest()
        ->get();

        return response()->json([
            'message' =>
                'Purchase requests retrieved successfully.',

            'data' =>
                $sales,
        ]);
    }


    /**
     * ============================================================
     * UPDATE PURCHASE REQUEST STATUS
     * ============================================================
     */
    public function updateStatus(
        Request $request,
        $id
    ) {

        $request->validate([
            'status' =>
                'required|in:approved,rejected,completed',
        ]);

        $sale = Sale::with([
            'motorcycle',
            'buyer',
            'seller',
        ])->findOrFail($id);

        $user = $request->user();

        /*
         * Seller can manage own request.
         *
         * Manager can manage requests.
         */
        $isOwner =
            $user->id === $sale->seller_id;

        $isManager =
            $user->role === 'manager';

        if (!$isOwner && !$isManager) {

            return response()->json([
                'message' => 'Forbidden'
            ], 403);
        }

        /*
         * Completed sale cannot be changed
         */
        if ($sale->status === 'completed') {

            return response()->json([
                'message' =>
                    'This sale is already completed'
            ], 422);
        }

        /*
         * Update status
         */
        $sale->update([
            'status' =>
                $request->status,
        ]);

        /*
         * Motorcycle becomes sold
         */
        if ($request->status === 'completed') {

            $sale->motorcycle->update([
                'status' => 'sold'
            ]);
        }

        /*
         * Audit
         */
        AuditLogger::log(

            $user->id,

            "sale_{$request->status}",

            'Sale',

            $sale->id,

            "{$sale->motorcycle->brand} {$sale->motorcycle->model} sale {$request->status}"
        );

        /*
         * Notify buyer
         */
        NotificationService::send(

            $sale->buyer_id,

            'Purchase Request ' .
                ucfirst($request->status),

            "Your request for {$sale->motorcycle->brand} {$sale->motorcycle->model} was {$request->status}.",

            'sale'
        );

        /*
         * Reload relationships
         */
        $sale->load([
            'motorcycle',
            'buyer',
            'seller',
        ]);

        return response()->json(
            $sale
        );
    }
}