"use client";

import { useState, useMemo, useEffect } from 'react';
import { useRealtimeCollection } from '@/hooks/useRealtimeCollection';
import { orderBy } from 'firebase/firestore';
import api from '@/lib/api';
import GlowCard from '@/components/GlowCard';
import {
    RiTrophyLine, RiAddLine, RiEditLine, RiDeleteBinLine,
    RiCloseLine, RiUploadLine, RiImageLine, RiGamepadLine,
    RiHotelLine, RiMoneyDollarCircleLine, RiGroupLine, RiCalendarLine,
    RiCheckLine, RiAlertFill, RiLoader4Line
} from 'react-icons/ri';
import { Tournament, Game, College } from '@/types';
import Image from 'next/image';
import { resolveImageUrl } from '@/lib/utils';

interface TournamentForm {
    name: string;
    description: string;
    status: 'DRAFT' | 'ACTIVE' | 'CLOSED';
    maxSlots: number;
    paymentAmount: number;
    collegesRestricted: boolean;
    allowedColleges: College[];
    supportedGames: Game[];
    posterUrl: string;
    registrationDeadline: string;
}

export default function AdminTournamentsPage() {
    const [showModal, setShowModal] = useState(false);
    const [editingTournament, setEditingTournament] = useState<Tournament | null>(null);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const [form, setForm] = useState<TournamentForm>({
        name: '',
        description: '',
        status: 'DRAFT',
        maxSlots: 0,
        paymentAmount: 0,
        collegesRestricted: false,
        allowedColleges: [],
        supportedGames: [],
        posterUrl: '',
        registrationDeadline: ''
    });

    const [tempCollegeName, setTempCollegeName] = useState('');
    const [tempGameName, setTempGameName] = useState('');
    const [uploadingImage, setUploadingImage] = useState<string | null>(null); // ID of game/college or 'poster'

    const { data: tournaments, loading } = useRealtimeCollection<Tournament>('tournaments', [
        orderBy('createdAt', 'desc')
    ]);

    const stats = useMemo(() => {
        return {
            total: tournaments.length,
            active: tournaments.filter(t => t.status === 'ACTIVE').length,
            draft: tournaments.filter(t => t.status === 'DRAFT').length,
            closed: tournaments.filter(t => t.status === 'CLOSED').length
        };
    }, [tournaments]);

    const openCreateModal = () => {
        setEditingTournament(null);
        setForm({
            name: '',
            description: '',
            status: 'DRAFT',
            maxSlots: 0,
            paymentAmount: 0,
            collegesRestricted: false,
            allowedColleges: [],
            supportedGames: [],
            posterUrl: '',
            registrationDeadline: ''
        });
        setError('');
        setShowModal(true);
    };


    const formatDateForInput = (date: any) => {
        if (!date) return '';
        let d: Date;
        if (typeof date === 'string') d = new Date(date);
        else if (typeof date.toDate === 'function') d = date.toDate();
        else if (date.seconds) d = new Date(date.seconds * 1000);
        else return '';

        // Format for datetime-local: YYYY-MM-DDTHH:mm
        const pad = (n: number) => n.toString().padStart(2, '0');
        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    };

    const openEditModal = (t: Tournament) => {
        setEditingTournament(t);
        setForm({
            name: t.name,
            description: t.description,
            status: t.status,
            maxSlots: t.maxSlots,
            paymentAmount: t.paymentAmount,
            collegesRestricted: !!t.collegesRestricted,
            allowedColleges: t.allowedColleges || [],
            supportedGames: t.supportedGames || [],
            posterUrl: t.posterUrl || '',
            registrationDeadline: formatDateForInput(t.registrationDeadline)
        });
        setError('');
        setShowModal(true);
    };

    // ─── HANDLERS ──────────────────────────────────────────────────────────

    const addLocalGame = () => {
        if (!tempGameName.trim()) return;
        const newGame: Game = {
            id: `game_${Date.now()}`,
            name: tempGameName,
            logoUrl: ''
        };
        setForm(f => ({ ...f, supportedGames: [...f.supportedGames, newGame] }));
        setTempGameName('');
    };

    const addLocalCollege = () => {
        if (!tempCollegeName.trim()) return;
        const newCollege: College = {
            id: `college_${Date.now()}`,
            name: tempCollegeName,
            logoUrl: ''
        };
        setForm(f => ({ ...f, allowedColleges: [...f.allowedColleges, newCollege] }));
        setTempCollegeName('');
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, type: 'poster' | 'game' | 'college', targetId?: string) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            alert('Only image files (PNG, JPG, JPEG) are allowed.');
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            alert('Max file size is 5MB.');
            return;
        }

        // If we are editing, we can upload immediately
        if (editingTournament) {
            setUploadingImage(targetId || type);
            const formData = new FormData();
            try {
                let url = '';
                if (type === 'poster') {
                    formData.append('poster', file);
                    const res = await api.post(`/admin/tournaments/${editingTournament.id}/poster`, formData, {
                        headers: { 'Content-Type': 'multipart/form-data' }
                    });
                    url = res.data.data.url;
                    setForm(f => ({ ...f, posterUrl: url }));
                } else if (type === 'game' && targetId) {
                    formData.append('logo', file);
                    const res = await api.post(`/admin/tournaments/${editingTournament.id}/games/${targetId}/logo`, formData, {
                        headers: { 'Content-Type': 'multipart/form-data' }
                    });
                    url = res.data.data.url;
                    setForm(f => ({
                        ...f,
                        supportedGames: f.supportedGames.map(g => g.id === targetId ? { ...g, logoUrl: url } : g)
                    }));
                } else if (type === 'college' && targetId) {
                    formData.append('logo', file);
                    const res = await api.post(`/admin/tournaments/${editingTournament.id}/colleges/${targetId}/logo`, formData, {
                        headers: { 'Content-Type': 'multipart/form-data' }
                    });
                    url = res.data.data.url;
                    setForm(f => ({
                        ...f,
                        allowedColleges: f.allowedColleges.map(c => c.id === targetId ? { ...c, logoUrl: url } : c)
                    }));
                }
            } catch (err: any) {
                alert(err.response?.data?.message || 'Upload failed');
            } finally {
                setUploadingImage(null);
            }
        } else {
            // For new tournament, user must save as draft first
            alert('Please save the tournament as DRAFT first, then you can upload images.');
        }
    };

    const validateActivation = () => {
        if (!form.posterUrl) return 'Activation requires a poster banner.';
        if (form.supportedGames.length === 0) return 'At least one supported game is required.';
        if (!form.registrationDeadline) return 'Registration deadline is required for activation.';
        return null;
    };

    const handleSave = async (targetStatus?: 'ACTIVE' | 'DRAFT') => {
        setError('');

        if (!form.name.trim()) { setError('Tournament name is required.'); return; }
        if (!form.description.trim()) { setError('Description is required.'); return; }
        if (form.collegesRestricted && form.allowedColleges.length === 0) {
            setError('College restriction is ON but no colleges added.'); return;
        }

        if (targetStatus === 'ACTIVE') {
            const vErr = validateActivation();
            if (vErr) { setError(vErr); return; }
        }

        setSaving(true);
        try {
            const payload = {
                ...form,
                status: targetStatus || form.status
            };

            if (editingTournament) {
                await api.patch(`/admin/tournaments/${editingTournament.id}`, payload);
                setShowModal(false);
            } else {
                const res = await api.post('/admin/tournaments', payload);
                // After creating, switch to edit mode to allow uploads
                const createdTournament = res.data.data;
                setEditingTournament(createdTournament);
                // Keep modal open so user can upload images
                alert('Tournament created! You can now upload images before publishing.');
            }
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to save tournament');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (t: Tournament) => {
        if (t.currentRegistrations > 0) {
            alert('Cannot delete tournament with existing registrations');
            return;
        }
        if (!confirm(`Are you sure you want to delete "${t.name}"?`)) return;

        try {
            await api.delete(`/admin/tournaments/${t.id}`);
            alert('Tournament deleted successfully');
        } catch (err) {
            alert('Delete failed');
        }
    };

    // ─── RENDER ────────────────────────────────────────────────────────────

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
                <RiLoader4Line className="text-4xl text-neon-green animate-spin" />
                <p className="text-gray-500 font-orbitron tracking-widest uppercase">Loading Arena...</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-orbitron font-bold text-white tracking-widest glow-text mb-2 flex items-center gap-3">
                        <RiTrophyLine className="text-neon-green" /> TOURNAMENT ARENA
                    </h1>
                    <p className="text-gray-400 text-sm">Create, configure and manage your esports events • {tournaments.length} total</p>
                </div>
                <button
                    onClick={openCreateModal}
                    className="flex items-center justify-center gap-2 px-6 py-3 bg-neon-green text-black rounded-xl font-bold transition-all hover:scale-105 shadow-[0_0_20px_rgba(0,255,102,0.2)]"
                >
                    <RiAddLine className="text-xl" /> CREATE TOURNAMENT
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard label="Total" value={stats.total} />
                <StatCard label="Active" value={stats.active} color="text-neon-green" />
                <StatCard label="Draft" value={stats.draft} color="text-yellow-400" />
                <StatCard label="Closed" value={stats.closed} color="text-red-400" />
            </div>

            {/* List */}
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {tournaments.map((t, i) => (
                    <TournamentCard key={t.id} tournament={t} onEdit={() => openEditModal(t)} onDelete={() => handleDelete(t)} delay={i * 0.05} />
                ))}
            </div>

            {/* MODAL */}
            {showModal && (
                <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
                    <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl w-full max-w-5xl max-h-[90vh] flex flex-col shadow-[0_0_50px_rgba(0,0,0,0.5)]">
                        {/* Modal Header */}
                        <div className="p-6 border-b border-white/10 flex items-center justify-between">
                            <div>
                                <h2 className="text-xl font-orbitron font-bold text-white flex items-center gap-3">
                                    {editingTournament ? <RiEditLine className="text-neon-green" /> : <RiAddLine className="text-neon-green" />}
                                    {editingTournament ? 'REFINE TOURNAMENT' : 'INITIALIZE TOURNAMENT'}
                                </h2>
                                <p className="text-xs text-gray-500 mt-1 uppercase tracking-widest">
                                    {editingTournament ? `CONFIGURING ${editingTournament.id}` : 'SETTING UP BASE METADATA'}
                                </p>
                            </div>
                            <button onClick={() => setShowModal(false)} className="p-2 hover:bg-white/5 rounded-full transition-colors">
                                <RiCloseLine className="text-2xl text-gray-400" />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-10 custom-scrollbar">
                            {error && (
                                <div className="bg-red-500/10 border border-red-500/30 p-4 rounded-xl flex items-center gap-3 text-red-500 text-sm animate-in shake duration-300">
                                    <RiAlertFill className="text-xl flex-shrink-0" />
                                    <p className="font-bold">{error}</p>
                                </div>
                            )}

                            {/* Section 1 — Basics */}
                            <FormSection title="1. Basic Details" icon={RiTrophyLine}>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <Field label="Tournament Name *">
                                        <input className={inputCls} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Holi Arena 2026" />
                                    </Field>
                                    <Field label="Registration Deadline *">
                                        <div className="relative">
                                            <RiCalendarLine className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
                                            <input
                                                type="datetime-local"
                                                className={inputCls + ' pl-10 [color-scheme:dark]'}
                                                value={form.registrationDeadline}
                                                onChange={e => setForm({ ...form, registrationDeadline: e.target.value })}
                                            />
                                        </div>
                                    </Field>
                                    <div className="md:col-span-2">
                                        <Field label="Description *">
                                            <textarea className={inputCls + ' min-h-[100px] py-3'} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Write about the event, rules, rewards..." />
                                        </Field>
                                    </div>
                                </div>
                            </FormSection>

                            {/* Section 2 — Poster */}
                            <FormSection title="2. Branding & Assets" icon={RiImageLine}>
                                <div className="space-y-4">
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Tournament Poster (PNG/JPG, Max 5MB)</label>
                                    <div className="flex flex-col sm:flex-row gap-6 items-start">
                                        <div className={`w-full sm:w-64 aspect-video rounded-xl border-2 border-dashed flex flex-col items-center justify-center relative overflow-hidden transition-all
                                            ${form.posterUrl ? 'border-neon-green/30 bg-neon-green/5' : 'border-white/10 bg-white/3'}`}>
                                            {form.posterUrl ? (
                                                <img src={resolveImageUrl(form.posterUrl)} alt="Poster" className="w-full h-full object-cover" />
                                            ) : (
                                                <RiImageLine className="text-4xl text-gray-700 mb-2" />
                                            )}
                                            {uploadingImage === 'poster' && (
                                                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                                                    <RiLoader4Line className="text-3xl text-neon-green animate-spin" />
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1 space-y-3">
                                            <p className="text-sm text-gray-400">Upload a high-quality poster for the tournament landing page.</p>
                                            <input type="file" id="poster-upload" className="hidden" accept="image/*" onChange={e => handleFileChange(e, 'poster')} disabled={!editingTournament} />
                                            <label htmlFor="poster-upload" className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm cursor-pointer transition-all
                                                ${editingTournament ? 'bg-white/10 text-white hover:bg-white/15' : 'bg-white/5 text-gray-600 cursor-not-allowed'}`}>
                                                <RiUploadLine className="text-lg" /> {form.posterUrl ? 'REPLACE POSTER' : 'UPLOAD POSTER'}
                                            </label>
                                            {!editingTournament && <p className="text-[10px] text-yellow-500/60 font-medium">Save as DRAFT first to enable uploads.</p>}
                                        </div>
                                    </div>
                                </div>
                            </FormSection>

                            {/* Section 3 — Games */}
                            <FormSection title="3. Game Configuration" icon={RiGamepadLine}>
                                <div className="space-y-6">
                                    <div className="flex flex-col sm:flex-row gap-3">
                                        <input className={inputCls + ' flex-1'} placeholder="Add Game Name (e.g. BGMI)" value={tempGameName} onChange={e => setTempGameName(e.target.value)} onKeyDown={e => e.key === 'Enter' && addLocalGame()} />
                                        <button onClick={addLocalGame} className="px-6 py-2 bg-neon-green/10 text-neon-green border border-neon-green/30 rounded-xl font-bold hover:bg-neon-green/20 transition-all flex items-center justify-center gap-2">
                                            <RiAddLine className="text-xl" /> ADD GAME
                                        </button>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {form.supportedGames.map(game => (
                                            <div key={game.id} className="p-4 bg-white/5 border border-white/10 rounded-xl flex items-center gap-4 group">
                                                <div className="w-12 h-12 rounded-lg bg-black border border-white/10 flex items-center justify-center relative overflow-hidden flex-shrink-0">
                                                    {game.logoUrl ? <img src={resolveImageUrl(game.logoUrl)} className="w-full h-full object-contain" /> : <RiGamepadLine className="text-gray-700 text-xl" />}
                                                    {uploadingImage === game.id && <div className="absolute inset-0 bg-black/60 flex items-center justify-center"><RiLoader4Line className="text-neon-green animate-spin" /></div>}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-bold text-white truncate">{game.name}</p>
                                                    <div className="flex items-center gap-3 mt-1">
                                                        <input type="file" id={`game-${game.id}`} className="hidden" accept="image/*" onChange={e => handleFileChange(e, 'game', game.id)} disabled={!editingTournament} />
                                                        <label htmlFor={`game-${game.id}`} className={`text-[10px] font-bold tracking-wider uppercase transition-colors
                                                            ${editingTournament ? 'text-neon-green/60 hover:text-neon-green cursor-pointer' : 'text-gray-700 pointer-events-none'}`}>
                                                            {game.logoUrl ? 'Update Logo' : 'Upload Logo'}
                                                        </label>
                                                        <button onClick={() => setForm(f => ({ ...f, supportedGames: f.supportedGames.filter(g => g.id !== game.id) }))} className="text-[10px] font-bold tracking-wider uppercase text-red-500/60 hover:text-red-500 transition-colors">Remove</button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </FormSection>

                            {/* Section 4 — Colleges */}
                            <FormSection title="4. Participation Scope" icon={RiHotelLine}>
                                <div className="space-y-6">
                                    <div className="flex items-center justify-between p-4 bg-white/3 border border-white/8 rounded-xl">
                                        <div>
                                            <p className="font-bold text-white text-sm">Restrict to Selected Colleges</p>
                                            <p className="text-xs text-gray-500">Only players from the list can register.</p>
                                        </div>
                                        <button
                                            onClick={() => setForm(f => ({ ...f, collegesRestricted: !f.collegesRestricted }))}
                                            className={`w-12 h-6 rounded-full transition-all relative ${form.collegesRestricted ? 'bg-neon-green' : 'bg-white/10'}`}
                                        >
                                            <div className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-all ${form.collegesRestricted ? 'left-7' : 'left-1'}`} />
                                        </button>
                                    </div>

                                    {form.collegesRestricted && (
                                        <div className="space-y-6 animate-in slide-in-from-top-2 duration-300">
                                            <div className="flex flex-col sm:flex-row gap-3">
                                                <input className={inputCls + ' flex-1'} placeholder="College Name (e.g. IIT Delhi)" value={tempCollegeName} onChange={e => setTempCollegeName(e.target.value)} onKeyDown={e => e.key === 'Enter' && addLocalCollege()} />
                                                <button onClick={addLocalCollege} className="px-6 py-2 bg-white/5 text-white border border-white/10 rounded-xl font-bold hover:bg-white/10 transition-all flex items-center justify-center gap-2">
                                                    <RiAddLine className="text-xl" /> ADD COLLEGE
                                                </button>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {form.allowedColleges.map(col => (
                                                    <div key={col.id} className="p-4 bg-white/5 border border-white/10 rounded-xl flex items-center gap-4">
                                                        <div className="w-12 h-12 rounded-lg bg-black border border-white/10 flex items-center justify-center relative overflow-hidden flex-shrink-0">
                                                            {col.logoUrl ? <img src={resolveImageUrl(col.logoUrl)} className="w-full h-full object-contain" /> : <RiHotelLine className="text-gray-700 text-xl" />}
                                                            {uploadingImage === col.id && <div className="absolute inset-0 bg-black/60 flex items-center justify-center"><RiLoader4Line className="text-neon-green animate-spin" /></div>}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-sm font-bold text-white truncate">{col.name}</p>
                                                            <div className="flex items-center gap-3 mt-1">
                                                                <input type="file" id={`col-${col.id}`} className="hidden" accept="image/*" onChange={e => handleFileChange(e, 'college', col.id)} disabled={!editingTournament} />
                                                                <label htmlFor={`col-${col.id}`} className={`text-[10px] font-bold tracking-wider uppercase transition-colors
                                                                    ${editingTournament ? 'text-neon-green/60 hover:text-neon-green cursor-pointer' : 'text-gray-700 pointer-events-none'}`}>
                                                                    {col.logoUrl ? 'Update Logo' : 'Upload Logo'}
                                                                </label>
                                                                <button onClick={() => setForm(f => ({ ...f, allowedColleges: f.allowedColleges.filter(c => c.id !== col.id) }))} className="text-[10px] font-bold tracking-wider uppercase text-red-500/60 hover:text-red-500 transition-colors">Remove</button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </FormSection>

                            {/* Section 5 — Finance & Limits */}
                            <FormSection title="5. Finance & Limits" icon={RiMoneyDollarCircleLine}>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <Field label="Entry Fee (₹) — 0 for Free">
                                        <div className="relative">
                                            <RiMoneyDollarCircleLine className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
                                            <input type="number" className={inputCls + ' pl-10'} value={form.paymentAmount} onChange={e => setForm({ ...form, paymentAmount: parseInt(e.target.value) || 0 })} />
                                        </div>
                                    </Field>
                                    <Field label="Maximum Slots (0 for Unlimited)">
                                        <div className="relative">
                                            <RiGroupLine className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
                                            <input type="number" className={inputCls + ' pl-10'} value={form.maxSlots} onChange={e => setForm({ ...form, maxSlots: parseInt(e.target.value) || 0 })} />
                                        </div>
                                    </Field>
                                </div>
                            </FormSection>
                        </div>

                        {/* Modal Footer */}
                        <div className="p-6 border-t border-white/10 bg-[#070707] rounded-b-2xl flex flex-col sm:flex-row gap-4">
                            <button
                                onClick={() => handleSave('DRAFT')}
                                disabled={saving}
                                className="flex-1 px-8 py-3.5 bg-white/5 text-white border border-white/10 rounded-xl font-bold hover:bg-white/10 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                {saving ? <RiLoader4Line className="animate-spin text-xl" /> : <RiEditLine className="text-xl" />}
                                SAVE AS DRAFT
                            </button>
                            <button
                                onClick={() => handleSave('ACTIVE')}
                                disabled={saving}
                                className="flex-1 px-8 py-3.5 bg-neon-green text-black rounded-xl font-bold hover:bg-neon-green/90 transition-all shadow-[0_0_20px_rgba(0,255,102,0.15)] flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                {saving ? <RiLoader4Line className="animate-spin text-xl" /> : <RiCheckLine className="text-xl font-bold" />}
                                ACTIVATE TOURNAMENT
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// ─── HELPERS ────────────────────────────────────────────────────────────

function StatCard({ label, value, color = "text-white" }: { label: string; value: number; color?: string }) {
    return (
        <GlowCard>
            <div className="text-center md:text-left">
                <p className="text-[10px] sm:text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">{label}</p>
                <p className={`text-xl sm:text-2xl font-orbitron font-bold ${color}`}>{value}</p>
            </div>
        </GlowCard>
    );
}

function TournamentCard({ tournament, onEdit, onDelete, delay }: { tournament: Tournament; onEdit: () => void; onDelete: () => void; delay: number }) {
    return (
        <GlowCard delay={delay}>
            <div className="space-y-5 h-full flex flex-col">
                <div className="aspect-video w-full rounded-xl bg-white/5 border border-white/5 overflow-hidden relative">
                    {tournament.posterUrl ? (
                        <img src={resolveImageUrl(tournament.posterUrl)} alt={tournament.name} className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-600">No Poster</div>
                    )}
                    <div className="absolute top-3 right-3">
                        <StatusBadge status={tournament.status} />
                    </div>
                </div>

                <div className="flex-1">
                    <h3 className="text-lg font-orbitron font-bold text-white tracking-wide truncate">{tournament.name}</h3>
                    <p className="text-xs text-gray-500 mt-2 line-clamp-2 leading-relaxed">{tournament.description}</p>
                </div>

                <div className="grid grid-cols-2 gap-3 pb-3">
                    <MiniInfo label="Slots" value={`${tournament.currentRegistrations}/${tournament.maxSlots || '∞'}`} />
                    <MiniInfo label="Entry" value={tournament.paymentAmount === 0 ? 'FREE' : `₹${tournament.paymentAmount}`} />
                </div>

                <div className="flex items-center gap-2 pt-4 border-t border-white/5">
                    <button onClick={onEdit} className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-white/5 border border-white/8 rounded-lg text-xs font-bold text-white hover:bg-white/10 transition-all uppercase tracking-widest">
                        <RiEditLine /> Configure
                    </button>
                    <button onClick={onDelete} disabled={tournament.currentRegistrations > 0} className="w-10 h-10 flex items-center justify-center bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 hover:bg-red-500/20 transition-all disabled:opacity-20 disabled:grayscale">
                        <RiDeleteBinLine />
                    </button>
                </div>
            </div>
        </GlowCard>
    );
}

function StatusBadge({ status }: { status: string }) {
    const cls = status === 'ACTIVE' ? 'bg-neon-green/10 text-neon-green border-neon-green/30' :
        status === 'DRAFT' ? 'bg-yellow-400/10 text-yellow-400 border-yellow-400/30' :
            'bg-red-400/10 text-red-400 border-red-400/30';
    return (
        <span className={`px-2.5 py-1 rounded-md border text-[10px] font-bold uppercase tracking-widest backdrop-blur-md ${cls}`}>
            {status}
        </span>
    );
}

function MiniInfo({ label, value }: { label: string; value: string }) {
    return (
        <div className="space-y-0.5">
            <p className="text-[9px] font-bold text-gray-600 uppercase tracking-tighter">{label}</p>
            <p className="text-[11px] font-bold text-white truncate">{value}</p>
        </div>
    );
}

function FormSection({ title, icon: Icon, children }: { title: string; icon: any; children: React.ReactNode }) {
    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3 pb-2 border-b border-white/5">
                <Icon className="text-xl text-neon-green" />
                <h3 className="font-orbitron font-bold text-gray-300 tracking-wider text-sm">{title}</h3>
            </div>
            {children}
        </div>
    );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className="space-y-2">
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest">{label}</label>
            {children}
        </div>
    );
}

const inputCls = "w-full bg-white/3 border border-white/8 rounded-xl px-4 py-2.5 text-white text-sm placeholder-gray-700 focus:outline-none focus:border-neon-green/40 focus:bg-white/5 transition-all";
