import { useEffect, useState } from 'react';
import api from '../../api/axios';
import { storageUrl } from '../../utils/storage';
import { Plus, Pencil, Trash2, X } from 'lucide-react';
import { validateMotorcycleForm } from '../../utils/validation';
import imageCompression from 'browser-image-compression';

const emptyForm = {
  brand: '',
  model: '',
  year: '',
  daily_price: '',
  monthly_price: '',
  total_contract_price: '',
  sale_price: '',
  condition: 'used',
  listing_type: 'contract',
  description: '',
};

export default function MotorcycleManagement() {
  const [motorcycles, setMotorcycles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [form, setForm] = useState(emptyForm);

  // Original/compressed selected images
  const [photos, setPhotos] = useState([]);

  // Preview URLs
  const [photoPreviews, setPhotoPreviews] = useState([]);

  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState('');

  // Separate states
  const [submitting, setSubmitting] = useState(false);
  const [processingImages, setProcessingImages] = useState(false);

  /*
   * ============================================================
   * LOAD MOTORCYCLES
   * ============================================================
   */

  const fetchMotorcycles = async () => {
    setLoading(true);

    try {
      const res = await api.get('/motorcycles', {
        params: {
          search,
        },
      });

      setMotorcycles(res.data.data || res.data);
    } catch (err) {
      console.error('Fetch motorcycles error:', err);

      setMessage(
        err.response?.data?.message ||
          'Failed to load motorcycles'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMotorcycles();
  }, [search]);

  /*
   * ============================================================
   * CLEAN PREVIEW URLS
   * ============================================================
   */

  useEffect(() => {
    return () => {
      photoPreviews.forEach((url) => {
        URL.revokeObjectURL(url);
      });
    };
  }, [photoPreviews]);

  /*
   * ============================================================
   * ADD MODAL
   * ============================================================
   */

  const openAddModal = () => {
    clearPhotoPreviews();

    setForm({
      ...emptyForm,
    });

    setPhotos([]);
    setEditingId(null);
    setErrors({});
    setMessage('');
    setShowModal(true);
  };

  /*
   * ============================================================
   * EDIT MODAL
   * ============================================================
   */

  const openEditModal = (m) => {
    clearPhotoPreviews();

    setForm({
      brand: m.brand || '',
      model: m.model || '',
      year: m.year || '',

      daily_price:
        m.daily_price !== null &&
        m.daily_price !== undefined
          ? m.daily_price
          : '',

      monthly_price:
        m.monthly_price !== null &&
        m.monthly_price !== undefined
          ? m.monthly_price
          : '',

      total_contract_price:
        m.total_contract_price !== null &&
        m.total_contract_price !== undefined
          ? m.total_contract_price
          : '',

      sale_price:
        m.sale_price !== null &&
        m.sale_price !== undefined
          ? m.sale_price
          : '',

      condition: m.condition || 'used',

      listing_type:
        m.listing_type || 'contract',

      description: m.description || '',
    });

    setPhotos([]);
    setEditingId(m.id);
    setErrors({});
    setMessage('');
    setShowModal(true);
  };

  /*
   * ============================================================
   * CLEAR PHOTO PREVIEWS
   * ============================================================
   */

  const clearPhotoPreviews = () => {
    setPhotoPreviews((oldPreviews) => {
      oldPreviews.forEach((url) => {
        try {
          URL.revokeObjectURL(url);
        } catch (error) {
          console.warn(
            'Failed to revoke preview URL:',
            error
          );
        }
      });

      return [];
    });
  };

  /*
   * ============================================================
   * IMAGE COMPRESSION
   * ============================================================
   *
   * Mobile-friendly compression.
   *
   * Target:
   * - Maximum approximately 0.8MB
   * - Maximum dimension 1200px
   * - JPEG for better mobile compatibility
   *
   * We first try Web Worker.
   * If the browser fails, we retry without Web Worker.
   */

  const compressImage = async (file) => {
    const options = {
      maxSizeMB: 0.8,
      maxWidthOrHeight: 1200,

      // Better compatibility on phones
      fileType: 'image/jpeg',

      // Good quality while keeping file small
      initialQuality: 0.78,

      // Try worker first
      useWebWorker: true,

      // Avoid keeping huge images in memory
      alwaysKeepResolution: false,
    };

    try {
      const compressedBlob =
        await imageCompression(
          file,
          options
        );

      const originalName =
        file.name
          .replace(/\.[^/.]+$/, '')
          .replace(/[^a-zA-Z0-9_-]/g, '_') ||
        'motorcycle-image';

      return new File(
        [compressedBlob],
        `${originalName}.jpg`,
        {
          type: 'image/jpeg',
          lastModified: Date.now(),
        }
      );
    } catch (workerError) {
      /*
       * ========================================================
       * FALLBACK
       * ========================================================
       *
       * Some mobile browsers may fail with Web Worker.
       * Retry without Web Worker.
       */

      console.warn(
        'Web Worker compression failed. Retrying without worker...',
        workerError
      );

      try {
        const fallbackOptions = {
          maxSizeMB: 0.8,
          maxWidthOrHeight: 1200,
          fileType: 'image/jpeg',
          initialQuality: 0.72,
          useWebWorker: false,
          alwaysKeepResolution: false,
        };

        const compressedBlob =
          await imageCompression(
            file,
            fallbackOptions
          );

        const originalName =
          file.name
            .replace(/\.[^/.]+$/, '')
            .replace(
              /[^a-zA-Z0-9_-]/g,
              '_'
            ) || 'motorcycle-image';

        return new File(
          [compressedBlob],
          `${originalName}.jpg`,
          {
            type: 'image/jpeg',
            lastModified: Date.now(),
          }
        );
      } catch (fallbackError) {
        console.error(
          'Fallback image compression failed:',
          fallbackError
        );

        throw new Error(
          `Failed to process ${file.name}. Please try a different image.`
        );
      }
    }
  };

  /*
   * ============================================================
   * IMAGE SELECTION
   * ============================================================
   */

  const handlePhotoChange = async (e) => {
    const input = e.target;
    const files = Array.from(
      input.files || []
    );

    if (files.length === 0) {
      return;
    }

    setErrors((prev) => ({
      ...prev,
      photos: undefined,
    }));

    setProcessingImages(true);

    try {
      /*
       * --------------------------------------------------------
       * Only images
       * --------------------------------------------------------
       */

      const imageFiles = files.filter(
        (file) =>
          file.type &&
          file.type.startsWith('image/')
      );

      if (
        imageFiles.length !== files.length
      ) {
        throw new Error(
          'Only image files are allowed.'
        );
      }

      /*
       * --------------------------------------------------------
       * Maximum number of photos
       * --------------------------------------------------------
       */

      if (imageFiles.length > 6) {
        throw new Error(
          'You can select a maximum of 6 images.'
        );
      }

      /*
       * --------------------------------------------------------
       * Maximum original file size
       *
       * We allow large phone photos but avoid
       * extremely huge files that can crash
       * mobile browsers during compression.
       * --------------------------------------------------------
       */

      for (const file of imageFiles) {
        if (
          file.size >
          25 * 1024 * 1024
        ) {
          throw new Error(
            `${file.name} is larger than 25MB. Please choose a smaller image.`
          );
        }
      }

      /*
       * --------------------------------------------------------
       * Compress images
       * --------------------------------------------------------
       */

      const compressedFiles = [];

      for (
        let index = 0;
        index < imageFiles.length;
        index++
      ) {
        const file = imageFiles[index];

        console.log(
          `Processing image ${index + 1}/${imageFiles.length}:`,
          file.name
        );

        console.log(
          'Original:',
          `${(
            file.size /
            1024 /
            1024
          ).toFixed(2)} MB`
        );

        const compressedFile =
          await compressImage(file);

        console.log(
          'Compressed:',
          `${(
            compressedFile.size /
            1024 /
            1024
          ).toFixed(2)} MB`
        );

        /*
         * Final backend safety limit
         */

        if (
          compressedFile.size >
          5 * 1024 * 1024
        ) {
          throw new Error(
            `${file.name} could not be compressed below 5MB.`
          );
        }

        compressedFiles.push(
          compressedFile
        );
      }

      /*
       * --------------------------------------------------------
       * Create previews
       * --------------------------------------------------------
       */

      clearPhotoPreviews();

      const previewUrls =
        compressedFiles.map((file) =>
          URL.createObjectURL(file)
        );

      setPhotoPreviews(
        previewUrls
      );

      /*
       * --------------------------------------------------------
       * Save compressed files
       * --------------------------------------------------------
       */

      setPhotos(
        compressedFiles
      );

      setErrors((prev) => ({
        ...prev,
        photos: undefined,
      }));

    } catch (error) {
      console.error(
        'Image processing error:',
        error
      );

      clearPhotoPreviews();

      setPhotos([]);

      setErrors({
        photos:
          error?.message ||
          'Failed to process the selected images. Please try again.',
      });

    } finally {
      setProcessingImages(false);

      /*
       * Allow user to select
       * the same image again.
       */

      input.value = '';
    }
  };

  /*
   * ============================================================
   * REMOVE SELECTED PHOTO
   * ============================================================
   */

  const removePhoto = (index) => {
    const newPhotos = photos.filter(
      (_, i) => i !== index
    );

    const newPreviews =
      photoPreviews.filter(
        (_, i) => i !== index
      );

    /*
     * Revoke removed preview URL
     */

    if (photoPreviews[index]) {
      try {
        URL.revokeObjectURL(
          photoPreviews[index]
        );
      } catch (error) {
        console.warn(
          'Preview cleanup failed:',
          error
        );
      }
    }

    setPhotos(newPhotos);
    setPhotoPreviews(newPreviews);
  };

  /*
   * ============================================================
   * SUBMIT
   * ============================================================
   */

  const handleSubmit = async (e) => {
    e.preventDefault();

    setErrors({});
    setMessage('');

    /*
     * Do not submit while images are processing.
     */

    if (processingImages) {
      setErrors({
        general:
          'Please wait for the images to finish processing.',
      });

      return;
    }

    /*
     * Frontend validation
     */

    const errs =
      validateMotorcycleForm(form);

    if (
      Object.keys(errs).length > 0
    ) {
      setErrors(errs);
      return;
    }

    /*
     * Image required when adding.
     */

    if (
      !editingId &&
      photos.length === 0
    ) {
      setErrors({
        photos:
          'Please select at least one motorcycle image.',
      });

      return;
    }

    setSubmitting(true);

    try {
      /*
       * ========================================================
       * EDIT MOTORCYCLE
       * ========================================================
       *
       * IMPORTANT:
       * For SALE:
       * contract prices must NOT be sent as null.
       *
       * Database columns are NOT nullable.
       */

      if (editingId) {
        const updateData = {
          brand: form.brand,
          model: form.model,
          year: form.year,

          condition:
            form.condition,

          description:
            form.description || null,
        };

        /*
         * CONTRACT
         */

        if (
          form.listing_type ===
          'contract'
        ) {
          updateData.daily_price =
            form.daily_price || 0;

          updateData.monthly_price =
            form.monthly_price || 0;

          updateData.total_contract_price =
            form.total_contract_price || 0;

          /*
           * Sale price must be numeric
           * because database may also be
           * configured as non-null.
           */

          updateData.sale_price =
            form.sale_price || 0;
        }

        /*
         * SALE
         */

        else {
          /*
           * IMPORTANT FIX:
           *
           * Do NOT send null for
           * daily_price/monthly_price/
           * total_contract_price.
           */

          updateData.daily_price = 0;

          updateData.monthly_price = 0;

          updateData.total_contract_price = 0;

          updateData.sale_price =
            form.sale_price || 0;
        }

        console.log(
          'Updating motorcycle:',
          updateData
        );

        await api.put(
          `/motorcycles/${editingId}`,
          updateData
        );

        setMessage(
          'Motorcycle updated successfully.'
        );
      }

      /*
       * ========================================================
       * ADD MOTORCYCLE
       * ========================================================
       */

      else {
        const data =
          new FormData();

        /*
         * Basic fields
         */

        data.append(
          'brand',
          String(form.brand)
        );

        data.append(
          'model',
          String(form.model)
        );

        data.append(
          'year',
          String(form.year)
        );

        data.append(
          'condition',
          String(form.condition)
        );

        data.append(
          'listing_type',
          String(form.listing_type)
        );

        /*
         * Description
         */

        if (form.description) {
          data.append(
            'description',
            String(form.description)
          );
        }

        /*
         * ------------------------------------------------------
         * CONTRACT
         * ------------------------------------------------------
         */

        if (
          form.listing_type ===
          'contract'
        ) {
          data.append(
            'daily_price',
            String(
              form.daily_price
            )
          );

          data.append(
            'monthly_price',
            String(
              form.monthly_price
            )
          );

          data.append(
            'total_contract_price',
            String(
              form.total_contract_price
            )
          );

          /*
           * Keep sale price as 0
           * if database column is NOT NULL.
           */

          data.append(
            'sale_price',
            '0'
          );
        }

        /*
         * ------------------------------------------------------
         * SALE
         * ------------------------------------------------------
         */

        if (
          form.listing_type ===
          'sale'
        ) {
          /*
           * Database-safe values.
           */

          data.append(
            'daily_price',
            '0'
          );

          data.append(
            'monthly_price',
            '0'
          );

          data.append(
            'total_contract_price',
            '0'
          );

          data.append(
            'sale_price',
            String(
              form.sale_price
            )
          );
        }

        /*
         * ------------------------------------------------------
         * PHOTOS
         * ------------------------------------------------------
         */

        photos.forEach(
          (file) => {
            data.append(
              'photos[]',
              file,
              file.name
            );
          }
        );

        /*
         * DEBUG
         */

        console.log(
          '========== MOTORCYCLE FORM DATA =========='
        );

        for (
          const [
            key,
            value
          ] of data.entries()
        ) {
          console.log(
            key,
            value instanceof File
              ? {
                  name:
                    value.name,
                  type:
                    value.type,
                  size:
                    `${(
                      value.size /
                      1024 /
                      1024
                    ).toFixed(
                      2
                    )} MB`,
                }
              : value
          );
        }

        console.log(
          '=========================================='
        );

        /*
         * Axios will automatically
         * create multipart boundary.
         */

        await api.post(
          '/motorcycles',
          data
        );

        setMessage(
          'Motorcycle added successfully.'
        );
      }

      /*
       * ========================================================
       * CLEAN UP
       * ========================================================
       */

      clearPhotoPreviews();

      setShowModal(false);

      setForm({
        ...emptyForm,
      });

      setPhotos([]);

      setEditingId(null);

      /*
       * Reload motorcycles
       */

      await fetchMotorcycles();

    } catch (err) {
      console.error(
        'Motorcycle submit error:',
        err
      );

      console.error(
        'Response:',
        err.response?.data
      );

      /*
       * Laravel validation errors
       */

      const apiErrors =
        err.response?.data?.errors;

      if (apiErrors) {
        const flat = {};

        Object.keys(
          apiErrors
        ).forEach((key) => {
          flat[key] =
            Array.isArray(
              apiErrors[key]
            )
              ? apiErrors[key][0]
              : apiErrors[key];
        });

        setErrors(flat);

        if (
          err.response?.data
            ?.message
        ) {
          setErrors(
            (prev) => ({
              ...prev,
              general:
                err.response
                  .data
                  .message,
            })
          );
        }
      }

      /*
       * Cloudinary error
       */

      else if (
        err.response?.data
          ?.error
      ) {
        setErrors({
          general:
            err.response.data
              .message ||
            'Image upload failed.',

          photos:
            err.response.data
              .error,
        });
      }

      /*
       * General error
       */

      else {
        setErrors({
          general:
            err.response?.data
              ?.message ||
            err.message ||
            'Operation failed. Please try again.',
        });
      }

    } finally {
      setSubmitting(false);
    }
  };

  /*
   * ============================================================
   * STATUS
   * ============================================================
   */

  const changeStatus = async (
    id,
    status
  ) => {
    try {
      await api.patch(
        `/motorcycles/${id}/status`,
        {
          status,
        }
      );

      await fetchMotorcycles();

    } catch (err) {
      console.error(
        'Status update error:',
        err
      );

      setMessage(
        err.response?.data
          ?.message ||
          'Failed to update motorcycle status'
      );
    }
  };

  /*
   * ============================================================
   * DELETE
   * ============================================================
   */

  const deleteMotorcycle = async (
    id
  ) => {
    if (
      !window.confirm(
        'Are you sure you want to remove this motorcycle?'
      )
    ) {
      return;
    }

    try {
      await api.delete(
        `/motorcycles/${id}`
      );

      setMessage(
        'Motorcycle removed'
      );

      await fetchMotorcycles();

    } catch (err) {
      console.error(
        'Delete error:',
        err
      );

      setMessage(
        err.response?.data
          ?.message ||
          'Failed to remove motorcycle'
      );
    }
  };

  /*
   * ============================================================
   * CLOSE MODAL
   * ============================================================
   */

  const closeModal = () => {
    if (
      submitting ||
      processingImages
    ) {
      return;
    }

    clearPhotoPreviews();

    setShowModal(false);
    setPhotos([]);
    setEditingId(null);
    setErrors({});
  };

  /*
   * ============================================================
   * RENDER
   * ============================================================
   */

  return (
    <div className="page">

      <div className="page-header">

        <div>
          <h1>
            Motorcycle Management
          </h1>

          <p className="page-subtitle">
            Add, edit, and manage all
            motorcycles in the system
          </p>
        </div>

        <div
          style={{
            display: 'flex',
            gap: 10,
          }}
        >

          <input
            className="search-input"
            placeholder="Search brand or model..."
            value={search}
            onChange={(e) =>
              setSearch(
                e.target.value
              )
            }
          />

          <button
            className="btn-outline-primary"
            onClick={openAddModal}
            style={{
              display: 'flex',
              alignItems:
                'center',
              gap: 6,
              whiteSpace:
                'nowrap',
            }}
          >
            <Plus size={16} />

            Add Motorcycle
          </button>

        </div>

      </div>

      {message && (
        <div className="alert-success">
          {message}
        </div>
      )}

      {loading ? (

        <p
          style={{
            color:
              'var(--text-muted)',
          }}
        >
          Loading motorcycles...
        </p>

      ) : motorcycles.length ===
        0 ? (

        <div className="empty-state">

          <div className="empty-state-icon">
            🏍️
          </div>

          <p>
            No motorcycles found.
            Click "Add Motorcycle"
            to create one.
          </p>

        </div>

      ) : (

        <div className="card-grid">

          {motorcycles.map(
            (m) => (

              <div
                className="motorcycle-card"
                key={m.id}
              >

                <div className="card-image">

                  {m.photos?.[0] ? (

                    <img
                      src={storageUrl(
                        m.photos[0]
                      )}
                      alt={`${m.brand} ${m.model}`}
                      loading="lazy"
                    />

                  ) : (

                    <div className="no-image">
                      🏍️ No Image
                    </div>

                  )}

                  <span
                    className={`status-badge status-${m.status}`}
                  >
                    {m.status}
                  </span>

                </div>

                <div className="card-body">

                  <h3>
                    {m.brand}{' '}
                    {m.model}
                  </h3>

                  <p className="year">
                    {m.year}
                    {' • '}
                    {m.condition}
                    {' • '}
                    {m.listing_type}
                  </p>

                  {m.listing_type ===
                  'contract' ? (

                    <>

                      <div className="price-row">

                        <span>
                          Daily:
                          {' '}
                          TZS
                          {' '}
                          {Number(
                            m.daily_price
                          ).toLocaleString()}
                        </span>

                        <span>
                          Monthly:
                          {' '}
                          TZS
                          {' '}
                          {Number(
                            m.monthly_price
                          ).toLocaleString()}
                        </span>

                      </div>

                      <p className="total-price">
                        TZS
                        {' '}
                        {Number(
                          m.total_contract_price
                        ).toLocaleString()}
                      </p>

                    </>

                  ) : (

                    <p className="total-price">
                      TZS
                      {' '}
                      {Number(
                        m.sale_price
                      ).toLocaleString()}
                    </p>

                  )}

                  <select
                    value={
                      m.status
                    }
                    onChange={(
                      e
                    ) =>
                      changeStatus(
                        m.id,
                        e.target
                          .value
                      )
                    }
                    style={{
                      width:
                        '100%',
                      padding: 8,
                      marginBottom:
                        10,
                      borderRadius:
                        8,
                      border:
                        '1px solid var(--border)',
                      fontSize:
                        12.5,
                    }}
                  >

                    <option value="available">
                      Available
                    </option>

                    <option value="rented">
                      Rented
                    </option>

                    <option value="sold">
                      Sold
                    </option>

                    <option value="maintenance">
                      Under Maintenance
                    </option>

                  </select>

                  <div className="card-actions">

                    <button
                      className="btn-small btn-edit"
                      onClick={() =>
                        openEditModal(
                          m
                        )
                      }
                    >
                      <Pencil
                        size={13}
                        style={{
                          verticalAlign:
                            'middle',
                          marginRight:
                            4,
                        }}
                      />

                      Edit
                    </button>

                    <button
                      className="btn-small btn-delete"
                      onClick={() =>
                        deleteMotorcycle(
                          m.id
                        )
                      }
                    >
                      <Trash2
                        size={13}
                        style={{
                          verticalAlign:
                            'middle',
                          marginRight:
                            4,
                        }}
                      />

                      Delete
                    </button>

                  </div>

                </div>

              </div>

            )
          )}

        </div>

      )}

      {showModal && (

        <div
          className="modal-overlay"
          onClick={closeModal}
        >

          <div
            className="modal-box"
            style={{
              position:
                'relative',
            }}
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            <button
              className="modal-close"
              onClick={closeModal}
              disabled={
                submitting ||
                processingImages
              }
            >
              <X size={18} />
            </button>

            <h2>
              {editingId
                ? 'Edit Motorcycle'
                : 'Add New Motorcycle'}
            </h2>

            {errors.general && (

              <div className="alert-error">
                {errors.general}
              </div>

            )}

            <form
              onSubmit={
                handleSubmit
              }
              className="contract-form"
              style={{
                padding: 0,
                boxShadow:
                  'none',
                border: 'none',
              }}
            >

              <input
                placeholder="Brand"
                value={
                  form.brand
                }
                onChange={(e) =>
                  setForm({
                    ...form,
                    brand:
                      e.target
                        .value,
                  })
                }
              />

              {errors.brand && (
                <span className="field-error">
                  {errors.brand}
                </span>
              )}

              <input
                placeholder="Model"
                value={
                  form.model
                }
                onChange={(e) =>
                  setForm({
                    ...form,
                    model:
                      e.target
                        .value,
                  })
                }
              />

              {errors.model && (
                <span className="field-error">
                  {errors.model}
                </span>
              )}

              <input
                type="number"
                placeholder="Year"
                value={
                  form.year
                }
                onChange={(e) =>
                  setForm({
                    ...form,
                    year:
                      e.target
                        .value,
                  })
                }
              />

              {errors.year && (
                <span className="field-error">
                  {errors.year}
                </span>
              )}

              <select
                value={
                  form.condition
                }
                onChange={(e) =>
                  setForm({
                    ...form,
                    condition:
                      e.target
                        .value,
                  })
                }
              >

                <option value="new">
                  New
                </option>

                <option value="used">
                  Used
                </option>

              </select>

              <select
                value={
                  form.listing_type
                }
                onChange={(e) =>
                  setForm({
                    ...form,
                    listing_type:
                      e.target
                        .value,
                  })
                }
                disabled={
                  !!editingId
                }
              >

                <option value="contract">
                  For Contract
                </option>

                <option value="sale">
                  For Sale
                </option>

              </select>

              {form.listing_type ===
              'contract' ? (

                <>

                  <input
                    type="number"
                    placeholder="Daily Price (TZS)"
                    value={
                      form.daily_price
                    }
                    onChange={(e) =>
                      setForm({
                        ...form,
                        daily_price:
                          e.target
                            .value,
                      })
                    }
                  />

                  {errors.daily_price && (
                    <span className="field-error">
                      {
                        errors.daily_price
                      }
                    </span>
                  )}

                  <input
                    type="number"
                    placeholder="Monthly Price (TZS)"
                    value={
                      form.monthly_price
                    }
                    onChange={(e) =>
                      setForm({
                        ...form,
                        monthly_price:
                          e.target
                            .value,
                      })
                    }
                  />

                  {errors.monthly_price && (
                    <span className="field-error">
                      {
                        errors.monthly_price
                      }
                    </span>
                  )}

                  <input
                    type="number"
                    placeholder="Total Contract Price (TZS)"
                    value={
                      form.total_contract_price
                    }
                    onChange={(e) =>
                      setForm({
                        ...form,
                        total_contract_price:
                          e.target
                            .value,
                      })
                    }
                  />

                  {
                    errors.total_contract_price && (
                      <span className="field-error">
                        {
                          errors.total_contract_price
                        }
                      </span>
                    )
                  }

                </>

              ) : (

                <>

                  <input
                    type="number"
                    placeholder="Selling Price (TZS)"
                    value={
                      form.sale_price
                    }
                    onChange={(e) =>
                      setForm({
                        ...form,
                        sale_price:
                          e.target
                            .value,
                      })
                    }
                  />

                  {errors.sale_price && (
                    <span className="field-error">
                      {
                        errors.sale_price
                      }
                    </span>
                  )}

                </>

              )}

              <textarea
                placeholder="Description (optional)"
                value={
                  form.description
                }
                onChange={(e) =>
                  setForm({
                    ...form,
                    description:
                      e.target
                        .value,
                  })
                }
                rows={3}
              />

              {!editingId && (

                <>

                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    capture="environment"
                    onChange={
                      handlePhotoChange
                    }
                    disabled={
                      processingImages ||
                      submitting
                    }
                  />

                  <small
                    style={{
                      display:
                        'block',
                      marginTop:
                        6,
                      marginBottom:
                        8,
                      color:
                        'var(--text-muted)',
                      lineHeight:
                        1.5,
                    }}
                  >
                    Photos are automatically
                    compressed to reduce
                    mobile data usage and
                    upload time.
                  </small>

                  {processingImages && (

                    <div
                      style={{
                        padding:
                          '10px 12px',
                        borderRadius:
                          8,
                        background:
                          'rgba(0,0,0,0.04)',
                        marginBottom:
                          10,
                        fontSize:
                          13,
                      }}
                    >
                      ⏳ Processing images...
                      Please wait.
                    </div>

                  )}

                  {errors.photos && (
                    <span className="field-error">
                      {
                        errors.photos
                      }
                    </span>
                  )}

                  {photos.length >
                    0 && (

                    <div
                      style={{
                        marginTop:
                          8,
                        marginBottom:
                          10,
                      }}
                    >

                      <strong
                        style={{
                          fontSize:
                            13,
                        }}
                      >
                        {photos.length}
                        {' '}
                        photo(s) ready
                      </strong>

                      <div
                        style={{
                          display:
                            'grid',
                          gridTemplateColumns:
                            'repeat(auto-fill, minmax(100px, 1fr))',
                          gap: 8,
                          marginTop:
                            8,
                        }}
                      >

                        {photos.map(
                          (
                            photo,
                            index
                          ) => (

                            <div
                              key={`${photo.name}-${index}`}
                              style={{
                                position:
                                  'relative',
                                borderRadius:
                                  8,
                                overflow:
                                  'hidden',
                                border:
                                  '1px solid var(--border)',
                              }}
                            >

                              {photoPreviews[
                                index
                              ] && (

                                <img
                                  src={
                                    photoPreviews[
                                      index
                                    ]
                                  }
                                  alt={`Preview ${index + 1}`}
                                  style={{
                                    width:
                                      '100%',
                                    height:
                                      90,
                                    objectFit:
                                      'cover',
                                    display:
                                      'block',
                                  }}
                                />

                              )}

                              <button
                                type="button"
                                onClick={() =>
                                  removePhoto(
                                    index
                                  )
                                }
                                disabled={
                                  processingImages ||
                                  submitting
                                }
                                style={{
                                  position:
                                    'absolute',
                                  top: 4,
                                  right: 4,
                                  width:
                                    24,
                                  height:
                                    24,
                                  border:
                                    'none',
                                  borderRadius:
                                    '50%',
                                  background:
                                    'rgba(0,0,0,0.7)',
                                  color:
                                    '#fff',
                                  cursor:
                                    'pointer',
                                  display:
                                    'flex',
                                  alignItems:
                                    'center',
                                  justifyContent:
                                    'center',
                                }}
                              >
                                <X
                                  size={
                                    14
                                  }
                                />
                              </button>

                              <div
                                style={{
                                  padding:
                                    '4px 5px',
                                  fontSize:
                                    10,
                                  overflow:
                                    'hidden',
                                  textOverflow:
                                    'ellipsis',
                                  whiteSpace:
                                    'nowrap',
                                }}
                              >
                                {(
                                  photo.size /
                                  1024 /
                                  1024
                                ).toFixed(
                                  2
                                )}
                                {' MB'}
                              </div>

                            </div>

                          )
                        )}

                      </div>

                    </div>

                  )}

                </>

              )}

              <button
                type="submit"
                className="btn-primary"
                disabled={
                  submitting ||
                  processingImages
                }
                style={{
                  marginTop:
                    16,
                }}
              >

                {processingImages
                  ? 'Processing Images...'
                  : submitting
                  ? 'Uploading...'
                  : editingId
                  ? 'Save Changes'
                  : 'Add Motorcycle'}

              </button>

            </form>

          </div>

        </div>

      )}

    </div>
  );
}