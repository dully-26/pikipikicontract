import { useEffect, useState } from 'react';
import { X, Camera } from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { storageUrl } from '../utils/storage';
import { validateContractRequestForm } from '../utils/validation';
import imageCompression from 'browser-image-compression';

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
  const [compressing, setCompressing] = useState(false);

  useEffect(() => {
    if (!photo && user?.profile_photo) {
      setPreview(storageUrl(user.profile_photo));
    } else if (!photo && !user?.profile_photo) {
      setPreview(null);
    }
  }, [user, photo]);

  const compressImage = async (file) => {
    const options = {
      maxSizeMB: 1,
      maxWidthOrHeight: 1200,
      useWebWorker: true,
      fileType: 'image/jpeg',
      initialQuality: 0.8,
    };

    const compressedBlob = await imageCompression(file, options);

    return new File(
      [compressedBlob],
      'applicant-photo.jpg',
      {
        type: 'image/jpeg',
        lastModified: Date.now(),
      }
    );
  };

  const handlePhotoChange = async (e) => {
    const file = e.target.files?.[0];

    if (!file) {
      return;
    }

    setError('');

    if (!file.type.startsWith('image/')) {
      setError('Tafadhali chagua picha tu.');
      e.target.value = '';
      return;
    }

    if (file.size > 20 * 1024 * 1024) {
      setError(
        'Picha ni kubwa sana. Tafadhali chagua picha chini ya 20MB.'
      );
      e.target.value = '';
      return;
    }

    try {
      setCompressing(true);

      const temporaryPreview = URL.createObjectURL(file);
      setPreview(temporaryPreview);

      const compressedFile = await compressImage(file);

      if (compressedFile.size > 5 * 1024 * 1024) {
        setError(
          'Picha bado ni kubwa baada ya compression. Tafadhali chagua picha nyingine.'
        );

        setPhoto(null);

        if (user?.profile_photo) {
          setPreview(storageUrl(user.profile_photo));
        } else {
          setPreview(null);
        }

        return;
      }

      setPhoto(compressedFile);

    } catch (err) {
      console.error('Applicant photo compression error:', err);

      setError(
        'Imeshindwa kuandaa picha. Tafadhali jaribu picha nyingine.'
      );

      setPhoto(null);

      if (user?.profile_photo) {
        setPreview(storageUrl(user.profile_photo));
      } else {
        setPreview(null);
      }

    } finally {
      setCompressing(false);
      e.target.value = '';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (submitting || compressing) {
      return;
    }

    setError('');

    const validationErrors = validateContractRequestForm({
      applicant_photo:
        photo || user?.profile_photo || null,
    });

    if (Object.keys(validationErrors).length > 0) {
      setError(
        validationErrors.applicant_photo ||
        'Tafadhali weka picha yako kabla ya kuwasilisha ombi.'
      );
      return;
    }

    const data = new FormData();

    data.append(
      'motorcycle_id',
      String(motorcycle.id)
    );

    if (photo instanceof File) {
      data.append(
        'applicant_photo',
        photo,
        'applicant-photo.jpg'
      );
    }

    if (notes.trim() !== '') {
      data.append(
        'notes',
        notes.trim()
      );
    }

    setSubmitting(true);

    try {
      const response = await api.post(
        '/contract-requests',
        data
      );

      console.log(
        'Contract request submitted successfully:',
        response.data
      );

      onSuccess(response.data);

    } catch (err) {
      console.error(
        'Contract request submission error:',
        err
      );

      console.error(
        'Backend response:',
        err.response?.data
      );

      if (
        err.response?.status === 422 &&
        err.response?.data?.errors
      ) {
        const validationMessages = Object.values(
          err.response.data.errors
        )
          .flat()
          .join(' ');

        setError(
          validationMessages ||
          'Taarifa ulizoingiza si sahihi.'
        );

      } else {
        setError(
          err.response?.data?.message ||
          'Imeshindikana kuwasilisha ombi. Tafadhali jaribu tena.'
        );
      }

    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    if (submitting || compressing) {
      return;
    }

    onClose();
  };

  return (
    <div
      className="modal-overlay"
      onClick={handleClose}
    >
      <div
        className="modal-box"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          className="modal-close"
          onClick={handleClose}
          disabled={submitting || compressing}
          aria-label="Close"
        >
          <X size={18} />
        </button>

        <h2>
          Omba Mkataba wa Pikipiki
        </h2>

        <p
          style={{
            fontSize: 13,
            color: 'var(--text-muted)',
            marginBottom: 16,
          }}
        >
          {motorcycle?.brand}{' '}
          {motorcycle?.model}{' '}
          {motorcycle?.year
            ? `(${motorcycle.year})`
            : ''}
        </p>

        {error && (
          <div className="alert-error">
            {error}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="contract-form"
          style={{
            padding: 0,
            boxShadow: 'none',
            border: 'none',
          }}
        >
          <label
            style={{
              fontSize: 13,
              fontWeight: 600,
              display: 'block',
              marginBottom: 8,
            }}
          >
            Picha Yako{' '}
            <span
              style={{
                color: 'var(--text-muted)',
                fontWeight: 400,
              }}
            >
              (itaonekana kwenye mkataba)
            </span>
          </label>

          <div className="photo-upload-box">
            {preview ? (
              <img
                src={preview}
                alt="Applicant"
                className="photo-preview"
              />
            ) : (
              <div className="photo-upload-placeholder">
                <Camera size={26} />

                <span>
                  Bofya kupakia picha
                </span>
              </div>
            )}

            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/jpg"
              onChange={handlePhotoChange}
              className="photo-upload-input"
              disabled={
                submitting ||
                compressing
              }
            />
          </div>

          {compressing && (
            <p
              style={{
                fontSize: 12,
                color: 'var(--text-muted)',
                marginTop: 7,
              }}
            >
              Inaandaa picha...
            </p>
          )}

          {!photo &&
            user?.profile_photo &&
            !compressing && (
              <p
                style={{
                  fontSize: 12,
                  color: 'var(--text-muted)',
                  marginTop: 7,
                  lineHeight: 1.5,
                }}
              >
                Tunatumia picha yako ya
                profaili. Bofya kwenye picha
                kubadilisha.
              </p>
            )}

          {!photo &&
            !user?.profile_photo &&
            !compressing && (
              <p
                style={{
                  fontSize: 12,
                  color: 'var(--danger)',
                  marginTop: 7,
                }}
              >
                Tafadhali pakia picha yako
                kabla ya kuwasilisha ombi.
              </p>
            )}

          <label
            style={{
              fontSize: 13,
              fontWeight: 600,
              display: 'block',
              marginTop: 14,
              marginBottom: 6,
            }}
          >
            Maelezo ya Ziada{' '}
            <span
              style={{
                color: 'var(--text-muted)',
                fontWeight: 400,
              }}
            >
              (si lazima)
            </span>
          </label>

          <textarea
            placeholder="Andika chochote unachotaka meneja aone..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            disabled={submitting}
            maxLength={500}
          />

          <button
            type="submit"
            className="btn-primary"
            disabled={
              submitting ||
              compressing ||
              (!photo && !user?.profile_photo)
            }
            style={{
              marginTop: 14,
              width: '100%',
            }}
          >
            {compressing
              ? 'Inaandaa picha...'
              : submitting
                ? 'Inawasilisha...'
                : 'Wasilisha Ombi'}
          </button>
        </form>
      </div>
    </div>
  );
}