
import { useEffect, useState } from 'react';
import api from '../../api/axios';
import { storageUrl } from '../../utils/storage';
import { Plus, Pencil, Trash2, X } from 'lucide-react';
import { validateMotorcycleForm } from '../../utils/validation';

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
  const [photos, setPhotos] = useState([]);

  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

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

      setMessage('Failed to load motorcycles');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMotorcycles();
  }, [search]);

  /*
   * ============================================================
   * ADD MODAL
   * ============================================================
   */

  const openAddModal = () => {
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
    setForm({
      brand: m.brand || '',
      model: m.model || '',
      year: m.year || '',

      daily_price:
        m.daily_price !== null && m.daily_price !== undefined
          ? m.daily_price
          : '',

      monthly_price:
        m.monthly_price !== null && m.monthly_price !== undefined
          ? m.monthly_price
          : '',

      total_contract_price:
        m.total_contract_price !== null &&
        m.total_contract_price !== undefined
          ? m.total_contract_price
          : '',

      sale_price:
        m.sale_price !== null && m.sale_price !== undefined
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
   * IMAGE SELECTION
   * ============================================================
   */

  const handlePhotoChange = (e) => {
    const files = Array.from(e.target.files || []);

    /*
     * Only allow images
     */
    const imageFiles = files.filter((file) =>
      file.type.startsWith('image/')
    );

    /*
     * Maximum 5MB per image
     */
    const validFiles = imageFiles.filter(
      (file) => file.size <= 5 * 1024 * 1024
    );

    if (validFiles.length !== imageFiles.length) {
      setErrors({
        photos: 'Each image must be an image file and maximum 5MB.',
      });
    } else {
      setErrors((prev) => ({
        ...prev,
        photos: undefined,
      }));
    }

    setPhotos(validFiles);
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
     * Frontend validation
     */
    const errs = validateMotorcycleForm(form);

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    /*
     * Make sure image is selected when adding.
     * Remove this check if images should be optional.
     */
    if (!editingId && photos.length === 0) {
      setErrors({
        photos: 'Please select at least one motorcycle image.',
      });

      return;
    }

    setSubmitting(true);

    try {
      /*
       * ========================================================
       * EDIT MOTORCYCLE
       * ========================================================
       */

      if (editingId) {
        await api.put(
          `/motorcycles/${editingId}`,
          {
            brand: form.brand,
            model: form.model,
            year: form.year,

            daily_price:
              form.listing_type === 'contract'
                ? form.daily_price
                : null,

            monthly_price:
              form.listing_type === 'contract'
                ? form.monthly_price
                : null,

            total_contract_price:
              form.listing_type === 'contract'
                ? form.total_contract_price
                : null,

            sale_price:
              form.listing_type === 'sale'
                ? form.sale_price
                : null,

            condition: form.condition,

            description: form.description,
          }
        );

        setMessage('Motorcycle updated successfully');
      }

      /*
       * ========================================================
       * ADD MOTORCYCLE
       * ========================================================
       */

      else {
        const data = new FormData();

        /*
         * Basic fields
         */
        data.append('brand', String(form.brand));
        data.append('model', String(form.model));
        data.append('year', String(form.year));
        data.append('condition', String(form.condition));
        data.append('listing_type', String(form.listing_type));

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
         * Contract
         */
        if (form.listing_type === 'contract') {
          data.append(
            'daily_price',
            String(form.daily_price)
          );

          data.append(
            'monthly_price',
            String(form.monthly_price)
          );

          data.append(
            'total_contract_price',
            String(form.total_contract_price)
          );
        }

        /*
         * Sale
         */
        if (form.listing_type === 'sale') {
          data.append(
            'sale_price',
            String(form.sale_price)
          );
        }

        /*
         * ======================================================
         * PHOTOS
         * ======================================================
         *
         * Laravel expects:
         *
         * photos[]
         *
         * Each selected File is appended separately.
         */

        photos.forEach((file) => {
          data.append('photos[]', file, file.name);
        });

        /*
         * DEBUG
         *
         * Open browser console and you should see:
         *
         * brand ...
         * model ...
         * photos[] File
         */

        console.log('========== MOTORCYCLE FORM DATA ==========');

        for (const [key, value] of data.entries()) {
          console.log(
            key,
            value instanceof File
              ? {
                  name: value.name,
                  type: value.type,
                  size: value.size,
                }
              : value
          );
        }

        console.log('==========================================');

        /*
         * IMPORTANT:
         * Do NOT specify Content-Type here.
         *
         * Axios/browser will automatically create:
         *
         * multipart/form-data;
         * boundary=---------------------------
         */

        await api.post(
          '/motorcycles',
          data
        );

        setMessage(
          'Motorcycle added successfully'
        );
      }

      /*
       * Close modal
       */
      setShowModal(false);

      /*
       * Clear form
       */
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

        Object.keys(apiErrors).forEach((key) => {
          flat[key] =
            apiErrors[key][0];
        });

        setErrors(flat);

        /*
         * Also show general Laravel message
         */
        if (err.response?.data?.message) {
          setErrors((prev) => ({
            ...prev,
            general:
              err.response.data.message,
          }));
        }
      }

      /*
       * General error
       */
      else {
        setErrors({
          general:
            err.response?.data?.message ||
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

  const changeStatus = async (id, status) => {
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
        err.response?.data?.message ||
        'Failed to update motorcycle status'
      );
    }
  };

  /*
   * ============================================================
   * DELETE
   * ============================================================
   */

  const deleteMotorcycle = async (id) => {
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
        err.response?.data?.message ||
        'Failed to remove motorcycle'
      );
    }
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
            Add, edit, and manage all motorcycles in the system
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
              setSearch(e.target.value)
            }
          />

          <button
            className="btn-outline-primary"
            onClick={openAddModal}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              whiteSpace: 'nowrap',
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
            color: 'var(--text-muted)',
          }}
        >
          Loading motorcycles...
        </p>

      ) : motorcycles.length === 0 ? (

        <div className="empty-state">

          <div className="empty-state-icon">
            🏍️
          </div>

          <p>
            No motorcycles found.
            Click "Add Motorcycle" to create one.
          </p>

        </div>

      ) : (

        <div className="card-grid">

          {motorcycles.map((m) => (

            <div
              className="motorcycle-card"
              key={m.id}
            >

              <div className="card-image">

                {m.photos?.[0] ? (

                  <img
                    src={storageUrl(m.photos[0])}
                    alt={`${m.brand} ${m.model}`}
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
                  {m.brand} {m.model}
                </h3>

                <p className="year">
                  {m.year}
                  {' • '}
                  {m.condition}
                  {' • '}
                  {m.listing_type}
                </p>

                {m.listing_type === 'contract' ? (

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
                  value={m.status}
                  onChange={(e) =>
                    changeStatus(
                      m.id,
                      e.target.value
                    )
                  }
                  style={{
                    width: '100%',
                    padding: 8,
                    marginBottom: 10,
                    borderRadius: 8,
                    border:
                      '1px solid var(--border)',
                    fontSize: 12.5,
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
                      openEditModal(m)
                    }
                  >
                    <Pencil
                      size={13}
                      style={{
                        verticalAlign:
                          'middle',
                        marginRight: 4,
                      }}
                    />

                    Edit
                  </button>

                  <button
                    className="btn-small btn-delete"
                    onClick={() =>
                      deleteMotorcycle(m.id)
                    }
                  >
                    <Trash2
                      size={13}
                      style={{
                        verticalAlign:
                          'middle',
                        marginRight: 4,
                      }}
                    />

                    Delete
                  </button>

                </div>

              </div>

            </div>

          ))}

        </div>

      )}

      {showModal && (

        <div
          className="modal-overlay"
          onClick={() =>
            setShowModal(false)
          }
        >

          <div
            className="modal-box"
            style={{
              position: 'relative',
            }}
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            <button
              className="modal-close"
              onClick={() =>
                setShowModal(false)
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
              onSubmit={handleSubmit}
              className="contract-form"
              style={{
                padding: 0,
                boxShadow: 'none',
                border: 'none',
              }}
            >

              <input
                placeholder="Brand"
                value={form.brand}
                onChange={(e) =>
                  setForm({
                    ...form,
                    brand: e.target.value,
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
                value={form.model}
                onChange={(e) =>
                  setForm({
                    ...form,
                    model: e.target.value,
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
                value={form.year}
                onChange={(e) =>
                  setForm({
                    ...form,
                    year: e.target.value,
                  })
                }
              />

              {errors.year && (
                <span className="field-error">
                  {errors.year}
                </span>
              )}

              <select
                value={form.condition}
                onChange={(e) =>
                  setForm({
                    ...form,
                    condition: e.target.value,
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
                value={form.listing_type}
                onChange={(e) =>
                  setForm({
                    ...form,
                    listing_type:
                      e.target.value,
                  })
                }
                disabled={!!editingId}
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
                          e.target.value,
                      })
                    }
                  />

                  {errors.daily_price && (
                    <span className="field-error">
                      {errors.daily_price}
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
                          e.target.value,
                      })
                    }
                  />

                  {errors.monthly_price && (
                    <span className="field-error">
                      {errors.monthly_price}
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
                          e.target.value,
                      })
                    }
                  />

                  {errors.total_contract_price && (
                    <span className="field-error">
                      {errors.total_contract_price}
                    </span>
                  )}

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
                          e.target.value,
                      })
                    }
                  />

                  {errors.sale_price && (
                    <span className="field-error">
                      {errors.sale_price}
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
                      e.target.value,
                  })
                }
                rows={3}
              />

              {!editingId && (

                <>

                  <input
                    type="file"
                    multiple
                    accept="image/jpeg,image/png,image/webp,image/jpg"
                    onChange={
                      handlePhotoChange
                    }
                  />

                  {errors.photos && (
                    <span className="field-error">
                      {errors.photos}
                    </span>
                  )}

                  {photos.length > 0 && (

                    <div
                      style={{
                        fontSize: 12,
                        color:
                          'var(--text-muted)',
                        marginTop: -4,
                        marginBottom: 8,
                      }}
                    >

                      {photos.length}
                      {' '}
                      photo(s) selected

                      <div
                        style={{
                          marginTop: 5,
                        }}
                      >

                        {photos.map(
                          (photo, index) => (

                            <div
                              key={`${photo.name}-${index}`}
                            >
                              {photo.name}
                              {' — '}
                              {(
                                photo.size /
                                1024 /
                                1024
                              ).toFixed(2)}
                              {' MB'}
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
                disabled={submitting}
                style={{
                  marginTop: 16,
                }}
              >

                {submitting
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

