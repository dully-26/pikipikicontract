<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ContractRequest;
use App\Models\Motorcycle;
use App\Services\NotificationService;
use App\Services\AuditLogger;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use CloudinaryLabs\CloudinaryLaravel\Facades\Cloudinary;

class ContractRequestController extends Controller
{
    /**
     * Get contract requests.
     */
    public function index(Request $request)
    {
        $query = ContractRequest::with([
            'user',
            'motorcycle',
            'contract'
        ]);

        if ($request->user()->role === 'user') {
            $query->where(
                'user_id',
                $request->user()->id
            );
        }

        if ($request->has('status')) {
            $query->where(
                'status',
                $request->status
            );
        }

        return response()->json(
            $query->latest()->get()
        );
    }

    /**
     * Show one contract request.
     */
    public function show($id)
    {
        return response()->json(
            ContractRequest::with([
                'user',
                'motorcycle',
                'contract'
            ])->findOrFail($id)
        );
    }

    /**
     * Submit contract request.
     */
    public function store(Request $request)
    {
        $validator = Validator::make(
            $request->all(),
            [
                'motorcycle_id' =>
                    'required|exists:motorcycles,id',

                'notes' =>
                    'nullable|string|max:500',

                'applicant_photo' =>
                    'nullable|file|image|mimes:jpg,jpeg,png,webp|max:5120',
            ]
        );

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Taarifa ulizoingiza si sahihi.',
                'errors' => $validator->errors(),
            ], 422);
        }

        $user = $request->user();

        $motorcycle = Motorcycle::findOrFail(
            $request->motorcycle_id
        );

        /*
        |--------------------------------------------------------------------------
        | Motorcycle validation
        |--------------------------------------------------------------------------
        */

        if ($motorcycle->listing_type !== 'contract') {
            return response()->json([
                'message' =>
                    'This motorcycle is not available for contract.'
            ], 422);
        }

        if ($motorcycle->status !== 'available') {
            return response()->json([
                'message' =>
                    'Motorcycle is not available.'
            ], 422);
        }

        /*
        |--------------------------------------------------------------------------
        | Check duplicate pending request
        |--------------------------------------------------------------------------
        */

        $existing = ContractRequest::where(
            'user_id',
            $user->id
        )
            ->where(
                'motorcycle_id',
                $motorcycle->id
            )
            ->where(
                'status',
                'pending'
            )
            ->first();

        if ($existing) {
            return response()->json([
                'message' =>
                    'You already have a pending request for this motorcycle.'
            ], 422);
        }

        /*
        |--------------------------------------------------------------------------
        | Applicant Photo
        |--------------------------------------------------------------------------
        |
        | Priority:
        |
        | 1. New photo selected in request
        | 2. Existing profile photo
        | 3. Reject request
        |
        */

        $photoUrl = null;

        /*
        |--------------------------------------------------------------------------
        | NEW PHOTO
        |--------------------------------------------------------------------------
        */

        if ($request->hasFile('applicant_photo')) {

            try {

                $uploadedFile =
                    Cloudinary::uploadApi()->upload(
                        $request
                            ->file('applicant_photo')
                            ->getRealPath(),
                        [
                            'folder' =>
                                'mtema-project/applicant_photos',

                            'resource_type' =>
                                'image',
                        ]
                    );

                /*
                |----------------------------------------------------------------------
                | Cloudinary returns an array.
                |----------------------------------------------------------------------
                */

                $photoUrl =
                    $uploadedFile['secure_url']
                    ?? null;

                if (!$photoUrl) {
                    throw new \Exception(
                        'Cloudinary haikurudisha secure_url.'
                    );
                }

            } catch (\Throwable $e) {

                \Log::error(
                    'Contract applicant photo upload failed',
                    [
                        'user_id' =>
                            $user->id,

                        'motorcycle_id' =>
                            $motorcycle->id,

                        'error' =>
                            $e->getMessage(),
                    ]
                );

                return response()->json([
                    'message' =>
                        'Imeshindwa kupakia picha kwenye Cloudinary.',

                    'error' =>
                        config('app.debug')
                            ? $e->getMessage()
                            : null,
                ], 500);
            }

        }

        /*
        |--------------------------------------------------------------------------
        | USE PROFILE PHOTO
        |--------------------------------------------------------------------------
        */

        elseif (
            !empty($user->profile_photo)
        ) {

            $photoUrl =
                $user->profile_photo;

        }

        /*
        |--------------------------------------------------------------------------
        | NO PHOTO
        |--------------------------------------------------------------------------
        */

        else {

            return response()->json([
                'message' =>
                    'Tafadhali pakia picha yako au weka picha ya profaili kwanza.'
            ], 422);
        }

        /*
        |--------------------------------------------------------------------------
        | Create Contract Request
        |--------------------------------------------------------------------------
        */

        $contractRequest =
            ContractRequest::create([
                'user_id' =>
                    $user->id,

                'motorcycle_id' =>
                    $motorcycle->id,

                'notes' =>
                    $request->notes,

                'applicant_photo' =>
                    $photoUrl,

                'status' =>
                    'pending',
            ]);

        /*
        |--------------------------------------------------------------------------
        | Audit Log
        |--------------------------------------------------------------------------
        */

        AuditLogger::log(
            $user->id,
            'submitted_contract_request',
            'ContractRequest',
            $contractRequest->id,
            "Requested {$motorcycle->brand} {$motorcycle->model}"
        );

        /*
        |--------------------------------------------------------------------------
        | Response
        |--------------------------------------------------------------------------
        */

        return response()->json(
            $contractRequest->load([
                'user',
                'motorcycle',
                'contract'
            ]),
            201
        );
    }

    /**
     * Approve or reject contract request.
     */
    public function updateStatus(
        Request $request,
        $id
    ) {
        $request->validate([
            'status' =>
                'required|in:approved,rejected'
        ]);

        $contractRequest =
            ContractRequest::with([
                'motorcycle',
                'user'
            ])->findOrFail($id);

        if (
            $contractRequest->status !==
            'pending'
        ) {
            return response()->json([
                'message' =>
                    'This request has already been reviewed.'
            ], 422);
        }

        /*
        |--------------------------------------------------------------------------
        | Update request
        |--------------------------------------------------------------------------
        */

        $contractRequest->update([
            'status' =>
                $request->status,

            'reviewed_by' =>
                $request->user()->id,
        ]);

        /*
        |--------------------------------------------------------------------------
        | Motorcycle status
        |--------------------------------------------------------------------------
        */

        if (
            $request->status ===
            'approved'
        ) {

            $contractRequest
                ->motorcycle
                ->update([
                    'status' =>
                        'rented'
                ]);
        }

        /*
        |--------------------------------------------------------------------------
        | Audit
        |--------------------------------------------------------------------------
        */

        AuditLogger::log(
            $request->user()->id,
            "contract_request_{$request->status}",
            'ContractRequest',
            $contractRequest->id,
            "{$contractRequest->motorcycle->brand} {$contractRequest->motorcycle->model} request {$request->status}"
        );

        /*
        |--------------------------------------------------------------------------
        | Notification
        |--------------------------------------------------------------------------
        */

        NotificationService::send(
            $contractRequest->user_id,
            'Contract Request ' .
                ucfirst(
                    $request->status
                ),
            "Your request for {$contractRequest->motorcycle->brand} {$contractRequest->motorcycle->model} was {$request->status}.",
            'contract'
        );

        /*
        |--------------------------------------------------------------------------
        | Return updated request
        |--------------------------------------------------------------------------
        */

        return response()->json(
            $contractRequest->fresh([
                'user',
                'motorcycle',
                'contract'
            ])
        );
    }
}
