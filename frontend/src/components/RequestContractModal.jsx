import { useState, useEffect } from 'react';
import { X, Camera } from 'lucide-react';

import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { storageUrl } from '../utils/storage';
import { validateContractRequestForm } from '../utils/validation';

export default function RequestContractModal({
  motorcycle,
  onClose,
  onSuccess,
}) {
  const { user } = useAuth();

  const [photo, setPhoto] = useState(null);
  const [preview, setPreview] = useState(null);
  const [notes, setNotes] = useState('');

  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  /*
  |--------------------------------------------------------------------------
  | Existing Profile Photo
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    if (
      !photo &&
      user?.profile_photo
    ) {
      setPreview(
        storageUrl(
          user.profile_photo
        )
      );
    }
  }, [user, photo]);

  /*
  |--------------------------------------------------------------------------
  | Select Applicant Photo
  |--------------------------------------------------------------------------
  */

  const handlePhotoChange = (e) => {
    const file =
      e.target.files?.[0];

    if (!file) {
      return;
    }

    setError('');

    /*
    |--------------------------------------------------------------------------
    | Check File Type
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
    | Check File Size
    |--------------------------------------------------------------------------
    */

    if (
      file.size >
      5 * 1024 * 1024
    ) {
      setError(
        'Picha ni kubwa sana. Tafadhali chagua picha chini ya 5MB.'
      );

      e.target.value = '';

      return;
    }

    /*
    |--------------------------------------------------------------------------
    | Save Photo
    |--------------------------------------------------------------------------
    */

    setPhoto(file);

    /*
    |--------------------------------------------------------------------------
    | Preview
    |--------------------------------------------------------------------------
    */

    const objectUrl =
      URL.createObjectURL(file);

    setPreview(objectUrl);

    /*
    |--------------------------------------------------------------------------
    | Allow Same File Selection Again
    |--------------------------------------------------------------------------
    */

    e.target.value = '';
  };

  /*
  |--------------------------------------------------------------------------
  | Submit Contract Request
  |--------------------------------------------------------------------------
  */

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError('');

    /*
    |--------------------------------------------------------------------------
    | Validate
    |--------------------------------------------------------------------------
    */

    const errs =
      validateContractRequestForm({
        applicant_photo:
          photo ||
          user?.profile_photo,
      });

    if (
      Object.keys(errs).length > 0
    ) {
      setError(
        errs.applicant_photo ||
        'Tafadhali pakia picha yako.'
      );

      return;
    }

    /*
    |--------------------------------------------------------------------------
    | FormData
    |--------------------------------------------------------------------------
    */

    const data =
      new FormData();

    data.append(
      'motorcycle_id',
      motorcycle.id
    );

    /*
    |--------------------------------------------------------------------------
    | Applicant Photo
    |--------------------------------------------------------------------------
    |
    | IMPORTANT:
    |
    | Only user's own photo is sent.
    |
    | Motorcycle photo is NOT sent.
    |
    */

    if (photo) {
      data.append(
        'applicant_photo',
        photo,
        photo.name
      );
    }

    /*
    |--------------------------------------------------------------------------
    | Notes
    |--------------------------------------------------------------------------
    */

    if (notes.trim()) {
      data.append(
        'notes',
        notes.trim()
      );
    }

    /*
    |--------------------------------------------------------------------------
    | Submit
    |--------------------------------------------------------------------------
    */

    setSubmitting(true);

    try {

      await api.post(
        '/contract-requests',
        data
      );

      /*
      |--------------------------------------------------------------------------
      | Success
      |--------------------------------------------------------------------------
      */

      onSuccess();

    } catch (err) {

      console.error(
        'Contract request error:',
        err
      );

      console.error(
        'Response:',
        err.response?.data
      );

      setError(
        err.response?.data?.message ||
        err.response?.data?.errors?.applicant_photo?.[0] ||
        'Imeshindikana kuwasilisha ombi. Jaribu tena.'
      );

    } finally {

      setSubmitting(false);
    }
  };

  return (
    <div
      className="modal-overlay"
      onClick={onClose}
    >

      <div
        className="modal-box"
        onClick={(e) =>
          e.stopPropagation()
        }
      >

        {/* CLOSE */}

        <button
          className="modal-close"
          onClick={onClose}
          type="button"
        >
          <X size={18} />
        </button>


        {/* TITLE */}

        <h2>
          Omba Mkataba wa Pikipiki
        </h2>

        <p
          style={{
            fontSize: 13,
            color:
              'var(--text-muted)',
            marginBottom: 16,
          }}
        >
          {motorcycle.brand}{' '}
          {motorcycle.model}{' '}
          ({motorcycle.year})
        </p>


        {/* ERROR */}

        {error && (
          <div className="alert-error">
            {error}
          </div>
        )}


        {/* FORM */}

        <form
          onSubmit={handleSubmit}
          className="contract-form"
          style={{
            padding: 0,
            boxShadow: 'none',
            border: 'none',
          }}
        >

          {/* APPLICANT PHOTO */}

          <label
            style={{
              fontSize: 13,
              fontWeight: 600,
              display: 'block',
              marginBottom: 8,
            }}
          >
            Picha Yako
            {' '}
            <span
              style={{
                fontWeight: 400,
                color:
                  'var(--text-muted)',
              }}
            >
              (itaonekana kwenye mkataba)
            </span>
          </label>


          <div className="photo-upload-box">

            {preview ? (

              <img
                src={preview}
                alt="Applicant preview"
                className="photo-preview"
              />

            ) : (

              <div className="photo-upload-placeholder">

                <Camera size={26} />

                <span>
                  Bofya kupakia picha yako
                </span>

              </div>

            )}

            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/jpg"
              onChange={
                handlePhotoChange
              }
              className="photo-upload-input"
              disabled={submitting}
            />

          </div>


          {/* PROFILE PHOTO INFO */}

          {!photo &&
            user?.profile_photo && (

              <p
                style={{
                  fontSize: 12,
                  color:
                    'var(--text-muted)',
                  marginTop: 6,
                }}
              >
                Tunatumia picha yako ya
                profaili. Bofya kwenye picha
                hapo juu ili kuchagua picha
                nyingine.
              </p>
            )}


          {/* NO PROFILE PHOTO */}

          {!photo &&
            !user?.profile_photo && (

              <p
                style={{
                  fontSize: 12,
                  color:
                    'var(--warning)',
                  marginTop: 6,
                }}
              >
                Tafadhali pakia picha yako
                kabla ya kuwasilisha ombi.
              </p>
            )}


          {/* NOTES */}

          <label
            style={{
              fontSize: 13,
              fontWeight: 600,
              display: 'block',
              marginTop: 14,
              marginBottom: 6,
            }}
          >
            Maelezo ya Ziada
            {' '}
            <span
              style={{
                fontWeight: 400,
                color:
                  'var(--text-muted)',
              }}
            >
              (si lazima)
            </span>
          </label>

          <textarea
            placeholder="Andika chochote unachotaka meneja aone..."
            value={notes}
            onChange={(e) =>
              setNotes(
                e.target.value
              )
            }
            disabled={submitting}
          />


          {/* SUBMIT */}

          <button
            type="submit"
            className="btn-primary"
            disabled={submitting}
            style={{
              marginTop: 14,
            }}
          >
            {submitting
              ? 'Inawasilisha...'
              : 'Wasilisha Ombi'}
          </button>

        </form>

      </div>

    </div>
  );
}

