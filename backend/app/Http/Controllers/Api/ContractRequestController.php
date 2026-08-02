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
     * Display contract requests.
     *
     * Normal users only see their own requests.
     * Managers/Admins can see all requests.
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
     * Show a single contract request.
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
     * Submit a new contract request.
     *
     * Applicant photo:
     *
     * 1. If the user uploads a new photo:
     *    upload it to Cloudinary.
     *
     * 2. If the user does not upload a new photo:
     *    use their existing profile photo.
     *
     * 3. If neither exists:
     *    reject the request.
     */
    public function store(Request $request)
    {
        /*
        |--------------------------------------------------------------------------
        | Validation
        |--------------------------------------------------------------------------
        */

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
                'message' =>
                    'Taarifa ulizoingiza hazijakubaliki.',

                'errors' =>
                    $validator->errors(),
            ], 422);
        }

        /*
        |--------------------------------------------------------------------------
        | User
        |--------------------------------------------------------------------------
        */

        $user = $request->user();

        /*
        |--------------------------------------------------------------------------
        | Motorcycle
        |--------------------------------------------------------------------------
        */

        $motorcycle = Motorcycle::findOrFail(
            $request->motorcycle_id
        );

        /*
        |--------------------------------------------------------------------------
        | Check Listing Type
        |--------------------------------------------------------------------------
        */

        if ($motorcycle->listing_type !== 'contract') {
            return response()->json([
                'message' =>
                    'Pikipiki hii haipatikani kwa mkataba.',
            ], 422);
        }

        /*
        |--------------------------------------------------------------------------
        | Check Motorcycle Availability
        |--------------------------------------------------------------------------
        */

        if ($motorcycle->status !== 'available') {
            return response()->json([
                'message' =>
                    'Pikipiki hii haipatikani kwa sasa.',
            ], 422);
        }

        /*
        |--------------------------------------------------------------------------
        | Check Existing Pending Request
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
                    'Tayari una ombi linalosubiri kwa pikipiki hii.',
            ], 422);
        }

        /*
        |--------------------------------------------------------------------------
        | Applicant Photo
        |--------------------------------------------------------------------------
        */

        $photoUrl = null;

        /*
        |--------------------------------------------------------------------------
        | New Applicant Photo
        |--------------------------------------------------------------------------
        |
        | IMPORTANT:
        |
        | Cloudinary Laravel v3 does NOT use:
        |
        | cloudinary()->upload()
        |
        | It uses:
        |
        | Cloudinary::uploadApi()->upload()
        |
        |--------------------------------------------------------------------------
        */

        if ($request->hasFile('applicant_photo')) {

            try {

                $result = Cloudinary::uploadApi()->upload(
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
                |--------------------------------------------------------------------------
                | Get Secure Cloudinary URL
                |--------------------------------------------------------------------------
                */

                $photoUrl =
                    $result['secure_url'] ?? null;

                if (!$photoUrl) {
                    throw new \Exception(
                        'Cloudinary haikurudisha secure_url.'
                    );
                }

            } catch (\Throwable $e) {

                /*
                |--------------------------------------------------------------------------
                | Log Error
                |--------------------------------------------------------------------------
                */

                \Log::error(
                    'Cloudinary applicant photo upload failed',
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
                        'Imeshindwa kupakia picha yako kwenye Cloudinary.',

                    'error' =>
                        config('app.debug')
                            ? $e->getMessage()
                            : null,
                ], 500);
            }

        }

        /*
        |--------------------------------------------------------------------------
        | Use Existing Profile Photo
        |--------------------------------------------------------------------------
        |
        | If the user did not upload a new photo,
        | use their existing profile photo.
        |
        */

        elseif ($user->profile_photo) {

            $photoUrl =
                $user->profile_photo;
        }

        /*
        |--------------------------------------------------------------------------
        | No Photo
        |--------------------------------------------------------------------------
        */

        else {

            return response()->json([
                'message' =>
                    'Tafadhali pakia picha yako kabla ya kuwasilisha ombi.',
            ], 422);
        }

        /*
        |--------------------------------------------------------------------------
        | Create Contract Request
        |--------------------------------------------------------------------------
        */

        $reqModel = ContractRequest::create([
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
            $reqModel->id,
            "Requested {$motorcycle->brand} {$motorcycle->model}"
        );

        /*
        |--------------------------------------------------------------------------
        | Return Created Request
        |--------------------------------------------------------------------------
        */

        return response()->json(
            $reqModel->load([
                'user',
                'motorcycle',
                'contract'
            ]),
            201
        );
    }

    /**
     * Manager/Admin approves or rejects
     * a pending contract request.
     */
    public function updateStatus(
        Request $request,
        $id
    ) {
        /*
        |--------------------------------------------------------------------------
        | Validation
        |--------------------------------------------------------------------------
        */

        $request->validate([
            'status' =>
                'required|in:approved,rejected',
        ]);

        /*
        |--------------------------------------------------------------------------
        | Contract Request
        |--------------------------------------------------------------------------
        */

        $cr = ContractRequest::with([
            'motorcycle',
            'user'
        ])->findOrFail($id);

        /*
        |--------------------------------------------------------------------------
        | Already Reviewed
        |--------------------------------------------------------------------------
        */

        if ($cr->status !== 'pending') {
            return response()->json([
                'message' =>
                    'Ombi hili tayari limepitiwa.',
            ], 422);
        }

        /*
        |--------------------------------------------------------------------------
        | Update Request Status
        |--------------------------------------------------------------------------
        */

        $cr->update([
            'status' =>
                $request->status,

            'reviewed_by' =>
                $request->user()->id,
        ]);

        /*
        |--------------------------------------------------------------------------
        | Motorcycle Status
        |--------------------------------------------------------------------------
        */

        if ($request->status === 'approved') {

            $cr->motorcycle->update([
                'status' =>
                    'rented',
            ]);
        }

        /*
        |--------------------------------------------------------------------------
        | Audit Log
        |--------------------------------------------------------------------------
        */

        AuditLogger::log(
            $request->user()->id,
            "contract_request_{$request->status}",
            'ContractRequest',
            $cr->id,
            "{$cr->motorcycle->brand} {$cr->motorcycle->model} request {$request->status}"
        );

        /*
        |--------------------------------------------------------------------------
        | Notification
        |--------------------------------------------------------------------------
        */

        NotificationService::send(
            $cr->user_id,

            'Contract Request ' .
                ucfirst(
                    $request->status
                ),

            "Your request for {$cr->motorcycle->brand} {$cr->motorcycle->model} was {$request->status}.",

            'contract'
        );

        /*
        |--------------------------------------------------------------------------
        | Response
        |--------------------------------------------------------------------------
        */

        return response()->json(
            $cr->fresh([
                'user',
                'motorcycle',
                'contract'
            ])
        );
    }
}

