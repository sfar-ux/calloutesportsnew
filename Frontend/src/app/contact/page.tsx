import { RiMailSendLine, RiTimeLine, RiMapPin2Fill } from "react-icons/ri";

export default function ContactPage() {
    return (
        <div className="min-h-screen bg-black pt-28 pb-16 relative overflow-hidden">
            {/* Background effects */}
            <div className="absolute inset-0 z-0 pointer-events-none">
                <div className="absolute top-[20%] right-[-10%] w-[500px] h-[500px] bg-neon-green/5 blur-[120px] rounded-full mix-blend-screen" />
                <div className="absolute inset-0 bg-[linear-gradient(rgba(0,255,102,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,102,0.02)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_0%,#000_70%,transparent_100%)] opacity-30" />
            </div>

            <div className="container mx-auto px-6 relative z-10 max-w-4xl">
                <div className="text-center mb-16">
                    <h1 className="text-4xl md:text-6xl font-black font-orbitron tracking-widest text-white mb-6 uppercase drop-shadow-[0_0_15px_rgba(0,255,102,0.3)]">
                        CONTACT <span className="text-neon-green glow-text">US</span>
                    </h1>
                    <p className="text-gray-400 font-sans text-lg md:text-xl max-w-2xl mx-auto">
                        We're here to help you dominate the arena. Reach out to our team for support, partnerships, or general inquiries.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Contact Channels */}
                    <div className="bg-glass backdrop-blur-xl border border-neon-green/20 rounded-2xl p-8 shadow-[0_4px_20px_rgba(0,255,102,0.05)]">
                        <h2 className="text-2xl font-orbitron font-bold text-white mb-8 border-b border-white/10 pb-4">Direct Lines</h2>

                        <div className="space-y-8 text-gray-300 font-sans">
                            <div className="flex flex-col sm:flex-row sm:items-center gap-4 group">
                                <div className="w-12 h-12 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-neon-green group-hover:bg-neon-green/10 transition-colors flex-shrink-0">
                                    <RiMailSendLine className="text-2xl" />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-xs uppercase tracking-wider text-gray-500 font-bold mb-1">Email Address</span>
                                    <a href="mailto:calloutesports@gmail.com" className="text-lg text-white font-mono hover:text-neon-green transition-colors">calloutesports@gmail.com</a>
                                </div>
                            </div>

                            <div className="flex flex-col sm:flex-row sm:items-center gap-4 group">
                                <div className="w-12 h-12 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-neon-green group-hover:bg-neon-green/10 transition-colors flex-shrink-0">
                                    <RiMapPin2Fill className="text-2xl" />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-xs uppercase tracking-wider text-gray-500 font-bold mb-1">Headquarters</span>
                                    <span className="text-lg text-white">India</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Operational Hours */}
                    <div className="bg-glass backdrop-blur-xl border border-neon-green/20 rounded-2xl p-8 shadow-[0_4px_20px_rgba(0,255,102,0.05)]">
                        <h2 className="text-2xl font-orbitron font-bold text-white mb-8 border-b border-white/10 pb-4">Operational Hours</h2>

                        <div className="flex flex-col gap-6">
                            <div className="flex items-start gap-4 p-4 bg-white/5 border border-white/10 rounded-xl">
                                <RiTimeLine className="text-neon-green text-3xl flex-shrink-0" />
                                <div className="w-full">
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="font-bold text-white font-sans uppercase tracking-wide">Mon - Fri</span>
                                        <span className="text-neon-green font-mono">10:00 AM - 08:00 PM</span>
                                    </div>
                                    <p className="text-xs text-gray-400">Indian Standard Time (IST)</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-4 p-4 bg-white/5 border border-white/10 rounded-xl">
                                <RiTimeLine className="text-neon-green text-3xl flex-shrink-0 opacity-80" />
                                <div className="w-full">
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="font-bold text-gray-300 font-sans uppercase tracking-wide">Saturday</span>
                                        <span className="text-blue-400 font-mono">10:00 AM - 06:00 PM</span>
                                    </div>
                                    <p className="text-xs text-gray-400">Indian Standard Time (IST)</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-4 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                                <RiTimeLine className="text-red-400 text-3xl flex-shrink-0" />
                                <div className="w-full">
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="font-bold text-red-500 font-sans uppercase tracking-wide">Sunday</span>
                                        <span className="text-red-400 font-mono font-bold">CLOSED</span>
                                    </div>
                                    <p className="text-xs text-gray-400">Emergency support only via Discord.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
