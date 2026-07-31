<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Motorcycle;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use CloudinaryLabs\CloudinaryLaravel\Facades\Cloudinary;

class MotorcycleController extends Controller
{
    /**
     * Display motorcycles.
     */
    public function index(Request $request)
    {
        $query = Motorcycle::query();

        // Filter by status
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        // Filter by listing type
        if ($request->filled('listing_type')) {
            $query->where('listing_type', $request->listing_type);
        }

        // Search by brand or model
        if ($request->filled('search')) {
            $search = $request->search;

            $query->where(function ($q) use ($search) {
                $q->where('brand', 'like', "%{$search}%")
                    ->orWhere('model', 'like', "%{$search}%");
            });
        }

        return response()->json(
            $query->latest()->paginate(12)
        );
    }

    /**
     * Display one motorcycle.
     */
    public function show($id)
    {
        return response()->json(
            Motorcycle::with('owner')->findOrFail($id)
        );
    }

    /**
     * Upload image to Cloudinary.
     *
     * IMPORTANT:
     * Cloudinary::uploadApi()->upload()
     * returns Cloudinary\Api\ApiResponse.
     *
     * Therefore we get secure_url using:
     *
     * $result['secure_url']
     *
     * NOT:
     *
     * $result->getSecurePath()
     */
    private function uploadToCloudinary($file)
    {
        // Make sure a file was received
        if (!$file) {
            throw new \Exception(
                'No image file was received.'
            );
        }

        // Check uploaded file validity
        if (!$file->isValid()) {
            throw new \Exception(
                'Uploaded image is invalid. Upload error code: ' .
                $file->getError()
            );
        }

        // Get temporary file path
        $path = $file->getRealPath();

        if (!$path) {
            throw new \Exception(
                'Laravel could not find the temporary uploaded file.'
            );
        }

        // Make sure temporary file exists
        if (!file_exists($path)) {
            throw new \Exception(
                'Temporary uploaded file does not exist.'
            );
        }

        /*
        |--------------------------------------------------------------------------
        | Upload image to Cloudinary
        |--------------------------------------------------------------------------
        */

        $result = Cloudinary::uploadApi()->upload(
            $path,
            [
                'folder' => 'mtema-project/motorcycles',
                'resource_type' => 'image',
            ]
        );

        /*
        |--------------------------------------------------------------------------
        | Get secure Cloudinary URL
        |--------------------------------------------------------------------------
        */

        $secureUrl = $result['secure_url'] ?? null;

        if (!$secureUrl) {
            throw new \Exception(
                'Cloudinary upload succeeded but secure_url was not returned.'
            );
        }

        return $secureUrl;
    }

