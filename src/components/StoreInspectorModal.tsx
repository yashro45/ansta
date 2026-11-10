import React, { useState, useRef, useEffect } from 'react';
import { 
  X, 
  ShieldAlert, 
  AlertTriangle, 
  CheckCircle2, 
  AlertOctagon, 
  Camera, 
  Video,
  Play,
  Pause,
  Film,
  Plus,
  Star,
  MessageSquareQuote, 
  History, 
  Activity, 
  FileText, 
  Check, 
  XCircle, 
  Search, 
  Send, 
  TrendingDown, 
  Sparkles,
  Phone,
  Mail,
  MapPin,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  ZoomIn,
  ZoomOut,
  Eye,
  EyeOff,
  Volume2,
  VolumeX,
  Layers
} from 'lucide-react';
import { FranchiseStore, VisualViolationDetection } from '../types/franchise';
import { generateRiskExplanation, generateCureNoticeText } from '../services/apiClient';
import confetti from 'canvas-confetti';

interface StoreInspectorModalProps {
  store: FranchiseStore | null;
  onClose: () => void;
  onApproveAction: (storeNumber: number, actionType: string, note?: string) => void;
  onRejectAction: (storeNumber: number, note?: string) => void;
  onInvestigateAction: (storeNumber: number, note?: string) => void;
  onOpenMediaUpload?: (storeNumber: number) => void;
}

