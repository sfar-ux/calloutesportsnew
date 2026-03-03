"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import {
    RiAlertFill, RiCheckLine, RiArrowRightLine, RiArrowLeftLine,
    RiTeamLine, RiGamepadLine, RiQrCodeLine, RiMoneyDollarCircleLine,
    RiShieldCheckLine, RiLoader4Line, RiCopyrightLine, RiCalendarLine,
    RiSmartphoneLine, RiBankLine, RiHotelLine, RiGroupLine
} from 'react-icons/ri';
import Image from 'next/image';
import { resolveImageUrl } from '@/lib/utils';

// ─── STEP DEFINITIONS ──────────────────────────────────────────────────────────
const STEPS = [
    { id: 1, label: 'Tournament', icon: RiGamepadLine },
    { id: 2, label: 'Squad', icon: RiTeamLine },
    { id: 3, label: 'Payment QR', icon: RiQrCodeLine },
    { id: 4, label: 'Confirm', icon: RiShieldCheckLine },
];

// ─── HELPERS ───────────────────────────────────────────────────────────────────
const slideVariants = {
    enter: (dir: number) => ({ x: dir > 0 ? 60 : -60, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: dir > 0 ? -60 : 60, opacity: 0 }),
};

function StepBar({ current }: { current: number }) {
    return (
        <div className="flex items-center justify-center gap-0 mb-10 w-full max-w-lg mx-auto">
            {STEPS.map((s, i) => {
                const done = current > s.id;
                const active = current === s.id;
                const Icon = s.icon;
                return (
                    <div key={s.id} className="flex items-center flex-1 last:flex-none">
                        <div className="flex flex-col items-center gap-1.5">
                            <div className={`w-9 h-9 rounded-full flex items-center justify-center border-2 transition-all duration-300
                                ${done ? 'bg-neon-green border-neon-green' : ''}
                                ${active ? 'border-neon-green bg-neon-green/10' : 'border-white/20 bg-white/5'}`}>
                                {done
                                    ? <RiCheckLine className="text-black text-base font-bold" />
                                    : <Icon className={`text-base ${active ? 'text-neon-green' : 'text-gray-500'}`} />
                                }
                            </div>
                            <span className={`text-[10px] font-bold tracking-wider uppercase hidden sm:block
                                ${active ? 'text-neon-green' : done ? 'text-white/60' : 'text-white/25'}`}>
                                {s.label}
                            </span>
                        </div>
                        {i < STEPS.length - 1 && (
                            <div className={`h-px flex-1 mx-2 transition-all duration-500 ${done ? 'bg-neon-green' : 'bg-white/10'}`} />
                        )}
                    </div>
                );
            })}
        </div>
    );
}

function ErrorBox({ msg }: { msg: string }) {
    return (
        <div className="bg-red-500/10 border border-red-500/30 p-4 rounded-xl flex items-start gap-3 text-red-400 text-sm">
            <RiAlertFill className="text-xl flex-shrink-0 mt-0.5" />
            <p>{msg}</p>
        </div>
    );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className="space-y-1.5">
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest">{label}</label>
            {children}
        </div>
    );
}

const inputCls = "w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-neon-green/60 focus:bg-white/8 transition-all text-sm";