    /**
     * Manager/Admin:
     * Add motorcycle for contract or sale.
     */
    public function store(Request $request)
    {
        /*
        |--------------------------------------------------------------------------
        | Validation Rules
        |--------------------------------------------------------------------------
        */

        $rules = [
            'brand' => 'required|string|max:255',

            'model' => 'required|string|max:255',

            'year' => [
                'required',
                'integer',
                'min:1980',
                'max:' . (date('Y') + 1),
            ],

            'condition' => 'required|in:new,used',

            'listing_type' => 'required|in:contract,sale',

            'description' => 'nullable|string',

            /*
            |--------------------------------------------------------------------------
            | React sends photos as:
            | photos[]
            |--------------------------------------------------------------------------
            */

            'photos' => 'nullable|array',

            'photos.*' => [
                'file',
                'image',
                'max:5120',
            ],
        ];

        /*
        |--------------------------------------------------------------------------
        | Contract Validation
        |--------------------------------------------------------------------------
        */

        if ($request->input('listing_type') === 'contract') {

            $rules['daily_price'] =
                'required|numeric|min:0';

            $rules['monthly_price'] =
                'required|numeric|min:0';

            $rules['total_contract_price'] =
                'required|numeric|min:0';
        }

        /*
        |--------------------------------------------------------------------------
        | Sale Validation
        |--------------------------------------------------------------------------
        */

        if ($request->input('listing_type') === 'sale') {

            $rules['sale_price'] =
                'required|numeric|min:0';
        }

        /*
        |--------------------------------------------------------------------------
        | Validate Request
        |--------------------------------------------------------------------------
        */

        $validator = Validator::make(
            $request->all(),
            $rules
        );

        if ($validator->fails()) {

            return response()->json([
                'message' => 'Validation failed.',
                'errors' => $validator->errors(),
            ], 422);
        }

        $validated = $validator->validated();

        /*
        |--------------------------------------------------------------------------
        | Upload Motorcycle Photos
        |--------------------------------------------------------------------------
        */

        $photos = [];

        if ($request->hasFile('photos')) {

            $uploadedFiles = $request->file('photos');

            // Make sure we always have an array
            if (!is_array($uploadedFiles)) {
                $uploadedFiles = [$uploadedFiles];
            }

            foreach ($uploadedFiles as $file) {

                try {

                    $photoUrl =
                        $this->uploadToCloudinary($file);

                    $photos[] =
                        $photoUrl;

                } catch (\Throwable $e) {

                    /*
                    |--------------------------------------------------------------------------
                    | Return detailed error while debugging
                    |--------------------------------------------------------------------------
                    */

                    return response()->json([
                        'message' =>
                            'Imeshindwa kupakia picha ya pikipiki kwenye Cloudinary.',

                        'error' =>
                            $e->getMessage(),

                        'exception' =>
                            get_class($e),

                        'file' =>
                            $file->getClientOriginalName(),

                        'mime_type' =>
                            $file->getMimeType(),

                        'size' =>
                            $file->getSize(),

                    ], 500);
                }
            }
        }

        /*
        |--------------------------------------------------------------------------
        | Create Motorcycle
        |--------------------------------------------------------------------------
        */

        $motorcycle = Motorcycle::create([

            'brand' =>
                $validated['brand'],

            'model' =>
                $validated['model'],

            'year' =>
                $validated['year'],

            'condition' =>
                $validated['condition'],

            'listing_type' =>
                $validated['listing_type'],

            'daily_price' =>
                $validated['daily_price'] ?? 0,

            'monthly_price' =>
                $validated['monthly_price'] ?? 0,

            'total_contract_price' =>
                $validated['total_contract_price'] ?? 0,

            'sale_price' =>
                $validated['sale_price'] ?? null,

            'description' =>
                $validated['description'] ?? null,

            /*
            |--------------------------------------------------------------------------
            | Store Cloudinary URLs in database
            |--------------------------------------------------------------------------
            */

            'photos' =>
                $photos,

            'status' =>
                'available',

            'added_by' =>
                $request->user()->id,

            'owner_id' =>
                $request->user()->id,
        ]);

        return response()->json(
            $motorcycle,
            201
        );
    }

    /**
     * User sells motorcycle.
     */
    public function sell(Request $request)
    {
        /*
        |--------------------------------------------------------------------------
        | Validation
        |--------------------------------------------------------------------------
        */

        $rules = [

            'brand' =>
                'required|string|max:255',

            'model' =>
                'required|string|max:255',

            'year' => [
                'required',
                'integer',
                'min:1980',
                'max:' . (date('Y') + 1),
            ],

            'sale_price' =>
                'required|numeric|min:0',

            'condition' =>
                'required|in:new,used',

            'description' =>
                'nullable|string',

            'latitude' =>
                'nullable|numeric|between:-90,90',

            'longitude' =>
                'nullable|numeric|between:-180,180',

            'location_name' =>
                'nullable|string|max:255',

            'photos' =>
                'nullable|array',

            'photos.*' => [
                'file',
                'image',
                'max:5120',
            ],
        ];

        /*
        |--------------------------------------------------------------------------
        | Validate
        |--------------------------------------------------------------------------
        */

        $validator = Validator::make(
            $request->all(),
            $rules
        );

        if ($validator->fails()) {

            return response()->json([
                'message' => 'Validation failed.',
                'errors' => $validator->errors(),
            ], 422);
        }

        $validated =
            $validator->validated();

        /*
        |--------------------------------------------------------------------------
        | Upload Photos to Cloudinary
        |--------------------------------------------------------------------------
        */

        $photos = [];

        if ($request->hasFile('photos')) {

            $uploadedFiles =
                $request->file('photos');

            // Make sure we always have an array
            if (!is_array($uploadedFiles)) {
                $uploadedFiles =
                    [$uploadedFiles];
            }

            foreach ($uploadedFiles as $file) {

                try {

                    $photoUrl =
                        $this->uploadToCloudinary($file);

                    $photos[] =
                        $photoUrl;

                } catch (\Throwable $e) {

                    return response()->json([
                        'message' =>
                            'Imeshindwa kupakia picha ya pikipiki kwenye Cloudinary.',

                        'error' =>
                            $e->getMessage(),

                        'exception' =>
                            get_class($e),

                        'file' =>
                            $file->getClientOriginalName(),

                        'mime_type' =>
                            $file->getMimeType(),

                        'size' =>
                            $file->getSize(),

                    ], 500);
                }
            }
        }

        /*
        |--------------------------------------------------------------------------
        | Create Motorcycle Sale
        |--------------------------------------------------------------------------
        */

        $motorcycle = Motorcycle::create([

            'brand' =>
                $validated['brand'],

            'model' =>
                $validated['model'],

            'year' =>
                $validated['year'],

            'sale_price' =>
                $validated['sale_price'],

            'condition' =>
                $validated['condition'],

            'description' =>
                $validated['description'] ?? null,

            'photos' =>
                $photos,

            'listing_type' =>
                'sale',

            'status' =>
                'available',

            'owner_id' =>
                $request->user()->id,

            'latitude' =>
                $validated['latitude'] ?? null,

            'longitude' =>
                $validated['longitude'] ?? null,

            'location_name' =>
                $validated['location_name'] ?? null,
        ]);

        return response()->json(
            $motorcycle,
            201
        );
    }

