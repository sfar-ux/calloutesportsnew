"use client";

import { motion } from "framer-motion";
import { useRealtimeCollection } from "@/hooks/useRealtimeCollection";
import { where } from "firebase/firestore";
import { Tournament } from "@/types";
import Link from "next/link";
import { NeonButton } from "@/components/ui/NeonButton";
import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/lib/auth-context";
import { RiTrophyLine, RiGamepadLine, RiTeamLine, RiHotelLine, RiTimerLine } from "react-icons/ri";
import Image from "next/image";
import { resolveImageUrl } from "@/lib/utils";

const GAMES = [
    { id: "bgmi", name: "BGMI", src: "/games/tiles/BGMI.jpeg", desc: "Battlegrounds Mobile India - The ultimate battle royale experience." },
    { id: "valorant", name: "Valorant", src: "/games/tiles/Valorant.png", desc: "A 5v5 character-based tactical shooter by Riot Games." },
    { id: "freefire", name: "Free Fire Max", src: "/games/tiles/FREEFIRE_MAX.png", desc: "Premium gameplay with Ultra HD resolutions and breathtaking effects." },
    { id: "cod", name: "Call of Duty Mobile", src: "/games/tiles/COD.png", desc: "Iconic multiplayer maps and modes anytime, anywhere." }
];

