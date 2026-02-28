"use client";

import { useState, useMemo } from 'react';
import { useRealtimeCollection } from '@/hooks/useRealtimeCollection';
import { orderBy, doc, updateDoc, deleteDoc, getFirestore, increment, getDoc } from 'firebase/firestore';
import { app } from '@/lib/firebase';
import GlowCard from '@/components/GlowCard';
import { RiTeamLine, RiSearchLine, RiCheckLine, RiCloseLine, RiEyeLine, RiDownloadLine, RiDeleteBinLine } from 'react-icons/ri';
import { Registration } from '@/types';

export default function AdminRegistrationsPage() {
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [selectedReg, setSelectedReg] = useState<Registration | null>(null);
    const [verifying, setVerifying] = useState(false);

    const { data: registrations, loading } = useRealtimeCollection<Registration>(
        'registrations',
        [orderBy('createdAt', 'desc')]
    );

    const filteredRegistrations = useMemo(() => {
        return registrations.filter(reg => {
            const matchesSearch = searchTerm === '' ||
                reg.teamName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                reg.iglName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (reg.iglContact || '').toLowerCase().includes(searchTerm.toLowerCase());

            const matchesStatus = statusFilter === 'all' ||
                (statusFilter === 'verified' && reg.paymentVerified) ||
                (statusFilter === 'pending' && !reg.paymentVerified && reg.paymentStatus === 'PENDING') ||
                (statusFilter === 'failed' && reg.paymentStatus === 'FAILED');

            return matchesSearch && matchesStatus;
        });
    }, [registrations, searchTerm, statusFilter]);

    const stats = useMemo(() => {
        const total = registrations.length;
        const verified = registrations.filter(r => r.paymentVerified).length;
        const pending = registrations.filter(r => !r.paymentVerified && r.paymentStatus === 'PENDING').length;
        const failed = registrations.filter(r => r.paymentStatus === 'FAILED').length;

        return { total, verified, pending, failed };
    }, [registrations]);

    const handleVerifyPayment = async (regId: string) => {
        if (!confirm('Are you sure you want to verify this payment?')) return;

        setVerifying(true);
        try {
            const db = getFirestore(app);
            await updateDoc(doc(db, 'registrations', regId), {
                paymentVerified: true,
                paymentStatus: 'VERIFIED',
                verifiedAt: new Date()
            });
            alert('Payment verified successfully!');
            setSelectedReg(null);
        } catch (error) {
            console.error('Error verifying payment:', error);
            alert('Failed to verify payment. Please try again.');
        } finally {
            setVerifying(false);
        }
    };

    const handleDeleteRegistration = async (regId: string) => {
        if (!confirm('WARNING: Are you sure you want to PERMANENTLY delete this registration? This action cannot be undone.')) return;

        try {
            const db = getFirestore(app);
            const regDocRef = doc(db, 'registrations', regId);
            const regSnapshot = await getDoc(regDocRef);

            if (regSnapshot.exists()) {
                const data = regSnapshot.data();
                if (data.tournamentId) {
                    await updateDoc(doc(db, 'tournaments', data.tournamentId), {
                        currentRegistrations: increment(-1)
                    });
                }
            }

            await deleteDoc(regDocRef);
            if (selectedReg?.id === regId) {
                setSelectedReg(null);
            }
        } catch (error) {
            console.error('Error deleting registration:', error);
            alert('Failed to delete registration. Please try again.');
        }
    };

    const exportToCSV = () => {
        // Assume maximum 6 players per team for static columns
        const maxPlayers = 6;
        const playerHeaders = [];
        for (let i = 1; i <= maxPlayers; i++) {
            playerHeaders.push(`Player ${i} Name`, `Player ${i} ID`);
        }

        const headers = [
            'Registered By Username', 'Registered By Email', 'Registered By Phone',
            'Team Name', 'IGL Name', 'IGL Contact',
            'Tournament Name', 'Tournament Game', 'College', 'Total Players',
            ...playerHeaders,
            'Payment Status', 'Payment Amount', 'Bank Name', 'Transaction ID',
            'UPI ID', 'Payment Date', 'Payment Time', 'QR Code Used', 'Registration Date & Time'
        ];

        const rows = filteredRegistrations.map(reg => {
            const playerCells = [];
            for (let i = 0; i < maxPlayers; i++) {
                playerCells.push(reg.playerNames?.[i] || 'N/A');
                playerCells.push(reg.playerIds?.[i] || 'N/A');
            }

            return [
                reg.username || 'N/A',
                reg.email || 'N/A',
                reg.phoneNumber || 'N/A',
                reg.teamName || 'N/A',
                reg.iglName || 'N/A',
                reg.iglContact || 'N/A',
                reg.tournament || 'N/A',
                reg.game || 'N/A',
                reg.college || 'N/A',
                reg.playerNames?.length || 0,
                ...playerCells,
                reg.paymentVerified ? 'VERIFIED' : (reg.paymentStatus || 'N/A'),
                reg.payment?.amount ? `Rs. ${reg.payment.amount}` : 'N/A',
                reg.payment?.bankName || 'N/A',
                reg.payment?.transactionId || 'N/A',
                reg.payment?.upiId || 'N/A',
                reg.payment?.paymentDate || 'N/A',
                reg.payment?.paymentTime || 'N/A',
                reg.qrIndex != null ? `QR${reg.qrIndex}` : 'N/A',
                (reg.createdAt ?? reg.registeredAt)?.toDate?.().toLocaleString() || 'N/A'
            ];
        });

        const csvContent = [headers, ...rows]
            .map(row => row.map(cell => `"${cell}"`).join(','))
            .join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `registrations_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
    };

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="animate-pulse h-24 bg-white/5 rounded-xl"></div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-orbitron font-bold text-white tracking-wider glow-text mb-2">
                        REGISTRATION MANAGEMENT
                    </h1>
                    <p className="text-gray-400">Real-time updates • {filteredRegistrations.length} registrations</p>
                </div>
                <button
                    onClick={exportToCSV}
                    className="flex items-center gap-2 px-4 py-2 bg-neon-green/20 text-neon-green border border-neon-green/50 rounded-lg hover:bg-neon-green/30 transition-colors"
                >
                    <RiDownloadLine /> Export CSV
                </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <GlowCard>
                    <div>
                        <p className="text-gray-400 text-sm uppercase mb-1">Total</p>
                        <h3 className="text-2xl font-bold text-white">{stats.total}</h3>
                    </div>
                </GlowCard>
                <GlowCard>
                    <div>
                        <p className="text-gray-400 text-sm uppercase mb-1">Verified</p>
                        <h3 className="text-2xl font-bold text-neon-green">{stats.verified}</h3>
                    </div>
                </GlowCard>
                <GlowCard>
                    <div>
                        <p className="text-gray-400 text-sm uppercase mb-1">Pending</p>
                        <h3 className="text-2xl font-bold text-yellow-400">{stats.pending}</h3>
                    </div>
                </GlowCard>
                <GlowCard>
                    <div>
                        <p className="text-gray-400 text-sm uppercase mb-1">Failed</p>
                        <h3 className="text-2xl font-bold text-red-400">{stats.failed}</h3>
                    </div>
                </GlowCard>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-4">
                <div className="flex-1 min-w-[200px]">
                    <div className="relative">
                        <RiSearchLine className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search by team, IGL, email, or phone..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-neon-green/50"
                        />
                    </div>
                </div>
                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-neon-green/50"
                >
                    <option value="all">All Status</option>
                    <option value="verified">Verified</option>
                    <option value="pending">Pending</option>
                    <option value="failed">Failed</option>
                </select>
            </div>

            {/* Registrations Table */}
            <div className="space-y-3">
                {filteredRegistrations.length === 0 ? (
                    <div className="text-center py-12 border border-white/10 rounded-xl bg-black/40 backdrop-blur-sm">
                        <p className="text-gray-500">No registrations found</p>
                    </div>
                ) : (
                    filteredRegistrations.map((reg, idx) => (
                        <GlowCard key={reg.id} delay={idx * 0.02} className="!p-4">
                            <div className="flex items-center justify-between flex-wrap gap-4">
                                <div className="flex items-center gap-4 flex-1">
                                    <div className="w-12 h-12 bg-white/5 border border-blue-400/30 rounded-lg flex items-center justify-center">
                                        <RiTeamLine className="text-blue-400 text-xl" />
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="text-white font-semibold">{reg.teamName}</h4>
                                        <div className="flex flex-wrap gap-3 text-sm text-gray-400 mt-1">
                                            <span>IGL: {reg.iglName}</span>
                                            <span>•</span>
                                            <span>{reg.iglContact}</span>
                                            <span>•</span>
                                            <span>{reg.email}</span>
                                        </div>
                                        <div className="flex flex-wrap gap-3 text-xs text-gray-500 mt-1">
                                            <span>{reg.tournament}</span>
                                            <span>•</span>
                                            <span>{reg.game}</span>
                                            {reg.college && (
                                                <>
                                                    <span>•</span>
                                                    <span>{reg.college}</span>
                                                </>
                                            )}
                                            <span>•</span>
                                            <span>{reg.playerNames?.length || 0} players</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    <span className={`px-3 py-1 text-xs font-bold rounded-full ${reg.paymentVerified
                                        ? 'bg-neon-green/20 text-neon-green border border-neon-green/50'
                                        : reg.paymentStatus === 'FAILED'
                                            ? 'bg-red-500/20 text-red-500 border border-red-500/50'
                                            : 'bg-yellow-500/20 text-yellow-500 border border-yellow-500/50'
                                        }`}>
                                        {reg.paymentVerified ? '🟢 VERIFIED' : reg.paymentStatus === 'FAILED' ? '🔴 FAILED' : '🟡 PENDING'}
                                    </span>
                                    <button
                                        onClick={() => setSelectedReg(reg)}
                                        className="p-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-colors"
                                        title="View Details"
                                    >
                                        <RiEyeLine className="text-white" />
                                    </button>
                                    <button
                                        onClick={() => handleDeleteRegistration(reg.id)}
                                        className="p-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-lg transition-colors group"
                                        title="Delete Registration"
                                    >
                                        <RiDeleteBinLine className="text-red-500 group-hover:text-red-400" />
                                    </button>
                                </div>
                            </div>
                        </GlowCard>
                    ))
                )}
            </div>

            {/* Details Modal */}
            {selectedReg && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                    onClick={() => setSelectedReg(null)}>
                    <div className="bg-gray-900 border border-white/20 rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
                        onClick={(e) => e.stopPropagation()}>
                        <div className="p-6 border-b border-white/10 flex items-center justify-between sticky top-0 bg-gray-900 z-10">
                            <h2 className="text-2xl font-orbitron font-bold text-white flex-1">Registration Details</h2>
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => handleDeleteRegistration(selectedReg.id)}
                                    className="px-3 py-1.5 bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/20 rounded-lg transition-colors flex items-center gap-2 text-sm font-semibold"
                                >
                                    <RiDeleteBinLine /> Delete
                                </button>
                                <button onClick={() => setSelectedReg(null)}
                                    className="text-gray-400 hover:text-white transition-colors p-1">
                                    <RiCloseLine className="text-2xl" />
                                </button>
                            </div>
                        </div>

                        <div className="p-6 space-y-6">
                            {/* Tournament & Team Info */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <h3 className="text-lg font-bold text-white mb-3">Tournament Information</h3>
                                    <div className="space-y-2 text-sm">
                                        <p className="text-gray-400">Tournament: <span className="text-white">{selectedReg.tournament}</span></p>
                                        <p className="text-gray-400">Game: <span className="text-white">{selectedReg.game}</span></p>
                                        {selectedReg.college && (
                                            <p className="text-gray-400">College: <span className="text-white">{selectedReg.college}</span></p>
                                        )}
                                        <p className="text-gray-400">Registered: <span className="text-white">
                                            {(selectedReg.createdAt ?? selectedReg.registeredAt)?.toDate?.().toLocaleString() || 'N/A'}
                                        </span></p>
                                    </div>
                                </div>

                                <div>
                                    <h3 className="text-lg font-bold text-white mb-3">Team Information</h3>
                                    <div className="space-y-2 text-sm">
                                        <p className="text-gray-400">Team: <span className="text-white font-semibold">{selectedReg.teamName}</span></p>
                                        <p className="text-gray-400">IGL: <span className="text-white">{selectedReg.iglName}</span></p>
                                        <p className="text-gray-400">Contact: <span className="text-white">{selectedReg.iglContact}</span></p>
                                        <p className="text-gray-400">Email: <span className="text-white">{selectedReg.email}</span></p>
                                    </div>
                                </div>
                            </div>

                            {/* Players */}
                            {selectedReg.playerNames && selectedReg.playerNames.length > 0 && (
                                <div>
                                    <h3 className="text-lg font-bold text-white mb-3">Team Roster ({selectedReg.playerCount} players)</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                        {selectedReg.playerNames.map((name, idx) => (
                                            <div key={idx} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                                                <span className="text-white">{name}</span>
                                                <span className="text-gray-400 text-sm">{selectedReg.playerIds?.[idx]}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Payment Details */}
                            <div>
                                <h3 className="text-lg font-bold text-white mb-3">Payment Information</h3>
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                                        <span className="text-gray-400">Status:</span>
                                        <span className={`px-3 py-1 rounded-full text-sm font-bold ${selectedReg.paymentVerified
                                            ? 'bg-neon-green/20 text-neon-green'
                                            : 'bg-yellow-500/20 text-yellow-500'
                                            }`}>
                                            {selectedReg.paymentVerified ? 'VERIFIED' : 'PENDING'}
                                        </span>
                                    </div>

                                    {selectedReg.payment && (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                                            <div className="p-3 bg-white/5 rounded-lg">
                                                <p className="text-gray-400 mb-1">Bank Name</p>
                                                <p className="text-white font-semibold">{selectedReg.payment.bankName || 'N/A'}</p>
                                            </div>
                                            <div className="p-3 bg-white/5 rounded-lg">
                                                <p className="text-gray-400 mb-1">Transaction ID</p>
                                                <p className="text-white font-semibold font-mono">{selectedReg.payment.transactionId}</p>
                                            </div>
                                            <div className="p-3 bg-white/5 rounded-lg">
                                                <p className="text-gray-400 mb-1">Amount</p>
                                                <p className="text-white font-semibold">{selectedReg.payment.amount ? `₹${selectedReg.payment.amount}` : 'N/A'}</p>
                                            </div>
                                            <div className="p-3 bg-white/5 rounded-lg">
                                                <p className="text-gray-400 mb-1">UPI ID</p>
                                                <p className="text-white font-semibold">{selectedReg.payment.upiId || 'N/A'}</p>
                                            </div>
                                            <div className="p-3 bg-white/5 rounded-lg">
                                                <p className="text-gray-400 mb-1">Payment Date</p>
                                                <p className="text-white font-semibold">{selectedReg.payment.paymentDate || 'N/A'}</p>
                                            </div>
                                            <div className="p-3 bg-white/5 rounded-lg">
                                                <p className="text-gray-400 mb-1">Payment Time</p>
                                                <p className="text-white font-semibold">{selectedReg.payment.paymentTime || 'N/A'}</p>
                                            </div>
                                        </div>
                                    )}

                                    {!selectedReg.paymentVerified && (
                                        <button
                                            onClick={() => handleVerifyPayment(selectedReg.id)}
                                            disabled={verifying}
                                            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-neon-green/20 text-neon-green border border-neon-green/50 rounded-lg hover:bg-neon-green/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
                                        >
                                            <RiCheckLine className="text-xl" />
                                            {verifying ? 'Verifying...' : 'Verify Payment'}
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
