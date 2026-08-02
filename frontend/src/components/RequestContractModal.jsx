import { useState, useEffect } from 'react';
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

| /*                                                                         |
| -------------------------------------------------------------------------- |
| Show profile photo by default                                              |
| -------------------------------------------------------------------------- |
| */                                                                         |

useEffect(() => {
if (!photo && user?.profile_photo) {
setPreview(
storageUrl(user.profile_photo)
);
}
}, [user, photo]);

| /*                                                                         |
| -------------------------------------------------------------------------- |
| Compress applicant photo                                                   |
| -------------------------------------------------------------------------- |
| */                                                                         |

const compressImage = async (file) => {
const options = {
maxSizeMB: 1,
maxWidthOrHeight: 1200,
useWebWorker: true,
fileType: 'image/jpeg',
initialQuality: 0.8,
};


const compressedBlob =
  await imageCompression(
    file,
    options
  );

return new File(
  [compressedBlob],
  'applicant-photo.jpg',
  {
    type: 'image/jpeg',
    lastModified: Date.now(),
  }
);


};

| /*                                                                         |
| -------------------------------------------------------------------------- |
| Photo selection                                                            |
| -------------------------------------------------------------------------- |
| */                                                                         |

const handlePhotoChange = async (e) => {
const file =
e.target.files?.[0];

```
if (!file) {
  return;
}

setError('');

/*
|----------------------------------------------------------------------
| Validate image
|----------------------------------------------------------------------
*/

if (!file.type.startsWith('image/')) {
  setError(
    'Tafadhali chagua picha tu.'
  );

  e.target.value = '';

  return;
}

if (
  file.size >
  20 * 1024 * 1024
) {
  setError(
    'Picha ni kubwa sana. Chagua picha chini ya 20MB.'
  );

  e.target.value = '';

  return;
}

try {

  /*
  |--------------------------------------------------------------------
  | Show temporary preview
  |--------------------------------------------------------------------
  */

  setPreview(
    URL.createObjectURL(file)
  );

  /*
  |--------------------------------------------------------------------
  | Compress
  |--------------------------------------------------------------------
  */

  const compressedFile =
    await compressImage(file);

  setPhoto(compressedFile);

} catch (err) {

  console.error(
    'Image compression error:',
    err
  );

  setError(
    'Imeshindwa kuandaa picha. Tafadhali jaribu picha nyingine.'
  );

  setPhoto(null);

} finally {

  e.target.value = '';

}
```

};

| /*                                                                         |
| -------------------------------------------------------------------------- |
| Submit request                                                             |
| -------------------------------------------------------------------------- |
| */                                                                         |

const handleSubmit = async (e) => {
e.preventDefault();

```
setError('');

/*
|----------------------------------------------------------------------
| Validate
|----------------------------------------------------------------------
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
    'Tafadhali weka picha yako.'
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
|----------------------------------------------------------------------
| Only upload a new file if selected.
|
| If no new file is selected, backend will use profile_photo.
|----------------------------------------------------------------------
*/

if (photo) {

  data.append(
    'applicant_photo',
    photo,
    'applicant-photo.jpg'
  );

}

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

  const response =
    await api.post(
      '/contract-requests',
      data
    );

  console.log(
    'Contract request created:',
    response.data
  );

  onSuccess();

} catch (err) {

  console.error(
    'Contract request error:',
    err
  );

  console.error(
    'Backend response:',
    err.response?.data
  );

  setError(
    err.response?.data?.message ||
    'Imeshindikana kuwasilisha ombi. Jaribu tena.'
  );

} finally {

  setSubmitting(false);

}
```

};

return ( <div
   className="modal-overlay"
   onClick={onClose}
 >
<div
className="modal-box"
onClick={(e) =>
e.stopPropagation()
}
>

```
    <button
      className="modal-close"
      onClick={onClose}
      type="button"
    >
      <X size={18} />
    </button>

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
        Picha Yako
        {' '}
        (itaonekana kwenye mkataba)
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
              Bofya kupakia picha
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
            profaili. Bofya juu
            kubadilisha picha.
          </p>
        )}

      {!user?.profile_photo &&
        !photo && (
          <p
            style={{
              fontSize: 12,
              color:
                'var(--danger)',
              marginTop: 6,
            }}
          >
            Tafadhali pakia picha
            kabla ya kuwasilisha
            ombi.
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
        Maelezo ya Ziada
        {' '}
        (si lazima)
      </label>

      <textarea
        placeholder="Andika chochote unachotaka meneja aone..."
        value={notes}
        onChange={(e) =>
          setNotes(e.target.value)
        }
      />

      <button
        type="submit"
        className="btn-primary"
        disabled={
          submitting ||
          (!photo &&
            !user?.profile_photo)
        }
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
