<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Default Filesystem Disk
    |--------------------------------------------------------------------------
    */

    'default' => env('FILESYSTEM_DISK', 'local'),

    /*
    |--------------------------------------------------------------------------
    | Filesystem Disks
    |--------------------------------------------------------------------------
    */

    'disks' => [

        /*
        |--------------------------------------------------------------------------
        | Local Private Storage
        |--------------------------------------------------------------------------
        */

        'local' => [
            'driver' => 'local',
            'root' => storage_path('app/private'),
            'serve' => true,
            'throw' => false,
            'report' => false,
        ],

        /*
        |--------------------------------------------------------------------------
        | Local Public Storage
        |--------------------------------------------------------------------------
        |
        | Keep this for old images/files already stored locally.
        |
        */

        'public' => [
            'driver' => 'local',
            'root' => storage_path('app/public'),
            'url' => rtrim(
                env('APP_URL', 'http://localhost'),
                '/'
            ) . '/storage',
            'visibility' => 'public',
            'throw' => false,
            'report' => false,
        ],

        /*
        |--------------------------------------------------------------------------
        | Cloudinary
        |--------------------------------------------------------------------------
        |
        | New uploaded images will use Cloudinary.
        |
        */

        'cloudinary' => [
            'driver' => 'cloudinary',
            'key' => env('CLOUDINARY_KEY'),
            'secret' => env('CLOUDINARY_SECRET'),
            'cloud' => env('CLOUDINARY_CLOUD_NAME'),
            'url' => env('CLOUDINARY_URL'),
            'secure' => (bool) env('CLOUDINARY_SECURE', true),
            'prefix' => env('CLOUDINARY_PREFIX'),
        ],

        /*
        |--------------------------------------------------------------------------
        | Amazon S3
        |--------------------------------------------------------------------------
        */

        's3' => [
            'driver' => 's3',
            'key' => env('AWS_ACCESS_KEY_ID'),
            'secret' => env('AWS_SECRET_ACCESS_KEY'),
            'region' => env('AWS_DEFAULT_REGION'),
            'bucket' => env('AWS_BUCKET'),
            'url' => env('AWS_URL'),
            'endpoint' => env('AWS_ENDPOINT'),
            'use_path_style_endpoint' => env(
                'AWS_USE_PATH_STYLE_ENDPOINT',
                false
            ),
            'throw' => false,
            'report' => false,
        ],

    ],

    /*
    |--------------------------------------------------------------------------
    | Symbolic Links
    |--------------------------------------------------------------------------
    */

    'links' => [
        public_path('storage') => storage_path('app/public'),
    ],

];
