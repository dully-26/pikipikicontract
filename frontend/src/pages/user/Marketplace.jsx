import { useEffect, useState } from 'react';
import api from '../../api/axios';
import LocationViewer from '../../components/LocationViewer';

export default function Marketplace() {
  const [motorcycles, setMotorcycles] = useState([]);
  const [search, setSearch] = useState('');
  const [message, setMessage] = useState('');
  const [expandedMap, setExpandedMap] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchListings = async () => {
    setLoading(true);

    try {
      const res = await api.get('/marketplace', {
        params: { search },
      });

      setMotorcycles(res.data.data || []);
    } catch (err) {
      console.error('Failed to load marketplace:', err);

      setMessage(
        err.response?.data?.message ||
        'Failed to load motorcycles.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchListings();
  }, [search]);

  const requestPurchase = async (motorcycleId) => {
    try {
      await api.post('/marketplace/purchase-requests', {
        motorcycle_id: motorcycleId,
      });

      setMessage('Purchase request sent to seller!');
    } catch (err) {
      setMessage(
        err.response?.data?.message ||
        'Request failed'
      );
    }
  };

  /*
   * Cloudinary already returns a complete URL.
   * Do NOT prepend localhost/storage/.
   */
  const getImageUrl = (photo) => {
    if (!photo) {
      return null;
    }

    // Cloudinary or any other complete URL
    if (
      photo.startsWith('http://') ||
      photo.startsWith('https://') ||
      photo.startsWith('//')
    ) {
      return photo;
    }

    // Fallback for old Laravel local-storage images
    return `http://127.0.0.1:8000/storage/${photo.replace(/^\/+/, '')}`;
  };

  return (
    <div className="page">

      {/* =========================================================
          HEADER
      ========================================================= */}
      <div className="page-header">
        <div>
          <h1>Motorcycle Marketplace</h1>

          <p className="page-subtitle">
            Browse motorcycles available for sale
          </p>
        </div>

        <input
          className="search-input"
          placeholder="Search brand or model..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* =========================================================
          MESSAGE
      ========================================================= */}
      {message && (
        <div className="alert-success">
          {message}
        </div>
      )}

      {/* =========================================================
          LOADING
      ========================================================= */}
      {loading ? (
        <p style={{ color: 'var(--text-muted)' }}>
          Loading motorcycles...
        </p>
      ) : motorcycles.length === 0 ? (

        /* =======================================================
           EMPTY STATE
        ======================================================= */
        <div className="empty-state">
          <div className="empty-state-icon">
            🏍️
          </div>

          <p>
            No motorcycles available for sale.
          </p>
        </div>

      ) : (

        /* =======================================================
           MOTORCYCLE CARDS
        ======================================================= */
        <div className="card-grid">

          {motorcycles.map((m) => {

            const imageUrl = getImageUrl(
              m.photos?.[0]
            );

            return (
              <div
                className="motorcycle-card"
                key={m.id}
              >

                {/* =================================================
                    IMAGE
                ================================================= */}
                <div className="card-image">

                  {imageUrl ? (

                    <img
                      src={imageUrl}
                      alt={`${m.brand} ${m.model}`}
                      loading="lazy"
                      style={{
                        width: '100%',
                        height: '220px',
                        objectFit: 'cover',
                        display: 'block',
                      }}
                      onError={(e) => {
                        console.error(
                          'Motorcycle image failed to load:',
                          imageUrl
                        );

                        e.currentTarget.style.display =
                          'none';

                        const parent =
                          e.currentTarget.parentElement;

                        if (parent) {
                          parent.classList.add(
                            'image-error'
                          );
                        }
                      }}
                    />

                  ) : (

                    <div className="no-image">
                      🏍️ No Image
                    </div>

                  )}

                </div>

                {/* =================================================
                    CARD BODY
                ================================================= */}
                <div className="card-body">

                  <h3>
                    {m.brand} {m.model}
                  </h3>

                  <p className="year">
                    {m.year} • {m.condition}
                  </p>

                  <p className="total-price">
                    TZS{' '}
                    {Number(
                      m.sale_price || 0
                    ).toLocaleString()}
                  </p>

                  {/* =================================================
                      SELLER
                  ================================================= */}
                  <p
                    style={{
                      fontSize: 12,
                      color: '#6b7280',
                      marginBottom: 10,
                    }}
                  >
                    Seller:{' '}
                    {m.owner?.full_name || 'Unknown'}{' '}
                    •{' '}
                    {m.owner?.phone || 'N/A'}
                  </p>

                  {/* =================================================
                      LOCATION
                  ================================================= */}
                  {m.location_name && (
                    <p
                      style={{
                        fontSize: 12,
                        marginBottom: 6,
                      }}
                    >
                      📍 {m.location_name}
                    </p>
                  )}

                  {/* =================================================
                      ACTIONS
                  ================================================= */}
                  <div
                    style={{
                      display: 'flex',
                      gap: 8,
                    }}
                  >

                    <button
                      className="btn-primary"
                      onClick={() =>
                        requestPurchase(m.id)
                      }
                    >
                      Request to Buy
                    </button>

                    {m.latitude != null &&
                      m.longitude != null && (

                        <button
                          className="btn-small"
                          onClick={() =>
                            setExpandedMap(
                              expandedMap === m.id
                                ? null
                                : m.id
                            )
                          }
                        >
                          {expandedMap === m.id
                            ? 'Hide Map'
                            : 'View Map'}
                        </button>

                      )}

                  </div>

                  {/* =================================================
                      MAP
                  ================================================= */}
                  {expandedMap === m.id && (
                    <div
                      style={{
                        marginTop: 10,
                      }}
                    >
                      <LocationViewer
                        latitude={m.latitude}
                        longitude={m.longitude}
                        label={`${m.brand} ${m.model}`}
                      />
                    </div>
                  )}

                </div>
              </div>
            );
          })}

        </div>
      )}
    </div>
  );
}

