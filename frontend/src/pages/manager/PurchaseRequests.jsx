import { useEffect, useState } from 'react';
import api from '../../api/axios';
import {
  X,
  Eye,
  Mail,
  Phone,
  MapPin,
  User,
} from 'lucide-react';

export default function PurchaseRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [detailsRequest, setDetailsRequest] = useState(null);
  const [message, setMessage] = useState('');

  const fetchRequests = async () => {
    setLoading(true);

    try {
      const res = await api.get('/marketplace/requests');

      setRequests(res.data.data || []);
    } catch (err) {
      console.error('Failed to load purchase requests:', err);

      setMessage(
        err.response?.data?.message ||
        'Failed to load purchase requests.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const openDetailsModal = (request) => {
    setDetailsRequest(request);
  };

  const handleStatus = async (id, status) => {
    try {
      await api.patch(
        `/marketplace/requests/${id}/status`,
        { status }
      );

      setMessage(
        `Purchase request ${status} successfully.`
      );

      fetchRequests();

    } catch (err) {
      console.error('Failed to update purchase request:', err);

      setMessage(
        err.response?.data?.message ||
        'Failed to update request.'
      );
    }
  };

  return (
    <div className="page">

      {/* HEADER */}
      <div className="page-header">
        <div>
          <h1>Purchase Requests</h1>

          <p className="page-subtitle">
            Review motorcycle purchase requests and buyer details
          </p>
        </div>
      </div>

      {message && (
        <div className="alert-success">
          {message}
        </div>
      )}

      {/* LOADING */}
      {loading ? (

        <p style={{ color: 'var(--text-muted)' }}>
          Loading purchase requests...
        </p>

      ) : requests.length === 0 ? (

        <div className="empty-state">

          <div className="empty-state-icon">
            🏍️
          </div>

          <p>
            No purchase requests found.
          </p>

        </div>

      ) : (

        /* TABLE */
        <div className="table-wrapper">

          <table className="data-table">

            <thead>
              <tr>
                <th>Buyer</th>
                <th>Motorcycle</th>
                <th>Price</th>
                <th>Requested</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>

              {requests.map((r) => (

                <tr key={r.id}>

                  {/* BUYER */}
                  <td>

                    <button
                      className="customer-name-link"
                      onClick={() =>
                        openDetailsModal(r)
                      }
                    >

                      <Eye size={13} />

                      {r.buyer?.full_name ||
                        'Unknown Buyer'}

                    </button>

                  </td>

                  {/* MOTORCYCLE */}
                  <td>

                    {r.motorcycle?.brand}{' '}
                    {r.motorcycle?.model}

                    <div
                      style={{
                        fontSize: 11,
                        color: 'var(--text-muted)',
                        marginTop: 3,
                      }}
                    >
                      {r.motorcycle?.year}
                    </div>

                  </td>

                  {/* PRICE */}
                  <td>

                    TZS{' '}

                    {Number(
                      r.offer_price || 0
                    ).toLocaleString()}

                  </td>

                  {/* DATE */}
                  <td>

                    {r.created_at
                      ? new Date(
                          r.created_at
                        ).toLocaleDateString()
                      : 'N/A'}

                  </td>

                  {/* STATUS */}
                  <td>

                    <span
                      className={`status-badge status-${r.status}`}
                    >
                      {r.status}
                    </span>

                  </td>

                  {/* ACTION */}
                  <td>

                    {r.status === 'pending' && (
                      <>
                        <button
                          className="btn-small btn-approve"
                          onClick={() =>
                            handleStatus(
                              r.id,
                              'approved'
                            )
                          }
                        >
                          Approve
                        </button>

                        <button
                          className="btn-small btn-reject"
                          onClick={() =>
                            handleStatus(
                              r.id,
                              'rejected'
                            )
                          }
                        >
                          Reject
                        </button>
                      </>
                    )}

                    {r.status === 'approved' && (

                      <button
                        className="btn-small btn-approve"
                        onClick={() =>
                          handleStatus(
                            r.id,
                            'completed'
                          )
                        }
                      >
                        Complete
                      </button>

                    )}

                    {r.status === 'rejected' && (
                      <span
                        style={{
                          color:
                            'var(--text-muted)',
                          fontSize: 12.5,
                        }}
                      >
                        —
                      </span>
                    )}

                    {r.status === 'completed' && (
                      <span
                        style={{
                          color:
                            'var(--text-muted)',
                          fontSize: 12.5,
                        }}
                      >
                        Completed
                      </span>
                    )}

                  </td>

                </tr>

              ))}

            </tbody>

          </table>

        </div>

      )}

      {/* =========================================================
          BUYER DETAILS MODAL
      ========================================================= */}

      {detailsRequest && (

        <div
          className="modal-overlay"
          onClick={() =>
            setDetailsRequest(null)
          }
        >

          <div
            className="modal-box"
            onClick={(e) =>
              e.stopPropagation()
            }
            style={{
              maxWidth: 460,
            }}
          >

            <button
              className="modal-close"
              onClick={() =>
                setDetailsRequest(null)
              }
            >
              <X size={18} />
            </button>

            <div className="customer-details-header">

              <div className="customer-avatar-lg">

                {detailsRequest.buyer?.full_name
                  ?.split(' ')
                  .map((n) => n[0])
                  .slice(0, 2)
                  .join('')
                  .toUpperCase()}

              </div>

              <div>

                <h2
                  style={{
                    marginBottom: 2,
                  }}
                >
                  {detailsRequest.buyer?.full_name}
                </h2>

                <p
                  style={{
                    fontSize: 12.5,
                    color:
                      'var(--text-muted)',
                  }}
                >
                  Motorcycle buyer
                </p>

              </div>

            </div>

            {/* BUYER DETAILS */}

            <div className="customer-details-list">

              <div className="customer-detail-item">

                <Mail size={16} />

                <div>

                  <span className="detail-label">
                    Email
                  </span>

                  <span className="detail-value">
                    {detailsRequest.buyer?.email ||
                      'Not provided'}
                  </span>

                </div>

              </div>

              <div className="customer-detail-item">

                <Phone size={16} />

                <div>

                  <span className="detail-label">
                    Phone
                  </span>

                  <span className="detail-value">
                    {detailsRequest.buyer?.phone ||
                      'Not provided'}
                  </span>

                </div>

              </div>

              <div className="customer-detail-item">

                <MapPin size={16} />

                <div>

                  <span className="detail-label">
                    Address
                  </span>

                  <span className="detail-value">
                    {detailsRequest.buyer?.address ||
                      'Not provided'}
                  </span>

                </div>

              </div>

              <div className="customer-detail-item">

                <User size={16} />

                <div>

                  <span className="detail-label">
                    Motorcycle
                  </span>

                  <span className="detail-value">

                    {detailsRequest.motorcycle?.brand}{' '}
                    {detailsRequest.motorcycle?.model}{' '}

                    (
                    {detailsRequest.motorcycle?.year}
                    )

                  </span>

                </div>

              </div>

              <div className="customer-detail-item">

                <User size={16} />

                <div>

                  <span className="detail-label">
                    Purchase Price
                  </span>

                  <span className="detail-value">

                    TZS{' '}

                    {Number(
                      detailsRequest.offer_price ||
                        0
                    ).toLocaleString()}

                  </span>

                </div>

              </div>

            </div>

          </div>

        </div>

      )}

    </div>
  );
}