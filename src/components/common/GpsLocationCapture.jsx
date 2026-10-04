import { useState, useRef, useCallback } from "react";
import { MapPin, Mic, Check } from "lucide-react";
import toast from "react-hot-toast";
import { uploadVoiceNote } from "@/api/uploads";

const GPS_TIMEOUT_MS = 30000;
const MAX_RECORDING_MS = 30000;

/**
 * GpsLocationCapture
 *
 * The real, simple location flow for low-literacy users: one big
 * button captures GPS coordinates automatically in the background —
 * no map, no search, no dragging a pin. After a successful capture,
 * the user describes exactly where they are in their own words,
 * typed or spoken. Voice notes are stored and played back as-is,
 * never transcribed — no mainstream speech-to-text engine has real
 * support for Idoma or many other local languages, and a garbled
 * transcription would be worse than no text at all.
 *
 * Props:
 *   onChange({ lat, lng, description, voice_note_url }) — fires on
 *     every change (GPS captured, description typed, voice note saved)
 *   showVoiceMemo — whether to show the voice recording option
 *     (customer checkout: yes; vendor onboarding: no, by default)
 *   buttonLabel — text for the initial capture button
 */
export default function GpsLocationCapture({
  onChange,
  showVoiceMemo = false,
  buttonLabel = "Set Delivery Location",
}) {
  const [status, setStatus] = useState("idle"); // idle | requesting | success | error
  const [errorType, setErrorType] = useState(null); // permission_denied | timeout | unavailable | unsupported
  const [coords, setCoords] = useState(null);
  const [description, setDescription] = useState("");

  const [recording, setRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [voiceNoteUrl, setVoiceNoteUrl] = useState(null);
  const [uploadingVoice, setUploadingVoice] = useState(false);
  const [playbackUrl, setPlaybackUrl] = useState(null);

  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const recordTimerRef = useRef(null);
  const autoStopRef = useRef(null);

  const requestLocation = () => {
    if (!navigator.geolocation) {
      setStatus("error");
      setErrorType("unsupported");
      return;
    }
    setStatus("requesting");
    setErrorType(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const c = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setCoords(c);
        setStatus("success");
        onChange?.({ lat: c.lat, lng: c.lng, description, voice_note_url: voiceNoteUrl });
      },
      (err) => {
        setStatus("error");
        if (err.code === err.PERMISSION_DENIED) setErrorType("permission_denied");
        else if (err.code === err.TIMEOUT) setErrorType("timeout");
        else setErrorType("unavailable");
      },
      { enableHighAccuracy: true, timeout: GPS_TIMEOUT_MS, maximumAge: 0 }
    );
  };

  const handleDescriptionChange = (val) => {
    setDescription(val);
    onChange?.({ lat: coords?.lat, lng: coords?.lng, description: val, voice_note_url: voiceNoteUrl });
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        clearInterval(recordTimerRef.current);
        clearTimeout(autoStopRef.current);
        setRecording(false);

        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        if (blob.size === 0) return;

        setPlaybackUrl(URL.createObjectURL(blob));
        setUploadingVoice(true);
        try {
          const res = await uploadVoiceNote(blob);
          setVoiceNoteUrl(res.url);
          onChange?.({ lat: coords?.lat, lng: coords?.lng, description, voice_note_url: res.url });
          toast.success("Voice note saved");
        } catch (err) {
          toast.error("Couldn't save voice note — try again");
        } finally {
          setUploadingVoice(false);
        }
      };

      mediaRecorderRef.current = recorder;
      recorder.start();
      setRecording(true);
      setRecordSeconds(0);
      recordTimerRef.current = setInterval(() => setRecordSeconds((s) => s + 1), 1000);
      autoStopRef.current = setTimeout(() => recorder.stop(), MAX_RECORDING_MS);
    } catch (err) {
      toast.error("Couldn't access microphone — check your permissions");
    }
  };

  const stopRecording = () => mediaRecorderRef.current?.stop();

  const reRecord = () => {
    setPlaybackUrl(null);
    setVoiceNoteUrl(null);
    onChange?.({ lat: coords?.lat, lng: coords?.lng, description, voice_note_url: null });
  };

  return (
    <div className="space-y-4">
      {status === "idle" && (
        <button
          type="button"
          onClick={requestLocation}
          className="w-full py-5 rounded-2xl bg-teal text-navy font-bold text-lg"
        >
          {buttonLabel}
        </button>
      )}

      {status === "requesting" && (
        <div className="w-full py-5 rounded-2xl bg-surface border border-surface-border text-center">
          <p className="text-ink font-semibold">Finding your location...</p>
          <p className="text-slate-muted text-sm mt-1">This can take up to 30 seconds</p>
        </div>
      )}

      {status === "error" && (
        <div className="w-full p-5 rounded-2xl bg-red-500/10 border border-red-500/20">
          {errorType === "permission_denied" && (
            <>
              <p className="text-red-400 font-semibold text-sm">Location access is turned off</p>
              <p className="text-slate-muted text-xs mt-1">
                Please allow location access for Medimoove in your phone or browser settings, then try again.
              </p>
            </>
          )}
          {errorType === "timeout" && (
            <>
              <p className="text-red-400 font-semibold text-sm">Taking too long</p>
              <p className="text-slate-muted text-xs mt-1">Stand outside and try again.</p>
            </>
          )}
          {(errorType === "unavailable" || errorType === "unsupported") && (
            <>
              <p className="text-red-400 font-semibold text-sm">Couldn't find your location</p>
              <p className="text-slate-muted text-xs mt-1">Stand outside and try again.</p>
            </>
          )}
          <button
            type="button"
            onClick={requestLocation}
            className="mt-3 w-full py-3 rounded-xl bg-teal text-navy font-semibold text-sm"
          >
            Try Again
          </button>
        </div>
      )}

      {status === "success" && (
        <>
          <div className="w-full py-4 rounded-2xl bg-teal/10 border border-teal/20 text-center">
            <p className="text-teal font-semibold text-sm flex items-center gap-1"><MapPin className="w-4 h-4" /> Location has been set</p>
            <button type="button" onClick={requestLocation} className="text-slate-muted text-xs underline mt-1">
              Retry if this isn't right
            </button>
          </div>

          <div>
            <label className="text-sm font-medium text-slate-soft block mb-1.5">
              Describe exactly where you are
            </label>
            <textarea
              value={description}
              onChange={(e) => handleDescriptionChange(e.target.value)}
              placeholder="Gate colour, nearby shop, landmark..."
              rows={3}
              className="w-full rounded-xl px-4 py-3 text-base bg-surface border border-surface-border text-ink placeholder:text-slate-muted focus:outline-none focus:border-teal"
            />
          </div>

          {showVoiceMemo && (
            <div>
              <label className="text-sm font-medium text-slate-soft block mb-1.5">
                Or record a short voice note
              </label>

              {!recording && !playbackUrl && (
                <button
                  type="button"
                  onClick={startRecording}
                  className="w-full py-4 rounded-xl bg-surface border border-surface-border text-ink font-medium"
                >
                  <Mic className="w-4 h-4 inline mr-1.5" />Record Voice Note
                </button>
              )}

              {recording && (
                <button
                  type="button"
                  onClick={stopRecording}
                  className="w-full py-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 font-medium animate-pulse"
                >
                  ⏹ Stop Recording ({recordSeconds}s)
                </button>
              )}

              {playbackUrl && (
                <div className="space-y-2">
                  <audio controls src={playbackUrl} className="w-full" />
                  {uploadingVoice && <p className="text-slate-muted text-xs">Saving voice note...</p>}
                  {voiceNoteUrl && !uploadingVoice && <p className="text-teal text-xs flex items-center gap-1"><Check className="w-3.5 h-3.5" /> Voice note saved</p>}
                  <button type="button" onClick={reRecord} className="text-slate-muted text-xs underline">
                    Record again
                  </button>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