// ─── MAIN COMPONENT ────────────────────────────────────────────────────────────
export default function RegisterTournamentPage() {
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [dir, setDir] = useState(1);
    const [error, setError] = useState('');
    const [busy, setBusy] = useState(false);

    /* ---------- STEP 1 — TOURNAMENT SELECTION ---------- */
    const [tournaments, setTournaments] = useState<any[]>([]);
    const [selectedTournament, setSelectedTournament] = useState<any>(null);
    const [tLoading, setTLoading] = useState(true);
    const [subStep, setSubStep] = useState<'tournament' | 'game' | 'college'>('tournament');

    useEffect(() => {
        api.get('/tournaments')
            .then(r => {
                if (r.data.success) {
                    const active = r.data.data.filter((t: any) => t.status?.toLowerCase() === 'active');
                    setTournaments(active);
                }
            })
            .catch(() => { })
            .finally(() => setTLoading(false));
    }, []);

    /* ---------- STEP 2 — SQUAD FORM ---------- */
    const [squad, setSquad] = useState({
        teamName: '',
        iglName: '', iglId: '',    // IGL in-game ID
        iglContact: '',
        player2: '', player2Id: '',
        player3: '', player3Id: '',
        player4: '', player4Id: '',
        substitute: '', substituteId: '',
        college: '',
        game: '',
    });

    /* ---------- STEP 3 — QR & PAYMENT ---------- */
    const [registrationId, setRegistrationId] = useState('');
    const [qrData, setQrData] = useState<{ qrIndex: number; qrImageUrl: string; amount: number } | null>(null);
    const [payment, setPayment] = useState({
        transactionId: '',
        upiId: '',
        bankName: '',
        paymentDate: '',
        paymentTime: '',
    });

    /* ---------- STEP 4 — DONE ---------- */
    const [confirmed, setConfirmed] = useState(false);

    // ── nav helpers ──────────────────────────────────────────────────────────
    const go = (n: number) => { setDir(n > step ? 1 : -1); setError(''); setStep(n); };

    // ── STEP 1 SUB-NAV : handles Tournament -> Game -> College ──
    const handleTournamentNext = () => {
        if (!selectedTournament) { setError('Please select a tournament to continue.'); return; }
        if (selectedTournament.isFull) { setError('This tournament is full. Please choose another.'); return; }

        // Determine if we need Game selection
        if (subStep === 'tournament') {
            if (selectedTournament.supportedGames?.length > 1) {
                setSubStep('game');
                return;
            }
            // Auto-pick the only game if applicable
            if (selectedTournament.supportedGames?.length === 1) {
                setSquad(s => ({ ...s, game: selectedTournament.supportedGames[0].name }));
            }
        }

        // Determine if we need College selection
        if (subStep === 'tournament' || subStep === 'game') {
            // Validate game selected if we were on 'game' subStep
            if (subStep === 'game' && !squad.game) {
                setError('Please select a game to continue.'); return;
            }

            if (selectedTournament.collegesRestricted && selectedTournament.allowedColleges?.length > 0) {
                setSubStep('college');
                return;
            }
        }

        // Final validation for college if we were on 'college' subStep
        if (subStep === 'college' && !squad.college) {
            setError('Please select a college to continue.'); return;
        }

        go(2);
    };

    const handleBackStep1 = () => {
        if (subStep === 'college') {
            if (selectedTournament.supportedGames?.length > 1) setSubStep('game');
            else setSubStep('tournament');
        } else if (subStep === 'game') {
            setSubStep('tournament');
        }
    };

    // ── STEP 2 → 3 : preview QR only (NO Firestore write, NO registration created) ──
    const handleSquadSubmit = async () => {
        setError('');
        const { teamName, iglName, iglContact, player2, player3, player4 } = squad;

        if (!teamName || !iglName || !iglContact || !player2 || !player3 || !player4) {
            setError('Please fill in all required squad fields.'); return;
        }
        if (iglContact.trim().length < 3) {
            setError('IGL contact must be at least 3 characters (phone or Discord handle).'); return;
        }

        setBusy(true);
        try {
            // Read-only: just gets the current QR image + amount — nothing written to Firestore.
            const qrRes = await api.get(`/payments/preview-qr?tournamentId=${selectedTournament.id}`);
            setQrData(qrRes.data.data);
            go(3);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Could not load QR. Please try again.');
        } finally {
            setBusy(false);
        }
    };

    // ── STEP 3 → 4 : ATOMICALLY create registration + QR + payment (first Firestore write) ──
    const handlePaymentSubmit = async () => {
        setError('');
        const { transactionId, upiId, paymentDate, paymentTime, bankName } = payment;
        if (!transactionId || !paymentDate) {
            setError('Transaction ID and payment date are required.'); return;
        }

        const { teamName, iglName, iglId, iglContact, player2, player2Id,
            player3, player3Id, player4, player4Id,
            substitute, substituteId, college, game } = squad;
        const playerNames = [
            iglName, player2, player3, player4,
            ...(substitute ? [substitute] : [])
        ].filter(Boolean);
        const playerIds = [
            iglId, player2Id, player3Id, player4Id,
            ...(substitute ? [substituteId] : [])
        ];

        setBusy(true);
        try {
            // Single atomic call — creates registration + assigns QR rotation + creates payment doc
            const res = await api.post('/registrations/complete-with-payment', {
                tournamentId: selectedTournament.id,
                teamName,
                iglName,
                iglContact,
                playerNames,
                playerIds,
                college: college || undefined,
                game: game || undefined,
                transactionId,
                upiId: upiId || undefined,
                bankName: bankName || undefined,
                paymentDate,
                paymentTime: paymentTime || undefined,
            });
            setRegistrationId(res.data.data.registrationId);
            setConfirmed(true);
            go(4);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Submission failed. Please try again.');
        } finally {
            setBusy(false);
        }
    };

    // ────────────────────────────────────────────────────────────────────────
    return (
        <div className="min-h-screen bg-black py-8 px-4">

            {/* Page header */}
            <div className="text-center mb-8">
                <h1 className="font-orbitron font-bold text-2xl sm:text-3xl text-white tracking-widest glow-text uppercase">
                    Squad Registration
                </h1>
                <p className="text-gray-500 mt-2 text-sm">Complete all steps to secure your slot.</p>
            </div>

            <StepBar current={step} />

            {/* Card */}
            <div className="max-w-2xl mx-auto relative overflow-hidden">
                <AnimatePresence custom={dir} mode="wait">
                    <motion.div
                        key={step}
                        custom={dir}
                        variants={slideVariants}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        transition={{ duration: 0.28, ease: 'easeInOut' }}
                        className="bg-[#0d0d0d] border border-white/8 rounded-2xl p-6 sm:p-8 space-y-6 shadow-2xl"
                    >

                        {/* ═══════════ STEP 1 — SELECTION WIZARD ═══════════ */}
                        {step === 1 && (
                            <>
                                {subStep === 'tournament' && (
                                    <>
                                        <SectionTitle icon={RiGamepadLine} title="Choose Tournament" />
                                        {error && <ErrorBox msg={error} />}

                                        {tLoading ? (
                                            <div className="flex items-center justify-center py-12 text-gray-500 gap-3">
                                                <RiLoader4Line className="animate-spin text-2xl" />
                                                <span>Loading active tournaments…</span>
                                            </div>
                                        ) : tournaments.length === 0 ? (
                                            <div className="text-center py-12 text-gray-500">
                                                No active tournaments right now. Check back soon.
                                            </div>
                                        ) : (
                                            <div className="space-y-3">
                                                {tournaments.map(t => (
                                                    <button
                                                        key={t.id}
                                                        onClick={() => { setSelectedTournament(t); setError(''); }}
                                                        className={`w-full text-left rounded-xl border p-4 transition-all duration-200
                                                            ${selectedTournament?.id === t.id
                                                                ? 'border-neon-green/60 bg-neon-green/5 shadow-[0_0_20px_rgba(0,255,102,0.08)]'
                                                                : 'border-white/8 bg-white/3 hover:border-white/20 hover:bg-white/5'}`}
                                                    >
                                                        <div className="flex items-start gap-4">
                                                            {/* Tournament Poster/Logo */}
                                                            {(t.posterUrl || t.logoUrl) && (
                                                                <div className="flex-shrink-0 w-24 h-24 rounded-lg overflow-hidden border border-white/10">
                                                                    <img 
                                                                        src={resolveImageUrl(t.posterUrl || t.logoUrl)} 
                                                                        alt={t.name}
                                                                        className="w-full h-full object-cover"
                                                                    />
                                                                </div>
                                                            )}
                                                            
                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex items-start justify-between gap-4 mb-2">
                                                                    <div className="flex-1 min-w-0">
                                                                        <p className="font-orbitron font-bold text-white text-sm tracking-wide truncate">{t.name}</p>
                                                                        {t.description && <p className="text-gray-500 text-xs mt-1 line-clamp-2">{t.description}</p>}
                                                                    </div>
                                                                    <div className={`flex-shrink-0 w-5 h-5 rounded-full border-2 mt-0.5 transition-all
                                                                        ${selectedTournament?.id === t.id ? 'border-neon-green bg-neon-green' : 'border-white/20'}`}>
                                                                        {selectedTournament?.id === t.id && (
                                                                            <RiCheckLine className="text-black text-xs w-full h-full" />
                                                                        )}
                                                                    </div>
                                                                </div>

                                                                <div className="grid grid-cols-3 gap-2 mt-3">
                                                                    <InfoChip icon={RiMoneyDollarCircleLine} color="text-neon-green"
                                                                        label={t.paymentAmount === 0 ? 'Free' : `₹${t.paymentAmount}`} />
                                                                    <InfoChip icon={RiGroupLine} color="text-blue-400"
                                                                        label={t.maxSlots > 0 ? `${t.currentRegistrations}/${t.maxSlots} slots` : 'Unlimited'} />
                                                                    <InfoChip icon={RiGamepadLine} color="text-purple-400"
                                                                        label={t.supportedGames?.length > 0 ? t.supportedGames.map((g: any) => g.name).join(', ') : 'Any game'} />
                                                                </div>

                                                                {t.isFull && (
                                                                    <div className="mt-2 text-xs text-red-400 font-bold uppercase tracking-wider">
                                                                        ✗ Tournament Full
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </>
                                )}

                                {subStep === 'game' && selectedTournament && (
                                    <>
                                        <SectionTitle icon={RiGamepadLine} title="Select Game" subtitle={selectedTournament.name} />
                                        {error && <ErrorBox msg={error} />}
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            {selectedTournament.supportedGames.map((g: any) => (
                                                <button
                                                    key={g.id}
                                                    onClick={() => { setSquad(s => ({ ...s, game: g.name })); setError(''); }}
                                                    className={`p-4 rounded-xl border flex items-center gap-4 transition-all duration-200
                                                        ${squad.game === g.name
                                                            ? 'border-neon-green bg-neon-green/10 text-neon-green shadow-[0_0_15px_rgba(0,255,102,0.1)]'
                                                            : 'border-white/10 bg-white/5 text-gray-400 hover:border-white/30 hover:bg-white/10 hover:text-white'}`}
                                                >
                                                    <div className="w-10 h-10 rounded-lg bg-black/40 border border-white/10 flex items-center justify-center overflow-hidden flex-shrink-0">
                                                        {g.logoUrl ? <img src={resolveImageUrl(g.logoUrl)} alt={g.name} className="w-full h-full object-contain" /> : <RiGamepadLine />}
                                                    </div>
                                                    <span className="font-orbitron font-bold tracking-wider text-sm truncate">{g.name}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </>
                                )}

                                {subStep === 'college' && selectedTournament && (
                                    <>
                                        <SectionTitle icon={RiHotelLine} title="Select College" subtitle={selectedTournament.name} />
                                        {error && <ErrorBox msg={error} />}
                                        <div className="grid grid-cols-1 gap-3">
                                            {selectedTournament.allowedColleges.map((c: any) => (
                                                <button
                                                    key={c.id}
                                                    onClick={() => { setSquad(s => ({ ...s, college: c.name })); setError(''); }}
                                                    className={`p-3 rounded-xl border flex items-center gap-4 transition-all duration-200
                                                        ${squad.college === c.name
                                                            ? 'border-neon-green bg-neon-green/10 text-neon-green'
                                                            : 'border-white/10 bg-white/5 text-gray-400 hover:border-white/30 hover:bg-white/10 hover:text-white'}`}
                                                >
                                                    <div className="w-10 h-10 rounded-lg bg-black/40 border border-white/10 flex items-center justify-center overflow-hidden flex-shrink-0">
                                                        {c.logoUrl ? <img src={resolveImageUrl(c.logoUrl)} alt={c.name} className="w-full h-full object-contain" /> : <RiHotelLine />}
                                                    </div>
                                                    <span className="font-semibold flex-1 truncate text-sm">{c.name}</span>
                                                    {squad.college === c.name && <RiCheckLine className="text-neon-green" />}
                                                </button>
                                            ))}
                                        </div>
                                    </>
                                )}

                                <div className="flex items-center justify-between pt-2">
                                    {subStep !== 'tournament' ? (
                                        <NavButton icon={RiArrowLeftLine} label="Back" secondary onClick={handleBackStep1} iconLeft />
                                    ) : <div />}
                                    <NavButton
                                        icon={RiArrowRightLine}
                                        label="Continue"
                                        onClick={handleTournamentNext}
                                        disabled={!selectedTournament || tLoading}
                                    />
                                </div>
                            </>
                        )}

                        {/* ═══════════ STEP 2 — SQUAD FORM ═══════════ */}
                        {step === 2 && (
                            <>
                                <SectionTitle icon={RiTeamLine} title="Your Squad" subtitle={selectedTournament?.name} />
                                {error && <ErrorBox msg={error} />}

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <Field label="Squad Name *">
                                        <input className={inputCls} placeholder="e.g. Team Nexus" value={squad.teamName}
                                            onChange={e => setSquad(s => ({ ...s, teamName: e.target.value }))} />
                                    </Field>
                                    <Field label="IGL Contact * (Phone / Discord)">
                                        <input className={inputCls} placeholder="9876543210 or User#1234" value={squad.iglContact}
                                            onChange={e => setSquad(s => ({ ...s, iglContact: e.target.value }))} />
                                    </Field>
                                </div>

                                <div className="border-t border-white/8 pt-4">
                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Roster  (min 4 players required)</p>

                                    {/* Helper row labels */}
                                    <div className="hidden sm:grid sm:grid-cols-2 gap-4 mb-1">
                                        <p className="text-xs text-gray-600 pl-1">Display Name *</p>
                                        <p className="text-xs text-gray-600 pl-1">In-Game ID *</p>
                                    </div>

                                    {/* IGL */}
                                    <p className="text-xs font-bold text-neon-green/70 uppercase tracking-widest mb-1">IGL / Player 1</p>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                                        <input className={inputCls} placeholder="IGL display name" value={squad.iglName}
                                            onChange={e => setSquad(s => ({ ...s, iglName: e.target.value }))} />
                                        <input className={inputCls} placeholder="IGL in-game ID / UID" value={squad.iglId}
                                            onChange={e => setSquad(s => ({ ...s, iglId: e.target.value }))} />
                                    </div>

                                    {/* Player 2 */}
                                    <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Player 2</p>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                                        <input className={inputCls} placeholder="Player 2 name" value={squad.player2}
                                            onChange={e => setSquad(s => ({ ...s, player2: e.target.value }))} />
                                        <input className={inputCls} placeholder="Player 2 in-game ID" value={squad.player2Id}
                                            onChange={e => setSquad(s => ({ ...s, player2Id: e.target.value }))} />
                                    </div>

                                    {/* Player 3 */}
                                    <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Player 3</p>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                                        <input className={inputCls} placeholder="Player 3 name" value={squad.player3}
                                            onChange={e => setSquad(s => ({ ...s, player3: e.target.value }))} />
                                        <input className={inputCls} placeholder="Player 3 in-game ID" value={squad.player3Id}
                                            onChange={e => setSquad(s => ({ ...s, player3Id: e.target.value }))} />
                                    </div>

                                    {/* Player 4 */}
                                    <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Player 4</p>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                                        <input className={inputCls} placeholder="Player 4 name" value={squad.player4}
                                            onChange={e => setSquad(s => ({ ...s, player4: e.target.value }))} />
                                        <input className={inputCls} placeholder="Player 4 in-game ID" value={squad.player4Id}
                                            onChange={e => setSquad(s => ({ ...s, player4Id: e.target.value }))} />
                                    </div>

                                    {/* Substitute (optional) */}
                                    <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Substitute <span className="text-gray-600">(optional)</span></p>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <input className={inputCls} placeholder="Sub name (optional)" value={squad.substitute}
                                            onChange={e => setSquad(s => ({ ...s, substitute: e.target.value }))} />
                                        <input className={inputCls} placeholder="Sub in-game ID (optional)" value={squad.substituteId}
                                            onChange={e => setSquad(s => ({ ...s, substituteId: e.target.value }))} />
                                    </div>
                                </div>


                                <div className="flex items-center justify-between pt-2">
                                    <NavButton icon={RiArrowLeftLine} label="Back" secondary onClick={() => go(1)} disabled={busy} iconLeft />
                                    <NavButton icon={RiArrowRightLine} label={busy ? 'Securing…' : 'Register & Get QR'} onClick={handleSquadSubmit} disabled={busy} loading={busy} />
                                </div>
                            </>
                        )}

                        {/* ═══════════ STEP 3 — QR + PAYMENT ═══════════ */}
                        {step === 3 && qrData && (
                            <>
                                <SectionTitle icon={RiQrCodeLine} title="Complete Payment" subtitle={`Entry Fee: ₹${qrData.amount}`} />
                                {error && <ErrorBox msg={error} />}

                                {/* QR Display */}
                                <div className="flex flex-col sm:flex-row gap-6 items-start">
                                    <div className="flex-shrink-0 mx-auto sm:mx-0">
                                        <div className="p-2 bg-white rounded-2xl shadow-[0_0_40px_rgba(0,255,102,0.15)]">
                                            {qrData.qrImageUrl ? (
                                                <img
                                                    src={qrData.qrImageUrl}
                                                    alt="UPI QR Code"
                                                    width={180}
                                                    height={180}
                                                    className="rounded-xl block"
                                                />
                                            ) : (
                                                <div className="w-[180px] h-[180px] rounded-xl bg-gray-100 flex items-center justify-center text-gray-400 text-sm text-center px-4">
                                                    QR Image not available
                                                </div>
                                            )}
                                        </div>
                                        <p className="text-center text-xs text-gray-500 mt-2">Scan this QR to pay</p>
                                    </div>

                                    <div className="flex-1 space-y-3">
                                        <div className="bg-neon-green/5 border border-neon-green/20 rounded-xl p-4">
                                            <p className="text-neon-green font-orbitron font-bold text-lg">₹{qrData.amount}</p>
                                            <p className="text-gray-400 text-xs mt-1">Pay exactly this amount via UPI</p>
                                        </div>
                                        <ul className="text-xs text-gray-500 space-y-1.5 list-none">
                                            <li className="flex items-start gap-2"><RiCheckLine className="text-neon-green flex-shrink-0 mt-0.5" /> Open any UPI app (GPay, PhonePe, Paytm…)</li>
                                            <li className="flex items-start gap-2"><RiCheckLine className="text-neon-green flex-shrink-0 mt-0.5" /> Scan the QR or use the UPI ID shown</li>
                                            <li className="flex items-start gap-2"><RiCheckLine className="text-neon-green flex-shrink-0 mt-0.5" /> Pay exactly ₹{qrData.amount}</li>
                                            <li className="flex items-start gap-2"><RiCheckLine className="text-neon-green flex-shrink-0 mt-0.5" /> Save your Transaction ID from the app</li>
                                            <li className="flex items-start gap-2"><RiCheckLine className="text-neon-green flex-shrink-0 mt-0.5" /> Fill in the form below and submit proof</li>
                                        </ul>
                                    </div>
                                </div>

                                {/* Payment Submission Form */}
                                <div className="border-t border-white/8 pt-5 space-y-4">
                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Submit Payment Proof</p>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <Field label="Transaction ID *">
                                            <div className="relative">
                                                <RiCopyrightLine className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
                                                <input className={inputCls + ' pl-9'} placeholder="e.g. UPI123456789"
                                                    value={payment.transactionId}
                                                    onChange={e => setPayment(p => ({ ...p, transactionId: e.target.value }))} />
                                            </div>
                                        </Field>
                                        <Field label="UPI ID (optional)">
                                            <div className="relative">
                                                <RiSmartphoneLine className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
                                                <input className={inputCls + ' pl-9'} placeholder="yourname@upi"
                                                    value={payment.upiId}
                                                    onChange={e => setPayment(p => ({ ...p, upiId: e.target.value }))} />
                                            </div>
                                        </Field>
                                        <Field label="Bank / App Name">
                                            <div className="relative">
                                                <RiBankLine className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
                                                <input className={inputCls + ' pl-9'} placeholder="e.g. PhonePe / ICICI"
                                                    value={payment.bankName}
                                                    onChange={e => setPayment(p => ({ ...p, bankName: e.target.value }))} />
                                            </div>
                                        </Field>
                                        <Field label="Payment Date *">
                                            <div className="relative">
                                                <RiCalendarLine className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
                                                <input type="date" className={inputCls + ' pl-9 [color-scheme:dark]'}
                                                    value={payment.paymentDate}
                                                    onChange={e => setPayment(p => ({ ...p, paymentDate: e.target.value }))} />
                                            </div>
                                        </Field>
                                        <Field label="Payment Time">
                                            <div className="relative">
                                                <RiCalendarLine className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
                                                <input type="time" className={inputCls + ' pl-9 [color-scheme:dark]'}
                                                    value={payment.paymentTime}
                                                    onChange={e => setPayment(p => ({ ...p, paymentTime: e.target.value }))} />
                                            </div>
                                        </Field>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between pt-2">
                                    <NavButton icon={RiArrowLeftLine} label="Back" secondary onClick={() => go(2)} disabled={busy} iconLeft />
                                    <NavButton
                                        icon={RiShieldCheckLine}
                                        label={busy ? 'Submitting…' : 'Submit Payment'}
                                        onClick={handlePaymentSubmit}
                                        disabled={busy}
                                        loading={busy}
                                    />
                                </div>
                            </>
                        )}

                        {/* ═══════════ STEP 4 — CONFIRMED ═══════════ */}
                        {step === 4 && (
                            <div className="text-center py-6 space-y-6">
                                <motion.div
                                    initial={{ scale: 0, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.1 }}
                                    className="w-20 h-20 rounded-full bg-neon-green/10 border-2 border-neon-green mx-auto flex items-center justify-center"
                                >
                                    <RiCheckLine className="text-neon-green text-4xl" />
                                </motion.div>

                                <div>
                                    <h2 className="font-orbitron font-bold text-xl text-white tracking-wide">Registration Submitted!</h2>
                                    <p className="text-gray-400 text-sm mt-2 max-w-sm mx-auto">
                                        Your squad has been registered and payment proof submitted.
                                        Admin will verify your payment within 24 hours.
                                    </p>
                                </div>

                                <div className="bg-white/3 border border-white/8 rounded-xl p-4 text-sm space-y-2 text-left max-w-sm mx-auto">
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Tournament</span>
                                        <span className="text-white font-semibold">{selectedTournament?.name}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Squad</span>
                                        <span className="text-white font-semibold">{squad.teamName}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Status</span>
                                        <span className="text-yellow-400 font-bold">Payment Under Review</span>
                                    </div>
                                </div>

                                <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
                                    <button
                                        onClick={() => router.push('/dashboard/tournaments')}
                                        className="px-6 py-3 bg-neon-green text-black font-bold rounded-xl hover:bg-neon-green/90 transition-all text-sm tracking-wide"
                                    >
                                        View My Registrations
                                    </button>
                                    <button
                                        onClick={() => router.push('/dashboard')}
                                        className="px-6 py-3 bg-white/8 text-white font-semibold rounded-xl hover:bg-white/12 transition-all text-sm border border-white/10"
                                    >
                                        Go to Dashboard
                                    </button>
                                </div>
                            </div>
                        )}

                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
}

// ─── SMALL REUSABLE SUB-COMPONENTS ─────────────────────────────────────────────

function SectionTitle({ icon: Icon, title, subtitle }: { icon: any; title: string; subtitle?: string }) {
    return (
        <div className="flex items-center gap-3 pb-2">
            <div className="w-9 h-9 rounded-xl bg-neon-green/10 border border-neon-green/20 flex items-center justify-center flex-shrink-0">
                <Icon className="text-neon-green text-lg" />
            </div>
            <div>
                <h2 className="font-orbitron font-bold text-white text-base tracking-wide">{title}</h2>
                {subtitle && <p className="text-gray-500 text-xs mt-0.5">{subtitle}</p>}
            </div>
        </div>
    );
}

function InfoChip({ icon: Icon, color, label }: { icon: any; color: string; label: string }) {
    return (
        <div className="flex items-center gap-1.5 bg-white/5 rounded-lg px-2.5 py-1.5">
            <Icon className={`flex-shrink-0 text-sm ${color}`} />
            <span className="text-xs text-gray-300 truncate">{label}</span>
        </div>
    );
}

function NavButton({
    icon: Icon, label, onClick, disabled, secondary = false, iconLeft = false, loading = false
}: {
    icon: any; label: string; onClick: () => void; disabled?: boolean; secondary?: boolean; iconLeft?: boolean; loading?: boolean;
}) {
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed
                ${secondary
                    ? 'bg-white/5 text-gray-300 border border-white/10 hover:bg-white/10'
                    : 'bg-neon-green text-black hover:bg-neon-green/90 shadow-[0_0_20px_rgba(0,255,102,0.2)] hover:shadow-[0_0_28px_rgba(0,255,102,0.35)]'}`}
        >
            {iconLeft && (loading ? <RiLoader4Line className="animate-spin" /> : <Icon />)}
            <span>{label}</span>
            {!iconLeft && (loading ? <RiLoader4Line className="animate-spin" /> : <Icon />)}
        </button>
    );
}
