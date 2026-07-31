<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

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
            'photo' =>
                'required|file|image|max:5120',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'errors' => $validator->errors()
            ], 422);
        }

        $user = $request->user();

        /*
        |--------------------------------------------------------------------------
        | Upload To Cloudinary
        |--------------------------------------------------------------------------
        */

        try {

            $uploadedFile = cloudinary()->upload(
                $request->file('photo')->getRealPath(),
                [
                    'folder' => 'mtema-project/profile_photos',
                ]
            );

            $photoUrl =
                $uploadedFile->getSecurePath();

        } catch (\Throwable $e) {

            return response()->json([
                'message' =>
                    'Imeshindwa kupakia picha ya profaili kwenye Cloudinary.',

                'error' =>
                    config('app.debug')
                        ? $e->getMessage()
                        : null,
            ], 500);
        }

        /*
        |--------------------------------------------------------------------------
        | Save Cloudinary URL
        |--------------------------------------------------------------------------
        */

        $user->update([
            'profile_photo' => $photoUrl
        ]);

        return response()->json(
            $user->fresh()
        );
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
                'errors' => $validator->errors()
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

