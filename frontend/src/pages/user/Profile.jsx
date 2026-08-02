import { useState } from 'react';
import { Camera, Save } from 'lucide-react';
import imageCompression from 'browser-image-compression';

import api from '../../api/axios';
import { storageUrl } from '../../utils/storage';
import { useAuth } from '../../context/AuthContext';

export default function Profile() {
  const { user, setUser } = useAuth();

  const [photo, setPhoto] = useState(null);

  const [preview, setPreview] = useState(
    user?.profile_photo
      ? storageUrl(user.profile_photo)
      : null
  );

  const [form, setForm] = useState({
    full_name: user?.full_name || '',
    phone: user?.phone || '',
    address: user?.address || '',
  });

  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);


  /*
  |--------------------------------------------------------------------------
  | Compress image
  |--------------------------------------------------------------------------
  */

  const compressImage = async (file) => {

    const options = {
      maxSizeMB: 0.8,
      maxWidthOrHeight: 1200,
      useWebWorker: true,
      fileType: 'image/jpeg',
      initialQuality: 0.8,
    };

    const compressedBlob = await imageCompression(
      file,
      options
    );

    /*
     * Convert Blob to File
     */

    const compressedFile = new File(
      [compressedBlob],
      'profile-photo.jpg',
      {
        type: 'image/jpeg',
        lastModified: Date.now(),
      }
    );

    return compressedFile;
  };


  /*
  |--------------------------------------------------------------------------
  | Upload Profile Photo
  |--------------------------------------------------------------------------
  */

  const handlePhotoChange = async (e) => {

    const file = e.target.files?.[0];

    if (!file) {
      return;
    }

    setMessage('');
    setError('');

    /*
    |--------------------------------------------------------------------------
    | Validate image
    |--------------------------------------------------------------------------
    */

    if (!file.type.startsWith('image/')) {

      setError(
        'Tafadhali chagua picha tu.'
      );

      e.target.value = '';

      return;
    }


    /*
    |--------------------------------------------------------------------------
    | Maximum original file size
    |--------------------------------------------------------------------------
    */

    if (file.size > 20 * 1024 * 1024) {

      setError(
        'Picha ni kubwa sana. Tafadhali chagua picha chini ya 20MB.'
      );

      e.target.value = '';

      return;
    }


    setUploading(true);


    /*
    |--------------------------------------------------------------------------
    | Temporary preview
    |--------------------------------------------------------------------------
    */

    const temporaryPreview =
      URL.createObjectURL(file);

    setPreview(temporaryPreview);


    try {

      /*
      |--------------------------------------------------------------------------
      | Compress image
      |--------------------------------------------------------------------------
      */

      console.log(
        'Original image:',
        `${(
          file.size /
          1024 /
          1024
        ).toFixed(2)} MB`
      );


      const compressedFile =
        await compressImage(file);


      console.log(
        'Compressed image:',
        `${(
          compressedFile.size /
          1024 /
          1024
        ).toFixed(2)} MB`
      );


      /*
      |--------------------------------------------------------------------------
      | Final size check
      |--------------------------------------------------------------------------
      */

      if (
        compressedFile.size >
        5 * 1024 * 1024
      ) {

        throw new Error(
          'Picha bado ni kubwa baada ya compression. Tafadhali chagua picha nyingine.'
        );
      }


      setPhoto(compressedFile);


      /*
      |--------------------------------------------------------------------------
      | FormData
      |--------------------------------------------------------------------------
      */

      const data = new FormData();

      data.append(
        'photo',
        compressedFile,
        'profile-photo.jpg'
      );


      /*
      |--------------------------------------------------------------------------
      | Upload to Laravel
      |--------------------------------------------------------------------------
      */

      const res = await api.post(
        '/profile/photo',
        data
      );


      /*
      |--------------------------------------------------------------------------
      | Update user
      |--------------------------------------------------------------------------
      */

      setMessage(
        'Picha ya profaili imesasishwa!'
      );


      localStorage.setItem(
        'user',
        JSON.stringify(res.data)
      );


      if (setUser) {
        setUser(res.data);
      }


      /*
      |--------------------------------------------------------------------------
      | Update permanent preview
      |--------------------------------------------------------------------------
      */

      if (res.data?.profile_photo) {

        setPreview(
          storageUrl(
            res.data.profile_photo
          )
        );
      }


    } catch (err) {

      console.error(
        'Profile photo upload error:',
        err
      );

      console.error(
        'Server response:',
        err.response?.data
      );


      /*
      |--------------------------------------------------------------------------
      | Restore old profile photo
      |--------------------------------------------------------------------------
      */

      setPreview(
        user?.profile_photo
          ? storageUrl(
              user.profile_photo
            )
          : null
      );


      setPhoto(null);


      /*
      |--------------------------------------------------------------------------
      | Display error
      |--------------------------------------------------------------------------
      */

      setError(
        err.response?.data?.error ||
        err.response?.data?.message ||
        err.message ||
        'Imeshindwa kupakia picha. Tafadhali jaribu tena.'
      );


    } finally {

      setUploading(false);

      /*
      |--------------------------------------------------------------------------
      | Allow selecting same image again
      |--------------------------------------------------------------------------
      */

      e.target.value = '';
    }
  };


  /*
  |--------------------------------------------------------------------------
  | Save Profile Information
  |--------------------------------------------------------------------------
  */

  const handleSaveInfo = async (e) => {

    e.preventDefault();

    setSaving(true);

    setError('');
    setMessage('');


    try {

      const res = await api.put(
        '/profile',
        form
      );


      setMessage(
        'Taarifa zimesasishwa kwa mafanikio!'
      );


      localStorage.setItem(
        'user',
        JSON.stringify(res.data)
      );


      if (setUser) {
        setUser(res.data);
      }


    } catch (err) {

      console.error(
        'Profile update error:',
        err
      );


      setError(
        err.response?.data?.message ||
        'Imeshindwa kusasisha taarifa'
      );


    } finally {

      setSaving(false);
    }
  };


  /*
  |--------------------------------------------------------------------------
  | Render
  |--------------------------------------------------------------------------
  */

  return (
    <div className="page">

      <h1>
        Profaili Yangu
      </h1>


      <p className="page-subtitle">
        Sasisha picha na taarifa zako binafsi
      </p>


      {message && (
        <div className="alert-success">
          {message}
        </div>
      )}


      {error && (
        <div className="alert-error">
          {error}
        </div>
      )}


      <div
        className="contract-form"
        style={{
          maxWidth: 480
        }}
      >

        {/* ======================================================
            PROFILE PHOTO
        ====================================================== */}

        <div className="profile-photo-upload">

          <div className="profile-photo-preview">

            {preview ? (

              <img
                src={preview}
                alt="Profile"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />

            ) : (

              <div className="profile-photo-placeholder">

                {user?.full_name
                  ?.split(' ')
                  .map((n) => n[0])
                  .slice(0, 2)
                  .join('')
                  .toUpperCase()
                }

              </div>

            )}


            <label
              className="profile-photo-edit-btn"
              style={{
                cursor: uploading
                  ? 'not-allowed'
                  : 'pointer',

                opacity: uploading
                  ? 0.6
                  : 1
              }}
            >

              <Camera size={14} />


              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/jpg"
                onChange={handlePhotoChange}
                disabled={uploading}
                hidden
              />

            </label>

          </div>


          {uploading && (

            <p
              style={{
                fontSize: 12,
                color: 'var(--text-muted)',
                marginTop: 8
              }}
            >
              Inapunguza ukubwa wa picha
              na kui-upload...
            </p>

          )}


          {!uploading && (

            <p
              style={{
                fontSize: 11.5,
                color: 'var(--text-muted)',
                marginTop: 8,
                lineHeight: 1.5
              }}
            >
              Picha itapunguzwa ukubwa
              automatically kabla ya ku-upload.
            </p>

          )}

        </div>


        {/* ======================================================
            PROFILE INFORMATION
        ====================================================== */}

        <form
          onSubmit={handleSaveInfo}
          style={{
            marginTop: 20
          }}
        >

          <label
            style={{
              fontSize: 13,
              fontWeight: 600
            }}
          >
            Jina Kamili
          </label>


          <input
            value={form.full_name}
            onChange={(e) =>
              setForm({
                ...form,
                full_name: e.target.value
              })
            }
          />


          <label
            style={{
              fontSize: 13,
              fontWeight: 600,
              marginTop: 10,
              display: 'block'
            }}
          >
            Simu
          </label>


          <input
            value={form.phone}
            onChange={(e) =>
              setForm({
                ...form,
                phone: e.target.value
              })
            }
          />


          <label
            style={{
              fontSize: 13,
              fontWeight: 600,
              marginTop: 10,
              display: 'block'
            }}
          >
            Anwani
          </label>


          <input
            value={form.address}
            onChange={(e) =>
              setForm({
                ...form,
                address: e.target.value
              })
            }
          />


          <button
            type="submit"
            className="btn-primary"
            disabled={saving || uploading}
            style={{
              marginTop: 16
            }}
          >

            <Save
              size={15}
              style={{
                marginRight: 6,
                verticalAlign: 'middle'
              }}
            />


            {saving
              ? 'Inahifadhi...'
              : 'Hifadhi Mabadiliko'
            }

          </button>

        </form>

      </div>

    </div>
  );
}