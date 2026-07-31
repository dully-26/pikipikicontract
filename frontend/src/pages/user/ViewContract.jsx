import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  CheckCircle,
  XCircle,
  Download,
  FileText,
  AlertTriangle
} from 'lucide-react';

import api from '../../api/axios';
import { storageUrl } from '../../utils/storage';
import { downloadPdf } from '../../utils/downloadPdf';

export default function ViewContract() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [contract, setContract] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [processing, setProcessing] = useState(false);
  const [showRejectBox, setShowRejectBox] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  const fetchContract = async () => {
    setLoading(true);
    setError('');

    try {
      const res = await api.get(`/contracts/${id}`);
      setContract(res.data);
    } catch (err) {
      setError(
        err.response?.data?.message ||
        'Imeshindwa kupata taarifa za mkataba'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContract();
  }, [id]);

  const handleAccept = async () => {
    setProcessing(true);
    setError('');

    try {
      const res = await api.post(`/contracts/${id}/accept`);

      setContract(res.data);

      setMessage(
        'Umekubali masharti ya mkataba. Sasa unaweza kupakua nakala yako.'
      );
    } catch (err) {
      setError(
        err.response?.data?.message ||
        'Imeshindwa kukubali mkataba'
      );
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    setProcessing(true);
    setError('');

    try {
      await api.post(`/contracts/${id}/reject`, {
        reason: rejectReason
      });

      setMessage(
        'Umekataa mkataba huu. Umesitishwa kwa mafanikio.'
      );

      setShowRejectBox(false);

      setTimeout(() => {
        navigate('/payments');
      }, 1800);

    } catch (err) {
      setError(
        err.response?.data?.message ||
        'Imeshindwa kusitisha mkataba'
      );
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="page">
        <p style={{ color: 'var(--text-muted)' }}>
          Inapakia mkataba...
        </p>
      </div>
    );
  }

  if (error && !contract) {
    return (
      <div className="page">
        <div className="alert-error">
          {error}
        </div>
      </div>
    );
  }

  if (!contract) {
    return null;
  }

  const isAccepted = !!contract.accepted_at;
  const isTerminated = contract.status === 'terminated';
  const isCompleted = contract.status === 'completed';

  /*
   * Applicant photo
   *
   * This works with both:
   *
   * 1. Old Laravel storage:
   *    applicant_photos/photo.png
   *
   * 2. Cloudinary:
   *    https://res.cloudinary.com/...
   */
  const applicantPhoto =
    contract.contractRequest?.applicant_photo
      ? storageUrl(contract.contractRequest.applicant_photo)
      : null;

  return (
    <div className="page">

      {/* PAGE HEADER */}
      <div className="page-header">
        <div>
          <h1>
            Mkataba #{contract.id}
          </h1>

          <p className="page-subtitle">
            Soma kwa makini kabla ya kukubali au kukataa
          </p>
        </div>

        <Link
          to="/payments"
          className="btn-small"
        >
          Rudi Nyuma
        </Link>
      </div>


      {/* ALERTS */}
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


      {/* TERMINATED */}
      {isTerminated && (
        <div className="contract-status-banner banner-danger">
          <XCircle size={18} />

          <span>
            Mkataba huu umesitishwa
            {contract.rejection_reason
              ? `: ${contract.rejection_reason}`
              : '.'}
          </span>
        </div>
      )}


      {/* COMPLETED */}
      {isCompleted && (
        <div className="contract-status-banner banner-success">
          <CheckCircle size={18} />

          <span>
            Mkataba huu umekamilika —
            malipo yote yamefanyika.
          </span>
        </div>
      )}


      {/* ACCEPTED */}
      {!isTerminated &&
        !isCompleted &&
        isAccepted && (
          <div className="contract-status-banner banner-success">
            <CheckCircle size={18} />

            <span>
              Umekubali mkataba huu tarehe{' '}
              {new Date(
                contract.accepted_at
              ).toLocaleDateString()}.
            </span>
          </div>
        )}


      {/* NOT ACCEPTED */}
      {!isTerminated &&
        !isCompleted &&
        !isAccepted && (
          <div className="contract-status-banner banner-warning">
            <AlertTriangle size={18} />

            <span>
              Bado hujakubali masharti ya mkataba huu.
              Soma kwa makini kisha chagua hapa chini.
            </span>
          </div>
        )}


      {/* CONTRACT */}
      <div className="contract-read-box">

        {/* APPLICANT PHOTO */}
        {applicantPhoto && (
          <div className="contract-photo-header">

            <img
              src={applicantPhoto}
              alt="Applicant"
              loading="lazy"
              onError={(event) => {
                event.currentTarget.style.display = 'none';
              }}
            />

            <div>
              <h3>
                {contract.user?.full_name || 'Applicant'}
              </h3>

              <p>
                {contract.user?.phone || ''}
              </p>
            </div>

          </div>
        )}


        {/* MOTORCYCLE */}
        <h3 className="contract-section-title">
          Taarifa za Pikipiki
        </h3>

        <div className="detail-grid">

          <div>
            <span className="detail-label">
              Brand / Model
            </span>

            <span className="detail-value">
              {contract.motorcycle?.brand}{' '}
              {contract.motorcycle?.model}
            </span>
          </div>

          <div>
            <span className="detail-label">
              Mwaka
            </span>

            <span className="detail-value">
              {contract.motorcycle?.year}
            </span>
          </div>

          <div>
            <span className="detail-label">
              Tarehe ya Kuanza
            </span>

            <span className="detail-value">
              {contract.start_date}
            </span>
          </div>

          <div>
            <span className="detail-label">
              Tarehe ya Mwisho
            </span>

            <span className="detail-value">
              {contract.end_date || 'Haijawekwa'}
            </span>
          </div>

        </div>


        {/* AMOUNTS */}
        <div
          className="contract-amounts"
          style={{ margin: '16px 0' }}
        >

          <div>
            <span className="amount-label">
              Jumla
            </span>

            <span className="amount-value">
              TZS{' '}
              {Number(
                contract.total_amount
              ).toLocaleString()}
            </span>
          </div>

          <div>
            <span className="amount-label">
              Kilicholipwa
            </span>

            <span
              className="amount-value"
              style={{
                color: 'var(--success)'
              }}
            >
              TZS{' '}
              {Number(
                contract.paid_amount
              ).toLocaleString()}
            </span>
          </div>

          <div>
            <span className="amount-label">
              Kinachobaki
            </span>

            <span className="amount-value balance-highlight">
              TZS{' '}
              {Number(
                contract.balance
              ).toLocaleString()}
            </span>
          </div>

        </div>


        {/* WITNESS */}
        <h3 className="contract-section-title">
          Shahidi
        </h3>

        <div className="detail-grid">

          <div>
            <span className="detail-label">
              Jina
            </span>

            <span className="detail-value">
              {contract.witnesses?.[0]?.full_name}
            </span>
          </div>

          <div>
            <span className="detail-label">
              NIDA
            </span>

            <span className="detail-value">
              {contract.witnesses?.[0]?.nida_number}
            </span>
          </div>

          <div>
            <span className="detail-label">
              Simu
            </span>

            <span className="detail-value">
              {contract.witnesses?.[0]?.phone}
            </span>
          </div>

          <div>
            <span className="detail-label">
              Anwani
            </span>

            <span className="detail-value">
              {contract.witnesses?.[0]?.address}
            </span>
          </div>

        </div>


        {/* GUARANTOR */}
        <h3 className="contract-section-title">
          Mdhamini
        </h3>

        <div className="detail-grid">

          <div>
            <span className="detail-label">
              Jina
            </span>

            <span className="detail-value">
              {contract.guarantors?.[0]?.full_name}
            </span>
          </div>

          <div>
            <span className="detail-label">
              NIDA
            </span>

            <span className="detail-value">
              {contract.guarantors?.[0]?.nida_number}
            </span>
          </div>

          <div>
            <span className="detail-label">
              Simu
            </span>

            <span className="detail-value">
              {contract.guarantors?.[0]?.phone}
            </span>
          </div>

          <div>
            <span className="detail-label">
              Anwani
            </span>

            <span className="detail-value">
              {contract.guarantors?.[0]?.address}
            </span>
          </div>

        </div>


        {/* TERMS */}
        <h3 className="contract-section-title">
          Masharti Muhimu ya Mkataba
        </h3>

        <ol className="contract-terms-list">

          <li>
            Mteja anawajibika kulipa kiasi
            kilichokubaliwa (cha kila siku au
            kila mwezi) ndani ya muda uliopangwa
            kwenye mkataba huu.
          </li>

          <li>
            Endapo Mteja atashindwa kulipa
            malipo yanayostahili kwa muda wa
            siku saba (7) mfululizo baada ya
            tarehe ya mwisho ya mkataba, bila
            taarifa rasmi au sababu za msingi
            zinazokubalika na Kampuni, Meneja
            ana haki kamili ya kusitisha mkataba
            huu mara moja.
          </li>

          <li>
            <strong>
              Endapo mkataba utasitishwa kutokana
              na kuchelewa au kushindwa kulipa,
              pikipiki itarejeshwa mara moja kwa
              Kampuni, na malipo yote yaliyokwisha
              fanywa na Mteja hadi wakati huo
              HAYATARUDISHWA kwa namna yoyote ile.
            </strong>
          </li>

          <li>
            Mteja anawajibika kuitunza pikipiki
            katika hali nzuri na kuiendesha kwa
            mujibu wa sheria za usalama barabarani.
            Uharibifu wowote utakaosababishwa na
            uzembe utagharamiwa na Mteja.
          </li>

          <li>
            Shahidi na Mdhamini waliotajwa kwenye
            mkataba huu wanawajibika kushirikiana
            na Kampuni endapo Mteja atashindwa
            kutimiza wajibu wake wa kimkataba.
          </li>

          <li>
            Kampuni inayo haki ya kufuatilia na
            kudai malipo yaliyobaki hata baada ya
            mkataba kusitishwa, endapo uharibifu
            au hasara itatokea kwa upande wa
            Kampuni.
          </li>

          <li>
            Mkataba huu unasimamiwa na sheria
            za Jamhuri ya Muungano wa Tanzania.
          </li>

        </ol>


        {/* WARNING */}
        <div className="warning-box-inline">

          <strong>
            Onyo:
          </strong>{' '}

          Kwa kubofya "Nakubali Masharti"
          hapa chini, unathibitisha kuwa
          umesoma, umeelewa, na unakubaliana
          na masharti yote yaliyoainishwa hapo juu.

        </div>


        {/* ISSUED BY */}
        {contract.issuedBy && (
          <div className="issued-by-footer">

            Mkataba huu ulitolewa na{' '}

            <strong>
              {contract.issuedBy.full_name}
            </strong>{' '}

            tarehe{' '}

            {new Date(
              contract.created_at
            ).toLocaleDateString()}

          </div>
        )}

      </div>


      {/* ACTION AREA */}
      {!isTerminated &&
        !isCompleted && (

          <div className="contract-actions-box">

            {!isAccepted ? (

              <>
                {!showRejectBox ? (

                  <div
                    style={{
                      display: 'flex',
                      gap: 10,
                      flexWrap: 'wrap'
                    }}
                  >

                    <button
                      className="btn-primary"
                      style={{
                        flex: 1,
                        minWidth: 220
                      }}
                      disabled={processing}
                      onClick={handleAccept}
                    >

                      <CheckCircle
                        size={16}
                        style={{
                          marginRight: 6,
                          verticalAlign: 'middle'
                        }}
                      />

                      {processing
                        ? 'Inashughulikia...'
                        : 'Nakubali Masharti'}

                    </button>


                    <button
                      className="btn-outline-danger"
                      style={{
                        flex: 1,
                        minWidth: 220
                      }}
                      onClick={() =>
                        setShowRejectBox(true)
                      }
                    >

                      <XCircle
                        size={16}
                        style={{
                          marginRight: 6,
                          verticalAlign: 'middle'
                        }}
                      />

                      Sikubaliani — Situa Mkataba

                    </button>

                  </div>

                ) : (

                  <div className="reject-box">

                    <label
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        display: 'block',
                        marginBottom: 6
                      }}
                    >
                      Kwa nini unakataa mkataba huu?
                      (si lazima)
                    </label>


                    <textarea
                      placeholder="Andika sababu yako..."
                      value={rejectReason}
                      onChange={(e) =>
                        setRejectReason(e.target.value)
                      }
                    />


                    <div
                      style={{
                        display: 'flex',
                        gap: 8,
                        marginTop: 10
                      }}
                    >

                      <button
                        className="btn-small btn-reject"
                        disabled={processing}
                        onClick={handleReject}
                      >

                        {processing
                          ? 'Inashughulikia...'
                          : 'Thibitisha Kukataa'}

                      </button>


                      <button
                        className="btn-small"
                        onClick={() =>
                          setShowRejectBox(false)
                        }
                      >
                        Ghairi
                      </button>

                    </div>

                  </div>

                )}

              </>

            ) : (

              <button
                className="btn-primary"
                onClick={() =>
                  downloadPdf(
                    `/contracts/${contract.id}/pdf`,
                    `mkataba-${contract.id}.pdf`
                  )
                }
              >

                <Download
                  size={16}
                  style={{
                    marginRight: 6,
                    verticalAlign: 'middle'
                  }}
                />

                Pakua Mkataba (PDF)

              </button>

            )}

          </div>

        )}


      {/* TERMINATED / COMPLETED DOWNLOAD */}
      {(isTerminated || isCompleted) && (

        <div className="contract-actions-box">

          <button
            className="btn-outline-primary"
            onClick={() =>
              downloadPdf(
                `/contracts/${contract.id}/pdf`,
                `mkataba-${contract.id}.pdf`
              )
            }
          >

            <FileText
              size={16}
              style={{
                marginRight: 6,
                verticalAlign: 'middle'
              }}
            />

            Pakua Nakala ya Mkataba

          </button>

        </div>

      )}

    </div>
  );
}