    /**
     * Update motorcycle information.
     *
     * Images are not changed here.
     */
    public function update(Request $request, $id)
    {
        $motorcycle =
            Motorcycle::findOrFail($id);

        /*
        |--------------------------------------------------------------------------
        | Validation
        |--------------------------------------------------------------------------
        */

        $validator = Validator::make(
            $request->all(),
            [

                'brand' =>
                    'sometimes|required|string|max:255',

                'model' =>
                    'sometimes|required|string|max:255',

                'year' => [
                    'sometimes',
                    'required',
                    'integer',
                    'min:1980',
                    'max:' . (date('Y') + 1),
                ],

                'daily_price' =>
                    'sometimes|nullable|numeric|min:0',

                'monthly_price' =>
                    'sometimes|nullable|numeric|min:0',

                'total_contract_price' =>
                    'sometimes|nullable|numeric|min:0',

                'sale_price' =>
                    'sometimes|nullable|numeric|min:0',

                'condition' =>
                    'sometimes|required|in:new,used',

                'description' =>
                    'sometimes|nullable|string',

                'latitude' =>
                    'sometimes|nullable|numeric|between:-90,90',

                'longitude' =>
                    'sometimes|nullable|numeric|between:-180,180',

                'location_name' =>
                    'sometimes|nullable|string|max:255',
            ]
        );

        if ($validator->fails()) {

            return response()->json([
                'message' => 'Validation failed.',
                'errors' => $validator->errors(),
            ], 422);
        }

        /*
        |--------------------------------------------------------------------------
        | Update Motorcycle
        |--------------------------------------------------------------------------
        */

        $motorcycle->update(
            $validator->validated()
        );

        return response()->json(
            $motorcycle->fresh()
        );
    }

    /**
     * Update motorcycle status.
     */
    public function updateStatus(Request $request, $id)
    {
        /*
        |--------------------------------------------------------------------------
        | Validate status
        |--------------------------------------------------------------------------
        */

        $validator = Validator::make(
            $request->all(),
            [
                'status' =>
                    'required|in:available,rented,sold,maintenance',
            ]
        );

        if ($validator->fails()) {

            return response()->json([
                'message' => 'Validation failed.',
                'errors' => $validator->errors(),
            ], 422);
        }

        /*
        |--------------------------------------------------------------------------
        | Find Motorcycle
        |--------------------------------------------------------------------------
        */

        $motorcycle =
            Motorcycle::findOrFail($id);

        /*
        |--------------------------------------------------------------------------
        | Update Status
        |--------------------------------------------------------------------------
        */

        $motorcycle->update([
            'status' =>
                $request->status,
        ]);

        return response()->json(
            $motorcycle->fresh()
        );
    }

    /**
     * Delete motorcycle.
     *
     * The motorcycle record is removed from database.
     *
     * Cloudinary images remain in Cloudinary.
     */
    public function destroy($id)
    {
        $motorcycle =
            Motorcycle::findOrFail($id);

        $motorcycle->delete();

        return response()->json([
            'message' =>
                'Motorcycle removed',
        ]);
    }
}

