<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use CloudinaryLabs\CloudinaryLaravel\Facades\Cloudinary;

class ProfileController extends Controller
{
    /**
     * Upload or replace user profile photo.
     */
    public function updatePhoto(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'photo' => 'required|file|image|mimes:jpg,jpeg,png,webp|max:5120',
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
            | Upload to Cloudinary
            |--------------------------------------------------------------------------
            |
            | cloudinary-laravel v3 uses uploadApi()->upload()
            |
            */

            $result = Cloudinary::uploadApi()->upload(
                $request->file('photo')->getRealPath(),
                [
                    'folder' => 'mtema-project/profile_photos',
                    'resource_type' => 'image',
                ]
            );

            /*
            |--------------------------------------------------------------------------
            | Get Cloudinary URL
            |--------------------------------------------------------------------------
            */

            $photoUrl = $result['secure_url'] ?? null;

            if (!$photoUrl) {
                throw new \Exception(
                    'Cloudinary haikurudisha secure_url.'
                );
            }

            /*
            |--------------------------------------------------------------------------
            | Save URL to database
            |--------------------------------------------------------------------------
            */

            $user->update([
                'profile_photo' => $photoUrl,
            ]);

            return response()->json(
                $user->fresh()
            );

        } catch (\Throwable $e) {

            \Log::error(
                'Cloudinary profile photo upload failed',
                [
                    'user_id' => $user->id,
                    'error' => $e->getMessage(),
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

    /**
     * Update basic user information.
     */
    public function updateInfo(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'full_name' =>
                'sometimes|required|string|max:255',

            'phone' =>
                'sometimes|nullable|string|max:20',

            'address' =>
                'sometimes|nullable|string|max:255',
        ]);

        if ($validator->fails()) {
            return response()->json([
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