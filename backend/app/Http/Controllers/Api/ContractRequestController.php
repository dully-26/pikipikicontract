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
    public function index(Request $request)
    {
        $query = ContractRequest::with([
            'user',
            'motorcycle',
            'contract'
        ]);

        if ($request->user()->role === 'user') {
            $query->where('user_id', $request->user()->id);
        }

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        return response()->json(
            $query->latest()->get()
        );
    }

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
     * 1. If a new photo is uploaded, upload it to Cloudinary.
     * 2. If no new photo is uploaded, use the user's existing profile photo.
     * 3. If neither exists, reject the request.
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'motorcycle_id' => 'required|exists:motorcycles,id',
            'notes' => 'nullable|string|max:500',
            'applicant_photo' => 'nullable|file|image|max:5120',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'errors' => $validator->errors()
            ], 422);
        }

        $motorcycle = Motorcycle::findOrFail(
            $request->motorcycle_id
        );

        if ($motorcycle->listing_type !== 'contract') {
            return response()->json([
                'message' => 'This motorcycle is not available for contract'
            ], 422);
        }

        if ($motorcycle->status !== 'available') {
            return response()->json([
                'message' => 'Motorcycle is not available'
            ], 422);
        }

        /*
        |--------------------------------------------------------------------------
        | Check for existing pending request
        |--------------------------------------------------------------------------
        */

        $existing = ContractRequest::where(
                'user_id',
                $request->user()->id
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
                'message' => 'You already have a pending request for this motorcycle'
            ], 422);
        }

        /*
        |--------------------------------------------------------------------------
        | Applicant Photo
        |--------------------------------------------------------------------------
        |
        | NEW:
        | Uploaded applicant photos are stored on Cloudinary instead of
        | Laravel's local storage.
        |
        */

        $photoUrl = null;

        if ($request->hasFile('applicant_photo')) {

            try {

                $uploadedFile = cloudinary()->upload(
                    $request->file('applicant_photo')->getRealPath(),
                    [
                        'folder' => 'mtema-project/applicant_photos',
                    ]
                );

                $photoUrl = $uploadedFile->getSecurePath();

            } catch (\Throwable $e) {

                return response()->json([
                    'message' => 'Imeshindwa kupakia picha kwenye Cloudinary.',
                    'error' => config('app.debug')
                        ? $e->getMessage()
                        : null,
                ], 500);
            }

        } elseif ($request->user()->profile_photo) {

            /*
            |--------------------------------------------------------------------------
            | Existing profile photo
            |--------------------------------------------------------------------------
            |
            | If profile_photo is already a complete Cloudinary URL,
            | use it directly.
            |
            */

            $photoUrl = $request->user()->profile_photo;

        } else {

            return response()->json([
                'message' =>
                    'Tafadhali pakia picha yako (au weka picha ya profaili kwanza) kabla ya kuwasilisha ombi'
            ], 422);
        }

        /*
        |--------------------------------------------------------------------------
        | Create Contract Request
        |--------------------------------------------------------------------------
        */

        $reqModel = ContractRequest::create([
            'user_id' => $request->user()->id,
            'motorcycle_id' => $request->motorcycle_id,
            'notes' => $request->notes,
            'applicant_photo' => $photoUrl,
            'status' => 'pending',
        ]);

        /*
        |--------------------------------------------------------------------------
        | Audit Log
        |--------------------------------------------------------------------------
        */

        AuditLogger::log(
            $request->user()->id,
            'submitted_contract_request',
            'ContractRequest',
            $reqModel->id,
            "Requested {$motorcycle->brand} {$motorcycle->model}"
        );

        /*
        |--------------------------------------------------------------------------
        | Return Request
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
     * Manager/Admin approves or rejects a pending contract request.
     */
    public function updateStatus(Request $request, $id)
    {
        $request->validate([
            'status' => 'required|in:approved,rejected'
        ]);

        $cr = ContractRequest::with([
            'motorcycle',
            'user'
        ])->findOrFail($id);

        if ($cr->status !== 'pending') {
            return response()->json([
                'message' => 'This request has already been reviewed'
            ], 422);
        }

        $cr->update([
            'status' => $request->status,
            'reviewed_by' => $request->user()->id,
        ]);

        /*
        |--------------------------------------------------------------------------
        | Motorcycle Status
        |--------------------------------------------------------------------------
        */

        if ($request->status === 'approved') {
            $cr->motorcycle->update([
                'status' => 'rented'
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
            'Contract Request ' . ucfirst($request->status),
            "Your request for {$cr->motorcycle->brand} {$cr->motorcycle->model} was {$request->status}.",
            'contract'
        );

        return response()->json(
            $cr->fresh([
                'user',
                'motorcycle',
                'contract'
            ])
        );
    }
}