export const StoreInspectorModal: React.FC<StoreInspectorModalProps> = ({
  store,
  onClose,
  onApproveAction,
  onRejectAction,
  onInvestigateAction,
  onOpenMediaUpload,
}) => {
  if (!store) return null;

  const [activeTab, setActiveTab] = useState<'evidence' | 'reviews' | 'history'>('evidence');
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number>(0);
  const [showBoundingBoxes, setShowBoundingBoxes] = useState<boolean>(true);
  const [isCinemaMode, setIsCinemaMode] = useState<boolean>(false);
  const [isZoomed, setIsZoomed] = useState<boolean>(false);
  const [isGeneratingNotice, setIsGeneratingNotice] = useState<boolean>(false);
  const [cureNoticeContent, setCureNoticeContent] = useState<string>('');
  const [managerNote, setManagerNote] = useState<string>('');
  const [actionConfirmedMessage, setActionConfirmedMessage] = useState<string | null>(null);

  // Video playback controls
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(15);
  const [isMuted, setIsMuted] = useState<boolean>(true);

  // Thumbnail container ref for easy smooth scrolling
  const thumbnailScrollRef = useRef<HTMLDivElement | null>(null);

  const isCrit = store.riskLevel === 'critical';
  const isHigh = store.riskLevel === 'high';

  const currentPhoto = store.photos[selectedPhotoIndex] || store.photos[0];
  const isCurrentVideo = currentPhoto?.mediaType === 'video' || (currentPhoto?.videoUrl && (currentPhoto.videoUrl.endsWith('.mp4') || currentPhoto.videoUrl.endsWith('.webm')));

  // Reset zoom & play states on photo change
  useEffect(() => {
    setIsPlaying(false);
    setCurrentTime(0);
    setIsZoomed(false);
  }, [selectedPhotoIndex]);

  const scrollThumbnails = (direction: 'left' | 'right') => {
    if (thumbnailScrollRef.current) {
      const scrollAmount = direction === 'left' ? -260 : 260;
      thumbnailScrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const handleSeekVideo = (seconds: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = seconds;
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
        setIsPlaying(false);
      } else {
        videoRef.current.play();
        setIsPlaying(true);
      }
    }
  };

  const handleGenerateNotice = async () => {
    setIsGeneratingNotice(true);
    try {
      const res = await generateCureNoticeText({
        store,
        violations: store.photos.flatMap((p) => p.detectedViolations.map((v) => `${v.category}: ${v.label}`)),
      });
      setCureNoticeContent(res.noticeText);
    } catch (e) {
      console.error(e);
    } finally {
      setIsGeneratingNotice(false);
    }
  };

  const handleApprove = (type: string) => {
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.6 },
    });
    setActionConfirmedMessage(`Decision Logged: Physical Inspection Approved for Store #${store.storeNumber}. Auditor dispatched.`);
    onApproveAction(store.storeNumber, type, managerNote);
    setTimeout(() => {
      setActionConfirmedMessage(null);
    }, 4000);
  };

  const handleReject = () => {
    setActionConfirmedMessage(`Decision Logged: AI Flag Dismissed by Franchise Manager.`);
    onRejectAction(store.storeNumber, managerNote);
    setTimeout(() => {
      setActionConfirmedMessage(null);
    }, 4000);
  };

  const handleInvestigate = () => {
    setActionConfirmedMessage(`Investigation Flagged: Field Operations requested additional photo & POS logs.`);
    onInvestigateAction(store.storeNumber, managerNote);
    setTimeout(() => {
      setActionConfirmedMessage(null);
    }, 4000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div 
        className={`bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden flex flex-col transition-all duration-300 ${
          isCinemaMode 
            ? 'w-[98vw] h-[96vh] max-w-none' 
            : 'w-full max-w-6xl xl:max-w-7xl max-h-[94vh]'
        }`}
      >
        {/* Header - Clean, Focused, Uncluttered */}
        <div className="bg-slate-900 text-white px-5 sm:px-6 py-4 flex items-center justify-between gap-4 shrink-0 border-b border-slate-800">
          <div className="flex items-center gap-3.5 min-w-0">
            <div
              className={`w-11 h-11 rounded-xl flex flex-col items-center justify-center font-bold shrink-0 ${
                isCrit
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                  : isHigh
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
              }`}
            >
              <span className="text-base font-extrabold leading-none">{store.riskScore}</span>
              <span className="text-[8px] uppercase font-bold text-slate-400">/100</span>
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-bold text-white tracking-tight truncate">{store.name}</h2>
                <span
                  className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${
                    isCrit
                      ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                      : isHigh
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  }`}
                >
                  {store.riskLevel} Risk
                </span>
                <span className="text-xs text-slate-400 hidden sm:inline">•</span>
                <span className="text-xs text-slate-300 flex items-center gap-1 hidden sm:flex truncate">
                  <MapPin className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                  {store.location.city}, {store.location.state}
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-400 mt-0.5">
                <span>Operator: <strong className="text-slate-200">{store.operatorName}</strong></span>
                <span>•</span>
                <span>Phone: {store.operatorPhone}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {onOpenMediaUpload && (
              <button
                id="btn-inspector-add-media"
                onClick={() => onOpenMediaUpload(store.storeNumber)}
                className="hidden sm:flex items-center gap-1.5 bg-teal-600 hover:bg-teal-500 text-white px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Add Photo / Video</span>
              </button>
            )}

            <button
              onClick={() => setIsCinemaMode(!isCinemaMode)}
              title={isCinemaMode ? 'Exit Cinema View' : 'Expand Cinema View'}
              className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition-colors"
            >
              {isCinemaMode ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
            </button>

            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Confirmation Toast */}
        {actionConfirmedMessage && (
          <div className="bg-emerald-600 text-white px-6 py-2.5 text-xs font-bold flex items-center justify-between shrink-0 shadow-sm animate-fadeIn">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-200 shrink-0" />
              <span>{actionConfirmedMessage}</span>
            </div>
          </div>
        )}

        {/* Simplified High-Signal Tabs Bar */}
        <div className="bg-slate-50 px-5 sm:px-6 border-b border-slate-200 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('evidence')}
              className={`flex items-center gap-2 py-3 px-3.5 text-xs font-bold border-b-2 transition-colors ${
                activeTab === 'evidence'
                  ? 'border-teal-700 text-teal-900 bg-white shadow-xs rounded-t-lg'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              <Camera className="w-4 h-4 text-teal-700" />
              <span>Visual Evidence & Videos ({store.photos.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('reviews')}
              className={`flex items-center gap-2 py-3 px-3.5 text-xs font-bold border-b-2 transition-colors ${
                activeTab === 'reviews'
                  ? 'border-teal-700 text-teal-900 bg-white shadow-xs rounded-t-lg'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              <MessageSquareQuote className="w-4 h-4 text-teal-700" />
              <span>Customer Reviews ({store.reviews.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('history')}
              className={`flex items-center gap-2 py-3 px-3.5 text-xs font-bold border-b-2 transition-colors ${
                activeTab === 'history'
                  ? 'border-teal-700 text-teal-900 bg-white shadow-xs rounded-t-lg'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              <History className="w-4 h-4 text-teal-700" />
              <span>Audits & Cure Notice</span>
            </button>
          </div>

          <div className="hidden md:flex items-center gap-2 text-xs text-slate-500">
            <span className="font-semibold text-slate-700">AI Assessment:</span>
            <span className="text-slate-600 truncate max-w-sm">{store.aiRecommendation}</span>
          </div>
        </div>

        {/* Modal Main Content Area */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 bg-slate-100/60">
          {/* TAB 1: VISUAL EVIDENCE & VIDEO PLAYER (LARGE DISPLAY) */}
          {activeTab === 'evidence' && (
            <div className="space-y-4">
              {store.photos.length === 0 ? (
                <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 space-y-3 shadow-xs">
                  <Camera className="w-12 h-12 text-slate-300 mx-auto" />
                  <h3 className="text-base font-bold text-slate-800">No media streams recorded yet</h3>
                  <p className="text-slate-500 text-xs max-w-md mx-auto">
                    Upload customer photos or kitchen video streams to trigger AI compliance auditing.
                  </p>
                  {onOpenMediaUpload && (
                    <button
                      onClick={() => onOpenMediaUpload(store.storeNumber)}
                      className="inline-flex items-center gap-2 bg-teal-700 hover:bg-teal-800 text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-xs transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Upload First Customer Media</span>
                    </button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                  {/* Left Column: Massive Large-Screen Photo / Video Player */}
                  <div className="lg:col-span-8 flex flex-col space-y-3">
                    {/* Media Container Box */}
                    <div className="relative rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 shadow-md flex items-center justify-center min-h-[380px] sm:min-h-[460px] md:min-h-[500px] group">
                      {isCurrentVideo ? (
                        <div className="relative w-full h-full min-h-[380px] sm:min-h-[460px] md:min-h-[500px] flex items-center justify-center bg-black">
                          <video
                            ref={videoRef}
                            src={currentPhoto.videoUrl || currentPhoto.imageUrl}
                            playsInline
                            loop
                            muted={isMuted}
                            onTimeUpdate={(e) => {
                              setCurrentTime(e.currentTarget.currentTime);
                              if (e.currentTarget.duration) setDuration(e.currentTarget.duration);
                            }}
                            className="w-full h-full max-h-[600px] object-contain"
                          />

                          {/* Center Play Overlay Icon when paused */}
                          {!isPlaying && (
                            <button
                              onClick={togglePlay}
                              className="absolute inset-0 m-auto w-16 h-16 rounded-full bg-teal-600/90 hover:bg-teal-500 text-white flex items-center justify-center shadow-lg transition-transform hover:scale-110 z-20"
                            >
                              <Play className="w-8 h-8 fill-current ml-1" />
                            </button>
                          )}

                          {/* Large Video Controls Bar */}
                          <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent p-4 flex flex-col gap-2 z-30">
                            {/* Video Progress Bar */}
                            <div 
                              onClick={(e) => {
                                const rect = e.currentTarget.getBoundingClientRect();
                                const pos = (e.clientX - rect.left) / rect.width;
                                if (videoRef.current) {
                                  videoRef.current.currentTime = pos * (duration || 15);
                                }
                              }}
                              className="w-full h-2 bg-white/30 hover:h-2.5 rounded-full overflow-hidden cursor-pointer transition-all relative"
                            >
                              <div 
                                style={{ width: `${(currentTime / (duration || 15)) * 100}%` }}
                                className="h-full bg-teal-400 rounded-full"
                              />
                            </div>

                            <div className="flex items-center justify-between text-white text-xs">
                              <div className="flex items-center gap-3">
                                <button
                                  onClick={togglePlay}
                                  className="p-2 rounded-lg bg-white/20 hover:bg-white/30 text-white transition-colors"
                                >
                                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
                                </button>

                                <button
                                  onClick={() => setIsMuted(!isMuted)}
                                  className="p-2 rounded-lg bg-white/20 hover:bg-white/30 text-white transition-colors"
                                >
                                  {isMuted ? <VolumeX className="w-4 h-4 text-slate-300" /> : <Volume2 className="w-4 h-4 text-teal-300" />}
                                </button>

                                <span className="font-mono text-xs text-slate-200">
                                  {Math.floor(currentTime)}s / {Math.floor(duration || currentPhoto.durationSec || 15)}s
                                </span>
                              </div>

                              <div className="flex items-center gap-2">
                                <span className="bg-teal-900/90 border border-teal-500/60 text-teal-200 px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5">
                                  <Film className="w-3.5 h-3.5 text-teal-400" />
                                  <span>Customer Video Feed</span>
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="relative w-full h-full min-h-[380px] sm:min-h-[460px] md:min-h-[500px] flex items-center justify-center overflow-hidden">
                          <img
                            src={currentPhoto?.imageUrl}
                            alt={currentPhoto?.caption}
                            className={`w-full h-full max-h-[600px] object-contain transition-transform duration-200 ${
                              isZoomed ? 'scale-150 cursor-zoom-out' : 'cursor-zoom-in'
                            }`}
                            onClick={() => setIsZoomed(!isZoomed)}
                            referrerPolicy="no-referrer"
                          />
                        </div>
                      )}

                      {/* AI Bounding Box Overlays */}
                      {showBoundingBoxes && currentPhoto?.detectedViolations.map((v, i) => {
                        if (!v.boundingBox) return null;
                        return (
                          <div
                            key={v.id || i}
                            style={{
                              left: `${v.boundingBox.x}%`,
                              top: `${v.boundingBox.y}%`,
                              width: `${v.boundingBox.width}%`,
                              height: `${v.boundingBox.height}%`,
                            }}
                            className="absolute border-2 sm:border-3 border-rose-500 bg-rose-500/20 rounded-lg pointer-events-none transition-all flex flex-col justify-between p-1 z-20 shadow-sm"
                          >
                            <span className="bg-rose-600 text-white font-extrabold text-[10px] sm:text-xs px-2 py-0.5 rounded w-max shadow-md flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3" />
                              <span>{v.label}</span>
                            </span>
                          </div>
                        );
                      })}

                      {/* Top Overlay Controls Bar */}
                      <div className="absolute top-3 inset-x-3 flex items-center justify-between z-30 pointer-events-none">
                        <div className="flex items-center gap-2 pointer-events-auto">
                          <span className="bg-slate-900/90 backdrop-blur-md text-white text-xs font-bold px-3 py-1.5 rounded-lg border border-slate-700 shadow-md">
                            {currentPhoto?.zone}
                          </span>
                          {currentPhoto?.submittedBy && (
                            <span className="bg-teal-950/90 backdrop-blur-md text-teal-300 text-xs font-bold px-3 py-1.5 rounded-lg border border-teal-700 shadow-md">
                              {currentPhoto.submittedBy}
                            </span>
                          )}
                        </div>

                        {/* Interactive toggle controls */}
                        <div className="flex items-center gap-2 pointer-events-auto">
                          {currentPhoto?.detectedViolations.length > 0 && (
                            <button
                              onClick={() => setShowBoundingBoxes(!showBoundingBoxes)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 backdrop-blur-md transition-all shadow-md ${
                                showBoundingBoxes
                                  ? 'bg-rose-600 text-white border border-rose-500'
                                  : 'bg-slate-900/90 text-slate-300 hover:text-white border border-slate-700'
                              }`}
                            >
                              {showBoundingBoxes ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                              <span>{showBoundingBoxes ? 'AI Boxes: ON' : 'AI Boxes: OFF'}</span>
                            </button>
                          )}

                          {!isCurrentVideo && (
                            <button
                              onClick={() => setIsZoomed(!isZoomed)}
                              className="bg-slate-900/90 hover:bg-slate-800 text-slate-200 hover:text-white p-2 rounded-lg border border-slate-700 backdrop-blur-md transition-colors"
                              title={isZoomed ? 'Zoom Out' : 'Zoom In'}
                            >
                              {isZoomed ? <ZoomOut className="w-4 h-4" /> : <ZoomIn className="w-4 h-4" />}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Customer Review Quote banner if present */}
                    {currentPhoto?.customerComment && (
                      <div className="p-3.5 bg-amber-50/90 border border-amber-200 rounded-xl text-xs flex items-start justify-between gap-3 shadow-xs">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <MessageSquareQuote className="w-4 h-4 text-amber-800" />
                            <span className="font-bold text-amber-900">
                              Customer Feedback {currentPhoto.orderNumber ? `(${currentPhoto.orderNumber})` : ''}:
                            </span>
                          </div>
                          <p className="text-slate-800 text-xs italic leading-relaxed pl-6">
                            "{currentPhoto.customerComment}"
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Large, Easy-to-Scroll Media Thumbnails Carousel */}
                    <div className="space-y-2 pt-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                          <Film className="w-3.5 h-3.5 text-teal-700" />
                          <span>All Recorded Media ({store.photos.length} Streams)</span>
                        </span>
                        
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => scrollThumbnails('left')}
                            className="p-1.5 rounded-lg bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors shadow-xs"
                            title="Scroll Left"
                          >
                            <ChevronLeft className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => scrollThumbnails('right')}
                            className="p-1.5 rounded-lg bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors shadow-xs"
                            title="Scroll Right"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <div 
                        ref={thumbnailScrollRef}
                        className="flex gap-3 overflow-x-auto pb-2 pt-1 scroll-smooth"
                      >
                        {store.photos.map((p, idx) => {
                          const isVid = p.mediaType === 'video' || (p.videoUrl && p.videoUrl.endsWith('.mp4'));
                          const isSelected = selectedPhotoIndex === idx;
                          return (
                            <button
                              key={p.id || idx}
                              onClick={() => {
                                setSelectedPhotoIndex(idx);
                                setIsPlaying(false);
                              }}
                              className={`relative w-36 sm:w-44 h-24 sm:h-26 rounded-xl overflow-hidden border-2 shrink-0 transition-all text-left group shadow-xs ${
                                isSelected
                                  ? 'border-teal-700 ring-3 ring-teal-200 scale-[1.02] shadow-md'
                                  : 'border-slate-300 hover:border-teal-400 opacity-80 hover:opacity-100'
                              }`}
                            >
                              <img
                                src={p.imageUrl}
                                alt={p.caption}
                                className="w-full h-full object-cover"
                                referrerPolicy="no-referrer"
                              />

                              {/* Media Type Icon Badge */}
                              <div className="absolute top-1.5 left-1.5 px-2 py-0.5 rounded-md bg-black/80 backdrop-blur-xs text-white text-[10px] font-bold flex items-center gap-1">
                                {isVid ? <Video className="w-3 h-3 text-teal-400" /> : <Camera className="w-3 h-3 text-white" />}
                                <span>{isVid ? 'Video' : 'Photo'}</span>
                              </div>

                              {/* Violation Count Pill */}
                              {p.detectedViolations.length > 0 && (
                                <div className="absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded-md bg-rose-600 text-white text-[9px] font-extrabold shadow-xs">
                                  {p.detectedViolations.length} {p.detectedViolations.length === 1 ? 'flag' : 'flags'}
                                </div>
                              )}

                              <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent p-1.5 text-[10px] text-white font-semibold truncate">
                                {p.zone}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Right Column: High-Signal, Reduced Key Findings Panel */}
                  <div className="lg:col-span-4 space-y-4">
                    {/* Compact Cleanliness Score Card */}
                    <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                          AI Inspection Score
                        </span>
                        <span
                          className={`text-xs font-bold px-2.5 py-1 rounded-lg ${
                            currentPhoto?.aiStatus === 'flagged'
                              ? 'bg-rose-100 text-rose-700 border border-rose-200'
                              : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                          }`}
                        >
                          {currentPhoto?.aiStatus === 'flagged' ? 'Non-Compliant' : 'Compliant'}
                        </span>
                      </div>

                      <div className="flex items-center gap-3">
                        <div
                          className={`text-3xl font-extrabold ${
                            (currentPhoto?.overallCleanlinessScore || 0) < 60
                              ? 'text-rose-600'
                              : 'text-emerald-600'
                          }`}
                        >
                          {currentPhoto?.overallCleanlinessScore || 40}
                          <span className="text-sm font-semibold text-slate-400">/100</span>
                        </div>
                        <p className="text-xs text-slate-600 leading-snug">
                          {currentPhoto?.detectedViolations.length > 0
                            ? `${currentPhoto.detectedViolations.length} compliance infractions flagged.`
                            : 'All hygiene and branding baselines satisfied.'}
                        </p>
                      </div>
                    </div>

                    {/* Streamlined Violations List (No Clutter, Actionable Only) */}
                    <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                          <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                          <span>Detected Infractions ({currentPhoto?.detectedViolations.length || 0})</span>
                        </h3>
                        <span className="text-[11px] text-slate-500 font-medium">Click to jump in video</span>
                      </div>

                      {currentPhoto?.detectedViolations.length === 0 ? (
                        <div className="p-5 text-center bg-emerald-50/60 rounded-xl border border-emerald-200 text-emerald-800 space-y-1">
                          <CheckCircle2 className="w-6 h-6 text-emerald-600 mx-auto" />
                          <div className="text-xs font-bold">No Violations Found</div>
                          <div className="text-[11px] text-emerald-700">This photo/video stream satisfies franchise hygiene rules.</div>
                        </div>
                      ) : (
                        <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
                          {currentPhoto?.detectedViolations.map((v, i) => (
                            <div 
                              key={v.id || i}
                              className="p-3 bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-xl space-y-1.5 text-xs transition-colors"
                            >
                              <div className="flex items-start justify-between gap-2">
                                <span className="font-bold text-rose-800 text-xs">{v.label}</span>
                                {isCurrentVideo && v.timestampSec !== undefined && (
                                  <button
                                    onClick={() => handleSeekVideo(v.timestampSec!)}
                                    className="text-[10px] bg-teal-100 hover:bg-teal-200 text-teal-800 font-bold px-2 py-0.5 rounded-md transition-colors flex items-center gap-1 shrink-0"
                                  >
                                    <Play className="w-2.5 h-2.5 fill-current" />
                                    <span>Jump to 00:{v.timestampSec < 10 ? `0${v.timestampSec}` : v.timestampSec}s</span>
                                  </button>
                                )}
                              </div>
                              <p className="text-slate-600 text-[11px] leading-relaxed">{v.evidenceDescription}</p>
                              <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-200">
                                <span className="font-medium text-amber-800 truncate">{v.standardClause}</span>
                                <span className="font-bold uppercase text-rose-600">{v.severity}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Quick Cure Notice Trigger Card */}
                    <div className="p-4 bg-teal-50 border border-teal-200 rounded-2xl space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-teal-900">Formal Legal Action</span>
                        <span className="text-[10px] bg-teal-200/80 text-teal-900 px-2 py-0.5 rounded font-bold">14-Day Notice</span>
                      </div>
                      <p className="text-slate-600 text-[11px] leading-snug">
                        Generate official legal Cure Notice with auto-compiled photo and video timestamp evidence.
                      </p>
                      <button
                        onClick={() => {
                          setActiveTab('history');
                          handleGenerateNotice();
                        }}
                        className="w-full mt-1 bg-teal-800 hover:bg-teal-900 text-white font-bold py-2 rounded-xl transition-colors flex items-center justify-center gap-1.5 shadow-xs"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>Generate & View Cure Notice</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: CUSTOMER REVIEWS & FEEDBACK */}
          {activeTab === 'reviews' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Customer Sentiment Stream ({store.reviews.length} Reviews)
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Reviews mined from Zomato, Google Maps, and Customer App with NLP entity extraction.
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 px-3 py-1.5 rounded-xl">
                    {store.negativeReviewsCount30d} Negative Flags (30d)
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {store.reviews.map((rev) => (
                  <div key={rev.id} className="p-4 bg-white border border-slate-200 rounded-2xl space-y-2 text-xs shadow-xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">{rev.source}</span>
                        <div className="text-amber-500 flex">
                          {[...Array(rev.rating)].map((_, i) => (
                            <Star key={i} className="w-3 h-3 fill-current" />
                          ))}
                        </div>
                      </div>
                      <span className="text-slate-400 text-[11px]">{rev.timestamp}</span>
                    </div>

                    <p className="text-slate-800 italic leading-relaxed">"{rev.text}"</p>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px]">
                      <span className="text-teal-800 font-bold bg-teal-50 px-2 py-0.5 rounded">
                        {rev.extractedCategory}
                      </span>
                      <span className="uppercase font-bold text-rose-600">{rev.severity} Severity</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: AUDIT HISTORY & 14-DAY CURE NOTICE */}
          {activeTab === 'history' && (
            <div className="space-y-5">
              {/* Inspection Timeline */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Historical Physical Audits</h3>
                    <p className="text-xs text-slate-500 mt-0.5">Consecutive quarterly physical audit inspection logs.</p>
                  </div>
                  <span className="bg-rose-100 text-rose-800 font-bold text-xs px-3 py-1 rounded-xl border border-rose-200">
                    3rd Consecutive Flagged Inspection
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {store.inspections.map((insp) => (
                    <div key={insp.id} className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900">{insp.date}</span>
                        <span className="font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                          {insp.score}/100
                        </span>
                      </div>
                      <p className="text-slate-600 text-[11px] line-clamp-2">{insp.notes}</p>
                      <div className="text-[10px] text-slate-500 font-medium">Auditor: {insp.auditorName}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 14-Day Cure Notice Generator */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                      <FileText className="w-4 h-4 text-teal-700" />
                      <span>Formal 14-Day Cure Notice Document</span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Certified legal notice compiled automatically from photo and video evidence.
                    </p>
                  </div>

                  <button
                    onClick={handleGenerateNotice}
                    disabled={isGeneratingNotice}
                    className="bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs px-3.5 py-2 rounded-xl transition-colors shadow-xs"
                  >
                    {isGeneratingNotice ? 'Generating...' : 'Generate Legal Document'}
                  </button>
                </div>

                <div className="p-4 bg-slate-900 text-slate-100 font-mono text-xs rounded-xl whitespace-pre-wrap leading-relaxed max-h-[320px] overflow-y-auto border border-slate-800">
                  {cureNoticeContent || (
                    <span className="text-slate-400 italic">
                      Click "Generate Legal Document" to automatically draft the formal 14-Day Cure Notice with timestamped evidence for Store #{store.storeNumber}.
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Action Footer - Human-in-the-loop decisions */}
        <div className="bg-white px-5 sm:px-6 py-4 border-t border-slate-200 shrink-0 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-lg">
          <div className="w-full sm:w-auto flex-1 max-w-md">
            <input
              type="text"
              placeholder="Add manager audit note (optional)..."
              value={managerNote}
              onChange={(e) => setManagerNote(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 text-xs text-slate-900 rounded-xl px-3.5 py-2 focus:outline-none focus:border-teal-700 focus:bg-white transition-colors"
            />
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <button
              id="btn-reject-action"
              onClick={handleReject}
              className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 px-3.5 py-2 rounded-xl text-xs font-bold transition-colors border border-slate-300"
            >
              <XCircle className="w-3.5 h-3.5 text-slate-500" />
              <span>Dismiss Flag</span>
            </button>

            <button
              id="btn-investigate-action"
              onClick={handleInvestigate}
              className="flex items-center gap-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 px-3.5 py-2 rounded-xl text-xs font-bold transition-colors"
            >
              <Search className="w-3.5 h-3.5 text-amber-700" />
              <span>Request More Proof</span>
            </button>

            <button
              id="btn-approve-inspection"
              onClick={() => handleApprove('physical_inspection')}
              className="flex items-center gap-1.5 bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-md transition-all"
            >
              <Check className="w-4 h-4 text-white" />
              <span>Approve Physical Audit</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