export default function PublicGamesPage() {
    const { user } = useAuth();
    const { data: allTournaments, loading } = useRealtimeCollection<Tournament>("tournaments", [
        where("status", "in", ["ACTIVE", "active"])
    ]);

    const [tournaments, setTournaments] = useState<Tournament[]>([]);

    useEffect(() => {
        if (allTournaments) {
            const sorted = [...allTournaments].sort((a, b) => {
                const dateA = a.createdAt ? (typeof a.createdAt.toMillis === 'function' ? a.createdAt.toMillis() : new Date(a.createdAt).getTime()) : 0;
                const dateB = b.createdAt ? (typeof b.createdAt.toMillis === 'function' ? b.createdAt.toMillis() : new Date(b.createdAt).getTime()) : 0;
                return dateB - dateA;
            });
            setTournaments(sorted);
        }
    }, [allTournaments]);

    const isDeadlinePassed = (deadline: any) => {
        if (!deadline) return false;
        const d = deadline.seconds ? new Date(deadline.seconds * 1000) : new Date(deadline);
        return d < new Date();
    };

    const formatDeadline = (deadline: any) => {
        if (!deadline) return 'No Deadline';
        const d = deadline.seconds ? new Date(deadline.seconds * 1000) : new Date(deadline);
        return d.toLocaleString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
    };

    return (
        <div className="min-h-screen bg-black pt-28 pb-16 relative overflow-hidden">
            {/* Background effects */}
            <div className="absolute inset-0 z-0 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-neon-green/5 blur-[120px] rounded-full mix-blend-screen" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-neon-green/5 blur-[120px] rounded-full mix-blend-screen" />
                <div className="absolute inset-0 bg-[linear-gradient(rgba(0,255,102,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,102,0.02)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_80%_80%_at_50%_50%,#000_70%,transparent_100%)] opacity-30" />
            </div>

            <div className="container mx-auto px-6 relative z-10">
                <div className="text-center mb-16 max-w-3xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="inline-block px-4 py-1 mb-6 rounded-full border border-neon-green/30 bg-neon-green/10"
                    >
                        <span className="text-neon-green font-mono text-xs uppercase tracking-widest font-bold flex items-center justify-center gap-2">
                            <RiGamepadLine className="text-lg" />
                            Supported Titles
                        </span>
                    </motion.div>

                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                        className="text-4xl md:text-6xl font-black font-orbitron tracking-widest text-white mb-6 uppercase drop-shadow-[0_0_15px_rgba(0,255,102,0.3)]"
                    >
                        OFFICIAL <span className="text-neon-green glow-text">GAMES</span>
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        className="text-gray-400 font-sans text-lg md:text-xl"
                    >
                        Explore the arenas we support. Find live events specific to your main games and dominate the leaderboards.
                    </motion.p>
                </div>

                <div className="space-y-20">
                    {GAMES.map((game, idx) => {
                        const gameTournaments = tournaments.filter(t => {
                            if (!t.supportedGames || t.supportedGames.length === 0) return true; // Show under all if no specific game is specified
                            return t.supportedGames.some((g: any) => {
                                const tName = g.name?.toLowerCase() || '';
                                const gName = game.name.toLowerCase();
                                return tName.includes(gName) || gName.includes(tName) || tName === 'all' || tName === 'any';
                            });
                        });

                        return (
                            <motion.div
                                key={game.id}
                                initial={{ opacity: 0, y: 40 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true, margin: "-100px" }}
                                transition={{ duration: 0.6 }}
                            >
                                <div className="flex flex-col md:flex-row gap-8 items-center mb-10 pb-6 border-b border-white/10">
                                    <div className="bg-white rounded-2xl w-48 h-24 flex justify-center items-center p-4 shadow-[0_4px_20px_rgba(255,255,255,0.05)] flex-shrink-0">
                                        <img src={game.src} alt={game.name} className="max-w-full max-h-full object-contain" />
                                    </div>
                                    <div>
                                        <h2 className="text-3xl font-orbitron font-bold text-white mb-2">{game.name}</h2>
                                        <p className="text-gray-400">{game.desc}</p>
                                    </div>
                                </div>

                                {loading ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                        {[1, 2].map((i) => (
                                            <div key={i} className="animate-pulse bg-white/5 border border-neon-green/10 h-80 rounded-2xl"></div>
                                        ))}
                                    </div>
                                ) : gameTournaments.length === 0 ? (
                                    <div className="text-center py-12 border border-neon-green/10 rounded-xl bg-neon-green/5 backdrop-blur-sm max-w-2xl mx-auto">
                                        <p className="text-gray-400 font-mono">NO ACTIVE TOURNAMENTS FOR {game.name.toUpperCase()}</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                        {gameTournaments.map((tourney, i) => (
                                            <motion.div
                                                key={tourney.id}
                                                initial={{ opacity: 0, scale: 0.95 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                transition={{ delay: i * 0.1, duration: 0.4 }}
                                                whileHover={{ y: -5, scale: 1.02 }}
                                                className="bg-glass backdrop-blur-xl border border-neon-green/20 rounded-2xl p-6 flex flex-col justify-between transition-all duration-300 hover:border-neon-green/50 hover:shadow-[0_10px_30px_-10px_rgba(0,255,102,0.3)] group relative overflow-hidden"
                                            >
                                                <div className="absolute inset-0 bg-gradient-to-tr from-neon-green/0 via-neon-green/5 to-neon-green/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>

                                                <div>
                                                    {/* Tournament Poster/Logo */}
                                                    {(tourney.posterUrl || tourney.logoUrl) && (
                                                        <div className="mb-6 rounded-xl overflow-hidden border border-white/10">
                                                            <img 
                                                                src={resolveImageUrl(tourney.posterUrl || tourney.logoUrl)} 
                                                                alt={tourney.name}
                                                                className="w-full h-48 object-cover"
                                                            />
                                                        </div>
                                                    )}

                                                    <div className="flex justify-between items-start mb-6">
                                                        <div className="flex flex-col gap-2">
                                                            <span className="w-fit text-xs font-mono font-bold text-black bg-neon-green py-1 px-3 rounded uppercase tracking-wide flex items-center gap-1 shadow-[0_0_10px_rgba(0,255,102,0.4)]">
                                                                <RiGamepadLine />
                                                                {tourney.supportedGames?.map((g: any) => g.name).join(', ') || "ESPORTS"}
                                                            </span>
                                                            {tourney.allowedColleges && tourney.allowedColleges.length > 0 ? (
                                                                <span className="w-fit text-xs font-mono font-bold text-black bg-yellow-400 py-1 px-3 rounded uppercase tracking-wide flex items-center gap-1 shadow-[0_0_10px_rgba(250,204,21,0.4)]">
                                                                    <RiHotelLine />
                                                                    {tourney.allowedColleges.map((c: any) => c.name).join(', ')}
                                                                </span>
                                                            ) : (
                                                                <span className="w-fit text-xs font-mono font-bold text-black bg-blue-400 py-1 px-3 rounded uppercase tracking-wide flex items-center gap-1 shadow-[0_0_10px_rgba(96,165,250,0.4)]">
                                                                    <RiHotelLine />
                                                                    Open to All Colleges
                                                                </span>
                                                            )}
                                                        </div>
                                                        <span className="text-xs font-mono bg-red-600/20 border border-red-500/50 text-red-500 font-bold py-1 px-3 rounded uppercase flex items-center gap-1.5 animate-pulse">
                                                            <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                                                            LIVE NOW
                                                        </span>
                                                    </div>

                                                    <h3 className="text-2xl font-orbitron font-bold text-white uppercase mb-8 group-hover:text-neon-green transition-colors leading-snug">
                                                        {tourney.name}
                                                    </h3>

                                                    <div className="space-y-4 mb-8 bg-black/40 border border-white/5 rounded-xl p-4">
                                                        <div className="flex justify-between items-center border-b border-white/5 pb-3">
                                                            <div className="flex items-center gap-2 text-gray-400 font-sans text-sm">
                                                                <RiTrophyLine className="text-neon-green" />
                                                                <span>Entry Fee</span>
                                                            </div>
                                                            <span className="text-neon-green font-bold font-mono text-xl drop-shadow-[0_0_5px_rgba(0,255,102,0.5)]">
                                                                {tourney.paymentAmount === 0 ? 'FREE' : `₹${tourney.paymentAmount}`}
                                                            </span>
                                                        </div>
                                                        <div className="flex justify-between items-center border-b border-white/5 pb-3">
                                                            <div className="flex items-center gap-2 text-gray-400 font-sans text-sm">
                                                                <RiTeamLine className="text-blue-400" />
                                                                <span>Slots Filled</span>
                                                            </div>
                                                            <span className="text-white font-mono font-semibold bg-white/10 px-2 py-0.5 rounded text-sm border border-white/10">
                                                                {tourney.currentRegistrations || 0} <span className="text-gray-500 mx-1">/</span> {tourney.maxSlots || "∞"}
                                                            </span>
                                                        </div>
                                                        <div className="flex justify-between items-center pt-1">
                                                            <div className="flex items-center gap-2 text-gray-400 font-sans text-sm">
                                                                <RiTimerLine className={isDeadlinePassed(tourney.registrationDeadline) ? "text-red-500" : "text-yellow-400"} />
                                                                <span>Deadline</span>
                                                            </div>
                                                            <span className={`font-mono text-xs font-bold ${isDeadlinePassed(tourney.registrationDeadline) ? "text-red-500" : "text-gray-300"}`}>
                                                                {formatDeadline(tourney.registrationDeadline)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="mt-auto relative z-10 block">
                                                    <Link href={isDeadlinePassed(tourney.registrationDeadline) ? "#" : (user ? "/dashboard/register" : "/login")}>
                                                        <button
                                                            disabled={isDeadlinePassed(tourney.registrationDeadline)}
                                                            className={`w-full font-orbitron font-bold py-3 px-4 rounded-lg transition-all duration-300 uppercase tracking-widest text-sm
                                                                ${isDeadlinePassed(tourney.registrationDeadline)
                                                                    ? "bg-red-500/10 border border-red-500/30 text-red-500 cursor-not-allowed"
                                                                    : "bg-white/5 border border-neon-green/30 text-neon-green hover:bg-neon-green hover:text-black hover:shadow-[0_0_15px_rgba(0,255,102,0.4)]"
                                                                }`}
                                                        >
                                                            {isDeadlinePassed(tourney.registrationDeadline)
                                                                ? "Registration Closed"
                                                                : (user ? "Join Tournament" : "Login to Register")
                                                            }
                                                        </button>
                                                    </Link>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                )}
                            </motion.div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
