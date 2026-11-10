import React, { useState, useRef } from 'react';
import { 
  X, 
  Camera, 
  Video, 
  Upload, 
  Sparkles, 
  Star, 
  AlertTriangle, 
  CheckCircle2, 
  Play, 
  Pause, 
  RotateCcw, 
  Film, 
  Image as ImageIcon,
  MapPin,
  Clock,
  ShieldCheck,
  Building2,
  AlertOctagon,
  FileCheck
} from 'lucide-react';
import { FranchiseStore, StorePhotoAudit, VisualViolationDetection } from '../types/franchise';
import { extractRandomFrames } from '../lib/frames';
import { analyzeStorePhoto } from '../services/apiClient';
import confetti from 'canvas-confetti';

interface CustomerMediaUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  stores: FranchiseStore[];
  preselectedStoreNumber?: number | null;
  /** When true the store cannot be changed (used in the store portal). */
  lockStore?: boolean;
  onMediaSubmitted: (storeNumber: number, newMedia: StorePhotoAudit, notes?: string) => void;
}

// Preset samples for rapid testing
const SAMPLE_PRESETS = [
  {
    title: 'Customer Video: Kitchen Oil Spill & Uncapped Fryer',
    type: 'video' as const,
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    imageUrl: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=800&q=80',
    zone: 'Kitchen / Prep Area' as const,
    rating: 1,
    comment: 'Filmed from the front billing counter. Deep fryer area has massive grease accumulation on floor and cook was not wearing a hairnet.',
    storeNumber: 247,
  },
  {
    title: 'Customer Photo: Table Spills & Overflowing Bins',
    type: 'image' as const,
    imageUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80',
    zone: 'Dining Room' as const,
    rating: 2,
    comment: 'Waited 15 minutes at an uncleared table with sticky soda stains. Tray return bin was overflowing.',
    storeNumber: 247,
  },
  {
    title: 'Customer Video: Restroom Sanitation & Broken Faucet',
    type: 'video' as const,
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    imageUrl: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=800&q=80',
    zone: 'Restroom' as const,
    rating: 1,
    comment: 'Restroom soap dispenser was completely empty and floor drain was backed up with foul odor.',
    storeNumber: 108,
  },
  {
    title: 'Customer Photo: Food Plating & Foreign Residue',
    type: 'image' as const,
    imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80',
    zone: 'Food Quality & Plating' as const,
    rating: 2,
    comment: 'Salad bowl container had visible foreign plastic sliver on edge and avocado was oxidized.',
    storeNumber: 71,
  },
  {
    title: 'Customer Photo: Clean Store & Excellent Service (5 Stars)',
    type: 'image' as const,
    imageUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80',
    zone: 'Dining Room' as const,
    rating: 5,
    comment: 'Super clean dining area, spotless tables, and staff wearing full sanitized gear and hairnets.',
    storeNumber: 12,
  },
];

