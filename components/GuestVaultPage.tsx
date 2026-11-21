'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Camera, QrCode, Upload, Download, Heart, Lock, Check } from 'lucide-react';
import { GuestVaultContent, VaultPhoto } from '@/lib/wedding-data';
import { optimizeUploadedImage } from '@/lib/studio-storage';

interface GuestVaultPageProps {
  vaultContent: GuestVaultContent;
  vaultPhotos: VaultPhoto[];
  onAddVaultPhoto: (photo: Omit<VaultPhoto, 'id'>) => void;
  onUpdateVaultContent: (updates: Partial<GuestVaultContent>) => void;
}

export default function GuestVaultPage({
  vaultContent,
  vaultPhotos,
  onAddVaultPhoto,
  onUpdateVaultContent,
}: GuestVaultPageProps) {
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [guestName, setGuestName] = useState('');
  const [guestTable, setGuestTable] = useState('Table 5');
  const [guestNote, setGuestNote] = useState('');
  const [guestPhotoUrl, setGuestPhotoUrl] = useState('');
  const [isProcessingPhoto, setIsProcessingPhoto] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [pdfNotice, setPdfNotice] = useState(false);
  const [activeTab, setActiveTab] = useState<'stream' | 'qr-card' | 'how-it-works'>('stream');

  const handleSimulatedFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setIsProcessingPhoto(true);
    try {
      const optimized = await optimizeUploadedImage(file);
      setGuestPhotoUrl(optimized);
    } catch {
      // Keep fallback
    } finally {
      setIsProcessingPhoto(false);
    }
  };

  const handleSimulateUpload = (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestName.trim() || isProcessingPhoto) return;

    const sampleImages = [
      'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1520854221256-17451cc331bf?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?auto=format&fit=crop&w=600&q=80',
    ];
    const selectedUrl =
      guestPhotoUrl.trim() || sampleImages[Math.floor(Math.random() * sampleImages.length)];

    onAddVaultPhoto({
      guestName: guestName.trim(),
      table: guestTable.trim() || 'Guest Table',
      note: guestNote.trim() || 'Congratulations to the gorgeous newlyweds!',
      time: 'Just now',
      url: selectedUrl,
    });

    setUploadSuccess(true);
    setTimeout(() => {
      setUploadSuccess(false);
      setShowUploadModal(false);
      setGuestName('');
      setGuestNote('');
      setGuestPhotoUrl('');
    }, 1500);
  };

  return (
    <div className="w-full bg-white min-h-screen py-10 sm:py-16 px-4 sm:px-8 animate-in fade-in duration-300">
      <div className="max-w-6xl mx-auto space-y-12">
        {/* Header with standout branding */}
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-[#f4ede2] border border-[#e2d5c1] text-[#937140] px-4 py-1.5 rounded-full text-xs uppercase tracking-widest font-sans font-semibold">
            <Camera className="w-3.5 h-3.5" />
            <span>{vaultContent.badgeLabel}</span>
          </div>

          <h1 className="font-serif text-3xl sm:text-5xl text-stone-900 font-light tracking-tight uppercase">
            {vaultContent.pageTitle}
          </h1>

          <div className="flex items-center justify-center gap-3 py-1">
            <span className="w-10 h-px bg-stone-300"></span>
            <Heart className="w-4 h-4 text-[#c2a378] fill-[#c2a378]" />
            <span className="w-10 h-px bg-stone-300"></span>
          </div>

          <p className="font-serif italic text-lg sm:text-xl text-stone-700">
            {vaultContent.pageSubtitle}
          </p>
        </div>

        {/* Feature Highlights Ribbon */}
        <div className="bg-[#6f7a6a] text-white p-6 sm:p-8 rounded-xs shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-1 text-center md:text-left">
            <div className="font-serif text-2xl font-normal">
              Private Wedding Vault for {vaultContent.coupleName}
            </div>
            <div className="font-serif italic text-sm text-stone-200">
              {vaultContent.weddingDate} · {vaultPhotos.length} guest photos uploaded so far
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => setShowUploadModal(true)}
              className="bg-white text-stone-900 hover:bg-stone-100 px-5 py-2.5 rounded-full text-xs uppercase tracking-widest font-sans font-semibold transition-all shadow-sm flex items-center gap-2"
            >
              <Upload className="w-3.5 h-3.5 text-[#c2a378]" />
              <span>Simulate Guest Upload</span>
            </button>

            <button
              onClick={() => setActiveTab('qr-card')}
              className="border border-white/50 hover:bg-white/10 text-white px-5 py-2.5 rounded-full text-xs uppercase tracking-widest font-sans font-medium transition-colors flex items-center gap-2"
            >
              <QrCode className="w-3.5 h-3.5" />
              <span>View Table QR Card</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center justify-center gap-3 border-b border-stone-200 pb-3 text-xs uppercase tracking-widest font-sans font-semibold">
          <button
            onClick={() => setActiveTab('stream')}
            className={`pb-2 px-3 border-b-2 transition-colors ${
              activeTab === 'stream'
                ? 'border-stone-900 text-stone-950 font-bold'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            Live Photo Stream ({vaultPhotos.length})
          </button>
          <button
            onClick={() => setActiveTab('qr-card')}
            className={`pb-2 px-3 border-b-2 transition-colors ${
              activeTab === 'qr-card'
                ? 'border-stone-900 text-stone-950 font-bold'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            Table QR Code Generator
          </button>
          <button
            onClick={() => setActiveTab('how-it-works')}
            className={`pb-2 px-3 border-b-2 transition-colors ${
              activeTab === 'how-it-works'
                ? 'border-stone-900 text-stone-950 font-bold'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            How It Works
          </button>
        </div>

        {/* Tab 1: Live Photo Stream */}
        {activeTab === 'stream' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-serif text-2xl text-stone-900">
                  {vaultContent.streamTitle}
                </h3>
                <p className="font-serif italic text-sm text-stone-500">
                  {vaultContent.streamSubtitle}
                </p>
              </div>

              <div className="flex items-center gap-2 text-xs font-sans text-stone-500">
                <Lock className="w-3.5 h-3.5 text-stone-400" />
                <span>{vaultContent.privacyBadgeText}</span>
              </div>
            </div>

            {/* Polaroid Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {vaultPhotos.map(photo => (
                <div
                  key={photo.id}
                  className="bg-[#fbf9f6] border border-stone-200/90 rounded-xs p-3 pb-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group"
                >
                  <div className="relative aspect-square w-full rounded-xs overflow-hidden bg-stone-200 mb-3">
                    <Image
                      src={photo.url}
                      alt={photo.guestName}
                      fill
                      className="object-cover group-hover:scale-103 transition-transform duration-300"
                      referrerPolicy="no-referrer"
                      unoptimized={photo.url.startsWith('data:') || photo.url.startsWith('blob:')}
                    />
                    <div className="absolute top-2 left-2 bg-black/60 text-white text-[10px] px-2 py-0.5 rounded-full font-sans">
                      {photo.time}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-stone-900 font-sans">
                        {photo.guestName}
                      </span>
                      <span className="text-[11px] text-[#c2a378] font-sans">
                        {photo.table}
                      </span>
                    </div>

                    <p className="font-serif italic text-stone-700 text-sm leading-relaxed">
                      &ldquo;{photo.note}&rdquo;
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 2: QR Table Card Preview */}
        {activeTab === 'qr-card' && (
          <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in duration-200">
            <div className="text-center space-y-1">
              <h3 className="font-serif text-2xl text-stone-900">
                Printable Wedding Table Sign
              </h3>
              <p className="font-serif italic text-sm text-stone-600">
                Place these beautiful tent cards on your dining tables and bar so guests can scan with their camera.
              </p>
            </div>

            {/* Customizer */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-[#fbf9f6] p-4 rounded border border-stone-200 text-xs">
              <div>
                <label className="block font-semibold uppercase tracking-wider text-stone-700 mb-1">
                  Couple Names on Card
                </label>
                <input
                  type="text"
                  value={vaultContent.coupleName}
                  onChange={e => onUpdateVaultContent({ coupleName: e.target.value })}
                  className="w-full border border-stone-300 rounded px-2.5 py-1.5 bg-white"
                />
              </div>
              <div>
                <label className="block font-semibold uppercase tracking-wider text-stone-700 mb-1">
                  Wedding Date
                </label>
                <input
                  type="text"
                  value={vaultContent.weddingDate}
                  onChange={e => onUpdateVaultContent({ weddingDate: e.target.value })}
                  className="w-full border border-stone-300 rounded px-2.5 py-1.5 bg-white"
                />
              </div>
            </div>

            {/* Table Card Physical Preview */}
            <div className="p-8 sm:p-12 bg-white border-2 border-stone-300 rounded-xs shadow-xl text-center space-y-6 relative max-w-md mx-auto">
              <div className="border border-stone-200 p-8 rounded-xs space-y-5">
                <div className="font-serif text-2xl text-stone-900 tracking-wide">
                  {vaultContent.coupleName}
                </div>
                <div className="text-[10px] uppercase tracking-[0.25em] text-[#c2a378] font-sans">
                  {vaultContent.weddingDate}
                </div>

                <div className="w-12 h-px bg-stone-300 mx-auto"></div>

                <h4 className="font-serif italic text-lg text-stone-800">
                  Share Your Snaps With Us!
                </h4>

                <p className="font-serif text-xs text-stone-600 max-w-xs mx-auto">
                  Scan this QR code with your phone camera to upload your photos and videos straight to our wedding vault.
                </p>

                {/* Simulated QR Code Graphic */}
                <div className="w-40 h-40 mx-auto p-3 bg-stone-50 border border-stone-300 rounded flex flex-col items-center justify-center space-y-1 shadow-inner">
                  <QrCode className="w-28 h-28 text-stone-900" />
                  <span className="text-[9px] uppercase tracking-wider font-mono text-stone-600">
                    vault.mmc.photos/sj24
                  </span>
                </div>

                <div className="text-[10px] text-stone-600 italic font-serif">
                  No app download or account required
                </div>
              </div>

              <button
                onClick={() => {
                  setPdfNotice(true);
                  setTimeout(() => setPdfNotice(false), 3500);
                  if (typeof window !== 'undefined' && typeof window.print === 'function') {
                    window.print();
                  }
                }}
                className="inline-flex items-center gap-2 bg-[#1e2321] text-white px-6 py-2.5 rounded text-xs uppercase tracking-widest font-sans font-semibold hover:bg-stone-800 transition-colors"
              >
                <Download className="w-3.5 h-3.5 text-[#c2a378]" />
                <span>Download Printable PDF</span>
              </button>

              {pdfNotice && (
                <p className="text-xs text-emerald-700 font-sans">
                  Print dialog opened—choose &ldquo;Save as PDF&rdquo; to export your table card.
                </p>
              )}
            </div>
          </div>
        )}

        {/* Tab 3: How It Works */}
        {activeTab === 'how-it-works' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-4">
            {vaultContent.howItWorksSteps.map((step, idx) => (
              <div
                key={step.id}
                className="p-6 bg-[#fbf9f6] border border-stone-200/80 rounded-xs space-y-4 text-center sm:text-left"
              >
                <div className="w-10 h-10 rounded-full bg-[#1e2321] text-[#c2a378] flex items-center justify-center font-bold font-sans text-sm">
                  {idx + 1}
                </div>
                <h3 className="font-serif text-xl text-stone-900">
                  {step.title}
                </h3>
                <p className="font-serif text-sm text-stone-600 leading-relaxed">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Guest Upload Simulation Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-md max-w-md w-full p-6 shadow-2xl border border-stone-300 space-y-5 animate-in fade-in duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200">
              <div className="flex items-center gap-2">
                <Camera className="w-4 h-4 text-[#c2a378]" />
                <h3 className="font-serif text-lg text-stone-900">
                  Guest Photo Upload Demo
                </h3>
              </div>
              <button
                onClick={() => setShowUploadModal(false)}
                className="text-stone-400 hover:text-stone-700"
              >
                ✕
              </button>
            </div>

            {uploadSuccess ? (
              <div className="p-6 text-center space-y-2 bg-emerald-50 text-emerald-800 rounded">
                <Check className="w-8 h-8 mx-auto text-emerald-600" />
                <div className="font-serif text-lg font-medium">Uploaded Successfully!</div>
                <div className="text-xs">Your photo and note have been added to the wedding vault stream.</div>
              </div>
            ) : (
              <form onSubmit={handleSimulateUpload} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1">
                    Your Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Uncle David, Cousin Mia"
                    value={guestName}
                    onChange={e => setGuestName(e.target.value)}
                    className="w-full text-sm border border-stone-300 rounded px-3 py-2 outline-none focus:ring-1 focus:ring-[#c2a378]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1">
                    Table / Group
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Table 4, Uni Crew"
                    value={guestTable}
                    onChange={e => setGuestTable(e.target.value)}
                    className="w-full text-sm border border-stone-300 rounded px-3 py-2 outline-none focus:ring-1 focus:ring-[#c2a378]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1">
                    Photo (Optional — picks sample if omitted)
                  </label>
                  <label className="inline-flex items-center gap-1.5 text-xs text-stone-700 hover:text-stone-900 border border-dashed border-stone-300 px-3 py-2 rounded cursor-pointer hover:bg-stone-50 w-full justify-center">
                    <Upload className="w-3.5 h-3.5 text-[#c2a378]" />
                    <span>
                      {isProcessingPhoto
                        ? 'Preparing photo...'
                        : guestPhotoUrl
                        ? 'Photo selected (click to change)'
                        : 'Upload a photo from your device'}
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleSimulatedFileUpload}
                    />
                  </label>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1">
                    Message / Caption for the Couple
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Leave a sweet memory or congratulations..."
                    value={guestNote}
                    onChange={e => setGuestNote(e.target.value)}
                    className="w-full text-sm border border-stone-300 rounded px-3 py-2 outline-none focus:ring-1 focus:ring-[#c2a378]"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isProcessingPhoto}
                  className="w-full bg-[#1e2321] disabled:bg-stone-400 text-white py-2.5 rounded text-xs uppercase tracking-widest font-sans font-semibold hover:bg-stone-800 transition-colors flex items-center justify-center gap-2"
                >
                  <Upload className="w-3.5 h-3.5 text-[#c2a378]" />
                  <span>Upload Photo &amp; Note</span>
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
