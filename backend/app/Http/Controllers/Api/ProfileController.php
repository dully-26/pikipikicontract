<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;

class ProfileController extends Controller
{
    /**
     * Upload or replace user profile photo.
     *
     * Photo is stored on Cloudinary.
     */
    public function updatePhoto(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'photo' => [
                'required',
                'file',
                'image',
                'mimes:jpeg,jpg,png,webp',
                'max:5120',
            ],
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Picha haikubaliki.',
                'errors' => $validator->errors(),
            ], 422);
        }

        $user = $request->user();

        try {

            /*
            |--------------------------------------------------------------------------
            | Check uploaded file
            |--------------------------------------------------------------------------
            */

            $file = $request->file('photo');

            if (!$file) {
                return response()->json([
                    'message' => 'Hakuna picha iliyopokelewa.',
                ], 422);
            }

            if (!$file->isValid()) {
                return response()->json([
                    'message' => 'Picha haikupokelewa vizuri.',
                ], 422);
            }

            /*
            |--------------------------------------------------------------------------
            | Upload to Cloudinary
            |--------------------------------------------------------------------------
            |
            | IMPORTANT:
            | cloudinary()->upload() does not exist in
            | cloudinary-labs/cloudinary-laravel v3.
            |
            | We must use:
            |
            | cloudinary()->uploadApi()->upload()
            |
            */

            $result = cloudinary()
                ->uploadApi()
                ->upload(
                    $file->getRealPath(),
                    [
                        'folder' => 'mtema-project/profile_photos',
                        'resource_type' => 'image',
                    ]
                );

            /*
            |--------------------------------------------------------------------------
            | Get Cloudinary secure URL
            |--------------------------------------------------------------------------
            */

            $photoUrl = $result['secure_url'] ?? null;

            if (!$photoUrl) {

                Log::error(
                    'Cloudinary did not return secure_url',
                    [
                        'user_id' => $user->id,
                        'result' => $result,
                    ]
                );

                throw new \Exception(
                    'Cloudinary haikurudisha secure_url.'
                );
            }

            /*
            |--------------------------------------------------------------------------
            | Save Cloudinary URL to user
            |--------------------------------------------------------------------------
            */

            $user->update([
                'profile_photo' => $photoUrl,
            ]);

            /*
            |--------------------------------------------------------------------------
            | Return updated user
            |--------------------------------------------------------------------------
            */

            return response()->json(
                $user->fresh()
            );

        } catch (\Throwable $e) {

            /*
            |--------------------------------------------------------------------------
            | Log real Cloudinary error
            |--------------------------------------------------------------------------
            */

            Log::error(
                'Cloudinary profile photo upload failed',
                [
                    'user_id' => $user?->id,
                    'message' => $e->getMessage(),
                    'file' => $e->getFile(),
                    'line' => $e->getLine(),
                ]
            );

            /*
            |--------------------------------------------------------------------------
            | Return error
            |--------------------------------------------------------------------------
            */

            return response()->json([
                'message' =>
                    'Imeshindwa kupakia picha kwenye Cloudinary.',

                /*
                 * Temporary error output for debugging.
                 * Remove this in production after fixing.
                 */
                'error' => $e->getMessage(),

            ], 500);
        }
    }


    /**
     * Update basic user information.
     */
    public function updateInfo(Request $request)
    {
        $validator = Validator::make($request->all(), [

            'full_name' => [
                'sometimes',
                'required',
                'string',
                'max:255',
            ],

            'phone' => [
                'sometimes',
                'nullable',
                'string',
                'max:20',
            ],

            'address' => [
                'sometimes',
                'nullable',
                'string',
                'max:255',
            ],

        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Taarifa ulizoingiza si sahihi.',
                'errors' => $validator->errors(),
            ], 422);
        }

        $user = $request->user();

        $user->update(
            $validator->validated()
        );

        return response()->json(
            $user->fresh()
        );
    }
}