export const CustomerMediaUploadModal: React.FC<CustomerMediaUploadModalProps> = ({
  isOpen,
  onClose,
  stores,
  preselectedStoreNumber,
  lockStore = false,
  onMediaSubmitted,
}) => {
  if (!isOpen) return null;

  const [selectedStoreNum, setSelectedStoreNum] = useState<number>(
    preselectedStoreNumber || 247
  );
  const [mediaType, setMediaType] = useState<'image' | 'video'>('image');
  const [mediaUrl, setMediaUrl] = useState<string>(
    'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=800&q=80'
  );
  const [videoUrl, setVideoUrl] = useState<string>(
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4'
  );
  const [customerName, setCustomerName] = useState<string>('Rahul Verma');
  const [orderNumber, setOrderNumber] = useState<string>('ORD-LKO-4928');
  const [zone, setZone] = useState<
    'Kitchen / Prep Area' | 'Dining Room' | 'Restroom' | 'Storefront / Entrance' | 'Storage / Walk-in' | 'Drive-Thru / POS' | 'Food Quality & Plating'
  >('Kitchen / Prep Area');
  const [duration, setDuration] = useState<number>(0);
  const [isSending, setIsSending] = useState<boolean>(false);
  const [sendError, setSendError] = useState<string>('');
  const [feedbackText, setFeedbackText] = useState<string>(
    'Recorded from pickup counter. Floor is extremely greasy near fryer and staff was preparing food without standard hairnets.'
  );

  // Live video player state
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);

  // AI analysis state
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [aiAnalysisResult, setAiAnalysisResult] = useState<{
    cleanlinessScore: number;
    aiStatus: 'flagged' | 'passed';
    summary: string;
    violations: VisualViolationDetection[];
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const currentStore = stores.find((s) => s.storeNumber === selectedStoreNum) || stores[0];

  // Handle local file upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isVid = file.type.startsWith('video/');
    setMediaType(isVid ? 'video' : 'image');

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (isVid) {
        setVideoUrl(dataUrl);
        setMediaUrl(dataUrl);
      } else {
        setMediaUrl(dataUrl);
      }
      // Auto run AI Analysis on new file
      runAiScan(dataUrl, isVid);
    };
    reader.readAsDataURL(file);
  };

  // Run AI multimodal analysis
  const runAiScan = async (urlToScan?: string, isVidParam?: boolean) => {
    setIsAnalyzing(true);
    const targetIsVideo = isVidParam !== undefined ? isVidParam : mediaType === 'video';
    const targetUrl = urlToScan || (targetIsVideo ? videoUrl : mediaUrl);

    try {
      const result = await analyzeStorePhoto({
        imageUrl: targetIsVideo ? undefined : targetUrl,
        videoUrl: targetIsVideo ? targetUrl : undefined,
        mediaType: targetIsVideo ? 'video' : 'image',
        zone,
        storeNumber: selectedStoreNum,
        customerFeedback: feedbackText,
        caption: `${customerName} (${zone}): ${feedbackText}`,
      });

      setAiAnalysisResult({
        cleanlinessScore: result.overallCleanlinessScore,
        aiStatus: result.aiStatus,
        summary: result.summary,
        violations: result.detectedViolations,
      });
    } catch (err) {
      console.error(err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Handle preset selection
  const handleSelectPreset = (preset: typeof SAMPLE_PRESETS[0]) => {
    setMediaType(preset.type);
    if (!lockStore) setSelectedStoreNum(preset.storeNumber);
    setZone(preset.zone);
    setFeedbackText(preset.comment);
    if (preset.type === 'video') {
      setVideoUrl(preset.videoUrl || '');
      setMediaUrl(preset.imageUrl || '');
    } else {
      setMediaUrl(preset.imageUrl || '');
    }
    setAiAnalysisResult(null);
  };

  // Seek video
  const handleSeekVideo = (seconds: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = seconds;
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  // Toggle play/pause
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

  // Send evidence to the officer. Videos are reduced to 10 random frames first.
  const handleSubmit = async () => {
    setSendError('');
    setIsSending(true);
    try {
      const isVid = mediaType === 'video';
      let frames: StorePhotoAudit['frames'];
      let dur: number | undefined;
      if (isVid) {
        const out = await extractRandomFrames(videoUrl, 10);
        frames = out.frames;
        dur = Math.round(out.duration);
      } else {
        frames = [{ id: `frame-${Date.now()}-0`, timeSec: 0, dataUrl: mediaUrl }];
      }

      const violations: VisualViolationDetection[] = aiAnalysisResult?.violations || [];
      const newAuditItem: StorePhotoAudit = {
        id: `media-${Date.now()}`,
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
        imageUrl: frames && frames.length ? frames[0].dataUrl : mediaUrl,
        videoUrl: isVid ? videoUrl : undefined,
        mediaType,
        durationSec: dur,
        caption: feedbackText.trim() ? feedbackText.trim().substring(0, 90) : `${zone} evidence`,
        zone,
        overallCleanlinessScore: aiAnalysisResult?.cleanlinessScore ?? 0,
        aiStatus: violations.length > 0 ? 'flagged' : 'analyzed',
        submittedBy: `${customerName}${orderNumber ? ` • ${orderNumber}` : ''}`,
        customerComment: feedbackText,
        orderNumber: orderNumber || undefined,
        detectedViolations: violations,
        frames,
        reviewStatus: 'awaiting_officer',
      };

      onMediaSubmitted(selectedStoreNum, newAuditItem, feedbackText);
      confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
      onClose();
    } catch (err) {
      setSendError(err instanceof Error ? err.message : 'Could not send this evidence. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white border border-slate-200 w-full max-w-5xl xl:max-w-6xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[94vh] animate-fadeIn">
        {/* Header */}
        <div className="bg-slate-950 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-600 flex items-center justify-center text-white shrink-0">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold tracking-tight">Customer Photo & Video Portal</h2>
              <p className="text-xs text-slate-400">
                Submit customer photos, kitchen video clips, and dining feedback with AI compliance auditing.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5 bg-slate-50/50">
          {/* Quick Presets Strip */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-600 font-semibold">
              <span className="flex items-center gap-1.5 font-bold">
                <Sparkles className="w-4 h-4 text-teal-700" />
                <span>Instant Pre-loaded Test Cases:</span>
              </span>
              <span className="text-slate-400 text-[11px]">Select any test case to populate</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {SAMPLE_PRESETS.map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSelectPreset(p)}
                  className={`p-3 rounded-xl border text-left text-xs transition-all flex items-start gap-2.5 shadow-xs ${
                    mediaType === p.type && feedbackText === p.comment
                      ? 'bg-teal-50/90 border-teal-700 ring-2 ring-teal-200'
                      : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
                  }`}
                >
                  <div className="p-2 rounded-lg bg-slate-100 border border-slate-200 shrink-0 text-teal-700">
                    {p.type === 'video' ? <Video className="w-4 h-4" /> : <ImageIcon className="w-4 h-4" />}
                  </div>
                  <div className="overflow-hidden">
                    <span className="font-bold text-slate-900 block truncate">{p.title}</span>
                    <span className="text-[11px] text-slate-500 block truncate mt-0.5">
                      Store #{p.storeNumber} • {p.zone}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: Media Viewer / Preview & AI Vision */}
            <div className="lg:col-span-7 space-y-3">
              {/* Media Type Tabs & File Upload Button */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1 bg-slate-200/80 p-1 rounded-xl">
                  <button
                    onClick={() => setMediaType('image')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      mediaType === 'image'
                        ? 'bg-teal-700 text-white shadow-xs'
                        : 'text-slate-700 hover:text-slate-900'
                    }`}
                  >
                    <ImageIcon className="w-3.5 h-3.5" />
                    <span>Photo</span>
                  </button>
                  <button
                    onClick={() => setMediaType('video')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      mediaType === 'video'
                        ? 'bg-teal-700 text-white shadow-xs'
                        : 'text-slate-700 hover:text-slate-900'
                    }`}
                  >
                    <Video className="w-3.5 h-3.5" />
                    <span>Video Clip</span>
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,video/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-1.5 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors shadow-xs"
                  >
                    <Upload className="w-3.5 h-3.5 text-teal-700" />
                    <span>Upload Local File</span>
                  </button>
                </div>
              </div>

              {/* Media Display Container (Enlarged) */}
              <div className="relative bg-slate-950 rounded-2xl overflow-hidden min-h-[340px] sm:min-h-[400px] border border-slate-800 flex items-center justify-center group shadow-md">
                {mediaType === 'video' ? (
                  <div className="relative w-full h-full min-h-[340px] sm:min-h-[400px] flex items-center justify-center bg-black">
                    <video
                      ref={videoRef}
                      src={videoUrl}
                      playsInline
                      loop
                      onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
                      onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
                      className="w-full h-full max-h-[480px] object-contain"
                    />

                    {/* Video Player Controls Overlay */}
                    <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-3.5 flex items-center justify-between text-white text-xs z-20">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={togglePlay}
                          className="p-2 rounded-lg bg-teal-600 hover:bg-teal-500 text-white transition-colors"
                        >
                          {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
                        </button>
                        <span className="font-mono text-xs text-slate-200">
                          {Math.floor(currentTime)}s / {Math.round(duration || 0)}s
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="bg-teal-900/90 border border-teal-500/60 text-teal-200 px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1">
                          <Film className="w-3.5 h-3.5 text-teal-400" />
                          <span>Customer Video Footage</span>
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="relative w-full h-full min-h-[340px] sm:min-h-[400px] flex items-center justify-center">
                    <img
                      src={mediaUrl}
                      alt="Customer Evidence"
                      className="w-full h-full max-h-[480px] object-contain"
                    />
                  </div>
                )}

                {/* AI Scanning Active Overlay */}
                {isAnalyzing && (
                  <div className="absolute inset-0 bg-teal-950/70 backdrop-blur-xs flex flex-col items-center justify-center text-white space-y-2 animate-fadeIn z-20">
                    <div className="w-10 h-10 border-2 border-teal-400 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-xs font-bold tracking-wide">Gemini 3.7 Vision & Video Audit in Progress...</span>
                    <span className="text-[10px] text-teal-200">Analyzing frame sanitation, objects, and hygiene...</span>
                  </div>
                )}

                {/* Detected Bounding Box if available */}
                {aiAnalysisResult?.violations && aiAnalysisResult.violations.length > 0 && !isAnalyzing && (
                  <div className="absolute inset-0 pointer-events-none z-10">
                    {aiAnalysisResult.violations.map((v, i) => (
                      <div
                        key={v.id || i}
                        className="absolute border-2 border-rose-500 bg-rose-500/10 rounded-md transition-all animate-pulse"
                        style={{
                          left: `${v.boundingBox?.x || 25}%`,
                          top: `${v.boundingBox?.y || 40}%`,
                          width: `${v.boundingBox?.width || 40}%`,
                          height: `${v.boundingBox?.height || 30}%`,
                        }}
                      >
                        <div className="absolute -top-6 left-0 bg-rose-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow-sm whitespace-nowrap">
                          {v.label} ({v.confidence}%)
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Action Trigger for AI Multimodal Audit */}
              <div className="flex items-center justify-between gap-2 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-teal-700" />
                  <span className="text-xs font-semibold text-slate-800">
                    {mediaType === 'video' ? 'AI Video Frame Scanner' : 'AI Computer Vision Scanner'}
                  </span>
                </div>

                <button
                  onClick={() => runAiScan()}
                  disabled={isAnalyzing}
                  className="bg-teal-700 hover:bg-teal-800 disabled:opacity-50 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{isAnalyzing ? 'Scanning Media...' : 'Run Instant AI Scan'}</span>
                </button>
              </div>

              {/* AI Scan Findings Box */}
              {aiAnalysisResult && (
                <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900">AI Multimodal Audit Findings</span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          aiAnalysisResult.aiStatus === 'flagged'
                            ? 'bg-rose-100 text-rose-700'
                            : 'bg-emerald-100 text-emerald-700'
                        }`}
                      >
                        {aiAnalysisResult.aiStatus.toUpperCase()}
                      </span>
                    </div>

                    <div className="text-xs">
                      <span className="text-slate-500">Hygiene Score: </span>
                      <strong className={aiAnalysisResult.cleanlinessScore < 60 ? 'text-rose-600' : 'text-emerald-600'}>
                        {aiAnalysisResult.cleanlinessScore}/100
                      </strong>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600">
                    {aiAnalysisResult.summary}
                  </p>

                  {/* Violation Items & Video Timestamp Tags */}
                  {aiAnalysisResult.violations.length > 0 && (
                    <div className="space-y-2 pt-1">
                      {aiAnalysisResult.violations.map((v) => (
                        <div key={v.id} className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-900 flex items-center gap-1.5">
                              <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                              <span>{v.label}</span>
                            </span>
                            <div className="flex items-center gap-1.5">
                              {mediaType === 'video' && v.timestampSec !== undefined && (
                                <button
                                  onClick={() => handleSeekVideo(v.timestampSec!)}
                                  className="text-[10px] bg-teal-100 hover:bg-teal-200 text-teal-800 font-bold px-2 py-0.5 rounded transition-colors flex items-center gap-1"
                                >
                                  <Play className="w-2.5 h-2.5 fill-current" />
                                  <span>00:0{v.timestampSec}s</span>
                                </button>
                              )}
                              <span className="text-[10px] font-semibold text-slate-500">{v.confidence}% conf</span>
                            </div>
                          </div>
                          <p className="text-[11px] text-slate-600">{v.evidenceDescription}</p>
                          <span className="text-[10px] text-teal-800 font-medium block">{v.standardClause}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Right: Feedback & Store Form Details */}
            <div className="lg:col-span-5 space-y-4">
              {/* Store Selection */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-800">
                  Select Franchise Store
                </label>
                <select
                  value={selectedStoreNum}
                  disabled={lockStore}
                  onChange={(e) => setSelectedStoreNum(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-teal-600 focus:bg-white transition-colors"
                >
                  {stores.map((s) => (
                    <option key={s.id} value={s.storeNumber}>
                      Store #{s.storeNumber} - {s.name} ({s.location.city})
                    </option>
                  ))}
                </select>
                <div className="text-[11px] text-slate-500 flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-slate-400" />
                  <span>{currentStore.address}</span>
                </div>
              </div>

              {/* Customer Info */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-800">
                    Submitted by
                  </label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="e.g. Rahul Verma"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-teal-600 focus:bg-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-800">
                    Order / Bill # (optional)
                  </label>
                  <input
                    type="text"
                    value={orderNumber}
                    onChange={(e) => setOrderNumber(e.target.value)}
                    placeholder="ORD-LKO-4928"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-teal-600 focus:bg-white"
                  />
                </div>
              </div>

              {/* Zone / Area */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-800">
                  Store Area / Incident Zone
                </label>
                <select
                  value={zone}
                  onChange={(e) => setZone(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-teal-600 focus:bg-white"
                >
                  <option value="Kitchen / Prep Area">Kitchen / Prep Area</option>
                  <option value="Dining Room">Dining Room</option>
                  <option value="Restroom">Restroom</option>
                  <option value="Food Quality & Plating">Food Quality & Plating</option>
                  <option value="Storefront / Entrance">Storefront / Entrance</option>
                  <option value="Drive-Thru / POS">Drive-Thru / POS Counter</option>
                </select>
              </div>

              {/* Review / Comment */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-800">
                  Notes for the officer
                </label>
                <textarea
                  rows={3}
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  placeholder="Describe the condition, food defect, or hygiene observation..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-800 focus:outline-none focus:border-teal-600 focus:bg-white resize-none"
                />
              </div>

              {/* Submit Button */}
              <div className="pt-3 border-t border-slate-100 space-y-2">
                <button
                  id="btn-submit-customer-media"
                  onClick={handleSubmit}
                  disabled={isSending}
                  className="w-full py-3 disabled:opacity-60 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all hover:shadow-md"
                >
                  <FileCheck className="w-4 h-4" />
                  <span>{isSending ? 'Taking 10 random frames…' : mediaType === 'video' ? 'Send 10 random frames to the officer' : 'Send photo to the officer'}</span>
                </button>

                {sendError && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">{sendError}</p>}
                <p className="text-[11px] text-slate-400 text-center">
                  {mediaType === 'video'
                    ? 'The video stays on your device. Ten random frames are taken from it and sent to the compliance officer, who gives the rating.'
                    : 'The photo is sent to the compliance officer, who gives the rating.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
